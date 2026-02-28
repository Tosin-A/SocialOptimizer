import { LIMITS } from "@/lib/data/landing";

export default function LimitationsSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-14 lg:gap-24">
        <div className="lg:w-72 flex-shrink-0">
          <div className="label-mono mb-4">Honest</div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            What we can&apos;t do
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Every tool overpromises. Here are the real constraints. Decide whether
            this fits before you sign up.
          </p>
        </div>
        <div className="flex-1">
          {LIMITS.map((l, i) => (
            <div
              key={i}
              className={`py-6 border-t border-white/[0.05] ${
                i === LIMITS.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="font-medium text-sm mb-1.5">{l.title}</div>
              <p className="text-muted-foreground text-sm leading-relaxed">{l.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
