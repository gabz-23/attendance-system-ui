import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

const AUTH_ERRORS: Record<string, string> = {
  "A user with this email address has already been registered": "Este correo electrónico ya está registrado.",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres.",
  "Invalid email": "Correo electrónico inválido.",
}

function translateError(message: string): string {
  for (const [en, es] of Object.entries(AUTH_ERRORS)) {
    if (message.includes(en)) return es
  }
  return message
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const { name, email, newPassword } = await request.json()

    if (name !== undefined) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name })
        .eq("id", user.id)

      if (profileError) {
        return NextResponse.json({ error: `Error al actualizar el nombre: ${profileError.message}` }, { status: 500 })
      }
    }

    if (email !== undefined && email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email })

      if (emailError) {
        if (emailError.message?.includes("reauthenticate")) {
          return NextResponse.json(
            { error: "Debes volver a iniciar sesión para cambiar el correo.", needsReauth: true },
            { status: 400 },
          )
        }
        return NextResponse.json(
          { error: translateError(emailError.message) },
          { status: 500 },
        )
      }
    }

    if (newPassword !== undefined) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword })

      if (passwordError) {
        if (passwordError.message?.includes("reauthenticate")) {
          return NextResponse.json(
            { error: "Debes volver a iniciar sesión para cambiar la contraseña.", needsReauth: true },
            { status: 400 },
          )
        }
        return NextResponse.json(
          { error: translateError(passwordError.message) },
          { status: 500 },
        )
      }
    }

    const { data: freshProfile } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: email ?? user.email,
        name: freshProfile?.name ?? user.email,
        role: freshProfile?.role ?? "student",
      },
    })
  } catch (e) {
    console.error("Profile update error:", e)
    return NextResponse.json({ error: "Error al guardar los datos." }, { status: 500 })
  }
}
