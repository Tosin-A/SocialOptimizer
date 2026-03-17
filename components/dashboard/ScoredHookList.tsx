"use client";
import { Copy, Sparkles, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScoredHook } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  hooks: ScoredHook[];
  onSave?: (content: string, key: string) => Promise<void>;
  savedKeys?: Set<string>;
  savingKey?: string | null;
}

export default function ScoredHookList({ hooks, onSave, savedKeys, savingKey }: Props) {
  const { toast } = useToast();

  if (!hooks?.length) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div className="space-y-3">
      {hooks.map((hook, i) => (
        <div
          key={i}
          className={cn(
            "glass rounded-xl p-4 space-y-2",
            hook.ab_recommended && "border border-brand-500/30"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {hook.ab_recommended && (
                  <span className="text-xs bg-brand-600/20 text-brand-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> A/B test
                  </span>
                )}
                <span className="text-xs bg-white/5 px-2 py-0.5 rounded capitalize">{hook.type}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">&quot;{hook.text}&quot;</p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {onSave && (() => {
                const key = `scored-hook-${i}`;
                const isSaved = savedKeys?.has(key);
                return (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onSave(hook.text, key)}
                    disabled={isSaved || savingKey === key}
                    title={isSaved ? "Saved" : "Save idea"}
                  >
                    {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-brand-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                  </Button>
                );
              })()}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(hook.text)}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Score: </span>
              <span className={cn(
                "font-mono font-semibold",
                hook.score >= 80 ? "text-neon-green" : hook.score >= 60 ? "text-yellow-400" : "text-red-400"
              )}>
                {hook.score}/100
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Pattern interrupt: </span>
              <span className="font-mono">{hook.pattern_interrupt_score}/100</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">{hook.psychology}</p>
        </div>
      ))}
    </div>
  );
}
