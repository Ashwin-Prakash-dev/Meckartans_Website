"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { usePathname, useRouter } from "next/navigation"
import { animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react"

import { useLenis } from "@/components/smooth-scroll"
import { setCovered } from "@/lib/page-transition"

const EASE = [0.76, 0, 0.24, 1] as const
const FAILSAFE_MS = 8000
const MIN_HOLD_MS = 600
const REVEAL_MS = 700
const SKIP = new Set(["/about"])

type Phase = "idle" | "cover" | "load" | "reveal"
type Props = {
  /** Number of telemetry streaks in the center band. Clamped to 3–16. */
  lineCount?: number
  /** Streak travel time range in seconds across the viewport. Clamped to 0.6–1.1. */
  travelSpeedRange?: readonly [number, number]
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function PageTransition({ lineCount = 9, travelSpeedRange = [0.6, 1.1] }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const lenis = useLenis()
  const count = clamp(Math.round(Number.isFinite(lineCount) ? lineCount : 9), 3, 16)
  const requestedSpeedRange = travelSpeedRange.every(Number.isFinite) ? travelSpeedRange : [0.6, 1.1] as const
  const speedMin = clamp(Math.min(...requestedSpeedRange), 0.6, 1.1)
  const speedMax = clamp(Math.max(...requestedSpeedRange), speedMin, 1.1)
  const streaks = useMemo(() => Array.from({ length: count }, (_, i) => {
    const length = 120 + ((i * 47 + 31) % 181)
    const duration = speedMin + ((i * 17 + 3) % 51) / 50 * (speedMax - speedMin)
    return {
      left: `${((i * 37 + 11) % 100)}%`,
      top: `${12 + ((i * 29 + 7) % 76)}%`,
      width: `${length}px`,
      opacity: 0.5 + ((i * 13) % 31) / 100,
      animationDuration: `${duration}s`,
      animationDelay: `${-((i * 19 + 3) % 100) / 100 * duration}s`,
      background: i % 4 === 0 ? "var(--ds-color-accent)" : "var(--ds-color-foreground)",
    }
  }), [count, speedMin, speedMax])

  const [active, setActive] = useState(false)
  const [phaseView, setPhaseView] = useState<Phase>("idle")
  const [reduced, setReduced] = useState(false)
  const [logoPulsing, setLogoPulsing] = useState(false)
  const phase = useRef<Phase>("idle")
  const startPath = useRef("")
  const arrived = useRef(false)
  const loadStart = useRef(0)
  const controls = useRef<AnimationPlaybackControls[]>([])
  const failsafe = useRef<number | null>(null)
  const arrivalTimer = useRef<number | null>(null)
  const introTimer = useRef<number | null>(null)
  const progress = useMotionValue(0)
  const root = useRef<HTMLDivElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const band = useRef<HTMLDivElement>(null)
  const logo = useRef<HTMLImageElement>(null)
  const reducedScreen = useRef<HTMLDivElement>(null)
  const lenisWasStopped = useRef(false)
  const lenisRef = useRef(lenis)
  lenisRef.current = lenis

  const keep = (control: AnimationPlaybackControls) => {
    controls.current.push(control)
    return control
  }
  const stopAnimations = () => {
    const running = controls.current.splice(0)
    running.forEach((control) => control.stop())
  }
  const resetVisualState = () => {
    if (top.current) {
      top.current.style.transform = "translateY(-110%)"
      top.current.style.opacity = "1"
    }
    if (bottom.current) {
      bottom.current.style.transform = "translateY(110%)"
      bottom.current.style.opacity = "1"
    }
    if (band.current) {
      band.current.style.transform = "scaleX(0) scaleY(1)"
      band.current.style.opacity = "1"
    }
    if (logo.current) {
      logo.current.style.transform = "scale(.9)"
      logo.current.style.opacity = "0"
    }
    if (reducedScreen.current) reducedScreen.current.style.opacity = "0"
    progress.jump(0)
    setLogoPulsing(false)
  }
  const clearTimers = () => {
    if (failsafe.current) window.clearTimeout(failsafe.current)
    if (arrivalTimer.current) window.clearTimeout(arrivalTimer.current)
    if (introTimer.current) window.clearTimeout(introTimer.current)
    failsafe.current = arrivalTimer.current = introTimer.current = null
  }
  const lock = () => {
    document.documentElement.classList.add("page-transition-active")
    lenisWasStopped.current = Boolean(lenis?.isStopped)
    if (lenis && !lenisWasStopped.current) lenis.stop()
  }
  const unlock = () => {
    document.documentElement.classList.remove("page-transition-active")
    if (lenis && !lenisWasStopped.current) lenis.start()
  }
  const interruptToCommittedRoute = () => {
    clearTimers()
    stopAnimations()
    resetVisualState()
    phase.current = "idle"
    setPhaseView("idle")
    setActive(false)
    setCovered(false)
    unlock()
  }

  const finish = () => {
    if (phase.current !== "load" || arrived.current) return
    if (arrivalTimer.current) window.clearTimeout(arrivalTimer.current)
    arrivalTimer.current = null
    const remaining = Math.max(0, MIN_HOLD_MS - (performance.now() - loadStart.current))
    arrivalTimer.current = window.setTimeout(() => {
      if (phase.current !== "load" || arrived.current) return
      arrived.current = true
      keep(animate(progress, 1, { duration: 0.2, ease: "easeOut" })).finished.then(reveal).catch(() => {})
    }, remaining)
  }

  const reveal = () => {
    if (phase.current !== "load") return
    // The load progress animation is still alive when the route commits. Stop it
    // before the reveal owns the motion values and overlay elements.
    stopAnimations()
    phase.current = "reveal"
    setPhaseView("reveal")
    setLogoPulsing(false)
    if (failsafe.current) window.clearTimeout(failsafe.current)
    failsafe.current = null
    introTimer.current = window.setTimeout(() => setCovered(false), reduced ? 0 : 260)
    const duration = reduced ? 0.28 : REVEAL_MS / 1000
    const topEl = top.current
    const bottomEl = bottom.current
    const bandEl = band.current
    const logoEl = logo.current
    const simpleScreen = reducedScreen.current
    const exiting = [
      topEl && keep(animate(topEl, { y: "-110%", opacity: reduced ? 0 : 1 }, { duration, ease: EASE })),
      bottomEl && keep(animate(bottomEl, { y: "110%", opacity: reduced ? 0 : 1 }, { duration, ease: EASE })),
      bandEl && keep(animate(bandEl, { scaleY: [1, 0], opacity: reduced ? 0 : 1 }, { duration: reduced ? 0.2 : duration, ease: EASE })),
      logoEl && keep(animate(logoEl, { opacity: 0, scale: 0.9 }, { duration: 0.18, ease: "easeOut" })),
      simpleScreen && keep(animate(simpleScreen, { opacity: 0 }, { duration: 0.28, ease: "easeOut" })),
    ].filter(Boolean) as AnimationPlaybackControls[]
    Promise.all(exiting.map((control) => control.finished)).then(() => {
      if (phase.current !== "reveal") return
      phase.current = "idle"
      setPhaseView("idle")
      resetVisualState()
      setActive(false)
      unlock()
    }).catch(() => {})
  }

  const startLoad = (href: string) => {
    stopAnimations()
    resetVisualState()
    startPath.current = pathname
    phase.current = "cover"
    setPhaseView("cover")
    arrived.current = false
    setLogoPulsing(false)
    setCovered(true)
    lock()
    progress.jump(0)
    setActive(true)
    const topEl = top.current
    const bottomEl = bottom.current
    const bandEl = band.current
    const logoEl = logo.current
    const cover = async () => {
      if (reduced) {
        if (reducedScreen.current) await keep(animate(reducedScreen.current, { opacity: 1 }, { duration: 0.2, ease: "easeOut" })).finished.catch(() => {})
        if (phase.current !== "cover") return
        phase.current = "load"
        setPhaseView("load")
        loadStart.current = performance.now()
        keep(animate(progress, [0, 0.78, 0.9], { duration: 5, times: [0, 0.24, 1], ease: ["easeOut", "linear"] }))
        router.push(href)
        failsafe.current = window.setTimeout(finish, FAILSAFE_MS)
        return
      }
      if (topEl && bottomEl) {
        await Promise.all([
          keep(animate(topEl, { y: "0%" }, { duration: 0.38, ease: EASE })),
          keep(animate(bottomEl, { y: "0%" }, { duration: 0.38, ease: EASE })),
        ].map((control) => control.finished.catch(() => {})))
      }
      if (phase.current !== "cover") return
      phase.current = "load"
      setPhaseView("load")
      loadStart.current = performance.now()
      // Explicitly seed both ends of the scale animation. This prevents a
      // previous reveal's vertical collapse from becoming the next run's start.
      if (bandEl) await keep(animate(bandEl, { scaleX: [0, 1], scaleY: [1, 1], opacity: [1, 1] }, { duration: 0.3, ease: EASE })).finished.catch(() => {})
      if (phase.current !== "load") return
      if (logoEl && !reduced) {
        keep(animate(logoEl, { opacity: 1, scale: 1 }, { duration: 0.22, delay: 0.06, ease: "easeOut" })).finished.then(() => setLogoPulsing(true)).catch(() => {})
      }
      keep(animate(progress, [0, 0.78, 0.9], { duration: 5, times: [0, 0.24, 1], ease: ["easeOut", "linear"] }))
      // Start routing as soon as the shutters have covered the outgoing page.
      router.push(href)
      failsafe.current = window.setTimeout(finish, FAILSAFE_MS)
    }
    void cover()
  }

  // Observe destination commits. RouteScroll gets 60ms to reset the scroll position before the reveal begins.
  useEffect(() => {
    if (phase.current === "cover" && pathname !== startPath.current) {
      interruptToCommittedRoute()
      return
    }
    if (phase.current !== "load") return
    const id = window.setTimeout(finish, 60)
    return () => window.clearTimeout(id)
  }, [pathname])

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a")
      if (!(a instanceof HTMLAnchorElement) || !a.href) return
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname || SKIP.has(url.pathname)) return
      if (phase.current !== "idle") return
      e.preventDefault()
      startLoad(url.pathname + url.search + url.hash)
    }
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  })

  useEffect(() => () => {
    clearTimers()
    controls.current.forEach((control) => control.stop())
    document.documentElement.classList.remove("page-transition-active")
    const currentLenis = lenisRef.current
    if (currentLenis && !lenisWasStopped.current) currentLenis.start()
    if (phase.current !== "idle") setCovered(false)
  }, [])

  const panelStyle: CSSProperties = { transform: "translateY(-110%)" }
  const lowerPanelStyle: CSSProperties = { transform: "translateY(110%)" }

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="mt-transition fixed inset-0 z-[100]"
      data-active={active}
      data-phase={phaseView}
      data-reduced={reduced}
      data-logo-pulsing={logoPulsing}
      style={{ visibility: active ? "visible" : "hidden", pointerEvents: active ? "auto" : "none" }}
    >
      <div ref={top} className="mt-shutter mt-shutter-top" style={panelStyle}>
        <div className="mt-shutter-detail" />
      </div>
      <div ref={bottom} className="mt-shutter mt-shutter-bottom" style={lowerPanelStyle}>
        <div className="mt-shutter-detail" />
      </div>
      {reduced && <div ref={reducedScreen} className="mt-reduced-screen" />}
      <div ref={band} className="mt-center-band" style={{ transform: "scaleX(0)" }}>
        <div className="mt-band-grid" />
        <div className="mt-hazard mt-hazard-top" />
        <div className="mt-hazard mt-hazard-bottom" />
        {!reduced && <div className="mt-streak-field">{streaks.map((style, i) => <i key={i} style={style} />)}</div>}
      </div>
      {!reduced && <div className="mt-dash-ring" />}
      {!reduced && <div className="mt-logo-anchor">
        <div className="mt-logo-pulse">
          <img
            ref={logo}
            className="mt-transition-logo"
            src="/media/brand/logo-light.png"
            alt=""
            width={605}
            height={449}
            style={{ opacity: 0, transform: "scale(.9)" }}
          />
        </div>
      </div>}
      {!reduced && <div className="mt-progress-track"><motion.span className="mt-progress-fill" style={{ scaleX: progress }} /></div>}
      {reduced && <div className="mt-reduced-progress"><motion.span className="mt-progress-fill" style={{ scaleX: progress }} /></div>}
    </div>
  )
}
