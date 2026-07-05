import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from './src/db/database';
import { AppProvider, useApp } from './src/state/AppContext';
import { colors } from './src/theme';
import { ProfileSelectScreen } from './src/screens/ProfileSelectScreen';
import { HQScreen } from './src/screens/HQScreen';
import { MissionMapScreen } from './src/screens/MissionMapScreen';
import { BriefingScreen } from './src/screens/BriefingScreen';
import { CodeStageScreen } from './src/screens/CodeStageScreen';
import { UnlockScreen } from './src/screens/UnlockScreen';
import { DebriefScreen } from './src/screens/DebriefScreen';
import { GadgetLockerScreen } from './src/screens/GadgetLockerScreen';
import { BadgeWallScreen } from './src/screens/BadgeWallScreen';
import { ParentAreaScreen } from './src/screens/ParentAreaScreen';

function Router() {
  const { screen } = useApp();
  switch (screen.name) {
    case 'profileSelect':
      return <ProfileSelectScreen />;
    case 'hq':
      return <HQScreen />;
    case 'missionMap':
      return <MissionMapScreen track={screen.track} />;
    case 'briefing':
      return <BriefingScreen mission={screen.mission} />;
    case 'codeStage':
      return <CodeStageScreen mission={screen.mission} />;
    case 'unlock':
      return <UnlockScreen mission={screen.mission} results={screen.results} />;
    case 'debrief':
      return (
        <DebriefScreen
          mission={screen.mission}
          results={screen.results}
          promotedTo={screen.promotedTo}
          newBadgeIds={screen.newBadgeIds}
        />
      );
    case 'gadgetLocker':
      return <GadgetLockerScreen />;
    case 'badgeWall':
      return <BadgeWallScreen />;
    case 'parentArea':
      return <ParentAreaScreen />;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootText}>Something went wrong opening HQ: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootEmoji}>🕵️</Text>
        <Text style={styles.bootText}>Opening headquarters...</Text>
      </View>
    );
  }

  return (
    <AppProvider>
      <StatusBar style="light" />
      <Router />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  bootEmoji: { fontSize: 70, marginBottom: 12 },
  bootText: { color: colors.textSoft, fontSize: 18, textAlign: 'center' },
});
