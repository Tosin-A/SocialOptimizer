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

export async function PUT(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
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
