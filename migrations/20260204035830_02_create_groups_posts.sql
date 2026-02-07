/*
  # Groups, Posts, and Social Features
*/

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text DEFAULT 'group',
  image_url text,
  leader_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  ministry_id uuid REFERENCES ministries(id),
  is_private boolean DEFAULT false,
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public groups"
  ON groups FOR SELECT
  TO authenticated
  USING (is_private = false);

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text DEFAULT 'text',
  media_url text,
  scripture_ref text,
  poll_options jsonb,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  ministry_id uuid REFERENCES ministries(id),
  is_pinned boolean DEFAULT false,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_private_view_policy') THEN
    CREATE POLICY "Users can view private groups they're in"
      ON groups FOR SELECT
      TO authenticated
      USING (
        is_private = false OR
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_id = groups.id
          AND user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_members_view_policy') THEN
    CREATE POLICY "Users can view group members in groups they're in"
      ON group_members FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_view_policy') THEN
    CREATE POLICY "Users can view church-wide posts"
      ON posts FOR SELECT
      TO authenticated
      USING (group_id IS NULL);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_group_view_policy') THEN
    CREATE POLICY "Users can view group posts they're in"
      ON posts FOR SELECT
      TO authenticated
      USING (
        group_id IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM group_members
          WHERE group_id = posts.group_id
          AND user_id = auth.uid()
        )
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_create_policy') THEN
    CREATE POLICY "Users can create posts"
      ON posts FOR INSERT
      TO authenticated
      WITH CHECK (author_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_update_policy') THEN
    CREATE POLICY "Users can update own posts"
      ON posts FOR UPDATE
      TO authenticated
      USING (author_id = auth.uid())
      WITH CHECK (author_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_delete_policy') THEN
    CREATE POLICY "Users can delete own posts"
      ON posts FOR DELETE
      TO authenticated
      USING (author_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_view_policy') THEN
    CREATE POLICY "Users can view comments on visible posts"
      ON comments FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM posts
          WHERE posts.id = comments.post_id
          AND (
            posts.group_id IS NULL OR
            EXISTS (
              SELECT 1 FROM group_members
              WHERE group_id = posts.group_id
              AND user_id = auth.uid()
            )
          )
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_create_policy') THEN
    CREATE POLICY "Users can create comments"
      ON comments FOR INSERT
      TO authenticated
      WITH CHECK (author_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_delete_policy') THEN
    CREATE POLICY "Users can delete own comments"
      ON comments FOR DELETE
      TO authenticated
      USING (author_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_create_policy') THEN
    CREATE POLICY "Users can like posts they can see"
      ON post_likes FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_view_policy') THEN
    CREATE POLICY "Users can view likes"
      ON post_likes FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_saves_create_policy') THEN
    CREATE POLICY "Users can save posts"
      ON post_saves FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_saves_view_policy') THEN
    CREATE POLICY "Users can view own saves"
      ON post_saves FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);