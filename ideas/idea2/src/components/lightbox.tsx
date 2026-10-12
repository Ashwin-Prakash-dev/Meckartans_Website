"use client"

import { useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { useLenis } from "@/components/smooth-scroll"
import { EASE, gsap } from "@/lib/motion"

export type LightboxItem = { src: string; alt: string; caption?: string; w?: number; h?: number }

/** Full-screen viewer with Previous / Next / Close (brief p.7). Keyboard: ← → Esc. Touch: swipe. */
export function Lightbox({ items, index, onIndex, onClose }: { items: LightboxItem[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const lenis = useLenis()
  const img = useRef<HTMLImageElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const touch = useRef<number | null>(null)
  const item = items[index]
  const prev = useCallback(() => onIndex((index - 1 + items.length) % items.length), [index, items.length, onIndex])
  const next = useCallback(() => onIndex((index + 1) % items.length), [index, items.length, onIndex])

  useEffect(() => {
    lenis?.stop()
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    const opener = document.activeElement as HTMLElement | null
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = prevOverflow
      lenis?.start()
      opener?.focus()
    }
  }, [lenis, onClose, prev, next])

  useEffect(() => {
    if (img.current) gsap.fromTo(img.current, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.5, ease: EASE })
    // warm the neighbours
    ;[items[(index + 1) % items.length], items[(index - 1 + items.length) % items.length]].forEach((n) => {
      if (n) new Image().src = n.src
    })
  }, [index, items])

  if (!item) return null
  const btn = "flex size-12 items-center justify-center rounded-full border border-foreground/25 bg-background/60 text-foreground backdrop-blur transition-colors hover:border-accent hover:bg-accent"

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[80] flex flex-col bg-background/95"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return
        const dx = e.changedTouches[0].clientX - touch.current
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)()
        touch.current = null
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:px-8">
        <span>
          {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          {item.caption && <span className="ml-4 text-foreground/85">{item.caption}</span>}
        </span>
        <button ref={closeBtn} type="button" onClick={onClose} className={btn} aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-24" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img ref={img} key={item.src} src={item.src} alt={item.alt} width={item.w} height={item.h} className="max-h-full max-w-full rounded-base object-contain" />
        <button type="button" onClick={prev} className={`${btn} absolute left-3 top-1/2 -translate-y-1/2 sm:left-6`} aria-label="Previous image">
          <ChevronLeft className="size-6" />
        </button>
        <button type="button" onClick={next} className={`${btn} absolute right-3 top-1/2 -translate-y-1/2 sm:right-6`} aria-label="Next image">
          <ChevronRight className="size-6" />
        </button>
      </div>
    </div>,
    document.body
  )
}
