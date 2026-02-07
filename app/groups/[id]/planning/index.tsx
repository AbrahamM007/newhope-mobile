import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, CheckCircle, CircleDashed, Filter } from 'lucide-react-native';
import theme from '@/lib/theme';
import { worshipAPI } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function WorshipPlanningScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadServices = useCallback(async () => {
        try {
            const data = await worshipAPI.getAll(true).catch(() => null);
            if (data) setServices(data);
        } catch (_) {} finally { setLoading(false); }
    }, []);
    useEffect(() => { loadServices(); }, [loadServices]);

    const handleServicePress = (serviceId: string) => {
        router.push(`/groups/${id}/planning/${serviceId}` as any);
    };

    const renderService = ({ item }: { item: any }) => {
        const isConfirmed = item.status === 'Confirmed';

        return (
            <TouchableOpacity
                style={styles.serviceCard}
                activeOpacity={0.7}
                onPress={() => handleServicePress(item.id)}
            >
                <View style={styles.dateBox}>
                    <Text style={styles.dateMonth}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
                    <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
                </View>

                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>{item.title}</Text>
                    <Text style={styles.serviceSeries}>{item.series}</Text>
                    <View style={styles.timeRow}>
                        <Clock size={12} color={theme.colors.gray500} />
                        <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                </View>

                <View style={[styles.statusBadge, isConfirmed ? styles.statusConfirmed : styles.statusDraft]}>
                    {isConfirmed ? (
                        <CheckCircle size={12} color={theme.colors.brandGreen} />
                    ) : (
                        <CircleDashed size={12} color={theme.colors.text.tertiary} />
                    )}
                    <Text style={[styles.statusText, isConfirmed ? styles.statusTextConfirmed : styles.statusTextDraft]}>
                        {item.status}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Worship Planning</Text>
                        <Text style={styles.headerSubtitle}>Upcoming Services</Text>
                    </View>
                    <TouchableOpacity style={styles.filterButton}>
                        <Filter size={20} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={services}
                    renderItem={renderService}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.upcomingText}>UPCOMING</Text>
                        </View>
                    }
                />
            </SafeAreaView>

            {/* FAB */}
            <TouchableOpacity style={styles.fab}>
                <LinearGradient
                    colors={theme.colors.gradients?.primary || ['#15803d', '#166534']}
                    style={styles.fabGradient}
                >
                    <Calendar size={24} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    filterButton: {
        padding: 8,
        marginRight: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    list: {
        padding: theme.spacing.lg,
    },
    listHeader: {
        marginBottom: theme.spacing.md,
    },
    upcomingText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        letterSpacing: 1,
    },
    serviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        ...theme.shadows.sm,
    },
    dateBox: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.gray50,
        borderRadius: theme.borderRadius.lg,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginRight: 16,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        marginBottom: 2,
    },
    dateDay: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    serviceSeries: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 6,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 12,
        color: theme.colors.gray500,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        gap: 4,
    },
    statusConfirmed: {
        backgroundColor: '#f0fdf4', // Green 50
    },
    statusDraft: {
        backgroundColor: theme.colors.gray100,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statusTextConfirmed: {
        color: theme.colors.brandGreen,
    },
    statusTextDraft: {
        color: theme.colors.text.tertiary,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        ...theme.shadows.lg,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
