import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATFORMS } from "@/lib/data/landing";
import SectionReveal from "@/components/landing/SectionReveal";

export const metadata: Metadata = { title: "Platforms" };

export default function PlatformsPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">Platforms</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            One report. Four platforms.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            Each platform has different algorithms and signal weightings. We analyze them
            separately and surface what matters for each one.
          </p>
        </div>
      </section>

      {/* Platform cards */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-6">
          {PLATFORMS.map((p, i) => (
            <SectionReveal key={p.name} delay={i * 0.1}>
              <div
                className="rounded-xl p-6 border"
                style={{ background: p.bg, borderColor: p.border }}
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-semibold text-lg" style={{ color: p.color }}>
                    {p.name}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">{p.accounts} accounts</span>
                </div>
                <ul className="space-y-3">
                  {p.metrics.map((m) => (
                    <li key={m} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="text-brand-400 flex-shrink-0 mt-0.5">&rsaquo;</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            Ready to see your scores?
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Connect any platform and get your first analysis in under 3 minutes.
          </p>
          <Button
            size="lg"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-11 px-7 gap-2"
            asChild
          >
            <Link href="/signup">
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
