
-- Set the user with this email to role 'staff'
update public.profiles
set role = 'staff'::public.user_role
where user_id = (
  select id
  from auth.users
  where email = 'hari23_s@icloud.com'
);
