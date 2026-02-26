// GET /api/accounts — List user's connected accounts
// DELETE /api/accounts?id=<accountId> — Disconnect an account
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("id");
  if (!accountId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete: set is_active=false so historical reports are preserved
  const { error } = await serviceClient
    .from("connected_accounts")
    .update({ is_active: false })
    .eq("id", accountId)
    .eq("user_id", dbUser.id);

  if (error) return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
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
