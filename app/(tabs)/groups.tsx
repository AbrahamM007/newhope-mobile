import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Lock, Lock2, LogIn, Send, Plus, X, MessageSquare, Shield, Zap } from 'lucide-react-native';
import theme from '@/lib/theme';
import { supabaseService } from '@/lib/supabase-service';
import { useAuth } from '@/context/AuthContext';

interface Group {
  id: string;
  name: string;
  description: string;
  is_core_group: boolean;
  group_type_category: string;
  join_policy: string;
  visibility_scope: string;
  members?: Array<{ count?: number }>;
  userRole?: string;
}

const TABS = ['My Groups', 'Ministry Teams', 'Open Groups'];

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('My Groups');
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [coreGroups, setCoreGroups] = useState<Group[]>([]);
  const [openGroups, setOpenGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      const [myGroupsData, coreGroupsData, openGroupsData] = await Promise.all([
        supabaseService.groups.getMyGroups().catch(() => []),
        supabaseService.groups.getCoreGroups().catch(() => []),
        supabaseService.groups.getOpenGroups().catch(() => []),
      ]);

      setMyGroups(myGroupsData || []);
      setCoreGroups(coreGroupsData || []);
      setOpenGroups(openGroupsData || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  }, [loadGroups]);

  const handleRequestAccess = async () => {
    if (!selectedGroup) return;

    setSubmitting(true);
    try {
      await supabaseService.groups.requestJoin(
        selectedGroup.id,
        'serve',
        requestMessage
      );
      Alert.alert('Success', 'Your request has been sent to the leaders!');
      setShowRequestModal(false);
      setRequestMessage('');
      setSelectedGroup(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminAccess = () => {
    router.push('/groups/admin');
  };

  const getMemberCount = (group: Group) => {
    if (Array.isArray(group.members)) {
      return group.members.reduce((sum, m: any) => sum + (m.count || 0), 0);
    }
    return 0;
  };

  const renderCoreGroupCard = ({ item }: { item: Group }) => {
    const isJoined = myGroups.some(g => g.id === item.id);
    const memberCount = getMemberCount(item);

    return (
      <View style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={[styles.groupIcon, { backgroundColor: '#fef3c7' }]}>
            <Shield size={20} color="#92400e" />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupDesc} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
        </View>

        <View style={styles.groupFooter}>
          <View style={styles.groupMeta}>
            <View style={styles.metaItem}>
              <Users size={14} color={theme.colors.gray500} />
              <Text style={styles.metaText}>{memberCount}</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: '#DBEAFE' }]}>
              <Lock size={12} color="#1E40AF" />
              <Text style={[styles.metaBadgeText, { color: '#1E40AF' }]}>Invite</Text>
            </View>
          </View>

          {isJoined ? (
            <TouchableOpacity
              style={styles.joinedButton}
              onPress={() => router.push(`/groups/${item.id}`)}
            >
              <MessageSquare size={14} color={theme.colors.brandGreen} />
              <Text style={styles.joinedButtonText}>View</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => {
                setSelectedGroup(item);
                setShowRequestModal(true);
              }}
            >
              <Send size={14} color="#9ca3af" />
              <Text style={styles.requestButtonText}>Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderOpenGroupCard = ({ item }: { item: Group }) => {
    const isJoined = myGroups.some(g => g.id === item.id);
    const memberCount = getMemberCount(item);

    return (
      <View style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={[styles.groupIcon, { backgroundColor: '#ccfbf1' }]}>
            <Users size={20} color="#115e59" />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupDesc} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
        </View>

        <View style={styles.groupFooter}>
          <View style={styles.groupMeta}>
            <View style={styles.metaItem}>
              <Users size={14} color={theme.colors.gray500} />
              <Text style={styles.metaText}>{memberCount}</Text>
            </View>
            {item.join_policy === 'OPEN' && (
              <View style={[styles.metaBadge, { backgroundColor: '#dcfce7' }]}>
                <Zap size={12} color="#166534" />
                <Text style={[styles.metaBadgeText, { color: '#166534' }]}>Open</Text>
              </View>
            )}
            {item.join_policy === 'REQUEST_TO_JOIN' && (
              <View style={[styles.metaBadge, { backgroundColor: '#fef3c7' }]}>
                <MessageSquare size={12} color="#92400e" />
                <Text style={[styles.metaBadgeText, { color: '#92400e' }]}>Request</Text>
              </View>
            )}
          </View>

          {isJoined ? (
            <TouchableOpacity
              style={styles.joinedButton}
              onPress={() => router.push(`/groups/${item.id}`)}
            >
              <MessageSquare size={14} color={theme.colors.brandGreen} />
              <Text style={styles.joinedButtonText}>Open</Text>
            </TouchableOpacity>
          ) : item.join_policy === 'OPEN' ? (
            <TouchableOpacity
              style={styles.quickJoinButton}
              onPress={async () => {
                try {
                  await supabaseService.groups.join(item.id);
                  Alert.alert('Success', 'You joined the group!');
                  await loadGroups();
                } catch (error: any) {
                  Alert.alert('Error', error.message || 'Failed to join group');
                }
              }}
            >
              <LogIn size={14} color={theme.colors.brandGreen} />
              <Text style={styles.quickJoinButtonText}>Join</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => {
                setSelectedGroup(item);
                setShowRequestModal(true);
              }}
            >
              <Send size={14} color="#9ca3af" />
              <Text style={styles.requestButtonText}>Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const myGroupsContent = myGroups.length > 0 ? (
    <FlatList
      data={myGroups}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => router.push(`/groups/${item.id}`)}
          activeOpacity={0.7}
        >
          {item.is_core_group ? renderCoreGroupCard({ item }) : renderOpenGroupCard({ item })}
        </TouchableOpacity>
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      scrollEnabled
    />
  ) : (
    <View style={styles.emptyContainer}>
      <Users size={48} color={theme.colors.gray300} />
      <Text style={styles.emptyTitle}>No Groups Yet</Text>
      <Text style={styles.emptyText}>
        Join a group to connect with others or get involved in ministry
      </Text>
    </View>
  );

  const ministryTeamsContent = coreGroups.length > 0 ? (
    <FlatList
      data={coreGroups}
      renderItem={renderCoreGroupCard}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      scrollEnabled
    />
  ) : (
    <View style={styles.emptyContainer}>
      <Shield size={48} color={theme.colors.gray300} />
      <Text style={styles.emptyTitle}>No Ministry Teams</Text>
      <Text style={styles.emptyText}>
        Ministry teams are invite-only. Contact a leader to request access.
      </Text>
    </View>
  );

  const openGroupsContent = openGroups.length > 0 ? (
    <FlatList
      data={openGroups}
      renderItem={renderOpenGroupCard}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContent}
      scrollEnabled
    />
  ) : (
    <View style={styles.emptyContainer}>
      <Users size={48} color={theme.colors.gray300} />
      <Text style={styles.emptyTitle}>No Open Groups</Text>
      <Text style={styles.emptyText}>
        Check back soon for community and open groups
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Groups</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.brandGreen} />
        </View>
      </SafeAreaView>
    );
  }

  const currentContent = activeTab === 'My Groups' ? myGroupsContent : activeTab === 'Ministry Teams' ? ministryTeamsContent : openGroupsContent;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Groups</Text>
            <TouchableOpacity
              onPress={handleAdminAccess}
              style={styles.adminButton}
            >
              <Shield size={16} color={theme.colors.brandGreen} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
          scrollEnabled
        >
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.content}>
          {currentContent}
        </View>
      </SafeAreaView>

      <Modal visible={showRequestModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Request to Join</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.groupPreview}>
                <View style={[styles.previewIcon, { backgroundColor: '#fef3c7' }]}>
                  <Shield size={24} color="#92400e" />
                </View>
                <Text style={styles.previewName}>{selectedGroup?.name}</Text>
                <Text style={styles.previewDesc}>
                  {selectedGroup?.description}
                </Text>
              </View>

              <Text style={styles.label}>Tell us why you'd like to join</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Share your interest, experience, or availability..."
                placeholderTextColor={theme.colors.gray400}
                multiline
                value={requestMessage}
                onChangeText={setRequestMessage}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {requestMessage.length}/500
              </Text>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  A group leader will review your request and get back to you soon.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, (!requestMessage.trim() || submitting) && styles.submitButtonDisabled]}
                disabled={!requestMessage.trim() || submitting}
                onPress={handleRequestAccess}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Send size={16} color="#fff" />
                    <Text style={styles.submitButtonText}>Send Request</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
  },
  tabActive: {
    backgroundColor: theme.colors.brandGreen,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gray600,
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  groupCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.gray100,
  },
  groupHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  groupDesc: {
    fontSize: 13,
    color: theme.colors.gray500,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.gray600,
    marginLeft: 4,
    fontWeight: '500',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  joinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
  },
  joinedButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.brandGreen,
    marginLeft: 4,
  },
  quickJoinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
  },
  quickJoinButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.brandGreen,
    marginLeft: 4,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.gray100,
    borderRadius: 6,
  },
  requestButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.gray600,
    marginLeft: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#fff',
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
  placeholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  groupPreview: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  previewDesc: {
    fontSize: 13,
    color: theme.colors.gray600,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    marginTop: 20,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 4,
    textAlign: 'right',
  },
  infoBox: {
    backgroundColor: theme.colors.gray50,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.gray600,
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.brandGreen,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});
