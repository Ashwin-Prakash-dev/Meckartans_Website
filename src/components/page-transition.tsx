"use client"

// Route transition, after Motion's "Loading overlay" line reveal (motion.dev/examples/react-loading-line-reveal),
// in the team red instead of the example's magenta.
//   cover:  the red sheet closes in from both edges over the current page
//   load:   a thin dark line grows from the centre while the next route loads (a spring follows the load progress)
//   reveal: the line splits open sideways onto the new page (ease-out-quart, timed from the example)
// One red sheet does all three: its clip-path is the screen minus a centred rectangular hole (evenodd polygon), so
// the line *is* the hole, with a dark layer under it until the reveal.
// Links are intercepted in the capture phase. preventDefault() stops next/link's own navigation (it runs the link's
// onClick, then bails on defaultPrevented), and the route is pushed once the screen is covered. Same-page links
// (#contact, ?v=), links into SKIP routes, new tabs, downloads, external links and reduced motion navigate as before.

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { animate, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useSpring, useTransform, type AnimationPlaybackControls } from "motion/react"

import { setCovered } from "@/lib/page-transition"

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const // --ds-motion-ease-in-out
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const
const LINE = 1.5 // half the line's width, px
const MIN_LOAD_MS = 250 // the line always gets this long to grow, however fast the route arrives
const FAILSAFE_MS = 8000 // reveal anyway if the route never commits
// Routes this transition never runs into. /about has its own entrance from the home page's "About the team" link
// (the intro photo grows into its hero: lib/hero-morph.ts); every other way in is a plain navigation.
const SKIP = new Set(["/about"])

type Phase = "idle" | "cover" | "load" | "reveal"

export function PageTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const phase = useRef<Phase>("idle")
  const arrived = useRef(false)
  const loadStart = useRef(0)
  const creep = useRef<AnimationPlaybackControls | null>(null)
  const failsafe = useRef(0)

  // half-size of the hole in px, centred on the screen
  const holeX = useMotionValue(0)
  const holeY = useMotionValue(0)
  const dark = useMotionValue(0)
  const progress = useMotionValue(0)
  const loaded = useSpring(progress, { stiffness: 220, damping: 30, restDelta: 0.001 })

  const x = useTransform(holeX, (v) => v.toFixed(2))
  const y = useTransform(holeY, (v) => v.toFixed(2))
  const clipPath = useMotionTemplate`polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, calc(50% - ${x}px) calc(50% - ${y}px), calc(50% + ${x}px) calc(50% - ${y}px), calc(50% + ${x}px) calc(50% + ${y}px), calc(50% - ${x}px) calc(50% + ${y}px), calc(50% - ${x}px) calc(50% - ${y}px))`

  const reveal = () => {
    phase.current = "reveal"
    window.clearTimeout(failsafe.current)
    dark.jump(0)
    setCovered(false) // the new page's intro plays as it opens
    const opts = { duration: 0.8, delay: 0.07, ease: EASE_OUT_QUART }
    animate(holeY, window.innerHeight / 2 + 2, opts)
    animate(holeX, window.innerWidth / 2 + 2, opts).then(() => {
      phase.current = "idle"
      setActive(false)
    })
  }

  // load phase: the line's height follows the progress spring; full height + route committed = open
  useMotionValueEvent(loaded, "change", (v) => {
    if (phase.current !== "load") return
    holeY.set((v * window.innerHeight) / 2)
    if (arrived.current && v > 0.995) reveal()
  })

  const arrive = () => {
    if (phase.current !== "load" || arrived.current) return
    window.setTimeout(() => {
      creep.current?.stop()
      arrived.current = true
      progress.set(1)
    }, Math.max(0, MIN_LOAD_MS - (performance.now() - loadStart.current)))
  }

  const start = (href: string) => {
    phase.current = "cover"
    arrived.current = false
    setCovered(true)
    holeX.jump(window.innerWidth / 2 + 2)
    holeY.jump(window.innerHeight / 2 + 2)
    dark.jump(0)
    progress.jump(0)
    loaded.jump(0)
    setActive(true)

    animate(holeX, 0, { duration: 0.35, ease: EASE_IN_OUT }).then(() => {
      // covered: swap the hole for a zero-height line over the dark layer, then load
      holeY.jump(0)
      holeX.jump(LINE)
      dark.jump(1)
      phase.current = "load"
      loadStart.current = performance.now()
      // quick to 80%, then a slow crawl while the route is still loading (dev compiles, slow networks)
      creep.current = animate(progress, [0, 0.8, 0.95], { duration: 5, times: [0, 0.07, 1], ease: ["easeOut", "linear"] })
      failsafe.current = window.setTimeout(arrive, FAILSAFE_MS)
      router.push(href)
    })
  }

  // the route committed: give it a moment to paint (and RouteScroll to reset the scroll), then finish the line
  useEffect(() => {
    if (phase.current !== "load") return
    const id = window.setTimeout(arrive, 60)
    return () => window.clearTimeout(id)
  }, [pathname])

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
      if (phase.current === "idle") start(url.pathname + url.search + url.hash)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  })

  useEffect(() => () => window.clearTimeout(failsafe.current), [])

  return (
    <div aria-hidden className="fixed inset-0 z-[95]" style={{ visibility: active ? "visible" : "hidden", pointerEvents: active ? "auto" : "none" }}>
      <motion.div className="absolute inset-0 bg-background" style={{ opacity: dark }} />
      <motion.div className="absolute inset-0 bg-accent" style={{ clipPath, WebkitClipPath: clipPath }} />
    </div>
  )
}
