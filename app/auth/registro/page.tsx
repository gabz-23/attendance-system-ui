"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, GraduationCap, Loader2, Presentation } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const ERROR_MAP: Record<string, string> = {
  "User already registered": "Este correo ya está registrado.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
  "Invalid email": "Correo electrónico inválido.",
  "Unable to validate email address: invalid format": "Formato de correo electrónico inválido.",
  "Signup requires a valid password": "La contraseña es obligatoria.",
  "Email signups are disabled": "Los registros por correo están desactivados.",
}

function translateError(message: string): string {
  for (const [en, es] of Object.entries(ERROR_MAP)) {
    if (message.includes(en)) return es
  }
  return message
}

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<"professor" | "student">("professor")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.")
      setSubmitting(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      })

      if (authError) {
        setError(translateError(authError.message) || "Error al crear la cuenta.")
        setSubmitting(false)
        return
      }

      window.location.href = "/auth/iniciar-sesion"
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
            Crea tu cuenta para empezar a registrar asistencias
          </p>
        </div>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ej. Ana Rodríguez"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
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
                <Label>Tipo de cuenta</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("professor")}
                    aria-pressed={role === "professor"}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors",
                      role === "professor"
                        ? "border-primary bg-accent text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    <Presentation className="size-6" aria-hidden="true" />
                    <span className="text-sm font-medium">Soy Profesor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    aria-pressed={role === "student"}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors",
                      role === "student"
                        ? "border-primary bg-accent text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    <GraduationCap className="size-6" aria-hidden="true" />
                    <span className="text-sm font-medium">Soy Estudiante</span>
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}

              <Button type="submit" className="mt-2 w-full" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Crear cuenta
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link href="/auth/iniciar-sesion" className="font-medium text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
