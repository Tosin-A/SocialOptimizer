"use client";
import Link from "next/link";
import { BarChart3, Wand2, UserPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuickActions({ hasAccounts }: { hasAccounts: boolean }) {
  if (!hasAccounts) {
    return (
      <Button asChild>
        <Link href="/dashboard/settings"><Plus className="w-4 h-4 mr-2" />Connect account</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/generate"><Wand2 className="w-3.5 h-3.5 mr-1.5" />Generate</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/dashboard/analyze"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Analyze</Link>
      </Button>
    </div>
  );
}
