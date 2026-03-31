"use client";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  delta: number;
  niche: string | null;
  lastAnalyzedAt: string | null;
  accountId?: string;
  className?: string;
}

function getScoreColor(score: number) {
  if (score >= 75) return { text: "text-emerald-500", bg: "from-emerald-500", ring: "#10b981" };
  if (score >= 50) return { text: "text-yellow-400", bg: "from-yellow-400", ring: "#facc15" };
  if (score >= 25) return { text: "text-orange-400", bg: "from-orange-400", ring: "#fb923c" };
  return { text: "text-red-400", bg: "from-red-400", ring: "#f87171" };
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Average";
  if (score >= 25) return "Needs Work";
  return "Critical";
}

export default function GrowthScoreCard({ score, delta, niche, lastAnalyzedAt, accountId, className }: Props) {
  const colors = getScoreColor(score);
  const label = getScoreLabel(score);
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("glass rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center space-y-4", className)}>
      <div className="text-sm font-medium text-muted-foreground">Growth Score</div>

      {/* Circular progress */}
      <div className="relative w-28 h-28 sm:w-36 sm:h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Track */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={colors.ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-4xl font-bold", colors.text)}>{score}</span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>

      {/* Delta */}
      <div className="flex items-center gap-1.5 text-sm">
        {delta > 0 ? (
          <><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-emerald-500">+{delta} pts</span></>
        ) : delta < 0 ? (
          <><TrendingDown className="w-4 h-4 text-red-400" /><span className="text-red-400">{delta} pts</span></>
        ) : (
          <><Minus className="w-4 h-4 text-muted-foreground" /><span className="text-muted-foreground">No change</span></>
        )}
        <span className="text-muted-foreground text-xs">vs last report</span>
      </div>

      {/* Niche */}
      {niche && (
        <div className="bg-blue-600/15 border border-blue-600/20 rounded-full px-3 py-1 text-xs text-blue-300">
          {niche}
        </div>
      )}

      {/* Last analyzed */}
      {lastAnalyzedAt && (
        <p className="text-xs text-muted-foreground">
          Analyzed{" "}
          {new Date(lastAnalyzedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}

      {/* Analyze button */}
      <Button size="sm" variant="outline" className="w-full gap-2 text-xs" asChild>
        <Link href={accountId ? `/dashboard/analyze?account=${accountId}` : "/dashboard/analyze"}>
          <RefreshCw className="w-3 h-3" /> Run new analysis
        </Link>
      </Button>
    </div>
  );
}
