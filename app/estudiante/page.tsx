import { redirect } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { StudentClassroomCard } from "@/components/student-classroom-card"
import { JoinClassroomModal } from "@/components/join-classroom-modal"
import { getStudentClassrooms } from "@/lib/queries"
import { createClient } from "@/lib/supabase/server"

export default async function StudentDashboard() {
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

  if (profile?.role !== "student") redirect("/profesor")

  const classrooms = await getStudentClassrooms(user.id)

  return (
    <div className="min-h-screen bg-muted/40">
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Mis aulas</h1>
            <p className="text-sm text-muted-foreground">Consulta tu asistencia y marca presencia</p>
          </div>
          <JoinClassroomModal />
        </div>

        <div className="flex flex-col gap-4">
          {classrooms.map((classroom) => (
            <StudentClassroomCard key={classroom.id} classroom={classroom} />
          ))}
        </div>
      </main>
    </div>
  )
}
