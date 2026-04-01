"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, User, CreditCard, Link2, Trash2, Loader2, CheckCircle2, AlertTriangle, ArrowUpRight, Check, Minus, Sparkles, X, RefreshCw, Bell } from "lucide-react";
import PlatformConnect from "@/components/dashboard/PlatformConnect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Account {
  id: string;
  platform: string;
  username: string;
  followers: number | null;
  is_active: boolean;
}

interface UserPlan {
  plan: string;
  analyses_used: number;
  analyses_limit: number;
  has_billing: boolean;
}

const VALID_CHECKOUT_PLANS = ["starter", "pro", "agency"] as const;

const ALL_PLANS = [
  {
    key: "free",
    label: "Free",
    price: "$0",
    cadence: "forever",
    color: "text-muted-foreground",
    features: [
      "1 analysis / month",
      "1 connected platform",
      "5 content generations",
      "Basic growth score + fix list",
    ],
    missing: ["Discover module", "Track module", "Competitors"],
    accent: false,
  },
  {
    key: "starter",
    label: "Starter",
    badge: "Most Popular",
    price: "$19",
    cadence: "/month",
    color: "text-blue-400",
    features: [
      "10 analyses / month",
      "2 connected platforms",
      "Discover (outliers, trends)",
      "50 content generations / month",
      "Hook writer + caption builder",
      "Track (experiments, win library)",
    ],
    missing: ["Competitors", "Unlimited analyses"],
    accent: true,
  },
  {
    key: "pro",
    label: "Pro",
    price: "$49",
    cadence: "/month",
    color: "text-slate-300",
    features: [
      "Unlimited analyses",
      "4 platforms simultaneously",
      "Up to 3 competitor profiles",
      "Competitor gap + outliers",
      "Unlimited content generation",
      "All Discover & Track features",
      "Email support",
    ],
    missing: [],
    accent: false,
  },
  {
    key: "agency",
    label: "Agency",
    price: "$199",
    cadence: "/month",
    color: "text-blue-400",
    features: [
      "Unlimited analyses",
      "Up to 10 accounts",
      "50 competitor profiles",
      "White-label PDF reports",
      "API access",
      "Priority support",
    ],
    missing: [],
    accent: false,
  },
];

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const [user, setUser] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [brandPillars, setBrandPillars] = useState<string[]>([]);
  const [pillarInput, setPillarInput] = useState("");
  const [savingPillars, setSavingPillars] = useState(false);
  const [syncingPillars, setSyncingPillars] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [pillarsLoaded, setPillarsLoaded] = useState(false);
  const [emailAnalysis, setEmailAnalysis] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [savingNotifs, setSavingNotifs] = useState(false);
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const autoCheckoutTriggered = useRef(false);

  const fetchPlanData = async (): Promise<UserPlan | null> => {
    const accountsRes = await fetch("/api/accounts", {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    const accountsData = await accountsRes.json();
    setAccounts(accountsData.data ?? []);
    setAccountsLoaded(true);
    if (accountsData.user_plan) {
      setUserPlan(accountsData.user_plan);
      return accountsData.user_plan;
    }
    return null;
  };

  const startCheckout = async (targetPlan: string) => {
    setCheckoutLoading(targetPlan);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", plan: targetPlan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setCheckoutLoading(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setName(user.user_metadata?.full_name ?? "");
      }

      const currentPlan = await fetchPlanData();

      // Fetch brand pillars
      try {
        const pillarsRes = await fetch("/api/brand-pillars");
        const pillarsData = await pillarsRes.json();
        if (pillarsData.data) setBrandPillars(pillarsData.data);
      } catch {}
      setPillarsLoaded(true);

      // Fetch email notification preferences
      try {
        const notifsRes = await fetch("/api/notifications/preferences");
        const notifsData = await notifsRes.json();
        if (notifsData.data) {
          setEmailAnalysis(notifsData.data.email_analysis_notifications);
          setEmailDigest(notifsData.data.email_weekly_digest);
        }
      } catch {}

      // Handle OAuth error redirects
      const oauthError = searchParams.get("error");
      if (oauthError) {
        const messages: Record<string, string> = {
          oauth_denied: "You declined the authorization request.",
          no_code: "No authorization code received from the platform.",
          invalid_state: "Session expired. Try connecting again.",
          connection_failed: "Could not connect your account. Try again.",
        };
        toast({
          title: "Connection failed",
          description: messages[oauthError] ?? "Something went wrong. Try again.",
          variant: "destructive",
        });
        window.history.replaceState({}, "", "/dashboard/settings");
      }

      // Handle return from OAuth connection
      const connectedPlatform = searchParams.get("connected");
      if (connectedPlatform) {
        // Re-fetch accounts — retry a few times in case DB write hasn't propagated yet
        let found = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          const freshRes = await fetch("/api/accounts", {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          });
          const freshData = await freshRes.json();
          const freshAccounts: Account[] = freshData.data ?? [];
          if (freshAccounts.some((a) => a.platform === connectedPlatform && a.is_active)) {
            setAccounts(freshAccounts);
            if (freshData.user_plan) setUserPlan(freshData.user_plan);
            found = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 800));
        }
        if (!found) {
          // Fallback: set whatever we got from the last fetch
          await fetchPlanData();
        }
        const platformName = connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1);
        toast({ title: `${platformName} connected`, description: "Your account is linked and ready for analysis" });
        window.history.replaceState({}, "", "/dashboard/settings");
      }

      // Handle return from Stripe checkout — poll until webhook updates the plan
      const upgradedTo = searchParams.get("upgraded");
      if (
        upgradedTo &&
        VALID_CHECKOUT_PLANS.includes(upgradedTo as any) &&
        currentPlan?.plan !== upgradedTo
      ) {
        toast({ title: "Processing your upgrade...", description: "Confirming payment with Stripe" });

        // Poll up to 10 times (every 2s = ~20s max) waiting for webhook
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          const updated = await fetchPlanData();
          if (updated?.plan === upgradedTo || attempts >= 10) {
            clearInterval(poll);
            if (updated?.plan === upgradedTo) {
              toast({
                title: `Upgraded to ${upgradedTo.charAt(0).toUpperCase() + upgradedTo.slice(1)}`,
                description: "Your plan is now active",
              });
            } else {
              toast({
                title: "Upgrade may take a moment",
                description: "Refresh the page in a few seconds if your plan hasn't updated",
              });
            }
            // Clean URL params
            window.history.replaceState({}, "", "/dashboard/settings");
          }
        }, 2000);
        return;
      }

      // Auto-trigger checkout if ?checkout=plan is in URL (from signup flow)
      const autoCheckout = searchParams.get("checkout");
      if (
        autoCheckout &&
        VALID_CHECKOUT_PLANS.includes(autoCheckout as any) &&
        !autoCheckoutTriggered.current
      ) {
        autoCheckoutTriggered.current = true;
        setTimeout(() => startCheckout(autoCheckout), 500);
      }
    };
    load();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
      if (error) throw error;
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const disconnectAccount = async (accountId: string, platform: string) => {
    setDisconnecting(accountId);
    try {
      const res = await fetch(`/api/accounts?id=${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      toast({ title: `${platform} disconnected` });
    } catch (err: any) {
      toast({ title: "Couldn't disconnect", description: err.message, variant: "destructive" });
    } finally {
      setDisconnecting(null);
    }
  };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to open portal");
      window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Couldn't open billing portal", description: err.message, variant: "destructive" });
      setPortalLoading(false);
    }
  };

  const plan = userPlan?.plan ?? "free";
  const usagePercent = userPlan
    ? Math.min(100, Math.round((userPlan.analyses_used / Math.max(1, userPlan.analyses_limit)) * 100))
    : 0;
  const isUnlimited = (userPlan?.analyses_limit ?? 0) >= 999999;

  const planIndex = ALL_PLANS.findIndex((p) => p.key === plan);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-400" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account, plan, and connected platforms</p>
      </div>

      {/* Profile */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <User className="w-4 h-4" /> Profile
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email changes aren&apos;t supported yet.</p>
          </div>
          <Button type="submit" size="sm" disabled={savingProfile} className="gap-2">
            {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </Button>
        </form>
      </div>

      {/* Brand Profile */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Sparkles className="w-4 h-4" /> Brand Profile
        </h2>
        <p className="text-xs text-muted-foreground">
          These pillars define your content identity and feed into content generation.
          {accounts.length > 1 && " Pillars are shared across all connected accounts."}
        </p>

        {pillarsLoaded && brandPillars.length === 0 && !pillarInput && (
          <p className="text-sm text-muted-foreground/60">
            {accounts.length > 0
              ? "Run an analysis on a connected account to auto-generate pillars, or add them manually."
              : "Connect an account and run your first analysis to auto-generate brand pillars, or add them manually."}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {brandPillars.map((pillar, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 bg-blue-600/20 text-blue-300 px-3 py-1.5 rounded-full text-sm"
            >
              {pillar}
              <button
                onClick={() => setBrandPillars((prev) => prev.filter((_, idx) => idx !== i))}
                className="hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {brandPillars.length < 5 && (
          <div className="flex gap-2">
            <Input
              placeholder="Add a pillar (e.g. fitness, nutrition)"
              value={pillarInput}
              onChange={(e) => setPillarInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pillarInput.trim().length >= 2) {
                  e.preventDefault();
                  setBrandPillars((prev) => [...prev, pillarInput.trim()]);
                  setPillarInput("");
                }
              }}
              className="max-w-xs"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={pillarInput.trim().length < 2 || brandPillars.length >= 5}
              onClick={() => {
                setBrandPillars((prev) => [...prev, pillarInput.trim()]);
                setPillarInput("");
              }}
            >
              Add
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          {brandPillars.length > 0 && (
            <Button
              size="sm"
              disabled={savingPillars}
              className="gap-2"
              onClick={async () => {
                setSavingPillars(true);
                try {
                  const res = await fetch("/api/brand-pillars", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pillars: brandPillars }),
                  });
                  if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error ?? "Failed to save");
                  }
                  toast({ title: "Brand pillars saved" });
                } catch (err: any) {
                  toast({ title: "Couldn't save pillars", description: err.message, variant: "destructive" });
                } finally {
                  setSavingPillars(false);
                }
              }}
            >
              {savingPillars && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save pillars
            </Button>
          )}
          {accounts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={syncingPillars}
              className="gap-2"
              onClick={async () => {
                setSyncingPillars(true);
                try {
                  const res = await fetch("/api/brand-pillars", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "sync" }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error ?? "Failed to sync");
                  setBrandPillars(data.data);
                  toast({ title: "Pillars synced from all analyses" });
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : "Sync failed";
                  toast({ title: "Couldn't sync pillars", description: message, variant: "destructive" });
                }  finally {
                  setSyncingPillars(false);
                }
              }}
            >
              {syncingPillars ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Re-sync from analyses
            </Button>
          )}
        </div>
      </div>

      {/* Plan & Usage */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
            <CreditCard className="w-4 h-4" /> Plan &amp; Usage
          </h2>
          {plan !== "free" && userPlan?.has_billing && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-50"
              onClick={openBillingPortal}
              disabled={portalLoading}
            >
              {portalLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Manage billing
            </button>
          )}
        </div>

        {/* Usage meter */}
        {userPlan && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Analyses this month</span>
              <span>
                <span className="font-mono text-foreground">{userPlan.analyses_used}</span>
                <span className="text-muted-foreground"> used · </span>
                <span className="font-mono text-blue-400">{isUnlimited ? "∞" : Math.max(0, userPlan.analyses_limit - userPlan.analyses_used)}</span>
                <span className="text-muted-foreground"> left</span>
              </span>
            </div>
            {!isUnlimited && (
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-blue-500"}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Full plan comparison grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {ALL_PLANS.map((tier, idx) => {
            const isCurrent = tier.key === plan;
            const isUpgrade = idx > planIndex;
            const isDowngrade = idx < planIndex;

            return (
              <div
                key={tier.key}
                className={`rounded-lg p-4 flex flex-col border relative ${
                  isCurrent
                    ? "border-blue-500/40 bg-blue-950/20"
                    : tier.accent
                    ? "border-blue-500/30 bg-blue-950/10 ring-1 ring-blue-500/20"
                    : "border-border bg-card"
                }`}
              >
                {"badge" in tier && tier.badge && !isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-semibold text-white bg-blue-500 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                      {tier.badge}
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold text-sm ${tier.color}`}>{tier.label}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
                        current
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono font-semibold text-2xl tabular-nums">{tier.price}</span>
                    <span className="text-muted-foreground text-xs">{tier.cadence}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 mb-4">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-xs">
                      <Check className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {tier.missing.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-xs text-muted-foreground/35">
                      <Minus className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-40" />
                      <span className="line-through">{f}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <Button size="sm" variant="outline" disabled className="w-full border-blue-500/20 text-blue-400 text-xs">
                    Current plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    size="sm"
                    className={`w-full gap-1.5 text-xs ${
                      tier.accent
                        ? "bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                        : "bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1]"
                    }`}
                    disabled={checkoutLoading === tier.key}
                    onClick={() => startCheckout(tier.key)}
                  >
                    {checkoutLoading === tier.key
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <ArrowUpRight className="w-3 h-3" />}
                    Upgrade — {tier.price}{tier.cadence !== "forever" ? tier.cadence : ""}
                  </Button>
                ) : isDowngrade ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-border text-muted-foreground text-xs"
                    onClick={openBillingPortal}
                    disabled={portalLoading || !userPlan?.has_billing}
                  >
                    Downgrade via billing portal
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          All paid plans cancel any time. No retention flow. No &quot;are you sure?&quot; email.
        </p>
      </div>

      {/* Connected accounts */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Link2 className="w-4 h-4" /> Connected platforms
        </h2>

        {!accountsLoaded ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          </div>
        ) : (
          <PlatformConnect
            mode={accounts.length === 0 ? "initial" : "add"}
            connectedAccounts={accounts}
            embedded
            onDisconnect={(id) => {
              setAccounts((prev) => prev.filter((a) => a.id !== id));
              toast({ title: "Platform disconnected" });
            }}
          />
        )}
      </div>

      {/* Email notifications */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <Bell className="w-4 h-4" /> Email notifications
        </h2>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-sm font-medium">Analysis complete</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get emailed when your analysis report is ready</p>
            </div>
            <button
              role="switch"
              aria-checked={emailAnalysis}
              disabled={savingNotifs}
              onClick={async () => {
                const next = !emailAnalysis;
                setEmailAnalysis(next);
                setSavingNotifs(true);
                try {
                  const res = await fetch("/api/notifications/preferences", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email_analysis_notifications: next }),
                  });
                  if (!res.ok) throw new Error();
                  toast({ title: next ? "Analysis emails enabled" : "Analysis emails disabled" });
                } catch {
                  setEmailAnalysis(!next);
                  toast({ title: "Failed to update", variant: "destructive" });
                } finally {
                  setSavingNotifs(false);
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailAnalysis ? "bg-blue-500" : "bg-white/10"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                emailAnalysis ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-sm font-medium">Weekly digest</p>
              <p className="text-xs text-muted-foreground mt-0.5">Monday summary of your growth scores and engagement</p>
            </div>
            <button
              role="switch"
              aria-checked={emailDigest}
              disabled={savingNotifs}
              onClick={async () => {
                const next = !emailDigest;
                setEmailDigest(next);
                setSavingNotifs(true);
                try {
                  const res = await fetch("/api/notifications/preferences", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email_weekly_digest: next }),
                  });
                  if (!res.ok) throw new Error();
                  toast({ title: next ? "Weekly digest enabled" : "Weekly digest disabled" });
                } catch {
                  setEmailDigest(!next);
                  toast({ title: "Failed to update", variant: "destructive" });
                } finally {
                  setSavingNotifs(false);
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailDigest ? "bg-blue-500" : "bg-white/10"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                emailDigest ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl p-6 border border-red-500/20 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-red-400">
          <AlertTriangle className="w-4 h-4" /> Danger zone
        </h2>
        {!showDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Removes all your data permanently. This can&apos;t be undone.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete account
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400">
              Are you sure? This deletes your account, all analysis reports, and connected platforms. No way back.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/accounts?delete_user=1", { method: "DELETE" });
                    if (!res.ok) throw new Error("Deletion failed");
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  } catch {
                    toast({ title: "Deletion failed", description: "Try again or contact support at cloutai.support@gmail.com", variant: "destructive" });
                  }
                }}
              >
                Yes, delete everything
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
