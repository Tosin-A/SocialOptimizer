import Link from "next/link";
import { Map, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapAction } from "@/types";

const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  content:    { color: "bg-brand-600/20 text-brand-300",   label: "Content" },
  hashtags:   { color: "bg-neon-purple/20 text-neon-purple", label: "Hashtags" },
  posting:    { color: "bg-neon-cyan/20 text-neon-cyan",   label: "Posting" },
  engagement: { color: "bg-neon-green/20 text-neon-green", label: "Engagement" },
  branding:   { color: "bg-neon-pink/20 text-neon-pink",   label: "Branding" },
};

interface Props { roadmap: RoadmapAction[]; className?: string; }

export default function ImprovementRoadmap({ roadmap, className }: Props) {
  if (!roadmap?.length) return null;

  const displayed = roadmap.slice(0, 5);

  return (
    <div className={cn("glass rounded-2xl flex flex-col", className)}>
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Map className="w-4 h-4 text-brand-400" /> Growth Roadmap
        </h3>
        {roadmap.length > 5 && (
          <Link href="/dashboard/analyze" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
            View all {roadmap.length} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="p-5 space-y-4 flex-1">
        {displayed.map((action, i) => {
          const cc = CATEGORY_CONFIG[action.category] ?? { color: "bg-white/10 text-foreground", label: action.category };
          return (
            <div key={i} className="flex gap-4 group">
              {/* Number */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full border border-brand-600/30 bg-brand-600/10 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
                  {i + 1}
                </div>
                {i < displayed.length - 1 && <div className="w-px flex-1 bg-white/5 mt-2" />}
              </div>

              {/* Content */}
              <div className={i < displayed.length - 1 ? "pb-4 flex-1" : "flex-1"}>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", cc.color)}>
                    {cc.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{action.timeframe}</span>
                </div>
                <p className="text-sm font-medium leading-snug">{action.action}</p>
                <p className="text-xs text-neon-green mt-1">{action.expected_impact}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
