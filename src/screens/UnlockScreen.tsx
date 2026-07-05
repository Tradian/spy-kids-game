import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';
import { Mission, ParentMessage, StageResult } from '../types';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';
import { BigButton } from '../components/BigButton';
import { VaultDoor } from '../components/VaultDoor';
import { Confetti } from '../components/Confetti';
import { playFile, playSfx, say, stopSpeaking } from '../audio/audioService';
import { LINES } from '../content/lines';
import { completeMission, MissionOutcome } from '../logic/completeMission';
import { markParentMessagePlayed, nextUnplayedParentMessage } from '../db/repo';

/**
 * Vault animation, then the secret message — and, when one is queued, a
 * parent-recorded transmission. All completion bookkeeping (progress,
 * gadget, adaptive movement, badges) happens exactly once here.
 */
export function UnlockScreen({ mission, results }: { mission: Mission; results: StageResult[] }) {
  const { profile, replace, refreshProfile, bumpMissionsThisSession } = useApp();
  const [opened, setOpened] = useState(false);
  const [outcome, setOutcome] = useState<MissionOutcome | null>(null);
  const [parentMsg, setParentMsg] = useState<ParentMessage | null>(null);
  const completedOnce = useRef(false);
  const isScroll = mission.track === 'scroll';

  useEffect(() => {
    playSfx('sfx_vault');
    say(LINES.vaultOpening);
    if (!profile || completedOnce.current) return;
    completedOnce.current = true;
    (async () => {
      const o = await completeMission(profile, mission, results);
      setOutcome(o);
      const msg = await nextUnplayedParentMessage(profile.id);
      setParentMsg(msg);
      bumpMissionsThisSession();
      await refreshProfile();
    })();
    // run once per mission completion
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onOpened = useCallback(() => {
    setOpened(true);
    playSfx('sfx_confetti');
    say(mission.secretMessageLine, `secret_${mission.id}`);
  }, [mission]);

  const playParentMessage = async () => {
    if (!parentMsg) return;
    say(LINES.parentMessageIncoming);
    setTimeout(() => {
      playFile(parentMsg.audioPath);
    }, 2600);
    await markParentMessagePlayed(parentMsg.id);
    setParentMsg(null);
  };

  return (
    <ScreenShell scroll={isScroll}>
      <View style={styles.center}>
        {!opened ? (
          <VaultDoor onOpened={onOpened} scroll={isScroll} />
        ) : (
          <>
            <Confetti />
            <View style={[styles.message, isScroll && styles.scrollMessage]}>
              <Text style={styles.messageEmoji}>{isScroll ? '📜' : '💌'}</Text>
              <Text style={[styles.messageText, isScroll && styles.scrollMessageText]}>
                {mission.secretMessageLine}
              </Text>
            </View>

            {parentMsg && (
              <BigButton
                label="Secret transmission for you!"
                emoji="📻"
                color={colors.lilac}
                textColor={colors.bgDeep}
                onPress={playParentMessage}
                style={styles.parentBtn}
              />
            )}

            <BigButton
              label="Report to the Spymaster"
              emoji="🫡"
              onPress={() => {
                stopSpeaking();
                replace({
                  name: 'debrief',
                  mission,
                  results,
                  promotedTo: outcome?.promotedTo ?? null,
                  newBadgeIds: outcome?.newBadgeIds ?? [],
                });
              }}
              style={styles.nextBtn}
            />
          </>
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  message: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.panel,
    borderWidth: 4,
    borderColor: colors.gold,
    padding: 22,
    alignItems: 'center',
  },
  scrollMessage: {
    backgroundColor: colors.parchment,
    borderColor: colors.goldDeep,
  },
  messageEmoji: { fontSize: 54, marginBottom: 10 },
  messageText: {
    color: colors.textBright,
    fontSize: type.title,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
  },
  scrollMessageText: { color: colors.parchmentInk },
  parentBtn: { marginTop: 18 },
  nextBtn: { marginTop: 18 },
});
