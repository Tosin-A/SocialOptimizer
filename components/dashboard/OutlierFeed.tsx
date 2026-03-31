"use client";
import { useState } from "react";
import { Zap, Bookmark, BookmarkCheck } from "lucide-react";
import type { OutlierPost } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  outliers: OutlierPost[];
  onToggleSave?: (id: string, saved: boolean) => void;
}

export default function OutlierFeed({ outliers, onToggleSave }: Props) {
  if (!outliers?.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No outliers detected yet. Run outlier detection from one of your connected accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {outliers.map((outlier) => (
        <div key={outlier.id} className="glass rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {outlier.multiplier}x avg
              </span>
              <span className="text-xs text-muted-foreground capitalize">{outlier.platform}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(outlier.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <button
              onClick={() => onToggleSave?.(outlier.id, !outlier.is_saved)}
              className="text-muted-foreground hover:text-blue-400 transition-colors"
            >
              {outlier.is_saved
                ? <BookmarkCheck className="w-4 h-4 text-blue-400" />
                : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
          {outlier.caption && (
            <p className="text-xs text-muted-foreground line-clamp-2">{outlier.caption}</p>
          )}
          <div className="flex gap-3 text-xs">
            <span className="font-mono">{outlier.views.toLocaleString()} views</span>
            <span className="font-mono">{outlier.likes.toLocaleString()} likes</span>
            <span className="font-mono text-emerald-500">
              {(outlier.engagement_rate * 100).toFixed(2)}% eng
            </span>
          </div>
          {outlier.what_worked && (
            <p className="text-xs text-blue-300 leading-relaxed">{outlier.what_worked}</p>
          )}
          {outlier.pattern_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {outlier.pattern_tags.map((tag) => (
                <span key={tag} className="text-xs bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
