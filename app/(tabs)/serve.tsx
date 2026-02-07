import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { worshipAPI, servingAPI } from '@/lib/api';
import {
  Calendar,
  Clock,
  Check,
  X,
  Music,
  Users,
  Heart,
  Plus,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import theme from '@/lib/theme';

interface ServingAssignment {
  id: string;
  date: string;
  role: string;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  notes?: string;
  service?: { title: string; day: string; time: string };
  ministry?: { name: string };
}

interface WorshipService {
  id: string;
  title: string;
  date: string;
  status: 'PLANNING' | 'READY' | 'COMPLETED';
  notes?: string;
  songs: WorshipSong[];
  members: ServiceMember[];
  files: ServiceFile[];
  _count: { songs: number; members: number; files: number };
}

interface WorshipSong {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  bpm?: number;
  order: number;
}

interface ServiceMember {
  id: string;
  userId: string;
  instrument: string;
  status: string;
  user?: { id: string; firstName: string; lastName: string; avatar?: string };
}

interface ServiceFile {
  id: string;
  name: string;
  url: string;
  type: string;
}

export default function ServeScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my' | 'worship'>('my');
  const [assignments, setAssignments] = useState<ServingAssignment[]>([]);
  const [worshipServices, setWorshipServices] = useState<WorshipService[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedService, setSelectedService] = useState<WorshipService | null>(null);

  // Create service form
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [newNotes, setNewNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isLeader = user?.roles?.includes('LEADER') || user?.roles?.includes('ADMIN');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, worshipData] = await Promise.all([
        servingAPI.getMySchedule(true).catch(() => []),
        worshipAPI.getAll(true).catch(() => []),
      ]);
      setAssignments(assignmentsData || []);
      setWorshipServices(worshipData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRespond = async (assignmentId: string, status: 'CONFIRMED' | 'DECLINED') => {
    try {
      await servingAPI.respond(assignmentId, status);
      await loadData();
    } catch (error) {
      console.error('Error responding:', error);
    }
  };

  const handleCreateService = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      await worshipAPI.create({
        title: newTitle.trim(),
        date: newDate.toISOString(),
        notes: newNotes.trim() || undefined,
      });
      setNewTitle('');
      setNewNotes('');
      setNewDate(new Date());
      setShowCreateModal(false);
      await loadData();
    } catch (error) {
      console.error('Error creating service:', error);
      Alert.alert('Error', 'Failed to create service');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'READY':
        return '#228B22';
      case 'DECLINED':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const renderAssignment = ({ item }: { item: ServingAssignment }) => {
    const assignmentDate = new Date(item.date);
    const isPending = item.status === 'PENDING';

    return (
      <View style={styles.card}>
        <View style={styles.dateColumn}>
          <Text style={styles.dateMonth}>
            {assignmentDate.toLocaleDateString('en-US', { month: 'short' })}
          </Text>
          <Text style={styles.dateDay}>{assignmentDate.getDate()}</Text>
        </View>

        <View style={styles.detailsColumn}>
          <View style={styles.roleRow}>
            <Music size={16} color="#228B22" />
            <Text style={styles.roleText}>{item.role}</Text>
          </View>

          {item.service && (
            <Text style={styles.serviceName}>{item.service.title}</Text>
          )}

          {isPending ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleRespond(item.id, 'CONFIRMED')}
              >
                <Check size={14} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => handleRespond(item.id, 'DECLINED')}
              >
                <X size={14} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderWorshipService = ({ item }: { item: WorshipService }) => {
    const serviceDate = new Date(item.date);

    return (
      <TouchableOpacity
        style={styles.worshipCard}
        onPress={() => setSelectedService(item)}
      >
        <View style={styles.worshipHeader}>
          <View>
            <Text style={styles.worshipTitle}>{item.title}</Text>
            <View style={styles.worshipMeta}>
              <Calendar size={12} color="#666" />
              <Text style={styles.worshipDate}>
                {serviceDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.worshipStats}>
          <View style={styles.stat}>
            <Music size={14} color="#228B22" />
            <Text style={styles.statText}>{item._count?.songs || 0} songs</Text>
          </View>
          <View style={styles.stat}>
            <Users size={14} color="#228B22" />
            <Text style={styles.statText}>{item._count?.members || 0} team</Text>
          </View>
          <View style={styles.stat}>
            <FileText size={14} color="#228B22" />
            <Text style={styles.statText}>{item._count?.files || 0} files</Text>
          </View>
        </View>

        <ChevronRight size={20} color="#ccc" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Serve</Text>
        {isLeader && activeTab === 'worship' && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Schedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'worship' && styles.activeTab]}
          onPress={() => setActiveTab('worship')}
        >
          <Text style={[styles.tabText, activeTab === 'worship' && styles.activeTabText]}>
            Worship Services
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'my' ? (
        <FlatList
          data={assignments}
          renderItem={renderAssignment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Heart size={48} color="#ccc" />
                <Text style={styles.emptyText}>No upcoming assignments</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={worshipServices}
          renderItem={renderWorshipService}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Music size={48} color="#ccc" />
                <Text style={styles.emptyText}>No worship services</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Create Service Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Service</Text>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleCreateService}
              >
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sunday Worship"
                placeholderTextColor="#999"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.label}>Date & Time *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color="#228B22" />
                <Text style={styles.dateButtonText}>
                  {newDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={newDate}
                  mode="datetime"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setNewDate(date);
                  }}
                />
              )}

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Special instructions for the team..."
                placeholderTextColor="#999"
                multiline
                value={newNotes}
                onChangeText={setNewNotes}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Service Detail Modal */}
      <Modal visible={!!selectedService} animationType="slide">
        <ServiceDetailView
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onUpdate={loadData}
          isLeader={isLeader}
        />
      </Modal>
    </SafeAreaView>
  );
}

