"use client";
import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { NicheSaturation } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  data: NicheSaturation | null;
  loading?: boolean;
}

const directionIcons = {
  growing: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const directionColors = {
  growing: "text-neon-green",
  stable: "text-yellow-400",
  declining: "text-red-400",
};

export default function NicheSaturationCard({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center animate-pulse">
        <Gauge className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Analyzing niche saturation...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Gauge className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Run an analysis first to see niche saturation data.
        </p>
      </div>
    );
  }

  const DirIcon = directionIcons[data.trend_direction];

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Gauge className="w-4 h-4 text-brand-400" />
          Niche Saturation — <span className="capitalize">{data.niche}</span>
        </h3>
        <div className={cn("flex items-center gap-1 text-xs font-medium", directionColors[data.trend_direction])}>
          <DirIcon className="w-3.5 h-3.5" />
          <span className="capitalize">{data.trend_direction}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center bg-white/5 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Active creators</p>
          <p className="font-mono font-semibold">{data.active_creators.toLocaleString()}</p>
        </div>
        <div className="text-center bg-white/5 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Avg engagement</p>
          <p className="font-mono font-semibold">{(data.avg_engagement_rate * 100).toFixed(2)}%</p>
        </div>
        <div className="text-center bg-white/5 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Platform</p>
          <p className="font-semibold text-sm capitalize">{data.platform}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{data.verdict}</p>
    </div>
  );
}
