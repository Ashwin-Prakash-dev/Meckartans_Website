"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import { STATS, TIMELINE } from "@/content/achievements"
import { NAV, SITE } from "@/content/site"
import { VEHICLES } from "@/content/vehicles"
import { useCurrentYear } from "@/components/current-year"
import { MkAccordion } from "@/components/mk-accordion"
import { useGoContact } from "@/components/nav"
import { Container, Eyebrow, PhotoBand, Rank, SectionHeading } from "@/components/ui"
import { EASE, gsap, MOTION_OK, ScrollTrigger, useGSAP, useReveal } from "@/lib/motion"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ hero slideshow */
const SLIDES: ({ kind: "video" } | { kind: "photo"; src: string; pos?: string })[] = [
  { kind: "video" },
  { kind: "photo", src: "/media/hero/home-1.webp", pos: "50% 45%" }, // MK9 team
  { kind: "photo", src: "/media/hero/home-2.webp", pos: "50% 40%" }, // MKX01 team
  { kind: "photo", src: "/media/hero/home-3.webp", pos: "50% 40%" }, // MK8 team at FKDC
  { kind: "photo", src: "/media/hero/home-4.webp", pos: "50% 40%" }, // MK2 team
]
const SLIDE_MS = 7000

function Hero() {
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const goContact = useGoContact()
  const [src, setSrc] = useState<string | undefined>()
  useEffect(() => setSrc(window.matchMedia("(max-width: 767px)").matches ? "/media/hero-720.mp4" : "/media/hero-1080.mp4"), [])

  // advance; reduced motion = no autoplay (manual dots only)
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setTimeout(() => setActive((a) => (a + 1) % SLIDES.length), SLIDE_MS)
    return () => window.clearTimeout(id)
  }, [active, paused])

  // video plays only while it is the visible slide and the hero is on screen
  useEffect(() => {
    const v = video.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && active === 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {})
      else v.pause()
    })
    io.observe(v)
    return () => io.disconnect()
  }, [active, src])

  useGSAP(
    () => {
      gsap.set(root.current, { visibility: "visible" }) // server-rendered: hidden by .fouc until the intro starts
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: EASE } })
          .from(".h-media", { opacity: 0, scale: 1.1, duration: 2.6, ease: "power2.out" }, 0)
          .from(".h-logo", { opacity: 0, y: 20, scale: 0.9, duration: 1.2 }, 0.3)
          .from(".h-title", { opacity: 0, letterSpacing: "0.4em", duration: 1.8 }, 0.45)
          .from(".h-fade", { opacity: 0, y: 18, duration: 1, stagger: 0.1 }, 1)
          .from(".h-cta-line", { scaleX: 0, duration: 1.2, ease: "power3.inOut", stagger: 0.1 }, 1.1)
          .from(".h-index li", { opacity: 0, x: -14, duration: 0.8, stagger: 0.06 }, 1.2)

        // curtain: the hero stays pinned while the page rises over it
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=100%", pin: true, pinSpacing: false, scrub: 0.6 } })
          .to(".h-content", { y: -120, opacity: 0, duration: 0.5, ease: "power1.in" }, 0)
          .to(".h-side", { opacity: 0, duration: 0.3 }, 0)
          .to(".h-media", { scale: 1.12, duration: 1, ease: "none" }, 0)
          .to(".h-dim", { opacity: 0.8, duration: 1, ease: "none" }, 0)
      })
    },
    { scope: root }
  )

  return (
    <section ref={root} className="fouc relative z-0 isolate h-svh min-h-[640px] overflow-hidden bg-background" aria-label="Team Meckartans">
      {/* slides */}
      <div className="h-media absolute inset-0 -z-10" aria-hidden>
        {SLIDES.map((s, i) => (
          <div key={i} className={cn("absolute inset-0 transition-opacity duration-[1400ms]", i === active ? "opacity-100" : "opacity-0")}>
            {s.kind === "video" ? (
              <video ref={video} className="h-full w-full object-cover" src={src} poster="/media/hero-poster.jpg" muted loop playsInline preload="auto" />
            ) : (
              <img
                src={s.src}
                alt=""
                loading={i === 1 ? "eager" : "lazy"}
                className={cn("h-full w-full object-cover", i === active && "animate-[kenburns_9s_ease-out_forwards]")}
                style={{ objectPosition: s.pos }}
              />
            )}
          </div>
        ))}
        <div className="absolute inset-0 bg-background/50" />
        <div className="photo-scrim absolute inset-0" />
        <div className="h-dim absolute inset-0 bg-background opacity-0" />
      </div>

      {/* page shortcuts (brief: "small text and shortcuts to all pages") */}
      <div className="h-side pointer-events-none absolute inset-x-0 top-1/2 z-10 hidden -translate-y-1/2 xl:block">
        <Container>
          <nav aria-label="Sections" className="pointer-events-auto w-fit">
            <ol className="h-index flex flex-col gap-3 border-l border-foreground/25 pl-6">
              {NAV.map((n, i) => (
                <li key={n.label} className="group relative">
                  {n.to.startsWith("#") ? (
                    <a href="#contact" onClick={goContact} className="block">
                      <IndexItem n={i} label={n.label} blurb={n.blurb} />
                    </a>
                  ) : (
                    <Link href={n.to} className="block">
                      <IndexItem n={i} label={n.label} blurb={n.blurb} />
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </Container>
      </div>

      {/* centre copy */}
      <div className="h-content relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 pt-10 text-center">
        <img src="/media/brand/logo-light.png" alt="" width={605} height={449} className="h-logo h-24 w-auto sm:h-32" />
        <h1 className="h-title mt-6 font-display text-[2.1rem] font-normal uppercase leading-[1.1] tracking-[0.12em] sm:text-[clamp(2.5rem,4.4vw,4.5rem)] sm:tracking-[0.16em]">
          Team Meckartans
        </h1>
        <p className="h-fade mt-4 font-display text-sm font-bold uppercase tracking-[0.3em] sm:text-base">
          {SITE.tagline.split(". ").map((t, i, a) => (
            <span key={i} className={i === a.length - 1 ? "text-accent" : ""}>
              {t}
              {i < a.length - 1 ? ". " : ""}
            </span>
          ))}
        </p>
        <p className="h-fade mt-6 max-w-xl text-[15px] leading-relaxed text-foreground/85 sm:text-[17px]">{SITE.intro}</p>
        <Link href="/about" className="group relative mt-10 flex h-14 w-[min(17rem,80vw)] items-center justify-center font-display text-[13px] font-medium uppercase tracking-[0.3em]">
          <span className="h-cta-line absolute inset-x-0 top-0 h-px bg-foreground/60 transition-colors duration-500 group-hover:bg-accent" aria-hidden />
          <span className="transition-[letter-spacing] duration-500 ease-(--ease-out-expo) group-hover:tracking-[0.42em]">Discover</span>
          <span className="h-cta-line absolute inset-x-0 bottom-0 h-px bg-foreground/60 transition-colors duration-500 group-hover:bg-accent" aria-hidden />
        </Link>
      </div>

      {/* slide controls */}
      <div className="h-side absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === active}
            className="relative h-8 w-8 sm:w-10"
          >
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden bg-foreground/25">
              <span
                className={cn("absolute inset-0 origin-left bg-foreground", i === active ? (paused ? "scale-x-100" : "animate-[slidefill_7s_linear_forwards]") : "scale-x-0", i < active && "scale-x-100")}
              />
            </span>
          </button>
        ))}
        <button type="button" onClick={() => setPaused((p) => !p)} className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground">
          {paused ? "Play" : "Pause"}
        </button>
      </div>
    </section>
  )
}

function IndexItem({ n, label, blurb }: { n: number; label: string; blurb: string }) {
  return (
    <>
      <span className="font-display text-[13px] font-medium uppercase tracking-[0.14em] text-foreground/60 transition-colors group-hover:text-foreground">
        <span className="mr-2 text-accent">0{n + 1}</span>
        {label}
      </span>
      <span className="block max-h-0 overflow-hidden text-xs text-muted-foreground opacity-0 transition-all duration-500 group-hover:max-h-6 group-hover:opacity-100">
        {blurb}
      </span>
    </>
  )
}

/* ------------------------------------------------------------------ stats */
function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const year = useCurrentYear()
  const stats = [
    { value: year - SITE.established, suffix: "+", label: "Years racing", sub: `Since ${SITE.established}` },
    { value: VEHICLES.length, suffix: "", label: "Vehicles built", sub: "IC karts · EV karts · ATVs" },
    { value: STATS.fkdcSeasons, suffix: "", label: "FKDC seasons", sub: "Formula Kart Design Challenge" },
    { value: STATS.air1, suffix: "×", label: "AIR 1 finishes", sub: `${STATS.podiums} podium results at FKDC` },
  ]
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>(".count").forEach((el) => {
          const o = { v: 0 }
          ScrollTrigger.create({
            trigger: el, start: "top 90%", once: true,
            onEnter: () => gsap.to(o, {
              v: Number(el.dataset.value), duration: 1.6, ease: "power2.out",
              onUpdate: () => (el.textContent = String(Math.round(o.v))),
            }),
          })
        })
      })
    },
    { scope: ref }
  )
  return (
    <div ref={ref} className="grid grid-cols-2 border-t border-border lg:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={cn("reveal flex flex-col gap-1.5 py-8 pr-4", i % 2 === 1 && "border-l border-border pl-5 lg:pl-8", i >= 2 && "border-t border-border lg:border-t-0", i === 2 && "lg:border-l lg:pl-8")}>
          <span className="font-display text-[clamp(3rem,6vw,5.5rem)] font-black leading-none">
            <span className="count" data-value={s.value}>{s.value}</span>
            <span className="text-accent">{s.suffix}</span>
          </span>
          <span className="font-display text-base font-extrabold uppercase">{s.label}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.sub}</span>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ MK garage teaser */
