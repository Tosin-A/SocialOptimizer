import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ApiResponse, SavedIdea } from "@/types";

const CreateSchema = z.object({
  content: z.string().min(1).max(10000),
  provider: z.enum(["claude", "openai"]),
  platform: z.string().max(50).optional(),
  niche: z.string().max(100).optional(),
  source_prompt: z.string().max(2000).optional(),
});

export async function GET(): Promise<NextResponse<ApiResponse<SavedIdea[]>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const { data } = await supabase
    .from("saved_ideas")
    .select("*")
    .eq("user_id", userData.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: data ?? [], error: null });
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<SavedIdea>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ data: null, error: "Invalid input" }, { status: 400 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("saved_ideas")
    .insert({
      user_id: userData.id,
      content: parsed.data.content,
      provider: parsed.data.provider,
      platform: parsed.data.platform ?? null,
      niche: parsed.data.niche ?? null,
      source_prompt: parsed.data.source_prompt ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ data: null, error: "id required" }, { status: 400 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  await supabase.from("saved_ideas").delete().eq("id", id).eq("user_id", userData.id);
  return NextResponse.json({ data: null, error: null });
}
