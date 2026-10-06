import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

// GSAP can't read the CSS cubic-bézier tokens; expo.out matches --ds-motion-ease-out.
export const EASE = "expo.out"
export const MOTION_OK = "(prefers-reduced-motion: no-preference)"

/**
 * Fade-up every `.reveal` element inside `scope` as it enters the viewport (batched, so siblings stagger).
 * Reduced motion: elements simply stay visible.
 */
export function useReveal(scope: React.RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        const els = gsap.utils.toArray<HTMLElement>(".reveal", scope.current)
        gsap.set(els, { opacity: 0, y: 28 })
        ScrollTrigger.batch(els, {
          start: "top 88%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.08, overwrite: true }),
        })
      })
    },
    { scope, dependencies: deps, revertOnUpdate: true }
  )
}

export { gsap, ScrollTrigger, useGSAP }
