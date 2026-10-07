"use client"

// Gallery depth field, after bleibtgleich.dev/archive: an endless 3D field of photos.
//   - space is cut into cubes (CHUNK units). Each holds PER_CHUNK photos at seeded-random spots, so the field is the
//     same on every visit, and only the cubes around the camera exist (built and dropped as it moves)
//   - photos fade with distance into the page background, fully gone at FAR (the reference's "fog")
//   - page scroll flies the camera forward (instead of capturing the wheel, so the page still reaches the footer);
//     a fast scroll bends the field into a bowl; drag pans sideways with inertia, endlessly; the camera drifts
//     slightly toward the mouse; every photo bobs gently
//   - hover outlines a photo; click flies it to the front at its real proportions while the rest dissolve outward
//     from it. Esc, a click elsewhere or scrolling puts it back
// three.js (WebGL). Cards use 512px textures (-t.webp); the focused photo swaps to the large file.

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three"
import { Maximize2, X } from "lucide-react"

import { gsap } from "@/lib/motion"
import { whenRevealed } from "@/lib/page-transition"
import { cn } from "@/lib/utils"

export type FieldPhoto = { id: number; w: number; h: number; label: string; cat: string }

// space
const CHUNK = 110 // world units per cube
const PER_CHUNK = 7 // denser than the reference: on a dark page far cards vanish instead of reading as grey shapes
const SIZE_MIN = 14 // card height range, world units
const SIZE_MAX = 24
const SPAN_XY = 2 // cubes kept on each side of the camera
const SPAN_AHEAD = 3 // ...in front of it (the camera looks down -z)
const SPAN_BEHIND = 1
const NEAR = 160 // fully visible within this distance
const FAR = 290 // gone beyond it
const FOG_CURVE = 1.6 // >1 thins the fog's tail
const FOV = 60
// motion
const START_Z = 50
const Z_PER_SCREEN = 150 // world units flown per screen of page scroll
export const DEPTH_SCREENS = 5 // screens of page scroll spent flying through the field
const BEND = 0.00225 // bowl depth per unit of sideways distance², at full bend
const BEND_SPEED = 6 // z units per frame that count as a full bend
const DRAG = 0.025 // world units of pan velocity per dragged px
const MAX_VEL = 3.2
const DRIFT = 1.5 // how far the camera leans toward the mouse
const BREATH = 1.4 // bob amplitude
// focus
const FOCUS_DIST = 30
const FOCUS_IN_S = 0.9
const FOCUS_OUT_S = 0.7
// intro: cards pop in, staggered
const INTRO_MS = 900
const INTRO_SPREAD_MS = 1100

type Card = {
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>
  photo: FieldPhoto
  x: number
  y: number
  z: number
  w: number
  h: number
  phase: number
  rate: number
  opacity: number // smoothed fog
  introDelay: number
  introT: number
  ready: boolean
  delay: number // focus dissolve order
}

type Chunk = { group: Group; cards: Card[] }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const cubicOut = (t: number) => 1 - Math.pow(1 - t, 3)
const backOut = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)
const smooth = (t: number) => t * t * (3 - 2 * t)

