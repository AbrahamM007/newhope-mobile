/*
  # Prayer, Giving, Media, Announcements & Training Tables

  1. New Tables
    - `prayer_requests` - Prayer requests with privacy levels
    - `prayer_updates` - Updates/praise reports on prayer requests
    - `prayer_interactions` - "I prayed" tracking
    - `prayer_circles` - Prayer groups
    - `prayer_circle_members` - Prayer circle membership
    - `giving_campaigns` - Giving campaigns with goals/progress
    - `giving_transactions` - Individual giving records
    - `media_series` - Sermon/media series groupings
    - `media_content` - Sermons, devotionals, teaching content
    - `media_bookmarks` - User bookmarks on media
    - `media_notes` - User notes on media
    - `announcements` - Official church announcements
    - `announcement_acknowledgments` - Read confirmations
    - `notifications` - User notifications
    - `push_tokens` - Push notification device tokens
    - `training_modules` - Ministry training content
    - `training_completions` - Training progress tracking

  2. Security
    - RLS on all tables
    - Prayer requests respect privacy/scope
    - Giving records only visible to owner
    - Notifications only visible to recipient
*/

CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL DEFAULT '',
  category text DEFAULT 'general',
  scope text DEFAULT 'PUBLIC_CHURCH',
  scope_id uuid,
  is_anonymous boolean DEFAULT false,
  is_urgent boolean DEFAULT false,
  status text DEFAULT 'active',
  prayed_count integer DEFAULT 0,
  group_id uuid REFERENCES groups(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view public prayer requests"
  ON prayer_requests FOR SELECT TO authenticated
  USING (scope = 'PUBLIC_CHURCH' AND status = 'active');
CREATE POLICY "Users can view own prayer requests"
  ON prayer_requests FOR SELECT TO authenticated
  USING (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can create prayer requests"
  ON prayer_requests FOR INSERT TO authenticated
  WITH CHECK (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own prayer requests"
  ON prayer_requests FOR UPDATE TO authenticated
  USING (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS prayer_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id uuid REFERENCES prayer_requests(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL DEFAULT '',
  update_type text DEFAULT 'update',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE prayer_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view updates on visible prayers"
  ON prayer_updates FOR SELECT TO authenticated
  USING (
    prayer_id IN (SELECT id FROM prayer_requests WHERE scope = 'PUBLIC_CHURCH' AND status = 'active')
    OR author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );
CREATE POLICY "Users can post updates on own prayers"
  ON prayer_updates FOR INSERT TO authenticated
  WITH CHECK (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS prayer_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id uuid REFERENCES prayer_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text DEFAULT 'prayed',
  created_at timestamptz DEFAULT now(),
  UNIQUE(prayer_id, user_id, type)
);
ALTER TABLE prayer_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view prayer interactions"
  ON prayer_interactions FOR SELECT TO authenticated
  USING (prayer_id IN (SELECT id FROM prayer_requests WHERE scope = 'PUBLIC_CHURCH'));
CREATE POLICY "Users can add prayer interactions"
  ON prayer_interactions FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS prayer_circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text,
  created_by uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE prayer_circles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS prayer_circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid REFERENCES prayer_circles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(circle_id, user_id)
);
ALTER TABLE prayer_circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view prayer circles"
  ON prayer_circles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT circle_id FROM prayer_circle_members pcm
      JOIN profiles p ON pcm.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
    OR created_by IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
  );
CREATE POLICY "Members can view circle members"
  ON prayer_circle_members FOR SELECT TO authenticated
  USING (
    circle_id IN (
      SELECT pcm2.circle_id FROM prayer_circle_members pcm2
      JOIN profiles p ON pcm2.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
  );
CREATE POLICY "Users can join circles"
  ON prayer_circle_members FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS giving_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  goal_amount numeric(10,2) DEFAULT 0,
  current_amount numeric(10,2) DEFAULT 0,
  image_url text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE giving_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active campaigns"
  ON giving_campaigns FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS giving_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  campaign_id uuid REFERENCES giving_campaigns(id),
  fund text DEFAULT 'general',
  giving_type text DEFAULT 'one_time',
  is_recurring boolean DEFAULT false,
  recurrence_interval text,
  payment_method text DEFAULT '',
  transaction_ref text DEFAULT '',
  status text DEFAULT 'completed',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE giving_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own giving"
  ON giving_transactions FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can create giving records"
  ON giving_transactions FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS media_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text,
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE media_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active series"
  ON media_series FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS media_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  media_type text DEFAULT 'sermon',
  video_url text,
  audio_url text,
  thumbnail_url text,
  duration integer DEFAULT 0,
  series_id uuid REFERENCES media_series(id),
  speaker_name text DEFAULT '',
  scripture_references jsonb DEFAULT '[]',
  tags jsonb DEFAULT '[]',
  date_recorded date,
  is_livestream boolean DEFAULT false,
  livestream_url text,
  view_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE media_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view published media"
  ON media_content FOR SELECT TO authenticated
  USING (is_published = true);

CREATE TABLE IF NOT EXISTS media_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid REFERENCES media_content(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  timestamp_seconds integer DEFAULT 0,
  label text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(media_id, user_id, timestamp_seconds)
);
ALTER TABLE media_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookmarks"
  ON media_bookmarks FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can create bookmarks"
  ON media_bookmarks FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own bookmarks"
  ON media_bookmarks FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS media_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid REFERENCES media_content(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text DEFAULT '',
  timestamp_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE media_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes"
  ON media_notes FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can create notes"
  ON media_notes FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own notes"
  ON media_notes FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own notes"
  ON media_notes FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  image_url text,
  category text DEFAULT 'church_wide',
  scope text DEFAULT 'PUBLIC_CHURCH',
  scope_id uuid,
  campus_id uuid REFERENCES campuses(id),
  ministry_id uuid REFERENCES ministries(id),
  author_id uuid REFERENCES profiles(id),
  linked_event_id uuid REFERENCES events(id),
  priority text DEFAULT 'normal',
  requires_acknowledgment boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view active announcements"
  ON announcements FOR SELECT TO authenticated
  USING (is_active = true AND published_at <= now());
CREATE POLICY "Authors can create announcements"
  ON announcements FOR INSERT TO authenticated
  WITH CHECK (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS announcement_acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  acknowledged_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);
ALTER TABLE announcement_acknowledgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own acknowledgments"
  ON announcement_acknowledgments FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can acknowledge announcements"
  ON announcement_acknowledgments FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL DEFAULT '',
  body text DEFAULT '',
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  platform text DEFAULT 'web',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tokens"
  ON push_tokens FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can create tokens"
  ON push_tokens FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own tokens"
  ON push_tokens FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid REFERENCES ministries(id),
  title text NOT NULL,
  description text DEFAULT '',
  content_url text,
  content_type text DEFAULT 'video',
  duration_minutes integer DEFAULT 0,
  is_required boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view active training"
  ON training_modules FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS training_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES training_modules(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  score numeric(5,2),
  UNIQUE(module_id, user_id)
);
ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own completions"
  ON training_completions FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can record completions"
  ON training_completions FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_prayer_requests_author ON prayer_requests(author_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_scope ON prayer_requests(scope);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_giving_transactions_user ON giving_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_giving_transactions_date ON giving_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_content_series ON media_content(series_id);
CREATE INDEX IF NOT EXISTS idx_media_content_type ON media_content(media_type);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);