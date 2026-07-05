import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';
import { Mission, MissionStatus, Track } from '../types';
import { missionsFor } from '../content/missions';
import { getProgressForProfile } from '../db/repo';
import { makeDailyMission, todayKey } from '../logic/puzzleEngine';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';
import { say } from '../audio/audioService';
import { LINES } from '../content/lines';

interface Node {
  mission: Mission;
  status: MissionStatus;
  stamps: number;
  daily?: boolean;
}

/**
 * Path of mission nodes for the current rank: completed nodes stamped,
 * current node pulsing, future nodes visible but locked, plus one
 * daily-fresh node.
 */
export function MissionMapScreen({ track }: { track: Track }) {
  const { profile, navigate, back, missionsThisSession } = useApp();
  const [nodes, setNodes] = useState<Node[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const progress = await getProgressForProfile(profile.id);
      const done = new Map(progress.filter((p) => p.status === 'completed').map((p) => [p.missionId, p]));
      const list = missionsFor(profile.rank, track);

      let unlocked = true; // first incomplete node on the path is available
      const pathNodes: Node[] = list.map((m) => {
        const row = done.get(m.id);
        if (row) return { mission: m, status: 'completed', stamps: row.stamps };
        const status: MissionStatus = unlocked ? 'available' : 'locked';
        unlocked = false;
        return { mission: m, status, stamps: 0 };
      });

      if (track === 'core') {
        const day = todayKey();
        const daily = makeDailyMission(profile, day);
        const dailyDone = done.has(daily.id);
        pathNodes.push({
          mission: daily,
          status: dailyDone ? 'completed' : 'available',
          stamps: dailyDone ? done.get(daily.id)!.stamps : 0,
          daily: true,
        });
      }
      setNodes(pathNodes);
    })();
  }, [profile, track]);

  if (!profile || !nodes) return <ScreenShell onBack={back} scroll={track === 'scroll'} title="..." ><View /></ScreenShell>;

  const sessionLimitReached =
    profile.missionsPerSession > 0 && missionsThisSession >= profile.missionsPerSession;

  const open = (node: Node) => {
    if (node.status === 'locked') {
      say('That door is still locked, Agent. Finish the missions before it!');
      return;
    }
    if (sessionLimitReached) {
      say(LINES.sessionDone);
      return;
    }
    navigate({ name: 'briefing', mission: node.mission });
  };

  return (
    <ScreenShell
      onBack={back}
      scroll={track === 'scroll'}
      title={track === 'scroll' ? '📜 Scroll Room' : '🗺️ Missions'}
    >
      <ScrollView contentContainerStyle={styles.path} showsVerticalScrollIndicator={false}>
        {sessionLimitReached && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitText}>🌙 All missions done for now. See you next time, Agent!</Text>
          </View>
        )}
        {nodes.map((node, i) => (
          <View key={node.mission.id} style={[styles.nodeRow, { alignSelf: i % 2 ? 'flex-end' : 'flex-start' }]}>
            <MissionNode node={node} onPress={() => open(node)} dim={sessionLimitReached} />
          </View>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

function MissionNode({ node, onPress, dim }: { node: Node; onPress: () => void; dim: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const active = node.status === 'available';

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.node,
          node.status === 'completed' && styles.nodeDone,
          node.status === 'locked' && styles.nodeLocked,
          node.daily && styles.nodeDaily,
          active && { transform: [{ scale }] },
          dim && { opacity: 0.45 },
        ]}
      >
        <Text style={styles.nodeEmoji}>{node.status === 'locked' ? '🔒' : node.mission.icon}</Text>
        <Text style={styles.nodeTitle}>{node.mission.title}</Text>
        {node.status === 'completed' && (
          <Text style={styles.stamps}>{'⭐'.repeat(node.stamps)}</Text>
        )}
        {node.daily && node.status !== 'completed' && <Text style={styles.dailyTag}>TODAY</Text>}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  path: { paddingVertical: 12, paddingHorizontal: 8 },
  nodeRow: { marginVertical: 10, width: '70%' },
  node: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.panel,
    borderWidth: 5,
    borderColor: colors.gold,
    padding: 16,
    alignItems: 'center',
  },
  nodeDone: { borderColor: colors.mint, opacity: 0.9 },
  nodeLocked: { borderColor: colors.outline, opacity: 0.55 },
  nodeDaily: { borderColor: colors.lilac },
  nodeEmoji: { fontSize: 48 },
  nodeTitle: {
    color: colors.textBright,
    fontSize: type.body,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },
  stamps: { fontSize: 20, marginTop: 4 },
  dailyTag: {
    color: colors.lilac,
    fontWeight: '900',
    fontSize: type.small,
    marginTop: 4,
    letterSpacing: 2,
  },
  limitBanner: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.tile,
    padding: 14,
    marginBottom: 10,
  },
  limitText: { color: colors.textSoft, fontSize: type.body, textAlign: 'center' },
});
