import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import type { Offering } from 'react-native-purchases';
import { Colors } from '../constants/colors';
import { useSettingsStore, type AppPlan } from '../store/useSettingsStore';
import { fetchOfferings, buyPackage, restorePurchases, planFromCustomerInfo } from '../lib/purchases';

type PlanDef = {
  plan: AppPlan;
  label: string;
  price: string;
  period: string;
  description: string;
  recommended: boolean;
  features: string[];
};

const PLANS: PlanDef[] = [
  {
    plan: 'free',
    label: 'Free',
    price: '₱0',
    period: 'forever',
    description: 'Try it out',
    recommended: false,
    features: [
      '10 notes per month',
      'AI transcription',
      'Basic summaries',
    ],
  },
  {
    plan: 'monthly',
    label: 'Pro',
    price: '₱149',
    period: 'per month',
    description: 'Best for active thinkers',
    recommended: true,
    features: [
      'Unlimited notes',
      'AI transcription & summaries',
      'Morning digest & insights',
      'Tags, categories & export',
      'Priority support',
    ],
  },
  {
    plan: 'lifetime',
    label: 'Lifetime',
    price: '₱999',
    period: 'one-time',
    description: 'Pay once, own forever',
    recommended: false,
    features: [
      'Everything in Pro',
      'All future updates included',
      'No recurring charges',
    ],
  },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const plan = useSettingsStore((s) => s.plan);
  const setPlan = useSettingsStore((s) => s.setPlan);
  const [selected, setSelected] = useState<AppPlan>(plan === 'free' ? 'monthly' : plan);
  const [offering, setOffering] = useState<Offering | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchOfferings().then(setOffering).catch(() => {});
  }, []);

  const handlePurchase = async () => {
    const pkg = selected === 'monthly' ? offering?.monthly : offering?.lifetime;
    if (!pkg) {
      Alert.alert('Not Available', 'This plan is not available right now. Please try again later.');
      return;
    }
    setPurchasing(true);
    try {
      const customerInfo = await buyPackage(pkg);
      setPlan(planFromCustomerInfo(customerInfo));
      router.back();
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase Failed', e.message ?? 'Something went wrong.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      const restored = planFromCustomerInfo(customerInfo);
      setPlan(restored);
      if (restored === 'free') {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this Apple ID.');
      } else {
        Alert.alert('Restored!', 'Your purchase has been restored successfully.');
        router.back();
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e.message ?? 'Something went wrong.');
    } finally {
      setRestoring(false);
    }
  };

  const selectedDef = PLANS.find((p) => p.plan === selected)!;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color={Colors.darkText} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="mic" size={32} color={Colors.primaryBrown} />
          </View>
          <Text style={styles.headline}>Unlock Talikha</Text>
          <Text style={styles.subhead}>Choose the plan that fits your thinking</Text>

          <View style={styles.cards}>
            {PLANS.map((p) => {
              const isSelected = selected === p.plan;
              const isCurrent = plan === p.plan;
              return (
                <TouchableOpacity
                  key={p.plan}
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                    p.recommended && !isSelected && styles.cardRecommendedBorder,
                  ]}
                  onPress={() => setSelected(p.plan)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardTopLeft}>
                      {p.recommended && (
                        <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                          <Text style={styles.badgeText}>POPULAR</Text>
                        </View>
                      )}
                      {isCurrent && (
                        <View style={[styles.badge, styles.badgeCurrent]}>
                          <Text style={styles.badgeText}>CURRENT</Text>
                        </View>
                      )}
                      <Text style={[styles.planLabel, isSelected && styles.planLabelSelected]}>
                        {p.label}
                      </Text>
                      <Text style={[styles.planDesc, isSelected && styles.planDescSelected]}>
                        {p.description}
                      </Text>
                    </View>
                    <View style={styles.cardTopRight}>
                      <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                        {p.price}
                      </Text>
                      <Text style={[styles.planPeriod, isSelected && styles.planPeriodSelected]}>
                        {p.period}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, isSelected && styles.dividerSelected]} />

                  <View style={styles.featureList}>
                    {p.features.map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Feather
                          name="check"
                          size={13}
                          color={isSelected ? '#FFF' : Colors.primaryBrown}
                        />
                        <Text style={[styles.featureText, isSelected && styles.featureTextSelected]}>
                          {f}
                        </Text>
                      </View>
                    ))}
                  </View>

                </TouchableOpacity>
              );
            })}
          </View>

          {selected !== 'free' && (
            <TouchableOpacity
              style={[styles.ctaButton, purchasing && styles.ctaDisabled]}
              onPress={handlePurchase}
              activeOpacity={0.85}
              disabled={purchasing}
            >
              {purchasing
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.ctaText}>
                    {selected === 'monthly' ? 'Start Pro — ₱149/month' : 'Get Lifetime Access — ₱999'}
                  </Text>
              }
            </TouchableOpacity>
          )}

          {selected === 'free' && plan !== 'free' && (
            <TouchableOpacity style={styles.downgradeBtn} onPress={() => { setPlan('free'); router.back(); }} activeOpacity={0.85}>
              <Text style={styles.downgradeText}>Downgrade to Free</Text>
            </TouchableOpacity>
          )}

          {selected === 'free' && plan === 'free' && (
            <View style={styles.alreadyFreeWrap}>
              <Text style={styles.alreadyFreeText}>You're on the Free plan</Text>
            </View>
          )}

          <Text style={styles.finePrint}>
            {selected === 'monthly'
              ? 'Cancel anytime. Billed monthly.'
              : selected === 'lifetime'
              ? 'One-time payment. No subscription. No renewals.'
              : '10 notes per month. Upgrade anytime.'}
          </Text>

          <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
            {restoring
              ? <ActivityIndicator size="small" color={Colors.tan} />
              : <Text style={styles.restoreText}>Restore Purchases</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  closeBtn: {
    position: 'absolute', top: 56, right: 20, zIndex: 10,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#F5EAD8',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  headline: {
    fontSize: 28, fontWeight: '800', color: Colors.darkText,
    letterSpacing: -0.5, marginBottom: 8, textAlign: 'center',
  },
  subhead: {
    fontSize: 14, color: Colors.bodyText, textAlign: 'center',
    lineHeight: 20, marginBottom: 28,
  },
  cards: { width: '100%', gap: 12, marginBottom: 24 },
  card: {
    borderRadius: 18, padding: 16,
    backgroundColor: Colors.card,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  cardSelected: {
    backgroundColor: Colors.primaryBrown,
    borderColor: Colors.primaryBrown,
  },
  cardRecommendedBorder: {
    borderColor: Colors.tan,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTopLeft: { flex: 1, gap: 2 },
  cardTopRight: { alignItems: 'flex-end' },
  badge: {
    backgroundColor: Colors.tan,
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2,
    alignSelf: 'flex-start', marginBottom: 6,
  },
  badgeSelected: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeCurrent: { backgroundColor: Colors.border },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.8 },
  planLabel: { fontSize: 17, fontWeight: '700', color: Colors.darkText },
  planLabelSelected: { color: '#FFF' },
  planDesc: { fontSize: 12, color: Colors.tan },
  planDescSelected: { color: 'rgba(255,255,255,0.7)' },
  planPrice: { fontSize: 22, fontWeight: '800', color: Colors.primaryBrown },
  planPriceSelected: { color: '#FFF' },
  planPeriod: { fontSize: 11, color: Colors.tan, marginTop: 2 },
  planPeriodSelected: { color: 'rgba(255,255,255,0.65)' },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 12 },
  dividerSelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
  featureList: { gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, color: Colors.bodyText },
  featureTextSelected: { color: 'rgba(255,255,255,0.9)' },
  ctaButton: {
    width: '100%', backgroundColor: Colors.primaryBrown,
    borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 14,
  },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  downgradeBtn: {
    width: '100%', borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 14,
  },
  downgradeText: { color: Colors.bodyText, fontSize: 15, fontWeight: '600' },
  alreadyFreeWrap: { marginBottom: 14, paddingVertical: 16 },
  alreadyFreeText: { fontSize: 14, color: Colors.tan, fontWeight: '500' },
  finePrint: { fontSize: 12, color: Colors.tan, textAlign: 'center' },
  ctaDisabled: { opacity: 0.6 },
  restoreBtn: { alignItems: 'center', paddingVertical: 12 },
  restoreText: { fontSize: 13, color: Colors.tan, fontWeight: '500' },
});
