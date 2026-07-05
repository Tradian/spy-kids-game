import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';
import { Gadget } from '../types';
import { GADGETS, gadgetById } from '../content/gadgets';
import { listEarnedGadgetIds } from '../db/repo';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';
import { say } from '../audio/audioService';

/** Grid of earned gadgets; each is tappable with a sound and a wiggle. */
export function GadgetLockerScreen() {
  const { profile, back } = useApp();
  const [earned, setEarned] = useState<string[]>([]);

  useEffect(() => {
    if (!profile) return;
    listEarnedGadgetIds(profile.id).then(setEarned);
  }, [profile]);

  const earnedSet = new Set(earned);

  return (
    <ScreenShell onBack={back} title="🧰 Gadget Locker">
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {GADGETS.map((g) =>
          earnedSet.has(g.id) ? (
            <GadgetTile key={g.id} gadget={gadgetById(g.id)} />
          ) : (
            <View key={g.id} style={[styles.tile, styles.tileLocked]}>
              <Text style={styles.lockedEmoji}>❓</Text>
            </View>
          ),
        )}
      </ScrollView>
    </ScreenShell>
  );
}

function GadgetTile({ gadget }: { gadget: Gadget }) {
  const wiggle = useRef(new Animated.Value(0)).current;

  const tap = () => {
    say(gadget.tapLine, `gadget_${gadget.id}`);
    wiggle.setValue(0);
    Animated.sequence(
      [1, -1, 0.7, -0.7, 0].map((v) =>
        Animated.timing(wiggle, { toValue: v, duration: 90, useNativeDriver: true }),
      ),
    ).start();
  };

  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });

  return (
    <Pressable onPress={tap}>
      <Animated.View style={[styles.tile, { transform: [{ rotate }] }]}>
        <Text style={styles.gadgetEmoji}>{gadget.emoji}</Text>
        <Text style={styles.gadgetName}>{gadget.name}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tile: {
    width: 150,
    height: 140,
    margin: 8,
    borderRadius: radii.panel,
    borderWidth: 4,
    borderColor: colors.sky,
    backgroundColor: colors.bgPanel,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  tileLocked: { borderColor: colors.outline, opacity: 0.4 },
  lockedEmoji: { fontSize: 44 },
  gadgetEmoji: { fontSize: 52 },
  gadgetName: {
    color: colors.textBright,
    fontSize: type.small,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },
});
