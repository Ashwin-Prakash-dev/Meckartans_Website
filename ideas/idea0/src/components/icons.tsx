// Brand marks (Lucide dropped brand icons). Simple, recognisable shapes at 24px, currentColor.
type P = { className?: string }
const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true }

export const InstagramIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
)

export const LinkedinIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 10.5v6M8 7.6v.1M11.5 16.5v-6M11.5 13.2c0-1.6 1-2.7 2.4-2.7s2.1 1 2.1 2.6v3.4" />
  </svg>
)

export const FacebookIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M14 21v-8h2.6l.4-3H14V8.2c0-.9.3-1.5 1.6-1.5H17V4.1A21 21 0 0 0 14.8 4C12.6 4 11 5.3 11 7.8V10H8.5v3H11v8" />
  </svg>
)

export const YoutubeIcon = ({ className }: P) => (
  <svg {...base} className={className}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="M10.2 9.3v5.4l4.6-2.7z" fill="currentColor" />
  </svg>
)
