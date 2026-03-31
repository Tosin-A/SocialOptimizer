"use client";
import { Hash, ArrowRight, Check, Minus } from "lucide-react";
import type { HashtagGapAnalysis } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  gaps: HashtagGapAnalysis[];
}

const recColors: Record<string, string> = {
  adopt: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ignore: "bg-muted text-muted-foreground border-border",
  already_using: "bg-blue-600/10 text-blue-300 border-blue-600/20",
};

export default function HashtagGapCard({ gaps }: Props) {
  if (!gaps?.length) return null;

  const toAdopt = gaps.filter((g) => g.recommendation === "adopt");
  const toIgnore = gaps.filter((g) => g.recommendation === "ignore");

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Hash className="w-4 h-4 text-blue-400" /> Hashtag gap analysis
      </h4>
      {toAdopt.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-emerald-500 font-medium">Recommend adopting:</p>
          {toAdopt.map((g) => (
            <div key={g.hashtag} className="flex items-start gap-2 text-xs">
              <ArrowRight className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-emerald-500">{g.hashtag}</span>
                <span className="text-muted-foreground ml-2">{g.rationale}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {toIgnore.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Safe to ignore:</p>
          {toIgnore.slice(0, 3).map((g) => (
            <div key={g.hashtag} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Minus className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-50" />
              <span className="font-mono">{g.hashtag}</span>
              <span>{g.rationale}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
