/*
  # Worship Team Scheduling Enhancements
  
  ## Summary
  Adds comprehensive worship scheduling and volunteer management:
  - Position definitions for volunteer roles
  - Volunteer serving profiles with qualifications
  - Volunteer availability tracking
  - Blockout dates and constraints
  - Serving request workflow
  - Setlist management (enhanced)
  - Rehearsal management (enhanced)

  ## New Tables
  1. position_definitions - Volunteer roles (Keys, Drums, etc.)
  2. volunteer_serving_profiles - Volunteer qualifications
  3. volunteer_availability - Weekly schedule availability
  4. volunteer_blockout_dates - Vacation/blackout periods
  5. serving_requests - Request/accept/decline workflow
*/

-- Position Definitions Table
CREATE TABLE IF NOT EXISTS position_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid REFERENCES ministries(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  required_qualifications text[],
  is_critical boolean DEFAULT false,
  display_order integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ministry_id, name)
);

ALTER TABLE position_definitions ENABLE ROW LEVEL SECURITY;

-- Volunteer Serving Profile
CREATE TABLE IF NOT EXISTS volunteer_serving_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  ministry_id uuid REFERENCES ministries(id) ON DELETE CASCADE NOT NULL,
  positions_qualified text[] DEFAULT '{}',
  preferred_positions text[] DEFAULT '{}',
  experience_level text DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  can_attend_rehearsal boolean DEFAULT true,
  max_services_per_month integer DEFAULT 4,
  avoid_back_to_back boolean DEFAULT true,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_break')),
  notes text,
  last_served_at date,
  rotation_weight integer DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE volunteer_serving_profiles ENABLE ROW LEVEL SECURITY;

-- Volunteer Availability
CREATE TABLE IF NOT EXISTS volunteer_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_profile_id uuid REFERENCES volunteer_serving_profiles(id) ON DELETE CASCADE NOT NULL,
  sunday_morning boolean DEFAULT false,
  sunday_evening boolean DEFAULT false,
  wednesday_evening boolean DEFAULT false,
  other_days jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(volunteer_profile_id)
);

ALTER TABLE volunteer_availability ENABLE ROW LEVEL SECURITY;

-- Volunteer Blockout Dates
CREATE TABLE IF NOT EXISTS volunteer_blockout_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_profile_id uuid REFERENCES volunteer_serving_profiles(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE volunteer_blockout_dates ENABLE ROW LEVEL SECURITY;

-- Serving Requests
CREATE TABLE IF NOT EXISTS serving_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_instance_id uuid REFERENCES service_instances(id) ON DELETE CASCADE NOT NULL,
  position_name text NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn', 'completed')),
  requested_by uuid REFERENCES profiles(id),
  requested_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  responded_at timestamptz,
  response_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_instance_id, position_name, user_id)
);

ALTER TABLE serving_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Position Definitions
CREATE POLICY "Team members can view position definitions"
  ON position_definitions FOR SELECT
  TO authenticated
  USING (
    ministry_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN profiles p ON gm.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
  );

-- Volunteer Profiles
CREATE POLICY "Users can view own serving profile"
  ON volunteer_serving_profiles FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR ministry_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN profiles p ON gm.user_id = p.id
      WHERE p.auth_id = auth.uid() AND gm.group_role = 'GROUP_LEADER'
    )
  );

CREATE POLICY "Users can update own profile"
  ON volunteer_serving_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON volunteer_serving_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- Volunteer Availability
CREATE POLICY "Users can view own availability"
  ON volunteer_availability FOR SELECT
  TO authenticated
  USING (
    volunteer_profile_id IN (
      SELECT id FROM volunteer_serving_profiles
      WHERE user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own availability"
  ON volunteer_availability FOR UPDATE
  TO authenticated
  USING (
    volunteer_profile_id IN (
      SELECT id FROM volunteer_serving_profiles
      WHERE user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  )
  WITH CHECK (
    volunteer_profile_id IN (
      SELECT id FROM volunteer_serving_profiles
      WHERE user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own availability"
  ON volunteer_availability FOR INSERT
  TO authenticated
  WITH CHECK (
    volunteer_profile_id IN (
      SELECT id FROM volunteer_serving_profiles
      WHERE user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Blockout Dates
CREATE POLICY "Users can view own blockout dates"
  ON volunteer_blockout_dates FOR SELECT
  TO authenticated
  USING (
    volunteer_profile_id IN (
      SELECT id FROM volunteer_serving_profiles
      WHERE user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own blockout dates"
  ON volunteer_blockout_dates FOR INSERT
  TO authenticated
  WITH CHECK (
    volunteer_profile_id IN (
      SELECT id FROM volunteer_serving_profiles
      WHERE user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete own blockout dates"
  ON volunteer_blockout_dates FOR DELETE
  TO authenticated
  USING (
    volunteer_profile_id IN (
      SELECT id FROM volunteer_serving_profiles
      WHERE user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Serving Requests
CREATE POLICY "Volunteers can view their own requests"
  ON serving_requests FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR service_instance_id IN (
      SELECT id FROM service_instances
      WHERE created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "Volunteers can update their own requests"
  ON serving_requests FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Leaders can create serving requests"
  ON serving_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    service_instance_id IN (
      SELECT id FROM service_instances
      WHERE created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_position_definitions_ministry ON position_definitions(ministry_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_user ON volunteer_serving_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_profiles_ministry ON volunteer_serving_profiles(ministry_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_availability_profile ON volunteer_availability(volunteer_profile_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_blockout_profile ON volunteer_blockout_dates(volunteer_profile_id);
CREATE INDEX IF NOT EXISTS idx_serving_requests_user ON serving_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_serving_requests_status ON serving_requests(status);
CREATE INDEX IF NOT EXISTS idx_serving_requests_service ON serving_requests(service_instance_id);
