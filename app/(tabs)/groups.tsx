import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Plus, Search, MapPin, Calendar, ChevronRight } from 'lucide-react-native';
import theme from '@/lib/theme';
import { supabaseService } from '@/lib/supabase-service';

const CATEGORIES = ['All', 'Small Groups', 'Ministry', 'Bible Study', 'Youth'];

const badgeColor = (t: string) => {
  if (t === 'ministry') return { bg: '#ecfdf5', fg: theme.colors.brandGreen };
  if (t === 'small_group') return { bg: '#eff6ff', fg: theme.colors.info };
  if (t === 'team') return { bg: '#fffbeb', fg: theme.colors.warning };
  return { bg: theme.colors.gray100, fg: theme.colors.gray500 };
};
const typeLabel = (t: string) => t === 'ministry' ? 'Ministry' : t === 'small_group' ? 'Small Group' : t === 'team' ? 'Team' : t;
const avatarColor = (n: string) => {
  const c = [theme.colors.brandGreen, theme.colors.info, '#8b5cf6', '#ec4899', theme.colors.warning];
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return c[Math.abs(h) % c.length];
};

export default function GroupsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [discover, setDiscover] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [myData, allData] = await Promise.all([
        supabaseService.groups.getMyGroups().catch(() => null),
        supabaseService.groups.getAll(20).catch(() => null),
      ]);
      if (myData) setMyGroups(myData);
      if (allData) setDiscover(allData);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const filtered = discover.filter(g => {
    const ms = !search || g.name.toLowerCase().includes(search.toLowerCase()) || (g.description && g.description.toLowerCase().includes(search.toLowerCase()));
    const mc = category === 'All' || (category === 'Small Groups' && g.type === 'small_group') || (category === 'Ministry' && g.type === 'ministry');
    return ms && mc;
  });

  if (loading) {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.header}><Text style={st.headerTitle}>Groups</Text></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.brandGreen} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.container}>
      <View style={st.header}><Text style={st.headerTitle}>Groups</Text></View>
      <View style={st.tabRow}>
        {(['my', 'discover'] as const).map(t => (
          <TouchableOpacity key={t} style={[st.tab, activeTab === t && st.tabOn]} onPress={() => setActiveTab(t)}>
            <Text style={[st.tabTxt, activeTab === t && st.tabTxtOn]}>{t === 'my' ? 'My Groups' : 'Discover'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {activeTab === 'my' && (myGroups.length === 0 ? (
          <View style={st.empty}>
            <Users size={48} color={theme.colors.gray300} />
            <Text style={st.emptyTitle}>No groups yet</Text>
            <Text style={st.emptySub}>Join a group to connect with your church community</Text>
            <TouchableOpacity style={st.emptyCta} onPress={() => setActiveTab('discover')}><Text style={st.emptyCtaTxt}>Browse Groups</Text></TouchableOpacity>
          </View>
        ) : myGroups.map(g => {
          const bc = badgeColor(g.type);
          return (
            <TouchableOpacity key={g.id} style={st.card} activeOpacity={0.7} onPress={() => router.push(`/groups/${g.id}` as any)}>
              <View style={[st.avatar, { backgroundColor: avatarColor(g.name) }]}><Text style={st.avatarL}>{g.name.charAt(0)}</Text></View>
              <View style={st.info}>
                <View style={st.nameRow}>
                  <Text style={st.name} numberOfLines={1}>{g.name}</Text>
                  <View style={[st.badge, { backgroundColor: bc.bg }]}><Text style={[st.badgeTxt, { color: bc.fg }]}>{typeLabel(g.type)}</Text></View>
                </View>
                <View style={st.meta}><Users size={12} color={theme.colors.gray400} /><Text style={st.metaTxt}>{g.member_count} members</Text></View>
                <View style={st.meetRow}><Calendar size={12} color={theme.colors.gray400} /><Text style={st.meetTxt}>{g.meeting_day}s at {g.meeting_time}</Text></View>
                <View style={st.meetRow}><MapPin size={12} color={theme.colors.gray400} /><Text style={st.meetTxt}>{g.meeting_location}</Text></View>
              </View>
              <ChevronRight size={18} color={theme.colors.gray300} />
            </TouchableOpacity>
          );
        }))}
        {activeTab === 'discover' && (<>
          <View style={st.searchBox}>
            <Search size={18} color={theme.colors.gray400} />
            <TextInput style={st.searchIn} placeholder="Search groups..." placeholderTextColor={theme.colors.gray400} value={search} onChangeText={setSearch} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chips}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[st.chip, category === c && st.chipOn]} onPress={() => setCategory(c)}>
                <Text style={[st.chipTxt, category === c && st.chipTxtOn]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filtered.length === 0 ? (
            <View style={st.empty}><Search size={48} color={theme.colors.gray300} /><Text style={st.emptyTitle}>No groups found</Text><Text style={st.emptySub}>Try a different search or category</Text></View>
          ) : filtered.map(g => {
            const bc = badgeColor(g.type);
            const joined = joinedIds.includes(g.id);
            return (
              <View key={g.id} style={st.dCard}>
                <View style={st.dTop}>
                  <View style={[st.avatar, { backgroundColor: avatarColor(g.name) }]}><Text style={st.avatarL}>{g.name.charAt(0)}</Text></View>
                  <View style={st.dInfo}>
                    <View style={st.nameRow}>
                      <Text style={st.name} numberOfLines={1}>{g.name}</Text>
                      <View style={[st.badge, { backgroundColor: bc.bg }]}><Text style={[st.badgeTxt, { color: bc.fg }]}>{typeLabel(g.type)}</Text></View>
                    </View>
                    <View style={st.meta}><Users size={12} color={theme.colors.gray400} /><Text style={st.metaTxt}>{g.member_count} members</Text></View>
                  </View>
                </View>
                {g.description && <Text style={st.dDesc} numberOfLines={2}>{g.description}</Text>}
                <TouchableOpacity style={[st.joinBtn, joined && st.joinedBtn]} onPress={() => setJoinedIds(p => p.includes(g.id) ? p.filter(x => x !== g.id) : [...p, g.id])}>
                  <Text style={[st.joinTxt, joined && st.joinedTxt]}>{joined ? 'Joined' : 'Join Group'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </>)}
      </ScrollView>
      <TouchableOpacity style={st.fab}><Plus size={24} color={theme.colors.white} /></TouchableOpacity>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.secondary },
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border.light },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.brandDark },
  tabRow: { flexDirection: 'row', backgroundColor: theme.colors.white, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border.light },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  tabOn: { borderBottomWidth: 2, borderBottomColor: theme.colors.brandGreen },
  tabTxt: { fontSize: 14, fontWeight: '500', color: theme.colors.gray500 },
  tabTxtOn: { color: theme.colors.brandGreen, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.gray500, marginTop: 12 },
  emptySub: { fontSize: 13, color: theme.colors.gray400, marginTop: 4, textAlign: 'center' },
  emptyCta: { backgroundColor: theme.colors.brandGreen, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 16 },
  emptyCtaTxt: { color: theme.colors.white, fontWeight: '600', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: 12, padding: 14, marginBottom: 10, ...theme.shadows.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarL: { fontSize: 20, fontWeight: '700', color: theme.colors.white },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.brandDark, flexShrink: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeTxt: { fontSize: 10, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  metaTxt: { fontSize: 12, color: theme.colors.gray500 },
  meetRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  meetTxt: { fontSize: 11, color: theme.colors.gray400 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, ...theme.shadows.xs },
  searchIn: { flex: 1, marginLeft: 10, fontSize: 14, color: theme.colors.brandDark },
  chips: { paddingBottom: 16, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border.medium },
  chipOn: { backgroundColor: theme.colors.brandGreen, borderColor: theme.colors.brandGreen },
  chipTxt: { fontSize: 13, fontWeight: '500', color: theme.colors.gray600 },
  chipTxtOn: { color: theme.colors.white },
  dCard: { backgroundColor: theme.colors.white, borderRadius: 12, padding: 14, marginBottom: 10, ...theme.shadows.sm },
  dTop: { flexDirection: 'row', alignItems: 'center' },
  dInfo: { flex: 1 },
  dDesc: { fontSize: 13, color: theme.colors.gray500, lineHeight: 18, marginTop: 10, marginBottom: 12 },
  joinBtn: { backgroundColor: theme.colors.brandGreen, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  joinedBtn: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: theme.colors.brandGreen },
  joinTxt: { fontSize: 14, fontWeight: '600', color: theme.colors.white },
  joinedTxt: { color: theme.colors.brandGreen },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: theme.colors.brandGreen, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...theme.shadows.md },
});
