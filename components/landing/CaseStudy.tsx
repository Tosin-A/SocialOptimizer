import { CASE_DATA, CASE_CHANGES } from "@/lib/data/landing";
import Sparkline from "./Sparkline";

export default function CaseStudy() {
  return (
    <section id="case" className="py-20 px-6 border-y border-white/[0.05] bg-white/[0.015]">
      <div className="max-w-6xl mx-auto">
        <div className="label-mono mb-4">Case study</div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">
          @cookswithjordan, 6 weeks
        </h2>
        <p className="text-muted-foreground text-sm mb-12">
          Instagram &middot; cooking &middot; numbers verified by the creator
        </p>

        <div className="grid lg:grid-cols-[1fr_320px] gap-12 lg:gap-16 items-start">

          {/* Changes + sparkline */}
          <div>
            <div className="space-y-8 mb-10">
              {CASE_CHANGES.map((c, i) => (
                <div key={i} className="flex gap-5">
                  <div className="w-6 h-6 rounded-full border border-brand-500/40 text-brand-400 text-xs font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1.5">{c.action}</div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{c.result}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sparkline card */}
            <div className="rounded-lg border border-white/[0.07] p-5"
                 style={{ background: "#0a1120" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="label-mono">Engagement rate &middot; 12 weeks</div>
                <span className="text-xs font-mono text-muted-foreground">
                  1.2% &rarr; 4.8%
                </span>
              </div>
              <Sparkline
                data={CASE_DATA}
                height={56}
                color="#6366f1"
                markerAt={5}
              />
              <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground/50">
                <span>Week 1</span>
                <span className="text-white/25">analysis applied &uarr;</span>
                <span>Week 12</span>
              </div>
            </div>
          </div>

          {/* Before / After */}
          <div className="rounded-lg border border-white/[0.07] overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-white/[0.05]">
              {(["before", "after"] as const).map((key) => {
                const d =
                  key === "before"
                    ? { score: 41, eng: "1.2%", followers: "18K", tags: 22 }
                    : { score: 79, eng: "4.8%", followers: "52K", tags: 6 };
                const isAfter = key === "after";
                return (
                  <div key={key} className="p-5">
                    <div className="label-mono mb-5">{key}</div>
                    {[
                      { v: String(d.score), l: "growth score" },
                      { v: d.eng,           l: "eng. rate" },
                      { v: d.followers,     l: "followers" },
                      { v: String(d.tags),  l: "tags / post" },
                    ].map(({ v, l }) => (
                      <div key={l} className="mb-4">
                        <div
                          className={`font-mono font-semibold text-2xl leading-none mb-0.5 tabular-nums ${
                            isAfter ? "text-status-good" : ""
                          }`}
                        >
                          {v}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{l}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 border-t border-white/[0.05] bg-white/[0.01]">
              <p className="text-[11px] text-muted-foreground">
                6 weeks between first and second analysis
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
