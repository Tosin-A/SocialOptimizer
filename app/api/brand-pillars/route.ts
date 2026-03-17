// GET/PUT /api/brand-pillars — Read and update user brand pillars
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const BrandPillarsSchema = z
  .array(z.string().min(2).max(50))
  .min(1)
  .max(5);

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser, error } = await serviceClient
    .from("users")
    .select("brand_pillars")
    .eq("auth_id", user.id)
    .single();

  if (error || !dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ data: dbUser.brand_pillars ?? [] });
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s)\w/g, (c) => c.toUpperCase());
}

export async function PUT(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // ── Sync action: aggregate pillars from all completed analyses ─────────
  if (body.action === "sync") {
    const serviceClient = getSupabaseServiceClient();

    const { data: dbUser } = await serviceClient
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all completed reports for accounts owned by this user
    const { data: accounts } = await serviceClient
      .from("connected_accounts")
      .select("id")
      .eq("user_id", dbUser.id);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: "No connected accounts" }, { status: 400 });
    }

    const accountIds = accounts.map((a: { id: string }) => a.id);
    const { data: reports } = await serviceClient
      .from("analysis_reports")
      .select("detected_niche, content_themes")
      .in("account_id", accountIds)
      .eq("status", "completed");

    if (!reports || reports.length === 0) {
      return NextResponse.json(
        { error: "No completed analyses found. Run at least one analysis first." },
        { status: 400 }
      );
    }

    // Count theme frequency — niche gets double weight
    const freq = new Map<string, number>();
    for (const r of reports) {
      if (r.detected_niche) {
        const key = r.detected_niche.toLowerCase();
        freq.set(key, (freq.get(key) ?? 0) + 2);
      }
      const themes: string[] = r.content_themes ?? [];
      for (const t of themes) {
        const key = t.toLowerCase();
        freq.set(key, (freq.get(key) ?? 0) + 1);
      }
    }

    // Rank by frequency, take top 5, title-case
    const ranked = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => toTitleCase(theme));

    const { error } = await serviceClient
      .from("users")
      .update({ brand_pillars: ranked })
      .eq("auth_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to sync brand pillars" }, { status: 500 });
    }

    return NextResponse.json({ data: ranked });
  }

  // ── Manual update: existing behavior ──────────────────────────────────
  const parsed = BrandPillarsSchema.safeParse(body.pillars);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide 1-5 pillars, each 2-50 characters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const serviceClient = getSupabaseServiceClient();
  const { error } = await serviceClient
    .from("users")
    .update({ brand_pillars: parsed.data })
    .eq("auth_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update brand pillars" }, { status: 500 });
  }

  return NextResponse.json({ data: parsed.data });
}
