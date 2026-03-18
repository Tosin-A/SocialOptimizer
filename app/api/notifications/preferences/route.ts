// GET/PATCH /api/notifications/preferences — email notification preferences
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

const PatchSchema = z.object({
  email_analysis_notifications: z.boolean().optional(),
  email_weekly_digest: z.boolean().optional(),
});

async function getDbUser() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id, email_analysis_notifications, email_weekly_digest")
    .eq("auth_id", user.id)
    .single();

  return dbUser;
}

export async function GET() {
  const dbUser = await getDbUser();
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    data: {
      email_analysis_notifications: dbUser.email_analysis_notifications ?? true,
      email_weekly_digest: dbUser.email_weekly_digest ?? true,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const dbUser = await getDbUser();
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates = parsed.data;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const serviceClient = getSupabaseServiceClient();
  const { error } = await serviceClient
    .from("users")
    .update(updates)
    .eq("id", dbUser.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      email_analysis_notifications: updates.email_analysis_notifications ?? dbUser.email_analysis_notifications ?? true,
      email_weekly_digest: updates.email_weekly_digest ?? dbUser.email_weekly_digest ?? true,
    },
  });
}
