import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Edit2, ChevronRight, LogOut, Lock, Users } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { useAuth } from '@/context/AuthContext';

const brandGreen = colors.brandGreen;
const brandDark = colors.brandDark;

const MOCK_HOUSEHOLD = [
  { name: 'John Doe', relationship: 'Head', avatar: null },
  { name: 'Jane Doe', relationship: 'Spouse', avatar: null },
  { name: 'Jake Doe', relationship: 'Child', avatar: null },
];

const AVATAR_BG = '#86efac';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'John Doe';
  const displayEmail = user?.email || 'john.doe@email.com';
  const displayPhone = '(555) 123-4567';
  const displayRole = user?.roles?.[0] || 'Member';
  const displayCampus = 'Main Campus';
  const memberSince = 'January 2020';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  const [notifications, setNotifications] = useState({
    social: true, serve: true, groups: true, announcements: true, prayer: false, messages: true,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true, phoneVisible: false, emailVisible: true, discoverable: true,
  });

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((p) => ({ ...p, [key]: !p[key] }));
  const togglePrivacy = (key: keyof typeof privacy) =>
    setPrivacy((p) => ({ ...p, [key]: !p[key] }));

  const notifRows = [
    { key: 'social' as const, label: 'Social' },
    { key: 'serve' as const, label: 'Serve' },
    { key: 'groups' as const, label: 'Groups' },
    { key: 'announcements' as const, label: 'Announcements' },
    { key: 'prayer' as const, label: 'Prayer' },
    { key: 'messages' as const, label: 'Messages' },
  ];

  const privacyRows = [
    { key: 'profileVisible' as const, label: 'Profile Visible' },
    { key: 'phoneVisible' as const, label: 'Phone Visible' },
    { key: 'emailVisible' as const, label: 'Email Visible' },
    { key: 'discoverable' as const, label: 'Discoverable in Directory' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={brandDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{displayRole}</Text></View>
            <Text style={styles.campusText}>{displayCampus}</Text>
          </View>
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Edit2 size={16} color={brandGreen} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{displayEmail}</Text></View>
            <View style={styles.divider} />
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{displayPhone}</Text></View>
            <View style={styles.divider} />
            <View style={styles.infoRow}><Text style={styles.infoLabel}>Member Since</Text><Text style={styles.infoValue}>{memberSince}</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household</Text>
          <View style={styles.infoCard}>
            {MOCK_HOUSEHOLD.map((h, i) => (
              <View key={h.name}>
                <View style={styles.householdRow}>
                  <View style={styles.avatarSm}>
                    <Text style={styles.avatarSmText}>{h.name.split(' ').map((n) => n[0]).join('')}</Text>
                  </View>
                  <View style={styles.householdInfo}>
                    <Text style={styles.householdName}>{h.name}</Text>
                    <Text style={styles.householdRelation}>{h.relationship}</Text>
                  </View>
                </View>
                {i < MOCK_HOUSEHOLD.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
            <TouchableOpacity style={styles.manageHousehold}>
              <Users size={16} color={brandGreen} />
              <Text style={styles.manageText}>Manage Household</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.infoCard}>
            {notifRows.map((r, i) => (
              <View key={r.key}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{r.label}</Text>
                  <Switch value={notifications[r.key]} onValueChange={() => toggleNotif(r.key)} trackColor={{ false: '#e0e0e0', true: '#86efac' }} thumbColor={notifications[r.key] ? brandGreen : '#f4f4f4'} />
                </View>
                {i < notifRows.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.infoCard}>
            {privacyRows.map((r, i) => (
              <View key={r.key}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{r.label}</Text>
                  <Switch value={privacy[r.key]} onValueChange={() => togglePrivacy(r.key)} trackColor={{ false: '#e0e0e0', true: '#86efac' }} thumbColor={privacy[r.key] ? brandGreen : '#f4f4f4'} />
                </View>
                {i < privacyRows.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity style={styles.accountRow}>
              <Lock size={18} color={brandDark} />
              <Text style={styles.accountRowText}>Change Password</Text>
              <ChevronRight size={18} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.accountRow} onPress={signOut}>
              <LogOut size={18} color="#ef4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
              <ChevronRight size={18} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.appInfo}>NewHope App v1.0.0</Text>
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
  profileCard: { alignItems: 'center', paddingVertical: 24, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  avatarLg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#86efac', alignItems: 'center', justifyContent: 'center' },
  avatarLgText: { fontSize: 28, fontWeight: '700', color: brandGreen },
  profileName: { fontSize: 20, fontWeight: '700', color: brandDark, marginTop: 12 },
  profileEmail: { fontSize: 14, color: '#666', marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f0fdf4' },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: brandGreen },
  campusText: { fontSize: 13, color: '#666' },
  memberSince: { fontSize: 12, color: '#999', marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: brandGreen, gap: 6 },
  editBtnText: { fontSize: 14, fontWeight: '600', color: brandGreen },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: brandDark, marginBottom: 10 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 14, fontWeight: '500', color: brandDark },
  divider: { height: 0.5, backgroundColor: '#f0f0f0', marginHorizontal: 12 },
  householdRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  avatarSm: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fcd34d', alignItems: 'center', justifyContent: 'center' },
  avatarSmText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  householdInfo: { marginLeft: 12 },
  householdName: { fontSize: 14, fontWeight: '600', color: brandDark },
  householdRelation: { fontSize: 12, color: '#666' },
  manageHousehold: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderTopWidth: 0.5, borderTopColor: '#f0f0f0', marginTop: 4 },
  manageText: { fontSize: 14, fontWeight: '600', color: brandGreen },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  toggleLabel: { fontSize: 14, color: brandDark },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, gap: 10 },
  accountRowText: { flex: 1, fontSize: 14, fontWeight: '500', color: brandDark },
  signOutText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#ef4444' },
  appInfo: { textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 30 },
});
