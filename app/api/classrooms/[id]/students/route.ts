import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

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

    const { data, error } = await supabase.rpc("get_classroom_students", {
      p_classroom_id: id,
    })

    if (error) {
      console.error("RPC error:", error)

      if (error.message?.includes("function") && error.message?.includes("not found")) {
        return NextResponse.json(
          {
            error:
              "La función get_classroom_students no existe. Ejecuta el SQL en Supabase Dashboard > SQL Editor.",
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ error: `Error: ${error.message}` }, { status: 500 })
    }

    const students = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name ?? "",
      email: row.email ?? "",
      attendanceCount: Number(row.attendance_count),
      totalDays: Number(row.total_days),
    }))

    return NextResponse.json({ students })
  } catch (e) {
    console.error("Error fetching students:", e)
    return NextResponse.json({ error: "Error al cargar los estudiantes." }, { status: 500 })
  }
}
