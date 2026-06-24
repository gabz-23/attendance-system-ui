"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function ActualizarContrasenaPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true)
      }
    })
    return () => subscription?.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      setSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      setSubmitting(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        setSubmitting(false)
        return
      }

      router.push("/auth/iniciar-sesion?actualizada=1")
    } catch {
      setError("Error de conexión.")
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
            {!ready ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Verificando enlace de recuperación...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="text-center">
                  <h2 className="text-lg font-semibold">Actualizar contraseña</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ingresa tu nueva contraseña.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                <Button type="submit" className="mt-2 w-full" disabled={submitting}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Actualizar contraseña
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
