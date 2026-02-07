import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Image, Modal, TextInput, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Share2, Bookmark, Plus, X, Send, BookOpen, Camera, Type, HandHeart, BarChart3 } from 'lucide-react-native';
import theme from '@/lib/theme';
import { postsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const MOCK_STORIES = [
  { id: 'add', name: 'Your Story', isAdd: true },
  { id: '1', name: 'Sarah J.', avatar: null, hasNew: true },
  { id: '2', name: 'Pastor Mike', avatar: null, hasNew: true },
  { id: '3', name: 'Worship', avatar: null, hasNew: false },
  { id: '4', name: 'Youth', avatar: null, hasNew: true },
  { id: '5', name: 'Maria L.', avatar: null, hasNew: false },
];

const MOCK_POSTS = [
  { id: '1', author: { firstName: 'Sarah', lastName: 'Johnson' }, post_type: 'testimony', scope: 'PUBLIC_CHURCH', content: 'God has been so faithful this week! I got the job I had been praying about for months. Never stop believing!', like_count: 24, comment_count: 8, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', author: { firstName: 'Pastor', lastName: 'Mike' }, post_type: 'scripture', scope: 'PUBLIC_CHURCH', content: '\u201CFor I know the plans I have for you,\u201D declares the Lord, \u201Cplans to prosper you and not to harm you, plans to give you hope and a future.\u201D', scripture_ref: 'Jeremiah 29:11', like_count: 56, comment_count: 12, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', author: { firstName: 'David', lastName: 'Lee' }, post_type: 'text', scope: 'PUBLIC_CHURCH', content: 'Amazing worship service this morning! The presence of God was so strong. Who else felt that?', like_count: 42, comment_count: 15, created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: '4', author: { firstName: 'Emily', lastName: 'Chen' }, post_type: 'prayer_request', scope: 'PUBLIC_CHURCH', content: 'Please pray for my grandmother who is in the hospital. She has been struggling with her health for the past few weeks.', like_count: 31, comment_count: 22, created_at: new Date(Date.now() - 28800000).toISOString() },
  { id: '5', author: { firstName: 'Youth', lastName: 'Ministry' }, post_type: 'text', scope: 'MINISTRY', content: 'Youth Rally this Friday at 7PM! Bring a friend and get ready for an awesome night of worship and games!', like_count: 18, comment_count: 5, created_at: new Date(Date.now() - 43200000).toISOString(), media_urls: ['https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=600'] },
];

const FEED_TABS = ['For You', 'Church', 'My Groups', 'Ministry'];
const POST_TYPES = [
  { key: 'text', label: 'Text', icon: Type },
  { key: 'photo', label: 'Photo', icon: Camera },
  { key: 'scripture', label: 'Scripture', icon: BookOpen },
  { key: 'testimony', label: 'Testimony', icon: HandHeart },
  { key: 'prayer', label: 'Prayer', icon: Heart },
  { key: 'poll', label: 'Poll', icon: BarChart3 },
];
const SCOPES = ['Church', 'Group', 'Ministry'];
const TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  testimony: { bg: '#FEF3C7', fg: '#92400E' },
  prayer_request: { bg: '#DBEAFE', fg: '#1E40AF' },
  scripture: { bg: '#CCFBF1', fg: '#115E59' },
  praise_report: { bg: '#DCFCE7', fg: '#166534' },
};

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dy = Math.floor(h / 24);
  return dy < 7 ? `${dy}d ago` : new Date(d).toLocaleDateString();
};
const initials = (f: string, l: string) => `${f[0]}${l[0]}`.toUpperCase();
const scopeText = (s: string) => s === 'MINISTRY' ? 'Ministry' : s === 'PUBLIC_CHURCH' ? 'Church' : s;

type Story = (typeof MOCK_STORIES)[0];
type Post = (typeof MOCK_POSTS)[0];

