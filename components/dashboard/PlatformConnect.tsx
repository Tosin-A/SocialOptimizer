"use client";
import { useState } from "react";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";
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
    comingSoon: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    desc: "Improve retention, CTR, and subscriber growth",
    color: "from-red-500/20 to-orange-500/20 border-red-500/30",
    btnColor: "bg-red-500 hover:bg-red-600",
    comingSoon: true,
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

interface PlatformConnectProps {
  /** "initial" = first-time setup, "add" = adding another when user already has accounts */
  mode?: "initial" | "add";
}

export default function PlatformConnect({ mode = "initial" }: PlatformConnectProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const connect = (platform: string) => {
    setConnecting(platform);
    window.location.href = `/api/connect/${platform}`;
  };

  const isAdd = mode === "add";

  return (
    <div className="glass rounded-2xl p-8">
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
        {PLATFORMS.map((p) => (
          <div
            key={p.id}
            className={`bg-gradient-to-br ${p.color} border rounded-xl p-5 space-y-3`}
          >
            <div className="flex items-center gap-3">
              <PlatformIcon platform={p.id} size={24} />
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </div>
            <Button
              onClick={() => connect(p.id)}
              disabled={!!connecting || p.comingSoon}
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
          </div>
        ))}
      </div>
    </div>
  );
}
