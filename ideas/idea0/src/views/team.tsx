"use client"

import { useRef } from "react"
import { UserRound } from "lucide-react"

import { COMMITTEE, COMMITTEE_PENDING_ROLES, COMMITTEE_SEASON, FACULTY, type Member } from "@/content/team"
import { LinkedinIcon } from "@/components/icons"
import { PageHero } from "@/components/page-hero"
import { Pending } from "@/components/pending"
import { Container, SectionHeading } from "@/components/ui"
import { useReveal } from "@/lib/motion"

/** Brief p.6: each card shows Photo, Name, Position and LinkedIn. */
function MemberCard({ m }: { m: Member }) {
  return (
    <article className="reveal group flex flex-col items-center text-center">
      <div className="relative">
        <div className="absolute -inset-1.5 rounded-full bg-[conic-gradient(var(--ds-color-accent)_0_62%,transparent_62%_100%)] opacity-90 transition-transform duration-700 group-hover:rotate-45" aria-hidden />
        <div className="relative size-40 overflow-hidden rounded-full border-4 border-background bg-muted sm:size-44">
          {m.photo ? (
            <img src={m.photo} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="absolute inset-0 m-auto size-16 text-muted-foreground" aria-hidden />
          )}
        </div>
      </div>
      <h3 className="mt-6 font-display text-xl font-black uppercase">{m.name || <Pending what="Name" />}</h3>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{m.role}</p>
      <div className="mt-4">
        {m.linkedin ? (
          <a href={m.linkedin} target="_blank" rel="noreferrer" aria-label={`${m.name} on LinkedIn`} className="flex size-10 items-center justify-center rounded-base border border-border transition-colors hover:border-accent hover:bg-accent">
            <LinkedinIcon className="size-4" />
          </a>
        ) : (
          <Pending what="LinkedIn" />
        )}
      </div>
    </article>
  )
}

export default function Team() {
  const main = useRef<HTMLDivElement>(null)
  useReveal(main)
  const pending: Member[] = COMMITTEE_PENDING_ROLES.map((role) => ({ name: "", role, photo: null, linkedin: null }))

  return (
    <>
      <PageHero
        eyebrow="Our team"
        title={["The people", <span key="b" className="text-accent">behind the build</span>]}
        intro="Faculty advisors and the student executive committee who lead Team Meckartans."
        image="/media/hero/team.webp"
        objectPosition="50% 40%"
      />
      <div ref={main}>
        <section className="py-24 lg:py-32">
          <Container>
            <SectionHeading eyebrow="Faculty advisors" title={<>Guiding us <span className="text-accent">beyond the finish line</span></>} />
            <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-3">
              {FACULTY.map((m) => <MemberCard key={m.name} m={m} />)}
            </div>
          </Container>
        </section>

        <section className="relative overflow-hidden border-t border-border bg-card py-24 lg:py-32">
          <div className="bg-blueprint absolute inset-0" aria-hidden />
          <Container className="relative">
            <SectionHeading
              eyebrow="Executive committee"
              title={<><span className="text-accent">[</span>{COMMITTEE_SEASON}<span className="text-accent">]</span></>}
              aside="The student leadership that runs design, manufacturing, operations and outreach for the season."
            />
            <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-4">
              {COMMITTEE.map((m) => <MemberCard key={m.name} m={m} />)}
              {pending.map((m) => <MemberCard key={m.role} m={m} />)}
            </div>
          </Container>
        </section>
      </div>
    </>
  )
}
