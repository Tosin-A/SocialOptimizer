// GET  /api/creator-program — own application status + referral stats
// POST /api/creator-program — submit an application
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { sendCreatorApplicationConfirmation } from "@/lib/email";

const ApplySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  tiktok_handle: z.string().max(60).optional(),
  instagram_handle: z.string().max(60).optional(),
  youtube_handle: z.string().max(120).optional(),
  followers_est: z.number().int().min(0).max(100_000_000).optional(),
  content_pitch: z.string().min(10).max(1000),
});

// ── GET — application status + stats for the logged-in user ──────────────────
export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = getSupabaseServiceClient();
  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: app } = await service
    .from("creator_applications")
    .select("id, status, referral_code, total_earnings, paid_out, created_at")
    .eq("user_id", dbUser.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!app) return NextResponse.json({ data: null });

  // Fetch conversion count for approved creators
  let conversions = 0;
  if (app.status === "approved" && app.referral_code) {
    const { count } = await service
      .from("referral_conversions")
      .select("id", { count: "exact", head: true })
      .eq("creator_application_id", app.id);
    conversions = count ?? 0;
  }

  return NextResponse.json({
    data: {
      status: app.status,
      referral_code: app.referral_code,
      total_earnings: app.total_earnings,
      paid_out: app.paid_out,
      pending_payout: Math.max(0, Number(app.total_earnings) - Number(app.paid_out)),
      conversions,
      created_at: app.created_at,
    },
  });
}

// ── POST — submit application ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ApplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, tiktok_handle, instagram_handle, youtube_handle, followers_est, content_pitch } = parsed.data;

  // Require at least one handle
  if (!tiktok_handle && !instagram_handle && !youtube_handle) {
    return NextResponse.json(
      { error: "Provide at least one social handle (TikTok, Instagram, or YouTube)." },
      { status: 400 }
    );
  }

  const service = getSupabaseServiceClient();

  // Resolve user_id if logged in
  let userId: string | null = null;
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: dbUser } = await service
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();
      if (dbUser) userId = dbUser.id;
    }
  } catch {
    // Not logged in — that's fine
  }

  // Prevent duplicate applications from the same email
  const { data: existing } = await service
    .from("creator_applications")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An application with this email already exists.", status: existing.status },
      { status: 409 }
    );
  }

  const { data: newApp, error } = await service
    .from("creator_applications")
    .insert({
      user_id: userId,
      email,
      name,
      tiktok_handle: tiktok_handle || null,
      instagram_handle: instagram_handle || null,
      youtube_handle: youtube_handle || null,
      followers_est: followers_est ?? null,
      content_pitch,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !newApp) {
    console.error("[creator-program] insert error:", error);
    return NextResponse.json({ error: "Failed to submit application." }, { status: 500 });
  }

  // Send confirmation email (best-effort)
  try {
    await sendCreatorApplicationConfirmation({ to: email, name });
  } catch (e) {
    console.error("[creator-program] confirmation email failed:", e);
  }

  return NextResponse.json({ data: { status: "pending" } }, { status: 201 });
}
