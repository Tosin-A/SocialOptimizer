import { Users, TrendingUp, BarChart2, Zap, Calendar, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStats, ConnectedAccount } from "@/types";

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵", instagram: "📸", youtube: "▶️", facebook: "👥",
};

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

interface Props {
  stats: DashboardStats;
  accounts: Pick<ConnectedAccount, "id" | "platform" | "username" | "followers">[];
  className?: string;
}

export default function MetricsGrid({ stats, accounts, className }: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Connected accounts */}
      <div className="glass rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-3">Connected accounts</p>
        <div className="flex flex-wrap gap-2">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg text-sm">
              <span>{PLATFORM_ICONS[a.platform] ?? "🌐"}</span>
              <span className="font-medium">@{a.username}</span>
              {a.followers && (
                <span className="text-muted-foreground text-xs">{formatCount(a.followers)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <MetricCard
          icon={Users}
          label="Total followers"
          value={formatCount(stats.total_followers)}
          color="bg-brand-600/20 text-brand-400"
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg engagement rate"
          value={`${(stats.avg_engagement_rate * 100).toFixed(2)}%`}
          sub="across all platforms"
          color="bg-neon-green/10 text-neon-green"
        />
        <MetricCard
          icon={BarChart2}
          label="Posts analyzed"
          value={stats.total_posts_analyzed.toString()}
          color="bg-neon-purple/10 text-neon-purple"
        />
        <MetricCard
          icon={Zap}
          label="Pending actions"
          value={stats.pending_actions.toString()}
          sub="in your roadmap"
          color="bg-yellow-400/10 text-yellow-400"
        />
        <MetricCard
          icon={Target}
          label="Niche"
          value={stats.niche ?? "—"}
          color="bg-neon-cyan/10 text-neon-cyan"
        />
        <MetricCard
          icon={Calendar}
          label="Platforms"
          value={stats.connected_accounts.toString()}
          sub="connected"
          color="bg-neon-pink/10 text-neon-pink"
        />
      </div>
    </div>
  );
}
