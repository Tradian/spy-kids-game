import React, { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, TOUCH_TARGET, type } from '../theme';

interface Props {
  onPassed: () => void;
}

/**
 * Parent gate, spec section 3: hold the icon for 3 seconds, then solve
 * 6 × 4. Both steps are cheap for a grown-up and reliably filter out a
 * five-year-old in a hurry.
 */
export function ParentGate({ onPassed }: Props) {
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [wrong, setWrong] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHold = () => {
    holdTimer.current = setTimeout(() => setChallengeOpen(true), 3000);
  };
  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const answer = (n: number) => {
    if (n === 24) {
      setChallengeOpen(false);
      setWrong(false);
      onPassed();
    } else {
      setWrong(true);
    }
  };

  return (
    <>
      <Pressable
        style={styles.gateIcon}
        onPressIn={startHold}
        onPressOut={cancelHold}
        accessibilityLabel="Parent area (hold for three seconds)"
      >
        <Text style={styles.gateEmoji}>👤</Text>
      </Pressable>

      <Modal visible={challengeOpen} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.question}>Grown-ups only: 6 × 4 = ?</Text>
            {wrong && <Text style={styles.wrong}>Not quite — try again.</Text>}
            <View style={styles.row}>
              {[18, 24, 32].map((n) => (
                <Pressable key={n} style={styles.answerBtn} onPress={() => answer(n)}>
                  <Text style={styles.answerText}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => { setChallengeOpen(false); setWrong(false); }}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gateIcon: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  gateEmoji: { fontSize: 24 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.panel,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  question: { color: colors.textBright, fontSize: type.title, fontWeight: '800' },
  wrong: { color: colors.coral, marginTop: 8, fontSize: type.body },
  row: { flexDirection: 'row', marginTop: 20 },
  answerBtn: {
    minWidth: TOUCH_TARGET + 8,
    minHeight: TOUCH_TARGET,
    borderRadius: radii.tile,
    backgroundColor: colors.bgRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 12,
  },
  answerText: { color: colors.textBright, fontSize: type.big, fontWeight: '800' },
  cancel: { color: colors.textSoft, marginTop: 20, fontSize: type.body, padding: 8 },
});
