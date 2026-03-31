"use client";
import { Copy, TrendingUp, Sparkles, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReplicateWinnerOutput } from "@/types";

interface Props {
  winners: ReplicateWinnerOutput[];
  onCopy: (text: string) => void;
  onSave?: (content: string, key: string) => Promise<void>;
  savedKeys?: Set<string>;
  savingKey?: string | null;
}

export default function ReplicateWinnerCard({ winners, onCopy, onSave, savedKeys, savingKey }: Props) {
  return (
    <div className="space-y-4">
      {winners.map((w, i) => (
        <div key={i} className="glass rounded-2xl overflow-hidden">
          {/* Original post reference */}
          <div className="p-4 bg-card border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-xs font-medium text-emerald-500">Original winner</span>
              <span className="ml-auto text-xs font-mono text-emerald-500">{w.original_post.engagement_rate} eng.</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{w.original_post.caption_preview}</p>
            <p className="text-xs text-muted-foreground mt-1.5 italic">{w.original_post.why_it_worked}</p>
          </div>

          {/* Replicated content */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-blue-400">Replicated concept</span>
              <span className={cn(
                "ml-auto text-xs px-2 py-0.5 rounded-full",
                w.replicated_content.expected_engagement === "high" ? "bg-emerald-500/15 text-emerald-500" :
                w.replicated_content.expected_engagement === "medium" ? "bg-yellow-400/15 text-yellow-400" :
                "bg-red-400/15 text-red-400"
              )}>
                {w.replicated_content.expected_engagement} potential
              </span>
            </div>

            {/* Hook */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Hook</p>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-relaxed">&ldquo;{w.replicated_content.hook}&rdquo;</p>
                <Button size="icon" variant="ghost" onClick={() => onCopy(w.replicated_content.hook)} className="flex-shrink-0 h-7 w-7">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Caption */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Caption</p>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{w.replicated_content.caption}</p>
                <Button size="icon" variant="ghost" onClick={() => onCopy(w.replicated_content.caption)} className="flex-shrink-0 h-7 w-7">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Script outline */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Script outline</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{w.replicated_content.script_outline}</p>
            </div>

            {/* Hashtags */}
            <div className="flex flex-wrap gap-1.5">
              {w.replicated_content.hashtags.map((tag) => (
                <span key={tag} className="text-xs bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded">{tag}</span>
              ))}
            </div>

            {/* Format + copy all */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground capitalize">Format: {w.replicated_content.format}</span>
              <div className="flex items-center gap-1">
                {onSave && (() => {
                  const key = `replicate-${i}`;
                  const fullContent = `${w.replicated_content.hook}\n\n${w.replicated_content.caption}\n\n${w.replicated_content.script_outline}\n\n${w.replicated_content.hashtags.join(" ")}`;
                  const isSaved = savedKeys?.has(key);
                  return (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs gap-1"
                      onClick={() => onSave(fullContent, key)}
                      disabled={isSaved || savingKey === key}
                    >
                      {isSaved ? <BookmarkCheck className="w-3 h-3 text-blue-400" /> : <Bookmark className="w-3 h-3" />}
                      {isSaved ? "Saved" : "Save"}
                    </Button>
                  );
                })()}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1"
                  onClick={() => onCopy(`${w.replicated_content.hook}\n\n${w.replicated_content.caption}\n\n${w.replicated_content.hashtags.join(" ")}`)}
                >
                  <Copy className="w-3 h-3" /> Copy all
                </Button>
              </div>
            </div>

            {/* Adaptation notes */}
            <p className="text-xs text-blue-300 italic">{w.adaptation_notes}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
