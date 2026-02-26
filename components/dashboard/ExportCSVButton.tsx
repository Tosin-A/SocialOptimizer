"use client";
import { Download } from "lucide-react";

interface ReportRow {
  id: string;
  growth_score: number;
  engagement_score: number;
  content_quality_score: number;
  hashtag_score: number;
  hook_strength_score: number;
  avg_engagement_rate: number;
  avg_posts_per_week: number;
  detected_niche: string | null;
  executive_summary: string | null;
  created_at: string;
  connected_accounts: {
    platform: string;
    username: string;
    followers: number | null;
  } | null;
}

function escapeCSV(val: string | number | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ExportCSVButton({ reports }: { reports: ReportRow[] }) {
  const handleExport = () => {
    const headers = [
      "Date", "Platform", "Username", "Followers",
      "Growth Score", "Engagement Score", "Content Quality",
      "Hashtag Score", "Hook Strength",
      "Avg Engagement Rate (%)", "Posts/Week",
      "Detected Niche", "Executive Summary",
    ];

    const rows = reports.map((r) => {
      const account = r.connected_accounts;
      return [
        new Date(r.created_at).toLocaleDateString("en-US"),
        account?.platform ?? "",
        account?.username ? `@${account.username}` : "",
        account?.followers ?? "",
        r.growth_score,
        r.engagement_score,
        r.content_quality_score,
        r.hashtag_score,
        r.hook_strength_score,
        ((r.avg_engagement_rate ?? 0) * 100).toFixed(2),
        (r.avg_posts_per_week ?? 0).toFixed(1),
        r.detected_niche ?? "",
        r.executive_summary ?? "",
      ].map(escapeCSV);
    });

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `socialoptimizer-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-all"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
