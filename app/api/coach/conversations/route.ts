import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { PlanType, CoachConversation } from "@/types";
import { canAccess } from "@/lib/plans/feature-gate";

const CreateSchema = z.object({
  account_id: z.string().uuid().optional(),
});

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id, plan")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });
    }

    if (!canAccess(dbUser.plan as PlanType, "coach")) {
      return NextResponse.json({ data: null, error: "Coach requires Starter plan or above" }, { status: 403 });
    }

    const { data: conversations, error } = await serviceClient
      .from("coach_conversations")
      .select("*")
      .eq("user_id", dbUser.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: conversations as CoachConversation[], error: null });
  } catch (err) {
    console.error("/api/coach/conversations GET error:", err);
    return NextResponse.json({ data: null, error: "Failed to load conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.flatten() }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id, plan")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });
    }

    if (!canAccess(dbUser.plan as PlanType, "coach")) {
      return NextResponse.json({ data: null, error: "Coach requires Starter plan or above" }, { status: 403 });
    }

    const { data: conversation, error } = await serviceClient
      .from("coach_conversations")
      .insert({
        user_id: dbUser.id,
        account_id: parsed.data.account_id ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ data: null, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: conversation as CoachConversation, error: null }, { status: 201 });
  } catch (err) {
    console.error("/api/coach/conversations POST error:", err);
    return NextResponse.json({ data: null, error: "Failed to create conversation" }, { status: 500 });
  }
}
