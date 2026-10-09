import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const redirectUrl = new URL("/estudiante", request.url)

  try {
    const { id } = await params
    const supabase = createRouteHandlerClient(request)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL("/auth/iniciar-sesion", request.url))
    }

    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("student_id", user.id)
      .eq("classroom_id", id)

    if (error) throw error

    return NextResponse.redirect(redirectUrl)
  } catch (e) {
    console.error("Error unenrolling student:", e)
    return NextResponse.redirect(redirectUrl)
  }
}
