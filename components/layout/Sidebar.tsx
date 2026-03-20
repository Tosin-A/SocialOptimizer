"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  BarChart3, Home, Users, Wand2, Settings,
  TrendingUp, ChevronRight, LogOut, FileText, X,
  Compass, Target, Lock, Map, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import type { FeatureAccess } from "@/lib/plans/feature-gate";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  gate?: keyof FeatureAccess;
}

const NAV: NavItem[] = [
  { href: "/dashboard",             icon: Home,      label: "Dashboard" },
  { href: "/dashboard/analyze",     icon: BarChart3,  label: "Analyze" },
  { href: "/dashboard/roadmap",     icon: Map,        label: "Roadmap" },
  { href: "/dashboard/reports",     icon: FileText,   label: "Reports" },
  { href: "/dashboard/discover",    icon: Compass,    label: "Discover",     gate: "discover" },
  { href: "/dashboard/competitors", icon: Users,      label: "Competitors",  gate: "competitors" },
  { href: "/dashboard/generate",    icon: Wand2,      label: "Generate" },
  { href: "/dashboard/coach",      icon: MessageSquare, label: "Coach",     gate: "coach" },
  { href: "/dashboard/track",       icon: Target,     label: "Track",        gate: "track" },
  { href: "/dashboard/settings",    icon: Settings,   label: "Settings" },
];

interface SidebarProps {
  /** Mobile: controlled open state from parent layout */
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

export default function Sidebar({ open, onClose, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = getSupabaseBrowserClient();
  const { access } = useFeatureAccess();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navContent = (
    <>
      {/* Logo */}
      <div className={cn("border-b border-white/5 flex items-center justify-between", collapsed ? "p-3" : "p-5")}>
        <Link href="/" className="flex items-center" onClick={onClose}>
          {collapsed ? (
            <div className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center text-sm font-bold text-slate-300">
              C
            </div>
          ) : (
            <Image
              src="/logo.png"
              alt="CLOUT"
              width={110}
              height={34}
              className="flex-shrink-0 transition-transform duration-200 hover:scale-105"
            />
          )}
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
      <nav className={cn("flex-1 space-y-1", collapsed ? "p-2" : "p-3")}>
        {NAV.map(({ href, icon: Icon, label, gate }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const locked = gate ? !access[gate] : false;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                collapsed ? "justify-center gap-0" : "gap-3",
                active
                  ? "bg-brand-600/20 text-brand-300 border border-brand-600/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className={cn("w-4 h-4", active ? "text-brand-400" : "")} />
              {!collapsed && label}
              {!collapsed && locked && <Lock className="w-3 h-3 ml-auto text-slate-500" />}
              {!collapsed && active && !locked && <ChevronRight className="w-3 h-3 ml-auto text-brand-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className={cn("border-t border-white/5", collapsed ? "p-2" : "p-3")}>
        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all",
            collapsed ? "justify-center gap-0" : "gap-3"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className={cn("hidden lg:flex flex-shrink-0 border-r border-white/5 flex-col h-full bg-background transition-[width] duration-200", collapsed ? "w-[78px]" : "w-64")}>
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
