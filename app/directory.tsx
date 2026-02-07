import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, MessageCircle, ChevronDown } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { directoryAPI } from '@/lib/api';

const brandGreen = colors.brandGreen;
const brandDark = colors.brandDark;

const AVATAR_COLORS = ['#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4', '#a5b4fc'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

const CAMPUSES = ['All Campuses', 'Main Campus', 'West Campus', 'North Campus'];
const MINISTRIES = ['All Ministries', 'Worship', 'Youth', 'Kids', 'Production', 'Ushers', 'Creative Arts', 'Small Groups'];

export default function DirectoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('All Campuses');
  const [selectedMinistry, setSelectedMinistry] = useState('All Ministries');
  const [showCampusFilter, setShowCampusFilter] = useState(false);
  const [showMinistryFilter, setShowMinistryFilter] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    try {
      const data = await directoryAPI.search().catch(() => null);
      if (data) setMembers(data);
    } catch (_) {} finally { setLoading(false); }
  }, []);
  useEffect(() => { loadMembers(); }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    let membersList = [...members];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      membersList = membersList.filter(
        (m) => m.firstName.toLowerCase().includes(q) || m.lastName.toLowerCase().includes(q)
      );
    }
    if (selectedCampus !== 'All Campuses') {
      membersList = membersList.filter((m) => m.campus === selectedCampus);
    }
    if (selectedMinistry !== 'All Ministries') {
      membersList = membersList.filter((m) => m.ministry === selectedMinistry);
    }
    membersList.sort((a, b) => a.lastName.localeCompare(b.lastName));
    return membersList;
  }, [searchQuery, selectedCampus, selectedMinistry, members]);

  const renderMember = ({ item }: { item: any }) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    const color = getAvatarColor(fullName);
    return (
      <View style={styles.memberRow}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{getInitials(item.firstName, item.lastName)}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{fullName}</Text>
          <View style={styles.memberMeta}>
            <View style={styles.campusBadge}>
              <Text style={styles.campusBadgeText}>{item.campus}</Text>
            </View>
            {item.ministry && <Text style={styles.ministryText}>{item.ministry}</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.messageBtn}>
          <MessageCircle size={20} color={brandGreen} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={brandDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Directory</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchWrap}>
        <Search size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterWrap}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => { setShowCampusFilter(!showCampusFilter); setShowMinistryFilter(false); }}>
            <Text style={styles.filterBtnText} numberOfLines={1}>{selectedCampus}</Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>
          {showCampusFilter && (
            <View style={styles.dropdown}>
              {CAMPUSES.map((c) => (
                <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setSelectedCampus(c); setShowCampusFilter(false); }}>
                  <Text style={[styles.dropdownText, selectedCampus === c && styles.dropdownTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.filterWrap}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => { setShowMinistryFilter(!showMinistryFilter); setShowCampusFilter(false); }}>
            <Text style={styles.filterBtnText} numberOfLines={1}>{selectedMinistry}</Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>
          {showMinistryFilter && (
            <View style={styles.dropdown}>
              {MINISTRIES.map((m) => (
                <TouchableOpacity key={m} style={styles.dropdownItem} onPress={() => { setSelectedMinistry(m); setShowMinistryFilter(false); }}>
                  <Text style={[styles.dropdownText, selectedMinistry === m && styles.dropdownTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredMembers}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <Text style={styles.privacyNotice}>Only showing members who have opted into the directory</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: brandDark },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#f3f4f6', borderRadius: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: brandDark },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, marginBottom: 8, gap: 10, zIndex: 10 },
  filterWrap: { flex: 1, position: 'relative', zIndex: 10 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  filterBtnText: { fontSize: 13, fontWeight: '500', color: '#444', flex: 1, marginRight: 4 },
  dropdown: { position: 'absolute', top: 44, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8, zIndex: 100 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  dropdownText: { fontSize: 14, color: '#444' },
  dropdownTextActive: { color: brandGreen, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: '600', color: brandDark },
  memberMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  campusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: '#f3f4f6' },
  campusBadgeText: { fontSize: 11, fontWeight: '500', color: '#666' },
  ministryText: { fontSize: 12, color: brandGreen, fontWeight: '500' },
  messageBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  privacyNotice: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20, marginBottom: 20 },
});
