import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import type { AppPlan } from '../store/useSettingsStore';

// Paste your RevenueCat iOS API key from dashboard.revenuecat.com
const RC_API_KEY_IOS = 'appl_PASTE_YOUR_REVENUECAT_KEY_HERE';

export function initPurchases() {
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: RC_API_KEY_IOS });
}

export async function fetchOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function buyPackage(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  return await Purchases.restorePurchases();
}

export async function getCustomerInfo() {
  return await Purchases.getCustomerInfo();
}

export function planFromCustomerInfo(info: CustomerInfo): AppPlan {
  const active = info.entitlements.active;
  if (!active['pro']) return 'free';
  if (active['pro'].productIdentifier.toLowerCase().includes('lifetime')) return 'lifetime';
  return 'monthly';
}
