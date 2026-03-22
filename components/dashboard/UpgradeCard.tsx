"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

interface Props {
  analysesLimit: number;
}

export default function UpgradeCard({ analysesLimit }: Props) {
  const extraAnalyses = 10 - analysesLimit;

  return (
    <div className="rounded-xl border border-brand-600/30 bg-brand-600/5 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-600/20 p-2 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            You&apos;re leaving data on the table
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            This month you could have: {extraAnalyses > 0 && <>{extraAnalyses} more analyses, </>}AI coaching, competitor tracking, trend discovery, and 47 more content ideas — starting at $19/month.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-500 transition-colors"
          >
            See plans
          </Link>
        </div>
      </div>
    </div>
  );
}
