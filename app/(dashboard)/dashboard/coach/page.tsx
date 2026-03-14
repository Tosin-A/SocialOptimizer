"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import CoachChat from "@/components/dashboard/CoachChat";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { requiredPlanFor } from "@/lib/plans/feature-gate";

export default function CoachPage() {
  const { access, loading: accessLoading } = useFeatureAccess();
  const [accounts, setAccounts] = useState<Array<{ id: string; platform: string; username: string }>>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.data ?? []))
      .finally(() => setAccountsLoading(false));
  }, []);

  if (accessLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!access.coach) {
    const requiredPlan = requiredPlanFor("coach");
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Content Coach</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Get personalized, data-backed coaching for your content strategy.
          Available on the <span className="capitalize font-medium text-foreground">{requiredPlan}</span> plan and above.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-400" /> Content Coach
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ask specific questions about your page — the coach knows your metrics
        </p>
      </div>
      <CoachChat accounts={accounts} />
    </div>
  );
}
