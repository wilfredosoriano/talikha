import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import type { Category } from '../lib/database';

const categoryOpacity: Record<Category, number> = {
  Task: 1.0,
  Idea: 0.85,
  Reference: 0.70,
  Note: 0.60,
};

interface CapturePillProps {
  category: Category;
}

export default function CapturePill({ category }: CapturePillProps) {
  return (
    <View style={[styles.pill, { opacity: categoryOpacity[category] }]}>
      <Text style={styles.label}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.primaryBrown,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
});
