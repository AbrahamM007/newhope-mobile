import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, ScrollView, Modal, Switch, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Hand, X, AlertTriangle, MessageSquare, Globe, Lock, Users, Eye } from 'lucide-react-native';
import { prayerAPI } from '@/lib/api';

const brandGreen = '#15803d';
const brandDark = '#1a1a1a';

const TABS = ['All Requests', 'My Prayers', 'Urgent', 'Praise Reports'];
const PRAYER_CATEGORIES = ['Health', 'Family', 'Work', 'Spiritual', 'Other'];
const PRIVACY_OPTIONS = [
  { label: 'Public Church', icon: Globe, value: 'public' },
  { label: 'Group Only', icon: Users, value: 'group' },
  { label: 'Private', icon: Lock, value: 'private' },
];
const CAT_COLORS: Record<string, string> = { health: '#dc2626', family: '#7c3aed', work: '#2563eb', spiritual: '#0891b2', praise: '#d97706', other: '#6b7280' };

const getInitials = (name: string) => {
  if (name === 'Anonymous') return '?';
  const p = name.split(' ');
  return p.length > 1 ? `${p[0][0]}${p[1][0]}` : p[0][0];
};

const getTimeAgo = (dateStr: string) => {
  const h = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (h < 1) return 'Just now';
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

export default function PrayerScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All Requests');
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prayedIds, setPrayedIds] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Health');
  const [newPrivacy, setNewPrivacy] = useState('public');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  const loadPrayers = useCallback(async () => {
    try {
      const data = await prayerAPI.getAll().catch(() => null);
      if (data) setPrayers(data);
    } catch (_) {} finally { setLoading(false); }
  }, []);
  useEffect(() => { loadPrayers(); }, [loadPrayers]);

  const totalPraying = prayers.reduce((s, p) => s + p.prayed_count, 0);
  const filteredPrayers = prayers.filter((p) => {
    if (activeTab === 'My Prayers') return prayedIds.includes(p.id);
    if (activeTab === 'Urgent') return p.is_urgent;
    if (activeTab === 'Praise Reports') return p.category === 'praise';
    return true;
  });

  const handlePrayed = (id: string) => {
    if (prayedIds.includes(id)) return;
    setPrayedIds((prev) => [...prev, id]);
    setPrayers((prev) => prev.map((p) => (p.id === id ? { ...p, prayed_count: p.prayed_count + 1 } : p)));
  };

  const handleSubmit = async () => {
    if (!newContent.trim()) return;
    try {
      await prayerAPI.create({ content: newContent.trim(), category: newCategory.toLowerCase(), isAnonymous, isUrgent, privacy: newPrivacy });
    } catch (_) {}
    setPrayers((prev) => [{ id: String(Date.now()), author: isAnonymous ? 'Anonymous' : 'You', content: newContent.trim(), category: newCategory.toLowerCase(), is_urgent: isUrgent, is_anonymous: isAnonymous, prayed_count: 0, updates: 0, created_at: new Date().toISOString() }, ...prev]);
    setNewContent(''); setNewCategory('Health'); setNewPrivacy('public'); setIsAnonymous(false); setIsUrgent(false); setModalVisible(false);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={24} color={brandDark} /></TouchableOpacity>
        <Text style={s.headerTitle}>Prayer & Care</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => setModalVisible(true)}><Plus size={22} color={brandGreen} /></TouchableOpacity>
      </View>
      <View style={s.statsBanner}>
        <Text style={s.statsText}>{totalPraying} people praying</Text>
        <View style={s.statsDot} />
        <Text style={s.statsText}>{prayers.length} requests this week</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsWrap} contentContainerStyle={s.tabsInner}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} style={[s.tabChip, activeTab === tab && s.tabChipOn]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextOn]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filteredPrayers}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => {
          const cc = CAT_COLORS[item.category] || '#6b7280';
          const prayed = prayedIds.includes(item.id);
          return (
            <View style={s.card}>
              <View style={s.cardHead}>
                <View style={s.authorRow}>
                  <View style={[s.avatar, item.is_anonymous && s.avatarAnon]}>
                    <Text style={s.avatarTxt}>{getInitials(item.author)}</Text>
                  </View>
                  <View>
                    <Text style={s.authorName}>{item.author}</Text>
                    <Text style={s.timeAgo}>{getTimeAgo(item.created_at)}</Text>
                  </View>
                </View>
                <View style={s.badges}>
                  {item.is_urgent && (
                    <View style={s.urgentBadge}>
                      <AlertTriangle size={12} color="#fff" />
                      <Text style={s.urgentText}>Urgent</Text>
                    </View>
                  )}
                  <View style={[s.catBadge, { backgroundColor: cc + '18' }]}>
                    <Text style={[s.catBadgeText, { color: cc }]}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</Text>
                  </View>
                </View>
              </View>
              <Text style={s.prayerContent}>{item.content}</Text>
              <View style={s.cardFoot}>
                <View style={s.footLeft}>
                  <TouchableOpacity style={[s.prayedBtn, prayed && s.prayedBtnOn]} onPress={() => handlePrayed(item.id)}>
                    <Hand size={16} color={prayed ? '#fff' : brandGreen} />
                    <Text style={[s.prayedText, prayed && s.prayedTextOn]}>I Prayed ({item.prayed_count})</Text>
                  </TouchableOpacity>
                  {item.updates > 0 && (
                    <View style={s.updatesRow}><MessageSquare size={14} color="#6b7280" /><Text style={s.updatesText}>{item.updates}</Text></View>
                  )}
                </View>
                <View style={s.privBadge}><Eye size={12} color="#9ca3af" /><Text style={s.privText}>Church</Text></View>
              </View>
            </View>
          );
        }}
      />
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalWrap}>
          <View style={s.modalHead}>
            <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={brandDark} /></TouchableOpacity>
            <Text style={s.modalTitle}>Submit Prayer Request</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={s.modalBody} contentContainerStyle={s.modalBodyInner}>
            <Text style={s.label}>Prayer Request</Text>
            <TextInput style={s.textArea} value={newContent} onChangeText={setNewContent} placeholder="Share your prayer request..." placeholderTextColor="#9ca3af" multiline textAlignVertical="top" />
            <Text style={s.label}>Category</Text>
            <View style={s.catPicker}>
              {PRAYER_CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[s.catOpt, newCategory === cat && s.catOptOn]} onPress={() => setNewCategory(cat)}>
                  <Text style={[s.catOptText, newCategory === cat && s.catOptTextOn]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>Privacy Level</Text>
            <View style={s.privPicker}>
              {PRIVACY_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = newPrivacy === opt.value;
                return (
                  <TouchableOpacity key={opt.value} style={[s.privOpt, active && s.privOptOn]} onPress={() => setNewPrivacy(opt.value)}>
                    <Icon size={18} color={active ? '#fff' : '#6b7280'} />
                    <Text style={[s.privOptText, active && s.privOptTextOn]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={s.toggleRow}>
              <Text style={s.toggleLabel}>Post Anonymously</Text>
              <Switch value={isAnonymous} onValueChange={setIsAnonymous} trackColor={{ false: '#e5e7eb', true: brandGreen }} thumbColor="#fff" />
            </View>
            <View style={s.toggleRow}>
              <View>
                <Text style={s.toggleLabel}>Mark as Urgent</Text>
                <Text style={s.toggleSub}>Prioritizes your request in the feed</Text>
              </View>
              <Switch value={isUrgent} onValueChange={setIsUrgent} trackColor={{ false: '#e5e7eb', true: '#dc2626' }} thumbColor="#fff" />
            </View>
            <TouchableOpacity style={s.submitBtn} onPress={handleSubmit}>
              <Text style={s.submitText}>Submit Prayer Request</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: brandDark },
  statsBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', paddingVertical: 10, gap: 8 },
  statsText: { fontSize: 13, fontWeight: '500', color: brandGreen },
  statsDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: brandGreen },
  tabsWrap: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tabsInner: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  tabChipOn: { backgroundColor: brandGreen },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  tabTextOn: { color: '#fff' },
  listContent: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: brandGreen, alignItems: 'center', justifyContent: 'center' },
  avatarAnon: { backgroundColor: '#9ca3af' },
  avatarTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  authorName: { fontSize: 15, fontWeight: '600', color: brandDark },
  timeAgo: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  badges: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  urgentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  urgentText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  catBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 11, fontWeight: '600' },
  prayerContent: { fontSize: 15, lineHeight: 22, color: '#374151', marginBottom: 12 },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prayedBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: brandGreen },
  prayedBtnOn: { backgroundColor: brandGreen, borderColor: brandGreen },
  prayedText: { fontSize: 13, fontWeight: '600', color: brandGreen },
  prayedTextOn: { color: '#fff' },
  updatesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  updatesText: { fontSize: 13, color: '#6b7280' },
  privBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  privText: { fontSize: 12, color: '#9ca3af' },
  modalWrap: { flex: 1, backgroundColor: '#fff' },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: brandDark },
  modalBody: { flex: 1 },
  modalBodyInner: { padding: 20, gap: 6 },
  label: { fontSize: 15, fontWeight: '600', color: brandDark, marginTop: 10, marginBottom: 8 },
  textArea: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: brandDark, minHeight: 120, lineHeight: 22 },
  catPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catOpt: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  catOptOn: { backgroundColor: brandGreen, borderColor: brandGreen },
  catOptText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  catOptTextOn: { color: '#fff' },
  privPicker: { flexDirection: 'row', gap: 8 },
  privOpt: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  privOptOn: { backgroundColor: brandGreen, borderColor: brandGreen },
  privOptText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  privOptTextOn: { color: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: brandDark },
  toggleSub: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  submitBtn: { backgroundColor: brandGreen, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
