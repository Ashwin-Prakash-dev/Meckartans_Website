"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"

import { gsap, ScrollTrigger } from "@/lib/motion"

const LenisContext = createContext<Lenis | null>(null)
export const useLenis = () => useContext(LenisContext)

/** Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. Off for reduced motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    document.documentElement.classList.add("hydrated") // tells the FOUC fail-safe in layout.tsx the app is live
    // Re-measure scroll triggers once web fonts are in: text reflow after a late font swap would shift every trigger.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const l = new Lenis({ duration: 1.1, smoothWheel: true })
    l.on("scroll", ScrollTrigger.update)
    const tick = (t: number) => l.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    setLenis(l)
    return () => {
      gsap.ticker.remove(tick)
      l.destroy()
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}

/** Scroll position on navigation: hash -> that element (e.g. #contact), otherwise top. Then re-measure triggers. */
export function RouteScroll() {
  const pathname = usePathname()
  const lenis = useLenis()
  const first = useRef(true)

  useEffect(() => {
    const go = () => {
      const hash = window.location.hash // Next doesn't expose the hash; read it after navigation
      const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
      if (target) {
        if (lenis) lenis.scrollTo(target, { offset: 0 })
        else target.scrollIntoView()
      } else {
        if (lenis) lenis.scrollTo(0, { immediate: true })
        else window.scrollTo(0, 0)
      }
      ScrollTrigger.refresh()
    }
    // let the new page render (and its images reserve space) first
    const id = window.setTimeout(go, first.current ? 0 : 30)
    first.current = false
    return () => window.clearTimeout(id)
  }, [pathname, lenis])

  return null
}
