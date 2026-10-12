"use client"

// After Motion's "Split text" example (motion.dev/examples/react-split-text): the words fade up one after another
// (spring, no bounce, 50ms stagger). The example splits with Motion+'s splitText(); here the words are split at
// render, and the animation starts when the text scrolls into view instead of on load.
// Screen readers get the sentence once (sr-only); the animated words are aria-hidden.
// Server HTML: words are hidden by `.js .split-word` (globals.css) until the animation runs.

import { Fragment, useEffect, useRef, type ElementType } from "react"
import { animate, stagger, useInView, type AnimationPlaybackControls } from "motion/react"

import { whenRevealed } from "@/lib/page-transition"

type Part = { text: string; className?: string }

export function SplitText({ parts, as: Tag = "p", className, delay = 0 }: { parts: Part[]; as?: ElementType; className?: string; delay?: number }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" })

  useEffect(() => {
    const el = ref.current
    if (!inView || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let controls: AnimationPlaybackControls | undefined
    const cancel = whenRevealed(() => {
      controls = animate(
        el.querySelectorAll(".split-word"),
        { opacity: [0, 1], y: [10, 0] },
        { type: "spring", duration: 2, bounce: 0, delay: stagger(0.05, { startDelay: delay }) }
      )
    })
    return () => {
      cancel()
      controls?.stop()
    }
  }, [inView, delay])

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{parts.map((p) => p.text).join(" ")}</span>
      <span aria-hidden>
        {parts.map((p, i) => (
          <span key={i} className={p.className}>
            {p.text.split(" ").map((word, j) => (
              <Fragment key={j}>
                <span className="split-word inline-block">{word}</span>{" "}
              </Fragment>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  )
}
