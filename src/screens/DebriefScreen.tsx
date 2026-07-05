import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';
import { Mission, Rank, RANK_LABELS, StageResult } from '../types';
import { gadgetById } from '../content/gadgets';
import { badgeById } from '../content/badges';
import { stampsFor } from '../logic/adaptive';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';
import { BigButton } from '../components/BigButton';
import { playSfx, say, stopSpeaking } from '../audio/audioService';
import { LINES } from '../content/lines';

interface Props {
  mission: Mission;
  results: StageResult[];
  promotedTo: Rank | null;
  newBadgeIds: string[];
}

/**
 * Gadget awarded, ID card stamped, Spymaster sign-off joke — and, on the
 * rare big day, the promotion ceremony.
 */
export function DebriefScreen({ mission, results, promotedTo, newBadgeIds }: Props) {
  const { goHome } = useApp();
  const gadget = gadgetById(mission.gadgetRewardId);
  const stamps = stampsFor(results);
  const [ceremonyDone, setCeremonyDone] = useState(!promotedTo);

  useEffect(() => {
    if (promotedTo) {
      playSfx('sfx_promotion');
      say(LINES.promotion);
    } else {
      playSfx('sfx_stamp');
      say(mission.debriefLine, `debrief_${mission.id}`);
    }
    return stopSpeaking;
  }, [mission, promotedTo]);

  if (promotedTo && !ceremonyDone) {
    return (
      <ScreenShell>
        <View style={styles.center}>
          <Text style={styles.ceremonyEmoji}>🎖️</Text>
          <Text style={styles.ceremonyTitle}>PROMOTED!</Text>
          <Text style={styles.ceremonyRank}>{RANK_LABELS[promotedTo]}</Text>
          <BigButton
            label="Stand tall, Agent"
            emoji="🫡"
            onPress={() => {
              stopSpeaking();
              say(mission.debriefLine, `debrief_${mission.id}`);
              setCeremonyDone(true);
            }}
            style={styles.btn}
          />
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <View style={styles.center}>
        <Text style={styles.title}>Mission Accomplished!</Text>
        <Text style={styles.stamps}>{'⭐'.repeat(stamps)}</Text>

        <View style={styles.gadgetCard}>
          <Text style={styles.gadgetEmoji}>{gadget.emoji}</Text>
          <Text style={styles.gadgetName}>New gadget: {gadget.name}</Text>
        </View>

        {newBadgeIds.length > 0 && (
          <View style={styles.badgeRow}>
            {newBadgeIds.map((id) => {
              const b = badgeById(id);
              return (
                <View key={id} style={styles.badge}>
                  <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                  <Text style={styles.badgeName}>{b.name}</Text>
                </View>
              );
            })}
          </View>
        )}

        <BigButton label="Back to HQ" emoji="🏠" onPress={() => { stopSpeaking(); goHome(); }} style={styles.btn} />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.textBright, fontSize: 34, fontWeight: '900', textAlign: 'center' },
  stamps: { fontSize: 44, marginVertical: 12 },
  gadgetCard: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.panel,
    borderWidth: 4,
    borderColor: colors.sky,
    padding: 20,
    alignItems: 'center',
    marginVertical: 10,
    width: '90%',
  },
  gadgetEmoji: { fontSize: 70 },
  gadgetName: { color: colors.textBright, fontSize: type.title, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 6 },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.bgRaised,
    borderRadius: radii.tile,
    padding: 10,
    margin: 6,
  },
  badgeEmoji: { fontSize: 36 },
  badgeName: { color: colors.gold, fontSize: type.small, fontWeight: '800', marginTop: 4 },
  ceremonyEmoji: { fontSize: 100 },
  ceremonyTitle: { color: colors.gold, fontSize: 44, fontWeight: '900', letterSpacing: 4, marginTop: 10 },
  ceremonyRank: { color: colors.textBright, fontSize: type.big, fontWeight: '800', marginTop: 8 },
  btn: { marginTop: 26 },
});
