import { cn } from "@/lib/utils"

/**
 * Marks content the team hasn't supplied yet. Visible on purpose so reviewers see every gap
 * (all of them are listed in CONTENT-NEEDED.md). Set SHOW_PENDING = false to hide the markers instead.
 */
export const SHOW_PENDING = true

export function Pending({ what, className }: { what?: string; className?: string }) {
  if (!SHOW_PENDING) return null
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-base border border-dashed border-foreground/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground",
        className
      )}
      title={what ? `${what}: to be added` : "To be added"}
    >
      <span className="size-1 rounded-full bg-accent" aria-hidden />
      {what ? `${what} · to be added` : "To be added"}
    </span>
  )
}

/** Value or a Pending marker. */
export function Val({ v, what, className }: { v: string | null | undefined; what?: string; className?: string }) {
  return v ? <span className={className}>{v}</span> : <Pending what={what} />
}
