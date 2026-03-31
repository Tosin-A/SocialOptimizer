"use client";
import { Clock } from "lucide-react";
import type { PostingTimeRecommendation } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  recommendations: PostingTimeRecommendation[];
  loading?: boolean;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PostingTimeGrid({ recommendations, loading }: Props) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 text-center animate-pulse">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Calculating optimal posting times...</p>
      </div>
    );
  }

  if (!recommendations?.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Not enough post data to calculate optimal times. Need at least 10 posts.
        </p>
      </div>
    );
  }

  // Show top 14 recommendations (2 per day)
  const topSlots = recommendations.slice(0, 14);

  // Group by day
  const byDay: Record<string, PostingTimeRecommendation[]> = {};
  for (const slot of topSlots) {
    if (!byDay[slot.day]) byDay[slot.day] = [];
    byDay[slot.day].push(slot);
  }

  return (
    <div className="glass rounded-2xl p-3 sm:p-4 md:p-6 space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Clock className="w-4 h-4 text-blue-400" />
        Best posting times
      </h3>
      <p className="text-xs text-muted-foreground">
        Based on engagement patterns from your posts. Times are in UTC.
      </p>

      <div className="grid gap-2">
        {DAY_ORDER.map((day) => {
          const slots = byDay[day];
          if (!slots?.length) return null;

          return (
            <div key={day} className="flex items-center gap-3">
              <span className="text-xs font-medium w-12 sm:w-20 text-muted-foreground"><span className="sm:hidden">{day.slice(0, 2)}</span><span className="hidden sm:inline">{day.slice(0, 3)}</span></span>
              <div className="flex gap-2 flex-wrap">
                {slots.map((slot) => (
                  <span
                    key={`${slot.day}-${slot.hour}`}
                    className={cn(
                      "text-xs font-mono px-2.5 py-1 rounded-lg border",
                      slot.label === "Best"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        : slot.label === "Good"
                        ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-400"
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {slot.hour.toString().padStart(2, "0")}:00
                    <span className="ml-1.5 text-[10px] opacity-60">{slot.score}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
