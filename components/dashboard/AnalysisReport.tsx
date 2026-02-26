"use client";
import { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, Lightbulb, Map, Hash,
  ThumbsUp, AlertTriangle, BarChart2, TrendingUp, TrendingDown,
  Minus, ExternalLink, Loader2, Download
} from "lucide-react";
import type { AnalysisReport as AnalysisReportType, Insight, RoadmapAction } from "@/types";
import { cn } from "@/lib/utils";

const SCORE_ITEMS = [
  { key: "content_quality_score", label: "Content Quality" },
  { key: "hook_strength_score", label: "Hook Strength" },
  { key: "hashtag_score", label: "Hashtag Strategy" },
  { key: "engagement_score", label: "Engagement" },
  { key: "consistency_score", label: "Consistency" },
  { key: "branding_score", label: "Branding" },
  { key: "cta_score", label: "CTA Usage" },
];

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "bg-neon-green" : score >= 45 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{score}/100</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function InsightCard({ insight, type }: { insight: Insight; type: "strength" | "weakness" | "opportunity" }) {
  const configs = {
    strength: { icon: CheckCircle2, color: "text-neon-green", bg: "bg-neon-green/5 border-neon-green/20" },
    weakness: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/5 border-red-400/20" },
    opportunity: { icon: Lightbulb, color: "text-yellow-400", bg: "bg-yellow-400/5 border-yellow-400/20" },
  };
  const c = configs[type];

  return (
    <div className={cn("border rounded-xl p-4 space-y-2", c.bg)}>
      <div className="flex items-center gap-2">
        <c.icon className={cn("w-4 h-4 flex-shrink-0", c.color)} />
        <h4 className="font-medium text-sm">{insight.title}</h4>
        <span className={cn("ml-auto text-xs px-2 py-0.5 rounded-full",
          insight.impact === "high" ? "bg-red-400/15 text-red-400" :
          insight.impact === "medium" ? "bg-yellow-400/15 text-yellow-400" :
          "bg-blue-400/15 text-blue-400"
        )}>{insight.impact}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
      {insight.recommendation && (
        <p className="text-xs text-brand-300 leading-relaxed">
          <span className="font-medium">Fix:</span> {insight.recommendation}
        </p>
      )}
      {insight.metric && (
        <p className="text-xs font-mono text-muted-foreground">{insight.metric}</p>
      )}
    </div>
  );
}

function RoadmapItem({ action, index }: { action: RoadmapAction; index: number }) {
  const categoryColors: Record<string, string> = {
    content: "bg-brand-600/20 text-brand-300",
    hashtags: "bg-neon-purple/20 text-neon-purple",
    posting: "bg-neon-cyan/20 text-neon-cyan",
    engagement: "bg-neon-green/20 text-neon-green",
    branding: "bg-neon-pink/20 text-neon-pink",
  };

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
          {index + 1}
        </div>
        <div className="w-px flex-1 bg-white/5 mt-1" />
      </div>
      <div className="pb-6 flex-1">
        <div className="flex items-start gap-2 mb-1.5 flex-wrap">
          <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", categoryColors[action.category] ?? "bg-white/10 text-foreground")}>
            {action.category}
          </span>
          <span className="text-xs text-muted-foreground">{action.timeframe}</span>
        </div>
        <p className="text-sm font-medium mb-1">{action.action}</p>
        <p className="text-xs text-neon-green">{action.expected_impact}</p>
      </div>
    </div>
  );
}

interface PostRow {
  id: string;
  platform_post_id: string;
  content_type: string;
  caption: string | null;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  engagement_rate: number | null;
  posted_at: string;
  thumbnail_url: string | null;
  media_url: string | null;
  duration_seconds: number | null;
  performance: "top" | "worst" | "average";
}

interface Props { report: AnalysisReportType; }

