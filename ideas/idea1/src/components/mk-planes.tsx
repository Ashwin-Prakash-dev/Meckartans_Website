"use client"

// After Motion's "Scroll velocity: 3D planes" example (motion.dev/examples/react-scroll-velocity-linked-offset):
// a row of image planes receding into depth that you fly through as you scroll. The scroll *velocity* bends the row
// into a wave (useVelocity of a spring-smoothed scroll value -> useSpring -> each plane's transform), and a hovered
// plane lifts toward you while its label scrambles in.
// Normalized for this site: driven by page scroll (a sticky stage inside a tall track) instead of capturing the
// wheel, so Lenis and the rest of the page behave as usual; each plane links to its MK Garage sheet; the vehicle at
// the front is named in the corner (the hover label's stand-in on touch screens); keyboard focus scrolls a plane to
// the front. Reduced motion gets the MK accordion instead (views/home.tsx).

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react"
import { ArrowRight } from "lucide-react"

import { SITE } from "@/content/site"
import { CATEGORY_LABEL, VEHICLES } from "@/content/vehicles"
import { useLenis } from "@/components/smooth-scroll"
import { Eyebrow } from "@/components/ui"
import { cn, SHELL } from "@/lib/utils"

const ITEMS = VEHICLES.filter((v) => v.image)
const LAST = ITEMS.length - 1
const STEP_VH = 22 // scroll distance per vehicle

// Geometry, in plane widths (--u): the front plane sits left of centre, the rest recede up and to the right.
const X0 = -0.22
const Y0 = 0.1
const DX = 0.7
const DY = -0.3
const DZ = -1.1
const TURN = -10 // deg: the row faces slightly left
// How far a fast scroll bends the row (at full speed), and the wave's spatial frequency.
const WAVE_Y = 0.32
const WAVE_RX = 16
const WAVE_RY = 12
const WAVE_RZ = 3
const FREQ = 1.15
const FULL_SPEED = 10 // vehicles per second that count as "full" bend
const LIFT = 0.22 // hover: toward the viewer

const pad = (n: number) => String(n).padStart(2, "0")

export function MkPlanes() {
  const track = useRef<HTMLElement>(null)
  const lenis = useLenis()
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] })
  const smooth = useSpring(scrollYProgress, { stiffness: 260, damping: 40, mass: 0.6, restDelta: 0.0001 })
  const pos = useTransform(smooth, [0, 1], [0, LAST])
  const speed = useTransform(useVelocity(pos), (v) => Math.max(-1, Math.min(1, v / FULL_SPEED)))
  const wave = useSpring(speed, { stiffness: 90, damping: 12, mass: 0.8 }) // slightly underdamped: the row ripples as it settles

  const bringToFront = (i: number) => {
    const el = track.current
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY + (i / LAST) * (el.offsetHeight - window.innerHeight)
    if (lenis) lenis.scrollTo(y)
    else window.scrollTo({ top: y })
  }

  return (
    <section ref={track} aria-labelledby="mk-planes-title" className="relative border-t border-border" style={{ height: `${100 + LAST * STEP_VH}svh` }}>
      <div
        className="sticky top-0 h-svh overflow-hidden [--u:64vw] sm:[--u:46vw] lg:[--u:clamp(300px,31vw,470px)]"
        style={{ perspective: "calc(var(--u) * 2.6)" }}
      >
        <div className="bg-blueprint absolute inset-0" aria-hidden />

        {/* pointer-events-none: in 3D hit testing this box (at z=0) would sit in front of the planes behind it */}
        <div className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]">
          {ITEMS.map((v, i) => (
            <Plane key={v.slug} v={v} i={i} pos={pos} wave={wave} onKeyboardFocus={() => bringToFront(i)} />
          ))}
        </div>

        {/* copy over the stage */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-56 bg-gradient-to-b from-background via-background/70 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-background via-background/70 to-transparent" aria-hidden />

        <div className={cn(SHELL, "pointer-events-none relative z-10 pt-24 lg:pt-28")}>
          <Eyebrow>MK Garage</Eyebrow>
          <h2 id="mk-planes-title" className="mt-4 font-display text-[clamp(1.75rem,3.3vw,3.1rem)] font-black uppercase leading-[0.95]">
            Every <span className="text-accent">MK</span>,
            <br />
            since {SITE.established}
            <sup className="ml-1.5 align-super font-mono text-[11px] font-normal tracking-[0.1em] text-muted-foreground">({ITEMS.length})</sup>
          </h2>
        </div>

        <div className={cn(SHELL, "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-6 pb-8 lg:pb-10")}>
          <FrontReadout pos={pos} />
          <div className="flex flex-col items-end gap-3 text-right">
            <Link href="/garage" className="pointer-events-auto flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/80 hover:text-accent">
              Open the garage <ArrowRight className="size-4" aria-hidden />
            </Link>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground" aria-hidden>
              Scroll to drive
            </span>
          </div>
        </div>

        <motion.div className="absolute inset-x-0 bottom-0 z-10 h-px origin-left bg-accent" style={{ scaleX: smooth }} aria-hidden />
      </div>
    </section>
  )
}

