import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { LogOut, Edit2, Bell, Lock, Mail, Phone, ChevronRight, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import theme from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    setProfile(user);
    if (!supabase) {
      console.warn('Supabase not initialized. Some profile features may be limited.');
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', onPress: () => { } },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.gray100]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>

          {profile && (
            <>
              <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                  ) : (
                    <LinearGradient
                      colors={(theme.colors.gradients?.primary || ['#15803d', '#166534']) as any}
                      style={styles.avatarPlaceholder}
                    >
                      <Text style={styles.avatarText}>{profile.full_name?.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                  )}
                  <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
                    <Edit2 size={16} color="#fff" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <View style={styles.profileHeaderInfo}>
                  <Text style={styles.profileName}>{profile.full_name}</Text>
                  <Text style={styles.profileEmail}>{profile.email}</Text>
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBadgeText}>Member</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Information</Text>

                <View style={styles.infoCard}>
                  <View style={styles.infoItem}>
                    <View style={[styles.iconContainer, { backgroundColor: '#eff6ff' }]}>
                      <Mail size={20} color="#2563eb" strokeWidth={2} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{profile.email}</Text>
                    </View>
                  </View>

                  {profile.phone && (
                    <View style={[styles.separator, { marginVertical: 8 }]} />
                  )}

                  {profile.phone && (
                    <View style={styles.infoItem}>
                      <View style={[styles.iconContainer, { backgroundColor: '#f0fdf4' }]}>
                        <Phone size={20} color={theme.colors.brandGreen} strokeWidth={2} />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{profile.phone}</Text>
                      </View>
                    </View>
                  )}

                  <View style={[styles.separator, { marginVertical: 8 }]} />

                  <View style={styles.infoItem}>
                    <View style={[styles.iconContainer, { backgroundColor: '#f3f4f6' }]}>
                      <User size={20} color={theme.colors.text.secondary} strokeWidth={2} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Member Since</Text>
                      <Text style={styles.infoValue}>
                        {new Date(profile.join_date || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>

                <View style={styles.infoCard}>
                  <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                    <View style={[styles.iconContainer, { backgroundColor: '#fff7ed' }]}>
                      <Bell size={20} color="#ea580c" strokeWidth={2} />
                    </View>
                    <Text style={styles.settingLabel}>Notifications</Text>
                    <ChevronRight size={20} color={theme.colors.gray400} />
                  </TouchableOpacity>

                  <View style={[styles.separator, { marginVertical: 4 }]} />

                  <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
                    <View style={[styles.iconContainer, { backgroundColor: '#fdf2f8' }]}>
                      <Lock size={20} color="#db2777" strokeWidth={2} />
                    </View>
                    <Text style={styles.settingLabel}>Privacy & Security</Text>
                    <ChevronRight size={20} color={theme.colors.gray400} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                  <LogOut size={20} color="#ef4444" strokeWidth={2} />
                  <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>NewHope App v1.0.0</Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text.primary,
    letterSpacing: -1,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    ...theme.shadows.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.white,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: theme.colors.white,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 36,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.brandGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  profileHeaderInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  memberBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
    fontFamily: theme.typography.fonts.serif.split(',')[0].replace(/"/g, ''),
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.gray100,
    width: '100%',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 16,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.gray400,
  },
});