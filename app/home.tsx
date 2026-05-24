import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const talikhaLogo = require('../assets/talikha-logo.png');
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { useCaptureStore } from '../store/useCaptureStore';
import { useSettingsStore, FREE_CAPTURE_LIMIT } from '../store/useSettingsStore';
import { markCaptureComplete, deleteCapture } from '../lib/database';
import type { Category } from '../lib/database';
import PaywallModal from '../components/PaywallModal';
import CaptureCard from '../components/CaptureCard';
import TabBar from '../components/TabBar';

const TAB_BAR_HEIGHT = 72;

export default function HomeScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const captures = useCaptureStore((s) => s.captures);
  const updateCapture = useCaptureStore((s) => s.updateCapture);
  const removeCapture = useCaptureStore((s) => s.removeCapture);
  const plan = useSettingsStore((s) => s.plan);
  const capturesCreatedThisMonth = useSettingsStore((s) => s.capturesCreatedThisMonth);
  const insets = useSafeAreaInsets();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | Category>('all');
  const searchInputRef = useRef<TextInput>(null);

  const fabBottom = (insets.bottom || 16) + 8 + TAB_BAR_HEIGHT + 16;

  const isFree = plan === 'free';
  const usagePercent = Math.min(capturesCreatedThisMonth / FREE_CAPTURE_LIMIT, 1);

  const visibleCaptures = activeFilter === 'all'
    ? captures
    : captures.filter((c) => c.category === activeFilter);

  const pendingTasks = visibleCaptures.filter((c) => c.category === 'Task' && !c.completed);
  const recentCaptures = visibleCaptures.filter((c) => !(c.category === 'Task' && !c.completed));

  const q = searchQuery.trim().toLowerCase();
  const filteredCaptures = q
    ? captures.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.summary.toLowerCase().includes(q) ||
          c.transcript.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      )
    : captures;

  const openSearch = () => {
    setIsSearching(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleComplete = async (capture: Capture) => {
    const next = !capture.completed;
    updateCapture(capture.id, { completed: next });
    await markCaptureComplete(db, capture.id, next);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Note', 'This note will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          removeCapture(id);
          await deleteCapture(db, id);
        },
      },
    ]);
  };

  const handleMicPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFree && capturesCreatedThisMonth >= FREE_CAPTURE_LIMIT) {
      setPaywallVisible(true);
      return;
    }
    router.push('/recording');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <PaywallModal
        visible={paywallVisible}
        used={capturesCreatedThisMonth}
        onClose={() => setPaywallVisible(false)}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.topBar}>
          {isSearching ? (
            <>
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search notes…"
                placeholderTextColor={Colors.tan}
                returnKeyType="search"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={closeSearch} style={styles.searchClose}>
                <Feather name="x-circle" size={20} color={Colors.tan} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.appName}>Talikha</Text>
              <TouchableOpacity onPress={openSearch}>
                <Feather name="search" size={20} color={Colors.darkText} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {!isSearching && !isFree && (
          <View style={styles.filterRow}>
            {(['all', 'Task', 'Idea', 'Note', 'Reference'] as const)
              .map((f) => {
                const isActive = activeFilter === f;
                const label = f === 'all' ? 'All' : f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setActiveFilter(f)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}

        {isSearching ? (
          <FlatList
            data={filteredCaptures}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CaptureCard
                capture={item}
                onPress={() => router.push(`/detail/${item.id}`)}
                onComplete={() => handleComplete(item)}
                onDelete={() => handleDelete(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="search" size={40} color={Colors.tan} />
                <Text style={styles.emptyText}>{`No results for "${searchQuery}"`}</Text>
              </View>
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: fabBottom + 60 }]}
            showsVerticalScrollIndicator={false}
          >
            {isFree && (
              <View style={styles.usageWrap}>
                <View style={styles.usageTextRow}>
                  <Text style={styles.usageText}>
                    {capturesCreatedThisMonth} of {FREE_CAPTURE_LIMIT} free notes used
                  </Text>
                  {capturesCreatedThisMonth >= FREE_CAPTURE_LIMIT && (
                    <Text style={styles.usageFull}>Limit reached</Text>
                  )}
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${usagePercent * 100}%` as any }]} />
                </View>
              </View>
            )}

            {pendingTasks.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="check-circle" size={14} color={Colors.primaryBrown} />
                  <Text style={styles.sectionLabel}>Pending Tasks</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{pendingTasks.length}</Text>
                  </View>
                </View>
                {pendingTasks.map((item) => (
                  <CaptureCard
                    key={item.id}
                    capture={item}
                    onPress={() => router.push(`/detail/${item.id}`)}
                    onComplete={() => handleComplete(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="clock" size={14} color={Colors.bodyText} />
                <Text style={styles.sectionLabel}>Recent</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{captures.length}</Text>
                </View>
              </View>
              {recentCaptures.length === 0 ? (
                <View style={styles.emptyState}>
                  <Image source={talikhaLogo} style={{ width: 40, height: 40, opacity: 0.4 }} resizeMode="contain" />
                  <Text style={styles.emptyText}>No notes yet.{'\n'}Tap the mic to start!</Text>
                </View>
              ) : (
                recentCaptures.map((item) => (
                  <CaptureCard
                    key={item.id}
                    capture={item}
                    onPress={() => router.push(`/detail/${item.id}`)}
                    onComplete={() => handleComplete(item)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {!isSearching && (
        <TouchableOpacity
          style={[styles.fab, { bottom: fabBottom }]}
          onPress={handleMicPress}
          activeOpacity={0.85}
        >
          <Image source={talikhaLogo} style={{ width: 38, height: 38, tintColor: '#FFF' }} resizeMode="contain" />
        </TouchableOpacity>
      )}

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  appName: {
    fontSize: 26,
    fontFamily: Fonts.extraBold,
    color: Colors.darkText,
    letterSpacing: -0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.darkText,
    paddingVertical: 6,
  },
  searchClose: { paddingLeft: 8 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    gap: 6,
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F5EAD8',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryBrown,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: Colors.bodyText,
  },
  filterChipTextActive: { color: '#FFF' },
  listContent: { paddingHorizontal: 20, paddingBottom: 200 },
  usageWrap: { marginBottom: 16 },
  usageTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  usageText: { fontSize: 12, color: Colors.tan, fontFamily: Fonts.medium },
  usageFull: { fontSize: 11, color: Colors.primaryBrown, fontFamily: Fonts.bold },
  barTrack: { height: 4, borderRadius: 2, backgroundColor: Colors.border, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2, backgroundColor: Colors.primaryBrown },
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
  },
  sectionLabel: { fontSize: 13, fontFamily: Fonts.semiBold, color: Colors.bodyText },
  countBadge: {
    backgroundColor: Colors.tan,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  countText: { fontSize: 11, fontFamily: Fonts.bold, color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.tan, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryBrown,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryBrown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
