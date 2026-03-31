import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/lib/data/landing";

export default function PricingTable() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 border-y border-border bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="label-mono mb-4">Pricing</div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-2">
          Simple. No tricks.
        </h2>
        <p className="text-muted-foreground mb-12">
          Start free. Upgrade when it&apos;s actually worth it to you.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg p-4 sm:p-6 flex flex-col border ${
                tier.accent
                  ? "border-blue-500/40 bg-blue-950/20"
                  : "border-border bg-card"
              }`}
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{tier.name}</span>
                  {tier.accent && (
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
                      popular
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-mono font-semibold text-2xl sm:text-3xl tabular-nums">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">{tier.cadence}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{tier.note}</p>
              </div>

              <div className="flex-1 space-y-2.5 mb-6">
                {tier.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
                {tier.missing.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground/35">
                    <Minus className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-40" />
                    <span className="line-through">{f}</span>
                  </div>
                ))}
              </div>

              {tier.accent ? (
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold w-full"
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-border hover:bg-muted"
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          All paid plans cancel any time. No retention flow. No &quot;are you sure?&quot; email.
        </p>
      </div>
    </section>
  );
}
