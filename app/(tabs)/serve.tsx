import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, Check, X, Music, Users, Heart, Plus, FileText, MapPin, Award, ChevronRight, Play } from 'lucide-react-native';
import theme from '@/lib/theme';

const MOCK_SCHEDULE = [
  { id: '1', date: '2026-02-16', service: 'Sunday 9AM', role: 'Acoustic Guitar', status: 'pending', location: 'Main Auditorium' },
  { id: '2', date: '2026-02-16', service: 'Sunday 11AM', role: 'Acoustic Guitar', status: 'confirmed', location: 'Main Auditorium' },
  { id: '3', date: '2026-02-23', service: 'Sunday 9AM', role: 'Worship Leader', status: 'pending', location: 'Main Auditorium' },
];
const MOCK_SERVICES = [
  { id: '1', title: 'Sunday Service', date: '2026-02-16', time: '9:00 AM', series: 'Walking in Faith', status: 'confirmed', songs: 4, team: 8, files: 3 },
  { id: '2', title: 'Sunday Service', date: '2026-02-16', time: '11:00 AM', series: 'Walking in Faith', status: 'draft', songs: 4, team: 6, files: 2 },
  { id: '3', title: 'Wednesday Night', date: '2026-02-19', time: '7:00 PM', series: 'Prayer & Worship', status: 'draft', songs: 3, team: 5, files: 1 },
];
const MOCK_TRAINING = [
  { id: '1', title: 'Volunteer Orientation', description: 'Introduction to serving at NewHope', duration: 30, completed: true },
  { id: '2', title: 'Safety & Security', description: 'Emergency procedures and child safety', duration: 20, completed: true },
  { id: '3', title: 'Worship Team Standards', description: 'Musical and spiritual preparation guidelines', duration: 25, completed: false },
  { id: '4', title: 'Tech & Production', description: 'Sound, lighting, and media basics', duration: 45, completed: false },
];

type SubTab = 'schedule' | 'services' | 'training';
const fmtMonth = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
const fmtDay = (d: string) => new Date(d + 'T00:00:00').getDate().toString();
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const svcColor = (s: string) => s === 'confirmed' ? theme.colors.brandGreen : s === 'live' ? theme.colors.info : theme.colors.warning;
const svcBg = (s: string) => s === 'confirmed' ? '#ecfdf5' : s === 'live' ? '#eff6ff' : '#fffbeb';

