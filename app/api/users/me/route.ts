// GET /api/users/me — Return current user's plan and usage from the DB
import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser, error } = await serviceClient
    .from("users")
    .select("plan, analyses_used, analyses_limit, stripe_customer_id")
    .eq("auth_id", user.id)
    .single();

  if (error || !dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    plan: dbUser.plan,
    analyses_used: dbUser.analyses_used,
    analyses_limit: dbUser.analyses_limit,
    has_billing: !!dbUser.stripe_customer_id,
  });
}
