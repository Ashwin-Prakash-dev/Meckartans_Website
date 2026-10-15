# Idea 02: Starting Grid Gantry (FIA 5-Light Sequence)

**Local Test Address**: `http://localhost:3002`  
**Port**: `3002`  
**Brand Metaphor**: Formula 1 / Karting start gantry lights. Five red lights illuminate sequentially, holding the tension before *"LIGHTS OUT AND AWAY WE GO!"*

---

## 1. Design & Motion Choreography

### Phase 1: Cover (Gantry Drop & Light Sequence)
- **Duration**: `180ms` drop + `5x 40ms` light cascade (`~380ms` total cover)
- **Choreography**:
  - A darkened carbon gantry visor drops from the top viewport edge (`y: -100% -> 0`).
  - Five high-intensity circular LED indicators ignite one by one from left to right in 40ms intervals with vibrant crimson bloom (`#E5202E`, `box-shadow: 0 0 20px #E5202E`).
  - As light #5 fires, the entire viewport is seamlessly submerged in deep obsidian (`#08080A`).

### Phase 2: Load (Holding the Redline)
- All 5 lights remain glowing at maximum lumens while Next.js routes and hydrates.
- A subtle low-frequency pulse reflects the engine rev limiter at the starting grid line.

### Phase 3: Reveal (Lights Out & Kinetic Launch)
- **Duration**: `320ms`
- **Curve**: `cubic-bezier(0.22, 1, 0.36, 1)`
- **Choreography**:
  - The instant the route arrives, the 5 lights extinguish simultaneously in a 0ms instant ("LIGHTS OUT!").
  - The dark curtain splits vertically or pulls away with a high-velocity circular iris expansion from the center outwards, unveiling the new page with maximum adrenaline.
  - `setCovered(false)` triggers the incoming page's animations at the precise launch moment.

---

## 2. Technical Contracts & Invariants

- Fully wired to `setCovered(true)` / `setCovered(false)`.
- Skips `/about`, `#` anchors, downloads, external tabs.
- Bypasses with zero latency on `prefers-reduced-motion: reduce`.
- Failsafe timeout at 8000ms.

---

## 3. Running & Testing Locally

```bash
cd "d:\Projects\Meckartans Website\ideas\idea2"
npm run dev
```
Open **`http://localhost:3002`** in your browser.
