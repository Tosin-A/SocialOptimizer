// ════════════════════════════════════════════════════════════════════════════
// Stripe client and plan configuration
// ════════════════════════════════════════════════════════════════════════════

import Stripe from "stripe";
import type { PlanType } from "@/types";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// ─── Plan definitions ─────────────────────────────────────────────────────────

export interface PlanConfig {
  label: string;
  price_monthly: number; // USD cents
  analyses_limit: number; // -1 = unlimited
  platforms_limit: number;
  competitors_limit: number;
  stripe_price_id: string;
}

export const PLANS: Record<Exclude<PlanType, "free">, PlanConfig> = {
  starter: {
    label: "Starter",
    price_monthly: 1900,
    analyses_limit: 10,
    platforms_limit: 2,
    competitors_limit: 0,
    stripe_price_id: process.env.STRIPE_PRICE_ID_STARTER!,
  },
  pro: {
    label: "Pro",
    price_monthly: 4900,
    analyses_limit: 20,
    platforms_limit: 4,
    competitors_limit: 3,
    stripe_price_id: process.env.STRIPE_PRICE_ID_PRO!,
  },
  agency: {
    label: "Agency",
    price_monthly: 19900,
    analyses_limit: 50,
    platforms_limit: 10,
    competitors_limit: 50,
    stripe_price_id: process.env.STRIPE_PRICE_ID_AGENCY!,
  },
};

// Map Stripe price ID → plan type (used in webhook handler)
export function planFromPriceId(priceId: string): PlanType | null {
  for (const [plan, config] of Object.entries(PLANS)) {
    if (config.stripe_price_id === priceId) return plan as PlanType;
  }
  return null;
}

// Analyses limit per month for a given plan
export function analysesLimitForPlan(plan: PlanType): number {
  if (plan === "free") return 1;
  const config = PLANS[plan as Exclude<PlanType, "free">];
  return config.analyses_limit;
}
