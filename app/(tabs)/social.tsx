import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Share2, Bookmark, Plus, X, Send, BookOpen, Camera, Type, HandHeart, BarChart3, Flame, Smile } from 'lucide-react-native';
import theme from '@/lib/theme';
import { supabaseService } from '@/lib/supabase-service';
import { useAuth } from '@/context/AuthContext';

const FEED_TABS = ['For You', 'Church'];
const POST_TYPES = [
  { key: 'text', label: 'Text', icon: Type },
  { key: 'photo', label: 'Photo', icon: Camera },
  { key: 'scripture', label: 'Scripture', icon: BookOpen },
  { key: 'testimony', label: 'Testimony', icon: HandHeart },
  { key: 'prayer', label: 'Prayer', icon: Flame },
];

const TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  testimony: { bg: '#FEF3C7', fg: '#92400E' },
  prayer: { bg: '#DBEAFE', fg: '#1E40AF' },
  scripture: { bg: '#CCFBF1', fg: '#115E59' },
  text: { bg: '#F3F4F6', fg: '#4B5563' },
  photo: { bg: '#F3F4F6', fg: '#4B5563' },
};

const REACTION_EMOJIS = ['❤️', '🙌', '😂', '🔥', '🙏'];

const timeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
};

const getAvatarBgColor = (name: string) => {
  const colors = ['#15803d', '#2563eb', '#7c3aed', '#dc2626', '#ea580c', '#0891b2'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function SocialScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('For You');
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [submitting, setSubmitting] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      const [postsData, storiesData] = await Promise.all([
        supabaseService.posts.getFeed(20, 0).catch(() => []),
        supabaseService.stories.getActive().catch(() => []),
      ]);

      setPosts(postsData || []);
      setStories(storiesData || []);
    } catch (error) {
      console.error('Error loading feed:', error);
      Alert.alert('Error', 'Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Post', 'Please write something before posting.');
      return;
    }

    setSubmitting(true);
    try {
      await supabaseService.posts.create(
        content.trim(),
        postType,
        'PUBLIC_CHURCH'
      );

      setContent('');
      setPostType('text');
      setShowModal(false);
      Alert.alert('Success', 'Your post has been shared!');
      await loadFeed();
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReact = async (postId: string, emoji: string) => {
    try {
      await supabaseService.posts.react(postId, emoji);
      setUserReactions(prev => ({
        ...prev,
        [postId]: emoji,
      }));
      setShowReactionPicker(null);
    } catch (error) {
      console.error('Error reacting to post:', error);
      Alert.alert('Error', 'Failed to add reaction. Please try again.');
    }
  };

  const renderStory = ({ item }: { item: any }) => {
    const author = item.author;
    const initials = getInitials(author.first_name, author.last_name);
    const bgColor = getAvatarBgColor(author.first_name);

    return (
      <TouchableOpacity style={styles.storyItem} activeOpacity={0.7}>
        <View
          style={[
            styles.storyAvatar,
            {
              backgroundColor: bgColor,
              borderWidth: 2,
              borderColor: '#15803d',
            },
          ]}
        >
          <Text style={styles.storyInitials}>{initials}</Text>
        </View>
        <Text style={styles.storyName} numberOfLines={1}>
          {author.first_name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPost = ({ item }: { item: any }) => {
    const author = item.author;
    const initials = getInitials(author.first_name, author.last_name);
    const bgColor = getAvatarBgColor(author.first_name);
    const typeColor = TYPE_COLORS[item.post_type] || TYPE_COLORS.text;
    const userReaction = userReactions[item.id];

    return (
      <View style={styles.post}>
        <View style={styles.postHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: bgColor },
            ]}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.authorInfo}>
            <View style={styles.authorRow}>
              <Text style={styles.authorName}>
                {author.first_name} {author.last_name}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
                <Text style={[styles.typeBadgeText, { color: typeColor.fg }]}>
                  {item.post_type}
                </Text>
              </View>
            </View>
            <Text style={styles.timestamp}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        {item.media_url && (
          <Image
            source={{ uri: item.media_url }}
            style={styles.postImage}
            defaultSource={{ uri: 'https://via.placeholder.com/300x200' }}
          />
        )}

        <View style={styles.stats}>
          <Text style={styles.statText}>{item.comment_count || 0} Comments</Text>
          <Text style={styles.statText}>{item.like_count || 0} Reactions</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowReactionPicker(showReactionPicker === item.id ? null : item.id)}
          >
            <Heart
              size={20}
              color={userReaction ? '#DC2626' : theme.colors.gray500}
              fill={userReaction ? '#DC2626' : 'none'}
            />
            <Text style={styles.actionText}>React</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={20} color={theme.colors.gray500} />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Share2 size={20} color={theme.colors.gray500} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.actionButton}>
            <Bookmark size={20} color={theme.colors.gray500} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </View>

        {showReactionPicker === item.id && (
          <View style={styles.reactionPicker}>
            {REACTION_EMOJIS.map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => handleReact(item.id, emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderStoriesHeader = () => (
    <View>
      {stories.length > 0 && (
        <View>
          <View style={styles.storiesHeader}>
            <Flame size={16} color={theme.colors.brandGreen} />
            <Text style={styles.storiesTitle}>Stories</Text>
          </View>
          <FlatList
            data={stories}
            renderItem={renderStory}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContainer}
            scrollEnabled
          />
          <View style={styles.divider} />
        </View>
      )}

      <View style={styles.tabsContainer}>
        {FEED_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Social</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.brandGreen} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Social</Text>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderStoriesHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Smile size={48} color={theme.colors.gray300} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>
                Be the first to share something with your church community!
              </Text>
            </View>
          }
          contentContainerStyle={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.brandGreen}
            />
          }
          scrollEnabled
        />

        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => setShowModal(true)}
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setContent('');
                }}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity
                style={[
                  styles.postButton,
                  (!content.trim() || submitting) && styles.postButtonDisabled,
                ]}
                disabled={!content.trim() || submitting}
                onPress={handleCreatePost}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Send size={16} color="#fff" />
                    <Text style={styles.postButtonText}>Post</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>What's on your heart?</Text>
              <TextInput
                style={styles.input}
                placeholder="Share your thoughts, encouragement, or prayers..."
                placeholderTextColor={theme.colors.gray400}
                multiline
                maxLength={500}
                value={content}
                onChangeText={setContent}
                autoFocus
              />

              <Text style={styles.characterCount}>
                {content.length}/500
              </Text>

              <Text style={styles.label} style={{ marginTop: 20 }}>
                Post Type
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeContainer}
              >
                {POST_TYPES.map(type => {
                  const Icon = type.icon;
                  const isSelected = postType === type.key;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeOption,
                        isSelected && styles.typeOptionSelected,
                      ]}
                      onPress={() => setPostType(type.key)}
                    >
                      <Icon
                        size={20}
                        color={isSelected ? '#fff' : theme.colors.gray600}
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          isSelected && styles.typeOptionTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 Posts are shared with your entire church community. Keep it respectful and uplifting!
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContainer: {
    paddingBottom: 20,
  },
  storiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  storiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 6,
  },
  storiesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  storyName: {
    fontSize: 12,
    color: theme.colors.text.primary,
    width: 56,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    paddingBottom: 8,
    marginRight: 24,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.gray500,
  },
  tabTextActive: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    height: 2,
    backgroundColor: theme.colors.brandGreen,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray100,
  },
  post: {
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  authorInfo: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: theme.colors.gray100,
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginRight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginRight: 12,
  },
  actionText: {
    fontSize: 13,
    color: theme.colors.gray600,
    marginLeft: 4,
  },
  spacer: {
    flex: 1,
  },
  reactionPicker: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
  },
  reactionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.brandGreen,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.gray500,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 280,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.brandGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 4,
    textAlign: 'right',
  },
  typeContainer: {
    marginBottom: 16,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    marginRight: 8,
  },
  typeOptionSelected: {
    backgroundColor: theme.colors.brandGreen,
    borderColor: theme.colors.brandGreen,
  },
  typeOptionText: {
    fontSize: 13,
    color: theme.colors.gray600,
    marginLeft: 6,
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: '#fff',
  },
  infoBox: {
    backgroundColor: theme.colors.gray50,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.gray600,
    lineHeight: 18,
  },
});
