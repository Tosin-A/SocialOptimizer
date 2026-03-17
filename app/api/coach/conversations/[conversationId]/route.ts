import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { CoachConversation, CoachMessageRow } from "@/types";

const PatchSchema = z.object({
  title: z.string().min(1).max(200),
});

async function getAuthenticatedUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  return dbUser ? { authId: user.id, dbId: dbUser.id as string } : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = getSupabaseServiceClient();

    const { data: conversation, error: convError } = await serviceClient
      .from("coach_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.dbId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ data: null, error: "Conversation not found" }, { status: 404 });
    }

    const { data: messages, error: msgError } = await serviceClient
      .from("coach_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (msgError) {
      return NextResponse.json({ data: null, error: msgError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        conversation: conversation as CoachConversation,
        messages: (messages ?? []) as CoachMessageRow[],
      },
      error: null,
    });
  } catch (err) {
    console.error("/api/coach/conversations/[id] GET error:", err);
    return NextResponse.json({ data: null, error: "Failed to load conversation" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten() }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data: conversation, error } = await serviceClient
      .from("coach_conversations")
      .update({ title: parsed.data.title })
      .eq("id", conversationId)
      .eq("user_id", user.dbId)
      .select("*")
      .single();

    if (error || !conversation) {
      return NextResponse.json({ data: null, error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ data: conversation as CoachConversation, error: null });
  } catch (err) {
    console.error("/api/coach/conversations/[id] PATCH error:", err);
    return NextResponse.json({ data: null, error: "Failed to rename conversation" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { error } = await serviceClient
      .from("coach_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("user_id", user.dbId);

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { deleted: true }, error: null });
  } catch (err) {
    console.error("/api/coach/conversations/[id] DELETE error:", err);
    return NextResponse.json({ data: null, error: "Failed to delete conversation" }, { status: 500 });
  }
}
