import { supabase } from "./supabase"

export interface ProfessorClassroomCard {
  id: string
  subject: string
  name: string
  schedule: string
  inviteCode: string
  studentCount: number
  active: boolean
}

export interface ClassroomInfo {
  id: string
  subject: string
  name: string
  schedule: string
  inviteCode: string
  startTime: string
  endTime: string
  active: boolean
}

export interface AttendanceRecordRow {
  id: string
  studentName: string
  date: string
  time: string
}

export interface StudentClassroomCardData {
  id: string
  subject: string
  name: string
  professor: string
  schedule: string
  attendancePercentage: number
}

export interface EnrolledStudent {
  id: string
  name: string
  email: string
  attendanceCount: number
  totalDays: number
}

export interface AttendanceHistoryEntryData {
  id: string
  date: string
  time: string | null
  status: "present" | "absent"
}

export async function createClassroom(
  professorId: string,
  data: { name: string; subject: string; start_time: string; end_time: string },
  maxRetries = 3,
): Promise<ProfessorClassroomCard> {
  const schedule = `${data.start_time} — ${data.end_time}`

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data: row, error } = await supabase
      .from("classrooms")
      .insert({
        professor_id: professorId,
        name: data.name,
        subject: data.subject,
        schedule,
        start_time: data.start_time,
        end_time: data.end_time,
      })
      .select("id, subject, name, schedule, invite_code, active")
      .single()

    if (!error) {
      return {
        id: row.id,
        subject: row.subject,
        name: row.name,
        schedule: row.schedule ?? schedule,
        inviteCode: row.invite_code,
        studentCount: 0,
        active: row.active,
      }
    }

    const isCollision =
      error.code === "23505" && error.message?.includes("invite_code")

    if (!isCollision || attempt === maxRetries - 1) throw error
  }

  throw new Error("No se pudo generar un código de invitación único")
}

function toLocaleDate(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export async function getProfessorClassrooms(
  professorId: string,
): Promise<ProfessorClassroomCard[]> {
  const { data, error } = await supabase
    .from("classrooms")
    .select("id, subject, name, schedule, invite_code, active, enrollments(count)")
    .eq("professor_id", professorId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    subject: row.subject,
    name: row.name,
    schedule: row.schedule ?? "",
    inviteCode: row.invite_code,
    studentCount: (row as any).enrollments?.[0]?.count ?? 0,
    active: row.active,
  }))
}

export async function getClassroomById(id: string): Promise<ClassroomInfo | null> {
  const { data, error } = await supabase
    .from("classrooms")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    subject: data.subject,
    name: data.name,
    schedule: data.schedule ?? "",
    inviteCode: data.invite_code,
    startTime: data.start_time ?? "",
    endTime: data.end_time ?? "",
    active: data.active,
  }
}

export async function updateClassroomActive(
  id: string,
  active: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("classrooms")
    .update({ active })
    .eq("id", id)

  if (error) throw error
}

export async function deleteClassroom(id: string): Promise<void> {
  const { error } = await supabase
    .from("classrooms")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function getClassroomByInviteCode(
  code: string,
): Promise<{ id: string; active: boolean } | null> {
  const { data, error } = await supabase
    .from("classrooms")
    .select("id, active")
    .eq("invite_code", code)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function enrollStudent(
  studentId: string,
  classroomId: string,
): Promise<void> {
  const { error } = await supabase
    .from("enrollments")
    .insert({ student_id: studentId, classroom_id: classroomId })

  if (error) throw error
}

export async function getEnrolledStudents(
  classroomId: string,
): Promise<EnrolledStudent[]> {
  const { data: enrollments, error: enrollError } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("classroom_id", classroomId)

  if (enrollError) {
    console.error("enrollError:", JSON.stringify(enrollError, Object.getOwnPropertyNames(enrollError)))
    throw enrollError
  }

  const enrollData = enrollments as { student_id: string }[]
  console.log("getEnrolledStudents enrollments:", enrollData)
  if (!enrollData?.length) return []

  const studentIds = enrollData.map((e) => e.student_id)
  console.log("getEnrolledStudents studentIds:", studentIds)

  const [profilesRes, attendanceRes] = await Promise.all([
    supabase.from("profiles").select("id, name, email").in("id", studentIds),
    supabase
      .from("attendance")
      .select("student_id, status")
      .eq("classroom_id", classroomId),
  ])

  const profileMap = new Map(profilesRes.data?.map((p) => [p.id, p]))

  type StudentStats = { present: number; total: number }
  const stats = new Map<string, StudentStats>()
  for (const a of attendanceRes.data ?? []) {
    const s = stats.get(a.student_id) ?? { present: 0, total: 0 }
    s.total++
    if (a.status === "present") s.present++
    stats.set(a.student_id, s)
  }

  return enrollData.map((e) => {
    const s = stats.get(e.student_id) ?? { present: 0, total: 0 }
    const profile = profileMap.get(e.student_id)
    return {
      id: e.student_id,
      name: profile?.name ?? "",
      email: profile?.email ?? "",
      attendanceCount: s.present,
      totalDays: s.total,
    }
  })
}

export async function getAttendanceByDate(
  classroomId: string,
  date: string,
): Promise<AttendanceRecordRow[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, check_in_date, check_in_time, profiles!inner(name)")
    .eq("classroom_id", classroomId)
    .eq("check_in_date", date)
    .order("check_in_time")

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    studentName: (row.profiles as any).name,
    date: toLocaleDate(row.check_in_date),
    time: row.check_in_time ?? "",
  }))
}

