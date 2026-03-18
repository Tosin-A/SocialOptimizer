"use client";
import { useState, useEffect, useCallback } from "react";
import { Target, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ExperimentCard from "@/components/dashboard/ExperimentCard";
import WinLibrary from "@/components/dashboard/WinLibrary";
import ScoreHistoryChart from "@/components/dashboard/ScoreHistoryChart";
import type { Experiment, WinLibraryEntry, Platform } from "@/types";
import UpgradeGate from "@/components/dashboard/UpgradeGate";

interface Account { id: string; platform: string; username: string; }

type Tab = "experiments" | "scores" | "wins";

export default function TrackPage() {
  const [tab, setTab] = useState<Tab>("experiments");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [wins, setWins] = useState<WinLibraryEntry[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewExp, setShowNewExp] = useState(false);
  const [showNewWin, setShowNewWin] = useState(false);
  const { toast } = useToast();

  // New experiment form
  const [expName, setExpName] = useState("");
  const [expHypothesis, setExpHypothesis] = useState("");
  const [expAccount, setExpAccount] = useState("");
  const [expPlatform, setExpPlatform] = useState<Platform>("tiktok");

  // New win form
  const [winTag, setWinTag] = useState("");
  const [winNotes, setWinNotes] = useState("");
  const [winPlatform, setWinPlatform] = useState<Platform>("tiktok");

  useEffect(() => {
    fetch("/api/accounts").then((r) => r.json()).then((d) => {
      const accts = d.data ?? [];
      setAccounts(accts);
      if (accts[0]) {
        setExpAccount(accts[0].id);
        setExpPlatform(accts[0].platform as Platform);
      }
    });
    loadExperiments();
    loadReports();
  }, []);

  const loadExperiments = async () => {
    const res = await fetch("/api/track/experiments");
    const data = await res.json();
    setExperiments(data.data ?? []);
  };

  const loadWins = useCallback(async () => {
    const res = await fetch("/api/track/wins");
    const data = await res.json();
    setWins(data.data ?? []);
  }, []);

  const loadReports = async () => {
    const res = await fetch("/api/reports");
    const data = await res.json();
    setReports((data.data ?? []).slice(0, 6));
  };

  useEffect(() => {
    if (tab === "wins" && wins.length === 0) loadWins();
  }, [tab]);

  const createExperiment = async () => {
    if (!expName || !expHypothesis || !expAccount) {
      toast({ title: "Fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/track/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: expAccount,
          name: expName,
          hypothesis: expHypothesis,
          platform: expPlatform,
          start_date: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExperiments((prev) => [data.data, ...prev]);
      setShowNewExp(false);
      setExpName("");
      setExpHypothesis("");
      toast({ title: "Experiment started" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast({ title: "Failed to create experiment", description: message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const updateExperiment = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/track/experiments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, end_date: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Update failed");
      await loadExperiments();
      toast({ title: `Experiment ${status}` });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const deleteExperiment = async (id: string) => {
    await fetch(`/api/track/experiments/${id}`, { method: "DELETE" });
    setExperiments((prev) => prev.filter((e) => e.id !== id));
  };

  const createWin = async () => {
    if (!winTag || !winNotes) {
      toast({ title: "Fill in tag and notes", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/track/wins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "manual", platform: winPlatform, tag: winTag, notes: winNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWins((prev) => [data.data, ...prev]);
      setShowNewWin(false);
      setWinTag("");
      setWinNotes("");
      toast({ title: "Win saved" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast({ title: "Failed to save win", description: message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const deleteWin = async (id: string) => {
    await fetch(`/api/track/wins?id=${id}`, { method: "DELETE" });
    setWins((prev) => prev.filter((w) => w.id !== id));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "experiments", label: "Experiments" },
    { id: "scores", label: "Score History" },
    { id: "wins", label: "Win Library" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-brand-400" /> Track
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Run experiments, track score changes, and save what works
        </p>
      </div>

      <UpgradeGate feature="track">

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              tab === t.id ? "bg-brand-600 text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Experiments */}
      {tab === "experiments" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowNewExp(!showNewExp)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New experiment
            </Button>
          </div>

          {showNewExp && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold">Start a new experiment</h3>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input placeholder="e.g. Rewrite all hooks as questions" value={expName} onChange={(e) => setExpName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select value={expAccount} onValueChange={(v) => {
                    setExpAccount(v);
                    const acct = accounts.find((a) => a.id === v);
                    if (acct) setExpPlatform(acct.platform as Platform);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select account..." /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="capitalize">{a.platform}</span> @{a.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Hypothesis</Label>
                  <Input
                    placeholder="e.g. Opening with a question will increase hook score by 20+ points"
                    value={expHypothesis}
                    onChange={(e) => setExpHypothesis(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createExperiment} disabled={loading} className="gap-2" size="sm">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Start experiment
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowNewExp(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {experiments.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No experiments yet</h3>
              <p className="text-muted-foreground text-sm">
                Create an experiment to test a specific change and measure its impact.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {experiments.map((exp) => (
                <ExperimentCard
                  key={exp.id}
                  experiment={exp}
                  onComplete={(id) => updateExperiment(id, "completed")}
                  onCancel={(id) => updateExperiment(id, "cancelled")}
                  onDelete={deleteExperiment}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Score History */}
      {tab === "scores" && (
        <div className="space-y-4">
          {reports.length >= 2 ? (
            <ScoreHistoryChart reports={reports} />
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Need at least 2 analyses to show score history. Run more analyses to track your progress.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Win Library */}
      {tab === "wins" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowNewWin(!showNewWin)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add win
            </Button>
          </div>

          {showNewWin && (
            <div className="glass rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold">Save a win</h3>
              <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Tag</Label>
                  <Input placeholder="e.g. hook-rewrite, hashtag-cut" value={winTag} onChange={(e) => setWinTag(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={winPlatform} onValueChange={(v) => setWinPlatform(v as Platform)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-3 space-y-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="What worked and why"
                    value={winNotes}
                    onChange={(e) => setWinNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createWin} disabled={loading} className="gap-2" size="sm">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save win
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowNewWin(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <WinLibrary wins={wins} onDelete={deleteWin} />
        </div>
      )}

      </UpgradeGate>
    </div>
  );
}
