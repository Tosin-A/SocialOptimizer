"use client";

import dynamic from "next/dynamic";

const FloatingLines = dynamic(() => import("./FloatingLines"), { ssr: false });

export default function FloatingLinesBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
      <div className="w-full h-full">
        <FloatingLines
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={5}
          lineDistance={5}
          bendRadius={5}
          bendStrength={-0.5}
          interactive={true}
          parallax={true}
          mixBlendMode="screen"
        />
      </div>
    </div>
  );
}
