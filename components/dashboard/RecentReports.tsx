import Link from "next/link";
import { FileText, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵", instagram: "📸", youtube: "▶️", facebook: "👥",
};

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className={cn(
      "px-2 py-0.5 rounded-full text-xs font-bold",
      score >= 70 ? "bg-neon-green/10 text-neon-green" :
      score >= 45 ? "bg-yellow-400/10 text-yellow-400" :
      "bg-red-400/10 text-red-400"
    )}>
      {score}
    </div>
  );
}

interface Report {
  id: string;
  growth_score: number;
  detected_niche: string;
  created_at: string;
  connected_accounts: { platform: string; username: string } | null;
}

interface Props { reports: Report[]; }

export default function RecentReports({ reports }: Props) {
  return (
    <div className="glass rounded-2xl flex flex-col">
      <div className="p-5 border-b border-white/5">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-400" /> Recent Reports
        </h3>
      </div>

      <div className="flex-1 divide-y divide-white/5">
        {reports.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No reports yet — run your first analysis
          </div>
        )}
        {reports.map((r, i) => {
          const prev = reports[i + 1];
          const delta = prev ? r.growth_score - prev.growth_score : 0;
          const acc = r.connected_accounts;

          return (
            <Link
              key={r.id}
              href={`/dashboard/analyze?report=${r.id}`}
              className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group"
            >
              <span className="text-xl">{acc ? PLATFORM_ICONS[acc.platform] ?? "🌐" : "🌐"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {acc ? `@${acc.username}` : "Unknown account"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.detected_niche} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {delta !== 0 && (
                  delta > 0
                    ? <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
                    : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                )}
                <ScoreBadge score={r.growth_score} />
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <Link
          href="/dashboard/analyze"
          className="text-xs text-brand-400 hover:underline flex items-center gap-1 justify-center"
        >
          View all reports <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
