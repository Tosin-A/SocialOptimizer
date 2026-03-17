"use client";

import { useState, useEffect } from "react";
import { Bookmark, Trash2, MessageSquare, ChevronDown, ChevronUp, Copy } from "lucide-react";
import Link from "next/link";
import type { SavedIdea } from "@/types";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatContent(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Markdown formatting
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-white/10 px-1 py-0.5 rounded text-xs'>$1</code>")
    // Headings
    .replace(/^### (.+)$/gm, "<h3 class='font-semibold text-sm mt-3 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='font-semibold text-base mt-3 mb-1'>$1</h2>")
    // Labels (Hook:, Angle:, Format:, CTA:)
    .replace(/^(Hook|Angle|Format|CTA|Total|Retention|Type|Prompt):\s*(.+)$/gm,
      "<div class='flex gap-2 items-baseline'><span class='text-[11px] uppercase tracking-wider text-muted-foreground font-medium shrink-0'>$1</span><span>$2</span></div>")
    // Timestamps like [0-3s]
    .replace(/^\[(\d+[\-–]\d+s?)\]\s*(.+)$/gm,
      "<div class='flex gap-2 items-baseline ml-2 border-l-2 border-white/10 pl-2'><span class='text-[11px] font-mono text-muted-foreground shrink-0'>$1</span><span>$2</span></div>")
    // Hashtags line (multiple #tags)
    .replace(/^((?:#\S+\s*){3,})$/gm, (match) => {
      const tags = match.trim().split(/\s+/);
      return "<div class='flex flex-wrap gap-1 mt-1'>" +
        tags.map((t) => `<span class='text-xs bg-brand-600/20 text-brand-300 px-2 py-0.5 rounded'>${t}</span>`).join("") +
        "</div>";
    })
    // List items
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal'>$1. $2</li>")
    // Paragraphs
    .replace(/\n{2,}/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

export default function SavedIdeasSection() {
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/saved-ideas")
      .then((res) => res.json())
      .then((json) => setIdeas(json.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const deleteIdea = async (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/saved-ideas?id=${id}`, { method: "DELETE" });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 animate-pulse">
        <div className="h-5 w-32 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-white/5 rounded-lg" />
          <div className="h-16 bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center gap-2">
        <Bookmark className="w-4 h-4 text-brand-400" />
        <h2 className="font-semibold text-sm">Saved Ideas</h2>
        {ideas.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">{ideas.length} saved</span>
        )}
      </div>

      {ideas.length === 0 ? (
        <div className="p-8 text-center">
          <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Save ideas from the Coach to build your content queue.
          </p>
          <Link
            href="/dashboard/coach"
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Open Coach
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {ideas.map((idea) => {
            const isLong = idea.content.length > 300;
            const expanded = expandedIds.has(idea.id);
            const displayContent = isLong && !expanded
              ? idea.content.slice(0, 300) + "…"
              : idea.content;
            return (
              <div key={idea.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          idea.provider === "openai"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-brand-500/15 text-brand-400"
                        }`}
                      >
                        {idea.provider === "openai" ? "GPT-4o" : "Claude"}
                      </span>
                      {idea.platform && (
                        <span className="text-[10px] font-mono uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded text-muted-foreground">
                          {idea.platform}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {relativeTime(idea.created_at)}
                      </span>
                    </div>
                    <div
                      className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      dangerouslySetInnerHTML={{ __html: formatContent(displayContent) }}
                    />
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(idea.id)}
                        className="mt-1.5 flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> Show more
                          </>
                        )}
                      </button>
                    )}
                    {idea.source_prompt && (
                      <p className="mt-2 text-[11px] text-muted-foreground truncate">
                        Prompt: &ldquo;{idea.source_prompt}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => navigator.clipboard.writeText(idea.content)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete idea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
