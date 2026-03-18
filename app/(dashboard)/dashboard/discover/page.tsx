"use client";
import { useState, useEffect, useCallback } from "react";
import { Compass, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import OutlierFeed from "@/components/dashboard/OutlierFeed";
import TrendVelocityFeed from "@/components/dashboard/TrendVelocityFeed";
import NicheSaturationCard from "@/components/dashboard/NicheSaturationCard";
import FormatPatternLibrary from "@/components/dashboard/FormatPatternLibrary";
import type { OutlierPost, TrendItem, NicheSaturation, FormatPattern, Platform } from "@/types";
import UpgradeGate from "@/components/dashboard/UpgradeGate";

interface Account {
  id: string;
  platform: string;
  username: string;
}

type Tab = "outliers" | "trends" | "saturation" | "formats";

export default function DiscoverPage() {
  const [tab, setTab] = useState<Tab>("outliers");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const { toast } = useToast();

  // Data states
  const [outliers, setOutliers] = useState<OutlierPost[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [saturation, setSaturation] = useState<NicheSaturation | null>(null);
  const [formats, setFormats] = useState<FormatPattern[]>([]);

  // Loading states
  const [outlierLoading, setOutlierLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [satLoading, setSatLoading] = useState(false);
  const [formatLoading, setFormatLoading] = useState(false);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const accts = d.data ?? [];
        setAccounts(accts);
        if (accts[0]) {
          setSelectedAccount(accts[0].id);
          setPlatform(accts[0].platform as Platform);
        }
      });
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      const acct = accounts.find((a) => a.id === selectedAccount);
      if (acct) setPlatform(acct.platform as Platform);
      loadOutliers();
    }
  }, [selectedAccount]);

  const loadOutliers = useCallback(async () => {
    setOutlierLoading(true);
    try {
      const res = await fetch("/api/discover/outliers");
      const data = await res.json();
      setOutliers(data.data ?? []);
    } catch {
      // silent
    } finally {
      setOutlierLoading(false);
    }
  }, []);

  const detectOutliers = async () => {
    if (!selectedAccount) return;
    setOutlierLoading(true);
    try {
      const res = await fetch("/api/discover/outliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: selectedAccount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutliers(data.data ?? []);
      toast({ title: `Found ${data.data?.length ?? 0} outliers` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Detection failed";
      toast({ title: "Outlier detection failed", description: message, variant: "destructive" });
    } finally {
      setOutlierLoading(false);
    }
  };

  const loadTrends = useCallback(async () => {
    setTrendLoading(true);
    try {
      const res = await fetch(`/api/discover/trends?platform=${platform}`);
      const data = await res.json();
      setTrends(data.data ?? []);
    } catch {
      // silent
    } finally {
      setTrendLoading(false);
    }
  }, [platform]);

  const loadSaturation = useCallback(async () => {
    if (!selectedAccount) return;
    setSatLoading(true);
    try {
      // Get niche from latest report
      const reportsRes = await fetch("/api/reports");
      const reportsData = await reportsRes.json();
      const latest = reportsData.data?.[0];
      const niche = latest?.detected_niche ?? "general";

      const res = await fetch(`/api/discover/saturation?niche=${encodeURIComponent(niche)}&platform=${platform}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaturation(data.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast({ title: "Saturation check failed", description: message, variant: "destructive" });
    } finally {
      setSatLoading(false);
    }
  }, [selectedAccount, platform, toast]);

  const loadFormats = useCallback(async () => {
    if (!selectedAccount) return;
    setFormatLoading(true);
    try {
      const res = await fetch(`/api/discover/formats?account_id=${selectedAccount}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormats(data.data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      toast({ title: "Format analysis failed", description: message, variant: "destructive" });
    } finally {
      setFormatLoading(false);
    }
  }, [selectedAccount, toast]);

  useEffect(() => {
    if (tab === "trends") loadTrends();
    if (tab === "saturation") loadSaturation();
    if (tab === "formats") loadFormats();
  }, [tab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "outliers", label: "Outliers" },
    { id: "trends", label: "Trends" },
    { id: "saturation", label: "Niche Saturation" },
    { id: "formats", label: "Format Library" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Compass className="w-6 h-6 text-brand-400" /> Discover
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Find outliers, spot trends, assess niche saturation, and understand format performance
        </p>
      </div>

      <UpgradeGate feature="discover">
        <div className="space-y-6">
          <div className="flex justify-end">
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select account..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="capitalize">{a.platform}</span> @{a.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto scrollbar-hide">
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

          {/* Tab content */}
          {tab === "outliers" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={detectOutliers}
                  disabled={!selectedAccount || outlierLoading}
                  size="sm"
                  className="gap-2"
                >
                  {outlierLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Detect outliers
                </Button>
              </div>
              {outlierLoading && outliers.length === 0 ? (
                <div className="glass rounded-2xl p-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                </div>
              ) : (
                <OutlierFeed outliers={outliers} />
              )}
            </div>
          )}

          {tab === "trends" && (
            trendLoading ? (
              <div className="glass rounded-2xl p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
              </div>
            ) : (
              <TrendVelocityFeed trends={trends} />
            )
          )}

          {tab === "saturation" && (
            <div className="space-y-4">
              {!saturation && !satLoading && (
                <div className="flex justify-end">
                  <Button onClick={loadSaturation} disabled={!selectedAccount || satLoading} size="sm" className="gap-2">
                    {satLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Analyze saturation
                  </Button>
                </div>
              )}
              <NicheSaturationCard data={saturation} loading={satLoading} />
            </div>
          )}

          {tab === "formats" && (
            <div className="space-y-4">
              {formats.length === 0 && !formatLoading && (
                <div className="flex justify-end">
                  <Button onClick={loadFormats} disabled={!selectedAccount || formatLoading} size="sm" className="gap-2">
                    {formatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Analyze formats
                  </Button>
                </div>
              )}
              <FormatPatternLibrary patterns={formats} loading={formatLoading} />
            </div>
          )}
        </div>
      </UpgradeGate>
    </div>
  );
}
