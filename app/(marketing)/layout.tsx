import CardNav from "@/components/landing/CardNav";
import MarketingFooter from "@/components/landing/MarketingFooter";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden relative">
      <div className="relative z-10">
        <CardNav />
        {children}
        <MarketingFooter />
      </div>
    </div>
  );
}
