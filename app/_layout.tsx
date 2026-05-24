import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { initDatabase, getAllCaptures } from '../lib/database';
import { useCaptureStore } from '../store/useCaptureStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { initPurchases, getCustomerInfo, planFromCustomerInfo } from '../lib/purchases';
import { setupNotificationChannel } from '../lib/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function InnerLayout() {
  const router = useRouter();

  useEffect(() => {
    setupNotificationChannel();
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { screen?: string };
      if (data?.screen === 'digest') router.push('/digest');
    });
    return () => sub.remove();
  }, []);

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
  const [fontsLoaded, fontError] = useFonts({
    'Cause-Thin':       require('../assets/fonts/Cause-Thin.ttf'),
    'Cause-ExtraLight': require('../assets/fonts/Cause-ExtraLight.ttf'),
    'Cause-Light':      require('../assets/fonts/Cause-Light.ttf'),
    'Cause-Regular':    require('../assets/fonts/Cause-Regular.ttf'),
    'Cause-Medium':     require('../assets/fonts/Cause-Medium.ttf'),
    'Cause-SemiBold':   require('../assets/fonts/Cause-SemiBold.ttf'),
    'Cause-Bold':       require('../assets/fonts/Cause-Bold.ttf'),
    'Cause-ExtraBold':  require('../assets/fonts/Cause-ExtraBold.ttf'),
    'Cause-Black':      require('../assets/fonts/Cause-Black.ttf'),
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    Feather:  require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
  });

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

  // fontError can occur on Expo Go when the font is already registered natively;
  // render anyway so we never block on a blank screen.
  if (!fontsLoaded && !fontError) return null;

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
