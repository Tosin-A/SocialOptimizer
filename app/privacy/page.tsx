import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

export const metadata = { title: "Privacy Policy | SocialOptimizer" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-sm">
            <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            SocialOptimizer
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <div className="label-mono mb-4">Legal</div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: February 27, 2026</p>
        </div>

        <Section title="1. What we collect">
          <p>When you create an account, we store your email address and a hashed password (managed by Supabase Auth). If you sign in with Google, we receive your name, email, and profile picture from Google. Nothing else.</p>
          <p>When you connect a social media platform, we request <strong>read-only</strong> access to your public posts and profile metadata (username, follower count, avatar). We store post-level data (captions, hashtags, engagement metrics) for the duration of the analysis. OAuth access tokens are stored server-side and never exposed to your browser.</p>
        </Section>

        <Section title="2. What we do with it">
          <p>Your data is used exclusively to run analyses and generate content recommendations. Specifically:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-sm">
            <li>Post data is sent to our analysis engine (Claude AI and a Python NLP service) to score hooks, hashtags, engagement patterns, and content quality.</li>
            <li>Analysis reports are stored in your account so you can review them later and track score changes over time.</li>
            <li>Generated content (hooks, captions, scripts) is saved to your history for retrieval.</li>
            <li>Usage events (analysis runs, content generations) are logged for plan limit enforcement and your activity feed.</li>
          </ul>
          <p>We do not sell, rent, or share your data with third parties for advertising or marketing purposes.</p>
        </Section>

        <Section title="3. Third-party services">
          <p>We use the following services to operate SocialOptimizer:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-sm">
            <li><strong>Supabase</strong>: Authentication and database hosting (PostgreSQL with row-level security).</li>
            <li><strong>Anthropic (Claude)</strong>: AI analysis and content generation. Post captions and metadata are sent to Claude&apos;s API for processing. Anthropic does not use API inputs to train models.</li>
            <li><strong>Stripe</strong>: Payment processing. We never see or store your full card number.</li>
            <li><strong>Resend</strong>: Transactional email delivery (analysis notifications, weekly digests).</li>
            <li><strong>Vercel</strong>: Application hosting and serverless functions.</li>
            <li><strong>Sentry</strong>: Error monitoring. No personal data is included in error reports.</li>
          </ul>
        </Section>

        <Section title="4. Platform data">
          <p>When you connect TikTok, Instagram, YouTube, or Facebook, we access your data through their official APIs using OAuth. You can disconnect any platform at any time from Settings, which stops all future data access. We do not scrape private accounts. All analysis uses data you&apos;ve authorized or that is publicly available.</p>
          <p>Competitor tracking uses publicly available profile data only. We cannot access private accounts, direct messages, or any data not visible on the public profile.</p>
        </Section>

        <Section title="5. Data retention">
          <p>Your analysis reports and generated content are retained for as long as your account exists. If you delete your account (Settings → Delete account), all data is permanently removed: connected accounts, posts, reports, generated content, and usage history. This action is irreversible.</p>
          <p>OAuth tokens are deleted immediately when you disconnect a platform.</p>
        </Section>

        <Section title="6. Security">
          <p>All data is transmitted over HTTPS. Database access is protected by row-level security. You can only access your own data. OAuth tokens are stored server-side and never returned to the browser. Our API routes validate every request with authentication checks and input validation before processing.</p>
          <p>Internal services (our Python analysis service) authenticate via shared secrets and are not publicly accessible.</p>
        </Section>

        <Section title="7. Cookies">
          <p>We use strictly necessary cookies for authentication session management (Supabase auth cookies). We use localStorage for UI preferences (notification read timestamps). We do not use tracking cookies, analytics cookies, or any third-party advertising cookies.</p>
        </Section>

        <Section title="8. Your rights">
          <p>You can:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-sm">
            <li><strong>Access</strong> your data. All reports, generated content, and account information are visible in your dashboard.</li>
            <li><strong>Export</strong> your data. Use the CSV export on the Reports page or PDF export on individual reports.</li>
            <li><strong>Delete</strong> your data. Delete your entire account from Settings. This is permanent.</li>
            <li><strong>Disconnect</strong> platforms. Revoke our access at any time from Settings.</li>
          </ul>
          <p>If you have questions about your data, email <a href="mailto:hi@socialoptimizer.co" className="text-brand-400 hover:text-brand-300 transition-colors">hi@socialoptimizer.co</a>.</p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>If we make material changes, we&apos;ll notify you by email. Continued use of SocialOptimizer after changes constitutes acceptance.</p>
        </Section>
      </article>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.05] py-8 px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
        <span>SocialOptimizer © 2026</span>
        <div className="flex gap-6 text-xs">
          <Link href="/privacy" className="text-foreground font-medium">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
