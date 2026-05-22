import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import CapturePill from './CapturePill';
import { getRelativeTime } from '../lib/utils';
import type { Capture } from '../lib/database';

interface CaptureCardProps {
  capture: Capture;
  onPress: () => void;
  onComplete?: () => void;
  onDelete?: () => void;
}

export default function CaptureCard({ capture, onPress, onComplete, onDelete }: CaptureCardProps) {
  const swipeRef = useRef<Swipeable>(null);
  const isTask = capture.category === 'Task';
  const isDone = isTask && capture.completed;

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        swipeRef.current?.close();
        onDelete?.();
      }}
      activeOpacity={0.85}
    >
      <Feather name="trash-2" size={20} color="#FFF" />
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={onDelete ? renderRightActions : undefined}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <TouchableOpacity
        style={[styles.card, isDone && styles.cardDone]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.row}>
          {isTask && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); onComplete?.(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
              disabled={!onComplete}
            >
              <Feather
                name={isDone ? 'check-circle' : 'circle'}
                size={20}
                color={isDone ? Colors.tan : Colors.primaryBrown}
                style={{ marginTop: 1 }}
              />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={2}>
            {capture.title}
          </Text>
          <CapturePill category={capture.category} />
        </View>
        <Text style={styles.time}>{getRelativeTime(capture.createdAt)}</Text>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardDone: {
    opacity: 0.55,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkText,
    lineHeight: 20,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.tan,
  },
  time: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.tan,
  },
  deleteAction: {
    backgroundColor: '#E53935',
    borderRadius: 16,
    marginBottom: 12,
    marginLeft: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
