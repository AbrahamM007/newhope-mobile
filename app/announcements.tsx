import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Check } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { announcementsAPI } from '@/lib/api';

const brandGreen = colors.brandGreen;
const brandDark = colors.brandDark;

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'church_wide', label: 'Church-wide' },
  { key: 'campus', label: 'Campus' },
  { key: 'ministry', label: 'Ministry' },
  { key: 'volunteers', label: 'Volunteers' },
];

const CATEGORY_LABELS: Record<string, string> = {
  church_wide: 'Church-wide',
  campus: 'Campus',
  ministry: 'Ministry',
  volunteers: 'Volunteers',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await announcementsAPI.getAll().catch(() => null);
      if (data) setAnnouncements(data);
    } catch (_) {} finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAnnouncements(); }, [loadAnnouncements]);

  const filtered = activeCategory === 'all'
    ? announcements
    : announcements.filter((a: any) => a.category === activeCategory);

  const handleAck = (id: string) => {
    setAcknowledged((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={brandDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.chip, activeCategory === cat.key && styles.chipActive]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Text style={[styles.chipText, activeCategory === cat.key && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filtered.map((item) => (
          <View key={item.id} style={styles.card}>
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.cardImage} />
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                {item.priority === 'high' && <View style={styles.priorityDot} />}
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              </View>
              <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
              <View style={styles.cardMeta}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{CATEGORY_LABELS[item.category]}</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(item.published_at)}</Text>
              </View>
              {item.requires_ack && !acknowledged.has(item.id) && (
                <TouchableOpacity style={styles.ackBtn} onPress={() => handleAck(item.id)}>
                  <Check size={16} color="#fff" />
                  <Text style={styles.ackBtnText}>Acknowledge</Text>
                </TouchableOpacity>
              )}
              {item.requires_ack && acknowledged.has(item.id) && (
                <View style={styles.ackDone}>
                  <Check size={16} color={brandGreen} />
                  <Text style={styles.ackDoneText}>Acknowledged</Text>
                </View>
              )}
              {item.category === 'church_wide' && item.priority === 'high' && (
                <TouchableOpacity style={styles.rsvpBtn}>
                  <Calendar size={16} color={brandGreen} />
                  <Text style={styles.rsvpText}>RSVP Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: brandDark },
  chipRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#f0fdf4', borderColor: brandGreen },
  chipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  chipTextActive: { color: brandGreen },
  listContent: { paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  cardImage: { width: '100%', height: 160, backgroundColor: '#e5e7eb' },
  cardBody: { padding: 16 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: brandDark, flex: 1 },
  cardContent: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 12 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f0fdf4' },
  categoryText: { fontSize: 12, fontWeight: '600', color: brandGreen },
  dateText: { fontSize: 12, color: '#999' },
  ackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: brandGreen, gap: 6 },
  ackBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  ackDone: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f0fdf4', gap: 6 },
  ackDoneText: { fontSize: 14, fontWeight: '600', color: brandGreen },
  rsvpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: brandGreen, gap: 6 },
  rsvpText: { fontSize: 14, fontWeight: '600', color: brandGreen },
});
