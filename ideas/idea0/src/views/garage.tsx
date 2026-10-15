"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, X } from "lucide-react"

import photos from "@/content/gallery.json"
import { CATEGORY_LABEL, VEHICLES, type Category, type Vehicle } from "@/content/vehicles"
import { Lightbox, type LightboxItem } from "@/components/lightbox"
import { PageHero } from "@/components/page-hero"
import { Pending, Val } from "@/components/pending"
import { useLenis } from "@/components/smooth-scroll"
import { Container, Eyebrow } from "@/components/ui"
import { EASE, gsap, useGSAP, useReveal } from "@/lib/motion"
import { useMounted } from "@/lib/use-mounted"
import { cn } from "@/lib/utils"

type Photo = { id: number; cat: string; w: number; h: number; label: string }
const TABS: ("all" | Category)[] = ["all", "ic", "electric", "atv"]

function Blueprint({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-muted">
      <div className="bg-blueprint absolute inset-0" aria-hidden />
      <span className="relative font-display text-5xl font-black uppercase text-foreground/15">{name}</span>
    </div>
  )
}

function VehicleCard({ v, onOpen }: { v: Vehicle; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="reveal group flex flex-col overflow-hidden rounded-card border border-border bg-card text-left transition-colors duration-500 hover:border-accent/70">
      <div className="relative aspect-[4/3] overflow-hidden">
        {v.image ? (
          <img src={`/media/vehicles/${v.slug}-s.webp`} alt={`${v.name}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-105" />
        ) : (
          <Blueprint name={v.name} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-base bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] backdrop-blur">
          {CATEGORY_LABEL[v.category]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-4xl font-black uppercase leading-none">{v.name}</h3>
          <span className="font-mono text-sm text-accent">{v.year ?? "TBC"}</span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {[v.engine, v.weight].filter(Boolean).join(" · ") || "Specifications to be added"}
        </p>
        <span className="mt-auto inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/70 transition-colors group-hover:text-accent">
          View details <ArrowRight className="size-3.5" aria-hidden />
        </span>
      </div>
    </button>
  )
}

function Detail({ v, onClose }: { v: Vehicle; onClose: () => void }) {
  const lenis = useLenis()
  const root = useRef<HTMLDivElement>(null)
  const [lb, setLb] = useState<number | null>(null)
  const strip = useMemo(() => (v.galleryLabel ? (photos as Photo[]).filter((p) => p.label === v.galleryLabel) : []), [v])
  const items: LightboxItem[] = strip.map((p) => ({ src: `/media/gallery/${p.id}-l.webp`, alt: `${v.name}`, caption: `${v.name} · ${p.cat}`, w: p.w, h: p.h }))

  useEffect(() => {
    lenis?.stop()
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && lb === null && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = prev
      lenis?.start()
    }
  }, [lenis, onClose, lb])

  useGSAP(
    () => {
      gsap.from(".d-panel", { xPercent: 100, duration: 0.7, ease: EASE })
      gsap.from(".d-fade", { opacity: 0, y: 20, duration: 0.7, ease: EASE, stagger: 0.06, delay: 0.25 })
    },
    { scope: root, dependencies: [v.slug], revertOnUpdate: true }
  )

  const L = v.leadership ?? {}
  const people = [
    ["Captain", L.captain],
    ["Vice Captain", L.viceCaptain],
    ["Manager", L.manager],
    ["Technical Head", L.technicalHead],
  ].filter(([, n]) => n)

  return createPortal(
    <div ref={root} className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`${v.name} details`}>
      <button type="button" className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} aria-label="Close details" />
      <div className="d-panel absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col overflow-y-auto overscroll-contain border-l border-border bg-background" data-lenis-prevent>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">MK Garage · {CATEGORY_LABEL[v.category]}</span>
          <button type="button" onClick={onClose} className="flex size-10 items-center justify-center rounded-full border border-border hover:border-accent hover:bg-accent" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="relative aspect-[16/10] shrink-0 overflow-hidden">
          {v.image ? <img src={v.image} alt={v.name} className="h-full w-full object-cover" /> : <Blueprint name={v.name} />}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          {v.imageKind === "slide" && (
            <span className="absolute right-4 top-4 rounded-base bg-background/70 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">From the MK-series spec sheet</span>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-4">
            <h2 className="d-fade font-display text-7xl font-black uppercase leading-none sm:text-8xl">{v.name}</h2>
            <span className="d-fade font-mono text-lg text-accent">{v.year ?? <Pending what="Year" />}</span>
          </div>
        </div>

        <div className="flex flex-col gap-10 px-6 py-8">
          <section className="d-fade">
            <Eyebrow>Specifications</Eyebrow>
            <dl className="mt-5 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-3">
              {[["Engine", v.engine], ["Chassis", v.chassis], ["Weight", v.weight]].map(([k, val]) => (
                <div key={k} className="bg-card p-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k}</dt>
                  <dd className="mt-2 text-sm font-medium"><Val v={val} /></dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="d-fade">
            <Eyebrow>Events</Eyebrow>
            {v.events.length ? (
              <ul className="mt-5 flex flex-col divide-y divide-border border-y border-border">
                {v.events.map((e) => (
                  <li key={e.name} className="py-4">
                    <p className="font-display text-lg font-black uppercase">{e.name}</p>
                    {e.results && <p className="mt-1 text-sm text-muted-foreground">{e.results.join(" · ")}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <Pending what="Events" className="mt-5" />
            )}
            {v.fkdcSeason && (
              <Link href={`/achievements#fkdc-${v.fkdcSeason}`} onClick={onClose} className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/80 hover:text-accent">
                FKDC Season {v.fkdcSeason} results <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </section>

          {people.length > 0 && (
            <section className="d-fade">
              <Eyebrow>Team leadership</Eyebrow>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
                {people.map(([k, n]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k}</dt>
                    <dd className="mt-1 text-sm font-medium">{n}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {strip.length > 0 && (
            <section className="d-fade">
              <Eyebrow>Photos · {strip.length}</Eyebrow>
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {strip.map((p, i) => (
                  <button key={p.id} type="button" onClick={() => setLb(i)} className="group aspect-square overflow-hidden rounded-base bg-muted" aria-label={`Open ${v.name} photo ${i + 1}`}>
                    <img src={`/media/gallery/${p.id}-s.webp`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      {lb !== null && <Lightbox items={items} index={lb} onIndex={setLb} onClose={() => setLb(null)} />}
    </div>,
    document.body
  )
}

// shallow URL update (?v=slug): Next keeps useSearchParams in sync with history.replaceState (no reload, no scroll)
const openVehicle = (slug: string | null) => window.history.replaceState(null, "", slug ? `/garage?v=${slug}` : "/garage")

/** Reads ?v= (Suspense boundary: the grid around it still renders on the server). */
function SelectedVehicle() {
  const params = useSearchParams()
  const mounted = useMounted() // the sheet portals into document.body, which doesn't exist on the server
  const selected = VEHICLES.find((v) => v.slug === params.get("v")) ?? null
  return selected && mounted ? <Detail v={selected} onClose={() => openVehicle(null)} /> : null
}

export default function Garage() {
  const main = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<"all" | Category>("all")
  useReveal(main, [tab])

  const open = openVehicle
  const groups = (["ic", "electric", "atv"] as Category[]).filter((c) => tab === "all" || tab === c)

  return (
    <>
      <PageHero
        eyebrow="MK Garage"
        title={["Every MK", <span key="s" className="text-accent">since 2013</span>]}
        intro={`${VEHICLES.length} vehicles designed, built and raced by the team: internal-combustion karts, electric karts and all-terrain vehicles.`}
        image="/media/hero/garage.webp"
        objectPosition="50% 60%"
      />

      <div ref={main} className="pb-28">
        <div className="sticky top-0 z-30 border-y border-border bg-background/90 backdrop-blur-md">
          <Container>
            <div role="tablist" aria-label="Vehicle category" className="-mx-1 flex gap-1 overflow-x-auto py-3 [scrollbar-width:none]">
              {TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "shrink-0 rounded-base px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                    tab === t ? "bg-accent text-on-accent" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  {t === "all" ? "All vehicles" : CATEGORY_LABEL[t]}{" "}
                  <span className={tab === t ? "text-on-accent/70" : "text-muted-foreground"}>
                    {t === "all" ? VEHICLES.length : VEHICLES.filter((v) => v.category === t).length}
                  </span>
                </button>
              ))}
            </div>
          </Container>
        </div>

        {groups.map((c) => {
          const list = VEHICLES.filter((v) => v.category === c)
          return (
            <section key={c} className="pt-16" aria-labelledby={`g-${c}`}>
              <Container>
                <div className="mb-8 flex items-end justify-between gap-4 border-b border-border pb-5">
                  <h2 id={`g-${c}`} className="reveal font-display text-3xl font-black uppercase sm:text-5xl">{CATEGORY_LABEL[c]}</h2>
                  <span className="reveal font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {list[0].name} – {list[list.length - 1].name}
                  </span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {list.map((v) => <VehicleCard key={v.slug} v={v} onOpen={() => open(v.slug)} />)}
                </div>
              </Container>
            </section>
          )
        })}
      </div>

      <Suspense fallback={null}>
        <SelectedVehicle />
      </Suspense>
    </>
  )
}
