import type { Metadata } from "next"

import Achievements from "@/views/achievements"

export const metadata: Metadata = { title: "Achievements" }

export default function Page() {
  return <Achievements />
}
