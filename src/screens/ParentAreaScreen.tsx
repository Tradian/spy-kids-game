import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { colors, radii, TOUCH_TARGET, type } from '../theme';
import { ParentMessage, RANK_LABELS } from '../types';
import {
  countCompletedMissions,
  listParentMessages,
  saveParentMessage,
  updateProfile,
} from '../db/repo';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';
import { playFile } from '../audio/audioService';

const MAX_RECORDING_SECONDS = 20;

/**
 * Behind the gate, spec section 3.10: plain-language progress, secret
 * message recording (20s cap, re-record any time), Scroll Room toggle,
 * missions-per-session limit, difficulty override. Text is fine here —
 * this room is for grown-ups.
 */
export function ParentAreaScreen() {
  const { profile, back, refreshProfile } = useApp();
  const [missionCount, setMissionCount] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);
  const [messages, setMessages] = useState<ParentMessage[]>([]);

  const reload = useCallback(async () => {
    if (!profile) return;
    setMissionCount(await countCompletedMissions(profile.id));
    setScrollCount(await countCompletedMissions(profile.id, 'scroll'));
    setMessages(await listParentMessages(profile.id));
  }, [profile]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!profile) return null;

  const set = async (patch: Parameters<typeof updateProfile>[1]) => {
    await updateProfile(profile.id, patch);
    await refreshProfile();
  };

  return (
    <ScreenShell onBack={back} title="Parent Area">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress in plain language */}
        <Section title={`${profile.name}'s progress`}>
          <Text style={styles.body}>
            {profile.name} is a {RANK_LABELS[profile.rank]} working at level {profile.difficultyNotch} of 3
            {profile.difficultyLocked ? ' (held there by you)' : ' (adjusting automatically)'}.
          </Text>
          <Text style={styles.body}>
            Missions completed: {missionCount}
            {profile.scrollRoomEnabled ? ` — including ${scrollCount} scroll ${scrollCount === 1 ? 'mission' : 'missions'}.` : '.'}
          </Text>
          <Text style={styles.bodySoft}>
            The game quietly raises the level after three first-try answers in a row, and lowers it if a
            mission needed two glowing hints. {profile.name} only ever sees the promotion ceremony.
          </Text>
        </Section>

        {/* Secret messages */}
        <Section title="Record a secret message">
          <Text style={styles.bodySoft}>
            Your voice plays as a “secret transmission” after {profile.name}'s next mission. Up to{' '}
            {MAX_RECORDING_SECONDS} seconds.
          </Text>
          <Recorder
            onSaved={async (uri) => {
              await saveParentMessage(profile.id, uri, 'Secret message');
              await reload();
            }}
          />
          {messages.map((m) => (
            <View key={m.id} style={styles.messageRow}>
              <Text style={styles.body}>
                {m.played ? '✅ delivered' : '📬 waiting'} · {new Date(m.createdAt).toLocaleDateString()}
              </Text>
              <Pressable style={styles.smallBtn} onPress={() => playFile(m.audioPath)}>
                <Text style={styles.smallBtnText}>▶ Play</Text>
              </Pressable>
            </View>
          ))}
        </Section>

        {/* Scroll Room */}
        <Section title="Scroll Room">
          <View style={styles.row}>
            <Text style={[styles.body, styles.rowLabel]}>
              Unlock the Scroll Room (scroll missions with Hebrew letters and a verse as each reward)
            </Text>
            <Switch
              value={profile.scrollRoomEnabled}
              onValueChange={(v) => set({ scrollRoomEnabled: v })}
              trackColor={{ true: colors.gold }}
            />
          </View>
        </Section>

        {/* Session limit */}
        <Section title="Missions per session">
          <View style={styles.choiceRow}>
            {[0, 1, 2, 3].map((n) => (
              <Choice
                key={n}
                label={n === 0 ? 'No limit' : String(n)}
                active={profile.missionsPerSession === n}
                onPress={() => set({ missionsPerSession: n })}
              />
            ))}
          </View>
        </Section>

        {/* Difficulty override */}
        <Section title="Difficulty override">
          <View style={styles.row}>
            <Text style={[styles.body, styles.rowLabel]}>Hold the level steady (stop automatic adjustment)</Text>
            <Switch
              value={profile.difficultyLocked}
              onValueChange={(v) => set({ difficultyLocked: v })}
              trackColor={{ true: colors.gold }}
            />
          </View>
          <View style={styles.choiceRow}>
            {([1, 2, 3] as const).map((n) => (
              <Choice
                key={n}
                label={`Level ${n}`}
                active={profile.difficultyNotch === n}
                onPress={() => set({ difficultyNotch: n })}
              />
            ))}
          </View>
        </Section>
      </ScrollView>
    </ScreenShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.choice, active && { backgroundColor: colors.gold }]}
      onPress={onPress}
    >
      <Text style={[styles.choiceText, active && { color: colors.textOnGold }]}>{label}</Text>
    </Pressable>
  );
}

function Recorder({ onSaved }: { onSaved: (uri: string) => Promise<void> }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, 500);
  const [busy, setBusy] = useState(false);
  const capTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    await recorder.prepareToRecordAsync();
    recorder.record();
    capTimer.current = setTimeout(stop, MAX_RECORDING_SECONDS * 1000);
  };

  const stop = async () => {
    if (capTimer.current) {
      clearTimeout(capTimer.current);
      capTimer.current = null;
    }
    setBusy(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        // recorder writes to cache; keep a durable copy in the document dir
        const dest = new File(Paths.document, `parent_message_${Date.now()}.m4a`);
        new File(uri).copy(dest);
        await onSaved(dest.uri);
      }
    } finally {
      setBusy(false);
    }
  };

  const secondsLeft = Math.max(
    0,
    MAX_RECORDING_SECONDS - Math.floor((state.durationMillis ?? 0) / 1000),
  );

  return (
    <Pressable
      style={[styles.recordBtn, state.isRecording && styles.recordBtnActive]}
      onPress={state.isRecording ? stop : start}
      disabled={busy}
    >
      <Text style={styles.recordText}>
        {state.isRecording ? `⏹ Stop (${secondsLeft}s left)` : '🎙️ Record new message'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.panel,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: { color: colors.gold, fontSize: type.body, fontWeight: '900', marginBottom: 10 },
  body: { color: colors.textBright, fontSize: type.body, lineHeight: 26, marginBottom: 6 },
  bodySoft: { color: colors.textSoft, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { flex: 1, marginRight: 12 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  choice: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.bgRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginBottom: 8,
  },
  choiceText: { color: colors.textBright, fontSize: type.body, fontWeight: '800' },
  recordBtn: {
    minHeight: TOUCH_TARGET,
    borderRadius: radii.pill,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  recordBtnActive: { backgroundColor: '#C93A2B' },
  recordText: { color: colors.textBright, fontSize: type.body, fontWeight: '900' },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  smallBtn: {
    backgroundColor: colors.bgRaised,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  smallBtnText: { color: colors.textBright, fontWeight: '800' },
});
