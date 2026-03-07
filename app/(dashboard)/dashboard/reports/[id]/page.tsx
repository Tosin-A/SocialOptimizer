"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AnalysisReport from "@/components/dashboard/AnalysisReport";

export default function ReportViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/reports?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setReport(data.data);
        } else {
          setError("Report not found");
        }
      })
      .catch(() => setError("Failed to load report"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        <p className="text-sm text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center">
        <p className="text-destructive mb-4">{error ?? "Report not found"}</p>
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to reports
        </Link>
      </div>
    );
  }

  const accountId = (report as any).account_id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/dashboard/reports"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to reports
      </Link>
      <AnalysisReport report={report} accountId={accountId} />
    </div>
  );
}
