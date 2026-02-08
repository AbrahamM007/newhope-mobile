import { supabase } from './supabase';

export const worshipService = {
  // POSITION DEFINITIONS
  positions: {
    getAll: async (ministryId: string) => {
      const { data, error } = await supabase
        .from('position_definitions')
        .select()
        .eq('ministry_id', ministryId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data;
    },

    create: async (ministryId: string, name: string, description?: string, qualifications?: string[]) => {
      const { data, error } = await supabase
        .from('position_definitions')
        .insert({
          ministry_id: ministryId,
          name,
          description,
          required_qualifications: qualifications || [],
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  },

  // VOLUNTEER SERVING PROFILES
  volunteers: {
    getProfile: async (userId: string, ministryId: string) => {
      const { data, error } = await supabase
        .from('volunteer_serving_profiles')
        .select()
        .eq('user_id', userId)
        .eq('ministry_id', ministryId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    createProfile: async (userId: string, ministryId: string) => {
      const { data, error } = await supabase
        .from('volunteer_serving_profiles')
        .insert({
          user_id: userId,
          ministry_id: ministryId,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    updateProfile: async (profileId: string, updates: any) => {
      const { data, error } = await supabase
        .from('volunteer_serving_profiles')
        .update(updates)
        .eq('id', profileId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    getAvailable: async (ministryId: string, serviceDate: string, position?: string) => {
      let query = supabase
        .from('volunteer_serving_profiles')
        .select(`
          *,
          availability:volunteer_availability(*),
          blockouts:volunteer_blockout_dates(*)
        `)
        .eq('ministry_id', ministryId)
        .eq('status', 'active');

      if (position) {
        query = query.contains('positions_qualified', [position]);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by date availability and blockouts
      return (data || []).filter(v => {
        const blockouts = v.blockouts || [];
        const isBlockedOut = blockouts.some((b: any) => {
          const blockStart = new Date(b.start_date);
          const blockEnd = new Date(b.end_date);
          const serviceDay = new Date(serviceDate);
          return serviceDay >= blockStart && serviceDay <= blockEnd;
        });

        return !isBlockedOut;
      });
    },
  },

  // VOLUNTEER AVAILABILITY
  availability: {
    getOrCreate: async (profileId: string) => {
      const { data: existing, error: getError } = await supabase
        .from('volunteer_availability')
        .select()
        .eq('volunteer_profile_id', profileId)
        .maybeSingle();

      if (getError && getError.code !== 'PGRST116') throw getError;

      if (existing) return existing;

      const { data: created, error: createError } = await supabase
        .from('volunteer_availability')
        .insert({
          volunteer_profile_id: profileId,
        })
        .select()
        .maybeSingle();

      if (createError) throw createError;
      return created;
    },

    update: async (profileId: string, availability: any) => {
      const { data, error } = await supabase
        .from('volunteer_availability')
        .upsert({
          volunteer_profile_id: profileId,
          ...availability,
        }, {
          onConflict: 'volunteer_profile_id'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  },

  // BLOCKOUT DATES
  blockout: {
    add: async (profileId: string, startDate: string, endDate: string, reason?: string) => {
      const { data, error } = await supabase
        .from('volunteer_blockout_dates')
        .insert({
          volunteer_profile_id: profileId,
          start_date: startDate,
          end_date: endDate,
          reason,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    getAll: async (profileId: string) => {
      const { data, error } = await supabase
        .from('volunteer_blockout_dates')
        .select()
        .eq('volunteer_profile_id', profileId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    },

    delete: async (blockoutId: string) => {
      const { error } = await supabase
        .from('volunteer_blockout_dates')
        .delete()
        .eq('id', blockoutId);

      if (error) throw error;
    },
  },

  // SERVING REQUESTS
  requests: {
    create: async (
      serviceInstanceId: string,
      positionName: string,
      userId: string,
      requestedByUserId: string,
      expiresAt?: string
    ) => {
      const { data, error } = await supabase
        .from('serving_requests')
        .insert({
          service_instance_id: serviceInstanceId,
          position_name: positionName,
          user_id: userId,
          requested_by: requestedByUserId,
          expires_at: expiresAt,
          status: 'pending',
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    getForService: async (serviceInstanceId: string) => {
      const { data, error } = await supabase
        .from('serving_requests')
        .select(`
          *,
          volunteer:user_id(id, first_name, last_name, avatar_url)
        `)
        .eq('service_instance_id', serviceInstanceId)
        .order('position_name', { ascending: true });

      if (error) throw error;
      return data;
    },

    getForUser: async (userId: string) => {
      const { data, error } = await supabase
        .from('serving_requests')
        .select(`
          *,
          service:service_instance_id(
            id,
            title,
            date_time,
            end_time,
            location
          )
        `)
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    getPending: async (userId: string) => {
      const { data, error } = await supabase
        .from('serving_requests')
        .select(`
          *,
          service:service_instance_id(
            id,
            title,
            date_time
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    respond: async (requestId: string, status: 'accepted' | 'declined', notes?: string) => {
      const { data, error } = await supabase
        .from('serving_requests')
        .update({
          status,
          responded_at: new Date().toISOString(),
          response_notes: notes,
        })
        .eq('id', requestId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    getStats: async (userId: string, ministryId: string, monthStart: string, monthEnd: string) => {
      const { data: requests, error } = await supabase
        .from('serving_requests')
        .select()
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .gte('requested_at', monthStart)
        .lte('requested_at', monthEnd)
        .in('service_instance_id', supabase
          .from('service_instances')
          .select('id')
          .eq('ministry_id', ministryId)
        );

      if (error) throw error;
      return {
        servedCount: requests?.length || 0,
        requests,
      };
    },
  },

  // SERVICE MANAGEMENT
  services: {
    getUpcoming: async (ministryId: string, limit = 20) => {
      const today = new Date().toISOString();

      const { data, error } = await supabase
        .from('service_instances')
        .select()
        .eq('ministry_id', ministryId)
        .gte('date_time', today)
        .order('date_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    },

    getById: async (serviceId: string) => {
      const { data, error } = await supabase
        .from('service_instances')
        .select(`
          *,
          requests:serving_requests(
            *,
            volunteer:user_id(id, first_name, last_name, avatar_url)
          )
        `)
        .eq('id', serviceId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    getScheduleGrid: async (ministryId: string, startDate: string, endDate: string) => {
      const { data, error } = await supabase
        .from('service_instances')
        .select(`
          *,
          requests:serving_requests(
            *,
            volunteer:user_id(id, first_name, last_name)
          )
        `)
        .eq('ministry_id', ministryId)
        .gte('date_time', startDate)
        .lte('date_time', endDate)
        .order('date_time', { ascending: true });

      if (error) throw error;

      // Transform into a grid format
      const grid: { [key: string]: { [key: string]: any } } = {};

      (data || []).forEach(service => {
        const dateKey = new Date(service.date_time).toISOString().split('T')[0];
        if (!grid[dateKey]) grid[dateKey] = {};

        const timeStr = service.date_time.split('T')[1].substring(0, 5);
        grid[dateKey][timeStr] = service;
      });

      return grid;
    },
  },

  // AUTO-SUGGEST (The WOW Feature)
  autoSuggest: {
    getFor: async (serviceInstanceId: string, positionName: string) => {
      const { data: service, error: serviceError } = await supabase
        .from('service_instances')
        .select('ministry_id, date_time')
        .eq('id', serviceInstanceId)
        .maybeSingle();

      if (serviceError) throw serviceError;
      if (!service) throw new Error('Service not found');

      // Get available volunteers for this position
      const { data: volunteers, error: volError } = await supabase
        .from('volunteer_serving_profiles')
        .select(`
          *,
          user:user_id(id, first_name, last_name, avatar_url),
          blockouts:volunteer_blockout_dates(*)
        `)
        .eq('ministry_id', service.ministry_id)
        .eq('status', 'active')
        .contains('positions_qualified', [positionName]);

      if (volError) throw volError;

      // Filter and sort by suggestions
      const suggestions = (volunteers || [])
        .filter(v => {
          // Not blocked out on this date
          const blockouts = v.blockouts || [];
          const serviceDate = new Date(service.date_time).toISOString().split('T')[0];
          return !blockouts.some((b: any) => {
            const blockStart = b.start_date;
            const blockEnd = b.end_date;
            return serviceDate >= blockStart && serviceDate <= blockEnd;
          });
        })
        .sort((a, b) => {
          // Sort by:
          // 1. Least recently served (give others a chance)
          // 2. Rotation weight (higher weight = more likely)
          // 3. Preferred position match

          const lastServedDiff = (new Date(a.last_served_at || 0).getTime()) -
                                 (new Date(b.last_served_at || 0).getTime());

          if (Math.abs(lastServedDiff) > 1000 * 60 * 60 * 24 * 7) { // More than 1 week difference
            return lastServedDiff;
          }

          return b.rotation_weight - a.rotation_weight;
        })
        .slice(0, 5); // Top 5 suggestions

      return suggestions;
    },
  },

  // REHEARSALS
  rehearsals: {
    getFor: async (ministryId: string) => {
      const { data, error } = await supabase
        .from('rehearsals')
        .select()
        .eq('ministry_id', ministryId)
        .order('date_time', { ascending: true });

      if (error) throw error;
      return data;
    },

    create: async (ministryId: string, title: string, dateTime: string, location?: string, notes?: string) => {
      const { data, error } = await supabase
        .from('rehearsals')
        .insert({
          ministry_id: ministryId,
          title,
          date_time: dateTime,
          location,
          notes,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    addAttendee: async (rehearsalId: string, userId: string) => {
      const { data, error } = await supabase
        .from('rehearsal_attendance')
        .upsert({
          rehearsal_id: rehearsalId,
          user_id: userId,
          status: 'pending',
        }, {
          onConflict: 'rehearsal_id,user_id'
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    respondToReheasal: async (rehearsalId: string, userId: string, status: 'confirmed' | 'declined') => {
      const { data, error } = await supabase
        .from('rehearsal_attendance')
        .update({ status })
        .eq('rehearsal_id', rehearsalId)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  },

  // SONGS & SETLISTS
  songs: {
    getAll: async (ministryId: string) => {
      const { data, error } = await supabase
        .from('songs')
        .select()
        .eq('ministry_id', ministryId)
        .order('title', { ascending: true });

      if (error) throw error;
      return data;
    },

    create: async (ministryId: string, title: string, artist?: string, defaultKey?: string, bpm?: number) => {
      const { data, error } = await supabase
        .from('songs')
        .insert({
          ministry_id: ministryId,
          title,
          artist,
          default_key: defaultKey,
          default_bpm: bpm,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    getSetlist: async (serviceInstanceId: string) => {
      const { data, error } = await supabase
        .from('setlist_songs')
        .select(`
          *,
          song:song_id(*)
        `)
        .eq('service_id', serviceInstanceId)
        .order('song_order', { ascending: true });

      if (error) throw error;
      return data;
    },

    addToSetlist: async (serviceInstanceId: string, songId: string, order: number, keyOverride?: string, bpmOverride?: number) => {
      const { data, error } = await supabase
        .from('setlist_songs')
        .insert({
          service_id: serviceInstanceId,
          song_id: songId,
          song_order: order,
          key: keyOverride,
          bpm: bpmOverride,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  },
};
