"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { animate, motion, useMotionValue } from "motion/react"
import { setCovered } from "@/lib/page-transition"
import styles from "./page-transition.module.css"

type Phase = "idle" | "cover" | "load" | "green" | "reveal"
type View = { active: boolean; count: number; green: boolean; status: string }
const IDLE: View = { active: false, count: 0, green: false, status: "" }
const SKIP = new Set(["/about"])
const EASE = [0.16, 1, 0.3, 1] as const
const TIMING = { cover: 0.22, step: 60, minimum: 440, green: 150, reveal: 0.32, failsafe: 6000 }
const normalize = (path: string) => path.replace(/\/+$/, "") || "/"

/** Mount once in the persistent root layout, outside keyed route content.
 * Route commit is NOT an image/Suspense readiness guarantee.
 * data-page-transition="off" lets custom-navigation anchors own their click.
 */
export function PageTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const [view, setView] = useState<View>(IDLE)
  const opacity = useMotionValue(0)
  const lift = useMotionValue(0)
  const overlayRef = useRef<HTMLDivElement>(null)
  const committedRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let phase: Phase = "idle"
    let disposed = false
    let startedAt = 0
    let ready = false
    let queued = false
    let sourcePath = ""
    let previousFocus: HTMLElement | null = null
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const frames = new Set<number>()
    const controls = new Set<{ stop: () => void }>()
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const later = (fn: () => void, delay: number) => {
      const id = setTimeout(() => { timers.delete(id); if (!disposed) fn() }, delay)
      timers.add(id)
    }
    const frame = (fn: () => void) => {
      const id = requestAnimationFrame(() => { frames.delete(id); if (!disposed) fn() })
      frames.add(id)
    }
    const clearWork = () => {
      timers.forEach(clearTimeout)
      frames.forEach(cancelAnimationFrame)
      controls.forEach(control => control.stop())
      timers.clear(); frames.clear(); controls.clear()
    }
    const restoreFocus = () => {
      const active = document.activeElement
      if (active !== overlayRef.current && active !== document.body && active?.isConnected) return
      const unchanged = window.location.pathname === sourcePath
      const target = unchanged && previousFocus?.isConnected
        ? previousFocus : document.querySelector<HTMLElement>("main, [role='main']")
      if (!target) return
      const tabindex = target.getAttribute("tabindex")
      if (tabindex === null) target.setAttribute("tabindex", "-1")
      target.focus({ preventScroll: true })
      if (tabindex === null) target.removeAttribute("tabindex")
    }
    const finish = () => {
      if (disposed) return
      phase = "idle"
      setView(IDLE)
      restoreFocus()
    }
    const uncover = (launch: boolean) => {
      if (phase === "idle" || phase === "reveal") return
      clearWork()
      phase = "reveal"
      // Preserve the original contract: page intros resume as reveal starts.
      setCovered(false)
      if (!launch) setView(v => ({ ...v, green: false, count: 0, status: "" }))
      const duration = reduced.matches ? 0 : TIMING.reveal
      controls.add(animate(lift, launch ? -64 : 0, { duration, ease: EASE }))
      const fade = animate(opacity, 0, { duration, ease: EASE })
      controls.add(fade)
      void fade.then(() => { if (!disposed && phase === "reveal") finish() })
    }
    const release = () => {
      if (phase !== "load" || !ready || queued) return
      queued = true
      later(() => {
        // Give the committed route a paint opportunity; not an asset-ready signal.
        frame(() => frame(() => {
          if (phase !== "load") return
          phase = "green"
          setView(v => ({ ...v, green: true, status: "GO — FULL SEND" }))
          later(() => uncover(true), TIMING.green)
        }))
      }, Math.max(0, TIMING.minimum - (performance.now() - startedAt)))
    }
    committedRef.current = () => {
      if (phase === "cover" || phase === "load") { ready = true; release() }
    }
    const start = (href: string, historyNavigation = false) => {
      if (phase !== "idle") return
      phase = "cover"
      ready = historyNavigation
      queued = false
      sourcePath = window.location.pathname
      startedAt = performance.now()
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      opacity.jump(0); lift.jump(0)
      setCovered(true)
      setView({ active: true, count: 0, green: false, status: "ARMING START SEQUENCE" })
      frame(() => overlayRef.current?.focus({ preventScroll: true }))
      later(() => uncover(false), TIMING.failsafe)
      const cover = animate(opacity, 1, { duration: TIMING.cover, ease: "easeOut" })
      controls.add(cover)
      for (let count = 1; count <= 5; count++) {
        later(() => {
          if (phase !== "cover") return
          setView(v => ({ ...v, count, status: count === 5 ? "HOLD — READY TO RACE" : "ARMING START SEQUENCE" }))
          if (count !== 5) return
          // Both all-red and opaque coverage must complete before router.push.
          void cover.then(() => {
            if (disposed || phase !== "cover") return
            phase = "load"
            if (!historyNavigation) {
              try { router.push(href) } catch { uncover(false); return }
            }
            release()
          })
        }, TIMING.step * count)
      }
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.composedPath().find(node => node instanceof HTMLAnchorElement)
      if (!(anchor instanceof HTMLAnchorElement) || !anchor.href) return
      if (anchor.closest('[data-page-transition="off"]') || anchor.hasAttribute("download") || anchor.relList.contains("external")) return
      if (anchor.target && anchor.target !== "_self") return
      const url = new URL(anchor.href, window.location.href)
      if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname || SKIP.has(normalize(url.pathname)) || reduced.matches) return
      event.preventDefault()
      // Do not stop propagation: analytics and link handlers still receive the event.
      // Custom handlers that navigate independently must opt out using the data attribute.
      if (phase === "idle") start(url.pathname + url.search + url.hash)
    }
    const onPopState = () => {
      if (reduced.matches || SKIP.has(normalize(window.location.pathname))) {
        if (phase !== "idle") uncover(false)
        return
      }
      // History has already navigated; this is a cosmetic sequence, not a route gate.
      if (phase === "idle") start(window.location.href, true)
      else if (phase === "cover" || phase === "load") uncover(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (phase === "idle" || event.key !== "Tab") return
      event.preventDefault()
      overlayRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener("click", onClick, true)
    document.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      disposed = true
      clearWork()
      committedRef.current = null
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("popstate", onPopState)
      setCovered(false)
    }
  }, [router, opacity, lift])

  useEffect(() => { committedRef.current?.() }, [pathname])

  return (
    <>
      <span className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {view.active ? "Opening page. Please wait." : ""}
      </span>
      <div
        ref={overlayRef}
        className={styles.overlay}
        tabIndex={-1}
        role="group"
        aria-label="Page transition"
        aria-hidden={!view.active}
        style={{ visibility: view.active ? "visible" : "hidden", pointerEvents: view.active ? "auto" : "none" }}
      >
        <motion.div className={styles.backdrop} style={{ opacity }} aria-hidden="true" />
        <motion.div
          className={styles.scene}
          data-green={view.green ? "true" : "false"}
          style={{ opacity, y: lift }}
          aria-hidden="true"
        >
          <div className={styles.ambient} />
          <div className={styles.track}><i /><i /><i /><i /></div>
          <div className={styles.assembly}>
            <div className={styles.topline}>
              <span className={styles.brand}>TEAM MECKARTANS</span>
              <span className={styles.discipline}>KARTING / ENGINEERING / RACING</span>
            </div>
            <div className={styles.beam}>
              <span className={styles.beamRule} />
            </div>
            <div className={styles.mounts}><i /><i /><i /></div>
            <div className={styles.panel}>
              <span className={`${styles.bolt} ${styles.boltTL}`} />
              <span className={`${styles.bolt} ${styles.boltTR}`} />
              <span className={`${styles.bolt} ${styles.boltBL}`} />
              <span className={`${styles.bolt} ${styles.boltBR}`} />
              <div className={styles.panelHeader}>
                <span>GRID CONTROL</span>
                <span className={styles.system}><i /> {view.green ? "RELEASED" : "SEQUENCE ACTIVE"}</span>
              </div>
              <div className={styles.signals}>
                {[1, 2, 3, 4, 5].map(index => (
                  <div className={styles.module} key={index} data-on={view.count >= index ? "true" : "false"} data-green={view.green ? "true" : "false"}>
                    <span className={styles.number}>0{index}</span>
                    <div className={styles.hood}>
                      <div className={styles.bezel}>
                        <div className={styles.lens}>
                          <div className={`${styles.leds} ${styles.offLEDs}`} />
                          <div className={`${styles.leds} ${styles.redLEDs}`} />
                          <div className={`${styles.leds} ${styles.greenLEDs}`} />
                          <div className={styles.optics} />
                          <div className={styles.glass} />
                        </div>
                      </div>
                    </div>
                    <span className={styles.moduleTick} />
                  </div>
                ))}
              </div>
              <div className={styles.panelFooter}><span>BUILT BY HAND.</span><span className={styles.checkers} /><span>RUN AT SPEED.</span></div>
            </div>
            <div className={styles.status}>
              <span className={styles.statusDot} />
              <span>{view.status || "ARMING START SEQUENCE"}</span>
              <span className={styles.statusCount}>{view.green ? "GO" : `${String(view.count).padStart(2, "0")} / 05`}</span>
            </div>
            <div className={styles.caption}>FROM THE WORKSHOP TO THE STARTING GRID.</div>
          </div>
          <div className={styles.lowerMark}><span>MECHANICAL BY DESIGN</span><span className={styles.lowerLine} /><span>COMPETITIVE BY NATURE</span></div>
        </motion.div>
      </div>
    </>
  )
}