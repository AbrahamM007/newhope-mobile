import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { eventsAPI, servicesAPI } from '@/lib/api';
import { Calendar, Users, Heart, Gift, Play, BookOpen, Bell, ArrowRight, ChevronRight, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import theme from '@/lib/theme';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Suggested Logic for Next Step
  const nextStep = {
    type: 'serve',
    title: 'Find Your Purpose',
    subtitle: 'Sign up for the Dream Team today.',
    action: '/(tabs)/serve',
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [eventsData, servicesData] = await Promise.all([
        eventsAPI.getUpcoming(3).catch(() => []),
        servicesAPI.getAll().catch(() => []),
      ]);
      setUpcomingEvents(eventsData || []);
      setServices(servicesData || []);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background Gradient */}
      <LinearGradient
        colors={[theme.colors.white, theme.colors.gray100]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.brandGreen}
            />
          }
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{user?.firstName || 'Friend'}</Text>
              </View>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.8}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <LinearGradient
                    colors={theme.colors.gradients?.primary || ['#15803d', '#166534']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarText}>{user?.firstName?.charAt(0)}</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Featured / Next Step Card (Hero) */}
          <TouchableOpacity
            style={styles.heroCard}
            activeOpacity={0.9}
            onPress={() => router.push(nextStep.action as any)}
          >
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>YOUR NEXT STEP</Text>
                </View>
                <Text style={styles.heroTitle}>{nextStep.title}</Text>
                <Text style={styles.heroSubtitle}>{nextStep.subtitle}</Text>
                <View style={styles.heroAction}>
                  <Text style={styles.heroActionText}>Get Started</Text>
                  <ArrowRight size={16} color={theme.colors.brandGreen} />
                </View>
              </View>
              <View style={styles.heroIconContainer}>
                <Users size={64} color="rgba(22, 101, 52, 0.1)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Actions Grid */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <View style={styles.grid}>
              <QuickAction
                icon={<Heart size={22} color={theme.colors.error} />}
                label="Prayer"
                onPress={() => router.push('/(tabs)')}
                delay={0}
              />
              <QuickAction
                icon={<Gift size={22} color={theme.colors.brandGreen} />}
                label="Give"
                onPress={() => router.push('/(tabs)/give')}
                delay={100}
              />
              <QuickAction
                icon={<Users size={22} color="#0EA5E9" />}
                label="Groups"
                onPress={() => router.push('/(tabs)/groups')}
                delay={200}
              />
              <QuickAction
                icon={<Calendar size={22} color="#F59E0B" />}
                label="Events"
                onPress={() => router.push('/(tabs)/events')}
                delay={300}
              />
            </View>
          </View>

          {/* Sermon Card (Immersive) */}
          <TouchableOpacity
            style={styles.sermonCard}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#111827', '#1F2937']}
              style={styles.sermonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.playButton}>
                <Play size={24} color={theme.colors.white} fill={theme.colors.white} />
              </View>
              <View style={styles.sermonContent}>
                <Text style={styles.sermonLabel}>LATEST MESSAGE</Text>
                <Text style={styles.sermonTitle}>Walking in Faith</Text>
                <Text style={styles.sermonSub}>Pastor John Doe • 35m</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Upcoming Events Horizontal Scroll */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {[1, 2, 3].map((_, index) => (
                <View key={index} style={styles.eventCard}>
                  <View style={styles.eventImagePlaceholder} />
                  <View style={styles.eventCardContent}>
                    <Text style={styles.eventDate}>OCT 15</Text>
                    <Text style={styles.eventTitle}>Worship Night</Text>
                    <View style={styles.eventLocationRow}>
                      <MapPin size={12} color={theme.colors.gray400} />
                      <Text style={styles.eventLocation}>Main Campus</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function QuickAction({ icon, label, onPress, delay }: any) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickActionIcon}>
        {icon}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  userName: {
    fontSize: 28, // Large typography for WOW factor
    fontWeight: '800', // Extra bold
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  profileButton: {
    padding: 2,
    backgroundColor: theme.colors.white,
    borderRadius: 999,
    ...theme.shadows.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },

  // Hero Card
  heroCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing['2xl'],
    ...theme.shadows.lg, // High elevation
    backgroundColor: theme.colors.white,
  },
  heroGradient: {
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  heroContent: {
    zIndex: 10,
  },
  heroBadge: {
    backgroundColor: 'rgba(22, 101, 52, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  heroBadgeText: {
    color: theme.colors.brandGreen,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 16,
    lineHeight: 22,
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.brandGreen,
  },
  heroIconContainer: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.5,
  },

  // Quick Actions
  quickActionsContainer: {
    marginBottom: theme.spacing['3xl'],
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Sermon Card (Immersive)
  sermonCard: {
    marginBottom: theme.spacing['3xl'],
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.xl,
  },
  sermonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: theme.borderRadius.xl,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  sermonContent: {
    flex: 1,
  },
  sermonLabel: {
    color: 'rgba(255,255,255,0.7)', // Light text on dark bg
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sermonTitle: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  sermonSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },

  // Sections
  section: {
    marginBottom: theme.spacing['3xl'],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.brandGreen,
  },
  horizontalScroll: {
    paddingRight: 20,
    gap: 16,
  },
  eventCard: {
    width: width * 0.4,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.md,
  },
  eventImagePlaceholder: {
    height: 80,
    backgroundColor: theme.colors.background.secondary,
  },
  eventCardContent: {
    padding: 12,
  },
  eventDate: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.brandGreen,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventLocation: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
});