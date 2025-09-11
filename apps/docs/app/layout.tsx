import { Geist, Geist_Mono, Inter, Montserrat, Orbitron, Outfit, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { Banner } from "@/components/banner"

// Base URL du site pour les URLs canoniques / OG / sitemap
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

// Polices
const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontDisplay = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Metadata globale (Next.js App Router)
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ona UI — Premium Components That Actually Convert",
    template: "%s — Ona UI",
  },
  description:
    "Premium React components extracted from real high-converting landing pages. Ship unique interfaces that convert at 6-8%, not generic AI-generated designs that everyone ignores.",
  applicationName: "Ona UI",
  openGraph: {
    type: "website",
    siteName: "Ona UI",
    url: siteUrl,
    title: "Ona UI — Premium Components That Actually Convert",
    description:
      "36 premium React components sourced from high-converting designs. Pre-built Stripe, Posthog & Supabase integrations. Ship faster, convert better.",
    images: [`https://cdn.ona-ui.com/hero-ona.png`],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ona UI — Premium Components That Actually Convert",
    description:
      "Stop shipping generic AI-generated interfaces. 36 conversion-tested React components with pre-built integrations. Ship unique landing pages that convert.",
    images: [`https://cdn.ona-ui.com/hero-ona.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.ico" }],
  },
}

// Viewport / thème
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: "#0b0b0b",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Ona UI",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/docs?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased bg-[#F1F0EE]`}
      >
        <Banner />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}