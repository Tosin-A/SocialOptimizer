import CardNav from "@/components/landing/CardNav";
import MarketingFooter from "@/components/landing/MarketingFooter";
import FloatingLinesBackground from "@/components/landing/FloatingLinesBackground";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      <FloatingLinesBackground />
      <div className="relative z-10">
        <CardNav />
        {children}
        <MarketingFooter />
      </div>
    </div>
  );
}
