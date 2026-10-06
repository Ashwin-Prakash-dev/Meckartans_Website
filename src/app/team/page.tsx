import type { Metadata } from "next"

import Team from "@/views/team"

export const metadata: Metadata = { title: "Our Team" }

export default function Page() {
  return <Team />
}
