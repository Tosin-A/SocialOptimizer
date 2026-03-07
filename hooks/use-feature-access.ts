"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlanType } from "@/types";
import { getFeatureAccess, type FeatureAccess } from "@/lib/plans/feature-gate";

export function useFeatureAccess() {
  const [plan, setPlan] = useState<PlanType>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("users")
          .select("plan")
          .eq("auth_id", user.id)
          .single();

        if (data?.plan) setPlan(data.plan as PlanType);
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, []);

  const access: FeatureAccess = getFeatureAccess(plan);

  return { plan, access, loading };
}