export default function SocialScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('For You');
  const [posts] = useState(MOCK_POSTS);
  const [refreshing, setRefreshing] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [scope, setScope] = useState('Church');

  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  };

  const submit = async () => {
    if (!content.trim()) return;
    try { await postsAPI.create(content.trim()); } catch {}
    setContent('');
    setShowModal(false);
  };

  const renderStory = ({ item }: { item: Story }) => (
    <TouchableOpacity style={s.storyItem} activeOpacity={0.7}>
      <View style={[s.storyCircle, item.hasNew && s.storyNew, item.isAdd && s.storyAdd]}>
        {item.isAdd ? <Plus size={28} color={theme.colors.brandGreen} /> : <Text style={s.storyInit}>{item.name[0]}</Text>}
      </View>
      <Text style={s.storyName} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = liked.has(item.id);
    const isSaved = saved.has(item.id);
    const tc = TYPE_COLORS[item.post_type];
    const ref = 'scripture_ref' in item ? (item as any).scripture_ref : null;
    const media = 'media_urls' in item ? (item as any).media_urls : null;
    return (
      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{initials(item.author.firstName, item.author.lastName)}</Text></View>
          <View style={s.authorInfo}>
            <View style={s.authorRow}>
              <Text style={s.authorName}>{item.author.firstName} {item.author.lastName}</Text>
              <View style={s.scope}><Text style={s.scopeTxt}>{scopeText(item.scope)}</Text></View>
            </View>
            <Text style={s.time}>{timeAgo(item.created_at)}</Text>
          </View>
        </View>
        {tc && <View style={[s.badge, { backgroundColor: tc.bg }]}><Text style={[s.badgeTxt, { color: tc.fg }]}>{item.post_type.replace('_', ' ')}</Text></View>}
        <Text style={s.body}>{item.content}</Text>
        {ref && <View style={s.scripture}><BookOpen size={14} color="#115E59" /><Text style={s.scriptureTxt}>{ref}</Text></View>}
        {media?.length > 0 && <Image source={{ uri: media[0] }} style={s.image} />}
        <View style={s.stats}>
          <Text style={s.statTxt}>{item.like_count + (isLiked ? 1 : 0)} likes</Text>
          <Text style={s.statTxt}>{item.comment_count} comments</Text>
        </View>
        <View style={s.divider} />
        <View style={s.actions}>
          <TouchableOpacity style={s.actBtn} onPress={() => setLiked(p => toggle(p, item.id))}>
            <Heart size={20} color={isLiked ? '#DC2626' : theme.colors.gray500} fill={isLiked ? '#DC2626' : 'none'} />
          </TouchableOpacity>
          <TouchableOpacity style={s.actBtn}><MessageCircle size={20} color={theme.colors.gray500} /></TouchableOpacity>
          <TouchableOpacity style={s.actBtn}><Share2 size={20} color={theme.colors.gray500} /></TouchableOpacity>
          <View style={s.spacer} />
          <TouchableOpacity style={s.actBtn} onPress={() => setSaved(p => toggle(p, item.id))}>
            <Bookmark size={20} color={isSaved ? theme.colors.brandGreen : theme.colors.gray500} fill={isSaved ? theme.colors.brandGreen : 'none'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const Header = () => (
    <View>
      <FlatList data={MOCK_STORIES} renderItem={renderStory} keyExtractor={i => i.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stories} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
        {FEED_TABS.map(t => (
          <TouchableOpacity key={t} style={[s.chip, activeTab === t && s.chipOn]} onPress={() => setActiveTab(t)}>
            <Text style={[s.chipTxt, activeTab === t && s.chipTxtOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={s.container}>
      <SafeAreaView edges={['top']} style={s.flex}>
        <View style={s.header}><Text style={s.title}>Social</Text></View>
        <FlatList data={posts} renderItem={renderPost} keyExtractor={p => p.id} ListHeaderComponent={Header} contentContainerStyle={s.feed} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }} tintColor={theme.colors.brandGreen} />} />
        <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={() => setShowModal(true)}><Plus size={28} color="#fff" /></TouchableOpacity>
      </SafeAreaView>
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHead}>
              <TouchableOpacity onPress={() => setShowModal(false)}><X size={24} color={theme.colors.text.primary} /></TouchableOpacity>
              <Text style={s.modalTitle}>Create Post</Text>
              <TouchableOpacity style={[s.submitBtn, !content.trim() && s.submitOff]} disabled={!content.trim()} onPress={submit}>
                <Send size={16} color="#fff" /><Text style={s.submitTxt}>Post</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.label}>Post Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeScroll}>
              {POST_TYPES.map(pt => {
                const I = pt.icon; const on = postType === pt.key;
                return (<TouchableOpacity key={pt.key} style={[s.typeOpt, on && s.typeOn]} onPress={() => setPostType(pt.key)}><I size={16} color={on ? '#fff' : theme.colors.gray600} /><Text style={[s.typeOptTxt, on && s.typeOnTxt]}>{pt.label}</Text></TouchableOpacity>);
              })}
            </ScrollView>
            <Text style={s.label}>Scope</Text>
            <View style={s.scopeRow}>
              {SCOPES.map(sc => (<TouchableOpacity key={sc} style={[s.scopeOpt, scope === sc && s.scopeOn]} onPress={() => setScope(sc)}><Text style={[s.scopeOptTxt, scope === sc && s.scopeOnTxt]}>{sc}</Text></TouchableOpacity>))}
            </View>
            <TextInput style={s.input} placeholder="Share what's on your heart..." placeholderTextColor={theme.colors.gray400} multiline value={content} onChangeText={setContent} autoFocus />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const c = theme.colors;
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background.secondary },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 28, fontWeight: '800', color: c.text.primary, letterSpacing: -0.5 },
  stories: { paddingHorizontal: 12, paddingBottom: 12, gap: 12 },
  storyItem: { alignItems: 'center', width: 76 },
  storyCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: c.gray100, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: c.gray200 },
  storyNew: { borderWidth: 3, borderColor: c.brandGreen },
  storyAdd: { borderStyle: 'dashed', borderColor: c.brandGreen, borderWidth: 2 },
  storyInit: { fontSize: 22, fontWeight: '700', color: c.text.secondary },
  storyName: { fontSize: 11, color: c.text.secondary, marginTop: 4, textAlign: 'center', fontWeight: '500' },
  tabs: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: c.white, borderWidth: 1, borderColor: c.border.medium },
  chipOn: { backgroundColor: c.brandGreen, borderColor: c.brandGreen },
  chipTxt: { fontSize: 13, fontWeight: '600', color: c.text.secondary },
  chipTxtOn: { color: c.white },
  feed: { paddingBottom: 100 },
  card: { backgroundColor: c.white, marginHorizontal: 12, marginBottom: 12, borderRadius: 16, padding: 16, ...theme.shadows.sm, borderWidth: 1, borderColor: c.border.light },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.gray200, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarTxt: { fontSize: 15, fontWeight: '700', color: c.text.secondary },
  authorInfo: { flex: 1 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorName: { fontSize: 15, fontWeight: '700', color: c.text.primary },
  scope: { backgroundColor: c.gray100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  scopeTxt: { fontSize: 10, fontWeight: '600', color: c.text.tertiary },
  time: { fontSize: 12, color: c.text.tertiary, marginTop: 1, fontWeight: '500' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  badgeTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  body: { fontSize: 15, color: c.text.primary, lineHeight: 22, marginBottom: 8 },
  scripture: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDFA', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  scriptureTxt: { fontSize: 12, fontWeight: '600', color: '#115E59' },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
  stats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  statTxt: { fontSize: 12, color: c.text.tertiary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: c.border.light, marginBottom: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actBtn: { padding: 8, borderRadius: 20 },
  spacer: { flex: 1 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: c.brandGreen, justifyContent: 'center', alignItems: 'center', ...theme.shadows.lg },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: c.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 420, ...theme.shadows.xl },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: c.text.primary },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.brandGreen, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  submitOff: { opacity: 0.4 },
  submitTxt: { color: c.white, fontWeight: '700', fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', color: c.text.secondary, marginBottom: 8 },
  typeScroll: { marginBottom: 16 },
  typeOpt: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.gray100, marginRight: 8 },
  typeOn: { backgroundColor: c.brandGreen },
  typeOptTxt: { fontSize: 13, fontWeight: '600', color: c.gray600 },
  typeOnTxt: { color: c.white },
  scopeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scopeOpt: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: c.gray100 },
  scopeOn: { backgroundColor: c.brandGreen },
  scopeOptTxt: { fontSize: 13, fontWeight: '600', color: c.gray600 },
  scopeOnTxt: { color: c.white },
  input: { fontSize: 16, color: c.text.primary, minHeight: 120, textAlignVertical: 'top', lineHeight: 24, borderTopWidth: 1, borderTopColor: c.border.light, paddingTop: 12 },
});
