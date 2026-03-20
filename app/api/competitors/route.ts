// /api/competitors — Add and list competitors
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const PlatformSchema = z.enum(["tiktok", "instagram", "youtube", "facebook"]);

const ManualAddCompetitorSchema = z.object({
  platform: PlatformSchema,
  username: z.string().min(1).max(100),
});

const AutoPickCompetitorSchema = z.object({
  platform: PlatformSchema.default("tiktok"),
  auto_pick: z.literal(true),
  niche: z.string().min(2).max(100).optional(),
});

const AddCompetitorSchema = z.union([ManualAddCompetitorSchema, AutoPickCompetitorSchema]);

interface ResearchVideo {
  id?: string;
  like_count?: number;
  username?: string;
}

interface ResearchUserInfo {
  username: string;
  display_name: string | null;
  followers: number | null;
  niche: string | null;
}

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function getResearchAccessToken(): Promise<string> {
  const clientKey = process.env.TIKTOK_RESEARCH_CLIENT_KEY ?? process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_RESEARCH_CLIENT_SECRET ?? process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error("TikTok Research API credentials are not configured.");
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error("Failed to authenticate with TikTok Research API.");
  }

  const token = (raw?.data?.access_token as string | undefined) ?? (raw?.access_token as string | undefined);
  if (!token) {
    throw new Error("TikTok Research API did not return an access token.");
  }

  return token;
}

async function queryResearchVideos(
  accessToken: string,
  niche: string
): Promise<ResearchVideo[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - 30);

  const payload = {
    query: {
      and: [
        { operation: "EQ", field_name: "keyword", field_values: [niche] },
      ],
    },
    max_count: 100,
    cursor: 0,
    start_date: formatDateYYYYMMDD(startDate),
    end_date: formatDateYYYYMMDD(endDate),
    is_random: true,
  };

  const res = await fetch("https://open.tiktokapis.com/v2/research/video/query/?fields=id,like_count,username", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("TikTok Research API video query failed.");
  }

  const json = await res.json().catch(() => ({} as Record<string, unknown>));
  const videos = (json?.data?.videos as ResearchVideo[] | undefined) ?? [];
  return videos;
}

async function queryResearchUserInfo(
  accessToken: string,
  username: string
): Promise<ResearchUserInfo | null> {
  const res = await fetch(
    "https://open.tiktokapis.com/v2/research/user/info/?fields=display_name,bio_description,follower_count,username",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    }
  );

  if (!res.ok) return null;

  const json = await res.json().catch(() => null);
  const data = json?.data as {
    username?: string;
    display_name?: string;
    bio_description?: string;
    follower_count?: number;
  } | undefined;
  if (!data?.username) return null;

  return {
    username: data.username,
    display_name: data.display_name ?? null,
    followers: typeof data.follower_count === "number" ? data.follower_count : null,
    niche: data.bio_description ?? null,
  };
}

function pickRandomCandidateFromTop(videos: ResearchVideo[]): string | null {
  const ranked = videos
    .filter((v) => typeof v.username === "string" && v.username.length > 0)
    .sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));

  const unique = Array.from(new Set(ranked.map((v) => v.username as string)));
  if (unique.length === 0) return null;

  const topSlice = unique.slice(0, Math.min(10, unique.length));
  const randomIndex = Math.floor(Math.random() * topSlice.length);
  return topSlice[randomIndex] ?? null;
}

