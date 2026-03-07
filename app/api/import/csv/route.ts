import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseImport, detectFormat } from "@/lib/import/csv-parser";
import type { ApiResponse, CSVImportResult, Platform } from "@/types";

const VALID_PLATFORMS: Platform[] = ["tiktok", "instagram", "youtube", "facebook"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (JSON/TXT exports can be larger)
const ACCEPTED_EXTENSIONS = [".csv", ".json", ".txt"];

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<CSVImportResult>>> {
  // Auth check
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ data: null, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const platform = formData.get("platform") as string | null;
    const username = formData.get("username") as string | null;

    // Validate
    if (!file) {
      return NextResponse.json({ data: null, error: "No file provided" }, { status: 400 });
    }
    if (!platform || !VALID_PLATFORMS.includes(platform as Platform)) {
      return NextResponse.json({ data: null, error: "Invalid platform. Must be one of: tiktok, instagram, youtube, facebook" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ data: null, error: "File too large. Max 10MB." }, { status: 400 });
    }

    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ data: null, error: "Accepted formats: .csv, .json, .txt" }, { status: 400 });
    }

    // Get user record
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ data: null, error: "User not found" }, { status: 404 });
    }

    const fileText = await file.text();
    const format = detectFormat(file.name);
    const { posts, errors, extractedUsername } = parseImport(fileText, platform as Platform, format);

    if (posts.length === 0) {
      return NextResponse.json({
        data: null,
        error: `No posts could be parsed from this ${format.toUpperCase()} file. ${errors.length > 0 ? `Errors: ${errors.slice(0, 3).join("; ")}` : "Check the file matches expected format."}`,
      }, { status: 400 });
    }

    const resolvedUsername =
      (username?.trim() || extractedUsername || `imported_${platform}`).toLowerCase().replace(/^@/, "");

    // Upsert connected account (import)
    // Note: access_token/refresh_token are required by schema; use placeholders for CSV imports
    const { data: account, error: accountError } = await supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: userData.id,
          platform: platform as Platform,
          platform_user_id: `csv_${resolvedUsername}`,
          username: resolvedUsername,
          display_name: resolvedUsername,
          is_active: true,
          access_token: "csv_import",
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform,platform_user_id" }
      )
      .select()
      .single();

    if (accountError) {
      return NextResponse.json({ data: null, error: `Failed to create account: ${accountError.message}` }, { status: 500 });
    }

    // Upsert posts
    let imported = 0;
    let skipped = 0;

    for (const post of posts) {
      const { error: postError } = await supabase
        .from("posts")
        .upsert(
          {
            account_id: account.id,
            platform_post_id: post.platform_post_id,
            content_type: post.content_type,
            caption: post.caption,
            hashtags: post.hashtags,
            mentions: [],
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            saves: post.saves,
            views: post.views,
            reach: post.reach,
            engagement_rate: post.engagement_rate,
            posted_at: post.posted_at,
            duration_seconds: post.duration_seconds,
          },
          { onConflict: "account_id,platform_post_id" }
        );

      if (postError) {
        skipped++;
        errors.push(`Post ${post.platform_post_id}: ${postError.message}`);
      } else {
        imported++;
      }
    }

    return NextResponse.json({
      data: {
        posts_imported: imported,
        posts_skipped: skipped,
        errors: errors.slice(0, 10),
        account_id: account.id,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({
      data: null,
      error: err instanceof Error ? err.message : "Import failed",
    }, { status: 500 });
  }
}
