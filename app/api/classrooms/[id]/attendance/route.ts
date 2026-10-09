import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

function toLocaleDate(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient(request)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const date = request.nextUrl.searchParams.get("date")

    let attendanceQuery = supabase
      .from("attendance")
      .select("id, check_in_date, check_in_time, profiles!inner(name)")
      .eq("classroom_id", id)
      .order("check_in_time")

    if (date) {
      attendanceQuery = attendanceQuery.eq("check_in_date", date)
    }

    const [attendanceRes, datesRes] = await Promise.all([
      attendanceQuery,
      supabase
        .from("attendance")
        .select("check_in_date")
        .eq("classroom_id", id)
        .order("check_in_date", { ascending: false }),
    ])

    if (attendanceRes.error) throw attendanceRes.error
    if (datesRes.error) throw datesRes.error

    const attendance = (attendanceRes.data ?? []).map((row) => ({
      id: row.id,
      studentName: (row.profiles as any)?.name ?? "",
      date: toLocaleDate(row.check_in_date),
      time: row.check_in_time ?? "",
    }))

    const dates = [...new Set((datesRes.data ?? []).map((r) => r.check_in_date))]

    return NextResponse.json({ attendance, dates })
  } catch (e) {
    console.error("Error fetching attendance:", e)
    return NextResponse.json({ error: "Error al cargar las asistencias." }, { status: 500 })
  }
}
