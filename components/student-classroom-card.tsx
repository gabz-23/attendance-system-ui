"use client"

import Link from "next/link"
import { Clock, QrCode } from "lucide-react"
import type { StudentClassroomCardData } from "@/lib/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UnenrollButton } from "@/components/unenroll-button"
import { cn } from "@/lib/utils"

export function attendanceColor(pct: number) {
  if (pct >= 90) return { bar: "bg-primary", text: "text-primary" }
  if (pct >= 70) return { bar: "bg-amber-500", text: "text-amber-600" }
  return { bar: "bg-destructive", text: "text-destructive" }
}

export function StudentClassroomCard({ classroom }: { classroom: StudentClassroomCardData }) {
  const colors = attendanceColor(classroom.attendancePercentage)

  return (
    <Card className="rounded-xl">
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{classroom.subject}</h3>
            <p className="text-sm text-muted-foreground">{classroom.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{classroom.professor}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1 font-normal">
            <Clock className="size-3" />
            {classroom.schedule}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Asistencia</span>
            <span className={cn("font-semibold", colors.text)}>{classroom.attendancePercentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", colors.bar)}
              style={{ width: `${classroom.attendancePercentage}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/estudiante/aulas/${classroom.id}`}>Ver asistencias</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/estudiante/escanear">
              <QrCode className="size-4" />
              Escanear QR
            </Link>
          </Button>
        </div>

        <div className="flex justify-end border-t border-border pt-3">
          <UnenrollButton classroomId={classroom.id} label="Salirse del aula" />
        </div>
      </CardContent>
    </Card>
  )
}
