"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Props = {
  eyebrow: string
  title: ReactNode
  intro?: ReactNode
  image?: string
  video?: { src: string; mobileSrc?: string; poster: string }
  objectPosition?: string
  tall?: boolean
  children?: ReactNode
}

/**
 * Page header on a full-bleed team photo (brief: "photos of our vehicle and team, with scroll animation").
 * Intro: the photo settles and the title rises. Scroll: the photo drifts and zooms slower than the page,
 * the copy lifts away.
 */
export function PageHero({ eyebrow, title, intro, image, video, objectPosition = "50% 50%", tall, children }: Props) {
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      gsap.set(root.current, { visibility: "visible" }) // server-rendered: hidden by .fouc until the intro starts
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: EASE } })
          .from(".ph-media", { scale: 1.15, opacity: 0, duration: 2 }, 0)
          .from(".ph-line", { yPercent: 110, duration: 1.2, stagger: 0.08 }, 0.2)
          .from(".ph-fade", { opacity: 0, y: 16, duration: 1, stagger: 0.1 }, 0.6)

        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true }
        gsap.to(".ph-media", { yPercent: 18, scale: 1.08, ease: "none", scrollTrigger: st })
        gsap.to(".ph-copy", { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "80% top" } })
      })
    },
    { scope: root }
  )

  // The server can't know the viewport: pick the mobile / desktop rendition after mount (poster shows meanwhile).
  const [videoSrc, setVideoSrc] = useState<string | undefined>()
  const vSrc = video?.src
  const vMobile = video?.mobileSrc
  useEffect(() => {
    if (vSrc) setVideoSrc(vMobile && window.matchMedia("(max-width: 767px)").matches ? vMobile : vSrc)
  }, [vSrc, vMobile])

  return (
    <section ref={root} className={cn("fouc relative isolate flex items-end overflow-hidden bg-background", tall ? "min-h-svh" : "min-h-[78svh]")}>
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        {video ? (
          <video
            className="ph-media h-full w-full object-cover"
            src={videoSrc}
            poster={video.poster}
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          image && <img className="ph-media h-full w-full object-cover" src={image} alt="" style={{ objectPosition }} />
        )}
        <div className="absolute inset-0 bg-background/45" />
        <div className="photo-scrim absolute inset-0" />
      </div>

      <div className="ph-copy relative mx-auto w-full max-w-[1500px] px-5 pb-16 pt-36 sm:px-8 lg:pb-24">
        <p className="ph-fade mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-foreground/80">
          <span className="h-px w-10 bg-accent" aria-hidden /> {eyebrow}
        </p>
        <h1 className="font-display text-[clamp(2.75rem,8vw,7.5rem)] font-black uppercase leading-[0.92] tracking-[-0.01em]">
          {Array.isArray(title)
            ? title.map((t, i) => (
                <span key={i} className="block overflow-hidden pb-[0.04em]">
                  <span className="ph-line block">{t}</span>
                </span>
              ))
            : (
                <span className="block overflow-hidden pb-[0.04em]">
                  <span className="ph-line block">{title}</span>
                </span>
              )}
        </h1>
        {intro && <div className="ph-fade mt-6 max-w-2xl text-base leading-relaxed text-foreground/85 sm:text-lg">{intro}</div>}
        {children && <div className="ph-fade mt-8">{children}</div>}
      </div>
    </section>
  )
}
