import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BottomCTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Your next post goes out either way.
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The analysis takes 3 minutes. You&apos;ll probably see something you didn&apos;t
          expect. That&apos;s the point.
        </p>
        <Button
          size="lg"
          className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-11 px-8 gap-2"
          asChild
        >
          <Link href="/signup">
            Analyze my account free <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          No card required &middot; free plan available
        </p>
      </div>
    </section>
  );
}
