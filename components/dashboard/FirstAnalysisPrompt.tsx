import Link from "next/link";
import { BarChart3, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Account {
  id: string;
  platform: string;
  username: string;
}

interface Props {
  accounts: Account[];
}

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵",
  instagram: "📸",
  youtube: "▶️",
  facebook: "👥",
};

export default function FirstAnalysisPrompt({ accounts }: Props) {
  const firstAccount = accounts[0];

  return (
    <div className="glass rounded-2xl p-8 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center mx-auto">
        <BarChart3 className="w-7 h-7 text-brand-400" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">You're connected — now run your first analysis</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          We'll fetch your last 50 posts, analyze your hooks, hashtags, and engagement patterns, and build your growth score.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-white/5 rounded-full px-4 py-2">
        <Clock className="w-3.5 h-3.5" />
        Takes about 30–60 seconds
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button asChild className="gap-2 bg-brand-600 hover:bg-brand-500">
          <Link href={`/dashboard/analyze?account=${firstAccount?.id ?? ""}`}>
            Analyze {firstAccount ? `@${firstAccount.username}` : "my account"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        {accounts.length === 1 && (
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href="/dashboard/settings">
              {PLATFORM_ICONS[firstAccount.platform]} {firstAccount.platform} connected
            </Link>
          </Button>
        )}
      </div>

      {accounts.length > 1 && (
        <p className="text-xs text-muted-foreground">
          {accounts.length} accounts connected —{" "}
          {accounts.map((a) => `${PLATFORM_ICONS[a.platform] ?? ""} @${a.username}`).join(", ")}
        </p>
      )}
    </div>
  );
}
