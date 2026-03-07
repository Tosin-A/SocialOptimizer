"use client";
import { Lightbulb, TrendingUp, Zap, Search } from "lucide-react";
import type { PersonalizedIdea } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  ideas: PersonalizedIdea[];
}

const sourceIcons = {
  outlier: Zap,
  trend: TrendingUp,
  niche_gap: Search,
};

const sourceColors = {
  outlier: "bg-neon-green/10 text-neon-green border-neon-green/20",
  trend: "bg-neon-purple/10 text-neon-purple border-neon-purple/20",
  niche_gap: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20",
};

const engColors = {
  high: "text-neon-green",
  medium: "text-yellow-400",
  low: "text-muted-foreground",
};

export default function PersonalizedIdeaList({ ideas }: Props) {
  if (!ideas?.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No ideas generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ideas.map((idea, i) => {
        const SourceIcon = sourceIcons[idea.source];
        return (
          <div key={i} className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-medium text-sm">{idea.title}</h4>
              <span className={cn("text-xs capitalize font-mono", engColors[idea.estimated_engagement])}>
                {idea.estimated_engagement}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{idea.angle}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-xs px-2 py-0.5 rounded border flex items-center gap-1", sourceColors[idea.source])}>
                <SourceIcon className="w-3 h-3" />
                {idea.source.replace("_", " ")}
              </span>
              <span className="text-xs bg-white/5 px-2 py-0.5 rounded capitalize">{idea.format}</span>
            </div>
            <p className="text-xs text-muted-foreground italic">{idea.source_reference}</p>
            <p className="text-xs text-brand-300">{idea.why_it_works}</p>
          </div>
        );
      })}
    </div>
  );
}
