"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import gsap from "gsap";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import "./CardNav.css";

interface NavLink {
  label: string;
  href: string;
  ariaLabel?: string;
}

interface NavCardItem {
  label: string;
  bgColor: string;
  textColor: string;
  links: NavLink[];
}

const NAV_ITEMS: NavCardItem[] = [
  {
    label: "Product",
    bgColor: "rgba(99, 102, 241, 0.08)",
    textColor: "#fff",
    links: [
      { label: "Analyze", href: "/analyze", ariaLabel: "Content analysis" },
      { label: "Reports", href: "/reports", ariaLabel: "Analysis reports" },
      { label: "Competitors", href: "/competitors", ariaLabel: "Competitor tracking" },
      { label: "Generate", href: "/generate", ariaLabel: "Content generator" },
    ],
  },
  {
    label: "Resources",
    bgColor: "rgba(99, 102, 241, 0.05)",
    textColor: "#fff",
    links: [
      { label: "How it works", href: "/how-it-works", ariaLabel: "Learn how it works" },
      { label: "Platforms", href: "/platforms", ariaLabel: "View supported platforms" },
      { label: "FAQ", href: "/faq", ariaLabel: "Frequently asked questions" },
      { label: "Pricing", href: "/pricing", ariaLabel: "View pricing plans" },
    ],
  },
  {
    label: "Legal",
    bgColor: "rgba(99, 102, 241, 0.03)",
    textColor: "#fff",
    links: [
      { label: "Privacy policy", href: "/privacy", ariaLabel: "Privacy policy" },
      { label: "Terms of service", href: "/terms", ariaLabel: "Terms of service" },
    ],
  },
];

const CLOSED_HEIGHT = 56;

export default function CardNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Auth state detection
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Scroll detection for shrink
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP height animation — measure content dynamically
  useEffect(() => {
    if (!navRef.current) return;

    let openHeight = CLOSED_HEIGHT;
    if (isOpen && contentRef.current) {
      // Temporarily make content measurable
      const content = contentRef.current;
      const prevVisibility = content.style.visibility;
      const prevPointerEvents = content.style.pointerEvents;
      content.style.visibility = "visible";
      content.style.pointerEvents = "none";
      openHeight = CLOSED_HEIGHT + content.scrollHeight + 8; // 8px breathing room
      content.style.visibility = prevVisibility;
      content.style.pointerEvents = prevPointerEvents;
    }

    gsap.to(navRef.current, {
      height: isOpen ? openHeight : CLOSED_HEIGHT,
      duration: 0.45,
      ease: "power3.out",
    });
  }, [isOpen]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  }, [router]);

  return (
    <div className={`card-nav-container ${scrolled ? "scrolled" : ""}`}>
      <div
        ref={navRef}
        className={`card-nav ${isOpen ? "open" : ""}`}
        style={{ height: CLOSED_HEIGHT }}
      >
        {/* Top bar */}
        <div className="card-nav-top">
          {/* Hamburger */}
          <button
            type="button"
            className={`hamburger-menu ${isOpen ? "open" : ""}`}
            onClick={toggle}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </button>

          {/* Logo */}
          <Link href="/" className="card-nav-logo" onClick={() => setIsOpen(false)}>
            <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className={scrolled ? "hidden sm:inline" : ""}>SocialOptimizer</span>
          </Link>

          {/* Auth buttons */}
          <div className="card-nav-auth">
            {user ? (
              <Link href="/dashboard" className="card-nav-cta-button">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="card-nav-signin">
                  Sign in
                </Link>
                <Link href="/signup" className="card-nav-cta-button">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Cards */}
        <div ref={contentRef} className="card-nav-content">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="nav-card"
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="nav-card-link"
                    aria-label={link.ariaLabel}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {user && (
            <button
              type="button"
              className="nav-card-link"
              onClick={handleSignOut}
              style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, padding: "4px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
