import type { Metadata } from "next"

import Garage from "@/views/garage"

export const metadata: Metadata = { title: "MK Garage" }

export default function Page() {
  return <Garage />
}
