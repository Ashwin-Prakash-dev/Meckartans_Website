import type { Metadata, Viewport } from "next"
import { Archivo, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google"

import { Footer } from "@/components/footer"
import { HudCursor } from "@/components/hud-cursor"
import { Nav } from "@/components/nav"
import { PageTransition } from "@/components/page-transition"
import { RouteScroll, SmoothScroll } from "@/components/smooth-scroll"

import "./globals.css"

// Premium motorsport typography system:
// - Headings: Barlow Condensed (700, 800, 900)
// - Body: Archivo (400, 500, 600, 700)
// - Technical accents / telemetry: IBM Plex Mono (400, 500)
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
  display: "swap",
})

const archivo = Archivo({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-archivo",
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "Team Meckartans | SCTCE Student Motorsport", template: "%s | Team Meckartans" },
  description:
    "Team Meckartans: the official student motorsport team of Sree Chitra Thirunal College of Engineering, Thiruvananthapuram. Designing, building and racing karts and ATVs since 2013.",
  icons: { icon: "/favicon.png" },
}

export const viewport: Viewport = { themeColor: "#08080A" }

// Runs before first paint: lets CSS hide on-load/on-scroll animated elements until GSAP takes over (see globals.css),
// and un-hides everything if the app hasn't hydrated within 4s (slow or failed JS).
const FOUC_GUARD = `(function(){var d=document.documentElement;d.classList.add("js");setTimeout(function(){if(!d.classList.contains("hydrated"))d.classList.remove("js")},4000)})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${barlowCondensed.variable} ${archivo.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FOUC_GUARD }} />
      </head>
      <body>
        <SmoothScroll>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-accent focus:px-4 focus:py-2">
            Skip to content
          </a>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
          <RouteScroll />
          <PageTransition />
          <HudCursor />
        </SmoothScroll>
      </body>
    </html>
  )
}
