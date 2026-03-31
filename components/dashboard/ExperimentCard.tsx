"use client";
import { Beaker, Play, CheckCircle2, XCircle, Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Experiment } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  experiment: Experiment;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusConfig = {
  draft: { icon: Pause, color: "text-muted-foreground", bg: "bg-muted" },
  running: { icon: Play, color: "text-blue-400", bg: "bg-blue-600/10" },
  completed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10" },
};

export default function ExperimentCard({ experiment, onComplete, onCancel, onDelete }: Props) {
  const config = statusConfig[experiment.status];
  const StatusIcon = config.icon;

  const baselineScore = experiment.baseline_metrics?.growth_score;
  const resultScore = experiment.result_metrics?.growth_score;
  const delta = baselineScore != null && resultScore != null ? resultScore - baselineScore : null;

  return (
    <div className={cn("glass rounded-xl p-4 space-y-3 border", experiment.status === "running" ? "border-blue-500/20" : "border-border")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
            <StatusIcon className={cn("w-4 h-4", config.color)} />
          </div>
          <div>
            <h4 className="font-medium text-sm">{experiment.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{experiment.hypothesis}</p>
          </div>
        </div>
        <span className={cn("text-xs px-2 py-0.5 rounded capitalize", config.bg, config.color)}>
          {experiment.status}
        </span>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="capitalize">{experiment.platform}</span>
        <span>Started {new Date(experiment.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        {experiment.end_date && (
          <span>Ended {new Date(experiment.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        )}
      </div>

      {/* Baseline vs Result */}
      {baselineScore != null && (
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Baseline: </span>
            <span className="font-mono">{baselineScore}</span>
          </div>
          {resultScore != null && (
            <>
              <div>
                <span className="text-muted-foreground">Result: </span>
                <span className="font-mono">{resultScore}</span>
              </div>
              {delta != null && (
                <div className={cn("font-mono font-semibold", delta > 0 ? "text-emerald-500" : delta < 0 ? "text-red-400" : "text-muted-foreground")}>
                  {delta > 0 ? "+" : ""}{delta} pts
                </div>
              )}
            </>
          )}
        </div>
      )}

      {experiment.outcome && (
        <p className="text-xs text-blue-300 leading-relaxed">{experiment.outcome}</p>
      )}

      {/* Actions */}
      {experiment.status === "running" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => onComplete?.(experiment.id)}>
            <CheckCircle2 className="w-3 h-3" /> Complete
          </Button>
          <Button size="sm" variant="ghost" className="text-xs gap-1 text-muted-foreground" onClick={() => onCancel?.(experiment.id)}>
            <XCircle className="w-3 h-3" /> Cancel
          </Button>
        </div>
      )}
      {(experiment.status === "completed" || experiment.status === "cancelled") && (
        <Button size="sm" variant="ghost" className="text-xs gap-1 text-red-400" onClick={() => onDelete?.(experiment.id)}>
          <Trash2 className="w-3 h-3" /> Delete
        </Button>
      )}
    </div>
  );
}
