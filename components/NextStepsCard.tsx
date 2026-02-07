import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowRight, CheckCircle2, PlayCircle, Calendar } from 'lucide-react-native';
import theme from '@/lib/theme';

export type NextStepType = 'serve' | 'group' | 'event' | 'watch' | 'give';

interface NextStepsProps {
    type: NextStepType;
    title: string;
    subtitle: string;
    onPress: () => void;
}

export default function NextStepsCard({ type, title, subtitle, onPress }: NextStepsProps) {
    const getIcon = () => {
        switch (type) {
            case 'serve': return <CheckCircle2 size={24} color={theme.colors.brandGreen} />;
            case 'watch': return <PlayCircle size={24} color={theme.colors.brandGreen} />;
            case 'event': return <Calendar size={24} color={theme.colors.brandGreen} />;
            default: return <CheckCircle2 size={24} color={theme.colors.brandGreen} />;
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.header}>
                <Text style={styles.label}>MY NEXT STEP</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    {getIcon()}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <ArrowRight size={20} color={theme.colors.gray400} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: 16,
        marginBottom: theme.spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.brandGreen,
        ...theme.shadows.sm,
    },
    header: {
        marginBottom: 8,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.brandGreen,
        letterSpacing: 1,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(22, 101, 52, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
});
