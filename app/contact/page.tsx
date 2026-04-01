"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";

const CATEGORIES = [
  { value: "general", label: "General Enquiry" },
  { value: "billing", label: "Billing & Plans" },
  { value: "technical", label: "Technical / Bug Report" },
  { value: "partnership", label: "Partnership / Business" },
  { value: "other", label: "Other" },
] as const;

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, category, message }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error ?? "Something went wrong. Try again.");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setCategory("general");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Check your connection and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative z-10">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="CLOUT"
              width={80}
              height={24}
              className="rounded-lg shadow-[0_0_24px_8px_rgba(0,0,0,0.5)]"
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="label-mono mb-4">Legal</div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Contact Us
          </h1>
          <p className="text-sm text-muted-foreground">
            Have a question, issue, or business enquiry? Fill out the form below
            and we&apos;ll get back to you.
          </p>
        </div>

        {status === "success" ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">
              Message sent
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We&apos;ve received your enquiry and will respond within 24–48
              hours. Check your inbox for a reply.
            </p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={320}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="category"
                className="text-sm font-medium text-foreground"
              >
                Category
              </label>
              <select
                id="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="message"
                className="text-sm font-medium text-foreground"
              >
                Message
              </label>
              <textarea
                id="message"
                required
                minLength={10}
                maxLength={5000}
                rows={6}
                placeholder="Describe your question or issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors resize-y min-h-[120px]"
              />
              <div className="text-xs text-slate-500 text-right">
                {message.length}/5000
              </div>
            </div>

            {status === "error" && errorMsg && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Other ways to reach us
          </h2>
          <p className="text-sm text-muted-foreground">
            Email us directly at{" "}
            <a
              href="mailto:cloutai.support@gmail.com"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              cloutai.support@gmail.com
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            We typically respond within 24–48 hours.
          </p>
        </div>
      </div>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <span>CLOUT &copy; 2026</span>
          <div className="flex gap-6 text-xs">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <span className="text-foreground font-medium">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