export default function ServeScreen() {
  const [activeTab, setActiveTab] = useState<SubTab>('schedule');
  const [schedule, setSchedule] = useState(MOCK_SCHEDULE);
  const [selectedService, setSelectedService] = useState<typeof MOCK_SERVICES[0] | null>(null);
  const [detailTab, setDetailTab] = useState<'setlist' | 'team' | 'runsheet'>('setlist');
  const done = MOCK_TRAINING.filter(t => t.completed).length;
  const total = MOCK_TRAINING.length;
  const tabs: { key: SubTab; label: string }[] = [
    { key: 'schedule', label: 'My Schedule' }, { key: 'services', label: 'Services' }, { key: 'training', label: 'Training' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.banner}>
          <Heart size={28} color={theme.colors.white} />
          <Text style={s.bannerTitle}>Your Ministry Matters</Text>
          <Text style={s.bannerSub}>Manage your serving schedule and worship planning</Text>
        </View>
        <View style={s.tabRow}>
          {tabs.map(t => (
            <TouchableOpacity key={t.key} style={[s.subTab, activeTab === t.key && s.subTabOn]} onPress={() => setActiveTab(t.key)}>
              <Text style={[s.subTabTxt, activeTab === t.key && s.subTabTxtOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.content}>
          {activeTab === 'schedule' && (schedule.length === 0 ? (
            <View style={s.empty}><Calendar size={48} color={theme.colors.gray300} /><Text style={s.emptyTxt}>No upcoming assignments</Text></View>
          ) : schedule.map(item => (
            <View key={item.id} style={s.schCard}>
              <View style={s.dateBadge}>
                <Text style={s.dateM}>{fmtMonth(item.date)}</Text>
                <Text style={s.dateD}>{fmtDay(item.date)}</Text>
              </View>
              <View style={s.schInfo}>
                <Text style={s.schTitle}>{item.service}</Text>
                <View style={s.row}><Music size={13} color={theme.colors.brandGreen} /><Text style={s.schRole}>{item.role}</Text></View>
                <View style={s.row}><MapPin size={13} color={theme.colors.gray400} /><Text style={s.schMeta}>{item.location}</Text></View>
                {item.status === 'pending' ? (
                  <View style={s.actRow}>
                    <TouchableOpacity style={s.cfmBtn} onPress={() => setSchedule(p => p.map(x => x.id === item.id ? { ...x, status: 'confirmed' } : x))}>
                      <Check size={14} color={theme.colors.white} /><Text style={s.cfmTxt}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.decBtn} onPress={() => setSchedule(p => p.map(x => x.id === item.id ? { ...x, status: 'declined' } : x))}>
                      <X size={14} color={theme.colors.error} /><Text style={s.decTxt}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[s.stBadge, { backgroundColor: item.status === 'confirmed' ? '#ecfdf5' : '#fef2f2' }]}>
                    <Text style={[s.stTxt, { color: item.status === 'confirmed' ? theme.colors.brandGreen : theme.colors.error }]}>
                      {item.status === 'confirmed' ? 'Confirmed' : 'Declined'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )))}
          {activeTab === 'services' && (<>
            {MOCK_SERVICES.map(svc => (
              <TouchableOpacity key={svc.id} style={s.svcCard} onPress={() => { setSelectedService(svc); setDetailTab('setlist'); }} activeOpacity={0.7}>
                <View style={s.svcTop}>
                  <View style={s.svcLeft}>
                    <Text style={s.svcTitle}>{svc.title}</Text>
                    <Text style={s.svcSeries}>{svc.series}</Text>
                    <View style={s.row}><Calendar size={13} color={theme.colors.gray400} /><Text style={s.svcMeta}>{fmtDate(svc.date)} at {svc.time}</Text></View>
                  </View>
                  <View style={[s.svcStBadge, { backgroundColor: svcBg(svc.status) }]}>
                    <Text style={[s.svcStTxt, { color: svcColor(svc.status) }]}>{svc.status.charAt(0).toUpperCase() + svc.status.slice(1)}</Text>
                  </View>
                </View>
                <View style={s.svcStats}>
                  <View style={s.stat}><Music size={14} color={theme.colors.brandGreen} /><Text style={s.statTxt}>{svc.songs} songs</Text></View>
                  <View style={s.stat}><Users size={14} color={theme.colors.brandGreen} /><Text style={s.statTxt}>{svc.team} team</Text></View>
                  <View style={s.stat}><FileText size={14} color={theme.colors.brandGreen} /><Text style={s.statTxt}>{svc.files} files</Text></View>
                  <ChevronRight size={18} color={theme.colors.gray300} style={s.chev} />
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.fab}><Plus size={24} color={theme.colors.white} /></TouchableOpacity>
          </>)}
          {activeTab === 'training' && (<>
            <View style={s.progCard}>
              <View style={s.progHead}><Text style={s.progTitle}>Your Progress</Text><Text style={s.progCount}>{done}/{total} modules</Text></View>
              <View style={s.progBg}><View style={[s.progFill, { width: `${(done / total) * 100}%` }]} /></View>
              {done === total && <View style={s.allDone}><Award size={16} color={theme.colors.brandGreen} /><Text style={s.allDoneTxt}>All modules completed!</Text></View>}
            </View>
            {MOCK_TRAINING.map(mod => (
              <View key={mod.id} style={s.trCard}>
                <View style={[s.trIcon, mod.completed && s.trIconDone]}>
                  {mod.completed ? <Check size={18} color={theme.colors.white} /> : <Play size={18} color={theme.colors.brandGreen} />}
                </View>
                <View style={s.trInfo}>
                  <Text style={s.trTitle}>{mod.title}</Text>
                  <Text style={s.trDesc}>{mod.description}</Text>
                  <View style={s.trMeta}>
                    <Clock size={12} color={theme.colors.gray400} /><Text style={s.trDur}>{mod.duration} min</Text>
                    <View style={[s.trSt, { backgroundColor: mod.completed ? '#ecfdf5' : '#f3f4f6' }]}>
                      <Text style={[s.trStTxt, { color: mod.completed ? theme.colors.brandGreen : theme.colors.gray500 }]}>{mod.completed ? 'Completed' : 'Not Started'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>)}
        </View>
      </ScrollView>
      <Modal visible={!!selectedService} animationType="slide" transparent>
        <View style={s.modalOv}>
          <View style={s.modalSheet}>
            <View style={s.modalHead}>
              <TouchableOpacity onPress={() => setSelectedService(null)}><X size={22} color={theme.colors.gray600} /></TouchableOpacity>
              <Text style={s.modalTitle}>{selectedService?.title} - {selectedService?.time}</Text>
              <View style={{ width: 22 }} />
            </View>
            <View style={s.dtTabs}>
              {(['setlist', 'team', 'runsheet'] as const).map(dt => (
                <TouchableOpacity key={dt} style={[s.dtTab, detailTab === dt && s.dtTabOn]} onPress={() => setDetailTab(dt)}>
                  <Text style={[s.dtTabTxt, detailTab === dt && s.dtTabTxtOn]}>{dt === 'setlist' ? 'Setlist' : dt === 'team' ? 'Team' : 'Run of Show'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.dtContent}>
              <Text style={s.dtPlace}>
                {detailTab === 'setlist' ? `${selectedService?.songs} songs planned for this service` : detailTab === 'team' ? `${selectedService?.team} team members assigned` : 'Service run-of-show details coming soon'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.secondary },
  banner: { backgroundColor: theme.colors.brandGreen, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  bannerTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.white, marginTop: 10 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 20, backgroundColor: theme.colors.gray100, borderRadius: 12, padding: 4 },
  subTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  subTabOn: { backgroundColor: theme.colors.white, ...theme.shadows.sm },
  subTabTxt: { fontSize: 13, fontWeight: '500', color: theme.colors.gray500 },
  subTabTxtOn: { color: theme.colors.brandGreen, fontWeight: '600' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTxt: { fontSize: 16, fontWeight: '600', color: theme.colors.gray500, marginTop: 12 },
  schCard: { flexDirection: 'row', backgroundColor: theme.colors.white, borderRadius: 12, padding: 14, marginBottom: 10, ...theme.shadows.sm },
  dateBadge: { width: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', borderRadius: 10, paddingVertical: 8, marginRight: 14 },
  dateM: { fontSize: 11, fontWeight: '700', color: theme.colors.brandGreen },
  dateD: { fontSize: 22, fontWeight: '700', color: theme.colors.brandDark },
  schInfo: { flex: 1 },
  schTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.brandDark },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  schRole: { fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary },
  schMeta: { fontSize: 12, color: theme.colors.gray400 },
  actRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  cfmBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.colors.brandGreen, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  cfmTxt: { fontSize: 12, fontWeight: '600', color: theme.colors.white },
  decBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fef2f2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca' },
  decTxt: { fontSize: 12, fontWeight: '600', color: theme.colors.error },
  stBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 10 },
  stTxt: { fontSize: 11, fontWeight: '600' },
  svcCard: { backgroundColor: theme.colors.white, borderRadius: 12, padding: 14, marginBottom: 10, ...theme.shadows.sm },
  svcTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  svcLeft: { flex: 1 },
  svcTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.brandDark },
  svcSeries: { fontSize: 13, color: theme.colors.brandGreen, fontWeight: '500', marginTop: 2 },
  svcMeta: { fontSize: 12, color: theme.colors.gray500 },
  svcStBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  svcStTxt: { fontSize: 11, fontWeight: '600' },
  svcStats: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border.light },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statTxt: { fontSize: 12, color: theme.colors.gray500 },
  chev: { marginLeft: 'auto' },
  fab: { alignSelf: 'center', backgroundColor: theme.colors.brandGreen, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: 16, ...theme.shadows.md },
  progCard: { backgroundColor: theme.colors.white, borderRadius: 12, padding: 16, marginBottom: 16, ...theme.shadows.sm },
  progHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.brandDark },
  progCount: { fontSize: 13, fontWeight: '500', color: theme.colors.brandGreen },
  progBg: { height: 8, backgroundColor: theme.colors.gray100, borderRadius: 4, overflow: 'hidden' },
  progFill: { height: 8, backgroundColor: theme.colors.brandGreen, borderRadius: 4 },
  allDone: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  allDoneTxt: { fontSize: 12, fontWeight: '600', color: theme.colors.brandGreen },
  trCard: { flexDirection: 'row', backgroundColor: theme.colors.white, borderRadius: 12, padding: 14, marginBottom: 10, ...theme.shadows.sm },
  trIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  trIconDone: { backgroundColor: theme.colors.brandGreen },
  trInfo: { flex: 1 },
  trTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.brandDark },
  trDesc: { fontSize: 12, color: theme.colors.gray500, marginTop: 2 },
  trMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  trDur: { fontSize: 11, color: theme.colors.gray400 },
  trSt: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginLeft: 6 },
  trStTxt: { fontSize: 10, fontWeight: '600' },
  modalOv: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: theme.colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 380, paddingBottom: 32 },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border.light },
  modalTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.brandDark },
  dtTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border.light, paddingHorizontal: 16 },
  dtTab: { paddingVertical: 12, paddingHorizontal: 14, marginRight: 4 },
  dtTabOn: { borderBottomWidth: 2, borderBottomColor: theme.colors.brandGreen },
  dtTabTxt: { fontSize: 13, fontWeight: '500', color: theme.colors.gray500 },
  dtTabTxtOn: { color: theme.colors.brandGreen, fontWeight: '600' },
  dtContent: { padding: 24, alignItems: 'center' },
  dtPlace: { fontSize: 14, color: theme.colors.gray500, textAlign: 'center' },
});
