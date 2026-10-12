"use client"

/**
 * IDEA 02: Starting Grid Gantry
 * FIA 5-Light countdown sequence to "Lights Out" instant launch.
 *
 * cover:  dark backdrop fades in + 5 red LED indicators fire sequentially at 40ms intervals
 * load:   all 5 lights hold at full intensity while the next route loads
 * reveal: lights extinguish instantly, backdrop fades out (ease-out, 0.35s)
 *
 * Links are intercepted in the capture phase. preventDefault() stops next/link's own navigation
 * (it runs the link's onClick, then bails on defaultPrevented), and the route is pushed once all 5
 * lights are lit. Same-page links (#contact, ?v=), links into SKIP routes, new tabs, downloads,
 * external links and reduced motion navigate as before.
 */

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { animate, motion, useMotionValue } from "motion/react"
import { setCovered } from "@/lib/page-transition"

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const FAILSAFE_MS = 6000

// Routes this transition never runs into. /about has its own entrance from the home page's
// "About the team" link (the intro photo grows into its hero: lib/hero-morph.ts);
// every other way in is a plain navigation.
const SKIP = new Set(["/about"])

type Phase = "idle" | "cover" | "load" | "reveal"

export function PageTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [lightsCount, setLightsCount] = useState(0)
  const phase = useRef<Phase>("idle")
  const animControl = useRef<{ stop: () => void } | null>(null)
  const failsafe = useRef<NodeJS.Timeout | number>(0)
  const intervalId = useRef<NodeJS.Timeout | number>(0)

  // Backdrop opacity
  const opacity = useMotionValue(0)

  const reveal = () => {
    if (phase.current !== "load" && phase.current !== "cover") return
    phase.current = "reveal"
    clearTimeout(failsafe.current as number)
    clearInterval(intervalId.current as number)

    // Lights out immediately
    setLightsCount(0)
    setCovered(false) // Unfreezes incoming page intros

    animControl.current?.stop()
    const ctrl = animate(opacity, 0, { duration: 0.35, ease: EASE_OUT })
    animControl.current = ctrl
    ctrl.then(() => {
      phase.current = "idle"
      setActive(false)
    })
  }

  const start = (href: string, isPop = false) => {
    if (phase.current !== "idle") return
    phase.current = "cover"
    setLightsCount(0)
    setCovered(true)
    opacity.jump(0)
    setActive(true)

    clearTimeout(failsafe.current as number)
    failsafe.current = setTimeout(reveal, FAILSAFE_MS)

    // Fade in dark backdrop
    animControl.current?.stop()
    animControl.current = animate(opacity, 1, { duration: 0.22, ease: "easeOut" })

    // 5-light cascade sequence: 40ms interval
    let count = 0
    clearInterval(intervalId.current as number)
    intervalId.current = setInterval(() => {
      count += 1
      setLightsCount(count)
      if (count >= 5) {
        clearInterval(intervalId.current as number)
        phase.current = "load"
        if (!isPop) {
          router.push(href)
        } else {
          setTimeout(reveal, 60)
        }
      }
    }, 40)
  }

  // Detect route change in App Router
  useEffect(() => {
    if (phase.current === "load") {
      const id = setTimeout(reveal, 60)
      return () => clearTimeout(id)
    }
  }, [pathname])

  // Browser back/forward navigation support
  useEffect(() => {
    const onPopState = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
      if (phase.current !== "idle") return
      start(window.location.pathname, true)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  // Link capture
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a")
      if (!(a instanceof HTMLAnchorElement) || !a.href) return
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname || SKIP.has(url.pathname)) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

      e.preventDefault()
      e.stopImmediatePropagation()
      if (phase.current === "idle") start(url.pathname + url.search + url.hash, false)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  useEffect(() => () => {
    clearTimeout(failsafe.current as number)
    clearInterval(intervalId.current as number)
    animControl.current?.stop()
  }, [])

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[95] pointer-events-none"
      style={{ visibility: active ? "visible" : "hidden", pointerEvents: active ? "auto" : "none" }}
    >
      {/* Dark Backdrop */}
      <motion.div className="absolute inset-0 bg-background" style={{ opacity }} />

      {/* Starting Grid Gantry Bar & 5 Lights */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ opacity }}
      >
        <div className="bg-card/90 border border-border px-8 py-5 rounded-lg backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col items-center gap-4">
          <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            <span>Team Meckartans</span>
            <span className="text-accent">•</span>
            <span>Built by hand. Run at speed.</span>
          </div>

          <div className="flex items-center gap-4 px-2 py-1 bg-black/60 rounded-full border border-border/60">
            {[1, 2, 3, 4, 5].map((idx) => {
              const isOn = lightsCount >= idx
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-75 ${
                    isOn
                      ? "bg-accent shadow-[0_0_15px_#E5202E,0_0_30px_#E5202E]"
                      : "bg-[#1f0d0e] border border-border/40 opacity-40"
                  }`}
                />
              )
            })}
          </div>

          <span className="font-mono text-[11px] text-foreground tracking-widest uppercase">
            {lightsCount < 5 ? "PREPARING START..." : "HOLDING REV LIMITER"}
          </span>
        </div>
      </motion.div>
    </div>
  )
}
