-- BSH Inventory: stop users from giving themselves a higher role.
-- Run once in the Supabase SQL editor (project "BSH Inventory").
-- Safe to run more than once.
--
-- Fixes two holes found in the Nov 10, 2026 review (both confirmed on the live database):
--   1. The "Users can update their own profile" policy has no limit on columns,
--      so any signed-in user can set their own profiles.role to 'admin'.
--   2. handle_new_user() copies the role from the signup form's metadata, so
--      anyone who signs up can ask to start as an admin.
--
-- What keeps working:
--   * Admins changing roles on the Admin page (that goes through the server
--     with the service key, which this trigger allows).
--   * The admin invite route (it sets the role with the service key).
--   * Users updating their own name.

-- 1. New signups always start as staff. Admins promote people on the Admin page.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'staff'
  );
  RETURN NEW;
END;
$$;

-- The trigger function should never be callable through the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Block role, id and email changes on profiles unless the change comes from
--    the server (service key / SQL editor) or from a signed-in admin.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND (NEW.role IS DISTINCT FROM OLD.role
          OR NEW.id IS DISTINCT FROM OLD.id
          OR NEW.email IS DISTINCT FROM OLD.email)
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE p.id = auth.uid() AND p.role = 'admin'
     )
  THEN
    RAISE EXCEPTION 'Only an admin can change roles or emails'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- Make the self-update policy also check the row after the change.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Check afterwards: list anyone who is an admin, so you can confirm the list is right.
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE role = 'admin'
ORDER BY created_at;
