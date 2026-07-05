import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, TOUCH_TARGET, type } from '../theme';

interface Props {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  /** Scroll Room screens get the warmer lamplit palette. */
  scroll?: boolean;
}

export function ScreenShell({ children, title, onBack, scroll }: Props) {
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: scroll ? colors.scrollBg : colors.bgDeep }]}>
      {(title || onBack) && (
        <View style={styles.header}>
          {onBack ? (
            <Pressable style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backEmoji}>◀️</Text>
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          <Text style={styles.title}>{title ?? ''}</Text>
          <View style={styles.backBtn} />
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  backBtn: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backEmoji: { fontSize: 28 },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.textBright,
    fontSize: type.title,
    fontWeight: '800',
  },
  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
});
