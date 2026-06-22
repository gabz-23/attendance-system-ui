"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, Eye, Users } from "lucide-react"
import { InviteCode } from "@/components/invite-code"
import { updateClassroomActive } from "@/lib/queries"
import type { ProfessorClassroomCard } from "@/lib/queries"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

export function ClassroomCard({ classroom }: { classroom: ProfessorClassroomCard }) {
  const [active, setActive] = useState(classroom.active)
  const [toggling, setToggling] = useState(false)

  async function handleToggle(next: boolean) {
    setToggling(true)
    setActive(next)
    try {
      await updateClassroomActive(classroom.id, next)
    } catch {
      setActive(!next)
    } finally {
      setToggling(false)
    }
  }

  return (
    <Card className={`flex flex-col rounded-xl ${!active ? "opacity-60" : ""}`}>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-foreground">{classroom.subject}</h3>
            <p className="truncate text-sm text-muted-foreground">{classroom.name}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1 font-normal">
            <Clock className="size-3" />
            {classroom.schedule}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Código de invitación
          </span>
          <InviteCode code={classroom.inviteCode} />
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          {classroom.studentCount} estudiantes inscritos
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <label htmlFor={`active-${classroom.id}`} className="text-sm font-medium text-foreground">
            Aula activa
          </label>
          <Switch
            id={`active-${classroom.id}`}
            checked={active}
            onCheckedChange={handleToggle}
            disabled={toggling}
          />
        </div>

        <div className="mt-auto">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/profesor/aulas/${classroom.id}`}>
              <Eye className="size-4" />
              Ver asistencias
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
