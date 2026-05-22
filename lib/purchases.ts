import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import Constants from 'expo-constants';
import type { AppPlan } from '../store/useSettingsStore';

const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

// RevenueCat requires a native store — not available in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
let configured = false;

export function initPurchases() {
  if (isExpoGo || !RC_API_KEY_IOS) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: RC_API_KEY_IOS });
  configured = true;
}

export async function fetchOfferings() {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function buyPackage(pkg: PurchasesPackage) {
  if (!configured) throw new Error('Purchases not available');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  if (!configured) throw new Error('Purchases not available');
  return await Purchases.restorePurchases();
}

export async function getCustomerInfo() {
  if (!configured) return null;
  return await Purchases.getCustomerInfo();
}

export function planFromCustomerInfo(info: CustomerInfo): AppPlan {
  const active = info.entitlements.active;
  if (!active['pro']) return 'free';
  if (active['pro'].productIdentifier.toLowerCase().includes('lifetime')) return 'lifetime';
  return 'monthly';
}
