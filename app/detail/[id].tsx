import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Share } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../../constants/colors';
import { useCaptureStore } from '../../store/useCaptureStore';
import { deleteCapture, updateCaptureCategory, markCaptureComplete, updateCaptureFields } from '../../lib/database';
import CapturePill from '../../components/CapturePill';
import { formatCaptureTimestamp } from '../../lib/utils';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const captures = useCaptureStore((s) => s.captures);
  const removeCapture = useCaptureStore((s) => s.removeCapture);
  const updateCapture = useCaptureStore((s) => s.updateCapture);
  const capture = captures.find((c) => c.id === id);

  const [draftTitle, setDraftTitle] = useState(capture?.title ?? '');
  const [draftSummary, setDraftSummary] = useState(capture?.summary ?? '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);

  const saveTitle = async () => {
    setEditingTitle(false);
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === capture?.title) return;
    updateCapture(capture!.id, { title: trimmed });
    await updateCaptureFields(db, capture!.id, { title: trimmed });
  };

  const saveSummary = async () => {
    setEditingSummary(false);
    const trimmed = draftSummary.trim();
    if (!trimmed || trimmed === capture?.summary) return;
    updateCapture(capture!.id, { summary: trimmed });
    await updateCaptureFields(db, capture!.id, { summary: trimmed });
  };

  if (!capture) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: Colors.bodyText, textAlign: 'center', marginTop: 40 }}>
          Note not found.
        </Text>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'This note will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            removeCapture(capture.id);
            await deleteCapture(db, capture.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleAddToTask = async () => {
    if (capture.category !== 'Task') {
      updateCapture(capture.id, { category: 'Task' });
      await updateCaptureCategory(db, capture.id, 'Task');
    } else {
      const next = !capture.completed;
      updateCapture(capture.id, { completed: next });
      await markCaptureComplete(db, capture.id, next);
    }
  };

  const handleExport = async () => {
    const hashtags = capture.tags.map((t) => `#${t}`).join(' ');
    const parts = [
      capture.title,
      '',
      capture.summary,
      hashtags ? `\n${hashtags}` : '',
      '',
      'via Talikha',
    ].filter(Boolean).join('\n');

    await Share.share({ message: parts, title: capture.title });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={24} color={Colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Note</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleDelete}>
          <Feather name="trash-2" size={19} color={Colors.tan} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => { setDraftTitle(capture.title); setEditingTitle(true); }} activeOpacity={0.7}>
          {editingTitle ? (
            <TextInput
              style={styles.captureTitle}
              value={draftTitle}
              onChangeText={setDraftTitle}
              onBlur={saveTitle}
              onSubmitEditing={saveTitle}
              autoFocus
              multiline
              returnKeyType="done"
              blurOnSubmit
            />
          ) : (
            <View style={styles.editableRow}>
              <Text style={[styles.captureTitle, { flex: 1 }]}>{capture.title}</Text>
              <Feather name="edit-2" size={14} color={Colors.tan} style={{ marginTop: 4 }} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.metaRow}>
          <CapturePill category={capture.category} />
          <Text style={styles.timestamp}>{formatCaptureTimestamp(capture.createdAt)}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={[styles.sectionLabel, { marginBottom: 8, marginTop: 4 }]}>TRANSCRIPT</Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>{capture.transcript}</Text>
        </View>

        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionLabel}>AI SUMMARY</Text>
          <TouchableOpacity onPress={() => { setDraftSummary(capture.summary); setEditingSummary(true); }}>
            <Feather name="edit-2" size={12} color={Colors.tan} />
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {editingSummary ? (
            <TextInput
              style={[styles.cardText, styles.editInput]}
              value={draftSummary}
              onChangeText={setDraftSummary}
              onBlur={saveSummary}
              autoFocus
              multiline
            />
          ) : (
            <Text style={styles.cardText}>{capture.summary}</Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>TAGS</Text>
        <View style={styles.tagsRow}>
          {capture.tags.map((tag, i) => (
            <View key={i} style={styles.tagPill}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              capture.category === 'Task' && capture.completed && styles.primaryBtnDone,
            ]}
            onPress={handleAddToTask}
            activeOpacity={0.85}
          >
            <Feather
              name={
                capture.category !== 'Task'
                  ? 'check-square'
                  : capture.completed
                  ? 'check-circle'
                  : 'circle'
              }
              size={16}
              color="#FFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.primaryBtnText}>
              {capture.category !== 'Task'
                ? 'Add to Task'
                : capture.completed
                ? 'Completed'
                : 'Mark Complete'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={handleExport}>
            <Text style={styles.outlineBtnText}>Export</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 36,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  captureTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.darkText,
    lineHeight: 30,
    marginBottom: 12,
  },
  editableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  editInput: {
    padding: 0,
    minHeight: 60,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.tan,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.bodyText,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardText: {
    fontSize: 14,
    color: Colors.darkText,
    lineHeight: 21,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 28,
  },
  tagPill: {
    backgroundColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
    color: Colors.bodyText,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.primaryBrown,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDone: {
    backgroundColor: Colors.tan,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primaryBrown,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: Colors.primaryBrown,
    fontSize: 15,
    fontWeight: '700',
  },
});
