import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text } from 'react-native';

const PIECES = ['🎉', '⭐', '✨', '🎊', '💛', '💙'];
const COUNT = 22;

/** Cheap and cheerful falling-emoji confetti for mission completion. */
export function Confetti() {
  const { width, height } = Dimensions.get('window');
  const anims = useRef(
    Array.from({ length: COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.timing(a, {
        toValue: 1,
        duration: 2200 + (i % 5) * 350,
        delay: (i % 7) * 120,
        useNativeDriver: true,
      }).start();
    });
  }, [anims]);

  return (
    <>
      {anims.map((a, i) => {
        const startX = ((i * 137) % 100) / 100 * width;
        const drift = ((i % 3) - 1) * 60;
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.piece,
              {
                left: startX,
                transform: [
                  { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-60, height + 60] }) },
                  { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
                  { rotate: a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${i % 2 ? '' : '-'}360deg`] }) },
                ],
              },
            ]}
          >
            <Text style={styles.emoji}>{PIECES[i % PIECES.length]}</Text>
          </Animated.View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0 },
  emoji: { fontSize: 26 },
});
