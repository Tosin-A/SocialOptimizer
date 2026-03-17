import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { coachChat } from "@/lib/ai/claude";
import { generateIdeas } from "@/lib/ai/openai";
import { buildAnalysisContext } from "@/lib/ai/analysisContext";
import { z } from "zod";
import type { AnalysisReport, PlanType } from "@/types";
import { canAccess } from "@/lib/plans/feature-gate";

const CoachSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(2000),
    })
  ).min(1).max(50),
  account_id: z.string().uuid().optional(),
  provider: z.enum(["claude", "openai"]).default("claude"),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CoachSchema.safeParse(body);
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
      return NextResponse.json(
        { data: null, error: "Content Coach requires Starter plan or above" },
        { status: 403 }
      );
    }

    const { messages, account_id, provider } = parsed.data;

    // OpenAI ideas mode — uses report data when available but doesn't require it
    if (provider === "openai") {
      let platform: string | undefined;

      // Fetch the full report if available (same query as Claude mode)
      let openaiReportQuery = serviceClient
        .from("analysis_reports")
        .select("*")
        .eq("user_id", dbUser.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (account_id) {
        openaiReportQuery = openaiReportQuery.eq("account_id", account_id);
      }

      const { data: openaiReports } = await openaiReportQuery;
      const openaiReport = openaiReports?.[0] as AnalysisReport | undefined;

      const niche = openaiReport?.detected_niche;
      const analysisContext = openaiReport ? buildAnalysisContext(openaiReport) : undefined;

      // Try to get platform from the selected account
      if (account_id) {
        const { data: account } = await serviceClient
          .from("connected_accounts")
          .select("platform")
          .eq("id", account_id)
          .single();
        platform = account?.platform;
      }

      const brandPillars = (dbUser.brand_pillars as string[] | null) ?? [];

      const reply = await generateIdeas(
        messages.map((m) => ({ role: m.role, content: m.content })),
        niche,
        platform,
        brandPillars,
        analysisContext
      );

      return NextResponse.json({ data: { reply, provider: "openai" }, error: null });
    }

    // Claude coach mode — uses analysis report when available
    let reportQuery = serviceClient
      .from("analysis_reports")
      .select("*")
      .eq("user_id", dbUser.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (account_id) {
      reportQuery = reportQuery.eq("account_id", account_id);
    }

    const { data: reports } = await reportQuery;
    const report = reports?.[0] as AnalysisReport | undefined;

    const analysisContext = report ? buildAnalysisContext(report) : undefined;
    const reply = await coachChat(messages.map((m) => ({ role: m.role, content: m.content })), analysisContext);

    return NextResponse.json({ data: { reply, provider: "claude" }, error: null });
  } catch (err) {
    console.error("/api/coach error:", err);
    return NextResponse.json(
      { data: null, error: "Coach response failed" },
      { status: 500 }
    );
  }
}
