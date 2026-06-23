"use client"

import { useState, use, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter, notFound } from "next/navigation"
import { ArrowLeft, Download, Calendar, Trash2 } from "lucide-react"
import { TopNav } from "@/components/top-nav"
import {
  QrActiveState,
  QrEmptyState,
} from "@/components/qr-generator"
import {
  deleteClassroom,
  updateClassroomActive,
  getAttendanceByDate,
  getAttendanceDates,
} from "@/lib/queries"
import { supabase } from "@/lib/supabase"
import type { AttendanceRecordRow, EnrolledStudent } from "@/lib/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export default function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const tableRef = useRef<HTMLDivElement>(null)
  const [classroom, setClassroom] = useState<any>(null)
  const [attendance, setAttendance] = useState<AttendanceRecordRow[]>([])
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState("")
  const [loading, setLoading] = useState(true)
  const [generated, setGenerated] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const today = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [availableDates, setAvailableDates] = useState<string[]>([])

  const fetchAttendance = useCallback(async (date: string) => {
    const rows = await getAttendanceByDate(id, date)
    setAttendance(rows)
  }, [id])

  useEffect(() => {
    Promise.all([
      supabase.from("classrooms").select("*").eq("id", id).single(),
      fetchAttendance(today),
      getAttendanceDates(id),
    ])
      .then(([cRes, , dates]) => {
        if (cRes.error || !cRes.data) {
          notFound()
          return
        }
        setClassroom(cRes.data)
        setAvailableDates(dates)
        setLoading(false)
      })
      .catch((e) => {
        console.error("Error loading classroom:", e)
        setLoading(false)
      })
  }, [id, today, fetchAttendance])

  useEffect(() => {
    fetch(`/api/classrooms/${id}/students`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStudentsError(data.error)
        } else {
          setStudents(data.students ?? [])
        }
        setStudentsLoading(false)
      })
      .catch(() => {
        setStudentsError("Error al cargar los estudiantes.")
        setStudentsLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!loading) {
      fetchAttendance(selectedDate)
    }
  }, [selectedDate, loading, fetchAttendance])

  async function handleDateChange(date: string) {
    setSelectedDate(date)
  }

  async function handleToggleActive(next: boolean) {
    setClassroom((prev: any) => ({ ...prev, active: next }))
    try {
      await updateClassroomActive(id, next)
    } catch {
      setClassroom((prev: any) => ({ ...prev, active: !next }))
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteClassroom(id)
      router.push("/profesor")
    } catch {
      setDeleting(false)
    }
  }

  const isToday = selectedDate === today
  const dateLabel = isToday
    ? "Hoy"
    : new Date(selectedDate + "T00:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })

  function exportPdf() {
    import("jspdf").then(({ default: jsPDF }) =>
      import("jspdf-autotable").then(() => {
        const doc = new jsPDF()
        const title = `${classroom.subject} — ${classroom.name}`
        doc.setFontSize(16)
        doc.text(title, 14, 20)
        doc.setFontSize(10)
        doc.text(`Fecha: ${dateLabel}`, 14, 28)

        const body = attendance.map((r, i) => [
          String(i + 1),
          r.studentName,
          r.date,
          r.time,
        ])

        ;(doc as any).autoTable({
          startY: 34,
          head: [["#", "Estudiante", "Fecha", "Hora"]],
          body,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] },
        })

        doc.save(`asistencias-${classroom.subject}-${selectedDate}.pdf`)
      }),
    )
  }

  if (loading) return null
  if (!classroom) return null

  return (
    <div className="min-h-screen bg-muted/40">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Volver">
            <Link href="/profesor">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{classroom.subject}</h1>
            <Badge variant="secondary">{classroom.name}</Badge>
            {!classroom.active && (
              <Badge variant="outline" className="text-muted-foreground">Deshabilitada</Badge>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2 rounded-lg border border-border px-4 py-3">
          <span className="text-sm font-medium text-foreground">Aula activa</span>
          <Switch checked={classroom.active} onCheckedChange={handleToggleActive} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>QR de asistencia</CardTitle>
            </CardHeader>
            <CardContent>
              {classroom.active ? (
                <Tabs
                  value={generated ? "active" : "empty"}
                  onValueChange={(v) => setGenerated(v === "active")}
                >
                  <TabsList className="mb-6 w-full">
                    <TabsTrigger value="empty" className="flex-1">
                      Sin QR
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex-1">
                      QR activo
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="empty">
                    <QrEmptyState onGenerate={() => setGenerated(true)} />
                  </TabsContent>
                  <TabsContent value="active">
                    <QrActiveState classroomId={classroom.id} />
                  </TabsContent>
                </Tabs>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Activa el aula para poder generar un código QR.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>Asistencias registradas</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-40 pl-8 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPdf}
                  disabled={attendance.length === 0}
                  title="Exportar PDF"
                >
                  <Download className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent ref={tableRef}>
              {availableDates.length > 0 && !availableDates.includes(selectedDate) && selectedDate !== today ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay asistencias registradas en esta fecha.
                </p>
              ) : attendance.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {isToday
                    ? "Aún no hay asistencias registradas hoy. Comparte el QR para que tus estudiantes marquen su asistencia."
                    : "No hay asistencias registradas en esta fecha."}
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((record, i) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-7">
                                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                  {initials(record.studentName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{record.studentName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{record.date}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {record.time}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Total: {attendance.length} asistencias
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 rounded-xl">
          <CardHeader>
            <CardTitle>Estudiantes inscritos ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Cargando estudiantes...</p>
            ) : studentsError ? (
              <p className="py-8 text-center text-sm text-destructive">{studentsError}</p>
            ) : students.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay estudiantes inscritos en esta aula.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-destructive">Zona de peligro</h3>
              <p className="text-sm text-muted-foreground">
                Al eliminar esta aula se borrarán permanentemente todos los registros de asistencia y
                estudiantes inscritos.
              </p>
            </div>
            <Dialog>
              <DialogTrigger
                render={
                  <Button variant="destructive">
                    <Trash2 className="size-4" />
                    Eliminar aula
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Eliminar {classroom.subject}?</DialogTitle>
                  <DialogDescription>
                    Esta acción es irreversible. Se eliminarán:
                  </DialogDescription>
                </DialogHeader>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">• El aula <strong>{classroom.name}</strong></li>
                  <li className="flex items-center gap-2">• Todas las asistencias registradas</li>
                  <li className="flex items-center gap-2">• Las inscripciones de los estudiantes</li>
                </ul>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline">Cancelar</Button>} />
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Eliminando..." : "Sí, eliminar aula"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>
    </div>
  )
}
