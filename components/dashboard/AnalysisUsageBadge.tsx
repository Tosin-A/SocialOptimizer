"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, ArrowUpRight } from "lucide-react";

export default function AnalysisUsageBadge() {
  const [usage, setUsage] = useState<{ used: number; limit: number; plan: string } | null>(null);

  useEffect(() => {
    fetch("/api/accounts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const plan = d.user_plan;
        if (plan) {
          setUsage({
            used: plan.analyses_used,
            limit: plan.analyses_limit,
            plan: plan.plan ?? "free",
          });
        }
      });
  }, []);

  if (!usage) return null;

  const left = Math.max(0, usage.limit - usage.used);
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
          Upgrade <ArrowUpRight className="w-3 h-3" />
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
          <span className="font-mono">{usage.used}</span>/{usage.limit} used
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/analyze"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/15 transition-colors text-sm"
    >
      <BarChart3 className="w-3.5 h-3.5 text-brand-400" />
      <span className="text-muted-foreground">
        <span className="font-mono text-foreground">{usage.used}</span> used ·{" "}
        <span className="font-mono text-brand-400">{left}</span> left
      </span>
    </Link>
  );
}
