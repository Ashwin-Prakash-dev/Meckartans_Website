"use client"

import { useEffect, useState } from "react"

// Pages are prerendered at build time. The Vite build computed the year in the browser; to match it, render the
// build-time year first and switch to the visitor's year after mount (only differs across a New Year without a rebuild).
const BUILD_YEAR = Number(process.env.BUILD_YEAR) || new Date().getFullYear()

export function useCurrentYear() {
  const [year, setYear] = useState(BUILD_YEAR)
  useEffect(() => setYear(new Date().getFullYear()), [])
  return year
}

export function CurrentYear() {
  return <>{useCurrentYear()}</>
}
