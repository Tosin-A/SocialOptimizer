"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function AnalysisUsageBadge() {
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  useEffect(() => {
    fetch("/api/accounts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const plan = d.user_plan;
        if (plan) {
          setUsage({
            used: plan.analyses_used,
            limit: plan.analyses_limit,
          });
        }
      });
  }, []);

  if (!usage) return null;

  const left = Math.max(0, usage.limit - usage.used);

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
