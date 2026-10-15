"use client"

// HUD reticle cursor, after the team's targeting-reticle artwork: a split white ring inside a red segmented ring,
// with a tick ring and a heavy red sweep arc around them. Desktop mouse only; touch devices keep the system cursor.
//   rest:   the compact core (centre dot, split ring, segmented ring drifting round)
//   hover:  over anything clickable the tick ring turns into place and the sweep arcs draw on; the drift speeds up
//   press:  the core tightens, the segmented ring clicks round one segment and a thin ring pings outward
// The centre dot sits exactly on the pointer (it is the hotspot); the rings trail it on a stiff spring. The native
// cursor is only hidden once this mounts (the `hud-cursor` class, globals.css), so without JS the system cursor stays.
// Text fields keep the native I-beam and the reticle steps aside. Reduced motion: no drift, ping or trail, and the
// hover layers simply switch on.

import { useEffect, useRef, useState, type SVGProps } from "react"
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Transition,
} from "motion/react"

import { cn } from "@/lib/utils"

const EASE_OUT = [0.16, 1, 0.3, 1] as const // --ds-motion-ease-out
const FINE_POINTER = "(hover: hover) and (pointer: fine)"
// Over these the reticle opens. The gallery's 3D canvas has no element per photo: it sets its own inline
// `cursor: pointer` over one instead (depth-field.tsx), which is read below.
const CLICKABLE =
  'a[href], button:not(:disabled), [role="button"], [role="tab"], [role="link"], summary, label, select, .cursor-pointer, input:is([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="file"])'
// Text entry: the reticle fades out for the native I-beam. Keep in step with the hud-cursor rules in globals.css.
const TEXT =
  'textarea, [contenteditable="true"], input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"], [type="file"], [type="range"], [type="color"])'

const TRAIL = { stiffness: 1800, damping: 60, mass: 0.5 } // critically damped, ~17ms behind the dot
const KICK = { stiffness: 400, damping: 30 }
const REST_SPIN = 18 // segmented ring drift, deg/s
const HOVER_SPIN = 72
const SEGMENTS = 24
// a faint dark edge so the hairlines hold up over bright photos, without filling the gaps between them
const HALO = "drop-shadow(0 0 1px color-mix(in srgb, var(--ds-color-background) 60%, transparent))"

// ---- geometry: one 90px box, origin at the centre, 1 unit = 1px, angles clockwise from 3 o'clock ----
const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return [r * Math.cos(a), r * Math.sin(a)] as const
}
/** Arc of radius r from a0 to a1 degrees; a1 < a0 runs anticlockwise. */
const arc = (r: number, a0: number, a1: number) => {
  const [x0, y0] = pt(r, a0)
  const [x1, y1] = pt(r, a1)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

// Outline only: every stroke is a hairline out at the rim, so the middle stays clear and what's under it reads.
const SPLIT_RING = [12, 102, 192, 282].map((a) => arc(17.5, a, a + 66)) // four arcs, gaps on the compass points
const SEG_R = 20.5
const SEG = (2 * Math.PI * SEG_R) / SEGMENTS
const TICKS = Array.from({ length: 36 }, (_, i) => {
  const major = i % 9 === 0 // longer ticks on the compass points
  const [x1, y1] = pt(major ? 25.5 : 27, i * 10)
  const [x2, y2] = pt(major ? 31.5 : 30, i * 10)
  return { x1, y1, x2, y2 }
})
// the sweep arc, anticlockwise over the top-left as in the artwork; the artwork's dark slots become small breaks
const SWEEP = [[-40, -92], [-98, -137], [-143, -182], [-188, -240]].map(([a0, a1]) => arc(36, a0, a1)).join(" ")
const OUTER = arc(42, 80, 240)
const OUTER_HEAVY = arc(42, 120, 195)

function Layer({ className, children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-45 -45 90 90" className={cn("absolute inset-0 size-full overflow-visible fill-none", className)} {...props}>
      {children}
    </svg>
  )
}

/** The site cursor on desktop; renders nothing on touch screens. Mounted once, in the root layout. */
export function HudCursor() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => setEnabled(window.matchMedia(FINE_POINTER).matches), [])
  return enabled ? <Reticle /> : null
}

type Mode = "rest" | "hover" | "text"

