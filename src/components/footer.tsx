import Link from "next/link"
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react"

import { CONTACTS, LOCATION, NAV, SITE, SOCIALS } from "@/content/site"
import { FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from "@/components/icons"
import { CurrentYear } from "@/components/current-year"
import { Pending } from "@/components/pending"
import { SHELL } from "@/lib/utils"

export const SOCIAL_LINKS = [
  { label: "Email", href: `mailto:${SITE.email}`, Icon: Mail },
  { label: "Instagram", href: SOCIALS.instagram, Icon: InstagramIcon },
  { label: "LinkedIn", href: SOCIALS.linkedin, Icon: LinkedinIcon },
  { label: "Facebook", href: SOCIALS.facebook, Icon: FacebookIcon },
  { label: "YouTube", href: SOCIALS.youtube, Icon: YoutubeIcon },
]

export function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {SOCIAL_LINKS.map(({ label, href, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            aria-label={label}
            title={label}
            className="flex size-11 items-center justify-center rounded-base border border-border text-foreground/80 transition-colors duration-(--ds-motion-dur-fast) hover:border-accent hover:bg-accent hover:text-on-accent"
          >
            <Icon className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Brief p.12: Contact Us as the page footer, on every page. */
export function Footer() {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-border bg-card">
      <div className="stripes absolute right-0 top-0 h-1.5 w-1/3 opacity-90" aria-hidden />
      <div className={`${SHELL} grid gap-12 py-16 lg:grid-cols-12 lg:py-20`}>
        {/* brand */}
        <div className="lg:col-span-3">
          <img src="/media/brand/logo-light.png" alt={SITE.name} className="h-20 w-auto" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The official student motorsport team of {SITE.college}, {SITE.city}. Since {SITE.established}.
          </p>
          <SocialIcons className="mt-6" />
        </div>

        {/* sections */}
        <nav aria-label="Footer" className="lg:col-span-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">Sections</h2>
          <ul className="mt-5 flex flex-col gap-2.5 text-sm">
            <li><Link href="/" className="text-foreground/80 hover:text-foreground">Home</Link></li>
            {NAV.filter((n) => !n.to.startsWith("#")).map((n) => (
              <li key={n.to}>
                <Link href={n.to} className="text-foreground/80 hover:text-foreground">{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* people */}
        <div className="lg:col-span-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">Contact us</h2>
          <ul className="mt-5 flex flex-col gap-5">
            {CONTACTS.map((c) => (
              <li key={c.role}>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{c.role}</p>
                <p className="mt-1 font-display text-base font-bold uppercase">{c.name ?? <Pending what="Name" />}</p>
                {c.phone ? (
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="mt-1 inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-accent">
                    <Phone className="size-3.5" aria-hidden /> {c.phone}
                  </a>
                ) : (
                  <Pending what="Phone" className="mt-1.5" />
                )}
              </li>
            ))}
            <li>
              <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-accent">
                <Mail className="size-3.5" aria-hidden /> {SITE.email}
              </a>
            </li>
          </ul>
        </div>

        {/* map */}
        <div className="lg:col-span-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">Find us</h2>
          <div className="mt-5 overflow-hidden rounded-card border border-border">
            <iframe
              title={`Map: ${LOCATION.label}`}
              src={LOCATION.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-56 w-full grayscale-[0.6] invert-[0.92] hue-rotate-180"
            />
          </div>
          <a href={LOCATION.mapLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-start gap-2 text-sm text-foreground/80 hover:text-accent">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{LOCATION.label}</span>
            <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          </a>
        </div>
      </div>

      <div className="border-t border-border">
        <div className={`${SHELL} flex flex-col gap-2 py-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:justify-between`}>
          <span>© <CurrentYear /> {SITE.name} · {SITE.collegeShort}</span>
          <a href={SOCIALS.college} target="_blank" rel="noreferrer" className="hover:text-foreground">Team page on sctce.ac.in ↗</a>
        </div>
      </div>
    </footer>
  )
}
