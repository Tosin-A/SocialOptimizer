"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, User, CreditCard, Link2, Trash2, Loader2, CheckCircle2, AlertTriangle, ArrowUpRight, Check, Minus } from "lucide-react";
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
      "3 analyses / month",
      "1 connected platform",
      "5 content generations",
      "Basic growth score",
    ],
    missing: ["Competitor tracking", "Unlimited analyses", "Multi-platform"],
    accent: false,
  },
  {
    key: "starter",
    label: "Starter",
    price: "$29",
    cadence: "/month",
    color: "text-slate-300",
    features: [
      "20 analyses / month",
      "2 connected platforms",
      "5 competitor profiles",
      "Content generation",
      "Full growth score breakdown",
    ],
    missing: ["Unlimited analyses", "White-label reports"],
    accent: false,
  },
  {
    key: "pro",
    label: "Pro",
    price: "$79",
    cadence: "/month",
    color: "text-brand-400",
    features: [
      "Unlimited analyses",
      "4 platforms simultaneously",
      "20 competitor profiles",
      "Competitor gap analysis",
      "Unlimited content generation",
      "Full ranked fix roadmap",
      "Email support",
    ],
    missing: [],
    accent: true,
  },
  {
    key: "agency",
    label: "Agency",
    price: "$199",
    cadence: "/month",
    color: "text-neon-purple",
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
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>}>
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
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const autoCheckoutTriggered = useRef(false);

  const fetchPlanData = async (): Promise<UserPlan | null> => {
    const accountsRes = await fetch("/api/accounts");
    const accountsData = await accountsRes.json();
    setAccounts(accountsData.data ?? []);
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
          <Settings className="w-6 h-6 text-brand-400" /> Settings
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
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Analyses this month</span>
              <span className="font-mono">
                {isUnlimited ? `${userPlan.analyses_used} / ∞` : `${userPlan.analyses_used} / ${userPlan.analyses_limit}`}
              </span>
            </div>
            {!isUnlimited && (
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-brand-500"}`}
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
                className={`rounded-lg p-4 flex flex-col border ${
                  isCurrent
                    ? "border-brand-500/40 bg-brand-950/20"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold text-sm ${tier.color}`}>{tier.label}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
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
                      <Check className="w-3 h-3 text-brand-400 flex-shrink-0 mt-0.5" />
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
                  <Button size="sm" variant="outline" disabled className="w-full border-brand-500/20 text-brand-400 text-xs">
                    Current plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    size="sm"
                    className={`w-full gap-1.5 text-xs ${
                      tier.accent
                        ? "bg-brand-500 hover:bg-brand-600 text-white font-semibold"
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
                    className="w-full border-white/[0.07] text-muted-foreground text-xs"
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

        {accounts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm mb-4">No platforms connected yet.</p>
            <Button size="sm" asChild>
              <a href="/dashboard">Connect a platform</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-neon-green" />
                  </div>
                  <div>
                    <div className="text-sm font-medium capitalize">{a.platform}</div>
                    <div className="text-xs text-muted-foreground">
                      @{a.username}
                      {a.followers != null && ` · ${a.followers.toLocaleString()} followers`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => disconnectAccount(a.id, a.platform)}
                  disabled={disconnecting === a.id}
                  className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  {disconnecting === a.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
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
                    toast({ title: "Deletion failed", description: "Try again or contact support.", variant: "destructive" });
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
