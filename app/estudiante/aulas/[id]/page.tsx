import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, User } from "lucide-react"
import { TopNav } from "@/components/top-nav"
import { createClient } from "@/lib/supabase/server"
import type { AttendanceHistoryEntryData } from "@/lib/queries"
import { UnenrollButton } from "@/components/unenroll-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function CircularProgress({ value }: { value: number }) {
  const radius = 56
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex size-36 items-center justify-center">
      <svg className="size-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-3xl font-bold text-foreground">{value}%</span>
    </div>
  )
}

function toLocaleDate(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default async function StudentClassroomHistory({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/iniciar-sesion")

  const [classroomRes, historyRes] = await Promise.all([
    supabase
      .from("classrooms")
      .select("id, subject, name, schedule, professor_id, profiles!professor_id(name)")
      .eq("id", id)
      .single(),
    supabase
      .from("attendance")
      .select("id, check_in_date, check_in_time, status")
      .eq("student_id", user.id)
      .eq("classroom_id", id)
      .order("check_in_date", { ascending: false }),
  ])

  if (classroomRes.error || !classroomRes.data) notFound()

  const classroom = classroomRes.data as any
  const history: AttendanceHistoryEntryData[] = (historyRes.data ?? []).map(
    (r) => ({
      id: r.id,
      date: toLocaleDate(r.check_in_date),
      time: r.check_in_time,
      status: r.status as "present" | "absent",
    }),
  )

  const present = history.filter((h) => h.status === "present").length
  const total = history.length
  const pct = total ? Math.round((present / total) * 100) : 0

  return (
    <div className="min-h-screen bg-muted/40">
      <TopNav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Volver">
            <Link href="/estudiante">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{classroom.subject}</h1>
            <p className="text-sm text-muted-foreground">{classroom.name}</p>
          </div>
        </div>

        <Card className="mb-6 rounded-xl">
          <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:justify-around">
            <CircularProgress value={pct} />
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <p className="text-sm font-medium text-foreground">
                Asistencias: {present} / {total} clases
              </p>
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <User className="size-4" />
                {classroom.profiles?.name ?? ""}
              </p>
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <Clock className="size-4" />
                {classroom.schedule ?? ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 flex justify-end">
          <UnenrollButton classroomId={classroom.id} />
        </div>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Historial de asistencias</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-foreground">
                      {entry.date}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {entry.time ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.status === "present" ? (
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                          Presente
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-destructive/30 text-destructive"
                        >
                          Ausente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
