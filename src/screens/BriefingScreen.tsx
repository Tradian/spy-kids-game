import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, type } from '../theme';
import { Mission } from '../types';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';
import { BigButton } from '../components/BigButton';
import { SpymasterBubble } from '../components/SpymasterBubble';
import { say, stopSpeaking } from '../audio/audioService';

/** Spymaster audio over a scene illustration; one big Accept button. */
export function BriefingScreen({ mission }: { mission: Mission }) {
  const { replace, back } = useApp();
  const isScroll = mission.track === 'scroll';

  useEffect(() => {
    say(mission.briefingLine, `briefing_${mission.id}`);
    return stopSpeaking;
  }, [mission]);

  return (
    <ScreenShell onBack={back} scroll={isScroll} title={mission.title}>
      <View style={[styles.scene, isScroll && { backgroundColor: colors.scrollPanel }]}>
        <Text style={styles.sceneEmoji}>{mission.icon}</Text>
      </View>

      <SpymasterBubble
        line={mission.briefingLine}
        audioKey={`briefing_${mission.id}`}
        caption="Tap the Spymaster to hear the briefing again"
      />

      <View style={styles.footer}>
        <BigButton
          label="Accept Mission"
          emoji="🫡"
          onPress={() => {
            stopSpeaking();
            replace({ name: 'codeStage', mission });
          }}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: colors.bgPanel,
    borderRadius: radii.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sceneEmoji: { fontSize: 120 },
  footer: { marginTop: 16 },
});
