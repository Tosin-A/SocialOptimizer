const STEPS = [
  {
    n: "1",
    title: "Connect your platform",
    body: "We pull the last 90 days of your public posts. For private metrics, you authorize read-only access. Takes 90 seconds, nothing stored beyond what the analysis requires.",
  },
  {
    n: "2",
    title: "We run the analysis",
    body: "Hook scoring, hashtag specificity, engagement pattern detection, CTA placement, posting cadence. Finishes in 2\u20134 minutes. Every post is analyzed, not a sample.",
  },
  {
    n: "3",
    title: "You get a ranked fix list",
    body: "Not a PDF. A short list ordered by expected impact. The item at the top is what to fix first. Re-analyze in two weeks and track whether the score moves.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-6 border-y border-white/[0.05] bg-white/[0.015]">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-24">
        <div className="lg:w-72 flex-shrink-0">
          <div className="label-mono mb-4">How it works</div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            Three steps.<br />No magic.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We&apos;re doing what a smart analyst would do manually: reading every post,
            scoring it against known patterns. In 3 minutes instead of 3 hours.
          </p>
        </div>

        <div className="flex-1">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex gap-6 py-7 ${i < STEPS.length - 1 ? "border-b border-white/[0.05]" : ""}`}
            >
              <div className="w-7 h-7 rounded-full border border-brand-500/40 text-brand-400 font-mono text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.n}
              </div>
              <div>
                <div className="font-semibold text-sm mb-1.5">{step.title}</div>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
