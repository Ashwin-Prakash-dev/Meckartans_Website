#!/usr/bin/env python3
"""One-off port of ../meckartans-web (Vite + React Router) into this Next.js app.

Every edit is an exact-string replacement that must match the expected number of times, so if the Vite source
drifts the port stops instead of silently diverging. The layout and route files (src/app/**) are hand-written.
Run from meckartans_website/:  python scripts/port_from_vite.py
"""
import os, re, sys

SRC = os.path.join("..", "meckartans-web", "src")
DST = "src"
errors = []


def port(rel_src, rel_dst, edits, client=True, regex=()):
    text = open(os.path.join(SRC, rel_src), encoding="utf8").read()
    for old, new, count in edits:
        n = text.count(old)
        if n != count:
            errors.append(f"{rel_src}: expected {count}x, found {n}x: {old[:80]!r}")
            continue
        text = text.replace(old, new)
    for pattern, repl, count in regex:
        text, n = re.subn(pattern, repl, text)
        if n != count:
            errors.append(f"{rel_src}: regex expected {count}x, found {n}x: {pattern!r}")
    if client:
        text = '"use client"\n\n' + text
    out = os.path.join(DST, rel_dst)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf8", newline="\n").write(text)


LINK_IMPORT = ('import { Link } from "react-router-dom"', 'import Link from "next/link"', 1)
LINK_TO = r"(<Link\b[^>]*?)\bto="  # <Link ... to=...>  ->  <Link ... href=...>

# ---------------------------------------------------------------- plain copies
port("components/pending.tsx", "components/pending.tsx", [], client=False)
port("components/icons.tsx", "components/icons.tsx", [], client=False)
port("components/lightbox.tsx", "components/lightbox.tsx", [])
port("components/ui.tsx", "components/ui.tsx", [])

# ---------------------------------------------------------------- footer (server component)
port("components/footer.tsx", "components/footer.tsx", [
    LINK_IMPORT,
    ('import { Pending } from "@/components/pending"', 'import { CurrentYear } from "@/components/current-year"\nimport { Pending } from "@/components/pending"', 1),
    ("<span>© {new Date().getFullYear()} {SITE.name}", "<span>© <CurrentYear /> {SITE.name}", 1),
], client=False, regex=[(LINK_TO, r"\1href=", 2)])

# ---------------------------------------------------------------- smooth scroll: location -> pathname (+ hash from window)
port("components/smooth-scroll.tsx", "components/smooth-scroll.tsx", [
    ('import { useLocation } from "react-router-dom"', 'import { usePathname } from "next/navigation"', 1),
    ("""  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return""",
     """  useEffect(() => {
    document.documentElement.classList.add("hydrated") // tells the FOUC fail-safe in layout.tsx the app is live
    // Re-measure scroll triggers once web fonts are in: text reflow after a late font swap would shift every trigger.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return""", 1),
    ("  const { pathname, hash } = useLocation()", "  const pathname = usePathname()", 1),
    ("      const target = hash ? document.querySelector<HTMLElement>(hash) : null",
     "      const hash = window.location.hash // Next doesn't expose the hash; read it after navigation\n"
     "      const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null", 1),
    ("  }, [pathname, hash, lenis])", "  }, [pathname, lenis])", 1),
])

# ---------------------------------------------------------------- nav: NavLink -> Link + usePathname (keeps aria-current)
port("components/nav.tsx", "components/nav.tsx", [
    ('import { Link, NavLink, useLocation } from "react-router-dom"', 'import Link from "next/link"\nimport { usePathname } from "next/navigation"', 1),
    ("  const { pathname } = useLocation()",
     "  const pathname = usePathname()\n  const isActive = (to: string) => pathname === to || pathname.startsWith(to + \"/\") // NavLink's default matching", 1),
    ("""                <NavLink key={n.to} to={n.to} className={({ isActive }) => cn(link, isActive && "text-foreground")}>
                  {({ isActive }) => (
                    <>
                      {n.label}
                      <span className={cn("absolute -bottom-1 left-0 h-px bg-accent transition-all duration-500", isActive ? "w-full" : "w-0")} aria-hidden />
                    </>
                  )}
                </NavLink>""",
     """                <Link key={n.to} href={n.to} aria-current={isActive(n.to) ? "page" : undefined} className={cn(link, isActive(n.to) && "text-foreground")}>
                  {n.label}
                  <span className={cn("absolute -bottom-1 left-0 h-px bg-accent transition-all duration-500", isActive(n.to) ? "w-full" : "w-0")} aria-hidden />
                </Link>""", 1),
], regex=[(LINK_TO, r"\1href=", 2)])

