"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, ArrowUpRight, Gift } from "lucide-react";

export default function AnalysisUsageBadge() {
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    bonus: number;
    plan: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/accounts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const plan = d.user_plan;
        if (plan) {
          setUsage({
            used: plan.analyses_used,
            limit: plan.analyses_limit,
            bonus: plan.bonus_analyses ?? 0,
            plan: plan.plan ?? "free",
          });
        }
      });
  }, []);

  if (!usage) return null;

  const effectiveLimit = usage.limit + usage.bonus;
  const left = Math.max(0, effectiveLimit - usage.used);
  const exhausted = left === 0;
  const isFree = usage.plan === "free";

  if (exhausted && isFree) {
    return (
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/30 transition-colors text-sm"
      >
        <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-amber-300 font-medium">
          0 analyses left
        </span>
        <span className="text-amber-400/70 text-xs flex items-center gap-0.5">
          Share to earn 3 <Gift className="w-3 h-3 ml-0.5" />
        </span>
      </Link>
    );
  }

  if (exhausted) {
    return (
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/30 transition-colors text-sm"
      >
        <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-amber-300">
          <span className="font-mono">{usage.used}</span>/{effectiveLimit} used
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/analyze"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border hover:bg-muted/80 hover:border-border transition-colors text-sm"
    >
      <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-muted-foreground">
        <span className="font-mono text-foreground">{usage.used}</span> used ·{" "}
        <span className="font-mono text-blue-400">{left}</span> left
        {usage.bonus > 0 && (
          <span className="text-emerald-400 ml-1">
            (+{usage.bonus} bonus)
          </span>
        )}
      </span>
    </Link>
  );
}
