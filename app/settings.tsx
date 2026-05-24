import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Linking,
  Switch,
  Alert,
} from 'react-native';

const talikhaLogo = require('../assets/talikha-logo.png');
import AvatarPicker from '../components/AvatarPicker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import TabBar from '../components/TabBar';
import { useSettingsStore, type AppLanguage, type AppPlan } from '../store/useSettingsStore';
import { requestNotificationPermission, scheduleDigestNotification, cancelDigestNotification } from '../lib/notifications';

type LanguageOption = {
  value: AppLanguage;
  label: string;
  description: string;
  flag: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'english',  label: 'English',      description: 'Titles, summaries, and tags always in English.',  flag: '🇺🇸' },
  { value: 'filipino', label: 'Filipino',      description: 'Mga pamagat, buod, at tag sa Filipino.',          flag: '🇵🇭' },
];

const PLAN_LABELS: Record<AppPlan, string> = {
  free: 'Free',
  monthly: 'Pro',
  lifetime: 'Lifetime',
};

const DIGEST_TIMES = [
  { label: '6:00 AM', hour: 6, minute: 0 },
  { label: '7:00 AM', hour: 7, minute: 0 },
  { label: '8:00 AM', hour: 8, minute: 0 },
  { label: '9:00 AM', hour: 9, minute: 0 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    nickname, avatar, language, plan,
    digestEnabled, digestHour, digestMinute,
    setNickname, setAvatar, setLanguage, setDigestEnabled, setDigestTime,
  } = useSettingsStore();
  const [draftName, setDraftName] = useState(nickname);
  const [pickerVisible, setPickerVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const isPro = plan === 'monthly' || plan === 'lifetime';

  const handleDigestToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Enable notifications in your device settings to receive your morning digest.',
        );
        return;
      }
      await scheduleDigestNotification(digestHour, digestMinute);
      setDigestEnabled(true);
    } else {
      await cancelDigestNotification();
      setDigestEnabled(false);
    }
  };

  const handleDigestTimeChange = async (hour: number, minute: number) => {
    setDigestTime(hour, minute);
    if (digestEnabled) {
      await scheduleDigestNotification(hour, minute);
    }
  };

  const avatarLetter = (draftName || nickname || '')[0]?.toUpperCase() ?? null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <AvatarPicker
        visible={pickerVisible}
        current={avatar}
        onSelect={setAvatar}
        onClose={() => setPickerVisible(false)}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: (insets.bottom || 16) + 8 + 72 + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.screenTitle}>Settings</Text>

          {/* ── Profile ── */}
          <Text style={styles.sectionLabel}>PROFILE</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <TouchableOpacity style={styles.avatar} onPress={() => setPickerVisible(true)} activeOpacity={0.8}>
                {avatar ? (
                  <Text style={styles.avatarEmoji}>{avatar}</Text>
                ) : avatarLetter ? (
                  <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                ) : (
                  <Ionicons name="person" size={26} color="#FFF" />
                )}
                <View style={styles.avatarEditBadge}>
                  <Feather name="edit-2" size={9} color="#FFF" />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInputWrap}>
                <Text style={styles.inputLabel}>Your nickname</Text>
                <TextInput
                  style={styles.input}
                  value={draftName}
                  onChangeText={setDraftName}
                  onBlur={() => setNickname(draftName.trim())}
                  placeholder="e.g. Alex, Kuya, Boss…"
                  placeholderTextColor={Colors.tan}
                  returnKeyType="done"
                  onSubmitEditing={() => setNickname(draftName.trim())}
                  maxLength={24}
                />
              </View>
            </View>
            <Text style={styles.profileHint}>
              Used in greetings and AI summaries across the app.
            </Text>
          </View>

          {/* ── Language ── */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>AI RESPONSE LANGUAGE</Text>
          <Text style={styles.sectionHint}>
            Choose the language for AI-generated titles, summaries, and tags.
          </Text>
          <View style={styles.optionsCard}>
            {LANGUAGE_OPTIONS.map((opt, i) => {
              const selected = language === opt.value;
              const isLast = i === LANGUAGE_OPTIONS.length - 1;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionRow, !isLast && styles.optionBorder]}
                  onPress={() => setLanguage(opt.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flag}>{opt.flag}</Text>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.optionDesc}>{opt.description}</Text>
                  </View>
                  {selected && (
                    <Feather name="check-circle" size={20} color={Colors.primaryBrown} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Morning Digest ── */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>MORNING DIGEST</Text>
          {isPro ? (
            <View style={styles.card}>
              <View style={styles.digestToggleRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.digestToggleLabel}>Daily notification</Text>
                  <Text style={styles.digestToggleSub}>Get a morning reminder with your AI digest.</Text>
                </View>
                <Switch
                  value={digestEnabled}
                  onValueChange={handleDigestToggle}
                  trackColor={{ false: Colors.border, true: Colors.primaryBrown }}
                  thumbColor="#FFF"
                />
              </View>
              {digestEnabled && (
                <>
                  <View style={styles.digestDivider} />
                  <Text style={styles.digestTimeLabel}>Notify me at</Text>
                  <View style={styles.timeChipRow}>
                    {DIGEST_TIMES.map((t) => {
                      const active = digestHour === t.hour && digestMinute === t.minute;
                      return (
                        <TouchableOpacity
                          key={t.label}
                          style={[styles.timeChip, active && styles.timeChipActive]}
                          onPress={() => handleDigestTimeChange(t.hour, t.minute)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.digestUpsell} onPress={() => router.push('/upgrade')} activeOpacity={0.8}>
              <Feather name="sun" size={16} color={Colors.primaryBrown} />
              <Text style={styles.digestUpsellText}>Upgrade to Pro to enable morning digest</Text>
              <Feather name="chevron-right" size={14} color={Colors.tan} />
            </TouchableOpacity>
          )}

          {/* ── Support ── */}
          {isPro && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 24 }]}>SUPPORT</Text>
              <View style={styles.optionsCard}>
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => Linking.openURL('mailto:wil.soriano.jr@gmail.com?subject=Talikha%20Priority%20Support')}
                  activeOpacity={0.7}
                >
                  <Feather name="mail" size={18} color={Colors.bodyText} style={styles.legalIcon} />
                  <Text style={styles.legalLabel}>Contact Support</Text>
                  <Feather name="chevron-right" size={16} color={Colors.tan} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Legal ── */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>LEGAL</Text>
          <View style={styles.optionsCard}>
            <TouchableOpacity
              style={[styles.optionRow, styles.optionBorder]}
              onPress={() => Linking.openURL('https://talikha.pages.dev/privacy')}
              activeOpacity={0.7}
            >
              <Feather name="shield" size={18} color={Colors.bodyText} style={styles.legalIcon} />
              <Text style={styles.legalLabel}>Privacy Policy</Text>
              <Feather name="chevron-right" size={16} color={Colors.tan} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => Linking.openURL('https://talikha.pages.dev/terms')}
              activeOpacity={0.7}
            >
              <Feather name="file-text" size={18} color={Colors.bodyText} style={styles.legalIcon} />
              <Text style={styles.legalLabel}>Terms of Service</Text>
              <Feather name="chevron-right" size={16} color={Colors.tan} />
            </TouchableOpacity>
          </View>

          {/* ── Premium ── */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PLAN</Text>
          <TouchableOpacity
            style={styles.planRow}
            onPress={() => router.push('/upgrade')}
            activeOpacity={0.75}
          >
            <View style={styles.planIconWrap}>
              <Image source={talikhaLogo} style={{ width: 28, height: 28 }} resizeMode="contain" />
            </View>
            <View style={styles.planTextWrap}>
              <Text style={styles.planRowLabel}>Talikha Plan</Text>
              <Text style={styles.planRowSub}>Manage your subscription</Text>
            </View>
            <View style={[styles.planBadge, plan !== 'free' && styles.planBadgePro]}>
              <Text style={[styles.planBadgeText, plan !== 'free' && styles.planBadgeTextPro]}>
                {PLAN_LABELS[plan]}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.tan} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: Colors.background },
  safeArea:   { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  screenTitle: { fontSize: 26, fontFamily: Fonts.extraBold, color: Colors.darkText, letterSpacing: -0.5, marginBottom: 24 },

  sectionLabel: { fontSize: 11, fontFamily: Fonts.bold, color: Colors.bodyText, letterSpacing: 0.8, marginBottom: 8 },
  sectionHint:  { fontSize: 13, color: Colors.tan, marginBottom: 12, lineHeight: 18 },

  // Profile
  card: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 4 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryBrown, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 30 },
  avatarLetter: { fontSize: 22, fontFamily: Fonts.bold, color: '#FFF' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.tan, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.card },
  profileInputWrap: { flex: 1, gap: 2 },
  inputLabel: { fontSize: 11, fontFamily: Fonts.semiBold, color: Colors.tan, letterSpacing: 0.5 },
  input: { fontSize: 16, fontFamily: Fonts.semiBold, color: Colors.darkText, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  profileHint: { fontSize: 12, color: Colors.tan, marginTop: 10 },

  // Language
  optionsCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 4 },
  optionRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  optionBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.border },
  flag:        { fontSize: 22 },
  optionText:  { flex: 1, gap: 2 },
  optionLabel: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.darkText },
  optionLabelSelected: { color: Colors.primaryBrown },
  optionDesc:  { fontSize: 12, color: Colors.tan },

  // Legal
  legalIcon: { marginRight: 4 },
  legalLabel: { flex: 1, fontSize: 15, fontFamily: Fonts.medium, color: Colors.darkText },

  // Digest
  digestToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  digestToggleLabel: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.darkText },
  digestToggleSub: { fontSize: 12, color: Colors.tan },
  digestDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  digestTimeLabel: { fontSize: 11, fontFamily: Fonts.bold, color: Colors.bodyText, letterSpacing: 0.5, marginBottom: 10 },
  timeChipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  timeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5EAD8' },
  timeChipActive: { backgroundColor: Colors.primaryBrown },
  timeChipText: { fontSize: 13, fontFamily: Fonts.semiBold, color: Colors.bodyText },
  timeChipTextActive: { color: '#FFF' },
  digestUpsell: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F5EAD8', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  digestUpsellText: { flex: 1, fontSize: 14, fontFamily: Fonts.medium, color: Colors.primaryBrown },

  // Plan row
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 14 },
  planIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F5EAD8', alignItems: 'center', justifyContent: 'center' },
  planTextWrap: { flex: 1 },
  planRowLabel: { fontSize: 15, fontFamily: Fonts.semiBold, color: Colors.darkText },
  planRowSub:   { fontSize: 12, color: Colors.tan, marginTop: 1 },
  planBadge:    { backgroundColor: Colors.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  planBadgePro: { backgroundColor: '#F5EAD8' },
  planBadgeText:    { fontSize: 12, fontFamily: Fonts.bold, color: Colors.tan },
  planBadgeTextPro: { color: Colors.primaryBrown },
});
