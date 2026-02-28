import type { Metadata } from "next";
import PricingTable from "@/components/landing/PricingTable";
import BottomCTA from "@/components/landing/BottomCTA";
import SectionReveal from "@/components/landing/SectionReveal";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-4 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">Pricing</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Simple. No tricks.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            Start free. Upgrade when it&apos;s actually worth it to you.
          </p>
        </div>
      </section>

      <SectionReveal>
        <PricingTable />
      </SectionReveal>

      <SectionReveal>
        <BottomCTA />
      </SectionReveal>
    </>
  );
}
