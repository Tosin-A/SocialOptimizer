"use client";
import { TrendingUp, Flame } from "lucide-react";
import type { TrendItem } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  trends: TrendItem[];
}

const typeColors: Record<string, string> = {
  sound: "bg-neon-purple/20 text-neon-purple",
  hashtag: "bg-brand-600/20 text-brand-300",
  format: "bg-neon-cyan/20 text-neon-cyan",
  topic: "bg-neon-pink/20 text-neon-pink",
};

const saturationColors: Record<string, string> = {
  low: "text-neon-green",
  medium: "text-yellow-400",
  high: "text-red-400",
};

export default function TrendVelocityFeed({ trends }: Props) {
  if (!trends?.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No trending data available yet. Trends are populated from platform monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trends.map((trend) => (
        <div key={trend.id} className="glass rounded-xl p-4 flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
              <Flame className={cn("w-5 h-5", trend.velocity_score >= 70 ? "text-red-400" : trend.velocity_score >= 40 ? "text-yellow-400" : "text-muted-foreground")} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm truncate">{trend.name}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded capitalize", typeColors[trend.trend_type] ?? "bg-white/10")}>
                {trend.trend_type}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Velocity: <span className="font-mono text-foreground">{trend.velocity_score}</span>/100</span>
              <span>Saturation: <span className={cn("font-mono", saturationColors[trend.saturation])}>{trend.saturation}</span></span>
            </div>
          </div>
          {/* Velocity bar */}
          <div className="w-16 flex-shrink-0">
            <div className="w-full bg-white/5 rounded-full h-1.5">
              <div
                className={cn("h-full rounded-full", trend.velocity_score >= 70 ? "bg-red-400" : trend.velocity_score >= 40 ? "bg-yellow-400" : "bg-brand-500")}
                style={{ width: `${trend.velocity_score}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
