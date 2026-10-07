// Home -> About entrance, used by the "About the team" link only: the workshop photo beside the home intro grows
// from its card into the About page's hero background, then the hero copy rises over it. Every other way into /about
// is a plain navigation (the red line transition skips /about, see components/page-transition.tsx).
//   1. grow:     a fixed clone of the photo grows from the card to the hero's place (top of the screen, full width)
//                while the page behind fades to the background colour; once that's opaque the route is pushed
//   2. arrive:   hero mounted, scroll reset, photo decoded; the clone is fitted to the hero's real height
//   3. handoff:  the hero intro runs without its photo entrance (takeHeroHandoff), the clone is dropped (the hero's
//                own photo, same image, crop and grade, is right underneath) and the backdrop below the hero fades out
// The clone lives outside React (appended to <body>) because the home page unmounts halfway through.

import type { MouseEvent } from "react"
import { animate } from "motion/react"

import { setCovered, setHeroHandoff } from "@/lib/page-transition"

/** Shared by the home intro photo and the About hero: the morph only lines up if both show the same image and crop. */
export const ABOUT_HERO_PHOTO = { src: "/media/gallery/73-l.webp", position: "50% 55%" }

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const // --ds-motion-ease-in-out
const EASE_OUT = [0.16, 1, 0.3, 1] as const // --ds-motion-ease-out
const GROW_S = 1.1
const HERO_MIN = 0.78 // PageHero's min-h-[78svh]; corrected to the real height on arrival
const HERO_DIM = 0.45 // PageHero's bg-background/45 over the photo
const TIMEOUT_MS = 8000

let busy = false

/** onClick for a link to a page with a PageHero: morphs `source` into that hero. Falls back to a normal click. */
export function morphToHero(e: MouseEvent<HTMLAnchorElement>, source: HTMLImageElement | null, navigate: (href: string) => void) {
  if (busy || !source || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  e.preventDefault()
  busy = true
  run(source, new URL(e.currentTarget.href), navigate).finally(() => {
    busy = false
  })
}

async function run(source: HTMLImageElement, url: URL, navigate: (href: string) => void) {
  const card = source.parentElement ?? source // the clipped card: the photo inside may still be mid-zoom
  const from = card.getBoundingClientRect()
  const vw = document.documentElement.clientWidth // the hero is full width, excluding the scrollbar
  const predicted = Math.round(window.innerHeight * HERO_MIN)

  // the clone: photo + the card's shade, cross-faded into the hero's dim + scrim
  const root = layer("", { position: "fixed", inset: "0", zIndex: "49" }) // under the nav (z-50), over the page
  root.setAttribute("aria-hidden", "true")
  const backdrop = layer("absolute inset-0 bg-background", { opacity: "0" })
  const frame = layer("absolute overflow-hidden", {
    top: `${from.top}px`,
    left: `${from.left}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    borderRadius: "4px",
  })
  const img = document.createElement("img")
  img.src = source.currentSrc || source.src
  img.alt = ""
  Object.assign(img.style, { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", objectPosition: getComputedStyle(source).objectPosition })
  const cardShade = layer("absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent")
  const dim = layer("absolute inset-0 bg-background", { opacity: "0" })
  const scrim = layer("photo-scrim absolute inset-0", { opacity: "0" })
  frame.append(img, cardShade, dim, scrim)
  root.append(backdrop, frame)
  document.body.append(root)
  card.style.visibility = "hidden"

  setHeroHandoff(true)
  setCovered(true) // the About page's own intros wait for the handoff

  // 1. grow
  const grow = { duration: GROW_S, ease: EASE_IN_OUT }
  const growing = Promise.all([
    animate(frame, { top: 0, left: 0, width: vw, height: predicted, borderRadius: 0 }, grow),
    animate(cardShade, { opacity: 0 }, grow),
    animate(dim, { opacity: HERO_DIM }, grow),
    animate(scrim, { opacity: 1 }, grow),
  ])
  await animate(backdrop, { opacity: 1 }, { duration: 0.45, ease: "easeInOut" })
  navigate(url.pathname + url.search + url.hash)

  // 2. arrive
  const hero = await waitFor(() => (window.location.pathname === url.pathname ? document.querySelector<HTMLElement>("[data-page-hero]") : null), TIMEOUT_MS)
  await growing
  if (hero) {
    await waitFor(() => (window.scrollY < 1 ? hero : null), 600) // RouteScroll resets the scroll just after the route commits
    await hero.querySelector("img")?.decode().catch(() => {})
    await nextFrame()
    // full height, even past the fold, so object-fit crops exactly like the hero's own photo
    const h = hero.getBoundingClientRect().height
    if (Math.abs(h - predicted) > 1) await animate(frame, { height: h }, { duration: 0.4, ease: EASE_OUT })
    backdrop.style.clipPath = `inset(${Math.round(h)}px 0 0 0)` // keep covering only what's below the hero
  } else {
    setHeroHandoff(false)
  }

  // 3. handoff
  setCovered(false)
  await nextFrame()
  frame.remove()
  await animate(backdrop, { opacity: 0 }, { duration: 0.6, ease: "easeOut" })
  root.remove()
}

function layer(className: string, style: Partial<CSSStyleDeclaration> = {}) {
  const el = document.createElement("div")
  el.className = className
  Object.assign(el.style, style)
  return el
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/** Resolves with `test()`'s first non-null result (checked every frame), or null after `timeout` ms. */
function waitFor<T>(test: () => T | null, timeout: number) {
  return new Promise<T | null>((resolve) => {
    const start = performance.now()
    const tick = () => {
      const found = test()
      if (found) resolve(found)
      else if (performance.now() - start > timeout) resolve(null)
      else requestAnimationFrame(tick)
    }
    tick()
  })
}
