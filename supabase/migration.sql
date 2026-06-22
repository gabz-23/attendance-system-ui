-- AsistQR — Migración inicial
-- Ejecutar en el SQL Editor de Supabase (una sola vez)

-- 1. Users (profesores y estudiantes unificados)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('professor', 'student')),
  password text DEFAULT '123456',
  created_at timestamptz DEFAULT now()
);

-- 2. Classrooms (aulas creadas por profesores)
CREATE TABLE classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  name text NOT NULL,
  schedule text,
  start_time time,
  end_time time,
  invite_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. Enrollments (inscripción de estudiantes a aulas)
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, classroom_id)
);

-- 4. Attendance (registro de asistencia)
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  check_in_date date NOT NULL DEFAULT CURRENT_DATE,
  check_in_time time,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent')),
  UNIQUE(student_id, classroom_id, check_in_date)
);

-- Índices para consultas frecuentes
CREATE INDEX idx_classrooms_professor ON classrooms(professor_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_classroom ON enrollments(classroom_id);
CREATE INDEX idx_attendance_classroom_date ON attendance(classroom_id, check_in_date);
CREATE INDEX idx_attendance_student ON attendance(student_id);

-- 5. Seed data (opcional — datos de prueba equivalentes al mock-data.ts)
INSERT INTO users (id, email, name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'rosmary.pardo@universidad.edu', 'Rosmary Pardo', 'professor'),
  ('00000000-0000-0000-0000-000000000002', 'ana.rodriguez@universidad.edu', 'Ana Rodríguez', 'student'),
  ('00000000-0000-0000-0000-000000000003', 'carlos.perez@universidad.edu', 'Carlos Pérez', 'student'),
  ('00000000-0000-0000-0000-000000000004', 'maria.gonzalez@universidad.edu', 'María González', 'student'),
  ('00000000-0000-0000-0000-000000000005', 'luis.martinez@universidad.edu', 'Luis Martínez', 'student'),
  ('00000000-0000-0000-0000-000000000006', 'sofia.ramirez@universidad.edu', 'Sofía Ramírez', 'student'),
  ('00000000-0000-0000-0000-000000000007', 'diego.fernandez@universidad.edu', 'Diego Fernández', 'student'),
  ('00000000-0000-0000-0000-000000000008', 'valentina.cruz@universidad.edu', 'Valentina Cruz', 'student'),
  ('00000000-0000-0000-0000-000000000009', 'andres.herrera@universidad.edu', 'Andrés Herrera', 'student');

INSERT INTO classrooms (id, professor_id, subject, name, schedule, start_time, end_time, invite_code, active) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Matemáticas II', 'Sección A — Turno mañana', '7:00 AM — 9:00 AM', '07:00', '09:00', 'a3f9b2c1', true),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Física General', 'Sección B — Turno mañana', '9:00 AM — 11:00 AM', '09:00', '11:00', 'f7d2e8a4', true),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Cálculo I', 'Sección C — Turno tarde', '1:00 PM — 3:00 PM', '13:00', '15:00', 'b9c4d1e6', false);

INSERT INTO enrollments (student_id, classroom_id) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000010'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000012');

INSERT INTO attendance (student_id, classroom_id, check_in_time, status) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000010', '07:03', 'present'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', '07:05', 'present'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010', '07:07', 'present'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000010', '07:12', 'present'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000010', '07:14', 'present'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000010', '07:18', 'present'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000010', '07:21', 'present'),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000010', '07:26', 'present');
