import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, TOUCH_TARGET } from '../theme';
import { say } from '../audio/audioService';

interface Props {
  line: string;
  audioKey?: string;
  /** Optional short caption under the face — parent-readable, not required. */
  caption?: string;
}

/**
 * The Spymaster's face: tap to (re)play the current prompt. Present on
 * every code stage so no child-facing interaction ever depends on text.
 */
export function SpymasterBubble({ line, audioKey, caption }: Props) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.face} onPress={() => say(line, audioKey)}>
        <Text style={styles.faceEmoji}>🕵️</Text>
        <View style={styles.speaker}>
          <Text style={styles.speakerEmoji}>🔊</Text>
        </View>
      </Pressable>
      {caption ? (
        <View style={styles.bubble}>
          <Text style={styles.caption}>{caption}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  face: {
    width: TOUCH_TARGET + 12,
    height: TOUCH_TARGET + 12,
    borderRadius: radii.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 3,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceEmoji: { fontSize: 40 },
  speaker: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    padding: 3,
  },
  speakerEmoji: { fontSize: 14 },
  bubble: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: colors.bgPanel,
    borderRadius: radii.tile,
    padding: 12,
  },
  caption: { color: colors.textSoft, fontSize: 15, fontWeight: '600' },
});
