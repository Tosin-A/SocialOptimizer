"use client";
import { Trophy, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WinLibraryEntry } from "@/types";

interface Props {
  wins: WinLibraryEntry[];
  onDelete?: (id: string) => void;
}

export default function WinLibrary({ wins, onDelete }: Props) {
  if (!wins?.length) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No wins saved yet. Add outliers or experiments that worked to your win library.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {wins.map((win) => (
        <div key={win.id} className="glass rounded-xl p-4 flex items-start gap-3">
          <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded">{win.tag}</span>
              <span className="text-xs text-muted-foreground capitalize">{win.platform}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(win.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{win.notes}</p>
            {win.source && <p className="text-xs text-muted-foreground mt-1">Source: {win.source}</p>}
          </div>
          <button
            onClick={() => onDelete?.(win.id)}
            className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
