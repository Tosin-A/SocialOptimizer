"use client";
import { useState, useEffect } from "react";
import {
  Users, Plus, TrendingUp, TrendingDown, Minus, Loader2,
  BarChart2, Hash, Clock, X, GitCompareArrows, AlertCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";

type Platform = "tiktok" | "instagram" | "youtube" | "facebook";
type ImpactLevel = "high" | "medium" | "low";

interface Competitor {
  id: string;
  platform: Platform;
  username: string;
  display_name: string | null;
  followers: number | null;
  avg_engagement_rate: number | null;
  posts_per_week: number | null;
  top_hashtags: string[];
  niche: string | null;
  last_analyzed_at: string | null;
}

interface TacticalAction {
  action: string;
  priority: ImpactLevel;
  rationale: string;
}

interface ComparisonResult {
  engagement_gap: number;
  follower_gap: number;
  posting_frequency_gap: number;
  hashtag_differences: Array<{ hashtag: string; competitor_uses: boolean; user_uses: boolean }>;
  tactical_actions: TacticalAction[];
  competitor: Competitor;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
};

const PRIORITY_STYLES: Record<ImpactLevel, string> = {
  high:   "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low:    "bg-white/5 text-muted-foreground border-white/10",
};

function DeltaBadge({ value, unit = "" }: { value: number; unit?: string }) {
  if (value === 0)
    return <span className="text-muted-foreground text-xs flex items-center gap-1"><Minus className="w-3 h-3" /> no gap</span>;
  const behind = value > 0;
  return (
    <span className={`text-xs flex items-center gap-1 font-medium ${behind ? "text-red-400" : "text-emerald-400"}`}>
      {behind ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {behind ? "+" : "-"}{Math.abs(value).toFixed(1)}{unit} {behind ? "behind" : "ahead"}
    </span>
  );
}

function ComparisonPanel({ comparison, onClose }: { comparison: ComparisonResult; onClose: () => void }) {
  const compUniqueHashtags = comparison.hashtag_differences
    .filter((h) => h.competitor_uses && !h.user_uses)
    .slice(0, 8);

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4 text-brand-400" /> Gap analysis
        </h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Gap metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Engagement gap</p>
          <DeltaBadge value={parseFloat((comparison.engagement_gap * 100).toFixed(2))} unit="pp" />
        </div>
        <div className="bg-white/5 rounded-xl p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Follower gap</p>
          <DeltaBadge value={comparison.follower_gap} />
        </div>
        <div className="bg-white/5 rounded-xl p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Posts/week gap</p>
          <DeltaBadge value={comparison.posting_frequency_gap} unit="x" />
        </div>
      </div>

      {/* Competitor-only hashtags */}
      {compUniqueHashtags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Hash className="w-3 h-3" /> Hashtags they use that you don't
          </p>
          <div className="flex flex-wrap gap-1.5">
            {compUniqueHashtags.map((h) => (
              <span key={h.hashtag} className="text-xs px-2 py-0.5 rounded-full bg-brand-600/20 text-brand-300 border border-brand-600/30 font-mono">
                #{h.hashtag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tactical actions */}
      {comparison.tactical_actions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Action plan</p>
          <div className="space-y-2">
            {comparison.tactical_actions.map((ta, i) => (
              <div key={i} className={`rounded-xl p-3 border space-y-1 ${PRIORITY_STYLES[ta.priority]}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[ta.priority]}`}>
                    {ta.priority}
                  </span>
                  <p className="text-sm leading-snug">{ta.action}</p>
                </div>
                {ta.rationale && (
                  <p className="text-xs opacity-70 pl-8 italic">{ta.rationale}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [username, setUsername] = useState("");

  // Per-competitor comparison state
  const [comparisons, setComparisons] = useState<Record<string, ComparisonResult | null>>({});
  const [comparing, setComparing] = useState<string | null>(null);
  const [expandedComparisons, setExpandedComparisons] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  const loadCompetitors = async () => {
    try {
      const res = await fetch("/api/competitors");
      const data = await res.json();
      setCompetitors(data.data ?? []);
    } catch {
      // silently fail — we'll show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCompetitors(); }, []);

  const addCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, username: username.replace("@", "").trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add competitor");
      toast({ title: "Competitor added", description: `@${username} is now being tracked.` });
      setUsername("");
      setShowForm(false);
      loadCompetitors();
    } catch (err: unknown) {
      toast({
        title: "Couldn't add competitor",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const runComparison = async (competitorId: string) => {
    setComparing(competitorId);
    try {
      const res = await fetch(`/api/competitors/${competitorId}/compare`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Comparison failed");
      setComparisons((prev) => ({ ...prev, [competitorId]: data.data }));
      setExpandedComparisons((prev) => new Set([...prev, competitorId]));
    } catch (err: unknown) {
      toast({
        title: "Comparison failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setComparing(null);
    }
  };

  const toggleComparison = (competitorId: string) => {
    setExpandedComparisons((prev) => {
      const next = new Set(prev);
      next.has(competitorId) ? next.delete(competitorId) : next.add(competitorId);
      return next;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" /> Competitors
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track what's working for other accounts in your niche
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add competitor"}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={addCompetitor} className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">Add a competitor account</h3>
          <p className="text-sm text-muted-foreground">
            We'll pull their public profile data: followers, posting cadence, hashtags, engagement rate.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-1.5 w-full sm:w-40">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
                    <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>Username</Label>
              <Input
                placeholder="@theirhandle"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={adding} className="gap-2 w-full sm:w-auto">
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                Track account
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading competitors...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && competitors.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No competitors tracked yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Add accounts in your niche to see how their engagement, hashtags, and posting cadence compare to yours.
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add your first competitor
          </Button>
        </div>
      )}

      {/* Competitors list */}
      {!loading && competitors.length > 0 && (
        <div className="space-y-4">
          {competitors.map((c) => {
            const hasComparison = !!comparisons[c.id];
            const isExpanded = expandedComparisons.has(c.id);
            const isComparing = comparing === c.id;

            return (
              <div key={c.id} className="glass rounded-2xl p-5">
                {/* Profile row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-600/30 flex items-center justify-center font-bold text-brand-300 text-sm flex-shrink-0">
                      {c.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">@{c.username}</div>
                      <div className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
                        <span>{PLATFORM_LABELS[c.platform]}</span>
                        {c.niche && <><span>·</span><span>{c.niche}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.last_analyzed_at && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(c.last_analyzed_at).toLocaleDateString()}
                      </div>
                    )}
                    {/* Compare button */}
                    {hasComparison ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs"
                        onClick={() => toggleComparison(c.id)}
                      >
                        <GitCompareArrows className="w-3.5 h-3.5" />
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Compare
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs border-white/10 hover:border-brand-500/50"
                        onClick={() => runComparison(c.id)}
                        disabled={isComparing}
                      >
                        {isComparing
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <GitCompareArrows className="w-3.5 h-3.5" />}
                        {isComparing ? "Analyzing..." : "Compare"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Followers</div>
                    <div className="font-semibold">{c.followers ? formatNumber(c.followers) : "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <BarChart2 className="w-3 h-3" /> Engagement
                    </div>
                    <div className="font-semibold">
                      {c.avg_engagement_rate != null
                        ? `${(c.avg_engagement_rate * 100).toFixed(2)}%`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Posts/week
                    </div>
                    <div className="font-semibold">
                      {c.posts_per_week != null ? c.posts_per_week.toFixed(1) : "—"}
                    </div>
                  </div>
                </div>

                {/* Top hashtags */}
                {c.top_hashtags.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Top hashtags
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.top_hashtags.slice(0, 10).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono">
                          #{tag}
                        </span>
                      ))}
                      {c.top_hashtags.length > 10 && (
                        <span className="text-xs text-muted-foreground">+{c.top_hashtags.length - 10} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* No analysis warning */}
                {!c.avg_engagement_rate && !c.followers && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-white/5 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Profile data unavailable. The scraper may be offline. Comparison will use available data.
                  </div>
                )}

                {/* Inline comparison panel */}
                {hasComparison && isExpanded && comparisons[c.id] && (
                  <ComparisonPanel
                    comparison={comparisons[c.id]!}
                    onClose={() => toggleComparison(c.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && competitors.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-2">
          Data is pulled from public profiles. Engagement rates are estimated from visible interactions. Refreshed every 24h.
        </p>
      )}
    </div>
  );
}
