import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, SlidersHorizontal, Search, MapPin, Clock, Users, CalendarPlus, Check } from 'lucide-react-native';

const brandGreen = '#15803d';
const brandDark = '#1a1a1a';

const MOCK_EVENTS = [
  { id: '1', title: 'Worship Night', start_time: '2026-02-15T19:00:00', end_time: '2026-02-15T21:00:00', location: 'Main Auditorium', category: 'worship', image: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=600', rsvp_count: 145, isGoing: false },
  { id: '2', title: 'Youth Rally', start_time: '2026-02-18T18:00:00', end_time: '2026-02-18T20:30:00', location: 'Youth Center', category: 'youth', image: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=600', rsvp_count: 82, isGoing: true },
  { id: '3', title: 'Community Service Day', start_time: '2026-02-22T09:00:00', end_time: '2026-02-22T14:00:00', location: 'City Park', category: 'outreach', image: 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=600', rsvp_count: 56, isGoing: false },
  { id: '4', title: 'Marriage Conference', start_time: '2026-03-01T09:00:00', end_time: '2026-03-01T17:00:00', location: 'Conference Center', category: 'conference', image: 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=600', rsvp_count: 200, isGoing: false },
  { id: '5', title: 'Kids Fun Day', start_time: '2026-03-08T10:00:00', end_time: '2026-03-08T13:00:00', location: 'Kids Wing', category: 'community', image: 'https://images.pexels.com/photos/1001914/pexels-photo-1001914.jpeg?auto=compress&cs=tinysrgb&w=600', rsvp_count: 75, isGoing: false },
];

const CATEGORIES = ['All', 'Worship', 'Youth', 'Outreach', 'Community', 'Conference'];

const CATEGORY_COLORS: Record<string, string> = {
  worship: '#7c3aed',
  youth: '#2563eb',
  outreach: '#ea580c',
  community: '#0891b2',
  conference: '#be185d',
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return { month: months[d.getMonth()], day: d.getDate().toString() };
};

const formatTime = (start: string, end: string) => {
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${fmt(new Date(start))} - ${fmt(new Date(end))}`;
};

export default function EventsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState(MOCK_EVENTS);

  const filteredEvents = events.filter((e) => {
    const matchCategory = activeCategory === 'All' || e.category === activeCategory.toLowerCase();
    const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const toggleRsvp = (id: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, isGoing: !e.isGoing, rsvp_count: e.isGoing ? e.rsvp_count - 1 : e.rsvp_count + 1 }
          : e
      )
    );
  };

  const handleAddToCalendar = (title: string) => {
    Alert.alert('Add to Calendar', `"${title}" would be added to your device calendar.`);
  };

  const renderEventCard = ({ item }: { item: typeof MOCK_EVENTS[0] }) => {
    const { month, day } = formatDate(item.start_time);
    const catColor = CATEGORY_COLORS[item.category] || '#6b7280';

    return (
      <View style={styles.eventCard}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.eventImage} />
          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>{month}</Text>
            <Text style={styles.dateDay}>{day}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: catColor }]}>
            <Text style={styles.categoryText}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <View style={styles.eventMeta}>
            <View style={styles.metaRow}>
              <Clock size={14} color="#6b7280" />
              <Text style={styles.metaText}>{formatTime(item.start_time, item.end_time)}</Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={14} color="#6b7280" />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.attendeeInfo}>
              <Users size={14} color="#6b7280" />
              <Text style={styles.attendeeText}>{item.rsvp_count} attending</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.calendarBtn} onPress={() => handleAddToCalendar(item.title)}>
                <CalendarPlus size={18} color={brandGreen} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rsvpBtn, item.isGoing && styles.rsvpBtnActive]}
                onPress={() => toggleRsvp(item.id)}
              >
                {item.isGoing && <Check size={16} color="#fff" />}
                <Text style={[styles.rsvpBtnText, item.isGoing && styles.rsvpBtnTextActive]}>
                  {item.isGoing ? 'Going' : 'RSVP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={brandDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <SlidersHorizontal size={22} color={brandDark} />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEventCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: brandDark },
  filterBtn: { padding: 4 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: brandDark },
  categoriesContainer: { maxHeight: 50, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  categoriesContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  categoryChipActive: { backgroundColor: brandGreen },
  categoryChipText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  categoryChipTextActive: { color: '#fff' },
  listContent: { padding: 16, gap: 16 },
  eventCard: { borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  imageContainer: { position: 'relative', height: 180 },
  eventImage: { width: '100%', height: '100%' },
  dateBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  dateMonth: { fontSize: 11, fontWeight: '700', color: brandGreen, textTransform: 'uppercase' },
  dateDay: { fontSize: 20, fontWeight: '800', color: brandDark, marginTop: -2 },
  categoryBadge: { position: 'absolute', top: 12, right: 12, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  cardBody: { padding: 16 },
  eventTitle: { fontSize: 18, fontWeight: '700', color: brandDark, marginBottom: 8 },
  eventMeta: { gap: 6, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#6b7280' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attendeeInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  attendeeText: { fontSize: 13, color: '#6b7280' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  calendarBtn: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  rsvpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: brandGreen },
  rsvpBtnActive: { backgroundColor: brandGreen, borderColor: brandGreen },
  rsvpBtnText: { fontSize: 14, fontWeight: '600', color: brandGreen },
  rsvpBtnTextActive: { color: '#fff' },
});
