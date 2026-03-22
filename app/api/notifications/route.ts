// GET /api/notifications — Recent activity feed for the current user
import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  created_at: string;
}

interface UsageEvent {
  id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function getMetadataString(meta: Record<string, unknown>, key: string): string | null {
  const value = meta[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function formatEvent(event: UsageEvent): Notification {
  const meta = event.metadata ?? {};
  const platform = getMetadataString(meta, "platform");
  const username = getMetadataString(meta, "username");
  const reportId = getMetadataString(meta, "report_id");
  const contentType = getMetadataString(meta, "content_type");
  const plan = getMetadataString(meta, "plan");

  switch (event.event_type) {
    case "analysis_run":
      return {
        id: event.id,
        type: "analysis",
        title: "Analysis started",
        body: platform ? `${platform} analysis in progress.` : "Analysis in progress.",
        link: "/dashboard/analyze",
        created_at: event.created_at,
      };
    case "analysis_completed":
    case "analysis_ready":
      return {
        id: event.id,
        type: "analysis",
        title: "Analysis complete",
        body: platform && username
          ? `${platform} @${username} — score: ${meta.growth_score ?? "–"}`
          : "Your account analysis finished.",
        link: reportId ? `/dashboard/reports/${reportId}` : "/dashboard/reports",
        created_at: event.created_at,
      };
    case "content_generated":
      return {
        id: event.id,
        type: "generate",
        title: "Content generated",
        body: platform && contentType
          ? `${contentType.replace("_", " ")} for ${platform}`
          : "New content created.",
        link: "/dashboard/generate",
        created_at: event.created_at,
      };
    case "competitor_added":
      return {
        id: event.id,
        type: "competitor",
        title: "Competitor added",
        body: username ? `Now tracking @${username}.` : "New competitor added.",
        link: "/dashboard/competitors",
        created_at: event.created_at,
      };
    case "plan_upgraded":
      return {
        id: event.id,
        type: "billing",
        title: "Plan upgraded",
        body: plan
          ? `You're now on the ${plan} plan.`
          : "Your plan was updated.",
        link: "/dashboard/settings",
        created_at: event.created_at,
      };
    case "plan_cancelled":
      return {
        id: event.id,
        type: "billing",
        title: "Plan cancelled",
        body: "Your account moved to the free plan.",
        link: "/dashboard/settings",
        created_at: event.created_at,
      };
    case "payment_failed":
      return {
        id: event.id,
        type: "billing",
        title: "Payment failed",
        body: "Billing failed. Update your payment method to keep plan access.",
        link: "/dashboard/settings",
        created_at: event.created_at,
      };
    case "weekly_digest_sent":
      return {
        id: event.id,
        type: "email",
        title: "Weekly digest sent",
        body: "Your weekly performance summary was emailed.",
        link: "/dashboard",
        created_at: event.created_at,
      };
    case "competitor_compared":
      return {
        id: event.id,
        type: "competitor",
        title: "Competitor compared",
        body: username ? `Gap analysis for @${username} complete.` : "Competitor comparison done.",
        link: "/dashboard/competitors",
        created_at: event.created_at,
      };
    default:
      return {
        id: event.id,
        type: "info",
        title: "Activity",
        body: event.event_type.replace(/_/g, " "),
        link: "/dashboard",
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
