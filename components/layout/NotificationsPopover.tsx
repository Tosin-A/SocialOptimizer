"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, BarChart3, Wand2, CreditCard, Mail, Users, Info, Check, ChevronRight } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  analysis:   BarChart3,
  generate:   Wand2,
  billing:    CreditCard,
  email:      Mail,
  competitor: Users,
  info:       Info,
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const SEEN_KEY = "notif_seen_at";

export default function NotificationsPopover() {
  const router = useRouter();
  const [open, setOpen]             = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]       = useState(false);
  const [fetched, setFetched]       = useState(false);
  const [unread, setUnread]         = useState(0);
  const containerRef                = useRef<HTMLDivElement>(null);

  // Count unseen events on initial mount (without opening panel)
  useEffect(() => {
    const seenAt = localStorage.getItem(SEEN_KEY);
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        const list: Notification[] = d.data ?? [];
        if (seenAt) {
          setUnread(list.filter((n) => new Date(n.created_at) > new Date(seenAt)).length);
        } else {
          setUnread(Math.min(list.length, 9));
        }
      })
      .catch(() => {});
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.data ?? []);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }, [fetched]);

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications();
      // Mark all as seen
      localStorage.setItem(SEEN_KEY, new Date().toISOString());
      setUnread(0);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  // Position the portal-rendered dropdown relative to the bell button
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          className="fixed w-80 rounded-xl border border-white/10 bg-[#0d1424] shadow-2xl z-[9999] overflow-hidden"
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold">Recent activity</span>
            {notifications.length > 0 && (
              <span className="text-xs text-muted-foreground">{notifications.length} events</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">Loading…</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Check className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No activity yet</p>
              </div>
            )}
            {!loading && notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] ?? Info;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(n.link);
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/5 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug truncate">{n.body}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-0.5">
                    <span className="text-[10px] text-muted-foreground/50">
                      {timeAgo(n.created_at)}
                    </span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