function MkStrip() {
  return (
    <section className="relative py-24 lg:py-32">
      <Container className="mb-10 flex items-end justify-between gap-6">
        <div>
          <Eyebrow>MK Garage</Eyebrow>
          <h2 className="mt-4 font-display text-[clamp(2rem,4.6vw,4.25rem)] font-black uppercase leading-[0.95]">
            Every <span className="text-accent">MK</span>, since 2013
          </h2>
        </div>
        <Link href="/garage" className="hidden shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/80 hover:text-accent sm:flex">
          Open the garage <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Container>
      <Container>
        <MkAccordion className="reveal" />
      </Container>
    </section>
  )
}

/* ------------------------------------------------------------------ page */
const SHORTCUT_IMG: Record<string, string> = {
  "/about": "/media/hero/about.webp",
  "/team": "/media/hero/team.webp",
  "/gallery": "/media/gallery-reel-poster.jpg",
  "/garage": "/media/hero/garage.webp",
  "/achievements": "/media/hero/achievements.webp",
  "/support": "/media/hero/support.webp",
}

export default function Home() {
  const main = useRef<HTMLDivElement>(null)
  useReveal(main)
  const majors = TIMELINE.filter((e) => e.major)

  return (
    <>
      <Hero />
      <div ref={main} className="relative z-10 bg-background">
        <div className="stripes h-1.5 w-full opacity-90" aria-hidden />

        {/* intro + stats */}
        <section className="py-24 lg:py-32">
          <Container>
            <div className="grid gap-10 lg:grid-cols-12">
              <Eyebrow className="reveal lg:col-span-3">Since {SITE.established} · {SITE.collegeShort}</Eyebrow>
              <div className="lg:col-span-9">
                <p className="reveal font-display text-[clamp(1.6rem,3.2vw,2.9rem)] font-extrabold uppercase leading-[1.08]">
                  Students from every engineering discipline, turning classroom concepts into karts and ATVs{" "}
                  <span className="text-muted-foreground">that pass scrutineering and race at national level.</span>
                </p>
                <Link href="/about" className="reveal mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/80 hover:text-accent">
                  About the team <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
            <div className="mt-20">
              <Stats />
            </div>
          </Container>
        </section>

        {/* major achievements (brief p.9: "add major achievements in the home page") */}
        <section className="border-t border-border bg-card py-24 lg:py-32">
          <Container>
            <SectionHeading
              eyebrow="Major achievements"
              title={<>On the podium, <span className="text-accent">season after season</span></>}
              aside={<>Highlights from the Formula Kart Design Challenge and SAE eBAJA India. <Link href="/achievements" className="text-foreground underline decoration-accent underline-offset-4">See every result →</Link></>}
            />
            <div className="grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {majors.map((e) => {
                const best = [...(e.results ?? [])].sort((a, b) => a.rank - b.rank)[0]
                return (
                  <article key={e.id} className="reveal flex flex-col gap-4 bg-card p-6 lg:p-8">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{e.title}</span>
                      {best && <Rank rank={best.rank} size="lg" />}
                    </div>
                    <h3 className="font-display text-2xl font-black uppercase leading-tight">
                      {best ? best.event : e.notes?.[0]}
                    </h3>
                    <ul className="mt-auto flex flex-col gap-2 text-sm text-muted-foreground">
                      {(e.results ?? []).filter((r) => r !== best).map((r) => (
                        <li key={r.event} className="flex items-center gap-2"><Rank rank={r.rank} /> {r.event}</li>
                      ))}
                      {best && e.notes?.map((n) => <li key={n}>{n}</li>)}
                      {!best && e.notes?.slice(1).map((n) => <li key={n}>{n}</li>)}
                    </ul>
                  </article>
                )
              })}
            </div>
          </Container>
        </section>

        <MkStrip />

        {/* explore: shortcuts to every page */}
        <section className="border-t border-border py-24 lg:py-32">
          <Container>
            <SectionHeading eyebrow="Explore" title={<>Inside <span className="text-accent">Meckartans</span></>} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {NAV.filter((n) => SHORTCUT_IMG[n.to]).map((n, i) => (
                <Link key={n.to} href={n.to} className="reveal group relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-card border border-border p-6">
                  <img src={SHORTCUT_IMG[n.to]} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60 transition-[transform,opacity] duration-[1.2s] ease-(--ease-out-expo) group-hover:scale-105 group-hover:opacity-80" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <span className="font-mono text-xs text-accent">0{i + 1}</span>
                  <span className="mt-2 flex items-center justify-between font-display text-3xl font-black uppercase">
                    {n.label}
                    <ArrowUpRight className="size-6 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
                  </span>
                  <span className="mt-1 text-sm text-foreground/75">{n.blurb}</span>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        <PhotoBand image="/media/hero/band-track.webp">
          <Container className="text-center">
            <Eyebrow className="reveal justify-center">Support us</Eyebrow>
            <h2 className="reveal mx-auto mt-5 max-w-4xl font-display text-[clamp(2.25rem,6vw,5.5rem)] font-black uppercase leading-[0.92]">
              Fuel the <span className="text-accent">next MK</span>
            </h2>
            <p className="reveal mx-auto mt-6 max-w-xl text-foreground/85">Back the build through crowdfunding, or partner with us as a sponsor.</p>
            <div className="reveal mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/support" className="bg-accent px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] text-on-accent transition-colors hover:bg-accent-dim">Support our journey</Link>
              <Link href="/support#sponsorship" className="border border-foreground/40 px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:border-accent">Sponsorship portal</Link>
            </div>
          </Container>
        </PhotoBand>
      </div>
    </>
  )
}
