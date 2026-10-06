"use client"

import { useRef, type ReactNode } from "react"

import { gsap, MOTION_OK, useGSAP } from "@/lib/motion"
import { cn, SHELL } from "@/lib/utils"

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(SHELL, className)}>{children}</div>
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground", className)}>
      <span className="h-px w-8 bg-accent" aria-hidden /> {children}
    </p>
  )
}

export function SectionHeading({ eyebrow, title, aside, className }: { eyebrow: string; title: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-8 grid gap-5 lg:mb-10 lg:grid-cols-12 lg:items-end", className)}>
      <div className="lg:col-span-8">
        <Eyebrow className="reveal">{eyebrow}</Eyebrow>
        <h2 className="reveal mt-4 font-display text-[clamp(1.75rem,3.3vw,3.1rem)] font-black uppercase leading-[0.95]">{title}</h2>
      </div>
      {aside && <div className="reveal text-sm leading-relaxed text-muted-foreground lg:col-span-4">{aside}</div>}
    </div>
  )
}

/** AIR rank: 1 = red, 2 = white, 3 = outline. */
export function Rank({ rank, size = "md" }: { rank: 1 | 2 | 3; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-baseline gap-1 rounded-base font-display font-black uppercase leading-none",
        size === "lg" ? "px-2.5 py-1.5 text-2xl" : "px-2 py-1 text-sm",
        rank === 1 && "bg-accent text-on-accent",
        rank === 2 && "bg-foreground text-background",
        rank === 3 && "border border-foreground/50 text-foreground"
      )}
    >
      <span className={size === "lg" ? "text-xs" : "text-[9px]"}>AIR</span>
      {rank}
    </span>
  )
}

/** Full-bleed photo band with parallax, used between sections. */
export function PhotoBand({ image, children, className }: { image: string; children?: ReactNode; className?: string }) {
  const root = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo(".band-img", { yPercent: -12 }, { yPercent: 12, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } })
      })
    },
    { scope: root }
  )
  return (
    <section ref={root} className={cn("relative isolate flex min-h-[55svh] items-center overflow-hidden", className)}>
      <div className="absolute inset-0 -z-10" aria-hidden>
        <img src={image} alt="" loading="lazy" className="band-img absolute inset-x-0 -top-[15%] h-[130%] w-full object-cover" />
        <div className="absolute inset-0 bg-background/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>
      {children}
    </section>
  )
}
