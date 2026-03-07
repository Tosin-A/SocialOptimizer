import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { calcPostingTimeRecommendations } from "@/lib/analysis/posting-time";
import type { ApiResponse, PostingTimeRecommendation } from "@/types";

const querySchema = z.object({
  account_id: z.string().uuid(),
});

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<PostingTimeRecommendation[]>>> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });

  const parsed = querySchema.safeParse({
    account_id: req.nextUrl.searchParams.get("account_id"),
  });
  if (!parsed.success) return NextResponse.json({ data: null, error: "account_id required" }, { status: 400 });

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!userData) return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });

  // Verify account ownership
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("id")
    .eq("id", parsed.data.account_id)
    .eq("user_id", userData.id)
    .single();
  if (!account) return NextResponse.json({ data: null, error: "Account not found" }, { status: 404 });

  const { data: posts } = await supabase
    .from("posts")
    .select("posted_at, engagement_rate")
    .eq("account_id", parsed.data.account_id)
    .order("posted_at", { ascending: false })
    .limit(200);

  if (!posts?.length) return NextResponse.json({ data: [], error: null });

  const recommendations = calcPostingTimeRecommendations(posts as any);

  return NextResponse.json({ data: recommendations, error: null });
}