export default function AnalysisReport({ report }: Props) {
  const [tab, setTab] = useState<"overview" | "insights" | "roadmap" | "hashtags" | "posts">("overview");
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsFetched, setPostsFetched] = useState(false);

  useEffect(() => {
    if (tab === "posts" && !postsFetched) {
      setPostsLoading(true);
      fetch(`/api/reports/${report.id}/posts`)
        .then((r) => r.json())
        .then((d) => { setPosts(d.data ?? []); setPostsFetched(true); })
        .finally(() => setPostsLoading(false));
    }
  }, [tab, report.id, postsFetched]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "insights", label: `Insights (${(report.strengths?.length ?? 0) + (report.weaknesses?.length ?? 0)})` },
    { id: "roadmap", label: `Roadmap (${report.improvement_roadmap?.length ?? 0})` },
    { id: "hashtags", label: "Hashtags" },
    { id: "posts", label: "Posts" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Executive summary */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1">
            <BarChart2 className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1.5">Executive Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.executive_summary}</p>
            </div>
          </div>
          <a
            href={`/dashboard/reports/${report.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Niche", value: report.detected_niche },
            { label: "Avg Engagement", value: `${(report.avg_engagement_rate * 100).toFixed(2)}%` },
            { label: "Posts/Week", value: report.avg_posts_per_week.toFixed(1) },
            { label: "Best Days", value: report.best_days.slice(0, 2).join(", ") },
          ].map((m) => (
            <div key={m.label} className="text-center bg-white/5 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
              <p className="font-semibold text-sm">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              tab === t.id ? "bg-brand-600 text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-sm">Score Breakdown</h3>
          <div className="space-y-3">
            {SCORE_ITEMS.map(({ key, label }) => (
              <ScoreBar key={key} label={label} score={(report as any)[key] ?? 0} />
            ))}
          </div>
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-sm font-medium mb-3">Top performing formats</h4>
            <div className="flex flex-wrap gap-2">
              {report.top_performing_formats?.map((f) => (
                <span key={f} className="bg-brand-600/20 text-brand-300 px-3 py-1 rounded-full text-xs capitalize">{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "insights" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-neon-green" /> What you're doing well
            </h3>
            {report.strengths?.map((s, i) => <InsightCard key={i} insight={s} type="strength" />)}
          </div>
          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> What you need to fix
            </h3>
            {report.weaknesses?.map((w, i) => <InsightCard key={i} insight={w} type="weakness" />)}
          </div>
          {report.opportunities?.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" /> Growth opportunities
              </h3>
              {report.opportunities.map((o, i) => <InsightCard key={i} insight={o} type="opportunity" />)}
            </div>
          )}
        </div>
      )}

      {tab === "roadmap" && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-6">
            <Map className="w-4 h-4 text-brand-400" /> Your prioritized growth roadmap
          </h3>
          <div>
            {report.improvement_roadmap?.map((action, i) => (
              <RoadmapItem key={i} action={action} index={i} />
            ))}
          </div>
        </div>
      )}

      {tab === "posts" && (
        <div className="glass rounded-2xl p-6 space-y-3">
          <h3 className="font-semibold text-sm mb-1">Post-level performance</h3>
          <p className="text-xs text-muted-foreground mb-4">Sorted by engagement rate. Top performers are highlighted green, underperformers red.</p>

          {postsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
            </div>
          )}

          {!postsLoading && posts.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">No post data found for this report.</p>
          )}

          {!postsLoading && posts.length > 0 && (
            <div className="space-y-2">
              {posts.map((post) => {
                const engPct = ((post.engagement_rate ?? 0) * 100).toFixed(2);
                const date = new Date(post.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const caption = post.caption?.replace(/\n/g, " ").slice(0, 80) ?? "—";

                return (
                  <div
                    key={post.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3 border text-xs transition-all",
                      post.performance === "top"
                        ? "border-neon-green/20 bg-neon-green/5"
                        : post.performance === "worst"
                        ? "border-red-400/20 bg-red-400/5"
                        : "border-white/5 bg-white/[0.02]"
                    )}
                  >
                    {/* Performance icon */}
                    <div className="flex-shrink-0 w-5">
                      {post.performance === "top" && <TrendingUp className="w-4 h-4 text-neon-green" />}
                      {post.performance === "worst" && <TrendingDown className="w-4 h-4 text-red-400" />}
                      {post.performance === "average" && <Minus className="w-4 h-4 text-white/20" />}
                    </div>

                    {/* Caption + date */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-muted-foreground">{caption}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-white/30">
                        <span className="capitalize">{post.content_type}</span>
                        <span>·</span>
                        <span>{date}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-shrink-0 flex items-center gap-4 text-right">
                      <div>
                        <p className={cn("font-mono font-semibold",
                          post.performance === "top" ? "text-neon-green" :
                          post.performance === "worst" ? "text-red-400" : "text-foreground"
                        )}>
                          {engPct}%
                        </p>
                        <p className="text-white/30">eng. rate</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="font-mono">{post.views.toLocaleString()}</p>
                        <p className="text-white/30">views</p>
                      </div>
                      <div className="hidden md:block">
                        <p className="font-mono">{post.likes.toLocaleString()}</p>
                        <p className="text-white/30">likes</p>
                      </div>
                      {post.media_url && (
                        <a
                          href={post.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/20 hover:text-white/60 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "hashtags" && (
        <div className="glass rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-brand-400" /> Recommended hashtags to add
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.recommended_hashtags?.map((h) => (
                <span key={h} className="bg-neon-green/10 border border-neon-green/20 text-neon-green px-3 py-1 rounded-full text-xs">{h}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-red-400">Overused hashtags (reduce)</h3>
            <div className="flex flex-wrap gap-2">
              {report.overused_hashtags?.slice(0, 15).map((h) => (
                <span key={h} className="bg-red-400/10 border border-red-400/20 text-red-400 px-3 py-1 rounded-full text-xs">{h}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">Hashtag effectiveness details</h3>
            <div className="space-y-2">
              {report.hashtag_effectiveness?.slice(0, 15).map((h) => (
                <div key={h.tag} className="flex items-center gap-3 text-xs">
                  <span className="w-28 text-muted-foreground truncate">{h.tag}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${h.reach_score}%` }}
                    />
                  </div>
                  <span className={cn("w-16 text-right",
                    h.recommendation === "keep" ? "text-neon-green" :
                    h.recommendation === "add" ? "text-brand-400" : "text-red-400"
                  )}>
                    {h.recommendation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
