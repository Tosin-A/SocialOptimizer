"use client";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, DollarSign, Users, Video, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const REACH_OPTIONS = [
  { value: 1000, label: "1k – 10k" },
  { value: 10000, label: "10k – 50k" },
  { value: 50000, label: "50k – 100k" },
  { value: 100000, label: "100k – 500k" },
  { value: 500000, label: "500k+" },
];

const COMMISSIONS = [
  { plan: "Starter", price: "$19/mo", commission: "$5" },
  { plan: "Pro", price: "$49/mo", commission: "$15" },
  { plan: "Agency", price: "$199/mo", commission: "$50" },
];

export default function AdvertisePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [followersEst, setFollowersEst] = useState<number | null>(null);
  const [pitch, setPitch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabaseBrowserClient();

  // Pre-fill from auth session if logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      setName(user.user_metadata?.full_name ?? "");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tiktok && !instagram && !youtube) {
      setError("Add at least one social handle.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/creator-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          tiktok_handle: tiktok || undefined,
          instagram_handle: instagram || undefined,
          youtube_handle: youtube || undefined,
          followers_est: followersEst ?? undefined,
          content_pitch: pitch,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError("An application with this email already exists.");
        } else {
          setError(data.error ?? "Submission failed. Try again.");
        }
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h1 className="text-2xl font-bold">Application received</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We review all applications manually and will email you within 3–5 business days. If approved, you'll get your personal referral link and start earning.
          </p>
          <a href="/dashboard" className="inline-block mt-2">
            <Button variant="outline" size="sm">Back to dashboard</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">

      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-3 py-1.5 uppercase tracking-wider mb-2">
          <Video className="w-3.5 h-3.5" /> Creator Partner Program
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Earn from the content you already create
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Make a genuine video about CLOUT — a walk-through, a results video, an honest take. Every creator who upgrades through your link earns you a commission. No follower minimum. Just real content.
        </p>
      </div>

      {/* How it works + commission table */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: <Video className="w-5 h-5 text-blue-400" />,
            title: "Create UGC",
            body: "Film a TikTok, Reel, or YouTube Short about CLOUT. Your analysis results, your growth score, your honest opinion.",
          },
          {
            icon: <Users className="w-5 h-5 text-blue-400" />,
            title: "Share your link",
            body: "Once approved, you get a unique referral link. Drop it in your bio, caption, or pinned comment.",
          },
          {
            icon: <DollarSign className="w-5 h-5 text-blue-400" />,
            title: "Earn per upgrade",
            body: "Every creator who upgrades through your link pays you a commission — automatically tracked.",
          },
        ].map((item) => (
          <div key={item.title} className="glass rounded-2xl p-5 space-y-2">
            {item.icon}
            <h3 className="font-semibold text-sm">{item.title}</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      {/* Commission table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">Commission per upgrade</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="text-left px-6 py-3">Plan</th>
              <th className="text-left px-6 py-3">Price</th>
              <th className="text-right px-6 py-3 text-emerald-400">Your commission</th>
            </tr>
          </thead>
          <tbody>
            {COMMISSIONS.map((row) => (
              <tr key={row.plan} className="border-b border-border/50 last:border-0">
                <td className="px-6 py-3 font-medium">{row.plan}</td>
                <td className="px-6 py-3 text-muted-foreground">{row.price}</td>
                <td className="px-6 py-3 text-right font-mono font-semibold text-emerald-400">{row.commission}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-3 bg-white/[0.02] border-t border-border">
          <p className="text-xs text-muted-foreground">Commission paid out monthly via PayPal or bank transfer. Minimum payout threshold: $20.</p>
        </div>
      </div>

      {/* Application form */}
      <div className="max-w-xl mx-auto">
        <div className="glass rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-lg">Apply to join</h2>
            <p className="text-muted-foreground text-xs mt-0.5">All applications reviewed manually. We reply within 3–5 business days.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Social handles <span className="text-muted-foreground font-normal">(at least one)</span></Label>
              <div className="grid sm:grid-cols-3 gap-2">
                <Input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="TikTok @handle"
                />
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram @handle"
                />
                <Input
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="YouTube @handle"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reach">Estimated total reach</Label>
              <div className="flex flex-wrap gap-2">
                {REACH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFollowersEst(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      followersEst === opt.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "border-border text-muted-foreground hover:border-blue-500/50 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pitch">What kind of content would you make?</Label>
              <textarea
                id="pitch"
                required
                minLength={10}
                maxLength={1000}
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                rows={3}
                placeholder="e.g. I'd show my actual CLOUT growth score and walk through the fix list — real results, no fluff."
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{pitch.length}/1000</p>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Submit application
            </Button>
          </form>
        </div>
      </div>

    </div>
  );
}
