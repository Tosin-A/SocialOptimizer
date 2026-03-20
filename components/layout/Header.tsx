"use client";
import type { User } from "@supabase/supabase-js";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationsPopover from "./NotificationsPopover";

interface HeaderProps {
  user: User;
  onMenuClick?: () => void;
  canToggleDesktopSidebar?: boolean;
  desktopSidebarCollapsed?: boolean;
  onDesktopSidebarToggle?: () => void;
}

export default function Header({
  user,
  onMenuClick,
  canToggleDesktopSidebar = false,
  desktopSidebarCollapsed = false,
  onDesktopSidebarToggle,
}: HeaderProps) {
  const initials = user.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {/* Hamburger — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {canToggleDesktopSidebar && onDesktopSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={onDesktopSidebarToggle}
            aria-label={desktopSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={desktopSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {desktopSidebarCollapsed ? (
              <PanelLeftOpen className="w-4.5 h-4.5" />
            ) : (
              <PanelLeftClose className="w-4.5 h-4.5" />
            )}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <NotificationsPopover />
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-neon-purple flex items-center justify-center text-xs font-bold select-none">
          {initials}
        </div>
      </div>
    </header>
  );
}
