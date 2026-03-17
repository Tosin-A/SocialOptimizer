"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BarChart3, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AnalysisReport from "@/components/dashboard/AnalysisReport";
import CSVImportUpload from "@/components/dashboard/CSVImportUpload";
import PlatformConnect from "@/components/dashboard/PlatformConnect";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface Account { id: string; platform: string; username: string; avatar_url: string | null; }
interface Job { job_id: string; status: string; progress: number; current_step: string | null; report_id: string | null; error_message: string | null; }

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto p-6"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>}>
      <AnalyzePageInner />
    </Suspense>
  );
}

interface UserPlan { plan: string; analyses_used: number; analyses_limit: number; has_billing?: boolean; }

function AnalyzePageInner() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [maxPosts, setMaxPosts] = useState(50);
  const [job, setJob] = useState<Job | null>(null);
  const [report, setReport] = useState<any>(null);
  const [starting, setStarting] = useState(false);
  const pollCleanupRef = useRef<(() => void) | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const fetchAccounts = useCallback(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.data ?? []);
        setUserPlan(d.user_plan ?? null);
        const preSelected = searchParams.get("account");
        if (preSelected) setSelectedAccount(preSelected);
        else if (d.data?.[0]) setSelectedAccount(d.data[0].id);
      });
  }, [searchParams]);

  useEffect(() => () => {
    pollCleanupRef.current?.();
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const pollJob = useCallback(
    (jobId: string) => {
      let polling = false;
      const poll = async (): Promise<boolean> => {
        if (polling) return false;
        polling = true;
        try {
          const res = await fetch(`/api/analyze?job_id=${jobId}`);
          const data = await res.json();
          setJob(data);

          if (data.status === "completed") {
            const reportId = data.report_id;
            toast({
              title: "Analysis complete",
              description: "Your report is ready.",
              action: reportId ? (
                <ToastAction asChild altText="View report">
                  <Link href={`/dashboard/reports/${reportId}`}>View report</Link>
                </ToastAction>
              ) : (
                <ToastAction asChild altText="Go to reports">
                  <Link href="/dashboard/reports">View reports</Link>
                </ToastAction>
              ),
            });
            if (reportId) {
              const reportRes = await fetch(`/api/reports?id=${reportId}`);
              const reportData = await reportRes.json();
              setReport(reportData.data);
            }
            fetchAccounts(); // refresh usage count
            return true;
          }
          if (data.status === "failed") {
            toast({ title: "Analysis failed", description: data.error_message ?? "Unknown error", variant: "destructive" });
            return true;
          }
          return false;
        } finally {
          polling = false;
        }
      };

      poll(); // immediate first poll
      const interval = setInterval(() => {
        poll().then((done) => {
          if (done) clearInterval(interval);
        });
      }, 3000);
      return () => clearInterval(interval);
    },
    [toast, fetchAccounts]
  );

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
      pollCleanupRef.current?.();
      pollCleanupRef.current = pollJob(data.job_id);
    } catch (err: any) {
      toast({ title: "Failed to start analysis", description: err.message, variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };

  const isRunning = job && ["pending", "processing"].includes(job.status);
  const isFreePlan = (userPlan?.plan ?? "free") === "free";
  const maxPostsAllowed = isFreePlan ? 10 : 100;

  useEffect(() => {
    if (maxPosts > maxPostsAllowed) {
      setMaxPosts(maxPostsAllowed);
    }
  }, [maxPosts, maxPostsAllowed]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-400" /> Content Analysis
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Deep AI analysis of your posts, hashtags, and engagement patterns</p>
        </div>
        {userPlan && (
          <div className="text-sm text-muted-foreground">
            <span className="font-mono text-foreground">{userPlan.analyses_used}</span> used ·{" "}
            <span className="font-mono text-brand-400">{Math.max(0, userPlan.analyses_limit - userPlan.analyses_used)}</span> left
          </div>
        )}
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
            max={maxPostsAllowed}
            step={10}
            value={maxPosts}
            onChange={(e) => setMaxPosts(parseInt(e.target.value))}
            disabled={!!isRunning}
            className="w-full accent-brand-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>10 (faster)</span>
            <span>{maxPostsAllowed} {isFreePlan ? "(free plan cap)" : "(thorough)"}</span>
          </div>
          {isFreePlan && (
            <div className="mt-3 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between gap-3">
              <span>Free plan analyzes up to the last 10 posts. Upgrade to unlock deeper analysis depth.</span>
              <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs border-brand-500/40">
                <Link href="/dashboard/settings">Upgrade</Link>
              </Button>
            </div>
          )}
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
                <span className="capitalize">
                  {job.status === "completed" ? "Complete" : job.status}
                </span>
                {job.current_step && isRunning && (
                  <span className="text-muted-foreground">&middot; {job.current_step}</span>
                )}
              </div>
              <span className="font-mono text-brand-400">{job.progress ?? 0}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-neon-purple rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, job.progress ?? 0)}%` }}
              />
            </div>
            {isRunning && (
              <p className="text-xs text-muted-foreground">
                We&apos;ll email you as soon as the analysis is complete, with direct links to your report and printable PDF view.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              You can also view all generated reports anytime in{" "}
              <Link href="/dashboard/reports" className="text-brand-400 hover:text-brand-300 underline-offset-2 hover:underline">
                Reports
              </Link>.
            </p>
          </div>
        )}
      </div>

      {/* Report */}
      {report && <AnalysisReport report={report} accountId={selectedAccount} />}

      {/* CSV Import & Connect account */}
      {!job && !report && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">Or import from CSV</span>
            </div>
          </div>
          <CSVImportUpload
            onImportComplete={(result) => {
              setAccounts((prev) => {
                fetch("/api/accounts")
                  .then((r) => r.json())
                  .then((d) => {
                    setAccounts(d.data ?? []);
                    setSelectedAccount(result.account_id);
                  });
                return prev;
              });
            }}
          />
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">Or connect with OAuth</span>
            </div>
          </div>
          <div className="mt-6">
            <PlatformConnect
              mode="add"
              connectedAccounts={accounts}
              onDisconnect={(id) => {
                setAccounts((prev) => prev.filter((a) => a.id !== id));
                if (selectedAccount === id) setSelectedAccount("");
              }}
            />
          </div>
        </>
      )}

      {/* Empty state */}
      {!job && !report && accounts.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">No analysis yet</h3>
          <p className="text-muted-foreground text-sm">
            Connect an account above or import a CSV to run your first analysis.
          </p>
        </div>
      )}
    </div>
  );
}
