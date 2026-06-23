-- Crear función que bypass RLS con SECURITY DEFINER
-- para que el profesor pueda ver los estudiantes inscritos en su aula
-- Obtiene el email desde auth.users (no desde profiles, donde no existe)
-- Ejecutar en: Supabase Dashboard > SQL Editor

CREATE OR REPLACE FUNCTION get_classroom_students(p_classroom_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  attendance_count BIGINT,
  total_days BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    u.email::TEXT,
    COALESCE(
      (SELECT COUNT(*)::BIGINT FROM attendance a
       WHERE a.student_id = p.id
       AND a.classroom_id = p_classroom_id
       AND a.status = 'present'),
      0::BIGINT
    ),
    COALESCE(
      (SELECT COUNT(*)::BIGINT FROM attendance a
       WHERE a.student_id = p.id
       AND a.classroom_id = p_classroom_id),
      0::BIGINT
    )
  FROM enrollments e
  JOIN profiles p ON p.id = e.student_id
  JOIN auth.users u ON u.id = e.student_id
  WHERE e.classroom_id = p_classroom_id;
END;
$$;
