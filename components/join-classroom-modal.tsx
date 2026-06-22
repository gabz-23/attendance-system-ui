"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useRole } from "@/components/role-context"
import { getClassroomByInviteCode, enrollStudent } from "@/lib/queries"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function JoinClassroomModal() {
  const { user } = useRole()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    const trimmed = code.trim()
    if (trimmed.length < 6) {
      setError(true)
      setErrorMsg("El código debe tener al menos 6 caracteres.")
      return
    }

    setJoining(true)
    setError(false)

    try {
      const classroom = await getClassroomByInviteCode(trimmed)

      if (!classroom) {
        setError(true)
        setErrorMsg("Código no encontrado. Verifica con tu profesor.")
        setJoining(false)
        return
      }

      if (!classroom.active) {
        setError(true)
        setErrorMsg("Esta aula está deshabilitada por el profesor.")
        setJoining(false)
        return
      }

      if (!user) return
      await enrollStudent(user.id, classroom.id)
      setOpen(false)
      setCode("")
      window.location.reload()
    } catch {
      setError(true)
      setErrorMsg("Ocurrió un error al unirte al aula. Intenta de nuevo.")
    } finally {
      setJoining(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline">
          <Plus className="size-4" />
          Unirme a un aula
        </Button>
      } />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Unirme a un aula</DialogTitle>
          <DialogDescription>
            Ingresa el código de invitación que te proporcionó tu profesor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setError(false)
            }}
            placeholder="a3f9b2c1"
            className={cn(
              "text-center font-mono text-lg tracking-widest",
              error && "border-destructive focus-visible:ring-destructive",
            )}
          />
          {error && (
            <p className="text-sm text-destructive">{errorMsg}</p>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleJoin} disabled={joining}>
            {joining && <Loader2 className="size-4 animate-spin" />}
            Unirme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
