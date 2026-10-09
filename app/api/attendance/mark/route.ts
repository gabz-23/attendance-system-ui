import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { localDateString } from "@/lib/utils"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function localTime() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("es-VE", {
    timeZone: "America/Caracas",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now)

  const h = parts.find((p) => p.type === "hour")?.value
  const m = parts.find((p) => p.type === "minute")?.value

  return `${h?.padStart(2, "0")}:${m?.padStart(2, "0")}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role === "professor") {
      return NextResponse.json(
        { error: "Solo los estudiantes pueden registrar asistencia." },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { session, classroom, t, exp } = body ?? {}

    const CLOCK_SKEW_MS = 5 * 60 * 1000
    const QR_MAX_AGE_MS = 24 * 60 * 60 * 1000

    if (!session || !UUID_RE.test(String(session))) {
      return NextResponse.json(
        { error: "El código QR no es válido." },
        { status: 400 },
      )
    }

    if (!classroom || !UUID_RE.test(String(classroom))) {
      return NextResponse.json(
        { error: "El código QR no corresponde a un aula." },
        { status: 400 },
      )
    }

    if (exp !== undefined && exp !== null && exp !== "") {
      const expMs = Number(exp)
      if (!Number.isFinite(expMs)) {
        return NextResponse.json(
          { error: "El código QR no es válido." },
          { status: 400 },
        )
      }
      if (expMs > 0 && Date.now() > expMs + CLOCK_SKEW_MS) {
        return NextResponse.json(
          { error: "Este código QR ha caducado. Pide uno nuevo." },
          { status: 410 },
        )
      }
    } else if (t) {
      const ageMs = Date.now() - Number(t)
      if (
        !Number.isFinite(ageMs) ||
        ageMs > QR_MAX_AGE_MS ||
        ageMs < -CLOCK_SKEW_MS
      ) {
        return NextResponse.json(
          { error: "Este código QR ha caducado. Pide uno nuevo." },
          { status: 410 },
        )
      }
    }

    const { data: classroomRow, error: classroomError } = await supabase
      .from("classrooms")
      .select("id, subject, name, active")
      .eq("id", classroom)
      .maybeSingle()

    if (classroomError) throw classroomError
    if (!classroomRow) {
      return NextResponse.json(
        { error: "El aula no existe." },
        { status: 404 },
      )
    }
    if (!classroomRow.active) {
      return NextResponse.json(
        { error: "Esta aula está deshabilitada. Pide a tu profesor que la active." },
        { status: 403 },
      )
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("classroom_id", classroom)
      .maybeSingle()

    if (enrollmentError) throw enrollmentError
    if (!enrollment) {
      return NextResponse.json(
        { error: "No estás inscrito en esta aula." },
        { status: 403 },
      )
    }

    const { error: insertError } = await supabase.from("attendance").insert({
      student_id: user.id,
      classroom_id: classroom,
      check_in_date: localDateString(),
      check_in_time: localTime(),
      status: "present",
    })

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Ya registraste tu asistencia hoy en esta aula." },
          { status: 409 },
        )
      }
      throw insertError
    }

    return NextResponse.json({
      ok: true,
      classroom: {
        id: classroomRow.id,
        subject: classroomRow.subject,
        name: classroomRow.name,
      },
      time: localTime(),
    })
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar la asistencia. Inténtalo de nuevo." },
      { status: 500 },
    )
  }
}
