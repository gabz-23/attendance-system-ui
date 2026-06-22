import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase/server"
import { unenrollStudent } from "@/lib/queries"

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
      return NextResponse.redirect(new URL("/auth/iniciar-sesion", request.url))
    }

    await unenrollStudent(user.id, id)

    return NextResponse.redirect(new URL("/estudiante", request.url))
  } catch {
    return NextResponse.redirect(new URL("/estudiante", request.url))
  }
}
