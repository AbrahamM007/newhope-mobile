/*
  # Messaging, Events, Prayer, and Giving
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS thread_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

ALTER TABLE thread_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS thread_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view threads they're in"
  ON message_threads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM thread_members
      WHERE thread_id = message_threads.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view thread members in their threads"
  ON thread_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM thread_members tm
      WHERE tm.thread_id = thread_members.thread_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view messages in threads they're in"
  ON thread_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM thread_members
      WHERE thread_id = thread_messages.thread_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to threads they're in"
  ON thread_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM thread_members
      WHERE thread_id = thread_messages.thread_id
      AND user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  organizer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  image_url text,
  capacity integer,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public events"
  ON events FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'attending',
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rsvps"
  ON event_rsvps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can rsvp to events"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS serving_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  ministry_id uuid REFERENCES ministries(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE serving_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view serving roles"
  ON serving_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS serving_commitments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES serving_roles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE serving_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commitments"
  ON serving_commitments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create commitments for themselves"
  ON serving_commitments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  category text DEFAULT 'general',
  is_private boolean DEFAULT false,
  is_urgent boolean DEFAULT false,
  prayed_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON prayer_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public requests"
  ON prayer_requests FOR SELECT
  TO authenticated
  USING (is_private = false);

CREATE POLICY "Users can create requests"
  ON prayer_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS prayer_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id uuid NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text DEFAULT 'prayed',
  created_at timestamptz DEFAULT now(),
  UNIQUE(prayer_id, user_id, action)
);

ALTER TABLE prayer_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prayer responses"
  ON prayer_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can record their prayer"
  ON prayer_responses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS giving_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  giving_type text DEFAULT 'general',
  campaign_name text,
  is_recurring boolean DEFAULT false,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE giving_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own giving"
  ON giving_records FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create giving records"
  ON giving_records FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_type text DEFAULT 'sermon',
  video_url text,
  audio_url text,
  thumbnail_url text,
  duration integer,
  series_name text,
  speaker_name text,
  date_recorded date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view media"
  ON media FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user_id ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_giving_records_user_id ON giving_records(user_id);