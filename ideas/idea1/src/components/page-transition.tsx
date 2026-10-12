"use client"

/**
 * IDEA 01: Telemetry Slipstream
 * Aerodynamic kinetic curtains with skew-angled fins and live telemetry HUD.
 * Flawless lifecycle: sequential cover -> route push -> paint settle -> reveal.
 * Full support for /about (suppressing conflicting handlers) and browser back/forward navigation.
 */

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { animate, motion, useMotionValue, useTransform } from "motion/react"
import { setCovered } from "@/lib/page-transition"

const EASE_SNAP = [0.65, 0, 0.35, 1] as const
const EASE_RELEASE = [0.16, 1, 0.3, 1] as const
const FAILSAFE_MS = 6000

type Phase = "idle" | "cover" | "load" | "reveal"

export function PageTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [targetRoute, setTargetRoute] = useState("")
  const phase = useRef<Phase>("idle")
  const animControl = useRef<{ stop: () => void } | null>(null)
  const failsafe = useRef<NodeJS.Timeout | number>(0)

  // split: 1 = fully open (offscreen), 0 = closed (covering screen)
  const split = useMotionValue(1)
  const telemetryOpacity = useTransform(split, [0, 0.15, 0.85, 1], [1, 1, 0, 0])

  // Left and right blades
  const leftX = useTransform(split, (v) => `${(-v * 105).toFixed(2)}%`)
  const rightX = useTransform(split, (v) => `${(v * 105).toFixed(2)}%`)

  const reveal = () => {
    if (phase.current !== "load" && phase.current !== "cover") return
    phase.current = "reveal"
    clearTimeout(failsafe.current as number)
    setCovered(false) // Unfreezes incoming page's intro animations

    animControl.current?.stop()
    const ctrl = animate(split, 1, { duration: 0.38, ease: EASE_RELEASE })
    animControl.current = ctrl
    ctrl.then(() => {
      phase.current = "idle"
      setActive(false)
    })
  }

  const start = (href: string, isPop = false) => {
    if (phase.current !== "idle") return
    phase.current = "cover"
    setTargetRoute(href.toUpperCase())
    setCovered(true)
    setActive(true)

    clearTimeout(failsafe.current as number)
    failsafe.current = setTimeout(reveal, FAILSAFE_MS)

    animControl.current?.stop()
    const ctrl = animate(split, 0, { duration: 0.28, ease: EASE_SNAP })
    animControl.current = ctrl
    ctrl.then(() => {
      // Screen is now fully covered
      phase.current = "load"
      if (!isPop) {
        router.push(href)
      } else {
        // Popstate already updated the history entry, give Next.js 60ms to paint and reveal
        setTimeout(reveal, 60)
      }
    })
  }

  // Detect when route changes in App Router
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
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

      // Prevent default and stop immediate propagation so conflicting page handlers (like morphToHero) don't clash
      e.preventDefault()
      e.stopImmediatePropagation()
      if (phase.current === "idle") start(url.pathname + url.search + url.hash, false)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  useEffect(() => () => {
    clearTimeout(failsafe.current as number)
    animControl.current?.stop()
  }, [])

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[95] overflow-hidden pointer-events-none"
      style={{ visibility: active ? "visible" : "hidden", pointerEvents: active ? "auto" : "none" }}
    >
      {/* Left Aerodynamic Blade */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-[55vw] bg-background border-r border-border shadow-[15px_0_35px_rgba(0,0,0,0.8)]"
        style={{
          x: leftX,
          skewX: "-12deg",
          transformOrigin: "bottom left",
        }}
      >
        {/* Leading Red Trim Strip */}
        <div className="absolute top-0 bottom-0 right-0 w-[3px] bg-accent shadow-[0_0_12px_rgba(229,32,46,0.8)]" />
      </motion.div>

      {/* Right Aerodynamic Blade */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-[55vw] bg-background border-l border-border shadow-[-15px_0_35px_rgba(0,0,0,0.8)]"
        style={{
          x: rightX,
          skewX: "-12deg",
          transformOrigin: "top right",
        }}
      >
        {/* Trailing Graphite Pin */}
        <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-accent-dim" />
      </motion.div>

      {/* Center Telemetry Readout */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
        style={{ opacity: telemetryOpacity }}
      >
        <div className="flex items-center gap-3 px-4 py-1.5 rounded bg-muted/80 backdrop-blur-md border border-border shadow-2xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="font-mono text-xs tracking-wider text-foreground">
            AERO_FLOW <span className="text-accent">&gt;&gt;</span> {targetRoute || "TELEMETRY"}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground border-l border-border pl-2">
            12,450 RPM
          </span>
        </div>
      </motion.div>
    </div>
  )
}
