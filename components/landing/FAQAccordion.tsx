import { ChevronRight } from "lucide-react";
import { FAQ } from "@/lib/data/landing";

export default function FAQAccordion() {
  return (
    <section className="py-20 px-6 border-y border-white/[0.05] bg-white/[0.015]">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-14 lg:gap-24">
        <div className="lg:w-72 flex-shrink-0">
          <div className="label-mono mb-4">FAQ</div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
            Common questions.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Answers to what most people ask before signing up.
          </p>
        </div>
        <div className="flex-1">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className={`group py-5 border-t border-white/[0.05] ${i === FAQ.length - 1 ? "border-b" : ""}`}
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none select-none">
                <span className="font-medium text-sm">{item.q}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-open:rotate-90 transition-transform duration-200" />
              </summary>
              <p className="text-muted-foreground text-sm leading-relaxed mt-3 pr-8">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