/** The vehicle at the front: counter, name and year, scrambling in as it changes. */
function FrontReadout({ pos }: { pos: MotionValue<number> }) {
  const [front, setFront] = useState(0)
  useMotionValueEvent(pos, "change", (p) => setFront(Math.max(0, Math.min(LAST, Math.round(p)))))
  const v = ITEMS[front]
  return (
    <div aria-hidden>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="text-accent">{pad(front + 1)}</span> / {pad(ITEMS.length)}
      </p>
      <p className="mt-2 font-display text-[clamp(2.4rem,5vw,4.5rem)] font-black uppercase leading-none">
        <Scramble text={v.name} />
      </p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/75">
        <Scramble text={`${v.year ?? "TBC"} · ${CATEGORY_LABEL[v.category]}`} />
      </p>
    </div>
  )
}

function Plane({ v, i, pos, wave, onKeyboardFocus }: { v: (typeof ITEMS)[number]; i: number; pos: MotionValue<number>; wave: MotionValue<number>; onKeyboardFocus: () => void }) {
  const [hover, setHover] = useState(false)
  const lift = useSpring(0, { stiffness: 260, damping: 26 })
  const d = useTransform(() => i - pos.get()) // 0 = at the front, >0 = further back, <0 = flown past

  const transform = useTransform(() => {
    const dd = d.get()
    const w = wave.get()
    const phase = dd * FREQ
    const x = X0 + dd * DX
    const y = Y0 + dd * DY + w * WAVE_Y * Math.sin(phase)
    const z = dd * DZ + lift.get() * LIFT
    const rx = w * WAVE_RX * Math.cos(phase)
    const ry = TURN + w * WAVE_RY
    const rz = w * WAVE_RZ * Math.sin(phase + 1)
    return `translate3d(calc(${x.toFixed(4)} * var(--u)), calc(${y.toFixed(4)} * var(--u)), calc(${z.toFixed(4)} * var(--u))) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`
  })
  const opacity = useTransform(d, [-0.85, -0.3, 5.5, 7.5], [0, 1, 1, 0]) // gone by the time the next one is at the front
  const shade = useTransform(d, [0, 6], [0, 0.7]) // depth haze
  const visibility = useTransform(opacity, (o): "visible" | "hidden" => (o < 0.01 ? "hidden" : "visible"))
  const pointerEvents = useTransform(opacity, (o): "auto" | "none" => (o > 0.4 ? "auto" : "none"))

  const on = () => {
    setHover(true)
    lift.set(1)
  }
  const off = () => {
    setHover(false)
    lift.set(0)
  }

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ width: "var(--u)", marginLeft: "calc(var(--u) * -0.5)", marginTop: "calc(var(--u) * -0.375)", transform, opacity, visibility, pointerEvents }}
    >
      <Link
        href={`/garage?v=${v.slug}`}
        aria-label={`${v.name}${v.year ? `, ${v.year}` : ""}: open in the MK Garage`}
        onMouseEnter={on}
        onMouseLeave={off}
        onFocus={(e) => {
          on()
          if (e.currentTarget.matches(":focus-visible")) onKeyboardFocus()
        }}
        onBlur={off}
        draggable={false}
        className="relative block rounded-card"
      >
        <span className="absolute -top-6 left-0 font-mono text-[10px] tracking-[0.2em] text-muted-foreground" aria-hidden>
          {pad(i + 1)}
        </span>
        <span className="relative block aspect-[4/3] overflow-hidden rounded-card border border-border bg-muted">
          <img src={`/media/vehicles/${v.slug}-s.webp`} alt="" draggable={false} className="h-full w-full object-cover" />
          <motion.span className="absolute inset-0 bg-background" style={{ opacity: shade }} aria-hidden />
          <span className={cn("absolute inset-0 rounded-card border border-accent transition-opacity duration-300", hover ? "opacity-100" : "opacity-0")} aria-hidden />
        </span>

        {/* hover label: a rule draws out, then the name scrambles in */}
        <span className="pointer-events-none absolute left-[62%] top-full mt-3 flex items-center gap-3 whitespace-nowrap" aria-hidden>
          <span className={cn("h-px w-14 origin-left bg-foreground transition-transform duration-500 ease-(--ease-out-expo)", hover ? "scale-x-100" : "scale-x-0")} />
          <span className={cn("font-mono text-[11px] uppercase tracking-[0.2em] transition-opacity duration-200", hover ? "opacity-100 delay-150" : "opacity-0")}>
            <Scramble text={`${v.name} · ${v.year ?? "TBC"}`} play={hover} />
          </span>
        </span>
      </Link>
    </motion.div>
  )
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>"

/**
 * Text that resolves left to right out of random glyphs (a stand-in for Motion+'s ScrambleText).
 * Rewrites React's own text node, so the server HTML and updates keep working.
 */
function Scramble({ text, play = true }: { text: string; play?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const node = ref.current?.firstChild
    if (!node) return
    node.nodeValue = text
    if (!play || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const start = performance.now()
    let last = 0
    let raf = 0
    const tick = (now: number) => {
      if (now - last > 40) {
        last = now
        const t = now - start
        let done = true
        let out = ""
        for (let c = 0; c < text.length; c++) {
          if (text[c] === " " || t > 100 + c * 35) out += text[c]
          else {
            out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            done = false
          }
        }
        node.nodeValue = out
        if (done) return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      node.nodeValue = text
    }
  }, [text, play])
  return <span ref={ref}>{text}</span>
}
