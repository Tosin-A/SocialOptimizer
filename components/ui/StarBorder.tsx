import React from "react";
import { cn } from "@/lib/utils";

interface StarBorderProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  color?: string;
  speed?: string;
  children: React.ReactNode;
}

export default function StarBorder({
  as: Component = "button",
  className,
  color = "#a855f7",
  speed = "6s",
  children,
  ...rest
}: StarBorderProps) {
  return (
    <Component
      className={cn(
        "relative inline-block p-[3px] overflow-hidden rounded-lg",
        className
      )}
      style={{ background: "rgba(255,255,255,0.06)" }}
      {...rest}
    >
      <div
        className="absolute w-[300%] h-[50%] bottom-[-11%] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] top-[-10%] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="relative z-[1] rounded-[6px] bg-slate-950">
        {children}
      </div>
    </Component>
  );
}
