// Shared state between the route transition overlay (components/page-transition.tsx) and on-load animations.
// While the overlay covers the screen the incoming page is already mounted, so its intro waits here and plays
// as the overlay opens instead of finishing unseen behind it.

let covered = false
const queue = new Set<() => void>()

export function setCovered(value: boolean) {
  covered = value
  if (value) return
  const run = [...queue]
  queue.clear()
  run.forEach((fn) => fn())
}

// Set by the home -> About photo morph (lib/hero-morph.ts): the page hero's photo is already on screen, so the hero
// intro animates only its copy. Read once by the next PageHero to start.
let heroHandoff = false

export function setHeroHandoff(value: boolean) {
  heroHandoff = value
}

export function takeHeroHandoff() {
  const value = heroHandoff
  heroHandoff = false
  return value
}

/** Runs `fn` now, or once the transition overlay starts revealing the page. Returns a cancel function. */
export function whenRevealed(fn: () => void): () => void {
  if (!covered) {
    fn()
    return () => {}
  }
  queue.add(fn)
  return () => {
    queue.delete(fn)
  }
}
