import { PLATFORMS } from "@/lib/data/landing";

export default function PlatformCards() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="label-mono mb-4">Platforms</div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            One report. Four platforms.
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Each platform has different algorithms and signal weightings. We analyze them
            separately and surface what matters for each one.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              className="rounded-lg p-5 border"
              style={{ background: p.bg, borderColor: p.border }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-sm" style={{ color: p.color }}>
                  {p.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{p.accounts}</span>
              </div>
              <ul className="space-y-2">
                {p.metrics.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-brand-400 flex-shrink-0 mt-0.5">&rsaquo;</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
