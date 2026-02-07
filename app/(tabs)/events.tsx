import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { eventsFullAPI } from '@/lib/api';
import { Calendar, MapPin, Users, Check, Clock } from 'lucide-react-native';
import theme from '@/lib/theme';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  location?: string;
  image?: string;
  category?: string;
  capacity?: number;
  rsvps: { userId: string; status: string }[];
  _count: { rsvps: number };
}

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsFullAPI.getAll(true);
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleRsvp = async (eventId: string, currentlyRsvped: boolean) => {
    try {
      if (currentlyRsvped) {
        await eventsFullAPI.cancelRsvp(eventId);
      } else {
        await eventsFullAPI.rsvp(eventId, 'GOING');
      }
      await loadEvents();
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  const isRsvped = (event: Event) => {
    return event.rsvps?.some((rsvp) => rsvp.userId === user?.id);
  };

  const renderEvent = ({ item: event }: { item: Event }) => {
    const rsvped = isRsvped(event);
    const attendees = event._count?.rsvps || 0;
    const eventDate = new Date(event.date);

    return (
      <View style={styles.eventCard}>
        {event.image ? (
          <Image source={{ uri: event.image }} style={styles.eventImage} />
        ) : (
          <LinearGradient
            colors={theme.colors.gradients?.silver || ['#f3f4f6', '#e5e7eb']}
            style={styles.eventImagePlaceholder}
          >
            <Calendar size={32} color={theme.colors.brandGreen} strokeWidth={2} />
          </LinearGradient>
        )}

        <View style={styles.eventContent}>
          <View style={styles.headerRow}>
            {event.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>
            )}
            {/* Date Badge */}
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay}>{eventDate.getDate()}</Text>
              <Text style={styles.dateMonth}>
                {eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>

          <View style={styles.eventMeta}>
            <View style={styles.metaItem}>
              <Clock size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.metaText}>
                {eventDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            {event.location && (
              <View style={styles.metaItem}>
                <MapPin size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Users size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.metaText}>
                {attendees} attending
                {event.capacity ? ` / ${event.capacity} ` : ''}
              </Text>
            </View>
          </View>

          {event.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.rsvpButton, rsvped && styles.rsvpButtonActive]}
            activeOpacity={0.8}
            onPress={() => handleRsvp(event.id, rsvped)}
          >
            {rsvped ? (
              <LinearGradient
                colors={theme.colors.gradients?.primary || ['#15803d', '#166534']}
                style={styles.rsvpGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Check size={16} color="#fff" />
                <Text style={styles.rsvpButtonTextActive}>Going</Text>
              </LinearGradient>
            ) : (
              <View style={styles.rsvpContent}>
                <Text style={styles.rsvpButtonText}>RSVP</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.gray100]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Upcoming Events</Text>
        </View>

        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brandGreen}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Calendar size={48} color={theme.colors.gray300} />
                <Text style={styles.emptyText}>No upcoming events</Text>
                <Text style={styles.emptySubtext}>Check back soon for new events!</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'transparent',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: 16,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.brandGreen,
    textTransform: 'uppercase',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700', // Playfair Display equivalent weight
    color: theme.colors.text.primary,
    marginBottom: 8,
    fontFamily: theme.typography.fonts.serif.split(',')[0].replace(/"/g, ''),
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  rsvpButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.brandGreen,
  },
  rsvpButtonActive: {
    borderWidth: 0,
  },
  rsvpContent: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  rsvpGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.brandGreen,
  },
  rsvpButtonTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
});