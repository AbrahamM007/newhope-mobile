import { supabase } from './supabase';

export type ChatType = 'DM' | 'GROUP' | 'SMALL_GROUP' | 'SERVICE';

export interface Conversation {
  id: string;
  type: ChatType;
  title: string;
  description?: string;
  icon_type: string;
  linked_group_id?: string;
  linked_service_id?: string;
  image_url?: string;
  last_message_at?: string;
  created_by?: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  mentions: string[];
  reply_to_id?: string;
  created_at: string;
  edited_at?: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  last_read_at?: string;
  unread_count: number;
  is_muted: boolean;
  joined_at: string;
}

export interface ChatSettings {
  id: string;
  user_id: string;
  notify_dms: boolean;
  notify_groups: boolean;
  notify_services: boolean;
  notify_announcements: boolean;
  notify_prayer: boolean;
  notify_events: boolean;
  dm_read_receipts: boolean;
  mute_all_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

class ChatService {
  async getConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants(unread_count, is_muted, last_read_at)
      `)
      .in('id',
        await this.getUserConversationIds(userId)
      )
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data;
  }

  private async getUserConversationIds(userId: string) {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data as any[])?.map((d: any) => d.conversation_id) || [];
  }

  async getConversationsByType(userId: string, type: ChatType) {
    const conversationIds = await this.getUserConversationIds(userId);

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('type', type)
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data || [];
  }

  async getDMConversations(userId: string) {
    return this.getConversationsByType(userId, 'DM');
  }

  async getGroupConversations(userId: string) {
    const data = await Promise.all([
      this.getConversationsByType(userId, 'GROUP'),
      this.getConversationsByType(userId, 'SMALL_GROUP'),
    ]);
    return [...data[0], ...data[1]];
  }

  async getServiceConversations(userId: string) {
    return this.getConversationsByType(userId, 'SERVICE');
  }

  async createDMConversation(userId1: string, userId2: string) {
    // Check if DM already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('type', 'DM')
      .in('id',
        await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId1)
          .then((r: any) => (r.data as any[])?.map((d: any) => d.conversation_id) || [])
      );

    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    // Create new DM
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: 'DM',
        title: `DM`,
        icon_type: 'user',
        created_by: userId1,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add participants
    await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: userId1 },
        { conversation_id: conversation.id, user_id: userId2 },
      ]);

    return conversation.id;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    mentions: string[] = []
  ) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        mentions,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  }

  async getMessages(conversationId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).reverse();
  }

  async markMessageAsRead(messageId: string, readerId: string) {
    const { error } = await supabase
      .from('message_reads')
      .insert({ message_id: messageId, reader_id: readerId })
      .select();

    if (error && !error.message.includes('duplicate')) throw error;
  }

  async updateChatSettings(userId: string, settings: Partial<ChatSettings>) {
    const { data, error } = await supabase
      .from('chat_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getChatSettings(userId: string): Promise<ChatSettings | null> {
    const { data, error } = await supabase
      .from('chat_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async muteConversation(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ is_muted: true })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async unmuteConversation(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ is_muted: false })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async createServiceChat(serviceInstanceId: string, title: string) {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        type: 'SERVICE',
        title,
        icon_type: 'calendar',
        linked_service_id: serviceInstanceId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addParticipantToConversation(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: conversationId, user_id: userId });

    if (error && !error.message.includes('duplicate')) throw error;
  }

  async removeParticipantFromConversation(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}

export const chatService = new ChatService();