// Service Detail Component
function ServiceDetailView({
  service,
  onClose,
  onUpdate,
  isLeader,
}: {
  service: WorshipService | null;
  onClose: () => void;
  onUpdate: () => void;
  isLeader: boolean;
}) {
  const [activeSection, setActiveSection] = useState<'songs' | 'team' | 'files'>('songs');
  const [showAddSong, setShowAddSong] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongKey, setNewSongKey] = useState('');

  if (!service) return null;

  const handleAddSong = async () => {
    if (!newSongTitle.trim()) return;

    try {
      await worshipAPI.addSong(service.id, {
        title: newSongTitle.trim(),
        artist: newSongArtist.trim() || undefined,
        key: newSongKey.trim() || undefined,
      });
      setNewSongTitle('');
      setNewSongArtist('');
      setNewSongKey('');
      setShowAddSong(false);
      onUpdate();
    } catch (error) {
      console.error('Error adding song:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.detailTitleContainer}>
          <Text style={styles.detailTitle}>{service.title}</Text>
          <Text style={styles.detailDate}>
            {new Date(service.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>

      <View style={styles.sectionTabs}>
        <TouchableOpacity
          style={[styles.sectionTab, activeSection === 'songs' && styles.activeSectionTab]}
          onPress={() => setActiveSection('songs')}
        >
          <Music size={16} color={activeSection === 'songs' ? '#228B22' : '#666'} />
          <Text style={[styles.sectionTabText, activeSection === 'songs' && styles.activeSectionTabText]}>
            Songs ({service.songs?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionTab, activeSection === 'team' && styles.activeSectionTab]}
          onPress={() => setActiveSection('team')}
        >
          <Users size={16} color={activeSection === 'team' ? '#228B22' : '#666'} />
          <Text style={[styles.sectionTabText, activeSection === 'team' && styles.activeSectionTabText]}>
            Team ({service.members?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionTab, activeSection === 'files' && styles.activeSectionTab]}
          onPress={() => setActiveSection('files')}
        >
          <FileText size={16} color={activeSection === 'files' ? '#228B22' : '#666'} />
          <Text style={[styles.sectionTabText, activeSection === 'files' && styles.activeSectionTabText]}>
            Files ({service.files?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.sectionContent}>
        {activeSection === 'songs' && (
          <>
            {isLeader && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddSong(true)}
              >
                <Plus size={18} color="#228B22" />
                <Text style={styles.addButtonText}>Add Song</Text>
              </TouchableOpacity>
            )}

            {service.songs?.map((song, index) => (
              <View key={song.id} style={styles.songItem}>
                <Text style={styles.songNumber}>{index + 1}</Text>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  {song.artist && (
                    <Text style={styles.songArtist}>{song.artist}</Text>
                  )}
                </View>
                {song.key && (
                  <View style={styles.keyBadge}>
                    <Text style={styles.keyText}>{song.key}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {activeSection === 'team' && (
          <>
            {isLeader && (
              <TouchableOpacity style={styles.addButton}>
                <Plus size={18} color="#228B22" />
                <Text style={styles.addButtonText}>Add Team Member</Text>
              </TouchableOpacity>
            )}

            {service.members?.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.avatarText}>
                    {member.user?.firstName?.charAt(0) || '?'}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.user?.firstName} {member.user?.lastName}
                  </Text>
                  <Text style={styles.memberInstrument}>{member.instrument}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColorForMember(member.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColorForMember(member.status) }]}>
                    {member.status}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeSection === 'files' && (
          <>
            {isLeader && (
              <TouchableOpacity style={styles.addButton}>
                <Plus size={18} color="#228B22" />
                <Text style={styles.addButtonText}>Upload File</Text>
              </TouchableOpacity>
            )}

            {service.files?.map((file) => (
              <TouchableOpacity key={file.id} style={styles.fileItem}>
                <FileText size={20} color="#228B22" />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.fileType}>{file.type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Add Song Modal */}
      <Modal visible={showAddSong} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddSong(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Song</Text>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddSong}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Song Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter song title"
              placeholderTextColor="#999"
              value={newSongTitle}
              onChangeText={setNewSongTitle}
            />

            <Text style={styles.label}>Artist</Text>
            <TextInput
              style={styles.input}
              placeholder="Artist name"
              placeholderTextColor="#999"
              value={newSongArtist}
              onChangeText={setNewSongArtist}
            />

            <Text style={styles.label}>Key</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., G, C#m"
              placeholderTextColor="#999"
              value={newSongKey}
              onChangeText={setNewSongKey}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStatusColorForMember(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return '#228B22';
    case 'DECLINED':
      return '#ef4444';
    default:
      return '#f59e0b';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text.primary,
  },
  createButton: {
    backgroundColor: '#228B22',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#228B22' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#666' },
  activeTabText: { color: '#228B22' },
  listContent: { padding: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  dateColumn: { width: 50, alignItems: 'center', marginRight: 14 },
  dateMonth: { fontSize: 11, fontWeight: '600', color: '#228B22', textTransform: 'uppercase' },
  dateDay: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  detailsColumn: { flex: 1 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  roleText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  serviceName: { fontSize: 13, color: '#666', marginBottom: 8 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#228B22',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  confirmButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  declineButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  worshipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  worshipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  worshipTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  worshipMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  worshipDate: { fontSize: 12, color: '#666' },
  worshipStats: { flexDirection: 'row', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, color: '#666' },
  chevron: { position: 'absolute', right: 14, top: '50%' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#333', marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, minHeight: 350 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  saveButton: { backgroundColor: '#228B22', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, color: '#333' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dateButton: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  dateButtonText: { fontSize: 14, color: '#333' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  detailTitleContainer: { marginLeft: 12 },
  detailTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  detailDate: { fontSize: 13, color: '#666', marginTop: 2 },
  sectionTabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  activeSectionTab: { borderBottomWidth: 2, borderBottomColor: '#228B22' },
  sectionTabText: { fontSize: 12, color: '#666' },
  activeSectionTabText: { color: '#228B22', fontWeight: '600' },
  sectionContent: { flex: 1, padding: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#228B22', borderRadius: 10, marginBottom: 12 },
  addButtonText: { color: '#228B22', fontWeight: '600' },
  songItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  songNumber: { width: 24, fontSize: 14, fontWeight: '600', color: '#228B22' },
  songInfo: { flex: 1 },
  songTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  songArtist: { fontSize: 12, color: '#666', marginTop: 2 },
  keyBadge: { backgroundColor: '#f0fff0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  keyText: { fontSize: 12, fontWeight: '600', color: '#228B22' },
  memberItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#228B22', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  memberInstrument: { fontSize: 12, color: '#666', marginTop: 2 },
  fileItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0' },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  fileType: { fontSize: 11, color: '#228B22', textTransform: 'uppercase', marginTop: 2 },
});