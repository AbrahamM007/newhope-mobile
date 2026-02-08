import { supabase } from './supabase';

export const supabaseService = {
  posts: {
    getFeed: async (limit = 10, offset = 0) => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:author_id(id, first_name, last_name, avatar_url),
          comments(count),
          post_reactions(count)
        `)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    },

    create: async (content: string, postType = 'text', scope = 'PUBLIC_CHURCH', mediaUrl?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: profile.id,
          content,
          post_type: postType,
          scope,
          media_url: mediaUrl,
          is_approved: true,
        })
        .select(`
          *,
          author:author_id(id, first_name, last_name, avatar_url)
        `)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    react: async (postId: string, emoji = 'heart') => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('post_reactions')
        .upsert({
          post_id: postId,
          user_id: profile.id,
          emoji,
        }, {
          onConflict: 'post_id,user_id,emoji'
        });

      if (error) throw error;
      return data;
    },

    getReactions: async (postId: string) => {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('emoji, count(*)')
        .eq('post_id', postId)
        .group_by('emoji');

      if (error) throw error;
      return data;
    },
  },

  stories: {
    getActive: async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          author:author_id(id, first_name, last_name, avatar_url)
        `)
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    create: async (mediaUrl: string, caption?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('stories')
        .insert({
          author_id: profile.id,
          media_url: mediaUrl,
          caption,
          expires_at: expiresAt,
        })
        .select(`
          *,
          author:author_id(id, first_name, last_name, avatar_url)
        `)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    reactToStory: async (storyId: string, emoji = '❤️') => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('story_reactions')
        .upsert({
          story_id: storyId,
          user_id: profile.id,
          emoji,
        }, {
          onConflict: 'story_id,user_id'
        });

      if (error) throw error;
      return data;
    },

    viewStory: async (storyId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: profile.id,
        });

      if (error && !error.message.includes('duplicate')) throw error;
    },
  },

  comments: {
    getForPost: async (postId: string) => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:author_id(id, first_name, last_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },

    create: async (postId: string, content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: profile.id,
          content,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  },

  groups: {
    getAll: async (limit = 20) => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          leader:leader_id(id, first_name, last_name),
          members:group_members(count)
        `)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;
      return data;
    },

    getMyGroups: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group:group_id(
            *,
            leader:leader_id(id, first_name, last_name),
            members:group_members(count)
          )
        `)
        .eq('user_id', profile.id);

      if (error) throw error;
      return data?.map(item => item.group) || [];
    },

    getById: async (groupId: string) => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          leader:leader_id(id, first_name, last_name, avatar_url),
          members:group_members(
            *,
            user:user_id(id, first_name, last_name, avatar_url)
          )
        `)
        .eq('id', groupId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    join: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: profile.id,
        });

      if (error) throw error;
    },

    leave: async (groupId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', profile.id);

      if (error) throw error;
    },
  },

  announcements: {
    getAll: async (limit = 10) => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('post_type', 'announcement')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  },

  events: {
    getUpcoming: async (limit = 10) => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('post_type', 'event')
        .eq('is_approved', true)
        .gt('created_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  },

  profiles: {
    getProfile: async (authId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    search: async (query: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .or(`first_name.ilike.%${query}%, last_name.ilike.%${query}%`)
        .eq('is_discoverable', true)
        .limit(10);

      if (error) throw error;
      return data;
    },

    update: async (updates: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  },

  campuses: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  },

  ministries: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('ministries')
        .select(`
          *,
          leader:leader_id(id, first_name, last_name)
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
  },
};

export default supabaseService;
