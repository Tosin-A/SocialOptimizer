"use client";
import { useState, useEffect } from "react";
import { Settings, User, CreditCard, Link2, Trash2, Loader2, CheckCircle2, ExternalLink, AlertTriangle } from "lucide-react";
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

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "text-muted-foreground" },
  pro: { label: "Pro", color: "text-brand-400" },
  agency: { label: "Agency", color: "text-neon-purple" },
};

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setName(user.user_metadata?.full_name ?? "");
      }
      const res = await fetch("/api/accounts");
      const data = await res.json();
      setAccounts(data.data ?? []);
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

  const plan = user?.user_metadata?.plan ?? "free";
  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.free;

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
          <CreditCard className="w-4 h-4" /> Plan
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-lg ${planInfo.color}`}>{planInfo.label}</span>
              {plan === "free" && (
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                  3 analyses/month
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {plan === "free"
                ? "1 platform, basic insights, 5 content generations/month"
                : plan === "pro"
                  ? "4 platforms, unlimited analyses and generations, competitor tracking"
                  : "Up to 10 accounts, white-label reports, API access"}
            </p>
          </div>
          {plan === "free" && (
            <Button size="sm" className="bg-brand-600 hover:bg-brand-500 gap-1.5 flex-shrink-0">
              Upgrade to Pro <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
          {plan !== "free" && (
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Manage billing
            </button>
          )}
        </div>
        {plan === "free" && (
          <div className="pt-2 border-t border-white/5 text-xs text-muted-foreground">
            Pro is $29/mo. You can cancel any time — no awkward retention flow.
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
                onClick={() => toast({ title: "Account deletion not yet implemented", description: "Contact support to delete your account.", variant: "destructive" })}
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
