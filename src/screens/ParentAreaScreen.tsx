import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AudioModule, RecordingPresets, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { colors, radii, TOUCH_TARGET, type } from '../theme';
import { FieldOp, FieldSkill, FieldStage, ParentMessage, RANK_LABELS } from '../types';
import {
  countCompletedMissions,
  deleteFieldOp,
  listFieldOps,
  listParentMessages,
  saveFieldOp,
  saveParentMessage,
  updateProfile,
} from '../db/repo';
import { SKILL_LABELS } from '../logic/fieldOps';
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
  const [fieldOps, setFieldOps] = useState<FieldOp[]>([]);

  const reload = useCallback(async () => {
    if (!profile) return;
    setMissionCount(await countCompletedMissions(profile.id));
    setScrollCount(await countCompletedMissions(profile.id, 'scroll'));
    setMessages(await listParentMessages(profile.id));
    setFieldOps(await listFieldOps());
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

        {/* Field Ops */}
        <Section title="Field Ops — real-world missions">
          <Text style={styles.bodySoft}>
            Build a mission for a walk or a hunt: name each stop with your own names for places, pick
            what to practice there, and write the secret message for the final vault. Everything you
            type stays on this device only — it is never uploaded anywhere.
          </Text>
          {fieldOps.map((op) => (
            <View key={op.id} style={styles.messageRow}>
              <Text style={styles.body}>
                {op.icon} {op.title} · {op.stages.length} {op.stages.length === 1 ? 'stop' : 'stops'}
              </Text>
              <Pressable
                style={styles.smallBtn}
                onPress={async () => {
                  await deleteFieldOp(op.id);
                  await reload();
                }}
              >
                <Text style={styles.smallBtnText}>✕ Remove</Text>
              </Pressable>
            </View>
          ))}
          <FieldOpBuilder
            onSaved={async (op) => {
              await saveFieldOp(op);
              await reload();
            }}
          />
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

const FO_ICONS = ['💎', '🧳', '🗺️', '🐾', '🌳', '🛝', '🚁', '🔦'];
const FO_SKILLS = Object.keys(SKILL_LABELS) as FieldSkill[];

function FieldOpBuilder({ onSaved }: { onSaved: (op: FieldOp) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [briefing, setBriefing] = useState('');
  const [secret, setSecret] = useState('');
  const [icon, setIcon] = useState(FO_ICONS[0]);
  const [stages, setStages] = useState<FieldStage[]>([
    { location: '', skill: 'surprise' },
    { location: '', skill: 'surprise' },
  ]);

  const setStage = (i: number, patch: Partial<FieldStage>) =>
    setStages((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const save = async () => {
    const cleaned = stages.filter((s) => s.location.trim());
    if (!title.trim() || cleaned.length === 0) return;
    await onSaved({
      id: `field_${Date.now().toString(36)}`,
      title: title.trim(),
      icon,
      briefing: briefing.trim(),
      secret: secret.trim(),
      stages: cleaned,
      createdAt: Date.now(),
    });
    setTitle('');
    setBriefing('');
    setSecret('');
    setStages([{ location: '', skill: 'surprise' }, { location: '', skill: 'surprise' }]);
  };

  return (
    <View style={styles.foForm}>
      <View style={styles.foIconRow}>
        {FO_ICONS.map((e) => (
          <Pressable
            key={e}
            style={[styles.foIcon, icon === e && styles.foIconPicked]}
            onPress={() => setIcon(e)}
          >
            <Text style={styles.foIconEmoji}>{e}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.foInput}
        value={title}
        onChangeText={setTitle}
        maxLength={40}
        placeholder="Mission name (e.g. Operation Jules)"
        placeholderTextColor={colors.textSoft}
      />
      <TextInput
        style={styles.foInput}
        value={briefing}
        onChangeText={setBriefing}
        maxLength={200}
        placeholder="Briefing the Spymaster reads (e.g. The thieves grabbed Jules! Follow their trail...)"
        placeholderTextColor={colors.textSoft}
        multiline
      />
      {stages.map((s, i) => (
        <View key={i} style={styles.foStage}>
          <TextInput
            style={[styles.foInput, styles.foStageInput]}
            value={s.location}
            onChangeText={(t) => setStage(i, { location: t })}
            maxLength={30}
            placeholder={`Stop ${i + 1} name (e.g. Myrtle Cove)`}
            placeholderTextColor={colors.textSoft}
          />
          <View style={styles.foSkillRow}>
            {FO_SKILLS.map((k) => (
              <Pressable
                key={k}
                style={[styles.foSkill, s.skill === k && styles.foSkillOn]}
                onPress={() => setStage(i, { skill: k })}
              >
                <Text style={[styles.foSkillText, s.skill === k && styles.foSkillTextOn]}>
                  {SKILL_LABELS[k]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <View style={styles.foActions}>
        {stages.length < 6 && (
          <Pressable
            style={styles.smallBtn}
            onPress={() => setStages((prev) => [...prev, { location: '', skill: 'surprise' }])}
          >
            <Text style={styles.smallBtnText}>＋ Add a stop</Text>
          </Pressable>
        )}
        {stages.length > 1 && (
          <Pressable style={styles.smallBtn} onPress={() => setStages((prev) => prev.slice(0, -1))}>
            <Text style={styles.smallBtnText}>－ Remove last stop</Text>
          </Pressable>
        )}
      </View>
      <TextInput
        style={styles.foInput}
        value={secret}
        onChangeText={setSecret}
        maxLength={200}
        placeholder="Secret message in the final vault (e.g. You found Jules! Check under the big slide!)"
        placeholderTextColor={colors.textSoft}
        multiline
      />
      <Pressable
        style={[styles.foSave, !title.trim() && { opacity: 0.4 }]}
        onPress={save}
        disabled={!title.trim()}
      >
        <Text style={styles.foSaveText}>💾 Save mission</Text>
      </Pressable>
    </View>
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
  foForm: { marginTop: 10 },
  foIconRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  foIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.bgRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  foIconPicked: { borderColor: colors.sky },
  foIconEmoji: { fontSize: 24 },
  foInput: {
    backgroundColor: colors.bgRaised,
    borderRadius: 14,
    color: colors.textBright,
    fontSize: 16,
    padding: 12,
    marginBottom: 8,
  },
  foStage: { marginBottom: 4 },
  foStageInput: { marginBottom: 6 },
  foSkillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  foSkill: {
    borderRadius: radii.pill,
    backgroundColor: colors.bgRaised,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  foSkillOn: { backgroundColor: colors.sky },
  foSkillText: { color: colors.textSoft, fontSize: 13, fontWeight: '700' },
  foSkillTextOn: { color: colors.bgDeep },
  foActions: { flexDirection: 'row', marginBottom: 8, gap: 10 },
  foSave: {
    minHeight: TOUCH_TARGET,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  foSaveText: { color: '#06301f', fontSize: type.body, fontWeight: '900' },
});
