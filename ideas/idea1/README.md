# Idea 01: Telemetry Slipstream (Aerodynamic Kinetic Slits)

**Local Test Address**: `http://localhost:3001`  
**Port**: `3001`  
**Brand Metaphor**: High-speed wind-tunnel slipstream, aerodynamic vortex fins, and real-time pit-wall telemetry.

---

## 1. Design & Motion Choreography

### Phase 1: Cover (Entrance)
- **Duration**: `260ms`
- **Curve**: `cubic-bezier(0.65, 0, 0.35, 1)` (High-velocity mechanical snap)
- **Choreography**:
  - Two razor-sharp carbon-black (`#08080A`) aerodynamic curtains slice inward from the left and right edges with an aggressive -12° aerodynamic slant (`transform: skewX(-12deg)`).
  - A crimson red accent fin (`#E5202E`) leads the left edge, catching the eye as it cuts across the screen.
  - The curtains meet in the center, leaving a sleek horizontal telemetry channel.

### Phase 2: Load (Progress & Telemetry Stream)
- **Readout**: Monospace telemetry badge in `Roboto Mono`:
  - `ROUTE >> [TARGET_PATH] // RPM 12,450 // STATUS: SHIFT_REV`
- **Dynamic Accent**: A laser-red telemetry scan line runs across the fissure, indicating network packet transfer.
- **Spring Progress**: Motion `useSpring(progress, { stiffness: 280, damping: 28 })` smoothly tracks route commit.

### Phase 3: Reveal (Exit onto New Page)
- **Duration**: `380ms`
- **Curve**: `cubic-bezier(0.16, 1, 0.3, 1)` (Explosive aerodynamic release)
- **Choreography**:
  - The instant the new page commits, `setCovered(false)` unlocks the incoming page's intro hooks (`whenRevealed`).
  - The carbon blades accelerate outward past the viewport boundaries with slight scale velocity, unveiling the new page with pristine clarity.

---

## 2. Technical Contracts & Invariants

- **`setCovered(true)`**: Called immediately on link capture before `router.push()`.
- **`setCovered(false)`**: Called at the onset of `reveal()`, synchronizing hero typography and 3D depth field animations.
- **`SKIP` Set**: Skips `/about` (handled by `hero-morph.ts`), hashes (`#`), downloads, and non-left clicks.
- **Accessibility**: Automatically bypasses animation if `prefers-reduced-motion: reduce` is detected.
- **Failsafe**: 8000ms safety timeout guarantees the user is never locked out.

---

## 3. Running & Testing Locally

```bash
cd "d:\Projects\Meckartans Website\ideas\idea1"
npm run dev
```
Open **`http://localhost:3001`** in your browser.
Click between Home, Garage, Gallery, Achievements, and Support to observe the aerodynamic slipstream transition.
