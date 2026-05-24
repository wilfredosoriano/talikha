import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';

const talikhaLogo = require('../assets/talikha-logo.png');
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import { useCaptureStore } from '../store/useCaptureStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { markCaptureComplete } from '../lib/database';
import CapturePill from '../components/CapturePill';
import TabBar from '../components/TabBar';
import { formatDigestDate, getYesterdayDateString } from '../lib/utils';
import type { Category, Capture } from '../lib/database';

const CATEGORIES: Category[] = ['Task', 'Idea', 'Note', 'Reference'];
const TAB_BAR_HEIGHT = 72;

export default function DigestScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const captures = useCaptureStore((s) => s.captures);
  const updateCapture = useCaptureStore((s) => s.updateCapture);
  const nickname = useSettingsStore((s) => s.nickname);
  const avatar = useSettingsStore((s) => s.avatar);
  const displayName = nickname.trim() || 'there';
  const insets = useSafeAreaInsets();
  const ctaBottom = (insets.bottom || 16) + 8 + TAB_BAR_HEIGHT + 12;

  const pendingTasks = captures.filter((c) => c.category === 'Task' && !c.completed);
  const ideasCount = captures.filter((c) => c.category === 'Idea').length;

  const yesterdayStr = getYesterdayDateString();
  const yesterdayCaptures = captures.filter(
    (c) => new Date(c.createdAt).toDateString() === yesterdayStr
  );

  const grouped = CATEGORIES.reduce<Record<Category, Capture[]>>((acc, cat) => {
    acc[cat] = yesterdayCaptures.filter((c) => c.category === cat);
    return acc;
  }, { Task: [], Idea: [], Note: [], Reference: [] });

  const hasYesterday = yesterdayCaptures.length > 0;

  const handleComplete = async (capture: Capture) => {
    const next = !capture.completed;
    updateCapture(capture.id, { completed: next });
    await markCaptureComplete(db, capture.id, next);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: ctaBottom + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerCard}>
            {avatar ? <Text style={styles.avatarDisplay}>{avatar}</Text> : null}
            <Text style={styles.greeting}>Good morning, {displayName} 👋</Text>
            <Text style={styles.dateStr}>{formatDigestDate()}</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{pendingTasks.length}</Text>
              <Text style={styles.statLabel}>pending tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{ideasCount}</Text>
              <Text style={styles.statLabel}>ideas noted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{captures.length}</Text>
              <Text style={styles.statLabel}>total notes</Text>
            </View>
          </View>

          {/* Pending tasks */}
          {pendingTasks.length > 0 && (
            <View style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <Feather name="check-circle" size={14} color={Colors.primaryBrown} />
                <Text style={styles.groupTitle}>Pending Tasks</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{pendingTasks.length}</Text>
                </View>
              </View>
              <View style={styles.taskList}>
                {pendingTasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskRow}
                    onPress={() => router.push(`/detail/${task.id}`)}
                    activeOpacity={0.7}
                  >
                    <TouchableOpacity
                      style={styles.taskCheck}
                      onPress={() => handleComplete(task)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="circle" size={22} color={Colors.primaryBrown} />
                    </TouchableOpacity>
                    <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
                    <Feather name="chevron-right" size={16} color={Colors.tan} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {pendingTasks.length === 0 && (
            <View style={styles.allDoneCard}>
              <Feather name="check-circle" size={20} color={Colors.primaryBrown} />
              <Text style={styles.allDoneText}>All tasks done. Great work!</Text>
            </View>
          )}

          {/* Yesterday's captures */}
          <View style={styles.groupHeader}>
            <Feather name="clock" size={14} color={Colors.bodyText} />
            <Text style={styles.groupTitle}>Yesterday</Text>
            <Text style={styles.groupDate}>{formatDigestDate()}</Text>
          </View>

          {!hasYesterday ? (
            <View style={styles.emptyState}>
              <Image source={talikhaLogo} style={{ width: 36, height: 36, opacity: 0.4 }} resizeMode="contain" />
              <Text style={styles.emptyText}>Nothing recorded yesterday.{'\n'}Start today!</Text>
            </View>
          ) : (
            CATEGORIES.map((cat) => {
              const items = grouped[cat];
              if (items.length === 0) return null;
              const summary = items.map((c) => c.title).join(', ');
              return (
                <View key={cat} style={styles.groupSection}>
                  <View style={styles.catHeader}>
                    <CapturePill category={cat} />
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{items.length}</Text>
                    </View>
                  </View>
                  <View style={styles.card}>
                    <Text style={styles.cardText}>{summary}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.ctaWrapper, { bottom: ctaBottom }]}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/recording')}
            activeOpacity={0.85}
          >
            <Ionicons name="mic" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.ctaText}>Start recording</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  headerCard: { marginBottom: 20, gap: 4 },
  avatarDisplay: { fontSize: 40, marginBottom: 6 },
  greeting: { fontSize: 26, fontWeight: '800', color: Colors.darkText, letterSpacing: -0.3 },
  dateStr: { fontSize: 12, color: Colors.tan, marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    paddingVertical: 16,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.primaryBrown },
  statLabel: { fontSize: 11, color: Colors.tan, fontWeight: '500' },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  groupSection: { marginBottom: 20 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  groupTitle: { fontSize: 13, fontWeight: '700', color: Colors.bodyText, flex: 1 },
  groupDate: { fontSize: 12, color: Colors.tan },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  countBadge: {
    backgroundColor: Colors.tan,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  taskList: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  taskCheck: { width: 24, alignItems: 'center' },
  taskTitle: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.darkText },

  allDoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5EAD8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  allDoneText: { fontSize: 14, fontWeight: '600', color: Colors.primaryBrown },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardText: { fontSize: 14, color: Colors.darkText, lineHeight: 20 },

  emptyState: { alignItems: 'center', paddingTop: 32, gap: 12, marginBottom: 24 },
  emptyText: { fontSize: 15, color: Colors.tan, textAlign: 'center', lineHeight: 22 },

  ctaWrapper: { position: 'absolute', left: 20, right: 20 },
  ctaButton: {
    backgroundColor: Colors.primaryBrown,
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
