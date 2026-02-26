"use client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface ReportSummary {
  id: string;
  growth_score: number;
  created_at: string;
  connected_accounts?: { platform: string; username: string } | null;
}

interface Props {
  reports: ReportSummary[];
  className?: string;
}

interface TooltipPayload {
  value: number;
  payload: { date: string; score: number; label: string };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground mb-0.5">{d.date}</p>
      {d.label && <p className="text-muted-foreground mb-0.5">{d.label}</p>}
      <p className="font-semibold text-brand-300 text-base">{d.score}</p>
      <p className="text-muted-foreground">Growth score</p>
    </div>
  );
}

export default function ScoreHistoryChart({ reports, className = "" }: Props) {
  if (reports.length < 2) return null;

  // Oldest first so the line reads left-to-right
  const sorted = [...reports].reverse();

  const chartData = sorted.map((r) => ({
    date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: r.growth_score,
    label: r.connected_accounts
      ? `${r.connected_accounts.platform} @${r.connected_accounts.username}`
      : undefined,
  }));

  const scores = chartData.map((d) => d.score);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);
  const latest = scores[scores.length - 1];
  const first = scores[0];
  const delta = latest - first;

  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-400" />
          <h3 className="font-semibold text-sm">Score history</h3>
          <span className="text-xs text-muted-foreground">{reports.length} analyses</span>
        </div>
        {delta !== 0 && (
          <span className={`text-xs font-semibold ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {delta > 0 ? "+" : ""}{delta} pts overall
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minScore, maxScore]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#4f46e5", strokeWidth: 1, strokeDasharray: "4 2" }} />
          {/* Reference line at score=50 */}
          <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 2" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#818cf8"
            strokeWidth={2}
            dot={{ fill: "#818cf8", r: 3, strokeWidth: 0 }}
            activeDot={{ fill: "#c7d2fe", r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
