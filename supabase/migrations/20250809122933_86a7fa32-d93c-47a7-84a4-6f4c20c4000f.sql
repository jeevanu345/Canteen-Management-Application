-- 1) Ensure enum type exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('student','staff');
  END IF;
END$$;

-- 2) Make get_user_role explicitly return the schema-qualified enum
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS public.user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$function$;

-- 3) Update handle_new_user to schema-qualify enum casts and stay search_path-safe
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, full_name, mobile_number, role, student_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'student'::public.user_role),
    COALESCE(NEW.raw_user_meta_data ->> 'student_id', '')
  );
  
  -- If user is staff and canteen info is provided, create canteen
  IF (NEW.raw_user_meta_data ->> 'role') = 'staff' AND 
     (NEW.raw_user_meta_data ->> 'canteen_name') IS NOT NULL AND
     (NEW.raw_user_meta_data ->> 'canteen_name') != '' THEN
    
    INSERT INTO public.canteens (
      name, 
      description, 
      location, 
      staff_id, 
      is_active
    )
    VALUES (
      NEW.raw_user_meta_data ->> 'canteen_name',
      COALESCE(NEW.raw_user_meta_data ->> 'canteen_description', ''),
      NEW.raw_user_meta_data ->> 'canteen_location',
      NEW.id,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4) Ensure the trigger exists (idempotent): recreate safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();