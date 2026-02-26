import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import QueryProvider from "@/components/providers/QueryProvider";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SocialOptimizer — Content analytics for serious creators",
    template: "%s | SocialOptimizer",
  },
  description:
    "Analyze 90 days of TikTok, Instagram, YouTube, and Facebook content. Get a ranked list of exactly what's costing you growth, backed by data from 2,000+ accounts.",
  keywords: [
    "social media analytics",
    "tiktok analysis",
    "instagram growth",
    "youtube optimization",
    "content analysis",
    "creator analytics",
  ],
  authors: [{ name: "SocialOptimizer" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "SocialOptimizer — Content analytics for serious creators",
    description:
      "Analyze 90 days of your posts across 4 platforms. Get a ranked fix list, not a generic report.",
    siteName: "SocialOptimizer",
  },
  twitter: {
    card: "summary_large_image",
    title: "SocialOptimizer",
    description: "Content analytics for serious creators.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080f1e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sans.variable} ${mono.variable} font-sans antialiased min-h-screen`}
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
