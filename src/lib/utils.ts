import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * The site's content column: max width + side gutters. Used by the nav, footer, page heroes and every section,
 * so they all align. (Full-bleed photos/video sit outside it on purpose.) Change the width here only.
 */
export const SHELL = "mx-auto w-full max-w-[1320px] px-5 sm:px-10 lg:px-16"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