export async function getAttendanceDates(
  classroomId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("check_in_date")
    .eq("classroom_id", classroomId)
    .order("check_in_date", { ascending: false })

  if (error) throw error

  return [...new Set(data.map((r) => r.check_in_date))]
}

export async function getTodaysAttendance(
  classroomId: string,
): Promise<AttendanceRecordRow[]> {
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("attendance")
    .select("id, check_in_date, check_in_time, profiles!inner(name)")
    .eq("classroom_id", classroomId)
    .eq("check_in_date", today)
    .order("check_in_time")

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    studentName: (row.profiles as any).name,
    date: toLocaleDate(row.check_in_date),
    time: row.check_in_time ?? "",
  }))
}

export async function unenrollStudent(studentId: string, classroomId: string): Promise<void> {
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("student_id", studentId)
    .eq("classroom_id", classroomId)

  if (error) throw error
}

export async function getStudentClassrooms(
  studentId: string,
): Promise<StudentClassroomCardData[]> {
  const { data: enrollments, error } = await supabase
    .from("enrollments")
    .select("classroom_id, classrooms!inner(id, subject, name, schedule, professor_id)")
    .eq("student_id", studentId)

  if (error) throw error

  const enrollData = enrollments as any[]
  if (!enrollData.length) return []

  const classroomIds = enrollData.map((e) => e.classroom_id)
  const profIds = [...new Set(enrollData.map((e) => e.classrooms.professor_id))]

  const [professors, allAttendance] = await Promise.all([
    supabase.from("profiles").select("id, name").in("id", profIds),
    supabase
      .from("attendance")
      .select("classroom_id, status")
      .eq("student_id", studentId)
      .in("classroom_id", classroomIds),
  ])

  const profMap = new Map(professors.data?.map((p) => [p.id, p.name]) ?? [])

  const attendanceMap = new Map<string, { present: number; total: number }>()
  for (const a of allAttendance.data ?? []) {
    const entry = attendanceMap.get(a.classroom_id) ?? { present: 0, total: 0 }
    entry.total++
    if (a.status === "present") entry.present++
    attendanceMap.set(a.classroom_id, entry)
  }

  return enrollData.map((enr) => {
    const c = enr.classrooms
    const stats = attendanceMap.get(c.id)
    const total = stats?.total ?? 0
    const present = stats?.present ?? 0
    return {
      id: c.id,
      subject: c.subject,
      name: c.name,
      professor: profMap.get(c.professor_id) ?? "",
      schedule: c.schedule ?? "",
      attendancePercentage: total ? Math.round((present / total) * 100) : 0,
    }
  })
}

export async function getStudentAttendanceHistory(
  studentId: string,
  classroomId: string,
): Promise<AttendanceHistoryEntryData[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("id, check_in_date, check_in_time, status")
    .eq("student_id", studentId)
    .eq("classroom_id", classroomId)
    .order("check_in_date", { ascending: false })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    date: toLocaleDate(row.check_in_date),
    time: row.check_in_time,
    status: row.status as "present" | "absent",
  }))
}

export async function updateUserProfile(
  id: string,
  updates: { name?: string; email?: string },
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)

  if (error) throw error
}
