import { useEffect, useState } from "react"

/** false during server rendering and the hydration pass, true after mount (for portals and other DOM-only UI). */
export function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
