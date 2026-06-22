import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { TopNav } from "@/components/top-nav"
import { ClassroomCard } from "@/components/classroom-card"
import { getProfessorClassrooms } from "@/lib/queries"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export default async function ProfessorDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/iniciar-sesion")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "professor") redirect("/estudiante")

  const classrooms = await getProfessorClassrooms(user.id)

  return (
    <div className="min-h-screen bg-muted/40">
      <TopNav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Mis aulas</h1>
            <p className="text-sm text-muted-foreground">Gestiona tus clases y registra asistencias</p>
          </div>
          <Button asChild>
            <Link href="/profesor/aulas/nueva">
              <Plus className="size-4" />
              Nueva aula
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))}
        </div>
      </main>
    </div>
  )
}
