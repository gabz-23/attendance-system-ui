import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Correo y contraseña son obligatorios." }, { status: 400 })
    }

    const supabase = createRouteHandlerClient(request)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", data.user.id)
      .single()

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name ?? data.user.email,
        role: profile?.role ?? "student",
      },
    })
  } catch (e) {
    console.error("Login error:", e)
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
