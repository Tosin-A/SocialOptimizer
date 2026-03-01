"use client";
import { useState, useEffect } from "react";
import { Settings, User, CreditCard, Link2, Trash2, Loader2, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
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

const PLAN_LABELS: Record<string, { label: string; color: string; description: string; price: string }> = {
  free:    { label: "Free",    color: "text-muted-foreground", description: "1 platform · 3 analyses/month · basic insights", price: "$0" },
  starter: { label: "Starter", color: "text-slate-300",        description: "2 platforms · 20 analyses/month · 5 competitors", price: "$29/mo" },
  pro:     { label: "Pro",     color: "text-brand-400",        description: "4 platforms · unlimited analyses · 20 competitors", price: "$79/mo" },
  agency:  { label: "Agency",  color: "text-neon-purple",      description: "10 platforms · unlimited analyses · 50 competitors · white-label reports", price: "$199/mo" },
};

export default function SettingsPage() {
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

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setName(user.user_metadata?.full_name ?? "");
      }
      const accountsRes = await fetch("/api/accounts");
      const accountsData = await accountsRes.json();
      setAccounts(accountsData.data ?? []);
      if (accountsData.user_plan) {
        setUserPlan(accountsData.user_plan);
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
  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const usagePercent = userPlan
    ? Math.min(100, Math.round((userPlan.analyses_used / Math.max(1, userPlan.analyses_limit)) * 100))
    : 0;
  const isUnlimited = (userPlan?.analyses_limit ?? 0) >= 999999;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            <p className="text-xs text-muted-foreground">Email changes aren't supported yet.</p>
          </div>
          <Button type="submit" size="sm" disabled={savingProfile} className="gap-2">
            {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </Button>
        </form>
      </div>

      {/* Plan */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
          <CreditCard className="w-4 h-4" /> Plan &amp; Usage
        </h2>

        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`font-semibold text-lg ${planInfo.color}`}>{planInfo.label}</span>
            <p className="text-sm text-muted-foreground mt-0.5">{planInfo.description}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {plan === "free" && (
              <Button
                size="sm"
                className="bg-brand-600 hover:bg-brand-500 gap-1.5"
                disabled={checkoutLoading === "starter"}
                onClick={() => startCheckout("starter")}
              >
                {checkoutLoading === "starter"
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ArrowUpRight className="w-3.5 h-3.5" />}
                Upgrade to Starter — $29/mo
              </Button>
            )}
            {plan === "starter" && (
              <Button
                size="sm"
                className="bg-brand-600 hover:bg-brand-500 gap-1.5"
                disabled={checkoutLoading === "pro"}
                onClick={() => startCheckout("pro")}
              >
                {checkoutLoading === "pro"
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ArrowUpRight className="w-3.5 h-3.5" />}
                Upgrade to Pro — $79/mo
              </Button>
            )}
            {(plan === "starter" || plan === "pro") && (
              <Button
                size="sm"
                variant="outline"
                className="border-white/[0.1] gap-1.5"
                disabled={checkoutLoading === "agency"}
                onClick={() => startCheckout("agency")}
              >
                {checkoutLoading === "agency"
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <ArrowUpRight className="w-3.5 h-3.5" />}
                {plan === "starter" ? "Agency — $199/mo" : "Upgrade to Agency"}
              </Button>
            )}
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
        </div>

        {/* Usage meter */}
        {userPlan && (
          <div className="pt-3 border-t border-white/5 space-y-1.5">
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
            {plan === "free" && (
              <p className="text-xs text-muted-foreground pt-1">
                Starter is $29/mo. Pro is $79/mo. Cancel any time. No awkward retention flow.
              </p>
            )}
          </div>
        )}
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
                Removes all your data permanently. This can't be undone.
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
                    // Sign out and redirect to home
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
