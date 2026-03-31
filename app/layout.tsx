import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
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
    <html lang="en" className="dark">
      <body
        className={`${sans.variable} ${mono.variable} font-sans antialiased min-h-screen`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <QueryProvider>
          {children}
          <Toaster />
          <Analytics />
        </QueryProvider>
      </body>
    </html>
  );
}
