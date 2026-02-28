"use client";

import {
  SiNike,
  SiSpotify,
  SiRedbull,
  SiNetflix,
  SiDuolingo,
  SiAdobe,
  SiShopify,
  SiNotion,
} from "react-icons/si";
import LogoLoop from "./LogoLoop";
import type { LogoItem } from "./LogoLoop";

const logos: LogoItem[] = [
  { node: <SiNike />, title: "Nike" },
  { node: <SiSpotify />, title: "Spotify" },
  { node: <SiRedbull />, title: "Red Bull" },
  { node: <SiNetflix />, title: "Netflix" },
  { node: <SiDuolingo />, title: "Duolingo" },
  { node: <SiAdobe />, title: "Adobe" },
  { node: <SiShopify />, title: "Shopify" },
  { node: <SiNotion />, title: "Notion" },
];

export default function LogoTicker() {
  return (
    <div className="border-y border-white/[0.05] bg-white/[0.01] py-4">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/50 mb-3 text-center">
          Trusted by creators at
        </p>
      </div>
      <div className="h-12 relative overflow-hidden text-muted-foreground/40">
        <LogoLoop
          logos={logos}
          speed={80}
          direction="left"
          logoHeight={24}
          gap={60}
          hoverSpeed={0}
          scaleOnHover
          fadeOut
          fadeOutColor="#080f1e"
          ariaLabel="Companies using SocialOptimizer"
        />
      </div>
    </div>
  );
}
