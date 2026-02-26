"use client";
import { useState, useEffect, useCallback } from "react";
import { Wand2, Loader2, Copy, ChevronDown, ChevronUp, History, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Platform, GeneratedContentOutput } from "@/types";

interface SavedItem {
  id: string;
  platform: string;
  content_type: string;
  prompt_context: { niche: string; topic: string; tone?: string };
  output: GeneratedContentOutput;
  created_at: string;
}

const CONTENT_TYPES = [
  { value: "hook", label: "Hooks (Opening lines)" },
  { value: "caption", label: "Full captions + hashtags" },
  { value: "script", label: "Video script outline" },
  { value: "idea", label: "Video ideas" },
  { value: "hashtags", label: "Hashtag sets" },
  { value: "full_plan", label: "Full content plan (all of the above)" },
];

const TONES = [
  { value: "educational", label: "Educational" },
  { value: "entertaining", label: "Entertaining / Fun" },
  { value: "inspirational", label: "Inspirational" },
  { value: "controversial", label: "Controversial / Bold" },
  { value: "storytelling", label: "Storytelling" },
];

export default function GeneratePage() {
  const [tab, setTab] = useState<"generate" | "history">("generate");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [contentType, setContentType] = useState("hook");
  const [niche, setNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("educational");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<GeneratedContentOutput | null>(null);
  const [history, setHistory] = useState<SavedItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const { toast } = useToast();

  const loadHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/generate?page=${page}`);
      const data = await res.json();
      if (page === 1) setHistory(data.data ?? []);
      else setHistory((prev) => [...prev, ...(data.data ?? [])]);
      setHistoryHasMore(data.has_more ?? false);
      setHistoryPage(page);
    } catch {
      toast({ title: "Couldn't load history", variant: "destructive" });
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (tab === "history" && history.length === 0) loadHistory(1);
  }, [tab]);

  const generate = async () => {
    if (!niche || !topic) {
      toast({ title: "Fill in niche and topic", variant: "destructive" });
      return;
    }
    setLoading(true);
    setOutput(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, content_type: contentType, niche, topic, tone, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutput(data.data);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-neon-purple" /> Content Generator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-generated hooks, captions, scripts, and hashtags personalized to your niche
          </p>
        </div>
        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 self-start sm:self-auto">
          <button
            onClick={() => setTab("generate")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === "generate" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" /> Generate
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === "history" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="w-3.5 h-3.5" /> History
          </button>
        </div>
      </div>

      {/* ── Generate tab ───────────────────────────────────────────────── */}
      {tab === "generate" && <>

      {/* Config panel */}
      <div className="glass rounded-2xl p-6 grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Content type</Label>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Your niche</Label>
          <Input
            placeholder="e.g. personal finance, fitness for moms, travel vlogging"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Specific topic / angle</Label>
          <Input
            placeholder="e.g. how to save $1000 in 30 days, beginner yoga mistakes"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TONES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Variations to generate</Label>
          <Select value={String(count)} onValueChange={(v) => setCount(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[3, 5, 8, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} variations</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Button onClick={generate} disabled={loading} className="w-full sm:w-auto gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate content"}
          </Button>
        </div>
      </div>

      {/* Output */}
      {output && (
        <div className="space-y-6">
          {/* Hooks */}
          {output.hooks && (
            <OutputSection title="Hooks" count={output.hooks.length}>
              <div className="space-y-3">
                {output.hooks.map((hook, i) => (
                  <div key={i} className="glass rounded-xl p-4 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-medium text-sm leading-relaxed">"{hook.text}"</p>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(hook.text)} className="flex-shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="bg-white/5 px-2 py-0.5 rounded">Type: {hook.type}</span>
                      <span className={`px-2 py-0.5 rounded ${hook.expected_retention === 'high' ? 'bg-green-500/10 text-green-400' : hook.expected_retention === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                        Retention: {hook.expected_retention}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{hook.psychology}</p>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Captions */}
          {output.captions && (
            <OutputSection title="Captions" count={output.captions.length}>
              <div className="space-y-4">
                {output.captions.map((cap, i) => (
                  <div key={i} className="glass rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{cap.caption}</p>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(cap.caption)} className="flex-shrink-0">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {cap.cta && <p className="text-xs text-brand-400">CTA: {cap.cta}</p>}
                    <div className="flex flex-wrap gap-1">
                      {cap.hashtags.slice(0, 15).map((tag) => (
                        <span key={tag} className="text-xs bg-brand-600/20 text-brand-300 px-2 py-0.5 rounded">{tag}</span>
                      ))}
                      {cap.hashtags.length > 15 && <span className="text-xs text-muted-foreground">+{cap.hashtags.length - 15} more</span>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => copyToClipboard(`${cap.caption}\n\n${cap.hashtags.join(' ')}`)}>
                      <Copy className="w-3 h-3" /> Copy caption + hashtags
                    </Button>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Video ideas */}
          {output.video_ideas && (
            <OutputSection title="Video Ideas" count={output.video_ideas.length}>
              <div className="space-y-3">
                {output.video_ideas.map((idea, i) => (
                  <div key={i} className="glass rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{idea.title}</h4>
                      <span className="text-xs bg-white/5 px-2 py-0.5 rounded capitalize">{idea.format}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Angle: {idea.angle}</p>
                    <p className="text-xs text-brand-300 italic">{idea.why_it_works}</p>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}

          {/* Hashtag sets */}
          {output.hashtag_sets && (
            <OutputSection title="Hashtag Sets" count={output.hashtag_sets.length}>
              <div className="space-y-4">
                {output.hashtag_sets.map((set, i) => (
                  <div key={i} className="glass rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{set.name}</h4>
                      <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={() => copyToClipboard(set.tags.join(' '))}>
                        <Copy className="w-3 h-3" /> Copy all
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{set.strategy}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {set.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-brand-600/20 text-brand-300 px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </OutputSection>
          )}
        </div>
      )}

      </> /* end generate tab */}

      {/* ── History tab ────────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="space-y-4">
          {historyLoading && history.length === 0 && (
            <div className="glass rounded-2xl p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!historyLoading && history.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No generations yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Switch to the Generate tab to create your first piece of content.
              </p>
              <Button size="sm" onClick={() => setTab("generate")}>Start generating</Button>
            </div>
          )}

          {history.map((item) => (
            <div key={item.id} className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono capitalize bg-white/5 px-2 py-0.5 rounded">{item.platform}</span>
                    <span className="text-xs font-mono capitalize bg-brand-600/20 text-brand-300 px-2 py-0.5 rounded">{item.content_type.replace("_", " ")}</span>
                  </div>
                  <p className="text-sm font-medium">
                    {item.prompt_context.niche} — {item.prompt_context.topic}
                  </p>
                  {item.prompt_context.tone && (
                    <p className="text-xs text-muted-foreground capitalize">Tone: {item.prompt_context.tone}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
              </div>

              {/* Output preview */}
              {item.output.hooks?.[0] && (
                <div className="text-xs bg-white/5 rounded-lg p-3 text-muted-foreground line-clamp-2">
                  "{item.output.hooks[0].text}"
                </div>
              )}
              {item.output.captions?.[0] && (
                <div className="text-xs bg-white/5 rounded-lg p-3 text-muted-foreground line-clamp-2">
                  {item.output.captions[0].caption}
                </div>
              )}
              {item.output.video_ideas?.[0] && (
                <div className="text-xs bg-white/5 rounded-lg p-3 text-muted-foreground">
                  {item.output.video_ideas[0].title}
                </div>
              )}
              {item.output.hashtag_sets?.[0] && (
                <div className="flex flex-wrap gap-1">
                  {item.output.hashtag_sets[0].tags.slice(0, 8).map((tag) => (
                    <span key={tag} className="text-xs bg-brand-600/20 text-brand-300 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {historyHasMore && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadHistory(historyPage + 1)}
                disabled={historyLoading}
                className="gap-2"
              >
                {historyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OutputSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <h3 className="font-semibold flex items-center gap-2">
          {title} <span className="text-xs font-normal text-muted-foreground bg-white/5 px-2 py-0.5 rounded">{count}</span>
        </h3>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
