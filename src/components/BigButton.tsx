import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, TOUCH_TARGET, type } from '../theme';

interface Props {
  label: string;
  emoji?: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

/** The one true chunky button. Nothing child-facing is smaller than this. */
export function BigButton({ label, emoji, onPress, color, textColor, style, disabled }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: color ?? colors.gold, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor ?? colors.textOnGold }]}>
        {emoji ? `${emoji}  ` : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: TOUCH_TARGET + 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: type.title,
    fontWeight: '800',
  },
});
