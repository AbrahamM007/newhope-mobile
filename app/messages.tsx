import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Send, Users, User, UsersRound, Hand, SmilePlus } from 'lucide-react-native';

const brandGreen = '#15803d';
const brandDark = '#1a1a1a';

const MOCK_CONVERSATIONS = [
  { id: '1', name: 'Sarah Johnson', type: 'dm', lastMessage: 'See you at practice tonight!', time: '2m ago', unread: 2 },
  { id: '2', name: 'Worship Team', type: 'group', lastMessage: 'Mike: Updated the setlist for Sunday', time: '15m ago', unread: 5 },
  { id: '3', name: 'Sunday 9AM Team', type: 'team', lastMessage: 'Call time is 7:30 AM', time: '1h ago', unread: 0 },
  { id: '4', name: 'Pastor Mike', type: 'dm', lastMessage: 'Great job leading worship today', time: '3h ago', unread: 0 },
  { id: '5', name: 'Youth Leaders', type: 'group', lastMessage: 'Emily: Who can help with setup Friday?', time: '5h ago', unread: 1 },
  { id: '6', name: 'Prayer Circle', type: 'group', lastMessage: 'David: Praying for you all', time: '1d ago', unread: 0 },
];

const MOCK_MESSAGES = [
  { id: '1', sender: 'Sarah', content: 'Hey! Are you coming to practice tonight?', time: '6:30 PM', isMine: false, isPrayer: false, reactions: [] },
  { id: '2', sender: 'Me', content: "Yes! I'll be there at 7. Should I bring my capo?", time: '6:32 PM', isMine: true, isPrayer: false, reactions: ['👍', '🎸'] },
  { id: '3', sender: 'Sarah', content: "Yes please! We're doing Way Maker in E", time: '6:33 PM', isMine: false, isPrayer: false, reactions: [] },
  { id: '4', sender: 'Me', content: 'Perfect, see you there!', time: '6:35 PM', isMine: true, isPrayer: false, reactions: [] },
  { id: '5', sender: 'Sarah', content: 'Please keep my family in your prayers this week', time: '6:38 PM', isMine: false, isPrayer: true, reactions: ['🙏'] },
  { id: '6', sender: 'Sarah', content: 'See you at practice tonight!', time: '6:40 PM', isMine: false, isPrayer: false, reactions: [] },
];

const TABS = ['All', 'Direct', 'Groups', 'Teams'];

const getInitials = (name: string) => {
  const parts = name.split(' ');
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0][0];
};

const TypeIcon = ({ type }: { type: string }) => {
  if (type === 'group') return <Users size={14} color="#6b7280" />;
  if (type === 'team') return <UsersRound size={14} color="#6b7280" />;
  return <User size={14} color="#6b7280" />;
};

export default function MessagesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('All');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [prayedMessages, setPrayedMessages] = useState<string[]>([]);

  const filteredConversations = MOCK_CONVERSATIONS.filter((c) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Direct') return c.type === 'dm';
    if (activeTab === 'Groups') return c.type === 'group';
    if (activeTab === 'Teams') return c.type === 'team';
    return true;
  });

  const selectedConversation = MOCK_CONVERSATIONS.find((c) => c.id === selectedChat);

  const handlePrayed = (msgId: string) => {
    setPrayedMessages((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  if (selectedChat && selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedChat(null)} style={styles.backBtn}>
            <ArrowLeft size={24} color={brandDark} />
          </TouchableOpacity>
          <View style={styles.chatHeaderAvatar}>
            <Text style={styles.chatHeaderInitials}>{getInitials(selectedConversation.name)}</Text>
          </View>
          <Text style={styles.chatHeaderName}>{selectedConversation.name}</Text>
        </View>
        <FlatList
          data={MOCK_MESSAGES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}>
              <View style={[styles.messageBubble, item.isMine ? styles.myBubble : styles.theirBubble]}>
                <Text style={[styles.messageText, item.isMine ? styles.myText : styles.theirText]}>
                  {item.content}
                </Text>
                <Text style={[styles.messageTime, item.isMine ? styles.myTimeText : styles.theirTimeText]}>
                  {item.time}
                </Text>
                {item.reactions.length > 0 && (
                  <View style={styles.reactionsRow}>
                    {item.reactions.map((r, i) => (
                      <View key={i} style={styles.reactionChip}>
                        <Text style={styles.reactionText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {item.isPrayer && (
                  <TouchableOpacity
                    style={[styles.prayedBtn, prayedMessages.includes(item.id) && styles.prayedBtnActive]}
                    onPress={() => handlePrayed(item.id)}
                  >
                    <Hand size={14} color={prayedMessages.includes(item.id) ? '#fff' : brandGreen} />
                    <Text style={[styles.prayedBtnText, prayedMessages.includes(item.id) && styles.prayedBtnTextActive]}>
                      I Prayed
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Sarah is typing...</Text>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity style={styles.sendBtn}>
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={brandDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.newMsgBtn}>
          <Plus size={22} color={brandGreen} />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.conversationRow} onPress={() => setSelectedChat(item.id)}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
            <View style={styles.conversationInfo}>
              <View style={styles.conversationTop}>
                <View style={styles.nameRow}>
                  <Text style={styles.conversationName} numberOfLines={1}>{item.name}</Text>
                  <TypeIcon type={item.type} />
                </View>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
              <View style={styles.conversationBottom}>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: brandDark },
  newMsgBtn: { padding: 4 },
  tabsContainer: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  tabChipActive: { backgroundColor: brandGreen },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  listContent: { paddingTop: 4 },
  conversationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: brandGreen, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  conversationInfo: { flex: 1 },
  conversationTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  conversationName: { fontSize: 16, fontWeight: '600', color: brandDark, flexShrink: 1 },
  timeText: { fontSize: 12, color: '#9ca3af' },
  conversationBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: '#6b7280', flex: 1, marginRight: 8 },
  unreadBadge: { backgroundColor: brandGreen, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  chatHeaderAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: brandGreen, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  chatHeaderInitials: { color: '#fff', fontSize: 14, fontWeight: '700' },
  chatHeaderName: { fontSize: 18, fontWeight: '600', color: brandDark },
  messagesList: { padding: 16, paddingBottom: 8 },
  messageBubbleRow: { marginBottom: 12 },
  myRow: { alignItems: 'flex-end' },
  theirRow: { alignItems: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: brandGreen, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#f3f4f6', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myText: { color: '#fff' },
  theirText: { color: brandDark },
  messageTime: { fontSize: 11, marginTop: 4 },
  myTimeText: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  theirTimeText: { color: '#9ca3af' },
  reactionsRow: { flexDirection: 'row', marginTop: 6, gap: 4 },
  reactionChip: { backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  reactionText: { fontSize: 12 },
  prayedBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: brandGreen, alignSelf: 'flex-start' },
  prayedBtnActive: { backgroundColor: brandGreen, borderColor: brandGreen },
  prayedBtnText: { fontSize: 12, fontWeight: '600', color: brandGreen },
  prayedBtnTextActive: { color: '#fff' },
  typingIndicator: { paddingHorizontal: 20, paddingVertical: 4 },
  typingText: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 10 },
  textInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: brandDark },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: brandGreen, alignItems: 'center', justifyContent: 'center' },
});
