import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/toaster";
import QueryProvider from "@/components/providers/QueryProvider";
import DarkVeil from "@/components/landing/DarkVeil";
import RefCapture from "@/components/RefCapture";

const sans = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});

const display = localFont({
  src: "../node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "100 800",
});

const mono = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "100 800",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://getclout.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CLOUT | Content analytics for serious creators",
    template: "%s | CLOUT",
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
    "tiktok growth",
    "social media audit",
    "content optimization",
    "engagement rate",
  ],
  authors: [{ name: "CLOUT" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "CLOUT | Content analytics for serious creators",
    description:
      "Analyze 90 days of your posts across 4 platforms. Get a ranked fix list, not a generic report.",
    siteName: "CLOUT",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "CLOUT — content analytics for serious creators" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CLOUT",
    description: "Content analytics for serious creators.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#080f1e",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "CLOUT",
      url: SITE_URL,
      description:
        "Content analytics for serious creators. Analyze TikTok, Instagram, YouTube, and Facebook posts with data-backed growth recommendations.",
    },
    {
      "@type": "Organization",
      name: "CLOUT",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-background">
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Animated WebGL background — fixed behind all content */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={2}
            scanlineFrequency={0}
            warpAmount={0}
          />
          <div className="absolute inset-0 bg-background/60" />
        </div>
        <QueryProvider>
          <Suspense fallback={null}>
            <RefCapture />
          </Suspense>
          {children}
          <Toaster />
          <Analytics />
        </QueryProvider>
      </body>
    </html>
  );
}
