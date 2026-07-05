import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';
import { RANK_LABELS } from '../types';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';
import { ParentGate } from '../components/ParentGate';
import { say } from '../audio/audioService';
import { LINES } from '../content/lines';

/**
 * HQ: the Spymaster at the desk and the doors. A fourth door appears only
 * when the Scroll Room is enabled for this child.
 */
export function HQScreen() {
  const { profile, navigate, back } = useApp();

  useEffect(() => {
    say(LINES.welcomeHQ);
  }, []);

  if (!profile) return null;

  return (
    <ScreenShell onBack={back}>
      <View style={styles.desk}>
        <Text style={styles.spymaster}>🕵️</Text>
        <View>
          <Text style={styles.agentName}>Agent {profile.name}</Text>
          <Text style={styles.rank}>{RANK_LABELS[profile.rank]}</Text>
        </View>
      </View>

      <View style={styles.doors}>
        <Door emoji="🗺️" label="Missions" color={colors.gold} onPress={() => navigate({ name: 'missionMap', track: 'core' })} />
        <Door emoji="🧰" label="Gadget Locker" color={colors.sky} onPress={() => navigate({ name: 'gadgetLocker' })} />
        <Door emoji="🏅" label="Badge Wall" color={colors.mint} onPress={() => navigate({ name: 'badgeWall' })} />
        {profile.scrollRoomEnabled && (
          <Door emoji="📜" label="Scroll Room" color={colors.parchment} onPress={() => navigate({ name: 'missionMap', track: 'scroll' })} />
        )}
      </View>

      <View style={styles.footer}>
        <ParentGate onPassed={() => navigate({ name: 'parentArea' })} />
      </View>
    </ScreenShell>
  );
}

function Door({ emoji, label, color, onPress }: { emoji: string; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.door, { borderColor: color }]} onPress={onPress}>
      <Text style={styles.doorEmoji}>{emoji}</Text>
      <Text style={styles.doorLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  desk: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPanel,
    borderRadius: radii.panel,
    padding: 18,
    marginTop: 8,
  },
  spymaster: { fontSize: 56, marginRight: 14 },
  agentName: { color: colors.textBright, fontSize: type.title, fontWeight: '900' },
  rank: { color: colors.gold, fontSize: type.body, fontWeight: '700', marginTop: 2 },
  doors: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
  },
  door: {
    width: 150,
    height: 170,
    margin: 10,
    borderRadius: radii.panel,
    borderWidth: 5,
    backgroundColor: colors.bgPanel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doorEmoji: { fontSize: 60 },
  doorLabel: { color: colors.textBright, fontSize: type.body, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  footer: { alignItems: 'flex-end' },
});
