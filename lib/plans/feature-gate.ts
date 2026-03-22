// ════════════════════════════════════════════════════════════════════════════
// Feature gating by plan — server-side checks
// ════════════════════════════════════════════════════════════════════════════

import type { PlanType } from "@/types";

export interface FeatureAccess {
  // Diagnose
  analyses_per_month: number;          // -1 = unlimited
  score_history: "last_only" | "full";

  // Discover
  discover: boolean;

  // Generate
  generate_ideas_per_month: number;     // -1 = unlimited
  hook_writer: boolean;
  caption_builder: boolean;

  // Track
  track: boolean;

  // Competitors
  competitors: boolean;
  competitors_limit: number;

  // Coach
  coach: boolean;
  coach_messages_per_month: number;   // -1 = unlimited
}

const PLAN_ACCESS: Record<PlanType, FeatureAccess> = {
  free: {
    analyses_per_month: 1,
    score_history: "last_only",
    discover: false,
    generate_ideas_per_month: 3,
    hook_writer: false,
    caption_builder: false,
    track: false,
    competitors: false,
    competitors_limit: 0,
    coach: false,
    coach_messages_per_month: 0,
  },
  starter: {
    analyses_per_month: 10,
    score_history: "full",
    discover: true,
    generate_ideas_per_month: 50,
    hook_writer: true,
    caption_builder: true,
    track: true,
    competitors: false,
    competitors_limit: 0,
    coach: true,
    coach_messages_per_month: 50,
  },
  pro: {
    analyses_per_month: 20,
    score_history: "full",
    discover: true,
    generate_ideas_per_month: -1,
    hook_writer: true,
    caption_builder: true,
    track: true,
    competitors: true,
    competitors_limit: 3,
    coach: true,
    coach_messages_per_month: 200,
  },
  agency: {
    analyses_per_month: 50,
    score_history: "full",
    discover: true,
    generate_ideas_per_month: -1,
    hook_writer: true,
    caption_builder: true,
    track: true,
    competitors: true,
    competitors_limit: 50,
    coach: true,
    coach_messages_per_month: -1,
  },
};

export function getFeatureAccess(plan: PlanType): FeatureAccess {
  return PLAN_ACCESS[plan] ?? PLAN_ACCESS.free;
}

export function canAccess(plan: PlanType, feature: keyof FeatureAccess): boolean {
  const access = getFeatureAccess(plan);
  const val = access[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  return val !== "last_only";
}

export function requiredPlanFor(feature: keyof FeatureAccess): PlanType {
  const plans: PlanType[] = ["free", "starter", "pro", "agency"];
  for (const plan of plans) {
    if (canAccess(plan, feature)) return plan;
  }
  return "agency";
}
