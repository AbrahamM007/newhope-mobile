import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Users, Plus, Edit, Trash2, Search, X, CheckCircle, Shield } from 'lucide-react-native';
import theme from '@/lib/theme';
import { supabaseService } from '@/lib/supabase-service';

interface GroupWithCount {
  id: string;
  name: string;
  description: string;
  is_core_group: boolean;
  join_policy: string;
  members: Array<{ count?: number }>;
}

export default function AdminGroupsScreen() {
  const router = useRouter();
  const [coreGroups, setCoreGroups] = useState<GroupWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupWithCount | null>(null);
  const [showAssignLeaderModal, setShowAssignLeaderModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const loadGroups = useCallback(async () => {
    try {
      const groups = await supabaseService.groups.getCoreGroups();
      setCoreGroups(groups || []);
    } catch (error) {
      console.error('Error loading core groups:', error);
      Alert.alert('Error', 'Failed to load core groups');
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

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setLoadingUsers(true);
    try {
      const results = await supabaseService.profiles.search(query);
      setUsers(results || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleAssignLeader = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      await supabaseService.groups.assignLeader(selectedGroup.id, userId);
      Alert.alert('Success', 'Leader assigned successfully');
      setShowAssignLeaderModal(false);
      setMemberSearch('');
      setUsers([]);
      await loadGroups();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to assign leader');
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      await supabaseService.groups.addMember(selectedGroup.id, userId, 'GROUP_MEMBER');
      Alert.alert('Success', 'Member added successfully');
      setShowAddMemberModal(false);
      setMemberSearch('');
      setUsers([]);
      await loadGroups();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add member');
    }
  };

  const getMemberCount = (group: GroupWithCount) => {
    if (Array.isArray(group.members)) {
      return group.members.reduce((sum, m: any) => sum + (m.count || 0), 0);
    }
    return 0;
  };

  const renderGroupCard = ({ item }: { item: GroupWithCount }) => {
    const memberCount = getMemberCount(item);
    const isSelected = selectedGroup?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.groupCard, isSelected && styles.groupCardSelected]}
        onPress={() => setSelectedGroup(item)}
        activeOpacity={0.7}
      >
        <View style={styles.groupCardHeader}>
          <View style={styles.groupIconContainer}>
            <Shield size={20} color={theme.colors.brandGreen} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupDescription} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
        </View>

        <View style={styles.groupMeta}>
          <View style={styles.memberBadge}>
            <Users size={14} color={theme.colors.text.primary} />
            <Text style={styles.memberCount}>{memberCount} members</Text>
          </View>
          <View style={[styles.policyBadge, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.policyText}>Invite Only</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setMemberSearch('');
                setUsers([]);
                setShowAssignLeaderModal(true);
              }}
            >
              <Shield size={16} color={theme.colors.brandGreen} />
              <Text style={styles.actionButtonText}>Assign Leader</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setMemberSearch('');
                setUsers([]);
                setShowAddMemberModal(true);
              }}
            >
              <Plus size={16} color={theme.colors.brandGreen} />
              <Text style={styles.actionButtonText}>Add Member</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/groups/${item.id}`)}
            >
              <Users size={16} color={theme.colors.brandGreen} />
              <Text style={styles.actionButtonText}>Manage Members</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderUserOption = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userOption}
      onPress={() => {
        if (showAssignLeaderModal) {
          handleAssignLeader(item.id);
        } else {
          handleAddMember(item.id);
        }
      }}
    >
      <View
        style={[
          styles.userAvatar,
          { backgroundColor: theme.colors.brandGreen },
        ]}
      >
        <Text style={styles.userInitials}>
          {item.first_name?.[0]}{item.last_name?.[0]}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.first_name} {item.last_name}
        </Text>
      </View>
      <ChevronRight size={16} color={theme.colors.gray400} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Core Groups</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.brandGreen} />
        </View>
      </SafeAreaView>
    );
  }

  const filteredGroups = coreGroups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Core Groups Management</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={16} color={theme.colors.gray400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor={theme.colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredGroups}
        renderItem={renderGroupCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.brandGreen}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No groups found</Text>
          </View>
        }
      />

      <Modal visible={showAssignLeaderModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAssignLeaderModal(false)}>
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Assign Leader</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.searchContainer}>
              <Search size={16} color={theme.colors.gray400} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor={theme.colors.gray400}
                value={memberSearch}
                onChangeText={(text) => {
                  setMemberSearch(text);
                  searchUsers(text);
                }}
              />
            </View>

            {loadingUsers ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={theme.colors.brandGreen} />
              </View>
            ) : (
              <FlatList
                data={users}
                renderItem={renderUserOption}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.userList}
                ListEmptyComponent={
                  memberSearch.length < 2 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>Type to search for users</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No users found</Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showAddMemberModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Member</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.searchContainer}>
              <Search size={16} color={theme.colors.gray400} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor={theme.colors.gray400}
                value={memberSearch}
                onChangeText={(text) => {
                  setMemberSearch(text);
                  searchUsers(text);
                }}
              />
            </View>

            {loadingUsers ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={theme.colors.brandGreen} />
              </View>
            ) : (
              <FlatList
                data={users}
                renderItem={renderUserOption}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.userList}
                ListEmptyComponent={
                  memberSearch.length < 2 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>Type to search for users</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No users found</Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 14,
    color: theme.colors.brandGreen,
    fontWeight: '600',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.gray50,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  groupCard: {
    backgroundColor: theme.colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  groupCardSelected: {
    borderColor: theme.colors.brandGreen,
    backgroundColor: '#f0fdf4',
  },
  groupCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  groupIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e0f7e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  groupDescription: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.gray200,
    borderRadius: 6,
    marginRight: 8,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  policyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  policyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E40AF',
  },
  actionButtons: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
    paddingTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.brandGreen,
    marginLeft: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.gray500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
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
  userList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  userOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
