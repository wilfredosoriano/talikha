import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase, getAllCaptures } from '../lib/database';
import { useCaptureStore } from '../store/useCaptureStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { initPurchases, getCustomerInfo, planFromCustomerInfo } from '../lib/purchases';

function InnerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF3E8' } }}>
      {/* Tab screens: instant fade so switching tabs feels like tabs, not navigation */}
      <Stack.Screen name="index"      options={{ animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="home"      options={{ animation: 'fade' }} />
      <Stack.Screen name="digest"    options={{ animation: 'fade' }} />
      <Stack.Screen name="settings"  options={{ animation: 'fade' }} />
      <Stack.Screen name="upgrade"   options={{ animation: 'fade' }} />
{/* Action screens: directional slides feel intentional */}
      <Stack.Screen name="recording" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="detail/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    initPurchases();
    // Sync plan status from RevenueCat on every cold start
    getCustomerInfo()
      .then((info) => {
        const plan = planFromCustomerInfo(info);
        useSettingsStore.getState().setPlan(plan);
      })
      .catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider
          databaseName="capture.db"
          onInit={async (db: SQLiteDatabase) => {
            await initDatabase(db);
            const captures = await getAllCaptures(db);
            useCaptureStore.getState().setCaptures(captures);
          }}
        >
          <InnerLayout />
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
