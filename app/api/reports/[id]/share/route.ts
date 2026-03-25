import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { generateShareCaption } from "@/lib/share-captions";
import { z } from "zod";
import crypto from "crypto";

const BONUS_ANALYSES_PER_SHARE = 3;

function generateShareToken(): string {
  return crypto.randomBytes(6).toString("base64url").slice(0, 10);
}

// POST /api/reports/[id]/share — Create share + earn bonus analyses
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = getSupabaseServiceClient();

    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id, bonus_analyses, total_shares")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Verify user owns the report
    const { data: report } = await serviceClient
      .from("analysis_reports")
      .select("id, growth_score, detected_niche, fix_list, share_token")
      .eq("id", reportId)
      .eq("user_id", dbUser.id)
      .single();

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    // Check if already shared — return existing data, no double-reward
    const { data: existingShare } = await serviceClient
      .from("report_shares")
      .select("*")
      .eq("report_id", reportId)
      .eq("user_id", dbUser.id)
      .single();

    if (existingShare) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getclout.app";
      const publicUrl = `${baseUrl}/share/${existingShare.share_token}`;
      const fixList = report.fix_list as Array<{ problem: string; action: string }> | null;
      const topIssue = fixList?.[0]?.problem ?? "content strategy";

      return NextResponse.json({
        data: {
          share_token: existingShare.share_token,
          image_url: `${baseUrl}/api/reports/${reportId}/card?share_token=${existingShare.share_token}`,
          public_url: publicUrl,
          caption: generateShareCaption({
            score: report.growth_score,
            topIssue,
            publicUrl,
          }),
          already_shared: true,
        },
        error: null,
      });
    }

    // Generate new share
    const shareToken = generateShareToken();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getclout.app";
    const publicUrl = `${baseUrl}/share/${shareToken}`;
    const fixList = report.fix_list as Array<{ problem: string; action: string }> | null;
    const topIssue = fixList?.[0]?.problem ?? "content strategy";

    // Insert share record
    const { error: insertError } = await serviceClient
      .from("report_shares")
      .insert({
        report_id: reportId,
        user_id: dbUser.id,
        share_token: shareToken,
      });

    if (insertError) {
      return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
    }

    // Update report with share_token
    await serviceClient
      .from("analysis_reports")
      .update({ share_token: shareToken })
      .eq("id", reportId);

    // Credit bonus analyses and increment share count
    await serviceClient
      .from("users")
      .update({
        bonus_analyses: (dbUser.bonus_analyses ?? 0) + BONUS_ANALYSES_PER_SHARE,
        total_shares: (dbUser.total_shares ?? 0) + 1,
      })
      .eq("id", dbUser.id);

    return NextResponse.json({
      data: {
        share_token: shareToken,
        image_url: `${baseUrl}/api/reports/${reportId}/card?share_token=${shareToken}`,
        public_url: publicUrl,
        caption: generateShareCaption({
          score: report.growth_score,
          topIssue,
          publicUrl,
        }),
        already_shared: false,
        bonus_earned: BONUS_ANALYSES_PER_SHARE,
      },
      error: null,
    });
  } catch (err) {
    console.error("/api/reports/[id]/share POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/reports/[id]/share — Check if report has been shared
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = getSupabaseServiceClient();

    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data: share } = await serviceClient
      .from("report_shares")
      .select("*")
      .eq("report_id", reportId)
      .eq("user_id", dbUser.id)
      .single();

    if (!share) {
      return NextResponse.json({ data: null, error: null });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getclout.app";

    return NextResponse.json({
      data: {
        share_token: share.share_token,
        image_url: `${baseUrl}/api/reports/${reportId}/card?share_token=${share.share_token}`,
        public_url: `${baseUrl}/share/${share.share_token}`,
        created_at: share.created_at,
      },
      error: null,
    });
  } catch (err) {
    console.error("/api/reports/[id]/share GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
