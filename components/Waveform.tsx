import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const BAR_COUNT = 36;
const BAR_WIDTH = 4;
const BAR_GAP = 3;

export default function Waveform() {
  const animations = useRef<Animated.Value[]>(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(12))
  ).current;

  useEffect(() => {
    const loops = animations.map((anim, i) => {
      const minH = 8 + Math.random() * 12;
      const maxH = 40 + Math.random() * 40;
      const dur = 300 + Math.random() * 400;

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxH,
            duration: dur,
            delay: i * 40,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: minH,
            duration: dur,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return loop;
    });

    return () => {
      loops.forEach((l) => l.stop());
      animations.forEach((a) => a.stopAnimation());
    };
  }, []);

  return (
    <View style={styles.container}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: anim,
              marginHorizontal: BAR_GAP / 2,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: Colors.primaryBrown,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
