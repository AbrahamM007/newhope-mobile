import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Calendar, ArrowRight, Music, Clock, FileText, CheckCircle } from 'lucide-react-native';
import theme from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { groupsAPI } from '@/lib/api';
import { ActivityIndicator } from 'react-native';

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [group, setGroup] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadGroup();
    }, [id]);

    const loadGroup = async () => {
        try {
            const data = await groupsAPI.getById(id as string);
            setGroup(data);
        } catch (error) {
            console.error('Failed to load group:', error);
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

    if (!group) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Group not found</Text>
            </View>
        );
    }

    // Power-Up Logic
    const isWorshipTeam = group.powerUp === 'planning';

    return (
        <View style={styles.container}>
            {/* Header Image */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: group.image }} style={styles.headerImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.imageOverlay}
                />
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowRight size={24} color="#fff" style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.groupType}>{group.type.toUpperCase()}</Text>
                    <Text style={styles.title}>{group.name}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Users size={14} color="#ddd" />
                            <Text style={styles.metaText}>{group._count.members} Members</Text>
                        </View>
                    </View>
                </View>
            </View>

            <SafeAreaView edges={['bottom']} style={styles.contentContainer}>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

                    {/* Power-Up Section: Worship Planning */}
                    {isWorshipTeam && (
                        <View style={styles.powerUpContainer}>
                            <LinearGradient
                                colors={(theme.colors.gradients?.primary || ['#15803d', '#166534']) as any}
                                style={styles.powerUpCard}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.powerUpHeader}>
                                    <View style={styles.powerUpIcon}>
                                        <Music size={24} color={theme.colors.brandGreen} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.powerUpTitle}>Planning Center</Text>
                                        <Text style={styles.powerUpSubtitle}>Manage services, setlists & team</Text>
                                    </View>
                                </View>

                                <View style={styles.powerUpActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => router.push(`/groups/${id}/planning` as any)}
                                    >
                                        <Calendar size={20} color={theme.colors.white} />
                                        <Text style={styles.actionButtonText}>Upcoming Services</Text>
                                        <ArrowRight size={16} color={theme.colors.white} style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.secondaryAction]}
                                        activeOpacity={0.8}
                                    >
                                        <FileText size={20} color={theme.colors.white} />
                                        <Text style={styles.actionButtonText}>Song Library</Text>
                                        <ArrowRight size={16} color={theme.colors.white} style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>
                    )}

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.description}>{group.description}</Text>
                    </View>

                    {/* Members Preview */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Team Members</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersRow}>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <View key={i} style={styles.memberAvatar}>
                                    <LinearGradient
                                        colors={['#e5e7eb', '#d1d5db']}
                                        style={styles.avatarPlaceholder}
                                    >
                                        <Users size={20} color="#9ca3af" />
                                    </LinearGradient>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

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
    contentContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    imageContainer: {
        height: 300,
        width: '100%',
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    headerContent: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    groupType: {
        color: theme.colors.brandGreen,
        fontWeight: '700',
        fontSize: 12,
        marginBottom: 4,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    title: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        marginRight: 10,
    },
    metaText: {
        color: '#ddd',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    powerUpContainer: {
        marginBottom: theme.spacing.xl,
        marginTop: -40, // Overlap image slightly
    },
    powerUpCard: {
        borderRadius: theme.borderRadius.xl,
        padding: 20,
        ...theme.shadows.lg,
    },
    powerUpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    powerUpIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        ...theme.shadows.sm,
    },
    powerUpTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 2,
    },
    powerUpSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
    },
    powerUpActions: {
        gap: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 16,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    secondaryAction: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(255,255,255,0.2)',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 12,
    },
    section: {
        marginBottom: theme.spacing['2xl'],
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        lineHeight: 24,
    },
    seeAll: {
        color: theme.colors.brandGreen,
        fontWeight: '600',
        fontSize: 14,
    },
    membersRow: {
        flexDirection: 'row',
    },
    memberAvatar: {
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
