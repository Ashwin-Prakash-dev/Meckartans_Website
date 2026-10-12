# Plan: Page transitions

<aside>
👋

Is this your first task? Visit [Getting started](https://app.notion.com/p/Getting-started-3f5d97d83ca481a88b68e39d5a61a18a?pvs=21) first.

</aside>

Moving between pages feels smoother and more polished with a good transition than with a plain jump. The site already has one, so your job is to explore alternatives and see if something fits the site better.

## How the current transition works

It lives in `src/components/page-transition.tsx` and the comments at the top explain it. In short:

1. It catches clicks on links to other pages.
2. **Cover**: a red sheet closes over the current page.
3. **Load**: a line grows while the next page loads (`router.push(...)`).
4. **Reveal**: the line splits open onto the new page.

Two details matter if you change it:

- `setCovered(true)` and `setCovered(false)` (from `src/lib/page-transition.ts`) tell the new page to wait before playing its own intro animation. Without them, intros finish hidden behind your transition.
- `/about` is skipped on purpose: the home page's "About the team" link has its own photo animation (`src/lib/hero-morph.ts`).

## Steps

1. **Click around the site** and watch the current transition. Read the comments in `page-transition.tsx`.
2. **Collect ideas** using the sources in *Finding ideas* below. Save screen recordings of ones that could fit our theme.
3. **Copy before changing**: duplicate the file (for example `page-transition-old.tsx`) so you can switch back.
4. **Change the look, keep the logic.** The easiest path is to keep the link-catching, `setCovered`, `router.push` and the safety timer as they are, and change only the animations in `start()` and `reveal()` and the elements at the bottom of the file.
5. **Shared-element transition** (if your task asks for it): one element, like a garage photo, grows into its place on the next page. The repo already has two examples to learn from: the `layoutId` in `src/components/mk-accordion.tsx` (Motion) and `src/lib/hero-morph.ts` (GSAP).
6. **Keep these working:**
    - reduced motion: no transition, just a normal page change
    - links on the same page (like `#contact`) should not animate
    - the browser back button
7. **Test slow loading**: in the `F12` panel, Network tab, set throttling to "Slow 4G" and click around. The transition must never get stuck.
8. **Open a pull request** with a screen recording.

## Finding ideas

- [**tympanus.net/codrops**](http://tympanus.net/codrops): search "page transition" for demos with full tutorials.
- [**awwwards.com**](http://awwwards.com): search "page transition" and click between pages on the sites you find.
- [**barba.js.org**](http://barba.js.org): its showcase lists many sites built around page transitions.
- [**gsap.com/showcase**](http://gsap.com/showcase): sites made with GSAP, which our site already uses.
- [**motion.dev/examples**](http://motion.dev/examples): our current transition started from one of these, so it's a good place for alternatives.

## Using AI

1. **Start every chat with context** so the AI gives answers that fit our code:
    
    ```
    Our website is built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, GSAP and Motion (motion/react). Next.js 16 has changes from older versions, so use the App Router and next/navigation, not the pages router or next/router.
    ```
    
2. **Understand it first**: paste `page-transition.tsx` and `src/lib/page-transition.ts` and ask "Explain the cover, load and reveal phases and what setCovered does."
3. **Change only the visuals**: describe the transition you want (or link the example) and ask "Change only the animation in start() and reveal() and the JSX. Keep the link handling, setCovered, router.push and the failsafe exactly as they are."
4. **Shared-element help**: paste `mk-accordion.tsx` and ask how its `layoutId` works before trying your own.
5. **Debug with details**: if the transition gets stuck or flickers, paste the console errors and say which link you clicked.

## Done when

- The new transition works on every link and with the back button.
- Page intros still play after it.
- Reduced motion switches it off.