"use client";
import { Copy, FileText, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StructuredCaption } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  caption: StructuredCaption | null;
  onSave?: (content: string, key: string) => Promise<void>;
  savedKeys?: Set<string>;
  savingKey?: string | null;
}

const sectionColors: Record<string, string> = {
  hook: "border-l-neon-green",
  body: "border-l-brand-400",
  cta: "border-l-neon-purple",
};

const sectionLabels: Record<string, string> = {
  hook: "Hook",
  body: "Body",
  cta: "CTA",
};

export default function StructuredCaptionCard({ caption, onSave, savedKeys, savingKey }: Props) {
  const { toast } = useToast();

  if (!caption) return null;

  const fullText = caption.sections.map((s) => s.text).join("\n\n");
  const fullWithHashtags = `${fullText}\n\n${caption.hashtags.join(" ")}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400" />
          <h3 className="font-semibold text-sm">Structured Caption</h3>
          <span className={cn(
            "text-xs font-mono px-2 py-0.5 rounded",
            caption.overall_score >= 80 ? "bg-neon-green/10 text-neon-green" :
            caption.overall_score >= 60 ? "bg-yellow-400/10 text-yellow-400" :
            "bg-red-400/10 text-red-400"
          )}>
            {caption.overall_score}/100
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onSave && (() => {
            const key = "structured-caption";
            const isSaved = savedKeys?.has(key);
            return (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1"
                onClick={() => onSave(fullWithHashtags, key)}
                disabled={isSaved || savingKey === key}
              >
                {isSaved ? <BookmarkCheck className="w-3 h-3 text-brand-400" /> : <Bookmark className="w-3 h-3" />}
                {isSaved ? "Saved" : "Save"}
              </Button>
            );
          })()}
          <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => copyToClipboard(fullWithHashtags)}>
            <Copy className="w-3 h-3" /> Copy all
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {caption.sections.map((section) => (
          <div
            key={section.label}
            className={cn("border-l-2 pl-4 space-y-1", sectionColors[section.label])}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {sectionLabels[section.label] ?? section.label}
              </span>
              <span className={cn(
                "text-xs font-mono",
                section.score >= 80 ? "text-neon-green" : section.score >= 60 ? "text-yellow-400" : "text-red-400"
              )}>
                {section.score}/100
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.text}</p>
            <p className="text-xs text-muted-foreground italic">{section.feedback}</p>
          </div>
        ))}
      </div>

      {caption.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {caption.hashtags.map((tag) => (
            <span key={tag} className="text-xs bg-brand-600/20 text-brand-300 px-2 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{caption.character_count} characters</p>
    </div>
  );
}
