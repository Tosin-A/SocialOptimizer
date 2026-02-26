// /api/competitors — Add and list competitors
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const AddCompetitorSchema = z.object({
  platform: z.enum(["tiktok", "instagram", "youtube", "facebook"]),
  username: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = AddCompetitorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch competitor data via Python service
  let competitorData: any = {
    platform_user_id: parsed.data.username,
    username: parsed.data.username,
    display_name: null,
    avatar_url: null,
    followers: null,
    niche: null,
    avg_engagement_rate: null,
    posts_per_week: null,
    top_hashtags: [],
    content_formats: [],
  };

  try {
    const pyRes = await fetch(
      `${process.env.PYTHON_SERVICE_URL}/scrape/profile`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Service-Secret": process.env.PYTHON_SERVICE_SECRET!,
        },
        body: JSON.stringify({
          platform: parsed.data.platform,
          username: parsed.data.username,
        }),
      }
    );
    if (pyRes.ok) {
      competitorData = { ...competitorData, ...(await pyRes.json()) };
    }
  } catch {
    // Python service unavailable — store with minimal data
  }

  const { data: competitor, error } = await serviceClient
    .from("competitors")
    .upsert({
      user_id: dbUser.id,
      platform: parsed.data.platform,
      platform_user_id: competitorData.platform_user_id,
      username: parsed.data.username,
      display_name: competitorData.display_name,
      avatar_url: competitorData.avatar_url,
      followers: competitorData.followers,
      niche: competitorData.niche,
      avg_engagement_rate: competitorData.avg_engagement_rate,
      posts_per_week: competitorData.posts_per_week,
      top_hashtags: competitorData.top_hashtags,
      content_formats: competitorData.content_formats,
      last_analyzed_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform,platform_user_id" })
    .select()
    .single();

  if (error) throw error;

  await serviceClient.from("usage_events").insert({
    user_id: dbUser.id,
    event_type: "competitor_added",
    metadata: { platform: parsed.data.platform, username: parsed.data.username },
  });

  return NextResponse.json({ data: competitor }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let query = serviceClient
    .from("competitors")
    .select("*")
    .eq("user_id", dbUser.id)
    .order("followers", { ascending: false });

  if (platform) query = query.eq("platform", platform);

  const { data, error } = await query;
  if (error) throw error;

  return NextResponse.json({ data: data ?? [] });
}
