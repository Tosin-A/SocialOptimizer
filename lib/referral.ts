// ════════════════════════════════════════════════════════════════════════════
// Referral — commission amounts and cookie helpers
// ════════════════════════════════════════════════════════════════════════════

export const REFERRAL_COOKIE = "clout_ref";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Commission paid to the creator per successful upgrade, in USD */
export const REFERRAL_COMMISSIONS: Record<string, number> = {
  starter: 5,
  pro: 15,
  agency: 50,
};

export function commissionForPlan(plan: string): number {
  return REFERRAL_COMMISSIONS[plan] ?? 0;
}
