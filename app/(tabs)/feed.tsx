import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { postsAPI } from '@/lib/api';
import { Heart, MessageCircle, Share2, Send, X, Plus } from 'lucide-react-native';
import theme from '@/lib/theme';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  likes: { authorId: string }[];
  comments: any[];
  _count: {
    comments: number;
    likes: number;
  };
}

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postsAPI.getAll();
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    try {
      await postsAPI.like(postId);
      await loadPosts(); // Refresh to get updated like status
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      setCreating(true);
      await postsAPI.create(newPostContent.trim());
      setNewPostContent('');
      setShowCreateModal(false);
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setCreating(false);
    }
  };

  const isLiked = (post: Post) => {
    return post.likes?.some((like) => like.authorId === user?.id);
  };

  const renderPost = ({ item }: { item: Post }) => {
    const liked = isLiked(item);
    const author = item.author;
    const fullName = `${author.firstName} ${author.lastName}`;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            {author.avatar ? (
              <Image source={{ uri: author.avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={['#e5e7eb', '#d1d5db']}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarText}>
                  {author.firstName?.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View>
              <Text style={styles.authorName}>{fullName}</Text>
              <Text style={styles.postTime}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        {item.mediaUrls?.length > 0 && (
          <Image source={{ uri: item.mediaUrls[0] }} style={styles.postImage} />
        )}

        <View style={styles.postFooter}>
          <View style={styles.postStats}>
            <View style={styles.stat}>
              <Heart
                size={16}
                color={liked ? theme.colors.error : theme.colors.text.tertiary}
                fill={liked ? theme.colors.error : 'none'}
              />
              <Text style={styles.statText}>{item._count?.likes || 0}</Text>
            </View>
            <View style={styles.stat}>
              <MessageCircle size={16} color={theme.colors.text.tertiary} />
              <Text style={styles.statText}>{item._count?.comments || 0}</Text>
            </View>
          </View>

          <View style={styles.postActionsDivider} />

          <View style={styles.postActions}>
            <ActionButton
              icon={
                <Heart
                  size={20}
                  color={liked ? theme.colors.error : theme.colors.text.secondary}
                  fill={liked ? theme.colors.error : 'none'}
                />
              }
              label="Like"
              onPress={() => handleLike(item.id)}
            />
            <ActionButton
              icon={<MessageCircle size={20} color={theme.colors.text.secondary} />}
              label="Comment"
              onPress={() => { }}
            />
            <ActionButton
              icon={<Share2 size={20} color={theme.colors.text.secondary} />}
              label="Share"
              onPress={() => { }}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.gray100]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Church Feed</Text>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brandGreen}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubtext}>Be the first to share something!</Text>
              </View>
            ) : null
          }
        />

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fabContainer}
          activeOpacity={0.9}
          onPress={() => setShowCreateModal(true)}
        >
          <LinearGradient
            colors={theme.colors.gradients?.primary || ['#15803d', '#166534']}
            style={styles.fab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Plus size={28} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Create Post Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Create Post</Text>
                <TouchableOpacity
                  style={[styles.postButton, !newPostContent.trim() && styles.postButtonDisabled]}
                  onPress={handleCreatePost}
                  disabled={!newPostContent.trim() || creating}
                >
                  <LinearGradient
                    colors={theme.colors.gradients?.primary || ['#15803d', '#166534']}
                    style={styles.postButtonGradient}
                  >
                    <Send size={16} color="#fff" />
                    <Text style={styles.postButtonText}>Post</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.postInput}
                placeholder="What's on your heart today?"
                placeholderTextColor={theme.colors.gray400}
                multiline
                value={newPostContent}
                onChangeText={setNewPostContent}
                autoFocus
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'transparent',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: theme.colors.text.secondary,
    fontWeight: '700',
    fontSize: 18,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  postTime: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  postContent: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 240,
    borderRadius: theme.borderRadius.lg,
    marginBottom: 12,
  },
  postFooter: {
    marginTop: 4,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  postActionsDivider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginBottom: 8,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    borderRadius: theme.borderRadius.md,
  },
  actionLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    ...theme.shadows.lg,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 350,
    padding: 20,
    ...theme.shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  cancelText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  postButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  postButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postInput: {
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 150,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
});