"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Info, Loader2 } from "lucide-react"
import { TopNav } from "@/components/top-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRole } from "@/components/role-context"
import { createClassroom } from "@/lib/queries"

export default function NewClassroomPage() {
  const router = useRouter()
  const { user } = useRole()
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [start, setStart] = useState("07:00")
  const [end, setEnd] = useState("09:00")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (!user) return
      await createClassroom(user.id, {
        name,
        subject,
        start_time: start,
        end_time: end,
      })
      router.push("/profesor")
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <TopNav />
      <main className="mx-auto max-w-xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Volver">
            <Link href="/profesor">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Nueva aula</h1>
        </div>

        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre del aula</Label>
                <Input id="name" placeholder="Ej. Sección A — Turno mañana" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="subject">Materia</Label>
                <Input id="subject" placeholder="Ej. Matemáticas II" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="start">Hora de inicio</Label>
                  <Input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="end">Hora de fin</Label>
                  <Input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Crear aula
                </Button>
                <Button asChild type="button" variant="ghost">
                  <Link href="/profesor">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-5 flex gap-3 rounded-lg border-l-4 border-primary bg-accent/60 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-accent-foreground">
            Al crear el aula se generará automáticamente un código de invitación para que tus estudiantes puedan
            unirse.
          </p>
        </div>
      </main>
    </div>
  )
}
