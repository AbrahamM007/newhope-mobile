import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Bell, Volume2, Clock } from 'lucide-react-native';
import { chatService, ChatSettings } from '@/lib/chat-service';
import { useAuth } from '@/context/AuthContext';

export default function ChatSettingsPanel() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    try {
      if (!user?.id) return;
      const data = await chatService.getChatSettings(user.id);
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading chat settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof ChatSettings, value: boolean | string) => {
    if (!user?.id || !settings) return;

    try {
      const updated = await chatService.updateChatSettings(user.id, { [key]: value });
      setSettings(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (loading || !settings) {
    return <Text style={styles.loadingText}>Loading settings...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell size={20} color="#0066cc" />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>

        <View style={styles.setting}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Direct Messages</Text>
            <Text style={styles.settingDescription}>Notify for 1:1 chats</Text>
          </View>
          <Switch
            value={settings.notify_dms && !settings.mute_all_notifications}
            onValueChange={(v) => updateSetting('notify_dms', v)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Group Chats</Text>
            <Text style={styles.settingDescription}>Ministry & community groups</Text>
          </View>
          <Switch
            value={settings.notify_groups && !settings.mute_all_notifications}
            onValueChange={(v) => updateSetting('notify_groups', v)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Service Chats</Text>
            <Text style={styles.settingDescription}>Upcoming service messages</Text>
          </View>
          <Switch
            value={settings.notify_services && !settings.mute_all_notifications}
            onValueChange={(v) => updateSetting('notify_services', v)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Announcements</Text>
            <Text style={styles.settingDescription}>Church-wide messages</Text>
          </View>
          <Switch
            value={settings.notify_announcements && !settings.mute_all_notifications}
            onValueChange={(v) => updateSetting('notify_announcements', v)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Prayer Requests</Text>
            <Text style={styles.settingDescription}>Community prayer updates</Text>
          </View>
          <Switch
            value={settings.notify_prayer && !settings.mute_all_notifications}
            onValueChange={(v) => updateSetting('notify_prayer', v)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Volume2 size={20} color="#0066cc" />
          <Text style={styles.sectionTitle}>Do Not Disturb</Text>
        </View>

        <View style={styles.setting}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Mute All Notifications</Text>
            <Text style={styles.settingDescription}>Disable all chat notifications</Text>
          </View>
          <Switch
            value={settings.mute_all_notifications}
            onValueChange={(v) => updateSetting('mute_all_notifications', v)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Quiet Hours</Text>
            <Text style={styles.settingDescription}>
              {settings.quiet_hours_enabled
                ? `${settings.quiet_hours_start} - ${settings.quiet_hours_end}`
                : 'Disabled'}
            </Text>
          </View>
          <Switch
            value={settings.quiet_hours_enabled}
            onValueChange={(v) => updateSetting('quiet_hours_enabled', v)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color="#0066cc" />
          <Text style={styles.sectionTitle}>Privacy</Text>
        </View>

        <View style={styles.setting}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Read Receipts (DM)</Text>
            <Text style={styles.settingDescription}>Let others see when you read DMs</Text>
          </View>
          <Switch
            value={settings.dm_read_receipts}
            onValueChange={(v) => updateSetting('dm_read_receipts', v)}
          />
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Service chat notifications are always enabled when scheduled, even if muted.
          Mentions in group chats may still notify you based on settings.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f9f9f9',
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  infoBox: {
    margin: 16,
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066cc',
  },
  infoText: {
    fontSize: 12,
    color: '#0066cc',
    lineHeight: 16,
  },
});
