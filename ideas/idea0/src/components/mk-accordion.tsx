"use client"

// Adapted from UI Layouts "gallery-modal-accordion"
// (uilayouts/apps/ui-layout/registry/components/modal/gallery-modal/accordion-modal.tsx).
// Kept: hover-to-expand image strips, click opens a modal that grows out of the strip via a shared `layoutId`,
// title/description reveal, Escape to close.
// Normalized for this site: design tokens instead of hardcoded colours, sizes that fill the section (row on desktop,
// vertical stack below 1024px where 16 strips can't fit across), first tap expands / second opens on touch,
// keyboard support, reduced motion, Lenis scroll lock, and the modal portalled to <body> so it sits above the nav.
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { ArrowRight, X } from "lucide-react"

import { CATEGORY_LABEL, VEHICLES } from "@/content/vehicles"
import { useLenis } from "@/components/smooth-scroll"
import { useMounted } from "@/lib/use-mounted"
import { cn } from "@/lib/utils"

const ITEMS = VEHICLES.filter((v) => v.image)
const DEFAULT = Math.max(0, ITEMS.findIndex((v) => v.slug === "mk14"))

export function MkAccordion({ className }: { className?: string }) {
  const [index, setIndex] = useState(DEFAULT)
  const [open, setOpen] = useState(false)
  const mounted = useMounted()
  const lenis = useLenis()
  const strips = useRef<(HTMLButtonElement | null)[]>([])
  const closeBtn = useRef<HTMLButtonElement>(null)
  const tap = useRef<{ touch: boolean; wasActive: boolean } | null>(null)
  const v = ITEMS[index]

  const close = useCallback(() => setOpen(false), [])

  // scroll lock + Escape (the original toggled a body class; this site scrolls with Lenis)
  useEffect(() => {
    if (!open) return
    lenis?.stop()
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    const opener = strips.current[index]
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    document.addEventListener("keydown", onKey)
    const t = window.setTimeout(() => closeBtn.current?.focus(), 50)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = prev
      lenis?.start()
      opener?.focus()
    }
  }, [open, lenis, close, index])

  const move = (to: number) => {
    const i = (to + ITEMS.length) % ITEMS.length
    setIndex(i)
    strips.current[i]?.focus()
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn("flex flex-col gap-1.5 lg:h-[min(56svh,520px)] lg:flex-row lg:gap-2", className)}
        role="group"
        aria-label="MK series vehicles"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(index + 1) }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(index - 1) }
        }}
      >
        {ITEMS.map((item, i) => {
          const active = i === index
          return (
            <motion.button
              key={item.slug}
              ref={(el) => {
                strips.current[i] = el
              }}
              type="button"
              whileTap={{ scale: 0.98 }}
              onMouseEnter={() => setIndex(i)}
              onFocus={() => setIndex(i)}
              // A touch tap also fires mouseenter + focus (which activate the strip) before click, so remember whether
              // it was already open when the finger went down: first tap expands, second tap opens.
              onPointerDown={(e) => (tap.current = { touch: e.pointerType !== "mouse", wasActive: active })}
              onClick={() => {
                const t = tap.current
                tap.current = null
                if (t?.touch && !t.wasActive) setIndex(i)
                else if (active) setOpen(true)
                else setIndex(i)
              }}
              aria-label={`${item.name}${item.year ? `, ${item.year}` : ""}. ${active ? "Open details" : "Show"}`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "group relative shrink-0 overflow-hidden rounded-card border border-border bg-muted text-left",
                "transition-[height,flex-grow,border-color] duration-700 ease-(--ease-out-expo)",
                // vertical stack below lg: strips grow in height; row at lg: they grow in width
                active ? "h-60 border-accent/60 sm:h-80 lg:h-auto lg:w-11 lg:grow" : "h-11 lg:h-auto lg:w-11 lg:grow-0 hover:border-foreground/30"
              )}
            >
              <motion.img
                layoutId={`mk-${item.slug}`}
                src={`/media/vehicles/${item.slug}-s.webp`}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* dim the closed strips so the open one reads first */}
              <span className={cn("absolute inset-0 bg-background transition-opacity duration-700", active ? "opacity-0" : "opacity-55 group-hover:opacity-35")} aria-hidden />

              {/* closed label: horizontal in the stack, vertical in the row */}
              <span
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/85 transition-opacity duration-300",
                  "lg:left-1/2 lg:top-auto lg:bottom-4 lg:-translate-x-1/2 lg:translate-y-0 lg:[writing-mode:vertical-rl] lg:rotate-180",
                  active ? "opacity-0" : "opacity-100"
                )}
                aria-hidden
              >
                {item.name}
                <span className="text-muted-foreground lg:hidden"> · {item.year ?? "TBC"}</span>
              </span>

              {/* open label */}
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-background via-background/40 to-transparent p-5 transition-opacity duration-500",
                  active ? "opacity-100 delay-200" : "pointer-events-none opacity-0"
                )}
                aria-hidden
              >
                <span>
                  <span className="block font-display text-4xl font-black uppercase leading-none lg:text-5xl">{item.name}</span>
                  <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/75">
                    {CATEGORY_LABEL[item.category]} · View details
                  </span>
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{item.year ?? "TBC"}</span>
              </span>
            </motion.button>
          )
        })}
      </div>

      {mounted &&
        createPortal(
          <MotionConfig reducedMotion="user">
            <AnimatePresence>
              {open && (
                <motion.div
                  key="overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[80] grid place-items-center bg-background/60 p-4 backdrop-blur-lg"
                  onClick={close}
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${v.name} details`}
                >
                  <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl">
                    <motion.div layoutId={`mk-${v.slug}`} className="relative aspect-[4/5] w-full cursor-default overflow-hidden rounded-card border border-border sm:aspect-[16/10]">
                      <img src={v.image!} alt={`${v.name}${v.year ? ` (${v.year})` : ""}`} className="h-full w-full object-cover" />
                      <button
                        ref={closeBtn}
                        type="button"
                        onClick={close}
                        aria-label="Close"
                        className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full border border-foreground/25 bg-background/60 backdrop-blur transition-colors hover:border-accent hover:bg-accent"
                      >
                        <X className="size-5" />
                      </button>
                      <article className="absolute inset-x-0 -bottom-px flex flex-col gap-3 bg-background/55 p-5 backdrop-blur-md sm:flex-row sm:items-end sm:justify-between sm:p-7">
                        <div>
                          <motion.h3
                            initial={{ scaleY: 0.2 }}
                            animate={{ scaleY: 1 }}
                            exit={{ scaleY: 0.2 }}
                            transition={{ duration: 0.2, delay: 0.2 }}
                            className="origin-bottom font-display text-5xl font-black uppercase leading-none sm:text-6xl"
                          >
                            {v.name}
                          </motion.h3>
                          <motion.p
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2, delay: 0.2 }}
                            className="mt-3 text-sm leading-relaxed text-foreground/85"
                          >
                            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                              {v.year ?? "Year TBC"} · {CATEGORY_LABEL[v.category]}
                            </span>
                            <span className="mt-1 block">{[v.engine, v.chassis, v.weight].filter(Boolean).join(" · ") || "Specifications to be added"}</span>
                          </motion.p>
                        </div>
                        <Link
                          href={`/garage?v=${v.slug}`}
                          onClick={close}
                          className="inline-flex shrink-0 items-center gap-2 self-start bg-accent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-on-accent transition-colors hover:bg-accent-dim sm:self-auto"
                        >
                          Open in MK Garage <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </article>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MotionConfig>,
          document.body
        )}
    </MotionConfig>
  )
}
