import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Settings, User, CreditCard, Link2, Shield, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionReveal from "@/components/landing/SectionReveal";

export const metadata: Metadata = {
  title: "Account & Settings",
  description: "Manage your profile, connected platforms, billing, and plan from one place.",
};

const SETTINGS_SECTIONS = [
  {
    icon: User,
    title: "Profile management",
    description: "Update your display name and manage your account details. Simple profile controls — no unnecessary configuration.",
  },
  {
    icon: Link2,
    title: "Connected platforms",
    description: "See all your connected TikTok, Instagram, YouTube, and Facebook accounts in one place. Connect new ones or disconnect old ones with one click.",
  },
  {
    icon: CreditCard,
    title: "Plan & usage",
    description: "Track how many analyses you've used this month, see your current plan, upgrade or manage billing through Stripe's secure portal.",
  },
  {
    icon: Shield,
    title: "Security & data",
    description: "Your OAuth tokens are encrypted. Your data is never shared. Delete your account and all associated data permanently at any time — no hoops to jump through.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    features: ["1 platform", "3 analyses/month", "Basic insights"],
    color: "text-muted-foreground",
  },
  {
    name: "Starter",
    price: "$14",
    features: ["2 platforms", "10 analyses/month", "All insights"],
    color: "text-slate-300",
  },
  {
    name: "Pro",
    price: "$29",
    features: ["4 platforms", "Unlimited analyses", "Competitor tracking", "Content generator"],
    color: "text-brand-400",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$79",
    features: ["10 accounts", "Unlimited everything", "White-label reports", "API access"],
    color: "text-neon-purple",
  },
];

export default function SettingsPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-28 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="label-mono mb-4">Account & Settings</div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            Your account. No clutter.
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
            Profile, connected platforms, billing, and data controls — all in one clean settings
            page. No nested menus or hidden options.
          </p>
        </div>
      </section>

      {/* Settings sections */}
      <section className="pb-16 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-6">
          {SETTINGS_SECTIONS.map((section, i) => (
            <SectionReveal key={section.title} delay={i * 0.1}>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 h-full">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                  <section.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* Plans overview */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              Plans at a glance
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Start free. Upgrade when the data proves it&apos;s worth it.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl p-5 border ${
                    plan.highlighted
                      ? "border-brand-500/30 bg-brand-500/5"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <div className={`font-semibold text-lg ${plan.color}`}>{plan.name}</div>
                  <div className="text-2xl font-bold mt-1 mb-3">
                    {plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-brand-400 flex-shrink-0">&rsaquo;</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-center mt-6">
              <Link href="/pricing" className="text-sm text-brand-400 hover:text-brand-300 inline-flex items-center gap-1">
                Full pricing details <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </section>
      </SectionReveal>

      {/* Security */}
      <SectionReveal>
        <section className="py-16 px-6 border-t border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-brand-400" />
              <h2 className="text-2xl font-semibold tracking-tight">Your data is yours</h2>
            </div>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                OAuth tokens are encrypted with pgcrypto at rest. We never store your social
                media passwords — authentication goes through each platform&apos;s official OAuth flow.
              </p>
              <p>
                Your analysis data is never shared with third parties or used to train models.
                Delete your account and every piece of data associated with it is permanently removed.
                No 30-day grace period, no hidden retention.
              </p>
              <p>
                Row-level security is enforced on every database table. Your data is only
                accessible by your authenticated session — even our own admin tools can&apos;t
                see your content without explicit override.
              </p>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-semibold tracking-tight mb-3">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Create an account, connect a platform, and run your first analysis.
          </p>
          <Button
            size="lg"
            className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-11 px-7 gap-2"
            asChild
          >
            <Link href="/signup">
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            No card required &middot; free plan available
          </p>
        </div>
      </section>
    </>
  );
}
