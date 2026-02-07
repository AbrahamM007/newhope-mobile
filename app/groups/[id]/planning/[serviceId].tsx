import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft, Clock, Music, FileText, MoreHorizontal,
    Users, Check, X, Mic, Guitar, Keyboard, Drum
} from 'lucide-react-native';
import theme from '@/lib/theme';
import { worshipAPI } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function ServicePlanScreen() {
    const { id, serviceId } = useLocalSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'plan' | 'team'>('plan');

    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadService();
    }, [serviceId]);

    const loadService = async () => {
        try {
            const data = await worshipAPI.getById(serviceId as string);
            setService(data);
        } catch (error) {
            console.error('Failed to load service:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.brandGreen} />
            </View>
        );
    }

    if (!service) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Service not found</Text>
            </View>
        );
    }

    const planItems = service.items || [];
    const teamMembers = service.members || [];

    const renderPlanItem = ({ item }: { item: any }) => {
        if (item.type === 'header') {
            return (
                <View style={styles.headerItem}>
                    <Text style={styles.headerItemText}>{item.title.toUpperCase()}</Text>
                </View>
            );
        }

        const isSong = item.type === 'song';

        return (
            <View style={styles.planRow}>
                <View style={styles.timeColumn}>
                    {item.duration && <Text style={styles.durationText}>{item.duration}</Text>}
                </View>

                <View style={[styles.itemCard, isSong && styles.songCard]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        {isSong && <Text style={styles.itemSubtitle}>{item.artist}</Text>}
                        {!isSong && item.assignee && (
                            <View style={styles.assigneeTag}>
                                <Users size={10} color={theme.colors.gray600} />
                                <Text style={styles.assigneeText}>{item.assignee}</Text>
                            </View>
                        )}
                    </View>

                    {isSong && (
                        <View style={styles.songMeta}>
                            <View style={styles.keyBadge}>
                                <Text style={styles.keyText}>{item.key}</Text>
                            </View>
                            <View style={styles.bpmBadge}>
                                <Text style={styles.bpmText}>{item.bpm}</Text>
                            </View>
                            <TouchableOpacity style={styles.iconButton}>
                                <FileText size={16} color={theme.colors.brandGreen} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const renderTeamMember = ({ item }: { item: any }) => {
        let icon = <Users size={18} color="#666" />;
        if (item.role.includes('Guitar')) icon = <Guitar size={18} color="#666" />;
        if (item.role.includes('Keys')) icon = <Keyboard size={18} color="#666" />;
        if (item.role.includes('Worship')) icon = <Mic size={18} color="#666" />;

        const statusColor = item.status === 'Accepted' ? theme.colors.brandGreen : item.status === 'Declined' ? theme.colors.error : theme.colors.warning;

        return (
            <View style={styles.teamRow}>
                <View style={styles.roleIcon}>{icon}</View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{item.name}</Text>
                    <Text style={styles.teamRole}>{item.role}</Text>
                </View>
                <View style={[styles.statusTag, { backgroundColor: statusColor + '20' }]}>
                    {item.status === 'Accepted' && <Check size={12} color={statusColor} />}
                    {item.status === 'Declined' && <X size={12} color={statusColor} />}
                    {item.status === 'Pending' && <Clock size={12} color={statusColor} />}
                    <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.optionsButton}>
                            <MoreHorizontal size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.pageTitle}>{new Date(service.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                    <Text style={styles.pageSubtitle}>{new Date(service.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {service.series || service.title}</Text>

                    {/* Tabs */}
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'plan' && styles.activeTab]}
                            onPress={() => setActiveTab('plan')}
                        >
                            <Text style={[styles.tabText, activeTab === 'plan' && styles.activeTabText]}>Plan</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'team' && styles.activeTab]}
                            onPress={() => setActiveTab('team')}
                        >
                            <Text style={[styles.tabText, activeTab === 'team' && styles.activeTabText]}>Team</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {activeTab === 'plan' ? (
                    <FlatList
                        data={planItems}
                        renderItem={renderPlanItem}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <FlatList
                        data={teamMembers}
                        renderItem={renderTeamMember}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={styles.teamHeader}>
                                <View style={styles.teamStat}>
                                    <Text style={styles.teamStatNumber}>{teamMembers.filter((m: any) => m.status === 'CONFIRMED' || m.status === 'Accepted').length}</Text>
                                    <Text style={styles.teamStatLabel}>Confirmed</Text>
                                </View>
                                <View style={styles.teamStat}>
                                    <Text style={styles.teamStatNumber}>{teamMembers.filter((m: any) => m.status === 'PENDING' || m.status === 'Pending').length}</Text>
                                    <Text style={styles.teamStatLabel}>Pending</Text>
                                </View>
                                <View style={styles.teamStat}>
                                    <Text style={styles.teamStatNumber}>{teamMembers.filter((m: any) => m.status === 'DECLINED').length}</Text>
                                    <Text style={styles.teamStatLabel}>Declined</Text>
                                </View>
                                <TouchableOpacity style={styles.addMemberBtn}>
                                    <Users size={16} color="#fff" />
                                    <Text style={styles.addMemberText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}

            </SafeAreaView>

            {/* Floating Action for Adding Items */}
            {activeTab === 'plan' && (
                <TouchableOpacity style={styles.fab}>
                    <LinearGradient
                        colors={(theme.colors.gradients?.primary || ['#15803d', '#166534']) as any}
                        style={styles.fabGradient}
                    >
                        <Music size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    header: {
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    optionsButton: {
        padding: 8,
        marginRight: -8,
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 20,
    },
    tabs: {
        flexDirection: 'row',
        gap: 20,
    },
    tab: {
        paddingVertical: 12,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.brandGreen,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    activeTabText: {
        color: theme.colors.brandGreen,
    },
    listContent: {
        padding: theme.spacing.lg,
        paddingBottom: 80,
    },
    headerItem: {
        backgroundColor: theme.colors.gray100,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
        marginTop: 8,
    },
    headerItemText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        letterSpacing: 0.5,
    },
    planRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    timeColumn: {
        width: 50,
        alignItems: 'flex-end',
        paddingRight: 10,
        paddingTop: 12,
    },
    durationText: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    itemCard: {
        flex: 1,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        ...theme.shadows.xs,
    },
    songCard: {
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.brandGreen,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    itemSubtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    assigneeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
        backgroundColor: theme.colors.gray50,
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    assigneeText: {
        fontSize: 11,
        color: theme.colors.gray600,
    },
    songMeta: {
        alignItems: 'flex-end',
        gap: 6,
    },
    keyBadge: {
        backgroundColor: theme.colors.gray100,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    bpmBadge: {
        // transparent, just text
    },
    bpmText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    iconButton: {
        padding: 4,
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
    },
    teamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        padding: 16,
        borderRadius: theme.borderRadius.lg,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    teamStat: {
        flex: 1,
        alignItems: 'center',
    },
    teamStatNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    teamStatLabel: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    addMemberBtn: {
        backgroundColor: theme.colors.brandGreen,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addMemberText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        padding: 12,
        borderRadius: theme.borderRadius.lg,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    roleIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    teamName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    teamRole: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    }
});
