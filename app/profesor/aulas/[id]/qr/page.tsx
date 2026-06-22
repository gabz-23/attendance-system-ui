import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getClassroomById } from "@/lib/queries"
import { notFound } from "next/navigation"
import { QrCountdown } from "@/components/qr-generator"

export default async function FullscreenQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const classroom = await getClassroomById(id)

  if (!classroom) {
    notFound()
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-[oklch(0.18_0.01_160)] px-4 py-10 text-center">
      <Link
        href={`/profesor/aulas/${classroom.id}`}
        className="absolute left-4 top-4 flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div>
        <h1 className="text-3xl font-semibold text-white">{classroom.subject}</h1>
        <p className="mt-1 text-white/60">{classroom.name}</p>
      </div>

      <QrCountdown classroomId={classroom.id} />

      <p className="max-w-md text-pretty text-sm text-white/50">
        Pide a tus estudiantes que escaneen este código desde su dispositivo
      </p>
    </main>
  )
}
