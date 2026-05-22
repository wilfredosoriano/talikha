import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useSettingsStore } from '../store/useSettingsStore';

export default function SplashScreen() {
  const router = useRouter();
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  const dot1 = useRef(new Animated.Value(1)).current;
  const dot2 = useRef(new Animated.Value(0.5)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const makeDotLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.0, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.5, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ])
      );

    const loop1 = makeDotLoop(dot1, 0);
    const loop2 = makeDotLoop(dot2, 200);
    const loop3 = makeDotLoop(dot3, 400);

    loop1.start();
    loop2.start();
    loop3.start();

    const timer = setTimeout(() => {
      router.replace(onboardingComplete ? '/home' : '/onboarding');
    }, 2000);

    return () => {
      clearTimeout(timer);
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="mic" size={56} color={Colors.primaryBrown} />
        </View>
        <Text style={styles.appName}>Talikha</Text>
        <Text style={styles.tagline}>Your voice. Your thoughts. Organized.</Text>
      </View>
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((anim, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '300',
    color: Colors.bodyText,
    textAlign: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryBrown,
  },
});
