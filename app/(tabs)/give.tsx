import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Heart, DollarSign, TrendingUp, Check } from 'lucide-react-native';
import theme from '@/lib/theme';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const QUICK_AMOUNTS = [25, 50, 100, 250, 500];

export default function GiveScreen() {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    // TODO: Connect to giveAPI when backend is ready
    setLoading(false);
    setCampaigns([
      {
        id: '1',
        name: 'General Fund',
        description: 'Support church operations and ministry',
        goalAmount: 50000,
        raisedAmount: 32500,
      },
      {
        id: '2',
        name: 'Missions',
        description: 'Global outreach and kingdom impact',
        goalAmount: 25000,
        raisedAmount: 18700,
      },
      {
        id: '3',
        name: 'Youth Ministry',
        description: 'Investing in the next generation',
        goalAmount: 15000,
        raisedAmount: 9200,
      },
    ]);
  };

  const handleGive = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || !selectedCampaign) return;

    // TODO: Implement actual payment processing
    console.log(`Giving $${amount} to campaign ${selectedCampaign}`);
  };

  const renderCampaign = ({ item }: { item: any }) => {
    const progress = item.goalAmount ? (item.raisedAmount / item.goalAmount) * 100 : 0;
    const isSelected = selectedCampaign === item.id;

    return (
      <TouchableOpacity
        style={[styles.campaignCard, isSelected && styles.campaignCardSelected]}
        activeOpacity={0.9}
        onPress={() => setSelectedCampaign(item.id)}
      >
        <View style={styles.campaignHeader}>
          <LinearGradient
            colors={(isSelected ? (theme.colors.gradients?.primary || ['#15803d', '#166534']) : theme.colors.gradients?.silver || ['#f3f4f6', '#e5e7eb']) as any}
            style={styles.campaignIcon}
          >
            <Heart size={20} color={isSelected ? '#fff' : theme.colors.brandGreen} fill={isSelected ? '#fff' : 'none'} />
          </LinearGradient>
          <View style={styles.campaignInfo}>
            <Text style={styles.campaignName}>{item.name}</Text>
            <Text style={styles.campaignDescription}>{item.description}</Text>
          </View>
          {isSelected && (
            <View style={styles.checkCircle}>
              <Check size={14} color="#fff" strokeWidth={3} />
            </View>
          )}
        </View>

        {item.goalAmount && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                ${item.raisedAmount.toLocaleString()} raised
              </Text>
              <Text style={styles.progressGoal}>
                of ${item.goalAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={(theme.colors.gradients?.primary || ['#15803d', '#166534']) as any}
                style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.gray100]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={(theme.colors.gradients?.primary || ['#15803d', '#166534']) as any}
              style={styles.headerIcon}
            >
              <Heart size={28} color="#fff" fill="#fff" />
            </LinearGradient>
            <Text style={styles.title}>Give</Text>
            <Text style={styles.subtitle}>Make an impact through generosity</Text>
          </View>

          {/* Campaigns */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Campaign</Text>
            <FlatList
              data={campaigns}
              renderItem={renderCampaign}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.campaignsList}
            />
          </View>

          {/* Amount Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Amount</Text>
            <View style={styles.amountGrid}>
              {QUICK_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountButton,
                    selectedAmount === amount && styles.amountButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                >
                  <Text
                    style={[
                      styles.amountText,
                      selectedAmount === amount && styles.amountTextSelected,
                    ]}
                  >
                    ${amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.customAmountContainer, customAmount ? styles.customAmountActive : null]}>
              <DollarSign size={20} color={customAmount ? theme.colors.brandGreen : theme.colors.text.tertiary} />
              <TextInput
                style={styles.customAmountInput}
                placeholder="Custom amount"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text);
                  setSelectedAmount(null);
                }}
              />
            </View>
          </View>

          {/* Give Button */}
          <TouchableOpacity
            style={[
              styles.giveButton,
              (!selectedAmount && !customAmount) || !selectedCampaign
                ? styles.giveButtonDisabled
                : null,
            ]}
            onPress={handleGive}
            disabled={(!selectedAmount && !customAmount) || !selectedCampaign}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={((!selectedAmount && !customAmount) || !selectedCampaign ? ['#d1d5db', '#9ca3af'] : (theme.colors.gradients?.primary || ['#15803d', '#166534'])) as any}
              style={styles.giveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.giveButtonText}>
                Give ${selectedAmount || customAmount || '0'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer Info */}
          <View style={styles.footer}>
            <TrendingUp size={16} color={theme.colors.text.secondary} />
            <Text style={styles.footerText}>
              Your generosity makes a lasting impact in our community
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
    marginTop: theme.spacing.xl,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  title: {
    fontSize: 36,
    fontWeight: '800', // Heavy weight
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing['3xl'],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fonts.serif.split(',')[0].replace(/"/g, ''),
  },
  campaignsList: {
    gap: theme.spacing.md,
  },
  campaignCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  campaignCardSelected: {
    borderColor: theme.colors.brandGreen,
    backgroundColor: theme.colors.white,
    ...theme.shadows.md,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center', // Center vertically
    marginBottom: theme.spacing.md,
  },
  campaignIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  campaignInfo: {
    flex: 1,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  campaignName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  campaignDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.brandGreen,
  },
  progressGoal: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // Consistent gap
    marginBottom: theme.spacing.lg,
  },
  amountButton: {
    width: '31%', // Fits 3 in a row with gap
    paddingVertical: 14,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    ...theme.shadows.xs,
  },
  amountButtonSelected: {
    borderColor: theme.colors.brandGreen,
    backgroundColor: `${theme.colors.brandGreen}10`, // Very subtle green tint
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  amountTextSelected: {
    color: theme.colors.brandGreen,
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 6,
    backgroundColor: theme.colors.white,
  },
  customAmountActive: {
    borderColor: theme.colors.brandGreen,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  giveButton: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  giveButtonGradient: {
    paddingVertical: 18,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
  },
  giveButtonDisabled: {
    opacity: 0.8,
    shadowOpacity: 0,
  },
  giveButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    flex: 1,
    lineHeight: 20,
  },
});