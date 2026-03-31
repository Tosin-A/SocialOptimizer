"use client";
import { LayoutGrid } from "lucide-react";
import type { FormatPattern } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  patterns: FormatPattern[];
  loading?: boolean;
}

export default function FormatPatternLibrary({ patterns, loading }: Props) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center animate-pulse">
        <LayoutGrid className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Analyzing format patterns...</p>
      </div>
    );
  }

  if (!patterns?.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <LayoutGrid className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No format data yet. Select an account to analyze content format distribution.
        </p>
      </div>
    );
  }

  const maxEng = Math.max(...patterns.map((p) => p.avg_engagement_rate));

  return (
    <div className="space-y-3">
      {patterns.map((pattern) => {
        const engPct = maxEng > 0 ? (pattern.avg_engagement_rate / maxEng) * 100 : 0;
        return (
          <div key={pattern.format} className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm capitalize">{pattern.format}</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                  {pattern.count} posts ({(pattern.pct_of_total * 100).toFixed(0)}%)
                </span>
              </div>
              <span className="font-mono text-sm text-blue-300">
                {(pattern.avg_engagement_rate * 100).toFixed(2)}% avg eng
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${engPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {pattern.recommendation}
            </p>
          </div>
        );
      })}
    </div>
  );
}
