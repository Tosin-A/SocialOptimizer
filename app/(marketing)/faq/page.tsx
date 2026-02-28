import type { Metadata } from "next";
import FAQAccordion from "@/components/landing/FAQAccordion";
import LimitationsSection from "@/components/landing/LimitationsSection";
import SectionReveal from "@/components/landing/SectionReveal";

export const metadata: Metadata = { title: "FAQ" };

export default function FAQPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-4 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">FAQ</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Common questions.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            Answers to what most people ask before signing up.
          </p>
        </div>
      </section>

      <SectionReveal>
        <FAQAccordion />
      </SectionReveal>

      <SectionReveal>
        <LimitationsSection />
      </SectionReveal>
    </>
  );
}
