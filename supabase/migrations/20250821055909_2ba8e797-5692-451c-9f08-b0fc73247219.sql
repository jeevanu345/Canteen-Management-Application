-- Fix the handle_new_user trigger to properly handle empty student_id values
-- Only insert student_id if it's not empty to avoid unique constraint violations

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
    CASE 
      WHEN TRIM(COALESCE(NEW.raw_user_meta_data ->> 'student_id', '')) = '' THEN NULL
      ELSE NEW.raw_user_meta_data ->> 'student_id'
    END
  );
  
  -- If user is staff and canteen info is provided, create canteen
  IF (NEW.raw_user_meta_data ->> 'role') = 'staff' AND 
     (NEW.raw_user_meta_data ->> 'canteen_name') IS NOT NULL AND
     TRIM(NEW.raw_user_meta_data ->> 'canteen_name') != '' THEN
    
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