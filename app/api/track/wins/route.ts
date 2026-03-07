import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ApiResponse, WinLibraryEntry } from "@/types";

const CreateSchema = z.object({
  outlier_post_id: z.string().uuid().optional(),
  source: z.string().max(100),
  platform: z.enum(["tiktok", "instagram", "youtube", "facebook"]),
  tag: z.string().max(100),
  notes: z.string().max(1000),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<WinLibraryEntry[]>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const { data } = await supabase
    .from("win_library")
    .select("*")
    .eq("user_id", userData.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: data ?? [], error: null });
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<WinLibraryEntry>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ data: null, error: "Invalid input" }, { status: 400 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("win_library")
    .insert({
      user_id: userData.id,
      outlier_post_id: parsed.data.outlier_post_id ?? null,
      source: parsed.data.source,
      platform: parsed.data.platform,
      tag: parsed.data.tag,
      notes: parsed.data.notes,
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

  await supabase.from("win_library").delete().eq("id", id).eq("user_id", userData.id);
  return NextResponse.json({ data: null, error: null });
}
