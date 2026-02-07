import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, ChevronDown } from 'lucide-react-native';
import { colors } from '@/lib/theme';

const brandGreen = colors.brandGreen;
const brandDark = colors.brandDark;

const { width } = Dimensions.get('window');

const MOCK_CAMPAIGNS = [
  { id: '1', name: 'General Fund', description: 'Support the day-to-day ministry', goal: 50000, current: 35000, image: null },
  { id: '2', name: 'Building Fund', description: 'New worship center expansion', goal: 500000, current: 320000, image: null },
  { id: '3', name: 'Missions', description: 'Global outreach initiatives', goal: 25000, current: 18500, image: null },
];

const QUICK_AMOUNTS = [25, 50, 100, 250, 500];
const FUNDS = ['General Fund', 'Missions', 'Youth Ministry', 'Building Fund'];
const FREQUENCIES = ['Weekly', 'Bi-weekly', 'Monthly'];

export default function GiveScreen() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedFund, setSelectedFund] = useState('General Fund');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('Monthly');

  const displayAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount || 0;

  const handleQuickAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (text: string) => {
    setCustomAmount(text);
    setSelectedAmount(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={brandDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Give</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroBanner}>
          <Heart size={32} color="#fff" />
          <Text style={styles.heroTitle}>Make an Impact{'\n'}Through Generosity</Text>
        </View>

        <Text style={styles.sectionTitle}>Active Campaigns</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campaignScroll}>
          {MOCK_CAMPAIGNS.map((c) => {
            const progress = c.current / c.goal;
            return (
              <View key={c.id} style={styles.campaignCard}>
                <Text style={styles.campaignName}>{c.name}</Text>
                <Text style={styles.campaignDesc}>{c.description}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <View style={styles.campaignAmounts}>
                  <Text style={styles.campaignCurrent}>${c.current.toLocaleString()}</Text>
                  <Text style={styles.campaignGoal}>of ${c.goal.toLocaleString()}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Select Amount</Text>
        <View style={styles.amountsGrid}>
          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.amountBtn, selectedAmount === amt && styles.amountBtnActive]}
              onPress={() => handleQuickAmount(amt)}
            >
              <Text style={[styles.amountText, selectedAmount === amt && styles.amountTextActive]}>
                ${amt}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.customInputWrap}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.customInput}
              placeholder="Custom"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={customAmount}
              onChangeText={handleCustomChange}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Fund</Text>
        <View style={styles.fundsWrap}>
          {FUNDS.map((fund) => (
            <TouchableOpacity
              key={fund}
              style={[styles.fundBtn, selectedFund === fund && styles.fundBtnActive]}
              onPress={() => setSelectedFund(fund)}
            >
              <View style={[styles.radio, selectedFund === fund && styles.radioActive]}>
                {selectedFund === fund && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.fundText, selectedFund === fund && styles.fundTextActive]}>{fund}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recurringRow}>
          <View>
            <Text style={styles.recurringLabel}>Recurring Giving</Text>
            <Text style={styles.recurringDesc}>Set up automatic giving</Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: '#e0e0e0', true: '#86efac' }}
            thumbColor={isRecurring ? brandGreen : '#f4f4f4'}
          />
        </View>

        {isRecurring && (
          <View style={styles.frequencyRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.freqBtn, frequency === f && styles.freqBtnActive]}
                onPress={() => setFrequency(f)}
              >
                <Text style={[styles.freqText, frequency === f && styles.freqTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.giveButton}>
          <Text style={styles.giveButtonText}>Give ${displayAmount.toLocaleString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyLink}>
          <Text style={styles.historyText}>View Giving History</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: brandDark },
  heroBanner: { marginHorizontal: 16, borderRadius: 16, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', backgroundColor: brandGreen },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', marginTop: 12, lineHeight: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: brandDark, marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  campaignScroll: { paddingLeft: 16, paddingRight: 8 },
  campaignCard: { width: width * 0.65, backgroundColor: '#fff', borderRadius: 12, padding: 16, marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  campaignName: { fontSize: 15, fontWeight: '700', color: brandDark },
  campaignDesc: { fontSize: 13, color: '#666', marginTop: 4 },
  progressTrack: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, marginTop: 12 },
  progressFill: { height: 6, backgroundColor: brandGreen, borderRadius: 3 },
  campaignAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  campaignCurrent: { fontSize: 14, fontWeight: '600', color: brandGreen },
  campaignGoal: { fontSize: 13, color: '#999' },
  amountsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  amountBtn: { width: (width - 52) / 3, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  amountBtnActive: { borderColor: brandGreen, backgroundColor: '#f0fdf4' },
  amountText: { fontSize: 16, fontWeight: '600', color: '#666' },
  amountTextActive: { color: brandGreen },
  customInputWrap: { width: (width - 52) / 3, flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb', paddingHorizontal: 10 },
  dollarSign: { fontSize: 16, fontWeight: '600', color: '#666' },
  customInput: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: '600', color: brandDark },
  fundsWrap: { paddingHorizontal: 16, gap: 8 },
  fundBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb' },
  fundBtnActive: { borderColor: brandGreen, backgroundColor: '#f0fdf4' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioActive: { borderColor: brandGreen },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: brandGreen },
  fundText: { fontSize: 15, fontWeight: '500', color: '#666' },
  fundTextActive: { color: brandDark, fontWeight: '600' },
  recurringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 12 },
  recurringLabel: { fontSize: 15, fontWeight: '600', color: brandDark },
  recurringDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  frequencyRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 8 },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  freqBtnActive: { borderColor: brandGreen, backgroundColor: '#f0fdf4' },
  freqText: { fontSize: 13, fontWeight: '600', color: '#666' },
  freqTextActive: { color: brandGreen },
  giveButton: { marginHorizontal: 16, marginTop: 28, paddingVertical: 16, borderRadius: 12, backgroundColor: brandGreen, alignItems: 'center' },
  giveButtonText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  historyLink: { alignItems: 'center', marginTop: 16 },
  historyText: { fontSize: 14, fontWeight: '600', color: brandGreen },
});
