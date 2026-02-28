import HeroSection from "@/components/landing/HeroSection";
import StatsBar from "@/components/landing/StatsBar";
import LogoTicker from "@/components/landing/LogoTicker";
import PlatformCards from "@/components/landing/PlatformCards";
import HowItWorks from "@/components/landing/HowItWorks";
import FindingsSection from "@/components/landing/FindingsSection";
import CaseStudy from "@/components/landing/CaseStudy";
import TestimonialsGrid from "@/components/landing/TestimonialsGrid";
import LimitationsSection from "@/components/landing/LimitationsSection";
import FAQAccordion from "@/components/landing/FAQAccordion";
import PricingTable from "@/components/landing/PricingTable";
import BottomCTA from "@/components/landing/BottomCTA";
import SectionReveal from "@/components/landing/SectionReveal";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <LogoTicker />

      <SectionReveal>
        <PlatformCards />
      </SectionReveal>

      <SectionReveal>
        <HowItWorks />
      </SectionReveal>

      <SectionReveal>
        <FindingsSection />
      </SectionReveal>

      <SectionReveal>
        <CaseStudy />
      </SectionReveal>

      <SectionReveal>
        <TestimonialsGrid />
      </SectionReveal>

      <SectionReveal>
        <LimitationsSection />
      </SectionReveal>

      <SectionReveal>
        <FAQAccordion />
      </SectionReveal>

      <SectionReveal>
        <PricingTable />
      </SectionReveal>

      <SectionReveal>
        <BottomCTA />
      </SectionReveal>
    </>
  );
}
