"use client";
import { Zap } from "lucide-react";
import type { CompetitorOutlier } from "@/types";

interface Props {
  outliers: CompetitorOutlier[];
  competitorUsername: string;
}

export default function CompetitorOutlierList({ outliers, competitorUsername }: Props) {
  if (!outliers?.length) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-400" /> @{competitorUsername}&apos;s top performers
      </h4>
      <div className="space-y-2">
        {outliers.map((o, i) => (
          <div key={i} className="border border-yellow-400/10 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
                {o.multiplier}x avg
              </span>
              <span className="text-xs font-mono text-emerald-500">
                {(o.engagement_rate * 100).toFixed(2)}% eng
              </span>
            </div>
            {o.caption && (
              <p className="text-xs text-muted-foreground line-clamp-2">{o.caption}</p>
            )}
            <p className="text-xs text-blue-300">{o.what_worked}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
