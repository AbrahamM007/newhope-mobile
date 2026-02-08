/*
  # Enhance Chat System

  1. Updates to conversations table
    - Add title, description, icon_type fields
    - Add last_message_id reference
    - Add is_archived flag

  2. New Table
    - `chat_settings` - User notification preferences

  3. New Table
    - `message_reads` - Read receipts for DMs

  4. Security
    - RLS for chat_settings
    - RLS for message_reads
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'title'
  ) THEN
    ALTER TABLE conversations ADD COLUMN title text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'description'
  ) THEN
    ALTER TABLE conversations ADD COLUMN description text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'icon_type'
  ) THEN
    ALTER TABLE conversations ADD COLUMN icon_type text DEFAULT 'user';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'last_message_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE conversations ADD COLUMN is_archived boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversation_participants' AND column_name = 'is_muted'
  ) THEN
    ALTER TABLE conversation_participants ADD COLUMN is_muted boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'mentions'
  ) THEN
    ALTER TABLE messages ADD COLUMN mentions text[] DEFAULT '{}';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS chat_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notify_dms boolean DEFAULT true,
  notify_groups boolean DEFAULT true,
  notify_services boolean DEFAULT true,
  notify_announcements boolean DEFAULT true,
  notify_prayer boolean DEFAULT true,
  notify_events boolean DEFAULT true,
  dm_read_receipts boolean DEFAULT false,
  mute_all_notifications boolean DEFAULT false,
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start text DEFAULT '22:00',
  quiet_hours_end text DEFAULT '08:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat settings" ON chat_settings;
DROP POLICY IF EXISTS "Users can update own chat settings" ON chat_settings;
DROP POLICY IF EXISTS "Users can insert own chat settings" ON chat_settings;

CREATE POLICY "Users can view own chat settings"
  ON chat_settings FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own chat settings"
  ON chat_settings FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own chat settings"
  ON chat_settings FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  reader_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, reader_id)
);

ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view read receipts for their messages" ON message_reads;

CREATE POLICY "Users can view read receipts for their messages"
  ON message_reads FOR SELECT TO authenticated
  USING (
    reader_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()) OR
    message_id IN (
      SELECT id FROM messages
      WHERE sender_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_chat_settings_user ON chat_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_reader ON message_reads(reader_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
