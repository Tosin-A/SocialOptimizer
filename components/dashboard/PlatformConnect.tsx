"use client";
import { useState } from "react";
import { Loader2, Plus, CheckCircle2, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlatformIcon from "@/components/dashboard/PlatformIcon";

const PLATFORMS = [
  {
    id: "tiktok",
    name: "TikTok",
    desc: "Analyze your For You Page performance and viral patterns",
    color: "from-pink-500/20 to-red-500/20 border-pink-500/30",
    btnColor: "bg-pink-500 hover:bg-pink-600",
    comingSoon: false,
  },
  {
    id: "instagram",
    name: "Instagram",
    desc: "Optimize your Reels, Stories, and Posts for maximum reach",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    btnColor: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
    comingSoon: false,
  },
  {
    id: "youtube",
    name: "YouTube",
    desc: "Improve retention, CTR, and subscriber growth",
    color: "from-red-500/20 to-orange-500/20 border-red-500/30",
    btnColor: "bg-red-500 hover:bg-red-600",
    comingSoon: false,
  },
  {
    id: "facebook",
    name: "Facebook",
    desc: "Maximize organic reach and engagement on your Page",
    color: "from-blue-500/20 to-blue-700/20 border-blue-500/30",
    btnColor: "bg-blue-600 hover:bg-blue-700",
    comingSoon: true,
  },
];

interface ConnectedAccount {
  id: string;
  platform: string;
  username: string;
}

interface PlatformConnectProps {
  /** "initial" = first-time setup, "add" = adding another when user already has accounts */
  mode?: "initial" | "add";
  connectedAccounts?: ConnectedAccount[];
  onDisconnect?: (id: string) => void;
}

export default function PlatformConnect({ mode = "initial", connectedAccounts = [], onDisconnect }: PlatformConnectProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const connect = (platform: string) => {
    setConnecting(platform);
    window.location.href = `/api/connect/${platform}`;
  };

  const disconnect = async (accountId: string, platform: string) => {
    setDisconnecting(platform);
    try {
      await fetch(`/api/accounts?id=${accountId}`, { method: "DELETE" });
      onDisconnect?.(accountId);
      window.location.reload();
    } finally {
      setDisconnecting(null);
    }
  };

  const isAdd = mode === "add";

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8">
      <div className={`${isAdd ? "mb-6" : "text-center mb-8"}`}>
        <h2 className={`font-bold mb-2 ${isAdd ? "text-base" : "text-xl"}`}>
          {isAdd ? "Connect another platform" : "Connect your social media account"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAdd
            ? "Link TikTok, Instagram, YouTube, or Facebook for live data and deeper analysis"
            : "Connect at least one account to start your first analysis"}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {PLATFORMS.map((p) => {
          const connected = connectedAccounts.find((a) => a.platform === p.id);

          return (
            <div
              key={p.id}
              className={`bg-gradient-to-br ${p.color} border rounded-xl p-3 sm:p-5 space-y-3`}
            >
              <div className="flex items-center gap-3">
                <PlatformIcon platform={p.id} size={24} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{p.name}</h3>
                  {connected ? (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {connected.username.startsWith("@") ? connected.username : `@${connected.username}`}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground truncate">{p.desc}</p>
                  )}
                </div>
              </div>

              {connected ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => connect(p.id)}
                    disabled={!!connecting || !!disconnecting}
                    className="flex-1 gap-1.5 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    {connecting === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Switch account
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => disconnect(connected.id, p.id)}
                    disabled={!!connecting || !!disconnecting}
                    className="gap-1.5 text-xs border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400"
                  >
                    {disconnecting === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => connect(p.id)}
                  disabled={!!connecting || !!disconnecting || p.comingSoon}
                  className={`w-full gap-2 text-white ${p.comingSoon ? "bg-slate-700 hover:bg-slate-700 cursor-not-allowed opacity-50" : p.btnColor}`}
                >
                  {p.comingSoon ? (
                    "Coming soon"
                  ) : connecting === p.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Connect {p.name}</>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
