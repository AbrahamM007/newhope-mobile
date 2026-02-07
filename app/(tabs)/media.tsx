import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, X, Clock, User, BookOpen, Radio } from 'lucide-react-native';
import theme from '@/lib/theme';
import { mediaAPI } from '@/lib/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const MEDIA_TABS = ['Sermons', 'Devotionals', 'Podcasts'];
const SPEEDS = ['0.5x', '1x', '1.5x', '2x'];

const formatDuration = (seconds: number) => `${Math.round(seconds / 60)} min`;

export default function MediaScreen() {
  const [activeTab, setActiveTab] = useState('Sermons');
  const [activeSeries, setActiveSeries] = useState('All');
  const [selectedSermon, setSelectedSermon] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [sermons, setSermons] = useState<any[]>([]);
  const [seriesFilters, setSeriesFilters] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const isLive = true;

  const loadData = useCallback(async () => {
    try {
      const [mediaData, seriesData] = await Promise.all([
        mediaAPI.getAll().catch(() => null),
        mediaAPI.getSeries().catch(() => null),
      ]);
      if (mediaData) setSermons(mediaData);
      if (seriesData) {
        const names = seriesData.map((s: any) => s.name || s.title).filter(Boolean);
        setSeriesFilters(['All', ...names]);
      }
    } catch (_) {} finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const filtered = activeSeries === 'All' ? sermons : sermons.filter((s: any) => s.series === activeSeries);

  const hero = filtered[0];
  const grid = filtered.slice(1);
  const related = sermons.filter((s: any) => s.id !== selectedSermon?.id).slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Media</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.brandGreen} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Media</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isLive && (
          <TouchableOpacity style={styles.liveBanner} activeOpacity={0.8}>
            <View style={styles.liveBadge}>
              <Radio size={12} color={theme.colors.white} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <Text style={styles.liveTitle}>Sunday Worship Service</Text>
            <View style={styles.liveButton}>
              <Text style={styles.liveButtonText}>Watch Now</Text>
            </View>
          </TouchableOpacity>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
          {MEDIA_TABS.map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
          {seriesFilters.map((s) => (
            <TouchableOpacity key={s} style={[styles.chip, activeSeries === s && styles.chipActive]} onPress={() => setActiveSeries(s)}>
              <Text style={[styles.chipText, activeSeries === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {hero && (
          <TouchableOpacity style={styles.hero} activeOpacity={0.9} onPress={() => setSelectedSermon(hero)}>
            <Image source={{ uri: hero.thumbnail }} style={styles.heroImage} />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.seriesBadge}>
                <Text style={styles.seriesBadgeText}>{hero.series}</Text>
              </View>
              <Text style={styles.heroTitle}>{hero.title}</Text>
              <Text style={styles.heroMeta}>{hero.speaker} | {hero.date} | {formatDuration(hero.duration)}</Text>
            </View>
            <View style={styles.heroPlay}>
              <Play size={28} color={theme.colors.white} fill={theme.colors.white} />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.grid}>
          {grid.map((item) => (
            <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.9} onPress={() => setSelectedSermon(item)}>
              <View style={styles.thumbWrap}>
                <Image source={{ uri: item.thumbnail }} style={styles.cardThumb} />
                <View style={styles.playOverlay}>
                  <Play size={20} color={theme.colors.white} fill={theme.colors.white} />
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardSpeaker}>{item.speaker}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={!!selectedSermon} animationType="slide" presentationStyle="pageSheet">
        {selectedSermon && (
          <SafeAreaView style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle}>Now Playing</Text>
                <TouchableOpacity onPress={() => { setSelectedSermon(null); setIsPlaying(false); }}>
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: selectedSermon.thumbnail }} style={styles.modalImage} />
              <View style={styles.modalBody}>
                <View style={styles.seriesBadge}>
                  <Text style={styles.seriesBadgeText}>{selectedSermon.series}</Text>
                </View>
                <Text style={styles.modalTitle}>{selectedSermon.title}</Text>
                <View style={styles.modalMeta}>
                  <User size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.modalMetaText}>{selectedSermon.speaker}</Text>
                  <Clock size={14} color={theme.colors.text.secondary} />
                  <Text style={styles.modalMetaText}>{formatDuration(selectedSermon.duration)}</Text>
                </View>
                <TouchableOpacity style={styles.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause size={28} color={theme.colors.white} /> : <Play size={28} color={theme.colors.white} fill={theme.colors.white} />}
                </TouchableOpacity>
                <View style={styles.speedRow}>
                  {SPEEDS.map((s) => (
                    <TouchableOpacity key={s} style={[styles.speedBtn, speed === s && styles.speedBtnActive]} onPress={() => setSpeed(s)}>
                      <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <BookOpen size={16} color={theme.colors.brandGreen} />
                    <Text style={styles.sectionTitle}>Scripture</Text>
                  </View>
                  <Text style={styles.sectionBody}>{selectedSermon.scripture}</Text>
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesPlaceholder}>Tap to add your sermon notes...</Text>
                  </View>
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Related Sermons</Text>
                  {related.map((r) => (
                    <TouchableOpacity key={r.id} style={styles.relatedRow} onPress={() => { setSelectedSermon(r); setIsPlaying(false); }}>
                      <Image source={{ uri: r.thumbnail }} style={styles.relatedThumb} />
                      <View style={styles.relatedInfo}>
                        <Text style={styles.relatedTitle} numberOfLines={1}>{r.title}</Text>
                        <Text style={styles.relatedSpeaker}>{r.speaker}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border.light },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.brandDark },
  liveBanner: { margin: 16, backgroundColor: '#DC2626', borderRadius: 12, padding: 16, alignItems: 'center' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  liveBadgeText: { color: theme.colors.white, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  liveTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '600', marginBottom: 10 },
  liveButton: { backgroundColor: theme.colors.white, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  liveButtonText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  tabs: { borderBottomWidth: 1, borderBottomColor: theme.colors.border.light },
  tabsContent: { paddingHorizontal: 16, gap: 24, paddingVertical: 12 },
  tab: { paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: theme.colors.brandGreen },
  tabText: { fontSize: 15, fontWeight: '500', color: theme.colors.text.tertiary },
  tabTextActive: { color: theme.colors.brandGreen, fontWeight: '700' },
  chips: { marginTop: 4 },
  chipsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border.medium, backgroundColor: theme.colors.white },
  chipActive: { backgroundColor: theme.colors.brandGreen, borderColor: theme.colors.brandGreen },
  chipText: { fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary },
  chipTextActive: { color: theme.colors.white },
  hero: { margin: 16, borderRadius: 16, overflow: 'hidden', height: 220, ...theme.shadows.lg },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroContent: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  seriesBadge: { backgroundColor: theme.colors.brandGreen, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 6 },
  seriesBadgeText: { color: theme.colors.white, fontSize: 11, fontWeight: '700' },
  heroTitle: { color: theme.colors.white, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  heroMeta: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  heroPlay: { position: 'absolute', top: '50%', left: '50%', marginTop: -26, marginLeft: -26, width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
  card: { width: CARD_WIDTH, borderRadius: 12, backgroundColor: theme.colors.white, overflow: 'hidden', ...theme.shadows.md },
  thumbWrap: { width: '100%', aspectRatio: 16 / 9 },
  cardThumb: { width: '100%', height: '100%' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  durationBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: theme.colors.white, fontSize: 10, fontWeight: '600' },
  cardInfo: { padding: 10 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.brandDark, marginBottom: 4 },
  cardSpeaker: { fontSize: 11, color: theme.colors.text.secondary, marginBottom: 2 },
  cardDate: { fontSize: 10, color: theme.colors.text.tertiary },
  modal: { flex: 1, backgroundColor: theme.colors.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border.light },
  modalHeaderTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.brandDark },
  modalImage: { width: '100%', aspectRatio: 16 / 9 },
  modalBody: { padding: 16 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.brandDark, marginBottom: 8 },
  modalMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  modalMetaText: { fontSize: 13, color: theme.colors.text.secondary, marginRight: 8 },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.brandGreen, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16, ...theme.shadows.glow },
  speedRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  speedBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border.medium },
  speedBtnActive: { backgroundColor: theme.colors.brandGreen, borderColor: theme.colors.brandGreen },
  speedText: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary },
  speedTextActive: { color: theme.colors.white },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.brandDark, marginBottom: 6 },
  sectionBody: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 },
  notesBox: { borderWidth: 1, borderColor: theme.colors.border.medium, borderRadius: 10, padding: 14, minHeight: 80 },
  notesPlaceholder: { fontSize: 13, color: theme.colors.text.tertiary },
  relatedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  relatedThumb: { width: 72, height: 44, borderRadius: 6 },
  relatedInfo: { flex: 1 },
  relatedTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.brandDark },
  relatedSpeaker: { fontSize: 11, color: theme.colors.text.secondary },
});
