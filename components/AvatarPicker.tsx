import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

const AVATAR_EMOJIS = [
  // Faces
  '😊','😎','🤩','🥰','😄','🤗','😇','🥳','😏','🤓',
  // Characters
  '🦸','🧙','🧑‍💻','🧑‍🎨','🧑‍🚀','🦹','🧚','🧜',
  // Animals
  '🐶','🐱','🦊','🐻','🦁','🐯','🐼','🦄','🐸','🐺',
  // Vibes
  '🌟','⚡','🔥','💫','🌈','🍀','👑','💎','🚀','🎯',
];

interface AvatarPickerProps {
  visible: boolean;
  current: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ visible, current, onSelect, onClose }: AvatarPickerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Choose your avatar</Text>

        <FlatList
          data={AVATAR_EMOJIS}
          keyExtractor={(item) => item}
          numColumns={5}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const selected = item === current;
            return (
              <TouchableOpacity
                style={[styles.emojiCell, selected && styles.emojiCellSelected]}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.7}
              >
                <Text style={styles.emoji}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(59,32,8,0.3)',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkText,
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    gap: 10,
  },
  emojiCell: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiCellSelected: {
    backgroundColor: '#F5EAD8',
    borderColor: Colors.primaryBrown,
    borderWidth: 2,
  },
  emoji: {
    fontSize: 28,
  },
});