export async function POST(req: NextRequest) {
  try {
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
      .select("id, plan")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Enforce plan-based competitor limits
    const competitorLimits: Record<string, number> = {
      free: 0,
      starter: 0,
      pro: 3,
      agency: 50,
    };
    const limit = competitorLimits[dbUser.plan] ?? 0;

    if (limit === 0) {
      return NextResponse.json(
        { error: "Competitor tracking requires a Pro plan. Upgrade at /dashboard/settings." },
        { status: 403 }
      );
    }

    const { count: currentCount } = await serviceClient
      .from("competitors")
      .select("id", { count: "exact", head: true })
      .eq("user_id", dbUser.id);

    if ((currentCount ?? 0) >= limit) {
      return NextResponse.json(
        { error: `You've reached the ${limit} competitor limit for your ${dbUser.plan} plan.` },
        { status: 403 }
      );
    }

    let targetPlatform = parsed.data.platform;
    let targetUsername = "username" in parsed.data ? parsed.data.username : "";
    let suggested = false;
    let researchUser: ResearchUserInfo | null = null;

    if ("auto_pick" in parsed.data && parsed.data.auto_pick) {
      targetPlatform = "tiktok";

      const explicitNiche = parsed.data.niche?.trim();
      let detectedNiche = explicitNiche;
      if (!detectedNiche) {
        const { data: latestReport } = await serviceClient
          .from("analysis_reports")
          .select("detected_niche")
          .eq("user_id", dbUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        detectedNiche = latestReport?.detected_niche?.trim() ?? "";
      }

      if (!detectedNiche) {
        return NextResponse.json(
          { error: "Run at least one analysis first so we can infer your niche before auto-picking a competitor." },
          { status: 400 }
        );
      }

      const accessToken = await getResearchAccessToken();
      const videos = await queryResearchVideos(accessToken, detectedNiche);
      const candidate = pickRandomCandidateFromTop(videos);
      if (!candidate) {
        return NextResponse.json(
          { error: `No strong TikTok candidates found for niche "${detectedNiche}". Try a broader niche keyword.` },
          { status: 404 }
        );
      }

      // Avoid selecting an account the user already tracks.
      const { data: existingCompetitors } = await serviceClient
        .from("competitors")
        .select("username")
        .eq("user_id", dbUser.id)
        .eq("platform", "tiktok");
      const existingSet = new Set((existingCompetitors ?? []).map((row) => row.username.toLowerCase()));
      if (existingSet.has(candidate.toLowerCase())) {
        const fallback = Array.from(
          new Set(
            videos
              .map((v) => v.username)
              .filter((name): name is string => typeof name === "string" && name.length > 0)
              .filter((name) => !existingSet.has(name.toLowerCase()))
          )
        )[0];
        if (!fallback) {
          return NextResponse.json(
            { error: "All suggested competitors for this niche are already in your list." },
            { status: 409 }
          );
        }
        targetUsername = fallback;
      } else {
        targetUsername = candidate;
      }

      researchUser = await queryResearchUserInfo(accessToken, targetUsername);
      suggested = true;
    }

    // Fetch competitor data via Python service
    let competitorData: {
      platform_user_id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      followers: number | null;
      niche: string | null;
      avg_engagement_rate: number | null;
      posts_per_week: number | null;
      top_hashtags: string[];
      content_formats: string[];
    } = {
      platform_user_id: targetUsername,
      username: targetUsername,
      display_name: researchUser?.display_name ?? null,
      avatar_url: null,
      followers: researchUser?.followers ?? null,
      niche: researchUser?.niche ?? null,
      avg_engagement_rate: null,
      posts_per_week: null,
      top_hashtags: [],
      content_formats: [],
    };

    let scrapePartial = false;
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
            platform: targetPlatform,
            username: targetUsername,
          }),
        }
      );
      if (pyRes.ok) {
        const scraped = await pyRes.json() as Partial<typeof competitorData>;
        competitorData = {
          ...competitorData,
          ...scraped,
          username: targetUsername,
        };
        // Check if scraper returned meaningful data
        if (!scraped.followers && !scraped.display_name) {
          scrapePartial = true;
        }
      } else {
        console.error(`Scrape failed with status ${pyRes.status} for ${targetPlatform}/${targetUsername}`);
        scrapePartial = true;
      }
    } catch (err) {
      console.error(`Python service unavailable for scrape: ${err}`);
      scrapePartial = true;
    }

    const { data: competitor, error } = await serviceClient
      .from("competitors")
      .upsert({
        user_id: dbUser.id,
        platform: targetPlatform,
        platform_user_id: competitorData.platform_user_id,
        username: targetUsername,
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
      metadata: {
        platform: targetPlatform,
        username: targetUsername,
        suggested,
      },
    });

    return NextResponse.json(
      {
        data: competitor,
        scrapePartial,
        suggested,
        suggested_username: suggested ? targetUsername : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/competitors failed:", error);
    const message = error instanceof Error ? error.message : "Failed to add competitor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
