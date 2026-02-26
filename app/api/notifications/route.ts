// GET /api/notifications — Recent activity feed for the current user
import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
}

function formatEvent(event: { id: string; event_type: string; metadata: any; created_at: string }): Notification {
  const meta = event.metadata ?? {};
  switch (event.event_type) {
    case "analysis_completed":
      return {
        id: event.id,
        type: "analysis",
        title: "Analysis complete",
        body: meta.platform && meta.username
          ? `${meta.platform} @${meta.username} — score: ${meta.growth_score ?? "–"}`
          : "Your account analysis finished.",
        created_at: event.created_at,
      };
    case "content_generated":
      return {
        id: event.id,
        type: "generate",
        title: "Content generated",
        body: meta.platform && meta.content_type
          ? `${meta.content_type.replace("_", " ")} for ${meta.platform}`
          : "New content created.",
        created_at: event.created_at,
      };
    case "plan_upgraded":
      return {
        id: event.id,
        type: "billing",
        title: "Plan upgraded",
        body: meta.plan ? `You're now on the ${meta.plan} plan.` : "Your plan was updated.",
        created_at: event.created_at,
      };
    case "weekly_digest_sent":
      return {
        id: event.id,
        type: "email",
        title: "Weekly digest sent",
        body: "Your weekly performance summary was emailed.",
        created_at: event.created_at,
      };
    case "competitor_compared":
      return {
        id: event.id,
        type: "competitor",
        title: "Competitor compared",
        body: meta.username ? `Gap analysis for @${meta.username} complete.` : "Competitor comparison done.",
        created_at: event.created_at,
      };
    default:
      return {
        id: event.id,
        type: "info",
        title: "Activity",
        body: event.event_type.replace(/_/g, " "),
        created_at: event.created_at,
      };
  }
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = getSupabaseServiceClient();
  const { data: dbUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: events } = await serviceClient
    .from("usage_events")
    .select("id, event_type, metadata, created_at")
    .eq("user_id", dbUser.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const notifications = (events ?? []).map(formatEvent);

  return NextResponse.json({ data: notifications, total: notifications.length });
}
