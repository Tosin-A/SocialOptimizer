"use client";
import { useState, useEffect } from "react";
import { Users, Plus, TrendingUp, TrendingDown, Minus, Loader2, BarChart2, Hash, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/utils";

type Platform = "tiktok" | "instagram" | "youtube" | "facebook";

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

const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
};

function DeltaBadge({ value, unit = "" }: { value: number; unit?: string }) {
  if (value === 0) return <span className="text-muted-foreground text-xs flex items-center gap-1"><Minus className="w-3 h-3" /> no gap</span>;
  const positive = value > 0;
  return (
    <span className={`text-xs flex items-center gap-1 ${positive ? "text-red-400" : "text-neon-green"}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? "+" : ""}{value > 0 ? value.toFixed(1) : Math.abs(value).toFixed(1)}{unit} {positive ? "behind" : "ahead"}
    </span>
  );
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [username, setUsername] = useState("");
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
    } catch (err: any) {
      toast({ title: "Couldn't add competitor", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
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
            We'll pull their public profile data — followers, posting cadence, hashtags, engagement rate.
            Data refreshes every 24 hours.
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
          {competitors.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-5">
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
                {c.last_analyzed_at && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(c.last_analyzed_at).toLocaleDateString()}
                  </div>
                )}
              </div>

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
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      {!loading && competitors.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-2">
          Data is pulled from public profiles. Engagement rates are estimated from visible interactions. Last refreshed every 24h.
        </p>
      )}
    </div>
  );
}
