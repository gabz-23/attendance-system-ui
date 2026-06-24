"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/actualizar-contrasena`,
      })

      if (resetError) {
        setError(resetError.message)
        setSubmitting(false)
        return
      }

      setSent(true)
    } catch {
      setError("Error de conexión.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo iconSize={24} className="text-2xl" />
          <p className="mt-3 text-pretty text-sm text-muted-foreground">
            Sistema de asistencias por código QR
          </p>
        </div>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6">
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="size-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Correo enviado</h2>
                <p className="text-sm text-muted-foreground">
                  Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para
                  restablecer tu contraseña.
                </p>
                <Link
                  href="/auth/iniciar-sesion"
                  className="mt-2 text-sm font-medium text-primary hover:underline"
                >
                  Volver a iniciar sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="text-center">
                  <h2 className="text-lg font-semibold">Recuperar contraseña</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.edu"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                <Button type="submit" className="mt-2 w-full" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Enviar enlace de recuperación
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/auth/iniciar-sesion"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  )
}
