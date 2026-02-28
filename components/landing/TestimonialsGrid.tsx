import { TESTIMONIALS } from "@/lib/data/landing";

export default function TestimonialsGrid() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="label-mono mb-4">From creators</div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            What happened when they fixed it.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.handle}
              className="rounded-lg p-5 border border-white/[0.07] bg-white/[0.02] flex flex-col gap-4"
            >
              <p className="text-sm leading-relaxed text-foreground/80 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.handle}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{t.platform}</div>
                  <div className="text-xs font-mono text-brand-400">{t.followers}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
