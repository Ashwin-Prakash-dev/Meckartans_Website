"use client"

import { Suspense, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import photos from "@/content/gallery.json"
import { Lightbox, type LightboxItem } from "@/components/lightbox"
import { PageHero } from "@/components/page-hero"
import { Container } from "@/components/ui"
import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Photo = { id: number; cat: string; w: number; h: number; label: string; featured: boolean }
const ALL = photos as Photo[]

// Brief p.7: ALL | VEHICLES | MANUFACTURING | TESTING | COMPETITIONS | WORKSHOPS | TEAM | EVENTS
const FILTERS = ["all", "vehicles", "manufacturing", "testing", "competitions", "workshops", "team", "events"] as const
type Filter = (typeof FILTERS)[number]

const caption = (p: Photo) => `${p.label} · ${p.cat}`

export default function Gallery() {
  return (
    <>
      <PageHero
        tall
        eyebrow="Gallery"
        title={["Every build.", <span key="r" className="text-accent">Every race.</span>]}
        intro="Vehicles, manufacturing, testing and competitions: photos of every MK and the team behind them."
        video={{ src: "/media/gallery-reel-1080.mp4", mobileSrc: "/media/gallery-reel-720.mp4", poster: "/media/gallery-reel-poster.jpg" }}
      />
      <Suspense fallback={<GalleryBody filter="all" />}>
        <GalleryFromUrl />
      </Suspense>
    </>
  )
}

function GalleryFromUrl() {
  const params = useSearchParams()
  const raw = params.get("c") as Filter | null
  const filter: Filter = raw && FILTERS.includes(raw) ? raw : "all"
  return <GalleryBody filter={filter} />
}

function GalleryBody({ filter }: { filter: Filter }) {
  const [open, setOpen] = useState<number | null>(null)
  const grid = useRef<HTMLDivElement>(null)

  const list = useMemo(() => (filter === "all" ? ALL : ALL.filter((p) => p.cat === filter)), [filter])
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f, f === "all" ? ALL.length : ALL.filter((p) => p.cat === f).length])), [])
  const items: LightboxItem[] = useMemo(
    () => list.map((p) => ({ src: `/media/gallery/${p.id}-l.webp`, alt: `${p.label}, ${p.cat}`, caption: caption(p), w: p.w, h: p.h })),
    [list]
  )

  // re-run the entrance whenever the category changes
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from(".g-item", { opacity: 0, y: 24, duration: 0.7, ease: EASE, stagger: { each: 0.025, from: "start" }, clearProps: "all" })
      })
    },
    { scope: grid, dependencies: [filter], revertOnUpdate: true }
  )

  // shallow URL update: Next keeps useSearchParams in sync with history.replaceState (no reload, no scroll)
  const choose = (f: Filter) => {
    window.history.replaceState(null, "", f === "all" ? "/gallery" : `/gallery?c=${f}`)
  }

  return (
    <>
      <section className="pb-28 pt-10" aria-label="Photo gallery">
        {/* filters */}
        <div className="sticky top-0 z-30 border-y border-border bg-background/90 backdrop-blur-md">
          <Container>
            <div role="toolbar" aria-label="Filter photos by category" className="-mx-1 flex gap-1 overflow-x-auto py-3 [scrollbar-width:none]">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => choose(f)}
                  aria-pressed={filter === f}
                  className={cn(
                    "shrink-0 rounded-base px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-(--ds-motion-dur-fast)",
                    filter === f ? "bg-accent text-on-accent" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  {f} <span className={cn("ml-1", filter === f ? "text-on-accent/70" : "text-muted-foreground")}>{counts[f]}</span>
                </button>
              ))}
            </div>
          </Container>
        </div>

        {/* grid: mixed tile sizes (featured 2×2, portraits 1×2), reflows 2 / 3 / 4 columns */}
        <Container className="mt-8">
          <div ref={grid} className="grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-2.5 sm:auto-rows-[190px] md:grid-cols-3 lg:auto-rows-[210px] xl:grid-cols-4 sm:gap-3">
            {list.map((p, i) => {
              const portrait = p.h > p.w * 1.1
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setOpen(i)}
                  className={cn(
                    "g-item group relative overflow-hidden rounded-base bg-muted focus-visible:outline-offset-2",
                    p.featured ? "col-span-2 row-span-2" : portrait ? "row-span-2" : ""
                  )}
                  aria-label={`Open photo: ${caption(p)}`}
                >
                  <img
                    src={`/media/gallery/${p.id}-s.webp`}
                    srcSet={`/media/gallery/${p.id}-s.webp 720w, /media/gallery/${p.id}-l.webp 2000w`}
                    sizes={p.featured ? "(min-width: 1280px) 50vw, 100vw" : "(min-width: 1280px) 25vw, 50vw"}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    width={p.w}
                    height={p.h}
                    onLoad={(e) => e.currentTarget.classList.add("opacity-100")}
                    className="h-full w-full object-cover opacity-0 transition-[opacity,transform] duration-700 ease-(--ease-out-expo) group-hover:scale-105"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-background/90 to-transparent p-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] transition-transform duration-500 group-hover:translate-y-0 group-focus-visible:translate-y-0">
                    {caption(p)}
                  </span>
                </button>
              )
            })}
          </div>
          {list.length === 0 && <p className="py-24 text-center text-muted-foreground">No photos in this category yet.</p>}
        </Container>
      </section>

      {open !== null && <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  )
}
