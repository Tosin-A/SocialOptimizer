import type { Metadata } from "next";
import HowItWorks from "@/components/landing/HowItWorks";
import FindingsSection from "@/components/landing/FindingsSection";
import CaseStudy from "@/components/landing/CaseStudy";
import SectionReveal from "@/components/landing/SectionReveal";

export const metadata: Metadata = { title: "How It Works" };

export default function HowItWorksPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-4 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">How it works</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Three steps. No magic.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            We&apos;re doing what a smart analyst would do manually: reading every post,
            scoring it against known patterns. In 3 minutes instead of 3 hours.
          </p>
        </div>
      </section>

      <SectionReveal>
        <HowItWorks />
      </SectionReveal>

      <SectionReveal>
        <FindingsSection />
      </SectionReveal>

      <SectionReveal>
        <CaseStudy />
      </SectionReveal>
    </>
  );
}
