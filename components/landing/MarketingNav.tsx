"use client";

import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileMenu from "./MobileMenu";

const NAV_LINKS = [
  { label: "Platforms", href: "/platforms" },
  { label: "How it works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Pricing", href: "/pricing" },
];

export default function MarketingNav() {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-sm">
          <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          SocialOptimizer
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            size="sm"
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium gap-1.5 hidden sm:inline-flex"
            asChild
          >
            <Link href="/signup">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
