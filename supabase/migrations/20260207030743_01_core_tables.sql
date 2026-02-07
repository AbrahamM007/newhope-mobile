/*
  # Core Tables - Users, Campuses, Roles, Ministries, Households

  1. New Tables
    - `campuses` - Church campus locations
    - `profiles` - User profiles linked to auth
    - `roles` - System roles with permissions
    - `user_roles` - User-role assignments
    - `ministries` - Church ministry departments
    - `ministry_members` - Ministry membership
    - `households` - Family groupings
    - `household_members` - Household membership
    - `user_blocks` - User safety blocking

  2. Security
    - RLS enabled on ALL tables
    - Appropriate policies for each table

  3. Seed Data
    - Default roles (guest, member, volunteer, leader, pastor, admin)
*/

CREATE TABLE IF NOT EXISTS campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active campuses"
  ON campuses FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  bio text DEFAULT '',
  avatar_url text,
  campus_id uuid REFERENCES campuses(id),
  date_of_birth date,
  gender text DEFAULT '',
  join_date timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  is_discoverable boolean DEFAULT true,
  notification_preferences jsonb DEFAULT '{}',
  privacy_settings jsonb DEFAULT '{"profile_visible": true, "phone_visible": false, "email_visible": false}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view discoverable profiles"
  ON profiles FOR SELECT TO authenticated
  USING (is_active = true AND (is_discoverable = true OR auth.uid() = auth_id));
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  level integer DEFAULT 0,
  can_moderate boolean DEFAULT false,
  can_create_groups boolean DEFAULT false,
  can_manage_events boolean DEFAULT false,
  can_manage_services boolean DEFAULT false,
  can_manage_giving boolean DEFAULT false,
  can_view_analytics boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  can_post_announcements boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view roles"
  ON roles FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

INSERT INTO roles (name, display_name, level, can_moderate, can_create_groups, can_manage_events, can_manage_services, can_manage_giving, can_view_analytics, can_manage_users, can_post_announcements) VALUES
  ('guest', 'Guest', 0, false, false, false, false, false, false, false, false),
  ('member', 'Member', 1, false, false, false, false, false, false, false, false),
  ('volunteer', 'Volunteer', 2, false, false, false, false, false, false, false, false),
  ('leader', 'Leader', 3, true, true, true, false, false, false, false, false),
  ('pastor', 'Pastor', 4, true, true, true, true, false, true, false, true),
  ('admin', 'Admin', 5, true, true, true, true, true, true, true, true)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN profiles p ON ur.user_id = p.id
      WHERE p.auth_id = auth.uid() AND r.can_manage_users = true
    )
  );

CREATE TABLE IF NOT EXISTS ministries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text,
  campus_id uuid REFERENCES campuses(id),
  leader_id uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active ministries"
  ON ministries FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS ministry_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid REFERENCES ministries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(ministry_id, user_id)
);
ALTER TABLE ministry_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view ministry membership"
  ON ministry_members FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR ministry_id IN (
      SELECT mm2.ministry_id FROM ministry_members mm2
      JOIN profiles p ON mm2.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
  );
CREATE POLICY "Users can join ministries"
  ON ministry_members FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  relationship text DEFAULT 'member',
  is_head boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(household_id, user_id)
);
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own household"
  ON households FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT household_id FROM household_members hm
      JOIN profiles p ON hm.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
  );
CREATE POLICY "Members can view household members"
  ON household_members FOR SELECT TO authenticated
  USING (
    household_id IN (
      SELECT hm2.household_id FROM household_members hm2
      JOIN profiles p ON hm2.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blocks"
  ON user_blocks FOR SELECT TO authenticated
  USING (blocker_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can create blocks"
  ON user_blocks FOR INSERT TO authenticated
  WITH CHECK (blocker_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own blocks"
  ON user_blocks FOR DELETE TO authenticated
  USING (blocker_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE INDEX IF NOT EXISTS idx_profiles_campus_id ON profiles(campus_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_user_id ON ministry_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ministry_members_ministry_id ON ministry_members(ministry_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);