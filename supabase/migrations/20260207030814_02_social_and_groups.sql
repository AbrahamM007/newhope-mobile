/*
  # Social & Groups Tables

  1. New Tables
    - `groups` - Small groups and ministry communities
    - `group_members` - Group membership
    - `posts` - Social feed posts (text, photo, video, scripture, testimony, poll, etc.)
    - `comments` - Post comments with threading
    - `post_reactions` - Emoji reactions on posts
    - `post_saves` - Bookmarked posts
    - `stories` - 24-hour expiring story content
    - `story_views` - Story view tracking
    - `story_reactions` - Story emoji reactions

  2. Security
    - RLS on all tables
    - Posts visible based on approval status
    - Groups visible based on privacy setting
    - Stories auto-expire after 24 hours
*/

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  group_type text DEFAULT 'small_group',
  image_url text,
  campus_id uuid REFERENCES campuses(id),
  ministry_id uuid REFERENCES ministries(id),
  leader_id uuid REFERENCES profiles(id),
  is_private boolean DEFAULT false,
  require_approval boolean DEFAULT false,
  allow_member_posts boolean DEFAULT true,
  leader_approval_posts boolean DEFAULT false,
  member_count integer DEFAULT 0,
  meeting_day text DEFAULT '',
  meeting_time text DEFAULT '',
  meeting_location text DEFAULT '',
  power_up text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member',
  status text DEFAULT 'active',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view public groups"
  ON groups FOR SELECT TO authenticated
  USING (is_active = true AND (
    is_private = false
    OR id IN (
      SELECT group_id FROM group_members gm
      JOIN profiles p ON gm.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
  ));
CREATE POLICY "Leaders can create groups"
  ON groups FOR INSERT TO authenticated
  WITH CHECK (leader_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Leaders can update own groups"
  ON groups FOR UPDATE TO authenticated
  USING (leader_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (leader_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Members can view group membership"
  ON group_members FOR SELECT TO authenticated
  USING (
    group_id IN (
      SELECT gm2.group_id FROM group_members gm2
      JOIN profiles p ON gm2.user_id = p.id
      WHERE p.auth_id = auth.uid()
    )
    OR group_id IN (SELECT id FROM groups WHERE is_private = false)
  );
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_type text DEFAULT 'text',
  scope text DEFAULT 'PUBLIC_CHURCH',
  scope_id uuid,
  content text DEFAULT '',
  media_urls jsonb DEFAULT '[]',
  scripture_ref text DEFAULT '',
  poll_options jsonb,
  linked_event_id uuid,
  linked_prayer_id uuid,
  is_pinned boolean DEFAULT false,
  comments_disabled boolean DEFAULT false,
  requires_approval boolean DEFAULT false,
  is_approved boolean DEFAULT true,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view approved posts"
  ON posts FOR SELECT TO authenticated
  USING (is_approved = true);
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT TO authenticated
  WITH CHECK (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE TO authenticated
  USING (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE TO authenticated
  USING (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES comments(id),
  content text NOT NULL DEFAULT '',
  like_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view comments"
  ON comments FOR SELECT TO authenticated
  USING (post_id IN (SELECT id FROM posts WHERE is_approved = true));
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE TO authenticated
  USING (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL DEFAULT 'heart',
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view reactions"
  ON post_reactions FOR SELECT TO authenticated
  USING (post_id IN (SELECT id FROM posts WHERE is_approved = true));
CREATE POLICY "Users can add reactions"
  ON post_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can remove own reactions"
  ON post_reactions FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS post_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saves"
  ON post_saves FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can save posts"
  ON post_saves FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can unsave posts"
  ON post_saves FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scope text DEFAULT 'PUBLIC_CHURCH',
  scope_id uuid,
  media_url text NOT NULL,
  media_type text DEFAULT 'image',
  caption text DEFAULT '',
  expires_at timestamptz NOT NULL,
  is_highlight boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view non-expired stories"
  ON stories FOR SELECT TO authenticated
  USING (expires_at > now() OR is_highlight = true);
CREATE POLICY "Users can create stories"
  ON stories FOR INSERT TO authenticated
  WITH CHECK (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));
CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE TO authenticated
  USING (author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(story_id, user_id)
);
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story authors can view who viewed"
  ON story_views FOR SELECT TO authenticated
  USING (story_id IN (SELECT id FROM stories WHERE author_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid())));
CREATE POLICY "Users can record views"
  ON story_views FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS story_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL DEFAULT 'heart',
  created_at timestamptz DEFAULT now(),
  UNIQUE(story_id, user_id)
);
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view story reactions"
  ON story_reactions FOR SELECT TO authenticated
  USING (story_id IN (SELECT id FROM stories WHERE expires_at > now() OR is_highlight = true));
CREATE POLICY "Users can react to stories"
  ON story_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_groups_campus_id ON groups(campus_id);
CREATE INDEX IF NOT EXISTS idx_groups_ministry_id ON groups(ministry_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_scope ON posts(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);