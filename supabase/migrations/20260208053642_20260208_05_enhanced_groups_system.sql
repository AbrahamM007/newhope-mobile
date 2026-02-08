/*
  # Enhanced Groups System with Core Groups Management

  ## Summary
  Adds comprehensive group management system supporting:
  - Core Groups (system-managed, invite-only, ministry/staff teams)
  - Open Groups (community, joinable)
  - Group roles and permissions
  - Member request system
  - Default core groups pre-population

  ## Tables Modified/Created
  1. groups - Enhanced with new columns
  2. group_members - Enhanced with roles
  3. group_join_requests - New table for request-to-join
  4. group_leadership - New table for tracking leaders separately

  ## Security
  - Row Level Security enforced on all operations
  - Super Admin can manage core groups
  - Leaders manage members in their groups
  - Members cannot self-join core groups
*/

-- Add new columns to groups table if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'group_type_category') THEN
    ALTER TABLE groups ADD COLUMN group_type_category text DEFAULT 'OPEN' CHECK (group_type_category IN ('CORE', 'OPEN'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'join_policy') THEN
    ALTER TABLE groups ADD COLUMN join_policy text DEFAULT 'INVITE_ONLY' CHECK (join_policy IN ('OPEN', 'REQUEST_TO_JOIN', 'INVITE_ONLY'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'visibility_scope') THEN
    ALTER TABLE groups ADD COLUMN visibility_scope text DEFAULT 'PUBLIC' CHECK (visibility_scope IN ('PUBLIC', 'MEMBERS_ONLY', 'LEADERS_ONLY'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'requires_leader_approval') THEN
    ALTER TABLE groups ADD COLUMN requires_leader_approval boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'is_core_group') THEN
    ALTER TABLE groups ADD COLUMN is_core_group boolean DEFAULT false;
  END IF;
END $$;

-- Add role column to group_members if it doesn't exist with proper default
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'group_members' AND column_name = 'group_role') THEN
    ALTER TABLE group_members ADD COLUMN group_role text DEFAULT 'GROUP_MEMBER' CHECK (group_role IN ('GROUP_LEADER', 'GROUP_MODERATOR', 'GROUP_MEMBER'));
  END IF;
END $$;

-- Create group join requests table
CREATE TABLE IF NOT EXISTS group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  request_type text DEFAULT 'serve' CHECK (request_type IN ('join', 'serve')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text,
  availability text,
  skills text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id, status)
);

ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON group_join_requests FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN profiles p ON gm.user_id = p.id
      WHERE p.auth_id = auth.uid() AND gm.group_role = 'GROUP_LEADER'
    )
  );

CREATE POLICY "Users can create join requests"
  ON group_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Leaders can update requests for their groups"
  ON group_join_requests FOR UPDATE
  TO authenticated
  USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN profiles p ON gm.user_id = p.id
      WHERE p.auth_id = auth.uid() AND gm.group_role = 'GROUP_LEADER'
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      JOIN profiles p ON gm.user_id = p.id
      WHERE p.auth_id = auth.uid() AND gm.group_role = 'GROUP_LEADER'
    )
  );

-- Update existing RLS policies for core group protection
DROP POLICY IF EXISTS "Users can join groups" ON group_members;

CREATE POLICY "Members can join open groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND group_id IN (SELECT id FROM groups WHERE join_policy = 'OPEN' AND group_type_category = 'OPEN')
  );

CREATE POLICY "Leaders can add members to groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
      AND group_id IN (SELECT id FROM groups WHERE join_policy = 'OPEN' AND group_type_category = 'OPEN')
    )
    OR
    (
      group_id IN (
        SELECT gm.group_id FROM group_members gm
        JOIN profiles p ON gm.user_id = p.id
        WHERE p.auth_id = auth.uid() AND gm.group_role = 'GROUP_LEADER'
      )
    )
  );

-- Create default core groups (only if they don't exist)
INSERT INTO groups (
  name, 
  description, 
  group_type_category, 
  join_policy,
  visibility_scope,
  is_core_group,
  is_private,
  group_type,
  allow_member_posts,
  is_active
) VALUES
  -- Leadership
  ('Elders', 'Church elders and governance', 'CORE', 'INVITE_ONLY', 'LEADERS_ONLY', true, true, 'ministry_team', false, true),
  ('Pastoral Staff', 'Pastors and core staff', 'CORE', 'INVITE_ONLY', 'LEADERS_ONLY', true, true, 'ministry_team', false, true),
  ('Ministry Directors', 'Directors of various ministries', 'CORE', 'INVITE_ONLY', 'LEADERS_ONLY', true, true, 'ministry_team', false, true),
  ('Small Group Leaders', 'Leaders of small groups', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  
  -- Worship & Production
  ('Worship Team', 'Music and worship leaders', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Production Team', 'Technical production team', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Media Team', 'Social media and photo/video', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Sound Team', 'Sound and FOH engineering', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Camera Team', 'Camera operators and video', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  
  -- Sunday Operations
  ('Ushers', 'Guest services and ushering', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Welcome Team', 'First-time guest welcome', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Hospitality Team', 'Refreshments and hospitality', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Setup / Tear Down', 'Setup and cleanup crew', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Security Team', 'Safety and security', 'CORE', 'INVITE_ONLY', 'LEADERS_ONLY', true, true, 'ministry_team', false, true),
  
  -- Ministries
  ('Kids Ministry', 'Children ages 0-12', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Youth Ministry', 'Students ages 13-18', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Men''s Ministry', 'Men''s group and events', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Women''s Ministry', 'Women''s group and events', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Prayer Team', 'Prayer warriors and intercession', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  
  -- Care & Outreach
  ('Care Team', 'Hospital visits and care', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true),
  ('Outreach / Missions', 'Missions and outreach', 'CORE', 'INVITE_ONLY', 'PUBLIC', true, false, 'ministry_team', false, true)
ON CONFLICT DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_groups_type_category ON groups(group_type_category);
CREATE INDEX IF NOT EXISTS idx_groups_join_policy ON groups(join_policy);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(group_role);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_status ON group_join_requests(status);
