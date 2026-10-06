import Link from "next/link"

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">404</p>
      <h1 className="font-display text-5xl font-black uppercase">Off the track</h1>
      <Link href="/" className="border border-foreground/40 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] hover:border-accent">Back to the pits</Link>
    </section>
  )
}
