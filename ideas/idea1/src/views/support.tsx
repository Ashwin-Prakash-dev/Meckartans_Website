"use client"

import { useRef, useState } from "react"
import { Check, Copy, Download, Mail, Phone, PlayCircle } from "lucide-react"

import { SITE } from "@/content/site"
import { BANK, CROWDFUNDING, SPONSORSHIP } from "@/content/support"
import { PageHero } from "@/components/page-hero"
import { Pending } from "@/components/pending"
import { Container, SectionHeading } from "@/components/ui"
import { useReveal } from "@/lib/motion"

function CopyRow({ label, value }: { label: string; value: string | null }) {
  const [done, setDone] = useState(false)
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2 text-sm font-medium">
        {value ? (
          <>
            <span className="font-mono">{value}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(value)
                setDone(true)
                setTimeout(() => setDone(false), 1200)
              }}
              className="rounded-base p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Copy ${label}`}
            >
              {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </>
        ) : (
          <Pending />
        )}
      </dd>
    </div>
  )
}

export default function Support() {
  const main = useRef<HTMLDivElement>(null)
  useReveal(main)
  const mail = `mailto:${SITE.email}?subject=${encodeURIComponent(SPONSORSHIP.mailSubject)}`

  return (
    <>
      <PageHero
        eyebrow="Support us"
        title={["Fuel the", <span key="n" className="text-accent">next MK</span>]}
        intro="Every vehicle is designed, fabricated and tested by students. Back the journey through crowdfunding, or partner with us as a sponsor."
        image="/media/hero/support.webp"
        objectPosition="50% 55%"
      >
        <div className="flex flex-wrap gap-3">
          <a href="#journey" className="bg-accent px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] text-on-accent transition-colors hover:bg-accent-dim">Support our journey</a>
          <a href="#sponsorship" className="border border-foreground/40 px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:border-accent">Sponsorship portal</a>
        </div>
      </PageHero>

      <div ref={main}>
        {/* support our journey */}
        <section id="journey" className="scroll-mt-20 py-24 lg:py-32">
          <Container>
            <SectionHeading eyebrow="Support our journey" title={<>Join the <span className="text-accent">drive</span></>} aside={CROWDFUNDING.pitch} />
            <div className="grid gap-5 lg:grid-cols-12">
              {/* CFR video */}
              <div className="reveal relative aspect-video overflow-hidden rounded-card border border-border bg-card lg:col-span-7">
                {CROWDFUNDING.cfrVideoUrl ? (
                  CROWDFUNDING.cfrVideoUrl.includes("youtube") ? (
                    <iframe src={CROWDFUNDING.cfrVideoUrl} title="Team Meckartans CFR video" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
                  ) : (
                    <video src={CROWDFUNDING.cfrVideoUrl} controls playsInline className="h-full w-full object-cover" />
                  )
                ) : (
                  <>
                    <img src="/media/gallery-reel-poster.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
                    <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
                      <PlayCircle className="size-14 text-foreground/70" aria-hidden />
                      <p className="font-display text-xl font-black uppercase">Team CFR video</p>
                      <Pending what="Video" />
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-5 lg:col-span-5">
                {/* crowdfunding */}
                <article className="reveal relative overflow-hidden rounded-card border border-border bg-gradient-to-br from-accent-dim/50 via-card to-card p-7">
                  <div className="stripes absolute -right-6 top-0 h-full w-16 opacity-25" aria-hidden />
                  <h3 className="font-display text-2xl font-black uppercase">Crowdfunding</h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">Contribute through our crowdfunding campaign. Every contribution goes into building and racing the next vehicle.</p>
                  <div className="mt-6">
                    {CROWDFUNDING.campaignUrl ? (
                      <a href={CROWDFUNDING.campaignUrl} target="_blank" rel="noreferrer" className="inline-block bg-accent px-6 py-3.5 font-mono text-xs uppercase tracking-[0.2em] text-on-accent hover:bg-accent-dim">Back our team ↗</a>
                    ) : (
                      <Pending what="Campaign link" />
                    )}
                  </div>
                </article>

                {/* bank */}
                <article className="reveal rounded-card border border-border bg-card p-7">
                  <h3 className="font-display text-2xl font-black uppercase">Bank transfer</h3>
                  <dl className="mt-3 divide-y divide-border">
                    {BANK.map((b) => <CopyRow key={b.label} label={b.label} value={b.value} />)}
                  </dl>
                </article>
              </div>
            </div>
          </Container>
        </section>

        {/* sponsorship */}
        <section id="sponsorship" className="scroll-mt-20 border-t border-border bg-card py-24 lg:py-32">
          <Container>
            <SectionHeading
              eyebrow="Sponsorship portal"
              title={<>Partner with <span className="text-accent">Meckartans</span></>}
              aside="Your brand on our vehicles, kit and channels, at national student motorsport events. Get in touch with the sponsorship wing."
            />
            <div className="grid gap-5 lg:grid-cols-3">
              <article className="reveal min-w-0 rounded-card border border-border bg-background p-6 sm:p-7">
                <h3 className="font-display text-xl font-black uppercase">Sponsorship wing</h3>
                <ul className="mt-5 flex flex-col gap-5">
                  {SPONSORSHIP.wing.map((p) => (
                    <li key={p.role}>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{p.role}</p>
                      <p className="mt-1 font-display text-base font-bold uppercase">{p.name ?? <Pending what="Name" />}</p>
                      <div className="mt-2 flex flex-col gap-1.5 text-sm">
                        {p.phone ? <a href={`tel:${p.phone}`} className="inline-flex items-center gap-2 hover:text-accent"><Phone className="size-3.5" />{p.phone}</a> : <Pending what="Phone" />}
                        {p.email && <a href={`mailto:${p.email}`} className="inline-flex items-center gap-2 hover:text-accent"><Mail className="size-3.5" />{p.email}</a>}
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="reveal flex min-w-0 flex-col rounded-card border border-border bg-background p-6 sm:p-7">
                <h3 className="font-display text-xl font-black uppercase">Brochure & enquiries</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Download the sponsorship brochure, or write to us and we'll send the current deck.</p>
                <div className="mt-auto flex flex-col gap-3 pt-6">
                  {SPONSORSHIP.brochureUrl ? (
                    <a href={SPONSORSHIP.brochureUrl} download className="inline-flex items-center justify-center gap-2 bg-accent px-6 py-3.5 font-mono text-xs uppercase tracking-[0.2em] text-on-accent hover:bg-accent-dim"><Download className="size-4" /> Brochure (PDF)</a>
                  ) : (
                    <Pending what="Brochure PDF" />
                  )}
                  <a href={mail} className="inline-flex items-center justify-center gap-2 border border-foreground/40 px-4 py-3.5 font-mono text-xs uppercase tracking-[0.12em] hover:border-accent sm:px-6 sm:tracking-[0.2em]"><Mail className="size-4 shrink-0" /> <span className="min-w-0 break-all">{SITE.email}</span></a>
                </div>
              </article>

              <article className="reveal min-w-0 rounded-card border border-border bg-background p-6 sm:p-7">
                <h3 className="font-display text-xl font-black uppercase">Our sponsors</h3>
                {SPONSORSHIP.history.length ? (
                  <ul className="mt-5 grid grid-cols-2 gap-3">
                    {SPONSORSHIP.history.map((s) => (
                      <li key={s.name} className="flex aspect-[3/2] items-center justify-center rounded-base border border-border p-3 text-center text-sm">
                        {s.logo ? <img src={s.logo} alt={s.name} className="max-h-full" /> : s.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-5 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">Sponsor history, season by season.</p>
                    <Pending what="Sponsor list & logos" />
                  </div>
                )}
              </article>
            </div>
          </Container>
        </section>
      </div>
    </>
  )
}
