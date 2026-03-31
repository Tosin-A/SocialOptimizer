import CardNav from "@/components/landing/CardNav";
import MarketingFooter from "@/components/landing/MarketingFooter";
import DarkVeil from "@/components/landing/DarkVeil";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* Animated WebGL background — fixed behind all content */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={2}
          scanlineFrequency={0}
          warpAmount={0}
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      <div className="relative z-10">
        <CardNav />
        {children}
        <MarketingFooter />
      </div>
    </div>
  );
}