function Reticle() {
  const reduced = useReducedMotion() ?? false
  const [shown, setShown] = useState(false) // false until the first mouse move, and while the pointer is outside
  const [mode, setMode] = useState<Mode>("rest")
  const [pressed, setPressed] = useState(false)
  const hovering = useRef(false) // `mode === "hover"` for the frame loop

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const trailX = useSpring(x, TRAIL)
  const trailY = useSpring(y, TRAIL)

  // segmented ring: a drift whose speed eases between rest and hover, plus a one-segment kick per click
  const spin = useMotionValue(0)
  const speed = useRef(REST_SPIN)
  const kickTo = useRef(0)
  const kick = useSpring(0, KICK)
  const rotate = useTransform(() => spin.get() + kick.get())
  const pingScale = useMotionValue(1)
  const pingOpacity = useMotionValue(0)

  useAnimationFrame((_, delta) => {
    if (reduced) return
    speed.current += ((hovering.current ? HOVER_SPIN : REST_SPIN) - speed.current) * Math.min(1, delta / 300)
    spin.set((spin.get() + (speed.current * delta) / 1000) % 360)
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.add("hud-cursor")
    let visible = false
    let px = 0
    let py = 0
    let raf = 0

    const read = (el: Element | null): Mode => {
      if (!el) return "rest"
      if (el.closest(TEXT)) return "text"
      if ((el instanceof HTMLElement && el.style.cursor === "pointer") || el.closest(CLICKABLE)) return "hover"
      return "rest"
    }
    const update = (m: Mode) => {
      hovering.current = m === "hover"
      setMode(m)
    }
    const hide = () => {
      visible = false
      setShown(false)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return hide()
      px = e.clientX
      py = e.clientY
      if (!visible) {
        // appear where the pointer is rather than trailing in from the last spot
        trailX.jump(px)
        trailY.jump(py)
        visible = true
        setShown(true)
      }
      x.set(px)
      y.set(py)
      update(read(e.target as Element))
    }
    // scrolling moves the page under a still pointer
    const onScroll = () => {
      if (!visible || raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        update(read(document.elementFromPoint(px, py)))
      })
    }
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) hide() // left the window
    }
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return
      setPressed(true)
      if (reduced) return
      kickTo.current += 360 / SEGMENTS
      kick.set(kickTo.current)
      animate(pingScale, [1, 1.9], { duration: 0.5, ease: EASE_OUT })
      animate(pingOpacity, [0.6, 0], { duration: 0.5, ease: "easeOut" })
    }
    const onUp = () => setPressed(false)

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, true)
    window.addEventListener("pointerup", onUp, true)
    window.addEventListener("pointercancel", onUp, true)
    window.addEventListener("blur", onUp)
    window.addEventListener("scroll", onScroll, { capture: true, passive: true })
    document.addEventListener("pointerout", onOut)
    return () => {
      root.classList.remove("hud-cursor")
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("pointerup", onUp, true)
      window.removeEventListener("pointercancel", onUp, true)
      window.removeEventListener("blur", onUp)
      window.removeEventListener("scroll", onScroll, { capture: true })
      document.removeEventListener("pointerout", onOut)
    }
  }, [reduced, x, y, trailX, trailY, kick, pingScale, pingOpacity])

  const hover = mode === "hover"
  const t = (transition: Transition): Transition => (reduced ? { duration: 0 } : transition)

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[110]"
      initial={false}
      animate={{ opacity: shown && mode !== "text" ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div className="absolute -left-[45px] -top-[45px] size-[90px]" style={{ x: reduced ? x : trailX, y: reduced ? y : trailY, filter: HALO }}>
        {/* core: split ring inside the segmented ring, both hairlines at the rim; tightens while pressed */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ scale: pressed ? 0.85 : 1 }}
          transition={t({ type: "spring", stiffness: 600, damping: 22 })}
        >
          <Layer className="stroke-foreground/75" strokeWidth={1}>
            {SPLIT_RING.map((d) => (
              <path key={d} d={d} />
            ))}
          </Layer>
          <motion.div className="absolute inset-0" style={{ rotate }}>
            <Layer>
              <circle r={SEG_R} className="stroke-accent" strokeWidth={1.25} strokeDasharray={`${SEG * 0.6} ${SEG * 0.4}`} />
            </Layer>
          </motion.div>
        </motion.div>

        {/* hover: the tick ring turns into place */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={hover ? { opacity: 1, rotate: 0, scale: 1 } : { opacity: 0, rotate: -30, scale: 0.9 }}
          transition={t({ duration: hover ? 0.4 : 0.2, ease: EASE_OUT })}
        >
          <Layer className="stroke-foreground/60" strokeWidth={1}>
            {TICKS.map((l, i) => (
              <line key={i} {...l} />
            ))}
          </Layer>
        </motion.div>

        {/* hover: the sweep arcs draw on */}
        <Layer className="stroke-accent">
          <motion.path
            d={SWEEP}
            strokeWidth={1.5}
            initial={false}
            animate={{ pathLength: hover ? 1 : 0, opacity: hover ? 1 : 0 }}
            transition={t({ pathLength: { duration: hover ? 0.45 : 0.2, ease: EASE_OUT }, opacity: { duration: 0.1 } })}
          />
          <motion.g initial={false} animate={{ opacity: hover ? 1 : 0 }} transition={t({ duration: 0.1, delay: hover ? 0.08 : 0 })}>
            <motion.path
              d={OUTER}
              strokeWidth={1}
              initial={false}
              animate={{ pathLength: hover ? 1 : 0 }}
              transition={t({ duration: hover ? 0.5 : 0.2, delay: hover ? 0.08 : 0, ease: EASE_OUT })}
            />
            <motion.path
              d={OUTER_HEAVY}
              strokeWidth={2}
              initial={false}
              animate={{ pathLength: hover ? 1 : 0 }}
              transition={t({ duration: hover ? 0.4 : 0.2, delay: hover ? 0.16 : 0, ease: EASE_OUT })}
            />
          </motion.g>
        </Layer>

        {/* press: a thin ring pings outward */}
        <motion.div className="absolute inset-0" style={{ scale: pingScale, opacity: pingOpacity }}>
          <Layer>
            <circle r={SEG_R} className="stroke-accent" strokeWidth={1} />
          </Layer>
        </motion.div>
      </motion.div>

      {/* the hotspot: exactly on the pointer */}
      <motion.div className="absolute -left-[1.5px] -top-[1.5px] size-[3px] rounded-full bg-foreground ring-1 ring-background/50" style={{ x, y }} />
    </motion.div>
  )
}
