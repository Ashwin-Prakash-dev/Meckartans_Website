"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Geometric alignment constants for the Meckartans track car SVG:
 * ViewBox: 0 0 46 24
 * - Front nose tip: (TIP_X, TIP_Y) -> locked precisely to pointer (x, y)
 * - Dual rear exhaust ports: (EXHAUST_X, EXHAUST_1_Y) and (EXHAUST_X, EXHAUST_2_Y)
 */
const TIP_X = 43.0
const TIP_Y = 12.0
const EXHAUST_X = 6.5
const EXHAUST_1_Y = 10.0
const EXHAUST_2_Y = 14.0

const OFFSET_X = EXHAUST_X - TIP_X // -36.5
const OFFSET_1_Y = EXHAUST_1_Y - TIP_Y // -2.0
const OFFSET_2_Y = EXHAUST_2_Y - TIP_Y // +2.0

/** Base resting angle: aggressive forward rake pointing up-right */
const REST_ANGLE = -24 // degrees

/** Number of spline points in rolling history buffer for continuous fluid ribbon */
const NUM_RIBBON_POINTS = 22

interface RibbonPoint {
  x: number
  y: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  type: "flame" | "spark"
  index: number
}

export function CustomCursor() {
  const [active, setActive] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const carWrapperRef = useRef<HTMLDivElement | null>(null)
  const carRotatorRef = useRef<HTMLDivElement | null>(null)

  // Step 1: Detect pointer capability on client
  useEffect(() => {
    try {
      const isCoarse = window.matchMedia("(pointer: coarse)").matches
      const hasFinePointer = window.matchMedia("(any-pointer: fine)").matches

      // Disable custom cursor only on touch-only devices
      if (isCoarse && !hasFinePointer) {
        return
      }
    } catch {
      // Fallback: proceed if matchMedia is unavailable
    }

    setActive(true)
  }, [])

  // Step 2: Initialize Canvas Fluid Ribbon & Particle Trail Engine
  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    const carWrapper = carWrapperRef.current
    const carRotator = carRotatorRef.current
    if (!canvas || !carWrapper || !carRotator) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    handleResize()

    // Dual continuous spline ribbon histories (rolling buffers for exhaust 1 & 2)
    const ribbon1: RibbonPoint[] = Array.from({ length: NUM_RIBBON_POINTS }, () => ({
      x: -100,
      y: -100,
    }))
    const ribbon2: RibbonPoint[] = Array.from({ length: NUM_RIBBON_POINTS }, () => ({
      x: -100,
      y: -100,
    }))

    // Drifting soft-glow particles buffer
    const particles: Particle[] = []
    const MAX_PARTICLES = 220

    // Tracking state
    let mouseX = -100
    let mouseY = -100
    let prevMouseX = -100
    let prevMouseY = -100
    let vx = 0
    let vy = 0
    let speed = 0

    let hasPointerMoved = false
    let isHovering = false
    let isMouseDown = false

    let currentAngle = REST_ANGLE
    let currentScale = 1.0
    let animTime = 0
    let ribbonAlpha = 0
    let idleSpawnTimer = 0

    // ZERO-LAG instantaneous position update on raw mouse movement
    const onMove = (e: MouseEvent | PointerEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      // Front nose tip locked directly to pointer coordinates
      carWrapper.style.transform = `translate3d(${mouseX - TIP_X}px, ${mouseY - TIP_Y}px, 0)`

      if (!hasPointerMoved) {
        hasPointerMoved = true
        prevMouseX = mouseX
        prevMouseY = mouseY

        // Seed ribbon history buffers to initial exhaust coordinates
        const rad = (REST_ANGLE * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const initEx1X = mouseX + (OFFSET_X * cos - OFFSET_1_Y * sin)
        const initEx1Y = mouseY + (OFFSET_X * sin + OFFSET_1_Y * cos)
        const initEx2X = mouseX + (OFFSET_X * cos - OFFSET_2_Y * sin)
        const initEx2Y = mouseY + (OFFSET_X * sin + OFFSET_2_Y * cos)

        for (let i = 0; i < NUM_RIBBON_POINTS; i++) {
          ribbon1[i].x = initEx1X
          ribbon1[i].y = initEx1Y
          ribbon2[i].x = initEx2X
          ribbon2[i].y = initEx2Y
        }

        carWrapper.style.opacity = "1"
        document.documentElement.classList.add("has-custom-cursor")
      }
    }

    const onDown = () => {
      isMouseDown = true
    }

    const onUp = () => {
      isMouseDown = false
    }

    const checkInteractive = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof Element)) return false
      return Boolean(
        target.closest(
          'button, a, input, select, textarea, [role="button"], [role="link"], label, summary, [tabindex]:not([tabindex="-1"]), [data-interactive]'
        )
      )
    }

    const onOver = (e: MouseEvent | PointerEvent) => {
      isHovering = checkInteractive(e.target)
    }

    const onOut = (e: MouseEvent | PointerEvent) => {
      isHovering = checkInteractive(e.relatedTarget)
    }

    const onMouseLeave = () => {
      carWrapper.style.opacity = "0"
      document.documentElement.classList.remove("has-custom-cursor")
    }

    const onMouseEnter = () => {
      if (hasPointerMoved) {
        carWrapper.style.opacity = "1"
        document.documentElement.classList.add("has-custom-cursor")
      }
    }

    // Attach listeners
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("pointerdown", onDown, { passive: true })
    window.addEventListener("pointerup", onUp, { passive: true })
    window.addEventListener("pointerover", onOver, { passive: true })
    window.addEventListener("pointerout", onOut, { passive: true })
    window.addEventListener("mouseover", onOver, { passive: true })
    window.addEventListener("mouseout", onOut, { passive: true })
    document.addEventListener("mouseleave", onMouseLeave)
    document.addEventListener("mouseenter", onMouseEnter)
    window.addEventListener("resize", handleResize)

    // Helper to spawn soft drifting smoke/flame particles
    const spawnParticle = (
      portX: number,
      portY: number,
      rearAngle: number,
      isSpark: boolean,
      hoverBoost: boolean
    ) => {
      if (particles.length >= MAX_PARTICLES) return

      const spread = isSpark
        ? (hoverBoost ? 0.6 : 0.4)
        : (hoverBoost ? 0.35 : 0.22)
      const fireAngle = rearAngle + (Math.random() - 0.5) * spread

      const burstSpeed = isSpark
        ? (hoverBoost ? 5.8 : 3.8) + Math.random() * (hoverBoost ? 3.8 : 2.4)
        : (hoverBoost ? 4.2 : 2.5) + Math.random() * (hoverBoost ? 2.8 : 1.8)

      const pVx = Math.cos(fireAngle) * burstSpeed - vx * 0.12
      const pVy = Math.sin(fireAngle) * burstSpeed - vy * 0.12

      // Extended lifespans for silky, graceful evaporation
      const maxLife = isSpark
        ? Math.floor((hoverBoost ? 20 : 15) + Math.random() * 10)
        : Math.floor((hoverBoost ? 28 : 22) + Math.random() * 12)

      const size = isSpark
        ? 1.2 + Math.random() * 0.8
        : (hoverBoost ? 7.0 : 5.0) + Math.random() * (hoverBoost ? 4.0 : 3.0)

      particles.push({
        x: portX,
        y: portY,
        vx: pVx,
        vy: pVy,
        life: maxLife,
        maxLife,
        size,
        type: isSpark ? "spark" : "flame",
        index: Math.random() * 20,
      })
    }

    // Helper: Draw continuous tapering fluid ribbon using quadratic bezier curves
    const drawRibbon = (
      points: RibbonPoint[],
      baseAlpha: number,
      hoverBoost: boolean
    ) => {
      if (baseAlpha <= 0.001) return
      const len = points.length
      if (len < 3) return

      // Draw segment by segment so width and alpha taper smoothly towards the tail
      for (let i = 0; i < len - 1; i++) {
        const p0 = points[Math.max(0, i - 1)]
        const p1 = points[i]
        const p2 = points[i + 1]

        // Start & End midpoints for C1 continuous quadratic curves
        const startX = i === 0 ? p1.x : (p0.x + p1.x) * 0.5
        const startY = i === 0 ? p1.y : (p0.y + p1.y) * 0.5
        const endX = i === len - 2 ? p2.x : (p1.x + p2.x) * 0.5
        const endY = i === len - 2 ? p2.y : (p1.y + p2.y) * 0.5

        // Progress along ribbon (0 at exhaust, 1 at tail)
        const progress = i / (len - 1)
        // Cubic easing fade curve for smooth evaporation into dark background
        const fade = Math.pow(1 - progress, 2)
        const segmentAlpha = baseAlpha * fade

        if (segmentAlpha <= 0.005) continue

        const outerWidth = (hoverBoost ? 7.2 : 4.8) * (1 - progress * 0.8)
        const innerWidth = (hoverBoost ? 3.4 : 2.2) * (1 - progress * 0.85)

        // Pass 1: Outer warm gold glow ribbon (#f59e0b)
        ctx.strokeStyle = `rgba(245, 158, 11, ${segmentAlpha * 0.65})`
        ctx.lineWidth = Math.max(0.5, outerWidth)
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.quadraticCurveTo(p1.x, p1.y, endX, endY)
        ctx.stroke()

        // Pass 2: Inner bright amber/white core ribbon (#fffbeb)
        ctx.strokeStyle = `rgba(255, 251, 235, ${segmentAlpha * 0.95})`
        ctx.lineWidth = Math.max(0.2, innerWidth)
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.quadraticCurveTo(p1.x, p1.y, endX, endY)
        ctx.stroke()
      }
    }

    // Animation & Physics Loop
    let rafId: number

    const renderLoop = () => {
      animTime += 0.05
      idleSpawnTimer++

      // Velocity calculation
      vx = mouseX - prevMouseX
      vy = mouseY - prevMouseY
      prevMouseX = mouseX
      prevMouseY = mouseY
      speed = Math.hypot(vx, vy)

      // Steering rotation calculation: smooth banking into turns
      let targetAngle = REST_ANGLE
      if (speed > 0.4) {
        const moveAngle = Math.atan2(vy, vx)
        const restRad = (REST_ANGLE * Math.PI) / 180
        const angleDiff = Math.sin(moveAngle - restRad)
        const intensity = Math.min(1.0, speed / 12)
        const steerDeg = angleDiff * 26 * intensity
        const pitchDeg = Math.max(-10, Math.min(10, vy * 0.45))
        targetAngle = REST_ANGLE + steerDeg + pitchDeg
      }

      // Responsive interpolation (snappy 0.36 factor for agility)
      currentAngle += (targetAngle - currentAngle) * 0.36

      // Interactive hover boost scale & nitrous vibration
      let targetScale = isHovering ? 1.22 : isMouseDown ? 0.94 : 1.0
      if (isHovering) {
        targetScale += Math.sin(animTime * 6.0) * 0.03
      }
      currentScale += (targetScale - currentScale) * 0.28

      // Rotate race car around the front nose tip coordinate
      carRotator.style.transform = `rotate(${currentAngle}deg) scale(${currentScale})`

      // Dynamic nitrous glow on interactive hover
      carRotator.style.filter = isHovering
        ? "drop-shadow(0 0 10px rgba(250, 204, 21, 0.95)) drop-shadow(0 0 20px rgba(234, 179, 8, 0.8)) drop-shadow(0 0 32px rgba(245, 158, 11, 0.5))"
        : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 4px rgba(234, 179, 8, 0.35))"

      // Compute exact dual rear exhaust coordinates in world screen space
      const rad = (currentAngle * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const rearAngle = rad + Math.PI

      const ex1X = mouseX + currentScale * (OFFSET_X * cos - OFFSET_1_Y * sin)
      const ex1Y = mouseY + currentScale * (OFFSET_X * sin + OFFSET_1_Y * cos)
      const ex2X = mouseX + currentScale * (OFFSET_X * cos - OFFSET_2_Y * sin)
      const ex2Y = mouseY + currentScale * (OFFSET_X * sin + OFFSET_2_Y * cos)

      // Update Ribbon 1 (Port 1) Spine with fluid follow and lateral sway
      ribbon1[0].x = ex1X
      ribbon1[0].y = ex1Y
      for (let i = 1; i < NUM_RIBBON_POINTS; i++) {
        const prev = ribbon1[i - 1]
        const curr = ribbon1[i]
        const dx = prev.x - curr.x
        const dy = prev.y - curr.y
        const dist = Math.hypot(dx, dy) || 1

        const followFactor = 0.54 - (i / NUM_RIBBON_POINTS) * 0.16
        curr.x += dx * followFactor
        curr.y += dy * followFactor

        // Organic lateral sway perpendicular to movement vector
        const nx = -dy / dist
        const ny = dx / dist
        const sway =
          Math.sin(animTime * 2.6 + i * 0.38) *
          (isHovering ? 1.8 : 1.0) *
          (i / NUM_RIBBON_POINTS)
        curr.x += nx * sway
        curr.y += ny * sway
      }

      // Update Ribbon 2 (Port 2) Spine with mirrored phase for aerodynamic wake
      ribbon2[0].x = ex2X
      ribbon2[0].y = ex2Y
      for (let i = 1; i < NUM_RIBBON_POINTS; i++) {
        const prev = ribbon2[i - 1]
        const curr = ribbon2[i]
        const dx = prev.x - curr.x
        const dy = prev.y - curr.y
        const dist = Math.hypot(dx, dy) || 1

        const followFactor = 0.54 - (i / NUM_RIBBON_POINTS) * 0.16
        curr.x += dx * followFactor
        curr.y += dy * followFactor

        const nx = -dy / dist
        const ny = dx / dist
        const sway =
          Math.sin(animTime * 2.6 + i * 0.38 + Math.PI) *
          (isHovering ? 1.8 : 1.0) *
          (i / NUM_RIBBON_POINTS)
        curr.x += nx * sway
        curr.y += ny * sway
      }

      // Smooth ribbon visibility fade
      if (speed > 0.4 || isHovering) {
        ribbonAlpha += (1.0 - ribbonAlpha) * 0.25
      } else {
        ribbonAlpha += (0.0 - ribbonAlpha) * 0.08
      }

      // Emit luminous golden-yellow and amber flame/spark particles
      if (hasPointerMoved) {
        if (speed > 0.4) {
          const count = isHovering
            ? Math.min(3, Math.floor(speed / 3) + 2)
            : Math.min(2, Math.floor(speed / 5) + 1)

          for (let i = 0; i < count; i++) {
            spawnParticle(ex1X, ex1Y, rearAngle, false, isHovering)
            spawnParticle(ex2X, ex2Y, rearAngle, false, isHovering)

            // Occasional high-speed titanium sparks
            if (Math.random() < (isHovering ? 0.75 : 0.45)) {
              spawnParticle(ex1X, ex1Y, rearAngle, true, isHovering)
              spawnParticle(ex2X, ex2Y, rearAngle, true, isHovering)
            }
          }
        } else if (isHovering && idleSpawnTimer % 2 === 0) {
          // Energetic idling nitrous burst when hovering
          spawnParticle(ex1X, ex1Y, rearAngle, false, true)
          spawnParticle(ex2X, ex2Y, rearAngle, false, true)
          if (Math.random() < 0.5) {
            spawnParticle(ex1X, ex1Y, rearAngle, true, true)
            spawnParticle(ex2X, ex2Y, rearAngle, true, true)
          }
        }
      }

      // Render on 2D Canvas with Additive Blending
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = "lighter"

      // 1. Draw continuous, tapering fluid ribbons for dual exhausts
      if (hasPointerMoved && ribbonAlpha > 0.005) {
        drawRibbon(ribbon1, ribbonAlpha, isHovering)
        drawRibbon(ribbon2, ribbonAlpha, isHovering)
      }

      // 2. Draw soft-glow drifting smoke/flame particles & sparks
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        const lifeRatio = p.life / p.maxLife
        // Cubic easing fade so particles evaporate seamlessly
        const fadeAlpha = Math.pow(lifeRatio, 2)

        if (p.type === "flame") {
          const alpha = (isHovering ? 0.95 : 0.8) * fadeAlpha
          const radius = Math.max(1, p.size * (1 - (1 - lifeRatio) * 0.35))

          if (alpha > 0.005) {
            // Soft circular radial gradient: #fffbeb -> #f59e0b -> #d9770600
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
            grad.addColorStop(0, `rgba(255, 251, 235, ${alpha})`) // bright amber/white center (#fffbeb)
            grad.addColorStop(0.42, `rgba(245, 158, 11, ${alpha * 0.8})`) // warm gold (#f59e0b)
            grad.addColorStop(1, "rgba(217, 119, 6, 0)") // transparent amber (#d9770600)

            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
            ctx.fill()
          }
        } else {
          // Sharp glowing spark streak
          const alpha = (isHovering ? 1.0 : 0.85) * fadeAlpha

          if (alpha > 0.005) {
            const streakLen = isHovering ? 2.6 : 1.8
            const tailX = p.x - p.vx * streakLen
            const tailY = p.y - p.vy * streakLen

            ctx.strokeStyle = `rgba(255, 251, 235, ${alpha})`
            ctx.lineWidth = Math.max(0.6, p.size * (1 - (1 - lifeRatio) * 0.5))
            ctx.lineCap = "round"
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(tailX, tailY)
            ctx.stroke()
          }
        }

        // Fluid physics: smooth velocity decay (friction ~0.945)
        p.vx *= 0.945
        p.vy *= 0.945

        // Perpendicular lateral sway for drifting smoke/wake motion
        const vLen = Math.hypot(p.vx, p.vy) || 1
        const perpX = -p.vy / vLen
        const perpY = p.vx / vLen
        const sway = Math.sin(animTime * 3.0 + p.index) * (isHovering ? 0.55 : 0.32)

        p.x += p.vx + perpX * sway
        p.y += p.vy + perpY * sway
        p.life--

        if (p.life <= 0) {
          particles.splice(i, 1)
        }
      }

      rafId = requestAnimationFrame(renderLoop)
    }

    rafId = requestAnimationFrame(renderLoop)

    // Complete cleanup on unmount
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointerover", onOver)
      window.removeEventListener("pointerout", onOut)
      window.removeEventListener("mouseover", onOver)
      window.removeEventListener("mouseout", onOut)
      document.removeEventListener("mouseleave", onMouseLeave)
      document.removeEventListener("mouseenter", onMouseEnter)
      window.removeEventListener("resize", handleResize)
      document.documentElement.classList.remove("has-custom-cursor")

      ribbon1.length = 0
      ribbon2.length = 0
      particles.length = 0
      ctx.clearRect(0, 0, width, height)
    }
  }, [active])

  if (!active) {
    return null
  }

  return (
    <>
      {/* Hide native OS pointer on desktop devices when custom cursor is active */}
      <style>{`
        @media (pointer: fine) {
          html.has-custom-cursor,
          html.has-custom-cursor body,
          html.has-custom-cursor * {
            cursor: none !important;
          }
        }
      `}</style>

      {/* Primary cursor layer: strictly non-interactive, fixed over entire viewport */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none"
        style={{ pointerEvents: "none", zIndex: 9999 }}
      >
        {/* Fullscreen 2D Canvas for Dual Fluid Exhaust Spline Ribbons & Soft Particles */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ pointerEvents: "none" }}
        />

        {/* Race Car Pointer: Outer wrapper for instant 0ms hardware-rate translation */}
        <div
          ref={carWrapperRef}
          className="absolute pointer-events-none opacity-0 will-change-transform"
          style={{
            left: 0,
            top: 0,
            pointerEvents: "none",
          }}
        >
          {/* Inner element for agile banking rotation around the front nose tip */}
          <div
            ref={carRotatorRef}
            className="pointer-events-none will-change-transform transition-[filter] duration-150"
            style={{
              width: 46,
              height: 24,
              pointerEvents: "none",
              transformOrigin: `${TIP_X}px ${TIP_Y}px`,
            }}
          >
            <svg
              width="46"
              height="24"
              viewBox="0 0 46 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible"
              style={{ overflow: "visible", display: "block" }}
            >
              <defs>
                {/* Vibrant racing yellow bodywork gradient */}
                <linearGradient id="cursor-car-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ca8a04" />
                  <stop offset="35%" stopColor="#eab308" />
                  <stop offset="80%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>

                {/* Cockpit canopy reflection gradient */}
                <linearGradient id="cursor-car-canopy" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#0f172a" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>

                {/* Exhaust port glow filter */}
                <filter id="cursor-exhaust-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#f59e0b" floodOpacity="0.9" />
                </filter>
              </defs>

              {/* Underbody Carbon Floor & Diffuser */}
              <path
                d="M 4 8 L 8 8.5 L 11 7 L 27 7.5 L 28 9.5 L 26 14.5 L 28 14.5 L 27 16.5 L 11 17 L 8 15.5 L 4 16 Z"
                fill="#09090b"
              />

              {/* Rear Wing Endplates */}
              <rect x="3" y="1.8" width="5.5" height="1.8" rx="0.6" fill="#18181b" stroke="#facc15" strokeWidth="0.5" />
              <rect x="3" y="20.4" width="5.5" height="1.8" rx="0.6" fill="#18181b" stroke="#facc15" strokeWidth="0.5" />

              {/* Rear Wing Carbon Mainplane */}
              <path d="M 4 2.8 L 7.5 2.8 L 6.8 21.2 L 4 21.2 Z" fill="#09090b" stroke="#27272a" strokeWidth="0.5" />

              {/* Rear Wing DRS Flap (Racing Yellow) */}
              <rect x="4.5" y="3.8" width="2.2" height="16.4" rx="0.5" fill="#facc15" />

              {/* Rear Wing Support Pylons */}
              <line x1="6.8" y1="10.5" x2="9.5" y2="11.2" stroke="#27272a" strokeWidth="0.8" />
              <line x1="6.8" y1="13.5" x2="9.5" y2="12.8" stroke="#27272a" strokeWidth="0.8" />

              {/* Rear Rain Safety Light (Center LED) */}
              <rect x="4" y="11.2" width="1.6" height="1.6" rx="0.4" fill="#ef4444" />
              <circle cx="4.8" cy="12" r="0.4" fill="#ffffff" />

              {/* Dual Rear Exhaust Ports (Top & Bottom) */}
              <ellipse
                cx="6.5"
                cy="10.0"
                rx="1.2"
                ry="0.9"
                fill="#27272a"
                stroke="#71717a"
                strokeWidth="0.4"
                filter="url(#cursor-exhaust-glow)"
              />
              <ellipse cx="6.3" cy="10.0" rx="0.7" ry="0.55" fill="#f59e0b" />
              <circle cx="6.2" cy="10.0" r="0.25" fill="#ffffff" />

              <ellipse
                cx="6.5"
                cy="14.0"
                rx="1.2"
                ry="0.9"
                fill="#27272a"
                stroke="#71717a"
                strokeWidth="0.4"
                filter="url(#cursor-exhaust-glow)"
              />
              <ellipse cx="6.3" cy="14.0" rx="0.7" ry="0.55" fill="#f59e0b" />
              <circle cx="6.2" cy="14.0" r="0.25" fill="#ffffff" />

              {/* Rear Suspension Wishbones */}
              <line x1="11" y1="5.4" x2="13" y2="9.5" stroke="#3f3f46" strokeWidth="0.8" />
              <line x1="8" y1="5.4" x2="10" y2="10" stroke="#3f3f46" strokeWidth="0.8" />
              <line x1="11" y1="18.6" x2="13" y2="14.5" stroke="#3f3f46" strokeWidth="0.8" />
              <line x1="8" y1="18.6" x2="10" y2="14" stroke="#3f3f46" strokeWidth="0.8" />

              {/* Rear Wide Racing Tires (Top & Bottom) */}
              <rect x="6.5" y="1.2" width="9" height="4.2" rx="1.2" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
              <rect x="8.5" y="2.2" width="5" height="2.2" rx="0.6" fill="#18181b" />
              <circle cx="11" cy="3.3" r="0.7" fill="#facc15" />

              <rect x="6.5" y="18.6" width="9" height="4.2" rx="1.2" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
              <rect x="8.5" y="19.6" width="5" height="2.2" rx="0.6" fill="#18181b" />
              <circle cx="11" cy="20.7" r="0.7" fill="#facc15" />

              {/* Front Suspension Wishbones */}
              <line x1="33" y1="5.8" x2="31" y2="9.8" stroke="#3f3f46" strokeWidth="0.8" />
              <line x1="35" y1="5.8" x2="36" y2="10.5" stroke="#3f3f46" strokeWidth="0.8" />
              <line x1="33" y1="18.2" x2="31" y2="14.2" stroke="#3f3f46" strokeWidth="0.8" />
              <line x1="35" y1="18.2" x2="36" y2="13.5" stroke="#3f3f46" strokeWidth="0.8" />

              {/* Front Racing Tires (Top & Bottom) */}
              <rect x="29" y="2" width="8" height="3.8" rx="1.1" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
              <rect x="30.8" y="2.8" width="4.4" height="2.2" rx="0.5" fill="#18181b" />
              <circle cx="33" cy="3.9" r="0.6" fill="#facc15" />

              <rect x="29" y="18.2" width="8" height="3.8" rx="1.1" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
              <rect x="30.8" y="19" width="4.4" height="2.2" rx="0.5" fill="#18181b" />
              <circle cx="33" cy="20.1" r="0.6" fill="#facc15" />

              {/* Main Aerodynamic Monocoque Chassis & Sidepods (Racing Yellow) */}
              <path
                d="M 8 10.5 L 10 9 Q 14 6.2 19 6.2 Q 24 6.2 26.5 8.5 L 28 9.8 L 36 10.8 L 43 12 L 36 13.2 L 28 14.2 L 26.5 15.5 Q 24 17.8 19 17.8 Q 14 17.8 10 15 L 8 13.5 Z"
                fill="url(#cursor-car-yellow)"
                stroke="#ca8a04"
                strokeWidth="0.4"
              />

              {/* Sidepod Carbon Air Intakes */}
              <path d="M 24.5 7 L 26.5 8.5 L 25 10 L 23 8 Z" fill="#18181b" stroke="#09090b" strokeWidth="0.4" />
              <path d="M 24.5 17 L 26.5 15.5 L 25 14 L 23 16 Z" fill="#18181b" stroke="#09090b" strokeWidth="0.4" />

              {/* Cockpit & Cockpit Halo */}
              <ellipse cx="23" cy="12" rx="4.2" ry="2.4" fill="#09090b" />
              <ellipse cx="23" cy="12" rx="3.4" ry="1.8" fill="url(#cursor-car-canopy)" />

              {/* Driver Helmet */}
              <circle cx="22" cy="12" r="1.3" fill="#facc15" stroke="#09090b" strokeWidth="0.35" />
              <path d="M 22.3 11.2 Q 23.2 12 22.3 12.8" stroke="#09090b" strokeWidth="0.6" fill="none" />

              {/* Halo Structure */}
              <path d="M 25.5 12 L 21 10.4 M 25.5 12 L 21 13.6" stroke="#3f3f46" strokeWidth="0.6" strokeLinecap="round" />
              <circle cx="25.5" cy="12" r="0.6" fill="#71717a" />

              {/* Engine Airbox Scoop & Dorsal Shark Fin */}
              <path d="M 18.5 11.2 L 20 12 L 18.5 12.8 Z" fill="#09090b" />
              <line x1="9" y1="12" x2="18.5" y2="12" stroke="#18181b" strokeWidth="0.8" strokeLinecap="round" />

              {/* Center Racing Stripe */}
              <path d="M 27 12 L 41 12" stroke="#18181b" strokeWidth="0.7" />
              <path d="M 28 11.4 L 38 11.7" stroke="#ffffff" strokeWidth="0.35" opacity="0.9" />
              <path d="M 28 12.6 L 38 12.3" stroke="#ffffff" strokeWidth="0.35" opacity="0.9" />

              {/* Front Wing Carbon Mainplane */}
              <path d="M 38 3 L 41 3.5 L 40.5 20.5 L 38 21 Z" fill="#09090b" stroke="#27272a" strokeWidth="0.5" />

              {/* Front Wing Flaps (Racing Yellow) */}
              <path d="M 38.8 4.5 L 40.8 5 L 40.5 10.5 L 38.8 10.2 Z" fill="#facc15" />
              <path d="M 38.8 19.5 L 40.8 19 L 40.5 13.5 L 38.8 13.8 Z" fill="#facc15" />

              {/* Front Wing Endplates */}
              <rect x="37.5" y="2.2" width="4.5" height="1.6" rx="0.5" fill="#facc15" stroke="#09090b" strokeWidth="0.4" />
              <rect x="37.5" y="20.2" width="4.5" height="1.6" rx="0.5" fill="#facc15" stroke="#09090b" strokeWidth="0.4" />

              {/* Needle-Sharp Nose Cone Tip (Pointer Anchor) */}
              <polygon points="41,11 43,12 41,13" fill="#facc15" stroke="#ca8a04" strokeWidth="0.3" />
              <circle cx="43" cy="12" r="0.5" fill="#fef08a" />
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}

export default CustomCursor
