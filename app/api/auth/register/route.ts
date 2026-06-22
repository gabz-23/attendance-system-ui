import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 })
    }

    if (!["professor", "student"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido." }, { status: 400 })
    }

    const supabase = createRouteHandlerClient(request)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    })

    if (error) {
      console.error("signUp error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
      console.error("signUp error keys:", Object.keys(error))
      if (error.message?.includes("already")) {
        return NextResponse.json({ error: "Este correo ya está registrado." }, { status: 400 })
      }
      return NextResponse.json({ error: `Error: ${error.message ?? JSON.stringify(error)}` }, { status: 500 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "El usuario no se creó — posiblemente requiera confirmación de email." }, { status: 500 })
    }

    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          name,
          role,
        },
      },
      { status: 201 },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e)
    console.error("Register catch:", msg)
    return NextResponse.json({ error: `Error interno: ${msg}` }, { status: 500 })
  }
}
