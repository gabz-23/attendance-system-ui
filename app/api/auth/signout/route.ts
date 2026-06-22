import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const url = new URL("/auth/iniciar-sesion", request.url)
  const response = NextResponse.redirect(url)

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") || cookie.name.startsWith("supabase-")) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" })
    }
  }

  return response
}
