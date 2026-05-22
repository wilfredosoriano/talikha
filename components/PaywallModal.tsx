import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Offering } from 'react-native-purchases';
import { Colors } from '../constants/colors';
import { useSettingsStore, FREE_CAPTURE_LIMIT, type AppPlan } from '../store/useSettingsStore';
import { fetchOfferings, buyPackage, planFromCustomerInfo } from '../lib/purchases';

interface PaywallModalProps {
  visible: boolean;
  used: number;
  onClose: () => void;
}

type PlanOption = {
  plan: AppPlan;
  label: string;
  price: string;
  sub: string;
  recommended: boolean;
};

const PLANS: PlanOption[] = [
  { plan: 'monthly',  label: 'Pro',      price: '₱149', sub: 'per month',       recommended: true  },
  { plan: 'lifetime', label: 'Lifetime', price: '₱999', sub: 'one-time, forever', recommended: false },
];

export default function PaywallModal({ visible, used, onClose }: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setPlan = useSettingsStore((s) => s.setPlan);
  const [offering, setOffering] = useState<Offering | null>(null);
  const [purchasing, setPurchasing] = useState<AppPlan | null>(null);

  useEffect(() => {
    if (visible) fetchOfferings().then(setOffering).catch(() => {});
  }, [visible]);

  const handlePurchase = async (plan: AppPlan) => {
    const pkg = plan === 'monthly' ? offering?.monthly : offering?.lifetime;
    if (!pkg) {
      Alert.alert('Not Available', 'This plan is not available right now. Please try again.');
      return;
    }
    setPurchasing(plan);
    try {
      const customerInfo = await buyPackage(pkg);
      setPlan(planFromCustomerInfo(customerInfo));
      onClose();
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase Failed', e.message ?? 'Something went wrong.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.iconRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="mic" size={28} color={Colors.primaryBrown} />
          </View>
        </View>
        <Text style={styles.title}>You've used all {FREE_CAPTURE_LIMIT} free captures</Text>
        <Text style={styles.sub}>
          Upgrade to keep capturing your thoughts without limits.
        </Text>

        {/* Usage bar */}
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>{used} / {FREE_CAPTURE_LIMIT} this month</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: '100%' }]} />
        </View>

        {/* Plan cards */}
        <View style={styles.plans}>
          {PLANS.map((p) => (
            <TouchableOpacity
              key={p.plan}
              style={[styles.planCard, p.recommended && styles.planCardRecommended, purchasing === p.plan && styles.planCardDisabled]}
              onPress={() => handlePurchase(p.plan)}
              activeOpacity={0.85}
              disabled={purchasing !== null}
            >
              {p.recommended && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>MOST POPULAR</Text>
                </View>
              )}
              <View style={styles.planRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planLabel, p.recommended && styles.planLabelLight]}>
                    {p.label}
                  </Text>
                  <Text style={[styles.planSub, p.recommended && styles.planSubLight]}>
                    {p.sub}
                  </Text>
                </View>
                {purchasing === p.plan
                  ? <ActivityIndicator color={p.recommended ? '#FFF' : Colors.primaryBrown} />
                  : <Text style={[styles.planPrice, p.recommended && styles.planPriceLight]}>{p.price}</Text>
                }
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={onClose} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(59,32,8,0.35)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 20,
  },
  iconRow: { alignItems: 'center', marginBottom: 12 },
  iconWrap: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: '#F5EAD8',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 20, fontWeight: '800', color: Colors.darkText,
    textAlign: 'center', marginBottom: 8,
  },
  sub: {
    fontSize: 14, color: Colors.bodyText, textAlign: 'center',
    lineHeight: 20, marginBottom: 16,
  },
  usageRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  usageLabel: { fontSize: 12, color: Colors.tan, fontWeight: '600' },
  barTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: Colors.border, marginBottom: 20, overflow: 'hidden',
  },
  barFill: {
    height: 6, borderRadius: 3, backgroundColor: Colors.primaryBrown,
  },
  plans: { gap: 10, marginBottom: 16 },
  planCard: {
    borderRadius: 16, padding: 16,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
  },
  planCardDisabled: { opacity: 0.6 },
  planCardRecommended: {
    backgroundColor: Colors.primaryBrown,
    borderColor: Colors.primaryBrown,
  },
  badge: {
    backgroundColor: Colors.tan,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: 'flex-start', marginBottom: 8,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#FFF', letterSpacing: 0.8 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planLabel: { fontSize: 16, fontWeight: '700', color: Colors.darkText },
  planLabelLight: { color: '#FFF' },
  planSub: { fontSize: 12, color: Colors.tan, marginTop: 2 },
  planSubLight: { color: 'rgba(255,255,255,0.7)' },
  planPrice: { fontSize: 22, fontWeight: '800', color: Colors.primaryBrown },
  planPriceLight: { color: '#FFF' },
  dismissBtn: { alignItems: 'center', paddingVertical: 8 },
  dismissText: { fontSize: 14, color: Colors.tan, fontWeight: '500' },
});
