// POST /api/competitors/[id]/refresh
// Re-scrapes public profile data for an existing competitor.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: competitorId } = await params;
  const serviceClient = getSupabaseServiceClient();

  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Load competitor — must belong to this user
  const { data: competitor } = await serviceClient
    .from("competitors")
    .select("*")
    .eq("id", competitorId)
    .eq("user_id", dbUser.id)
    .single();

  if (!competitor) {
    return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
  }

  // Re-scrape via Python service
  let scraped: Record<string, unknown> = {};
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
          platform: competitor.platform,
          username: competitor.username,
        }),
      }
    );
    if (!pyRes.ok) {
      return NextResponse.json(
        { error: "Scraper returned an error. Try again later." },
        { status: 502 }
      );
    }
    scraped = await pyRes.json();
  } catch {
    return NextResponse.json(
      { error: "Scraper is unreachable. Make sure the Python service is running." },
      { status: 502 }
    );
  }

  // Build update payload — only override fields the scraper actually returned
  const updatePayload: Record<string, unknown> = {
    last_analyzed_at: new Date().toISOString(),
  };
  if (scraped.display_name) updatePayload.display_name = scraped.display_name;
  if (scraped.avatar_url) updatePayload.avatar_url = scraped.avatar_url;
  if (scraped.followers != null) updatePayload.followers = scraped.followers;
  if (scraped.niche) updatePayload.niche = scraped.niche;
  if (scraped.avg_engagement_rate != null) updatePayload.avg_engagement_rate = scraped.avg_engagement_rate;
  if (scraped.posts_per_week != null) updatePayload.posts_per_week = scraped.posts_per_week;
  if (Array.isArray(scraped.top_hashtags) && (scraped.top_hashtags as string[]).length > 0) {
    updatePayload.top_hashtags = scraped.top_hashtags;
  }
  if (Array.isArray(scraped.content_formats) && (scraped.content_formats as string[]).length > 0) {
    updatePayload.content_formats = scraped.content_formats;
  }

  const { error } = await serviceClient
    .from("competitors")
    .update(updatePayload)
    .eq("id", competitorId);

  if (error) {
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }

  // Re-fetch the full row to return consistent data
  const { data: updated } = await serviceClient
    .from("competitors")
    .select("*")
    .eq("id", competitorId)
    .single();

  return NextResponse.json({ data: updated });
}
