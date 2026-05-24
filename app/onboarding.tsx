import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

const talikhaLogo = require('../assets/talikha-logo.png');
import { Colors } from '../constants/colors';
import { useSettingsStore } from '../store/useSettingsStore';

const SLIDES = ['welcome', 'how', 'setup'] as const;
type Slide = typeof SLIDES[number];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const setNickname = useSettingsStore((s) => s.setNickname);
  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [name, setName] = useState('');

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const finish = () => {
    if (name.trim()) setNickname(name.trim());
    setOnboardingComplete();
    router.replace('/home');
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      {item === 'welcome' && <WelcomeSlide />}
      {item === 'how' && <HowSlide />}
      {item === 'setup' && <SetupSlide name={name} setName={setName} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      />

      <View style={[styles.footer, { paddingBottom: (insets.bottom || 16) + 8 }]}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        {currentIndex < SLIDES.length - 1 ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={goNext} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Feather name="arrow-right" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={finish} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Start Capturing</Text>
              <Ionicons name="mic" size={18} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={finish} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function WelcomeSlide() {
  return (
    <View style={styles.slideContent}>
      <View style={[styles.iconWrap, styles.iconWrapLogo]}>
        <Image source={talikhaLogo} style={styles.logoImage} resizeMode="contain" />
      </View>
      <Text style={styles.slideTitle}>Meet Talikha</Text>
      <Text style={styles.slideSubtitle}>
        Your voice, turned into a second brain.{'\n'}
        Speak your thoughts — we handle the rest.
      </Text>
    </View>
  );
}

function HowSlide() {
  const features: { mic?: boolean; icon?: string; title: string; desc: string }[] = [
    {
      mic: true,
      title: 'Just speak',
      desc: 'Record any thought, task, idea, or note. No typing needed.',
    },
    {
      icon: 'zap',
      title: 'AI does the work',
      desc: 'We transcribe, summarize, and automatically tag every note.',
    },
    {
      icon: 'check-circle',
      title: 'Review and act',
      desc: 'Tasks surface to the top. Your digest keeps you on track each morning.',
    },
  ];

  return (
    <View style={styles.slideContent}>
      <Text style={styles.slideTitle}>How it works</Text>
      <Text style={styles.slideSubtitle}>Three steps, zero effort.</Text>
      <View style={styles.featureList}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              {f.mic
                ? <Ionicons name="mic" size={20} color={Colors.primaryBrown} />
                : <Feather name={f.icon as any} size={20} color={Colors.primaryBrown} />
              }
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function SetupSlide({ name, setName }: { name: string; setName: (v: string) => void }) {
  return (
    <View style={styles.slideContent}>
      <View style={styles.iconWrap}>
        <Text style={{ fontSize: 48 }}>👋</Text>
      </View>
      <Text style={styles.slideTitle}>What's your name?</Text>
      <Text style={styles.slideSubtitle}>
        We'll use it to personalise your greetings and AI summaries.
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Alex, Kuya, Boss…"
          placeholderTextColor={Colors.tan}
          returnKeyType="done"
          maxLength={24}
          autoCorrect={false}
        />
      </View>
      <Text style={styles.inputHint}>You can change this anytime in Settings.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  slide: { flex: 1 },
  slideContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    alignItems: 'center',
  },

  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#F5EAD8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconWrapLogo: {
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  slideTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.darkText,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  slideSubtitle: {
    fontSize: 15,
    color: Colors.bodyText,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 36,
  },

  featureList: { width: '100%', gap: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F5EAD8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { flex: 1, paddingTop: 2 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.darkText, marginBottom: 3 },
  featureDesc: { fontSize: 13, color: Colors.bodyText, lineHeight: 19 },

  inputWrap: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 10,
  },
  input: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.darkText,
    paddingVertical: 14,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.tan,
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primaryBrown,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryBrown,
    borderRadius: 16,
    paddingVertical: 17,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 6 },
  skipText: { fontSize: 14, color: Colors.tan, fontWeight: '500' },
});
