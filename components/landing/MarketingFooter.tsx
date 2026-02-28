import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.05] py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold text-foreground/70">
          <div className="w-5 h-5 rounded bg-brand-500/80 flex items-center justify-center">
            <BarChart3 className="w-3 h-3 text-white" />
          </div>
          SocialOptimizer
          <span className="font-normal text-muted-foreground ml-1">&copy; 2026</span>
        </div>
        <div className="flex gap-6 text-xs">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms"   className="hover:text-foreground transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
