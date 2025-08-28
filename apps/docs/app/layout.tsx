import { Geist, Geist_Mono, Inter, Montserrat, Orbitron, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"

// 🔧 DEBUG: Log global des variables d'environnement au démarrage de l'app docs
console.log('🔍 [DOCS-LAYOUT] Variables d\'environnement au démarrage:', {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NODE_ENV: process.env.NODE_ENV,
  allNextPublicKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')),
  allEnvKeys: Object.keys(process.env)
})

// Base URL du site pour les URLs canoniques / OG / sitemap
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

// Polices
const fontSans = Plus_Jakarta_Sans({
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
    default: "Ona UI — Components premium qui convertissent",
    template: "%s — Ona UI",
  },
  description:
    "Ona UI est une librairie de composants premium, issus de pages réelles à fort taux de conversion. Expédiez des pages uniques qui convertissent, sans look générique.",
  applicationName: "Ona UI",
  openGraph: {
    type: "website",
    siteName: "Ona UI",
    url: siteUrl,
    title: "Ona UI — Components premium qui convertissent",
    description:
      "Librairie de composants premium, non génériques, avec intégrations Stripe/Posthog/Supabase pour shipper vite et mieux convertir.",
    images: [`${siteUrl}/image1.png`],
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ona UI — Components premium qui convertissent",
    description:
      "Des composants non génériques, basés sur des pages réelles à 10%+ de conversion. Shippez plus vite, convertissez mieux.",
    images: [`${siteUrl}/image1.png`],
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
        className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}