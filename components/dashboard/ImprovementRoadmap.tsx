import Link from "next/link";
import { Map, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapAction } from "@/types";

const CATEGORY_CONFIG: Record<string, { color: string; label: string }> = {
  content:    { color: "bg-blue-600/20 text-blue-300",   label: "Content" },
  hashtags:   { color: "bg-blue-400/20 text-blue-400", label: "Hashtags" },
  posting:    { color: "bg-blue-400/20 text-blue-400",   label: "Posting" },
  engagement: { color: "bg-emerald-500/20 text-emerald-500", label: "Engagement" },
  branding:   { color: "bg-rose-400/20 text-rose-400",   label: "Branding" },
};

interface Props { roadmap: RoadmapAction[]; className?: string; }

export default function ImprovementRoadmap({ roadmap, className }: Props) {
  if (!roadmap?.length) return null;

  const displayed = roadmap.slice(0, 5);

  return (
    <div className={cn("glass rounded-2xl flex flex-col", className)}>
      <div className="p-3 sm:p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Map className="w-4 h-4 text-blue-400" /> Growth Roadmap
        </h3>
        {roadmap.length > 5 && (
          <Link href="/dashboard/roadmap" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
            View all {roadmap.length} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      <div className="p-3 sm:p-5 space-y-4 flex-1">
        {displayed.map((action, i) => {
          const cc = CATEGORY_CONFIG[action.category] ?? { color: "bg-white/10 text-foreground", label: action.category };
          return (
            <div key={i} className="flex gap-4 group">
              {/* Number */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full border border-blue-600/30 bg-blue-600/10 flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
                  {i + 1}
                </div>
                {i < displayed.length - 1 && <div className="w-px flex-1 bg-muted mt-2" />}
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
                <p className="text-xs text-emerald-500 mt-1">{action.expected_impact}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
