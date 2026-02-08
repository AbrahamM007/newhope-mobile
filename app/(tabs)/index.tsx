import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { supabaseService } from '@/lib/supabase-service';
import { useRouter } from 'expo-router';
import theme from '@/lib/theme';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  HandHeart,
  Heart,
  Calendar,
  Search,
  MapPin,
  Play,
  Clock,
  ChevronRight,
  Check,
  X,
  Radio,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
  church_wide: '#2563EB', ministry: '#7C3AED', volunteers: theme.colors.brandGreen,
  worship: '#EC4899', youth: '#F59E0B', outreach: '#0EA5E9',
};

const QUICK_ACTIONS = [
  { key: 'prayer', label: 'Prayer', icon: HandHeart, color: '#7C3AED', bg: '#F3E8FF', route: '/prayer' },
  { key: 'give', label: 'Give', icon: Heart, color: '#DC2626', bg: '#FEE2E2', route: '/give' },
  { key: 'events', label: 'Events', icon: Calendar, color: '#D97706', bg: '#FEF3C7', route: '/events' },
  { key: 'directory', label: 'Directory', icon: Search, color: '#2563EB', bg: '#DBEAFE', route: '/directory' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function formatEventDate(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return { month, day: d.getDate(), time: d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }) };
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);
  const [serving, setServing] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [evData, annData] = await Promise.all([
        supabaseService.events.getUpcoming(3).catch(() => null),
        supabaseService.announcements.getAll(3).catch(() => null),
      ]);
      if (Array.isArray(evData)) setEvents(evData);
      if (Array.isArray(annData)) setAnnouncements(annData);
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const initials = `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`;

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.brandGreen} />}
        >
          <View style={s.header}>
            <View>
              <Text style={s.greeting}>{getGreeting()}, {user?.firstName || 'Friend'}</Text>
              <Text style={s.subtitle}>Welcome to NewHope</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={s.avatar} />
              ) : (
                <LinearGradient colors={theme.colors.gradients.primary as [string, string]} style={s.avatar}>
                  <Text style={s.avatarText}>{initials || '?'}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.9} style={s.serviceCardWrap}>
            <LinearGradient colors={theme.colors.gradients.primary as [string, string]} style={s.serviceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.serviceLabel}>TODAY AT NEWHOPE</Text>
              <Text style={s.serviceTitle}>Sunday Service</Text>
              <View style={s.serviceRow}>
                <Clock size={14} color="rgba(255,255,255,0.8)" />
                <Text style={s.serviceTime}>9:00 AM &bull; 11:00 AM</Text>
              </View>
              <TouchableOpacity style={s.liveBtn} activeOpacity={0.8}>
                <Radio size={14} color={theme.colors.white} />
                <Text style={s.liveBtnText}>Watch Live</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>

          {serving && serving.status === 'pending' && (
            <View style={s.servingCard}>
              <View style={s.servingHeader}>
                <Text style={s.servingTitle}>My Serving</Text>
                <View style={s.servingBadge}><Text style={s.servingBadgeText}>PENDING</Text></View>
              </View>
              <Text style={s.servingDetail}>{serving.role} &bull; {serving.service}</Text>
              <Text style={s.servingDate}>{serving.date}</Text>
              <View style={s.servingActions}>
                <TouchableOpacity style={s.confirmBtn} activeOpacity={0.8}>
                  <Check size={16} color={theme.colors.white} />
                  <Text style={s.confirmText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.declineBtn} activeOpacity={0.8}>
                  <X size={16} color={theme.colors.text.secondary} />
                  <Text style={s.declineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={s.grid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity key={a.key} style={s.gridItem} activeOpacity={0.7} onPress={() => router.push(a.route as any)}>
                <View style={[s.gridIcon, { backgroundColor: a.bg }]}>
                  <a.icon size={22} color={a.color} />
                </View>
                <Text style={s.gridLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Announcements</Text>
              <TouchableOpacity onPress={() => router.push('/announcements' as any)}>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {Array.isArray(announcements) && announcements.map((a) => (
              <View key={a.id} style={s.announcementCard}>
                <View style={[s.annDot, { backgroundColor: CATEGORY_COLORS[a.category] || theme.colors.brandGreen }]} />
                <View style={s.annContent}>
                  <Text style={s.annTitle} numberOfLines={1}>{a.title}</Text>
                  <Text style={s.annBody} numberOfLines={1}>{a.content}</Text>
                </View>
                <ChevronRight size={16} color={theme.colors.gray300} />
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.sermonCard} activeOpacity={0.9} onPress={() => router.push('/(tabs)/media')}>
            <LinearGradient colors={['#111827', '#1F2937']} style={s.sermonGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={s.playBtn}>
                <Play size={22} color={theme.colors.white} fill={theme.colors.white} />
              </View>
              <View style={s.sermonInfo}>
                <Text style={s.sermonSeries}>UNSHAKEABLE FAITH</Text>
                <Text style={s.sermonName}>Walking in Faith</Text>
                <Text style={s.sermonMeta}>Pastor John Doe &bull; 35 min</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                <Text style={s.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
              {events.map((ev) => {
                const d = formatEventDate(ev.start_time);
                return (
                  <TouchableOpacity key={ev.id} style={s.eventCard} activeOpacity={0.8} onPress={() => router.push('/(tabs)/events')}>
                    <View style={[s.dateBadge, { backgroundColor: CATEGORY_COLORS[ev.category] || theme.colors.brandGreen }]}>
                      <Text style={s.dateMonth}>{d.month}</Text>
                      <Text style={s.dateDay}>{d.day}</Text>
                    </View>
                    <View style={s.eventInfo}>
                      <Text style={s.eventTitle} numberOfLines={1}>{ev.title}</Text>
                      <View style={s.eventLocRow}>
                        <MapPin size={12} color={theme.colors.gray400} />
                        <Text style={s.eventLoc}>{ev.location}</Text>
                      </View>
                      <Text style={s.eventTime}>{d.time}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background.primary }, safe: { flex: 1 },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing['2xl'] },
  greeting: { fontSize: theme.typography.sizes['3xl'], fontWeight: '800' as const, color: theme.colors.text.primary, letterSpacing: -0.5 },
  subtitle: { fontSize: theme.typography.sizes.base, color: theme.colors.text.secondary, marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { color: theme.colors.white, fontSize: 18, fontWeight: '700' as const },
  serviceCardWrap: { marginBottom: theme.spacing['2xl'], borderRadius: theme.borderRadius.xl, ...theme.shadows.lg },
  serviceCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing['2xl'] },
  serviceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800' as const, letterSpacing: 1, marginBottom: theme.spacing.sm },
  serviceTitle: { color: theme.colors.white, fontSize: theme.typography.sizes['2xl'], fontWeight: '700' as const, marginBottom: theme.spacing.sm },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.lg },
  serviceTime: { color: 'rgba(255,255,255,0.85)', fontSize: theme.typography.sizes.base },
  liveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.borderRadius.full },
  liveBtnText: { color: theme.colors.white, fontSize: theme.typography.sizes.sm, fontWeight: '600' as const },
  servingCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, marginBottom: theme.spacing['2xl'], borderWidth: 1, borderColor: theme.colors.border.light, ...theme.shadows.sm },
  servingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  servingTitle: { fontSize: theme.typography.sizes.lg, fontWeight: '700' as const, color: theme.colors.text.primary },
  servingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.borderRadius.sm },
  servingBadgeText: { fontSize: 10, fontWeight: '700' as const, color: '#92400E' },
  servingDetail: { fontSize: theme.typography.sizes.base, color: theme.colors.text.secondary, marginBottom: 2 },
  servingDate: { fontSize: theme.typography.sizes.sm, color: theme.colors.text.tertiary, marginBottom: theme.spacing.md },
  servingActions: { flexDirection: 'row', gap: theme.spacing.sm },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.brandGreen, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.md },
  confirmText: { color: theme.colors.white, fontSize: theme.typography.sizes.sm, fontWeight: '600' as const },
  declineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.colors.gray100, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.md },
  declineText: { color: theme.colors.text.secondary, fontSize: theme.typography.sizes.sm, fontWeight: '600' as const },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginBottom: theme.spacing['2xl'] },
  gridItem: { width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2, backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg, padding: theme.spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border.light, ...theme.shadows.sm },
  gridIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm },
  gridLabel: { fontSize: theme.typography.sizes.base, fontWeight: '600' as const, color: theme.colors.text.primary },
  section: { marginBottom: theme.spacing['2xl'] },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: theme.typography.sizes.xl, fontWeight: '700' as const, color: theme.colors.text.primary },
  seeAll: { fontSize: theme.typography.sizes.base, fontWeight: '600' as const, color: theme.colors.brandGreen },
  announcementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border.light, ...theme.shadows.sm },
  annDot: { width: 8, height: 8, borderRadius: 4, marginRight: theme.spacing.md },
  annContent: { flex: 1, marginRight: theme.spacing.sm },
  annTitle: { fontSize: theme.typography.sizes.base, fontWeight: '600' as const, color: theme.colors.text.primary, marginBottom: 2 },
  annBody: { fontSize: theme.typography.sizes.sm, color: theme.colors.text.tertiary }, sermonCard: { marginBottom: theme.spacing['2xl'], borderRadius: theme.borderRadius.xl, ...theme.shadows.xl },
  sermonGrad: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.xl, borderRadius: theme.borderRadius.xl },
  playBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  sermonInfo: { flex: 1 }, sermonSeries: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800' as const, letterSpacing: 1, marginBottom: 4 },
  sermonName: { color: theme.colors.white, fontSize: theme.typography.sizes.xl, fontWeight: '700' as const, marginBottom: 2 },
  sermonMeta: { color: 'rgba(255,255,255,0.7)', fontSize: theme.typography.sizes.sm },
  hScroll: { paddingRight: theme.spacing.lg, gap: theme.spacing.md },
  eventCard: { width: width * 0.42, backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border.light, ...theme.shadows.sm },
  dateBadge: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.sm },
  dateMonth: { color: theme.colors.white, fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5 },
  dateDay: { color: theme.colors.white, fontSize: theme.typography.sizes['2xl'], fontWeight: '800' as const },
  eventInfo: { padding: theme.spacing.md },
  eventTitle: { fontSize: theme.typography.sizes.base, fontWeight: '700' as const, color: theme.colors.text.primary, marginBottom: 4 },
  eventLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  eventLoc: { fontSize: theme.typography.sizes.xs, color: theme.colors.text.secondary }, eventTime: { fontSize: theme.typography.sizes.xs, color: theme.colors.text.tertiary },
});
