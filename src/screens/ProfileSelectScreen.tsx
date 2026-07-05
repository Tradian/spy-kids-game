import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AVATARS, colors, radii, type } from '../theme';
import { Profile } from '../types';
import { createProfile, listProfiles } from '../db/repo';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';
import { BigButton } from '../components/BigButton';
import { say } from '../audio/audioService';

/** Big avatar tiles, one per kid. Tap to enter as that agent. */
export function ProfileSelectScreen() {
  const { navigate, setProfile } = useApp();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState<string>(AVATARS[0].id);

  const reload = useCallback(async () => {
    const all = await listProfiles();
    setProfiles(all);
    if (all.length === 0) setAdding(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const enter = (p: Profile) => {
    setProfile(p);
    say(`Agent ${p.name}, welcome back to headquarters!`);
    navigate({ name: 'hq' });
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    await createProfile(name, newAvatar);
    setNewName('');
    setAdding(false);
    await reload();
  };

  const avatarFor = (id: string) => AVATARS.find((a) => a.id === id) ?? AVATARS[0];

  return (
    <ScreenShell>
      <Text style={styles.heading}>🕵️ Spy Academy</Text>
      <Text style={styles.sub}>Who is reporting for duty?</Text>

      <View style={styles.grid}>
        {profiles.map((p) => {
          const av = avatarFor(p.avatarId);
          return (
            <Pressable
              key={p.id}
              style={[styles.tile, { borderColor: av.color }]}
              onPress={() => enter(p)}
            >
              <Text style={styles.tileEmoji}>{av.emoji}</Text>
              <Text style={styles.tileName}>{p.name}</Text>
            </Pressable>
          );
        })}
        {!adding && profiles.length < 6 && (
          <Pressable style={[styles.tile, styles.addTile]} onPress={() => setAdding(true)}>
            <Text style={styles.tileEmoji}>➕</Text>
            <Text style={styles.tileName}>New Agent</Text>
          </Pressable>
        )}
      </View>

      {adding && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>New agent’s name (a grown-up types this once):</Text>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Agent name"
            placeholderTextColor={colors.textSoft}
            maxLength={12}
          />
          <View style={styles.avatarRow}>
            {AVATARS.map((a) => (
              <Pressable
                key={a.id}
                style={[styles.avatarPick, newAvatar === a.id && { borderColor: a.color, borderWidth: 4 }]}
                onPress={() => setNewAvatar(a.id)}
              >
                <Text style={styles.avatarEmoji}>{a.emoji}</Text>
              </Pressable>
            ))}
          </View>
          <BigButton label="Join the Academy" emoji="🎖️" onPress={create} disabled={!newName.trim()} />
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: colors.textBright,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 24,
  },
  sub: {
    color: colors.textSoft,
    fontSize: type.body,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tile: {
    width: 150,
    height: 150,
    margin: 10,
    borderRadius: radii.panel,
    borderWidth: 5,
    backgroundColor: colors.bgPanel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: { borderColor: colors.outline, borderStyle: 'dashed' },
  tileEmoji: { fontSize: 64 },
  tileName: { color: colors.textBright, fontSize: type.title, fontWeight: '800', marginTop: 4 },
  form: { marginTop: 16, alignItems: 'stretch' },
  formLabel: { color: colors.textSoft, fontSize: type.small, marginBottom: 8 },
  input: {
    backgroundColor: colors.bgPanel,
    color: colors.textBright,
    fontSize: type.title,
    borderRadius: radii.tile,
    padding: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 14,
  },
  avatarPick: {
    width: 68,
    height: 68,
    margin: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.bgRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'transparent',
  },
  avatarEmoji: { fontSize: 36 },
});