# ---------------------------------------------------------------- page hero: video rendition chosen after mount; FOUC guard
port("components/page-hero.tsx", "components/page-hero.tsx", [
    ('import { useRef, type ReactNode } from "react"', 'import { useEffect, useRef, useState, type ReactNode } from "react"', 1),
    ("""      gsap.matchMedia().add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: EASE } })
          .from(".ph-media\"""",
     """      gsap.set(root.current, { visibility: "visible" }) // server-rendered: hidden by .fouc until the intro starts
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: EASE } })
          .from(".ph-media\"""", 1),
    ("""  const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
""",
     """  // The server can't know the viewport: pick the mobile / desktop rendition after mount (poster shows meanwhile).
  const [videoSrc, setVideoSrc] = useState<string | undefined>()
  const vSrc = video?.src
  const vMobile = video?.mobileSrc
  useEffect(() => {
    if (vSrc) setVideoSrc(vMobile && window.matchMedia("(max-width: 767px)").matches ? vMobile : vSrc)
  }, [vSrc, vMobile])
""", 1),
    ("            src={narrow && video.mobileSrc ? video.mobileSrc : video.src}", "            src={videoSrc}", 1),
    ('<section ref={root} className={cn("relative isolate flex', '<section ref={root} className={cn("fouc relative isolate flex', 1),
])

# ---------------------------------------------------------------- views
port("pages/about.tsx", "views/about.tsx", [LINK_IMPORT], regex=[(LINK_TO, r"\1href=", 1)])
port("pages/team.tsx", "views/team.tsx", [])
port("pages/achievements.tsx", "views/achievements.tsx", [LINK_IMPORT], regex=[(LINK_TO, r"\1href=", 1)])
port("pages/support.tsx", "views/support.tsx", [])

port("pages/home.tsx", "views/home.tsx", [
    LINK_IMPORT,
    ('import { useGoContact } from "@/components/nav"', 'import { useCurrentYear } from "@/components/current-year"\nimport { useGoContact } from "@/components/nav"', 1),
    # hero video rendition: chosen after mount (window doesn't exist on the server)
    ("""  const [src] = useState(() => (window.matchMedia("(max-width: 767px)").matches ? "/media/hero-720.mp4" : "/media/hero-1080.mp4"))""",
     """  const [src, setSrc] = useState<string | undefined>()
  useEffect(() => setSrc(window.matchMedia("(max-width: 767px)").matches ? "/media/hero-720.mp4" : "/media/hero-1080.mp4"), [])""", 1),
    ("""    io.observe(v)
    return () => io.disconnect()
  }, [active])""",
     """    io.observe(v)
    return () => io.disconnect()
  }, [active, src])""", 1),
    # FOUC guard on the hero
    ("""      gsap.matchMedia().add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: EASE } })
          .from(".h-media\"""",
     """      gsap.set(root.current, { visibility: "visible" }) // server-rendered: hidden by .fouc until the intro starts
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: EASE } })
          .from(".h-media\"""", 1),
    ('<section ref={root} className="relative z-0 isolate h-svh min-h-[640px] overflow-hidden bg-background" aria-label="Team Meckartans">',
     '<section ref={root} className="fouc relative z-0 isolate h-svh min-h-[640px] overflow-hidden bg-background" aria-label="Team Meckartans">', 1),
    # "years racing": the page is prerendered at build time, so take the year on the client
    ("""function Stats() {
  const ref = useRef<HTMLDivElement>(null)""",
     """function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const year = useCurrentYear()""", 1),
    ("{ value: new Date().getFullYear() - SITE.established,", "{ value: year - SITE.established,", 1),
    # count-up reads the target when it fires (not at setup), so a post-hydration year update is respected
    ("""          const target = Number(el.dataset.value)
          const o = { v: 0 }
          gsap.to(o, {
            v: target, duration: 1.6, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => (el.textContent = String(Math.round(o.v))),
          })""",
     """          const o = { v: 0 }
          ScrollTrigger.create({
            trigger: el, start: "top 90%", once: true,
            onEnter: () => gsap.to(o, {
              v: Number(el.dataset.value), duration: 1.6, ease: "power2.out",
              onUpdate: () => (el.textContent = String(Math.round(o.v))),
            }),
          })""", 1),
], regex=[(LINK_TO, r"\1href=", 9)])

