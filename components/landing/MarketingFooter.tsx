import Link from "next/link";
import Image from "next/image";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.05] py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-3 text-foreground/70">
          <Image src="/logo.png" alt="CLOUT" width={64} height={20} className="rounded-lg shadow-[0_0_24px_8px_rgba(0,0,0,0.5)]" />
          <span className="font-normal text-muted-foreground">&copy; 2026 All rights reserved.</span>
        </div>
        <div className="flex gap-6 text-xs">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms"   className="hover:text-foreground transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
