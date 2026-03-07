import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ApiResponse, ScoreAnnotation } from "@/types";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<ScoreAnnotation[]>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase.from("users").select("id").eq("auth_id", user.id).single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  const { data } = await supabase
    .from("score_annotations")
    .select("*")
    .eq("user_id", userData.id)
    .order("date", { ascending: false })
    .limit(50);

  return NextResponse.json({ data: data ?? [], error: null });
}
