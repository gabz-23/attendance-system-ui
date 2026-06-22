import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="h-16 border-b border-border bg-card" />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-56" />
        <Skeleton className="mb-6 h-44 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </main>
    </div>
  )
}