/** Deterministic random numbers for a cube, so the field doesn't reshuffle when a cube is rebuilt. */
function seeded(cx: number, cy: number, cz: number) {
  let s = (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663) ^ Math.imul(cz, 83492791)) >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function DepthField({
  photos,
  onOpen,
  onUnsupported,
  children,
}: {
  photos: FieldPhoto[]
  onOpen: (photo: FieldPhoto) => void
  onUnsupported: () => void
  children?: ReactNode
}) {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const frameLabel = useRef<HTMLSpanElement>(null)
  const photosRef = useRef(photos)
  const engine = useRef<{ rebuild: () => void; unfocus: () => void } | null>(null)
  const [focused, setFocused] = useState<FieldPhoto | null>(null)
  const [shown, setShown] = useState<FieldPhoto | null>(null) // stays set while the caption fades out
  const [coarse, setCoarse] = useState(false)

  useEffect(() => {
    if (focused) setShown(focused)
  }, [focused])

  // the engine: one WebGL scene for the component's lifetime
  useEffect(() => {
    const trackEl = track.current
    const stageEl = stage.current
    if (!trackEl || !stageEl) return

    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" })
    } catch {
      onUnsupported()
      return
    }
    const isCoarse = window.matchMedia("(pointer: coarse)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setCoarse(isCoarse)

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.25 : 1.5))
    renderer.setSize(stageEl.clientWidth, stageEl.clientHeight, false)
    const canvas = renderer.domElement
    canvas.setAttribute("aria-hidden", "true")
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:pan-y;"
    stageEl.prepend(canvas)

    const scene = new Scene()
    const camera = new PerspectiveCamera(FOV, stageEl.clientWidth / stageEl.clientHeight, 1, FAR + CHUNK)
    camera.position.set(0, 0, START_Z)
    const plane = new PlaneGeometry(1, 1)
    const loader = new TextureLoader()
    const raycaster = new Raycaster()
    const ndc = new Vector2()
    const corner = new Vector3()

    // textures, shared by every card showing the same photo
    const textures = new Map<string, { tex: Texture; ready: boolean; waiters: ((t: Texture) => void)[] }>()
    const texture = (url: string, done: (t: Texture) => void) => {
      const hit = textures.get(url)
      if (hit) return hit.ready ? done(hit.tex) : void hit.waiters.push(done)
      const entry = { tex: null as unknown as Texture, ready: false, waiters: [done] }
      textures.set(url, entry)
      entry.tex = loader.load(url, (t) => {
        t.colorSpace = SRGBColorSpace
        t.minFilter = LinearMipmapLinearFilter
        t.magFilter = LinearFilter
        t.anisotropy = 4
        entry.ready = true
        entry.waiters.forEach((w) => w(t))
        entry.waiters = []
      })
    }

    // cubes of space
    const chunks = new Map<string, Chunk>()
    let introStart: number | null = null
    let introOpen = true // cards built before the intro has finished get a staggered pop-in

    const buildChunk = (cx: number, cy: number, cz: number) => {
      const list = photosRef.current
      if (!list.length) return
      const rand = seeded(cx, cy, cz)
      const group = new Group()
      const cards: Card[] = []
      for (let i = 0; i < PER_CHUNK; i++) {
        const photo = list[Math.floor(rand() * list.length) % list.length]
        const h = SIZE_MIN + (SIZE_MAX - SIZE_MIN) * rand()
        const material = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        const mesh = new Mesh(plane, material)
        mesh.visible = false
        const card: Card = {
          mesh,
          photo,
          x: (cx + rand()) * CHUNK,
          y: (cy + rand()) * CHUNK,
          z: (cz + rand()) * CHUNK,
          w: h * (photo.w / photo.h),
          h,
          phase: rand() * Math.PI * 2,
          rate: 0.75 + 0.5 * rand(),
          opacity: 0,
          introDelay: introOpen && !reduced ? rand() * INTRO_SPREAD_MS : 0,
          introT: introOpen && !reduced ? 0 : 1,
          ready: false,
          delay: 0,
        }
        mesh.userData.card = card
        texture(`/media/gallery/${photo.id}-t.webp`, (t) => {
          if (material.userData.disposed) return
          material.map = t
          material.needsUpdate = true
          card.ready = true
        })
        group.add(mesh)
        cards.push(card)
      }
      scene.add(group)
      chunks.set(`${cx},${cy},${cz}`, { group, cards })
    }

    const dropChunk = (key: string) => {
      const chunk = chunks.get(key)
      if (!chunk) return
      chunk.cards.forEach((c) => {
        if (s.hovered === c) s.hovered = null
        c.mesh.material.userData.disposed = true
        c.mesh.material.dispose()
      })
      scene.remove(chunk.group)
      chunks.delete(key)
    }

    const syncChunks = (cx: number, cy: number, cz: number) => {
      const keep = new Set<string>()
      for (let dx = -SPAN_XY; dx <= SPAN_XY; dx++)
        for (let dy = -SPAN_XY; dy <= SPAN_XY; dy++)
          for (let dz = -SPAN_AHEAD; dz <= SPAN_BEHIND; dz++) {
            const key = `${cx + dx},${cy + dy},${cz + dz}`
            keep.add(key)
            if (!chunks.has(key)) buildChunk(cx + dx, cy + dy, cz + dz)
          }
      ;[...chunks.keys()].forEach((key) => keep.has(key) || dropChunk(key))
    }

    // state
    const s = {
      z: START_Z,
      pan: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      target: { x: 0, y: 0 },
      drift: { x: 0, y: 0 },
      mouse: { x: 0, y: 0 },
      pointer: { x: 0, y: 0 },
      pointerIn: false,
      dragging: false,
      moved: false,
      down: { x: 0, y: 0 },
      last: { x: 0, y: 0 },
      bend: 0,
      chunkKey: "",
      hovered: null as Card | null,
      focus: null as Card | null,
      focusExiting: false,
      focusScroll: 0,
      focusTo: { x: 0, y: 0, z: 0, w: 1, h: 1 },
      focusT: { v: 0 },
      large: null as Texture | null,
      visible: [] as Mesh[],
      revealed: false,
      inView: false,
    }

    const rebuild = () => {
      ;[...chunks.keys()].forEach(dropChunk)
      s.chunkKey = ""
      introOpen = true
      introStart = null
    }

    // focus: fly the photo to the front at its real proportions, dissolve the rest outward from it
    const focus = (c: Card) => {
      if (s.focus) return
      s.focus = c
      s.focusExiting = false
      s.focusScroll = window.scrollY
      s.vel.x = s.vel.y = s.target.x = s.target.y = 0
      const viewH = 2 * Math.tan((FOV * Math.PI) / 360) * FOCUS_DIST
      const viewW = viewH * camera.aspect
      let h = viewH * 0.66
      let w = h * (c.photo.w / c.photo.h)
      if (w > viewW * 0.86) {
        h *= (viewW * 0.86) / w
        w = viewW * 0.86
      }
      s.focusTo = { x: s.pan.x, y: s.pan.y + viewH * 0.04, z: s.z - FOCUS_DIST, w, h }
      chunks.forEach((ch) =>
        ch.cards.forEach((o) => {
          o.delay = clamp(Math.hypot(o.x - c.x, o.y - c.y, o.z - c.z) / 60, 0, 1)
        })
      )
      c.mesh.renderOrder = 10
      c.mesh.material.depthTest = false
      gsap.to(s.focusT, { v: 1, duration: reduced ? 0.01 : FOCUS_IN_S, ease: "expo.out", overwrite: true })
      // sharper file for the big view
      loader.load(`/media/gallery/${c.photo.id}-l.webp`, (t) => {
        t.colorSpace = SRGBColorSpace
        if (s.focus !== c || s.focusExiting) return void t.dispose()
        s.large = t
        c.mesh.material.map = t
      })
      setFocused(c.photo)
    }

    const unfocus = () => {
      const c = s.focus
      if (!c || s.focusExiting) return
      s.focusExiting = true
      setFocused(null)
      gsap.to(s.focusT, {
        v: 0,
        duration: reduced ? 0.01 : FOCUS_OUT_S,
        ease: "power3.inOut",
        overwrite: true,
        onComplete: () => {
          const thumb = textures.get(`/media/gallery/${c.photo.id}-t.webp`)
          if (thumb?.ready) c.mesh.material.map = thumb.tex
          s.large?.dispose()
          s.large = null
          c.mesh.renderOrder = 0
          c.mesh.material.depthTest = true
          s.focus = null
          s.focusExiting = false
        },
      })
    }

    engine.current = { rebuild, unfocus }

    // input
    const pick = (clientX: number, clientY: number, among: Mesh[]) => {
      const r = canvas.getBoundingClientRect()
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObjects(among, false)[0]
      return hit ? (hit.object.userData.card as Card) : null
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      s.dragging = true
      s.moved = false
      s.down = { x: e.clientX, y: e.clientY }
      s.last = { x: e.clientX, y: e.clientY }
    }
    const onMove = (e: PointerEvent) => {
      s.pointer = { x: e.clientX, y: e.clientY }
      s.pointerIn = true
      s.mouse = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) }
      if (!s.dragging) return
      if (Math.abs(e.clientX - s.down.x) + Math.abs(e.clientY - s.down.y) > 4) s.moved = true
      if (!s.focus) {
        s.target.x = clamp(s.target.x - DRAG * (e.clientX - s.last.x), -MAX_VEL, MAX_VEL)
        s.target.y = clamp(s.target.y + DRAG * (e.clientY - s.last.y), -MAX_VEL, MAX_VEL)
      }
      s.last = { x: e.clientX, y: e.clientY }
    }
    const onUp = (e: PointerEvent) => {
      if (!s.dragging) return
      s.dragging = false
      if (s.moved) return
      if (s.focus) {
        if (pick(e.clientX, e.clientY, [s.focus.mesh]) !== s.focus) unfocus()
        return
      }
      const hit = pick(e.clientX, e.clientY, s.visible)
      if (hit) focus(hit)
    }
    const onCancel = () => (s.dragging = false)
    const onLeave = () => {
      s.pointerIn = false
      s.mouse = { x: 0, y: 0 }
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && unfocus()
    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerleave", onLeave)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
    window.addEventListener("keydown", onKey)

    const cancelReveal = whenRevealed(() => (s.revealed = true))

    // frame loop
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(64, last ? now - last : 16.667)
      last = now
      const k = dt / 16.667
      const ease = (f: number) => 1 - Math.pow(1 - f, k) // frame-rate independent lerp factor

      // depth follows page scroll (already smoothed by Lenis)
      const rect = trackEl.getBoundingClientRect()
      const range = rect.height - stageEl.clientHeight
      const progress = range > 0 ? clamp(-rect.top / range, 0, 1) : 0
      const prevZ = s.z
      s.z = START_Z - progress * DEPTH_SCREENS * Z_PER_SCREEN
      const vz = (s.z - prevZ) / k

      if (s.focus && !s.focusExiting && Math.abs(window.scrollY - s.focusScroll) > 40) unfocus()

      // sideways: drag inertia + a lean toward the mouse
      if (!s.focus) {
        s.vel.x += (s.target.x - s.vel.x) * ease(0.16)
        s.vel.y += (s.target.y - s.vel.y) * ease(0.16)
        s.pan.x += s.vel.x * k
        s.pan.y += s.vel.y * k
        s.target.x *= Math.pow(0.9, k)
        s.target.y *= Math.pow(0.9, k)
      }
      const lean = s.focus || s.dragging || isCoarse || reduced ? 0 : DRIFT
      s.drift.x += (s.mouse.x * lean - s.drift.x) * ease(0.12)
      s.drift.y += (s.mouse.y * lean - s.drift.y) * ease(0.12)
      camera.position.set(s.pan.x + s.drift.x, s.pan.y + s.drift.y, s.z)

      // a fast scroll bends the field: quick to build, slow to settle
      const speed = reduced ? 0 : clamp(Math.abs(vz) / BEND_SPEED, 0, 1)
      s.bend += (speed - s.bend) * ease(speed > s.bend ? 0.25 : 0.04)

      // cubes around the camera
      if (!s.focus) {
        const key = `${Math.floor(camera.position.x / CHUNK)},${Math.floor(camera.position.y / CHUNK)},${Math.floor(s.z / CHUNK)}`
        if (key !== s.chunkKey) {
          s.chunkKey = key
          const [cx, cy, cz] = key.split(",").map(Number)
          syncChunks(cx, cy, cz)
        }
      }

      if (introStart === null && s.revealed && s.inView) introStart = now
      const introAt = introStart === null ? -1 : now - introStart
      if (introOpen && introAt > INTRO_SPREAD_MS + INTRO_MS) introOpen = false

      // cards
      const f = s.focusT.v
      s.visible.length = 0
      chunks.forEach((chunk) =>
        chunk.cards.forEach((c) => {
          const m = c.mesh
          if (!c.ready) return
          const y = c.y + (reduced ? 0 : Math.sin(now * 0.00045 * c.rate + c.phase) * BREATH)
          const dx = c.x - camera.position.x
          const dy = y - camera.position.y
          const r2 = dx * dx + dy * dy
          const z = c.z + s.bend * r2 * BEND
          const dz = z - camera.position.z
          // fog, plus a fade as a card reaches the camera
          const dist = Math.sqrt(r2 + dz * dz)
          let fog = dist <= NEAR ? 1 : clamp(1 - (dist - NEAR) / (FAR - NEAR), 0, 1)
          fog = Math.pow(fog, FOG_CURVE) * clamp((-dz - 2) / 8, 0, 1)
          c.opacity += (fog - c.opacity) * ease(0.18)

          if (c === s.focus) {
            m.position.set(lerp(c.x, s.focusTo.x, f), lerp(y, s.focusTo.y, f), lerp(z, s.focusTo.z, f))
            m.scale.set(lerp(c.w, s.focusTo.w, f), lerp(c.h, s.focusTo.h, f), 1)
            m.material.opacity = lerp(c.opacity, 1, f)
            m.visible = true
            return
          }

          let pop = 1
          let scale = 1
          if (c.introT < 1) {
            const t = introAt < 0 ? 0 : clamp((introAt - c.introDelay) / INTRO_MS, 0, 1)
            c.introT = t
            pop = cubicOut(t)
            scale = 0.55 + 0.45 * backOut(t)
          }
          m.position.set(c.x, y, z)
          m.scale.set(c.w * scale, c.h * scale, 1)
          let o = c.opacity * pop
          if (f > 0 && s.focus) o *= 1 - smooth(clamp((f - c.delay * 0.7) / 0.3, 0, 1))
          m.material.opacity = o
          m.material.depthWrite = o > 0.99
          m.visible = o > 0.01
          if (o > 0.6) s.visible.push(m)
        })
      )

      // hover outline (mouse only, while the field is still)
      let hovered: Card | null = null
      const still = Math.abs(s.vel.x) + Math.abs(s.vel.y) + Math.abs(vz) < 0.5
      if (!isCoarse && s.pointerIn && !s.dragging && !s.focus && still) hovered = pick(s.pointer.x, s.pointer.y, s.visible)
      s.hovered = hovered
      const fr = frame.current
      if (fr) {
        if (hovered) {
          const m = hovered.mesh
          const w = stageEl.clientWidth
          const hgt = stageEl.clientHeight
          corner.set(m.position.x - m.scale.x / 2, m.position.y + m.scale.y / 2, m.position.z).project(camera)
          const x0 = (corner.x * 0.5 + 0.5) * w
          const y0 = (-corner.y * 0.5 + 0.5) * hgt
          corner.set(m.position.x + m.scale.x / 2, m.position.y - m.scale.y / 2, m.position.z).project(camera)
          const x1 = (corner.x * 0.5 + 0.5) * w
          const y1 = (-corner.y * 0.5 + 0.5) * hgt
          const pad = 6
          fr.style.transform = `translate(${Math.min(x0, x1) - pad}px, ${Math.min(y0, y1) - pad}px)`
          fr.style.width = `${Math.abs(x1 - x0) + pad * 2}px`
          fr.style.height = `${Math.abs(y1 - y0) + pad * 2}px`
          fr.style.opacity = "1"
          if (frameLabel.current) frameLabel.current.textContent = `${hovered.photo.label} · ${hovered.photo.cat}`
        } else if (fr.style.opacity !== "0") fr.style.opacity = "0"
      }
      const cursor = s.dragging ? "grabbing" : s.focus ? "default" : hovered ? "pointer" : "grab"
      if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor

      renderer.render(scene, camera)
    }

    // only run while the stage is on screen
    const io = new IntersectionObserver(([entry]) => {
      s.inView = entry.isIntersecting
      if (entry.isIntersecting && !raf) {
        last = 0
        raf = requestAnimationFrame(tick)
      } else if (!entry.isIntersecting && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    io.observe(stageEl)

    const ro = new ResizeObserver(() => {
      const w = stageEl.clientWidth
      const h = stageEl.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    })
    ro.observe(stageEl)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      cancelReveal()
      gsap.killTweensOf(s.focusT)
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onCancel)
      window.removeEventListener("keydown", onKey)
      ;[...chunks.keys()].forEach(dropChunk)
      textures.forEach((t) => t.tex?.dispose())
      s.large?.dispose()
      plane.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
      engine.current = null
    }
    // the engine lives for the component's lifetime; photo changes go through rebuild()
  }, [])

  // new filter: rebuild the field from the new photo set (and replay the pop-in)
  useEffect(() => {
    if (photosRef.current === photos) return
    photosRef.current = photos
    engine.current?.unfocus()
    engine.current?.rebuild()
  }, [photos])

  return (
    <section ref={track} className="relative" style={{ height: `${100 + DEPTH_SCREENS * 100}svh` }} aria-label="Photo field">
      <div ref={stage} className="sticky top-0 h-svh overflow-hidden">
        {/* the canvas is prepended here */}
        <div ref={frame} className="pointer-events-none absolute left-0 top-0 border border-foreground/70 opacity-0 transition-opacity duration-150" aria-hidden>
          <span ref={frameLabel} className="absolute -top-6 left-0 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/80" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-background via-background/60 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent" aria-hidden />

        {/* page UI over the field; steps aside while a photo is open */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-10 transition-[opacity,visibility] duration-300",
            focused ? "invisible opacity-0" : "visible opacity-100"
          )}
        >
          {children}
        </div>

        {/* how to use it, until a photo is open */}
        <p
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-7 z-10 px-5 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-opacity duration-300",
            focused && "opacity-0"
          )}
        >
          {coarse ? "Swipe up to fly · Drag sideways · Tap a photo" : "Scroll to fly · Drag to look around · Click a photo"}
        </p>

        {/* the open photo's caption */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-6 z-20 flex justify-center px-5 transition-opacity duration-300",
            focused ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          aria-live="polite"
        >
          {shown && (
            <div className="flex items-center gap-4 rounded-base border border-border bg-background/75 py-2 pl-4 pr-2 backdrop-blur-md">
              <span className="font-display text-base font-extrabold uppercase sm:text-lg">{shown.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{shown.cat}</span>
              <button
                type="button"
                onClick={() => onOpen(shown)}
                className="flex items-center gap-2 rounded-base px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
              >
                <Maximize2 className="size-3.5" aria-hidden /> Full size
              </button>
              <button
                type="button"
                onClick={() => engine.current?.unfocus()}
                aria-label="Close photo"
                className="flex size-9 items-center justify-center rounded-full border border-border transition-colors hover:border-accent hover:bg-accent"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
