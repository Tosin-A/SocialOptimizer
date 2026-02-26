// GET /api/accounts — List user's connected accounts
import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ data: [] });

  const { data } = await serviceClient
    .from("connected_accounts")
    .select("id, platform, username, display_name, avatar_url, followers, is_active, last_synced_at")
    .eq("user_id", dbUser.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return NextResponse.json({ data: data ?? [] });
}
