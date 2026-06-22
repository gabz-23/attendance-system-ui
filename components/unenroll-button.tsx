"use client"

import { useState } from "react"
import { LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function UnenrollButton({ classroomId, label }: { classroomId: string; label?: string }) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    setSubmitting(true)
    window.location.href = `/api/classrooms/${classroomId}/unenroll`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm"><LogOut className="size-4" />{label ?? "Salirse"}</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Salir del aula?</DialogTitle>
          <DialogDescription>
            Se eliminará tu inscripción y ya no podrás registrar asistencias en esta aula.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Sí, salirme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
