import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AVATARS, colors, radii, type } from '../theme';
import { RANK_LABELS } from '../types';
import { BADGES } from '../content/badges';
import { countCompletedMissions, listEarnedBadgeIds } from '../db/repo';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';

/** Badge wall + the Agent ID card — the show-it-to-grandma screen. */
export function BadgeWallScreen() {
  const { profile, back } = useApp();
  const [earned, setEarned] = useState<string[]>([]);
  const [missionCount, setMissionCount] = useState(0);

  useEffect(() => {
    if (!profile) return;
    listEarnedBadgeIds(profile.id).then(setEarned);
    countCompletedMissions(profile.id).then(setMissionCount);
  }, [profile]);

  if (!profile) return null;
  const avatar = AVATARS.find((a) => a.id === profile.avatarId) ?? AVATARS[0];
  const earnedSet = new Set(earned);

  return (
    <ScreenShell onBack={back} title="🏅 Badge Wall">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Agent ID card */}
        <View style={[styles.idCard, { borderColor: avatar.color }]}>
          <Text style={styles.idHeader}>SPY ACADEMY · AGENT ID</Text>
          <View style={styles.idRow}>
            <Text style={styles.idAvatar}>{avatar.emoji}</Text>
            <View style={styles.idInfo}>
              <Text style={styles.idName}>{profile.name}</Text>
              <Text style={styles.idRank}>{RANK_LABELS[profile.rank]}</Text>
              <Text style={styles.idMissions}>Missions: {missionCount}  {'⭐'.repeat(Math.min(5, missionCount))}</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.grid}>
          {BADGES.map((b) => {
            const has = earnedSet.has(b.id);
            return (
              <View key={b.id} style={[styles.badge, !has && styles.badgeLocked]}>
                <Text style={styles.badgeEmoji}>{has ? b.emoji : '🔒'}</Text>
                <Text style={styles.badgeName}>{b.name}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  idCard: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.panel,
    borderWidth: 5,
    padding: 18,
    marginVertical: 10,
  },
  idHeader: {
    color: colors.gold,
    fontSize: type.small,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
  },
  idRow: { flexDirection: 'row', alignItems: 'center' },
  idAvatar: { fontSize: 70, marginRight: 16 },
  idInfo: { flex: 1 },
  idName: { color: colors.textBright, fontSize: type.big, fontWeight: '900' },
  idRank: { color: colors.gold, fontSize: type.body, fontWeight: '800', marginTop: 2 },
  idMissions: { color: colors.textSoft, fontSize: type.body, marginTop: 6 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  badge: {
    width: 105,
    alignItems: 'center',
    backgroundColor: colors.bgPanel,
    borderRadius: radii.tile,
    padding: 12,
    margin: 6,
  },
  badgeLocked: { opacity: 0.35 },
  badgeEmoji: { fontSize: 40 },
  badgeName: {
    color: colors.textBright,
    fontSize: type.small,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
});
