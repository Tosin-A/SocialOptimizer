"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Home, Users, Wand2, Settings,
  TrendingUp, ChevronRight, LogOut, FileText, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard",             icon: Home,      label: "Dashboard" },
  { href: "/dashboard/analyze",     icon: BarChart3,  label: "Analyze" },
  { href: "/dashboard/reports",     icon: FileText,   label: "Reports" },
  { href: "/dashboard/competitors", icon: Users,      label: "Competitors" },
  { href: "/dashboard/generate",    icon: Wand2,      label: "Generate" },
  { href: "/dashboard/settings",    icon: Settings,   label: "Settings" },
];

interface SidebarProps {
  /** Mobile: controlled open state from parent layout */
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = getSupabaseBrowserClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-neon-purple flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">SocialOptimizer</span>
        </Link>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-brand-600/20 text-brand-300 border border-brand-600/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4", active ? "text-brand-400" : "")} />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-brand-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-white/5 flex-col h-full bg-background">
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="relative z-10 w-72 flex flex-col h-full bg-background border-r border-white/5 shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
