/*
  # Messaging, Events & Service Management Tables

  1. New Tables
    - `conversations` - Chat conversations (DM, group, ministry, team, event, prayer)
    - `conversation_participants` - Conversation membership
    - `messages` - Chat messages with media support
    - `message_reactions` - Message emoji reactions
    - `events` - Church events with RSVP
    - `event_rsvps` - Event RSVP tracking with check-in
    - `songs` - Song library for worship
    - `service_instances` - Individual service instances
    - `team_assignments` - Service team roster with confirm/decline
    - `run_of_show_items` - Service timeline/run-of-show
    - `setlist_songs` - Songs in a service setlist with attachments
    - `rehearsals` - Rehearsal sessions
    - `rehearsal_attendance` - Rehearsal attendance tracking

  2. Security
    - RLS on all tables
    - Messages only visible to conversation participants
    - Events visible based on public setting
    - Services visible to assigned team and creators
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'dm',
  name text DEFAULT '',
  image_url text,
  linked_group_id uuid REFERENCES groups(id),
  linked_event_id uuid,
  linked_service_id uuid,
  is_announcement_only boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  is_muted boolean DEFAULT false,
  last_read_at timestamptz DEFAULT now(),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT TO authenticated
  USING (id IN (
    SELECT conversation_id FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    WHERE p.auth_id = auth.uid()
  ));
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Creators can update conversations"
  ON conversations FOR UPDATE TO authenticated
  USING (created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Participants can view co-participants"
  ON conversation_participants FOR SELECT TO authenticated
  USING (conversation_id IN (
    SELECT cp2.conversation_id FROM conversation_participants cp2
    JOIN profiles p ON cp2.user_id = p.id
    WHERE p.auth_id = auth.uid()
  ));
CREATE POLICY "Users can join conversations"
  ON conversation_participants FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own participation"
  ON conversation_participants FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text DEFAULT '',
  media_url text,
  media_type text,
  reply_to_id uuid REFERENCES messages(id),
  is_pinned boolean DEFAULT false,
  is_prayer boolean DEFAULT false,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT TO authenticated
  USING (conversation_id IN (
    SELECT conversation_id FROM conversation_participants cp
    JOIN profiles p ON cp.user_id = p.id
    WHERE p.auth_id = auth.uid()
  ));
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants cp
      JOIN profiles p ON cp.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE TO authenticated
  USING (sender_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (sender_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL DEFAULT 'heart',
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view message reactions"
  ON message_reactions FOR SELECT TO authenticated
  USING (message_id IN (
    SELECT m.id FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    JOIN profiles p ON cp.user_id = p.id
    WHERE p.auth_id = auth.uid()
  ));
CREATE POLICY "Users can add message reactions"
  ON message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can remove own message reactions"
  ON message_reactions FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  location text DEFAULT '',
  address text DEFAULT '',
  image_url text,
  category text DEFAULT 'general',
  campus_id uuid REFERENCES campuses(id),
  ministry_id uuid REFERENCES ministries(id),
  organizer_id uuid REFERENCES profiles(id),
  group_id uuid REFERENCES groups(id),
  capacity integer,
  is_public boolean DEFAULT true,
  rsvp_enabled boolean DEFAULT true,
  chat_enabled boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  rsvp_count integer DEFAULT 0,
  checkin_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view public events"
  ON events FOR SELECT TO authenticated
  USING (is_active = true AND (is_public = true OR organizer_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())));
CREATE POLICY "Organizers can create events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (organizer_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE TO authenticated
  USING (organizer_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (organizer_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'going',
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view RSVPs for events"
  ON event_rsvps FOR SELECT TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE is_active = true));
CREATE POLICY "Users can RSVP"
  ON event_rsvps FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own RSVP"
  ON event_rsvps FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can cancel own RSVP"
  ON event_rsvps FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text DEFAULT '',
  default_key text DEFAULT '',
  default_bpm integer DEFAULT 0,
  duration text DEFAULT '',
  chord_chart_url text,
  lyrics text DEFAULT '',
  arrangement_notes text DEFAULT '',
  tags jsonb DEFAULT '[]',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view songs"
  ON songs FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create songs"
  ON songs FOR INSERT TO authenticated
  WITH CHECK (created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS service_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  campus_id uuid REFERENCES campuses(id),
  ministry_id uuid REFERENCES ministries(id),
  series_name text DEFAULT '',
  notes text DEFAULT '',
  status text DEFAULT 'draft',
  service_type text DEFAULT 'sunday',
  location text DEFAULT '',
  created_by uuid REFERENCES profiles(id),
  conversation_id uuid REFERENCES conversations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE service_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view own services"
  ON service_instances FOR SELECT TO authenticated
  USING (created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Leaders can create services"
  ON service_instances FOR INSERT TO authenticated
  WITH CHECK (created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Leaders can update services"
  ON service_instances FOR UPDATE TO authenticated
  USING (created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS team_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES service_instances(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT '',
  status text DEFAULT 'pending',
  notes text DEFAULT '',
  assigned_by uuid REFERENCES profiles(id),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, user_id, role)
);
ALTER TABLE team_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assigned users can view assignments"
  ON team_assignments FOR SELECT TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR service_id IN (
      SELECT id FROM service_instances WHERE created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );
CREATE POLICY "Users can update own assignment status"
  ON team_assignments FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Team members can view assigned services"
  ON service_instances FOR SELECT TO authenticated
  USING (id IN (
    SELECT service_id FROM team_assignments ta
    JOIN profiles p ON ta.user_id = p.id
    WHERE p.auth_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS run_of_show_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES service_instances(id) ON DELETE CASCADE NOT NULL,
  item_order integer NOT NULL DEFAULT 0,
  item_type text DEFAULT 'item',
  title text NOT NULL,
  start_time text DEFAULT '',
  duration text DEFAULT '',
  notes text DEFAULT '',
  owner_role text DEFAULT '',
  assignee text DEFAULT '',
  song_id uuid REFERENCES songs(id),
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE run_of_show_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view run of show"
  ON run_of_show_items FOR SELECT TO authenticated
  USING (
    service_id IN (
      SELECT service_id FROM team_assignments ta
      JOIN profiles p ON ta.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
    OR service_id IN (
      SELECT id FROM service_instances WHERE created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE TABLE IF NOT EXISTS setlist_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES service_instances(id) ON DELETE CASCADE NOT NULL,
  song_id uuid REFERENCES songs(id) ON DELETE CASCADE NOT NULL,
  song_order integer DEFAULT 0,
  key text DEFAULT '',
  bpm integer DEFAULT 0,
  notes text DEFAULT '',
  chord_chart_url text,
  lyrics_url text,
  click_track_url text,
  rehearsal_audio_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view setlist"
  ON setlist_songs FOR SELECT TO authenticated
  USING (
    service_id IN (
      SELECT service_id FROM team_assignments ta
      JOIN profiles p ON ta.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
    OR service_id IN (
      SELECT id FROM service_instances WHERE created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE TABLE IF NOT EXISTS rehearsals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES service_instances(id) ON DELETE CASCADE,
  title text NOT NULL,
  date_time timestamptz NOT NULL DEFAULT now(),
  location text DEFAULT '',
  notes text DEFAULT '',
  recording_url text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE rehearsals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view rehearsals"
  ON rehearsals FOR SELECT TO authenticated
  USING (
    created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR service_id IN (
      SELECT service_id FROM team_assignments ta
      JOIN profiles p ON ta.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS rehearsal_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rehearsal_id uuid REFERENCES rehearsals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(rehearsal_id, user_id)
);
ALTER TABLE rehearsal_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rehearsal attendance"
  ON rehearsal_attendance FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can record rehearsal attendance"
  ON rehearsal_attendance FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_campus ON events(campus_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_service_instances_date ON service_instances(date_time);
CREATE INDEX IF NOT EXISTS idx_team_assignments_service ON team_assignments(service_id);
CREATE INDEX IF NOT EXISTS idx_team_assignments_user ON team_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_run_of_show_service ON run_of_show_items(service_id, item_order);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_service ON setlist_songs(service_id, song_order);