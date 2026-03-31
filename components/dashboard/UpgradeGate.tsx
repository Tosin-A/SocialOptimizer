"use client";

import { Lock } from "lucide-react";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { canAccess, requiredPlanFor, type FeatureAccess } from "@/lib/plans/feature-gate";
import Link from "next/link";

interface Props {
  feature: keyof FeatureAccess;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  teaser?: React.ReactNode;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

export default function UpgradeGate({ feature, children, fallback, teaser }: Props) {
  const { plan, loading } = useFeatureAccess();

  if (loading) return null;

  if (canAccess(plan, feature)) {
    return <>{children}</>;
  }

  const required = requiredPlanFor(feature);

  if (fallback) return <>{fallback}</>;

  if (teaser) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred teaser content */}
        <div className="pointer-events-none select-none blur-[6px]" aria-hidden="true">
          {teaser}
        </div>

        {/* Gradient overlay + CTA */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40 flex items-center justify-center">
          <div className="text-center px-4 max-w-sm">
            <div className="rounded-full bg-slate-800/80 p-3 mx-auto w-fit mb-3">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Unlock with {PLAN_LABELS[required]}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Upgrade to access this feature and see your full data.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              Upgrade to {PLAN_LABELS[required]}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 sm:p-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-slate-800 p-3">
          <Lock className="h-5 w-5 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">
          {PLAN_LABELS[required]} plan required
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          This feature is available on the {PLAN_LABELS[required]} plan and above.
        </p>
        <Link
          href="/dashboard/settings"
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
        >
          Upgrade to {PLAN_LABELS[required]}
        </Link>
      </div>
    </div>
  );
}
