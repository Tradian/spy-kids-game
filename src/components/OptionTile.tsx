import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, type } from '../theme';
import { PuzzleOption } from '../types';

interface Props {
  option: PuzzleOption;
  onPress: (o: PuzzleOption) => void;
  /** Third-miss support: the correct tile pulses gold until tapped. */
  glowing?: boolean;
  /** Set briefly after a wrong tap for the soft shake. */
  shaking?: boolean;
  /** Big Hebrew/latin glyphs vs word tiles size themselves differently. */
  wordTile?: boolean;
  disabled?: boolean;
}

export function OptionTile({ option, onPress, glowing, shaking, wordTile, disabled }: Props) {
  const shake = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shaking) return;
    shake.setValue(0);
    Animated.sequence(
      [10, -10, 7, -7, 4, 0].map((v) =>
        Animated.timing(shake, { toValue: v, duration: 55, useNativeDriver: true }),
      ),
    ).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [shaking, shake]);

  useEffect(() => {
    if (glowing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0, duration: 500, useNativeDriver: false }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    glow.setValue(0);
  }, [glowing, glow]);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.outline, colors.gold],
  });
  const bg = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bgRaised, '#4a4322'],
  });

  return (
    <Animated.View style={{ transform: [{ translateX: shake }] }}>
      <Pressable onPress={() => onPress(option)} disabled={disabled}>
        {({ pressed }) => (
          <Animated.View
            style={[
              styles.tile,
              wordTile && styles.wordTile,
              { borderColor, backgroundColor: bg },
              glowing && styles.glowShadow,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
          >
            {option.emoji ? <Text style={styles.emoji}>{option.emoji}</Text> : null}
            <Text style={[styles.label, wordTile && styles.wordLabel]}>{option.label}</Text>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    minWidth: 88,
    minHeight: 88,
    paddingHorizontal: 18,
    paddingVertical: 10,
    margin: 8,
    borderRadius: radii.tile,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordTile: {
    minWidth: 132,
  },
  glowShadow: {
    shadowColor: colors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  emoji: { fontSize: 30, marginBottom: 2 },
  label: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.textBright,
  },
  wordLabel: { fontSize: 32 },
});
