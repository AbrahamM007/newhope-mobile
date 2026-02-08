import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Clock, MapPin, Music } from 'lucide-react-native';
import { chatService, Message, Conversation } from '@/lib/chat-service';
import { useAuth } from '@/context/AuthContext';

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user?.id) {
      loadChat();
    }
  }, [id, user?.id]);

  const loadChat = async () => {
    try {
      setLoading(true);
      if (!id) return;

      const msgs = await chatService.getMessages(id);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user?.id || !id) return;

    try {
      await chatService.sendMessage(id, user.id, messageText);
      setMessageText('');
      await loadChat();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender_id === user?.id;
    const showTimestamp = index === 0 ||
      new Date(messages[index - 1].created_at).getTime() - new Date(item.created_at).getTime() > 5 * 60000;

    return (
      <View>
        {showTimestamp && (
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString()}
          </Text>
        )}
        <View style={[styles.messageBubbleRow, isOwn && styles.ownRow]}>
          <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
            <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{conversation?.title || 'Chat'}</Text>
          {conversation?.type === 'SERVICE' && (
            <View style={styles.serviceInfo}>
              <Clock size={12} color="#666" />
              <Text style={styles.serviceTime}>Sunday 9:00 AM</Text>
            </View>
          )}
        </View>
      </View>

      {conversation?.type === 'SERVICE' && (
        <View style={styles.serviceHeader}>
          <View style={styles.serviceHeaderItem}>
            <Clock size={16} color="#0066cc" />
            <View>
              <Text style={styles.serviceLabel}>Call Time</Text>
              <Text style={styles.serviceValue}>8:30 AM</Text>
            </View>
          </View>
          <View style={styles.serviceHeaderItem}>
            <MapPin size={16} color="#0066cc" />
            <View>
              <Text style={styles.serviceLabel}>Location</Text>
              <Text style={styles.serviceValue}>Main Stage</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.serviceHeaderItem}>
            <Music size={16} color="#0066cc" />
            <View>
              <Text style={styles.serviceLabel}>Setlist</Text>
              <Text style={styles.serviceValue}>View</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  serviceTime: {
    fontSize: 12,
    color: '#666',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    gap: 12,
  },
  serviceHeaderItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  serviceValue: {
    fontSize: 13,
    color: '#0066cc',
    fontWeight: '600',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timestamp: {
    textAlign: 'center',
    fontSize: 11,
    color: '#999',
    marginVertical: 8,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    marginVertical: 6,
    justifyContent: 'flex-start',
  },
  ownRow: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#0066cc',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#e9ecef',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
});
