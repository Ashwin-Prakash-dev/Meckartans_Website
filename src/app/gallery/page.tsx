import type { Metadata } from "next"

import Gallery from "@/views/gallery"

export const metadata: Metadata = { title: "Gallery" }

export default function Page() {
  return <Gallery />
}
