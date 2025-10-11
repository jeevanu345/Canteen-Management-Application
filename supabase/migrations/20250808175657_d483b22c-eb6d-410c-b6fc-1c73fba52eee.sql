-- Update the handle_new_user function to create canteen for staff during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_canteen_id uuid;
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, full_name, mobile_number, role, student_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), 
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student'::user_role),
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
$$;