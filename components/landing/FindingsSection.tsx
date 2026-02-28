import { FINDINGS } from "@/lib/data/landing";

export default function FindingsSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="label-mono mb-4">What the data shows</div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            Patterns from 2,000+ accounts.
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Not industry benchmarks or platform documentation. Actual numbers from
            accounts we&apos;ve run through the system.
          </p>
        </div>

        {FINDINGS.map((f, i) => (
          <div
            key={i}
            className={`flex flex-col md:flex-row gap-8 md:gap-16 py-10 border-t border-white/[0.05] ${
              i === FINDINGS.length - 1 ? "border-b" : ""
            }`}
          >
            <div className="md:w-52 flex-shrink-0">
              <div className="font-mono font-semibold text-5xl text-brand-400 leading-none mb-1 tabular-nums">
                {f.stat}
              </div>
              <div className="text-xs text-muted-foreground font-mono">{f.unit}</div>
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-2">{f.finding}</div>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
