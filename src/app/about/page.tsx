import type { Metadata } from "next"

import About from "@/views/about"

export const metadata: Metadata = { title: "About" }

export default function Page() {
  return <About />
}
