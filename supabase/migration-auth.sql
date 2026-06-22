-- Migración a Supabase Auth
-- Ejecutar en el SQL Editor de Supabase (una sola vez)

-- 1. Crear tabla profiles vinculada a auth.users
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('professor', 'student')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles visibles para usuarios autenticados"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Cada usuario puede editar su propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Trigger para crear profile automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. Migrar usuarios existentes de public.users a auth.users
-- NOTA: Después de ejecutar esta migración, los usuarios seed tendrán NUEVOS UUIDs.
-- Las tablas que referencian los UUIDs viejos (classrooms, enrollments, attendance)
-- deben actualizarse. Esto se maneja en el paso 5.

-- Insertar en auth.users usando la función del schema auth
-- (requiere que el proyecto tenga confirmación de email deshabilitada)

DO $$
DECLARE
  old_user RECORD;
  new_id uuid;
BEGIN
  FOR old_user IN SELECT * FROM public.users LOOP
    -- Generar nuevo UUID para auth.users
    new_id := gen_random_uuid();

    -- Insertar en auth.users
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at,
      instance_id, aud, role, confirmation_token,
      confirmation_sent_at, recovery_token, is_super_admin
    ) VALUES (
      new_id, old_user.email,
      crypt(old_user.password, gen_salt('bf')),
      now(),
      jsonb_build_object('name', old_user.name, 'role', old_user.role),
      old_user.created_at, now(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      '', now(), '', false
    );

    -- Crear profile
    INSERT INTO profiles (id, name, role)
    VALUES (new_id, old_user.name, old_user.role);

    -- Actualizar FKs en tablas existentes
    UPDATE public.classrooms
    SET professor_id = new_id
    WHERE professor_id = old_user.id;

    UPDATE public.enrollments
    SET student_id = new_id
    WHERE student_id = old_user.id;

    UPDATE public.attendance
    SET student_id = new_id
    WHERE student_id = old_user.id;
  END LOOP;
END $$;

-- 4. Agregar FK constraints (apuntan a profiles para que Supabase joins funcionen)
ALTER TABLE public.classrooms
  DROP CONSTRAINT IF EXISTS classrooms_professor_id_fkey,
  ADD CONSTRAINT classrooms_professor_id_fkey
    FOREIGN KEY (professor_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey,
  ADD CONSTRAINT enrollments_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendance
  DROP CONSTRAINT IF EXISTS attendance_student_id_fkey,
  ADD CONSTRAINT attendance_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 5. Eliminar tablas viejas
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.users;

-- 6. Actualizar índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
