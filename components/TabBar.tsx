import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

type Tab = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const TABS: Tab[] = [
  { label: 'Home',     icon: 'grid-outline',          activeIcon: 'grid',          route: '/home'     },
  { label: 'Digest',   icon: 'calendar-outline',      activeIcon: 'calendar',      route: '/digest'   },
  { label: 'Settings', icon: 'person-circle-outline', activeIcon: 'person-circle', route: '/settings' },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: (insets.bottom || 16) + 8 }]}>
      <View style={styles.pill}>
        {TABS.map((tab) => {
          const isActive = pathname === tab.route || (pathname === '/' && tab.route === '/home');
          const color = isActive ? Colors.primaryBrown : Colors.tan;
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tab}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={20} color={color} />
              </View>
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
    shadowColor: '#3B2008',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#F5EAD8',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
