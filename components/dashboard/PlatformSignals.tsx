"use client";
import { Activity } from "lucide-react";
import type { PlatformSignalWeight } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  signals: PlatformSignalWeight[];
  platform: string;
}

export default function PlatformSignals({ signals, platform }: Props) {
  if (!signals?.length) return null;

  return (
    <div className="glass rounded-2xl p-3 sm:p-5 md:p-6 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Activity className="w-4 h-4 text-brand-400" />
        Platform signals — <span className="capitalize">{platform}</span>
      </h3>
      <p className="text-xs text-muted-foreground">
        Weighted signals the {platform} algorithm uses to rank your content. Bar
        shows your score vs the platform benchmark (dashed line).
      </p>
      <div className="space-y-3">
        {signals.map((sw) => {
          const gap = sw.current_score - sw.benchmark;
          const color =
            gap >= 10
              ? "bg-neon-green"
              : gap >= -5
              ? "bg-yellow-400"
              : "bg-red-400";
          return (
            <div key={sw.signal} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {sw.signal}{" "}
                  <span className="text-white/20">
                    ({(sw.weight * 100).toFixed(0)}%)
                  </span>
                </span>
                <span className="font-mono">
                  {sw.current_score}
                  <span
                    className={cn(
                      "ml-1.5",
                      gap >= 0 ? "text-neon-green" : "text-red-400"
                    )}
                  >
                    {gap >= 0 ? "+" : ""}
                    {gap}<span className="hidden sm:inline"> vs median</span>
                  </span>
                </span>
              </div>
              <div className="relative w-full bg-white/5 rounded-full h-1.5">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", color)}
                  style={{ width: `${Math.min(100, sw.current_score)}%` }}
                />
                {/* Benchmark marker */}
                <div
                  className="absolute top-0 h-full w-px border-l border-dashed border-white/30"
                  style={{ left: `${Math.min(100, sw.benchmark)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
