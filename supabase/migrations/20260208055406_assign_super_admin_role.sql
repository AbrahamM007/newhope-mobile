/*
  # Assign Super Admin Role

  Assigns the 'admin' role to moratadeo007@gmail.com, making them the main super admin
  with full platform permissions including user management, event management, giving,
  analytics, and announcements.

  Changes:
  - Assigns admin role to moratadeo007@gmail.com profile
  - If role assignment already exists, this will be skipped
*/

DO $$
DECLARE
  admin_profile_id uuid;
  admin_role_id uuid;
BEGIN
  -- Get the admin profile ID
  SELECT id INTO admin_profile_id FROM profiles WHERE email = 'moratadeo007@gmail.com';
  
  -- Get the admin role ID
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  -- Only insert if both exist and the assignment doesn't already exist
  IF admin_profile_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (admin_profile_id, admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;
