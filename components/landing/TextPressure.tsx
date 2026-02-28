"use client";

import { useEffect, useRef, useCallback } from "react";

interface TextPressureProps {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  className?: string;
}

export default function TextPressure({
  text = "Know exactly what's costing you growth.",
  fontFamily = "Inter",
  fontUrl = "",
  width = true,
  weight = true,
  italic = true,
  className = "",
}: TextPressureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spansRef = useRef<HTMLSpanElement[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const setSpanRef = useCallback((el: HTMLSpanElement | null, i: number) => {
    if (el) spansRef.current[i] = el;
  }, []);

  useEffect(() => {
    if (!fontUrl) return;
    const font = new FontFace(fontFamily, `url(${fontUrl})`);
    font.load().then((loaded) => {
      document.fonts.add(loaded);
    });
  }, [fontFamily, fontUrl]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleTouch, { passive: true });

    const animate = () => {
      const spans = spansRef.current;
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        if (!span) continue;
        const rect = span.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseRef.current.x - cx;
        const dy = mouseRef.current.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 300;
        const proximity = Math.max(0, 1 - dist / maxDist);

        const wght = weight ? Math.round(100 + proximity * 800) : 400;
        const wdth = width ? Math.round(100 + proximity * 25) : 100;
        const ital = italic ? +(proximity > 0.5) : 0;

        span.style.fontVariationSettings = `"wght" ${wght}, "wdth" ${wdth}, "ital" ${ital}`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleTouch);
      cancelAnimationFrame(rafRef.current);
    };
  }, [weight, width, italic]);

  // Split into words to allow natural wrapping
  const words = text.split(" ");

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <h1
        className="text-5xl md:text-6xl lg:text-[68px] font-semibold leading-[1.06] tracking-tight"
        style={{ fontFamily }}
      >
        {words.map((word, wi) => {
          const charOffset = words.slice(0, wi).reduce((sum, w) => sum + w.length + 1, 0);
          return (
            <span key={wi} className="inline-block mr-[0.25em]">
              {word.split("").map((char, ci) => (
                <span
                  key={ci}
                  ref={(el) => setSpanRef(el, charOffset + ci)}
                  className="inline-block transition-none"
                  style={{
                    fontVariationSettings: '"wght" 400, "wdth" 100, "ital" 0',
                  }}
                >
                  {char}
                </span>
              ))}
            </span>
          );
        })}
      </h1>
    </div>
  );
}
