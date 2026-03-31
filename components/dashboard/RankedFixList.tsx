"use client";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { FixListItem } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  fixes: FixListItem[];
}

const impactColors: Record<string, string> = {
  high: "bg-red-400/15 text-red-400",
  medium: "bg-yellow-400/15 text-yellow-400",
  low: "bg-blue-400/15 text-blue-400",
};

export default function RankedFixList({ fixes }: Props) {
  if (!fixes?.length) return null;

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        Top fixes — ranked by impact
      </h3>
      <div className="space-y-3">
        {fixes.map((fix) => (
          <div
            key={fix.rank}
            className="border border-border rounded-xl p-3 sm:p-4 space-y-2"
          >
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center text-xs font-bold text-red-400 flex-shrink-0">
                {fix.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{fix.problem}</p>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
                      impactColors[fix.impact] ?? "bg-white/10"
                    )}
                  >
                    {fix.impact}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {fix.why_it_matters}
                </p>
              </div>
            </div>
            <div className="ml-8 sm:ml-10 flex items-start gap-2">
              <ArrowRight className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300 leading-relaxed">
                {fix.action}
              </p>
            </div>
            <p className="ml-8 sm:ml-10 text-xs font-mono text-muted-foreground">
              {fix.metric_reference}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
