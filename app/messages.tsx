import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SectionList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Search } from 'lucide-react-native';
import { chatService, Conversation } from '@/lib/chat-service';
import { useAuth } from '@/context/AuthContext';

interface ConversationWithMeta extends Conversation {
  unread_count?: number;
  is_muted?: boolean;
  badge: string;
  section: 'DM' | 'GROUP' | 'SERVICE';
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const [dms, groups, services] = await Promise.all([
        chatService.getDMConversations(user.id),
        chatService.getGroupConversations(user.id),
        chatService.getServiceConversations(user.id),
      ]);

      const withMeta: ConversationWithMeta[] = [
        ...dms.map((c: Conversation) => ({ ...c, section: 'DM' as const, badge: 'DM' })),
        ...groups.map((c: Conversation) => ({
          ...c,
          section: 'GROUP' as const,
          badge: c.type === 'GROUP' ? 'GROUP' : 'SMALL_GROUP',
        })),
        ...services.map((c: Conversation) => ({ ...c, section: 'SERVICE' as const, badge: 'SERVICE' })),
      ];

      setConversations(withMeta);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const groupedData = [
    {
      title: 'Direct Messages',
      data: conversations.filter(c => c.section === 'DM'),
    },
    {
      title: 'Groups',
      data: conversations.filter(c => c.section === 'GROUP'),
    },
    {
      title: 'Upcoming Services',
      data: conversations.filter(c => c.section === 'SERVICE'),
    },
  ].filter(section => section.data.length > 0);

  const renderConversation = ({ item }: { item: ConversationWithMeta }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatarContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MessageCircle color="#fff" size={24} />
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.titleRow}>
          <Text style={styles.conversationTitle}>{item.title}</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>{item.badge}</Text>
          </View>
        </View>
        {item.description && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <Text style={styles.timestamp}>
          {item.last_message_at ? new Date(item.last_message_at).toLocaleDateString() : 'No messages'}
        </Text>
      </View>

      {item.unread_count ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread_count}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <Search color="#0066cc" size={24} />
        </TouchableOpacity>
      </View>

      {groupedData.length === 0 ? (
        <View style={styles.centerContent}>
          <MessageCircle color="#ccc" size={48} />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start a conversation to connect</Text>
        </View>
      ) : (
        <SectionList
          sections={groupedData}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#0066cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadBadge: {
    backgroundColor: '#ff3b30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
