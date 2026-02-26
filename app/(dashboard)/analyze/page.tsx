"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AnalysisReport from "@/components/dashboard/AnalysisReport";
import { useToast } from "@/hooks/use-toast";

interface Account { id: string; platform: string; username: string; avatar_url: string | null; }
interface Job { job_id: string; status: string; progress: number; current_step: string | null; report_id: string | null; error_message: string | null; }

export default function AnalyzePage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [maxPosts, setMaxPosts] = useState(50);
  const [job, setJob] = useState<Job | null>(null);
  const [report, setReport] = useState<any>(null);
  const [starting, setStarting] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.data ?? []);
        const preSelected = searchParams.get("account");
        if (preSelected) setSelectedAccount(preSelected);
        else if (d.data?.[0]) setSelectedAccount(d.data[0].id);
      });
  }, []);

  const pollJob = useCallback(async (jobId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/analyze?job_id=${jobId}`);
      const data = await res.json();
      setJob(data);

      if (data.status === "completed") {
        clearInterval(interval);
        if (data.report_id) {
          const reportRes = await fetch(`/api/reports?id=${data.report_id}`);
          const reportData = await reportRes.json();
          setReport(reportData.data);
        }
      } else if (data.status === "failed") {
        clearInterval(interval);
        toast({ title: "Analysis failed", description: data.error_message, variant: "destructive" });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [toast]);

  const startAnalysis = async () => {
    if (!selectedAccount) return;
    setStarting(true);
    setReport(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: selectedAccount, max_posts: maxPosts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJob({ job_id: data.job_id, status: "pending", progress: 0, current_step: "Starting...", report_id: null, error_message: null });
      pollJob(data.job_id);
    } catch (err: any) {
      toast({ title: "Failed to start analysis", description: err.message, variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };

  const isRunning = job && ["pending", "processing"].includes(job.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-400" /> Content Analysis
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Deep AI analysis of your posts, hashtags, and engagement patterns</p>
      </div>

      {/* Control panel */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Select account to analyze</label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount} disabled={!!isRunning}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Choose a connected account..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex items-center gap-2">
                      <span className="capitalize">{a.platform}</span>
                      <span className="text-muted-foreground">@{a.username}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={startAnalysis}
            disabled={!selectedAccount || !!isRunning || starting}
            className="gap-2"
          >
            {starting || isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isRunning ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>

        {/* Posts depth slider */}
        <div className="mt-5 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Posts to analyze</label>
            <span className="font-mono text-sm text-brand-400">{maxPosts} posts</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={10}
            value={maxPosts}
            onChange={(e) => setMaxPosts(parseInt(e.target.value))}
            disabled={!!isRunning}
            className="w-full accent-brand-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>10 (faster)</span>
            <span>100 (thorough)</span>
          </div>
        </div>

        {/* Job progress */}
        {job && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {job.status === "completed" && <CheckCircle2 className="w-4 h-4 text-neon-green" />}
                {job.status === "failed" && <XCircle className="w-4 h-4 text-destructive" />}
                {isRunning && <Loader2 className="w-4 h-4 animate-spin text-brand-400" />}
                {job.status === "processing" && <AlertCircle className="w-4 h-4 text-yellow-400" />}
                <span className="capitalize">{job.status}</span>
                {job.current_step && <span className="text-muted-foreground">— {job.current_step}</span>}
              </div>
              <span className="font-mono text-brand-400">{job.progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-neon-purple rounded-full transition-all duration-500"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Report */}
      {report && <AnalysisReport report={report} accountId={selectedAccount} />}

      {/* Empty state */}
      {!job && !report && (
        <div className="glass rounded-2xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No analysis yet</h3>
          <p className="text-muted-foreground text-sm">
            Select an account above and run your first analysis to get a complete growth breakdown.
          </p>
        </div>
      )}
    </div>
  );
}
