"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Loader2, Save, User } from "lucide-react"
import { TopNav } from "@/components/top-nav"
import { useRole } from "@/components/role-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ProfilePage() {
  const { user, loading: userLoading, refreshUser } = useRole()
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [emailConfirming, setEmailConfirming] = useState(false)

  if (userLoading) return null
  if (!user) return null

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSuccess(false)
    setProfileError("")
    setEmailConfirming(false)

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email !== user.email ? email : undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.needsReauth) {
          setProfileError("Debes cerrar sesión y volver a iniciarla para cambiar el correo.")
        } else {
          setProfileError(data.error || "Error al guardar los datos.")
        }
        return
      }

      if (email !== user.email) {
        setEmailConfirming(true)
      }

      setProfileSuccess(true)
      await refreshUser()
    } catch {
      setProfileError("Error de conexión.")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordSuccess(false)
    setPasswordError("")

    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.")
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.needsReauth) {
          setPasswordError("Debes cerrar sesión y volver a iniciarla para cambiar la contraseña.")
        } else {
          setPasswordError(data.error || "Error al cambiar la contraseña.")
        }
        return
      }

      setPasswordSuccess(true)
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      setPasswordError("Error de conexión.")
    } finally {
      setSavingPassword(false)
    }
  }

  const home = user.role === "professor" ? "/profesor" : "/estudiante"
  const roleLabel = user.role === "professor" ? "Profesor" : "Estudiante"

  return (
    <div className="min-h-screen bg-muted/40">
      <TopNav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Volver">
            <Link href={home}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Mi perfil</h1>
        </div>

        <div className="mb-8 flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary/10 text-xl font-medium text-primary">
              <User className="size-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-1">{roleLabel}</Badge>
          </div>
        </div>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                {email !== user.email && (
                  <p className="text-xs text-muted-foreground">
                    Se enviará un correo de confirmación a la nueva dirección.
                  </p>
                )}
              </div>

              {profileSuccess && !emailConfirming && (
                <p className="text-sm font-medium text-primary">Datos actualizados correctamente.</p>
              )}
              {emailConfirming && (
                <p className="text-sm font-medium text-primary">
                  Se envió un correo de confirmación a <strong>{email}</strong>. Revisa tu bandeja de entrada para verificar el cambio.
                </p>
              )}
              {profileError && (
                <p className="text-sm font-medium text-destructive">{profileError}</p>
              )}

              <Button type="submit" className="self-start" disabled={savingProfile}>
                {savingProfile && <Loader2 className="size-4 animate-spin" />}
                <Save className="size-4" />
                Guardar cambios
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6 rounded-xl">
          <CardHeader>
            <CardTitle>Cambiar contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {passwordSuccess && (
                <p className="text-sm font-medium text-primary">Contraseña actualizada correctamente.</p>
              )}
              {passwordError && (
                <p className="text-sm font-medium text-destructive">{passwordError}</p>
              )}

              <Button type="submit" className="self-start" disabled={savingPassword}>
                {savingPassword && <Loader2 className="size-4 animate-spin" />}
                Cambiar contraseña
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
