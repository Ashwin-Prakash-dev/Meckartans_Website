"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { NAV, SITE } from "@/content/site"
import { useLenis } from "@/components/smooth-scroll"
import { EASE, gsap, ScrollTrigger, useGSAP } from "@/lib/motion"
import { cn, SHELL } from "@/lib/utils"

/** Scrolls to the footer contact block from any page. */
export function useGoContact() {
  const lenis = useLenis()
  return (e?: React.MouseEvent) => {
    e?.preventDefault()
    const el = document.getElementById("contact")
    if (!el) return
    if (lenis) lenis.scrollTo(el)
    else el.scrollIntoView({ behavior: "smooth" })
  }
}

export function Nav() {
  const bar = useRef<HTMLElement>(null)
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const lenis = useLenis()
  const pathname = usePathname()
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/") // NavLink's default matching
  const goContact = useGoContact()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (open) lenis?.stop()
    else lenis?.start()
    document.documentElement.style.overflow = open ? "hidden" : ""
  }, [open, lenis])

  // Transparent over the hero; solid once scrolled. Hides while scrolling down, returns on scroll up.
  useGSAP(
    () => {
      let hidden = false
      const st = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const y = self.scroll()
          setSolid(y > 60)
          const hide = self.direction === 1 && y > 240
          if (hide !== hidden) {
            hidden = hide
            gsap.to(bar.current, { yPercent: hide ? -110 : 0, duration: 0.5, ease: EASE, overwrite: true })
          }
        },
      })
      return () => st.kill()
    },
    { scope: bar }
  )

  const link = "relative py-1 transition-colors duration-(--ds-motion-dur-fast) hover:text-foreground"

  return (
    <>
      <header
        ref={bar}
        onFocusCapture={() => gsap.to(bar.current, { yPercent: 0, duration: 0.3 })}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-500",
          solid ? "border-b border-border bg-background/85 backdrop-blur-md" : "border-b border-transparent"
        )}
      >
        {!solid && <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background/80 to-transparent" aria-hidden />}
        <div className={cn(SHELL, "relative flex h-[72px] items-center justify-between gap-6")}>
          <Link href="/" aria-label={`${SITE.name}, home`} className="shrink-0">
            <img src="/media/brand/logo-light.png" alt={SITE.name} width={605} height={449} className="h-11 w-auto" />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-7 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/75 xl:flex">
            {NAV.map((n) =>
              n.to.startsWith("#") ? (
                <a key={n.label} href="#contact" onClick={goContact} className={cn(link, "border border-foreground/35 px-4 py-2.5 hover:border-accent")}>
                  {n.label}
                </a>
              ) : (
                <Link key={n.to} href={n.to} aria-current={isActive(n.to) ? "page" : undefined} className={cn(link, isActive(n.to) && "text-foreground")}>
                  {n.label}
                  <span className={cn("absolute -bottom-1 left-0 h-px bg-accent transition-all duration-500", isActive(n.to) ? "w-full" : "w-0")} aria-hidden />
                </Link>
              )
            )}
          </nav>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-foreground xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            Menu <Menu className="size-5" aria-hidden />
          </button>
        </div>
      </header>

      {open && <MobileMenu onClose={() => setOpen(false)} onContact={(e) => { setOpen(false); setTimeout(() => goContact(e), 50) }} />}
    </>
  )
}

function MobileMenu({ onClose, onContact }: { onClose: () => void; onContact: (e: React.MouseEvent) => void }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      gsap.from(root.current, { opacity: 0, duration: 0.3 })
      gsap.from(".m-item", { y: 30, opacity: 0, duration: 0.6, ease: EASE, stagger: 0.05, delay: 0.05 })
    },
    { scope: root }
  )
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div ref={root} id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-[60] overflow-y-auto bg-background">
      <div className="stripes pointer-events-none absolute -right-10 top-0 h-full w-24 opacity-20" aria-hidden />
      <div className="flex h-[72px] items-center justify-between px-5 sm:px-8">
        <img src="/media/brand/logo-light.png" alt="" className="h-11 w-auto" />
        <button type="button" onClick={onClose} className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]">
          Close <X className="size-5" aria-hidden />
        </button>
      </div>
      <nav aria-label="Mobile" className="px-5 pb-16 pt-6 sm:px-8">
        <ol className="flex flex-col">
          {NAV.map((n, i) => (
            <li key={n.label} className="m-item border-b border-border">
              {n.to.startsWith("#") ? (
                <a href="#contact" onClick={onContact} className="flex items-baseline gap-4 py-5">
                  <span className="font-mono text-xs text-accent">0{i + 1}</span>
                  <span className="font-display text-3xl font-bold uppercase">{n.label}</span>
                </a>
              ) : (
                <Link href={n.to} className="flex items-baseline gap-4 py-5">
                  <span className="font-mono text-xs text-accent">0{i + 1}</span>
                  <span>
                    <span className="block font-display text-3xl font-bold uppercase">{n.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{n.blurb}</span>
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
