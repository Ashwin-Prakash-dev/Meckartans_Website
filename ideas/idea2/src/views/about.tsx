"use client"

import { useRef } from "react"
import Link from "next/link"
import { ArrowUpRight, Mail } from "lucide-react"

import { ABOUT, SITE, SOCIALS, WORKSHOPS } from "@/content/site"
import { FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from "@/components/icons"
import { PageHero } from "@/components/page-hero"
import { Pending } from "@/components/pending"
import { Container, Eyebrow, PhotoBand, SectionHeading } from "@/components/ui"
import { ABOUT_HERO_PHOTO } from "@/lib/hero-morph"
import { useReveal } from "@/lib/motion"

const PILLARS = [
  { n: "01", title: "Design", text: "Concepts, CAD and analysis: chassis geometry, powertrain packaging and ergonomics, defended at design and CAE events.", img: "/media/vehicles/mk12a-s.webp" },
  { n: "02", title: "Manufacture", text: "Frames cut, notched and welded in-house, then assembled into a running vehicle by the team.", img: "/media/gallery/21-l.webp" },
  { n: "03", title: "Validate", text: "Testing on campus before every competition, then technical inspection, skidpad, autocross and endurance on event day.", img: "/media/gallery/108-l.webp" },
]

const SOCIAL_ROWS = [
  { label: "Instagram", handle: "@teammeckartans", href: SOCIALS.instagram, Icon: InstagramIcon },
  { label: "LinkedIn", handle: "Team Meckartans", href: SOCIALS.linkedin, Icon: LinkedinIcon },
  { label: "YouTube", handle: "@teammeckartans", href: SOCIALS.youtube, Icon: YoutubeIcon },
  { label: "Facebook", handle: "teammeckartans", href: SOCIALS.facebook, Icon: FacebookIcon },
  { label: "Email", handle: SITE.email, href: `mailto:${SITE.email}`, Icon: Mail },
]

export default function About() {
  const main = useRef<HTMLDivElement>(null)
  useReveal(main)

  return (
    <>
      <PageHero
        eyebrow="About us"
        title={["Team", <span key="m" className="text-accent">Meckartans</span>]}
        intro={`The official student motorsport team of ${SITE.college}, ${SITE.city}. Established in ${SITE.established}.`}
        // the home intro photo grows into this one (lib/hero-morph.ts), so it must match it
        image={ABOUT_HERO_PHOTO.src}
        objectPosition={ABOUT_HERO_PHOTO.position}
      />

      <div ref={main}>
        {/* story */}
        <section className="py-24 lg:py-32">
          <Container className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow className="reveal">Who we are</Eyebrow>
              <dl className="reveal mt-8 grid grid-cols-1 gap-5 border-t border-border pt-8 md:grid-cols-2 lg:grid-cols-1">
                {[
                  ["Established", String(SITE.established)],
                  ["College", `${SITE.collegeShort}, ${SITE.city}`],
                  ["Competitions", "SAE eBAJA India · FKDC"],
                  ["Builds", "IC karts · electric karts · ATVs"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k}</dt>
                    <dd className="mt-1 font-display text-base font-extrabold uppercase [overflow-wrap:anywhere] sm:text-lg">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex flex-col gap-6 lg:col-span-8">
              {ABOUT.map((p, i) => (
                <p key={i} className={i === 0 ? "reveal text-xl leading-relaxed text-foreground sm:text-2xl" : "reveal text-base leading-relaxed text-foreground/80 sm:text-lg"}>
                  {p}
                </p>
              ))}
            </div>
          </Container>
        </section>

        {/* what we do */}
        <section className="border-t border-border py-24 lg:py-32">
          <Container>
            <SectionHeading eyebrow="What we do" title={<>Design. Manufacture. <span className="text-accent">Validate.</span></>} />
            <div className="grid gap-5 md:grid-cols-3">
              {PILLARS.map((p) => (
                <article key={p.n} className="reveal overflow-hidden rounded-card border border-border bg-card">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.img} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-6">
                    <span className="font-mono text-xs text-accent">{p.n}</span>
                    <h3 className="mt-2 font-display text-2xl font-black uppercase">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <PhotoBand image="/media/hero/band-build.webp">
          <Container>
            <p className="reveal max-w-4xl font-display text-[clamp(1.75rem,3.8vw,3.4rem)] font-black uppercase leading-[0.95]">
              From a sketch to a <span className="text-accent">grid slot</span>, everything in-house.
            </p>
          </Container>
        </PhotoBand>

        {/* workshops & events (brief p.11) */}
        <section id="workshops" className="py-24 lg:py-32">
          <Container>
            <SectionHeading
              eyebrow="Workshops & events"
              title={<>Sharing the <span className="text-accent">craft</span></>}
              aside="Workshops, outreach programmes, college events and expos conducted by Team Meckartans."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {WORKSHOPS.map((w) => (
                <article key={w.name} className="reveal flex flex-col overflow-hidden rounded-card border border-border bg-card">
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {w.image ? (
                      <img src={w.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="bg-blueprint absolute inset-0" aria-hidden />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <h3 className="font-display text-xl font-black uppercase">{w.name}</h3>
                    {w.summary ? <p className="text-sm leading-relaxed text-muted-foreground">{w.summary}</p> : <Pending what="Details" />}
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>

        {/* socials */}
        <section id="socials" className="border-t border-border bg-card py-24 lg:py-32">
          <Container className="grid gap-12 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-5">
              <Eyebrow className="reveal">Follow the build</Eyebrow>
              <h2 className="reveal mt-4 font-display text-[clamp(1.75rem,3.3vw,3.1rem)] font-black uppercase leading-[0.95]">
                Find us <span className="text-accent">online</span>
              </h2>
              <a href={SOCIALS.linktree} target="_blank" rel="noreferrer" className="reveal mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/80 hover:text-accent">
                All links on Linktree <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </div>
            <ul className="min-w-0 divide-y divide-border border-y border-border lg:col-span-7">
              {SOCIAL_ROWS.map(({ label, handle, href, Icon }) => (
                <li key={label} className="reveal">
                  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group flex items-center gap-4 py-5 sm:gap-5">
                    <Icon className="size-6 shrink-0 text-accent" />
                    <span className="shrink-0 font-display text-lg font-black uppercase sm:text-xl">{label}</span>
                    <span className="ml-auto min-w-0 truncate text-sm text-muted-foreground">{handle}</span>
                    <ArrowUpRight className="size-5 shrink-0 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </a>
                </li>
              ))}
              <li className="reveal flex flex-wrap items-center gap-x-5 gap-y-3 py-5">
                <span className="font-display text-lg font-black uppercase sm:text-xl">WhatsApp community</span>
                <span className="ml-auto">{SOCIALS.whatsapp ? <a href={SOCIALS.whatsapp}>Join ↗</a> : <Pending what="Link" />}</span>
              </li>
            </ul>
          </Container>
        </section>

        <section className="py-20">
          <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <p className="reveal font-display text-2xl font-black uppercase sm:text-3xl">Meet the people behind the MK series</p>
            <Link href="/team" className="reveal bg-accent px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] text-on-accent transition-colors hover:bg-accent-dim">
              Our team →
            </Link>
          </Container>
        </section>
      </div>
    </>
  )
}
