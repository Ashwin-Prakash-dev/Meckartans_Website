"use client"

import { useRef } from "react"
import Link from "next/link"

import { FKDC_FULL, STATS, TIMELINE } from "@/content/achievements"
import { VEHICLES } from "@/content/vehicles"
import { PageHero } from "@/components/page-hero"
import { Container, Eyebrow, Rank } from "@/components/ui"
import { gsap, MOTION_OK, useGSAP, useReveal } from "@/lib/motion"
import { cn } from "@/lib/utils"

const vName = (slug: string) => VEHICLES.find((v) => v.slug === slug)?.name ?? slug.toUpperCase()

export default function Achievements() {
  const main = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLDivElement>(null)
  useReveal(main)

  // the timeline spine draws as you scroll
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo(".spine-fill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: line.current, start: "top 70%", end: "bottom 70%", scrub: true } })
      })
    },
    { scope: main }
  )

  return (
    <>
      <PageHero
        eyebrow="Achievements"
        title={["Results,", <span key="s" className="text-accent">season by season</span>]}
        intro={`${STATS.air1} AIR 1 finishes and ${STATS.podiums} podium results across ${STATS.fkdcSeasons} seasons of the ${FKDC_FULL}, plus technical inspection clears at SAE eBAJA India.`}
        image="/media/hero/achievements.webp"
        objectPosition="50% 55%"
      />

      <div ref={main}>
        <section className="border-b border-border">
          <Container className="grid grid-cols-3 divide-x divide-border">
            {[
              [STATS.air1, "AIR 1 finishes"],
              [STATS.podiums, "FKDC podium results"],
              [STATS.fkdcSeasons, "FKDC seasons"],
            ].map(([n, l]) => (
              <div key={l} className="reveal py-10 pl-4 first:pl-0 sm:pl-8">
                <p className="font-display text-[clamp(2.5rem,6vw,5rem)] font-black leading-none">{n}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{l}</p>
              </div>
            ))}
          </Container>
        </section>

        <section className="py-24 lg:py-32" aria-label="Timeline, newest first">
          <Container>
            <div className="mb-14 flex flex-wrap items-center justify-between gap-4">
              <Eyebrow className="reveal">Timeline · newest first</Eyebrow>
              <div className="reveal flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="flex items-center gap-2"><Rank rank={1} /> 1st</span>
                <span className="flex items-center gap-2"><Rank rank={2} /> 2nd</span>
                <span className="flex items-center gap-2"><Rank rank={3} /> 3rd</span>
              </div>
            </div>

            <div ref={line} className="relative">
              <div className="absolute bottom-0 left-[7px] top-0 w-px bg-border md:left-1/2" aria-hidden>
                <div className="spine-fill absolute inset-0 origin-top bg-accent" />
              </div>

              <ol className="flex flex-col gap-10 md:gap-0">
                {TIMELINE.map((e, i) => {
                  const left = i % 2 === 0
                  return (
                    <li key={e.id} id={e.id} className={cn("relative scroll-mt-28 md:grid md:grid-cols-2 md:gap-16 md:py-4", i > 0 && "md:-mt-24")}>
                      <span className={cn("absolute left-0 top-2 size-[15px] rounded-full border-2 border-background md:left-1/2 md:top-12 md:-translate-x-1/2", e.major ? "bg-accent" : "bg-foreground/60")} aria-hidden />
                      <article className={cn("reveal ml-9 rounded-card border border-border bg-card p-6 md:ml-0", left ? "md:col-start-1" : "md:col-start-2")}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-display text-2xl font-black uppercase">{e.title}</h3>
                          {e.when && <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{e.when}</span>}
                        </div>
                        {e.vehicles && (
                          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            With{" "}
                            {e.vehicles.map((s, j) => (
                              <span key={s}>
                                {j > 0 && " & "}
                                <Link href={`/garage?v=${s}`} className="text-foreground underline decoration-accent/60 underline-offset-4 hover:decoration-accent">{vName(s)}</Link>
                              </span>
                            ))}
                          </p>
                        )}
                        {e.results && (
                          <ul className="mt-5 flex flex-col gap-2.5">
                            {[...e.results].sort((a, b) => a.rank - b.rank).map((r) => (
                              <li key={r.event} className="flex items-center gap-3 text-sm">
                                <Rank rank={r.rank} />
                                <span className={r.event === "Overall" ? "font-semibold" : ""}>{r.event}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {e.notes && (
                          <ul className={cn("flex flex-col gap-1.5 text-sm text-muted-foreground", e.results ? "mt-4" : "mt-5")}>
                            {e.notes.map((n) => <li key={n}>— {n}</li>)}
                          </ul>
                        )}
                      </article>
                    </li>
                  )
                })}
              </ol>
            </div>
          </Container>
        </section>
      </div>
    </>
  )
}