port("pages/gallery.tsx", "views/gallery.tsx", [
    ('import { useMemo, useRef, useState } from "react"\nimport { useSearchParams } from "react-router-dom"',
     'import { Suspense, useMemo, useRef, useState } from "react"\nimport { useSearchParams } from "next/navigation"', 1),
    # split: the hero renders on the server; the grid reads ?c= (Suspense, server renders the "all" grid as fallback)
    ("""export default function Gallery() {
  const [params, setParams] = useSearchParams()
  const raw = params.get("c") as Filter | null
  const filter: Filter = raw && FILTERS.includes(raw) ? raw : "all"
  const [open, setOpen]""",
     """export default function Gallery() {
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
  const [open, setOpen]""", 1),
    ("""  const choose = (f: Filter) => {
    setParams(f === "all" ? {} : { c: f }, { replace: true, preventScrollReset: true })
  }""",
     """  // shallow URL update: Next keeps useSearchParams in sync with history.replaceState (no reload, no scroll)
  const choose = (f: Filter) => {
    window.history.replaceState(null, "", f === "all" ? "/gallery" : `/gallery?c=${f}`)
  }""", 1),
    ("""    <>
      <PageHero
        tall
        eyebrow="Gallery"
        title={["Every build.", <span key="r" className="text-accent">Every race.</span>]}
        intro="Vehicles, manufacturing, testing and competitions: photos of every MK and the team behind them."
        video={{ src: "/media/gallery-reel-1080.mp4", mobileSrc: "/media/gallery-reel-720.mp4", poster: "/media/gallery-reel-poster.jpg" }}
      />

      <section className="pb-28 pt-10" aria-label="Photo gallery">""",
     """    <>
      <section className="pb-28 pt-10" aria-label="Photo gallery">""", 1),
])

port("pages/garage.tsx", "views/garage.tsx", [
    ('import { EASE, gsap, useGSAP, useReveal } from "@/lib/motion"', 'import { EASE, gsap, useGSAP, useReveal } from "@/lib/motion"\nimport { useMounted } from "@/lib/use-mounted"', 1),
    ('import { useEffect, useMemo, useRef, useState } from "react"', 'import { Suspense, useEffect, useMemo, useRef, useState } from "react"', 1),
    ('import { Link, useSearchParams } from "react-router-dom"', 'import Link from "next/link"\nimport { useSearchParams } from "next/navigation"', 1),
    ("""export default function Garage() {
  const main = useRef<HTMLDivElement>(null)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<"all" | Category>("all")
  useReveal(main, [tab])

  const selected = VEHICLES.find((v) => v.slug === params.get("v")) ?? null
  const open = (slug: string | null) => setParams(slug ? { v: slug } : {}, { replace: true, preventScrollReset: true })""",
     """// shallow URL update (?v=slug): Next keeps useSearchParams in sync with history.replaceState (no reload, no scroll)
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

  const open = openVehicle""", 1),
    ("      {selected && <Detail v={selected} onClose={() => open(null)} />}",
     "      <Suspense fallback={null}>\n        <SelectedVehicle />\n      </Suspense>", 1),
], regex=[(LINK_TO, r"\1href=", 1)])

if errors:
    print("PORT FAILED:\n" + "\n".join(errors))
    sys.exit(1)
left = []
for root, _, files in os.walk(DST):
    for f in files:
        if f.endswith((".ts", ".tsx")):
            t = open(os.path.join(root, f), encoding="utf8").read()
            if "react-router" in t or re.search(LINK_TO, t):
                left.append(os.path.join(root, f))
if left:
    print("leftover router usage:", left)
    sys.exit(1)
print("ported OK: 9 components + 7 views")
