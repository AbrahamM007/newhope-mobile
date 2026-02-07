import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Play, Calendar, User, Filter } from 'lucide-react-native';
import theme from '@/lib/theme';

export default function MediaScreen() {
  const [media, setMedia] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [series, setSeries] = useState<string[]>([]);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    if (!supabase) {
      console.warn('Supabase not initialized. Media features will be disabled.');
      return;
    }

    try {
      const { data } = await supabase
        .from('media')
        .select('*')
        .order('date_recorded', { ascending: false });

      setMedia(data || []);

      const uniqueSeries = Array.from(new Set(data?.map((m: any) => m.series_name).filter(Boolean)));
      setSeries(uniqueSeries as string[]);
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedia();
    setRefreshing(false);
  };

  const filteredMedia = selectedSeries
    ? media.filter((m) => m.series_name === selectedSeries)
    : media;

  const renderMediaCard = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.mediaCard}>
      {item.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Play size={40} color="#2563eb" fill="#2563eb" strokeWidth={2} />
        </View>
      )}

      <View style={styles.playOverlay} />

      <View style={styles.mediaInfo}>
        <Text style={styles.mediaTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.mediaMeta}>
          {item.speaker_name && (
            <View style={styles.metaItem}>
              <User size={11} color="#999" strokeWidth={2} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.speaker_name}
              </Text>
            </View>
          )}
          {item.date_recorded && (
            <View style={styles.metaItem}>
              <Calendar size={11} color="#999" strokeWidth={2} />
              <Text style={styles.metaText}>
                {new Date(item.date_recorded).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Media & Teaching</Text>
      </View>

      {series.length > 0 && (
        <View style={styles.seriesFilter}>
          <TouchableOpacity
            style={[
              styles.seriesChip,
              selectedSeries === null && styles.seriesChipActive,
            ]}
            onPress={() => setSelectedSeries(null)}
          >
            <Text
              style={[
                styles.seriesChipText,
                selectedSeries === null && styles.seriesChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {series.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.seriesChip,
                selectedSeries === s && styles.seriesChipActive,
              ]}
              onPress={() => setSelectedSeries(s)}
            >
              <Text
                style={[
                  styles.seriesChipText,
                  selectedSeries === s && styles.seriesChipTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredMedia}
        renderItem={({ item }) => renderMediaCard(item)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No media available</Text>
        }
        numColumns={2}
      />
    </SafeAreaView>
  );
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.sizes['2xl'],
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text.primary,
  },
  seriesFilter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  seriesChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  seriesChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  seriesChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  seriesChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 8,
  },
  mediaCard: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  thumbnailPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mediaInfo: {
    padding: 10,
  },
  mediaTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 16,
  },
  mediaMeta: {
    gap: 4,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: '#999',
    flex: 1,
  },
  description: {
    fontSize: 10,
    color: '#666',
    lineHeight: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginTop: 40,
  },
});