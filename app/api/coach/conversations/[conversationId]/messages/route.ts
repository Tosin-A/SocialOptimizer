import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { coachChat } from "@/lib/ai/claude";
import { generateIdeas } from "@/lib/ai/openai";
import { buildAnalysisContext } from "@/lib/ai/analysisContext";
import { z } from "zod";
import type { AnalysisReport, PlanType, CoachMessageRow } from "@/types";
import { canAccess, getFeatureAccess } from "@/lib/plans/feature-gate";

const MessageSchema = z.object({
  content: z.string().min(1).max(2000),
  provider: z.enum(["claude", "openai"]).default("claude"),
});

const MAX_MESSAGES_PER_CONVERSATION = 100;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = MessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten() }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id, plan, brand_pillars")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });
    }

    if (!canAccess(dbUser.plan as PlanType, "coach")) {
      return NextResponse.json({ data: null, error: "Coach requires Starter plan or above" }, { status: 403 });
    }

    // Check monthly message limit
    const access = getFeatureAccess(dbUser.plan as PlanType);
    if (access.coach_messages_per_month !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: userConversations } = await serviceClient
        .from("coach_conversations")
        .select("id")
        .eq("user_id", dbUser.id);

      const conversationIds = userConversations?.map((c: { id: string }) => c.id) ?? [];

      if (conversationIds.length > 0) {
        const { count } = await serviceClient
          .from("coach_messages")
          .select("id", { count: "exact", head: true })
          .eq("role", "user")
          .in("conversation_id", conversationIds)
          .gte("created_at", startOfMonth.toISOString());

        if ((count ?? 0) >= access.coach_messages_per_month) {
          return NextResponse.json(
            { data: null, error: `Monthly coach message limit reached (${access.coach_messages_per_month}). Upgrade your plan for more.` },
            { status: 402 }
          );
        }
      }
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await serviceClient
      .from("coach_conversations")
      .select("id, account_id, title")
      .eq("id", conversationId)
      .eq("user_id", dbUser.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ data: null, error: "Conversation not found" }, { status: 404 });
    }

    // Check message count
    const { count } = await serviceClient
      .from("coach_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    if ((count ?? 0) >= MAX_MESSAGES_PER_CONVERSATION) {
      return NextResponse.json(
        { data: null, error: `Conversation limit reached (${MAX_MESSAGES_PER_CONVERSATION} messages). Start a new conversation.` },
        { status: 400 }
      );
    }

    const { content, provider } = parsed.data;

    // Insert user message
    const { data: userMsg, error: userMsgError } = await serviceClient
      .from("coach_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content,
        provider,
      })
      .select("*")
      .single();

    if (userMsgError) {
      return NextResponse.json({ data: null, error: userMsgError.message }, { status: 500 });
    }

    // Load full history for context
    const { data: history } = await serviceClient
      .from("coach_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    const chatHistory = (history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Fetch latest analysis report for context
    const accountId = conversation.account_id;
    let reportQuery = serviceClient
      .from("analysis_reports")
      .select("*")
      .eq("user_id", dbUser.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (accountId) {
      reportQuery = reportQuery.eq("account_id", accountId);
    }

    const { data: reports } = await reportQuery;
    const report = reports?.[0] as AnalysisReport | undefined;
    const analysisContext = report ? buildAnalysisContext(report) : undefined;

    // Call AI
    let reply: string;

    if (provider === "openai") {
      let platform: string | undefined;
      if (accountId) {
        const { data: account } = await serviceClient
          .from("connected_accounts")
          .select("platform")
          .eq("id", accountId)
          .single();
        platform = account?.platform;
      }
      const brandPillars = (dbUser.brand_pillars as string[] | null) ?? [];
      reply = await generateIdeas(chatHistory, report?.detected_niche, platform, brandPillars, analysisContext);
    } else {
      reply = await coachChat(chatHistory, analysisContext);
    }

    // Insert assistant message
    const { data: assistantMsg, error: assistantMsgError } = await serviceClient
      .from("coach_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: reply,
        provider,
      })
      .select("*")
      .single();

    if (assistantMsgError) {
      return NextResponse.json({ data: null, error: assistantMsgError.message }, { status: 500 });
    }

    // Auto-title on first exchange (conversation still has default title)
    let newTitle: string | null = null;
    if (conversation.title === "New conversation") {
      newTitle = content.length > 60 ? content.slice(0, 57) + "..." : content;
      await serviceClient
        .from("coach_conversations")
        .update({ title: newTitle })
        .eq("id", conversationId);
    }

    // Touch updated_at
    await serviceClient
      .from("coach_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json({
      data: {
        userMessage: userMsg as CoachMessageRow,
        assistantMessage: assistantMsg as CoachMessageRow,
        title: newTitle,
      },
      error: null,
    });
  } catch (err) {
    console.error("/api/coach/conversations/[id]/messages POST error:", err);
    return NextResponse.json({ data: null, error: "Coach response failed" }, { status: 500 });
  }
}
