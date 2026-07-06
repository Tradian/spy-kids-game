import { getDb } from './database';
import {
  FieldOp,
  MissionStatus,
  ParentMessage,
  Profile,
  ProgressRow,
  Rank,
} from '../types';

/** All dynamic-state queries. Static content is read from src/content. */

const uid = (): string =>
  `${Date.now().toString(36)}${Math.floor(Math.random() * 1e9).toString(36)}`;

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

interface ProfileRow {
  id: string;
  name: string;
  avatar_id: string;
  created_at: number;
  rank: Rank;
  difficulty_notch: number;
  scroll_room_enabled: number;
  missions_per_session: number;
  difficulty_locked: number;
}

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  name: r.name,
  avatarId: r.avatar_id,
  createdAt: r.created_at,
  rank: r.rank,
  difficultyNotch: r.difficulty_notch as 1 | 2 | 3,
  scrollRoomEnabled: !!r.scroll_room_enabled,
  missionsPerSession: r.missions_per_session,
  difficultyLocked: !!r.difficulty_locked,
});

export async function listProfiles(): Promise<Profile[]> {
  const rows = await getDb().getAllAsync<ProfileRow>(
    'SELECT * FROM profiles ORDER BY created_at ASC',
  );
  return rows.map(toProfile);
}

export async function getProfile(id: string): Promise<Profile | null> {
  const row = await getDb().getFirstAsync<ProfileRow>(
    'SELECT * FROM profiles WHERE id = ?',
    [id],
  );
  return row ? toProfile(row) : null;
}

export async function createProfile(name: string, avatarId: string): Promise<Profile> {
  const id = uid();
  await getDb().runAsync(
    `INSERT INTO profiles (id, name, avatar_id, created_at) VALUES (?, ?, ?, ?)`,
    [id, name, avatarId, Date.now()],
  );
  return (await getProfile(id))!;
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, 'rank' | 'difficultyNotch' | 'scrollRoomEnabled' | 'missionsPerSession' | 'difficultyLocked' | 'name' | 'avatarId'>>,
): Promise<void> {
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  if (patch.rank !== undefined) { sets.push('rank = ?'); vals.push(patch.rank); }
  if (patch.difficultyNotch !== undefined) { sets.push('difficulty_notch = ?'); vals.push(patch.difficultyNotch); }
  if (patch.scrollRoomEnabled !== undefined) { sets.push('scroll_room_enabled = ?'); vals.push(patch.scrollRoomEnabled ? 1 : 0); }
  if (patch.missionsPerSession !== undefined) { sets.push('missions_per_session = ?'); vals.push(patch.missionsPerSession); }
  if (patch.difficultyLocked !== undefined) { sets.push('difficulty_locked = ?'); vals.push(patch.difficultyLocked ? 1 : 0); }
  if (patch.name !== undefined) { sets.push('name = ?'); vals.push(patch.name); }
  if (patch.avatarId !== undefined) { sets.push('avatar_id = ?'); vals.push(patch.avatarId); }
  if (!sets.length) return;
  vals.push(id);
  await getDb().runAsync(`UPDATE profiles SET ${sets.join(', ')} WHERE id = ?`, vals);
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

interface DbProgressRow {
  profile_id: string;
  mission_id: string;
  status: MissionStatus;
  stamps: number;
  first_try_streak: number;
  hint_glow_count: number;
  completed_at: number | null;
}

const toProgress = (r: DbProgressRow): ProgressRow => ({
  profileId: r.profile_id,
  missionId: r.mission_id,
  status: r.status,
  stamps: r.stamps,
  firstTryStreak: r.first_try_streak,
  hintGlowCount: r.hint_glow_count,
  completedAt: r.completed_at,
});

export async function getProgressForProfile(profileId: string): Promise<ProgressRow[]> {
  const rows = await getDb().getAllAsync<DbProgressRow>(
    'SELECT * FROM progress WHERE profile_id = ?',
    [profileId],
  );
  return rows.map(toProgress);
}

export async function recordMissionComplete(
  profileId: string,
  missionId: string,
  stamps: number,
  hintGlowCount: number,
): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO progress (profile_id, mission_id, status, stamps, hint_glow_count, completed_at)
     VALUES (?, ?, 'completed', ?, ?, ?)
     ON CONFLICT (profile_id, mission_id) DO UPDATE SET
       status = 'completed',
       stamps = MAX(stamps, excluded.stamps),
       hint_glow_count = excluded.hint_glow_count,
       completed_at = excluded.completed_at`,
    [profileId, missionId, stamps, hintGlowCount, Date.now()],
  );
}

export async function countCompletedMissions(profileId: string, track?: string): Promise<number> {
  if (track) {
    const missionIds = await getDb().getAllAsync<{ id: string }>(
      'SELECT id FROM missions WHERE track = ?',
      [track],
    );
    const ids = new Set(missionIds.map((m) => m.id));
    const rows = await getProgressForProfile(profileId);
    return rows.filter((r) => r.status === 'completed' && ids.has(r.missionId)).length;
  }
  const row = await getDb().getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM progress WHERE profile_id = ? AND status = 'completed'`,
    [profileId],
  );
  return row?.n ?? 0;
}

// ---------------------------------------------------------------------------
// Adaptive state (never surfaced to the child)
// ---------------------------------------------------------------------------

export interface AdaptiveState {
  firstTryStreak: number;
  notch3MissionStreak: number;
}

export async function getAdaptiveState(profileId: string): Promise<AdaptiveState> {
  const row = await getDb().getFirstAsync<{ first_try_streak: number; notch3_mission_streak: number }>(
    'SELECT first_try_streak, notch3_mission_streak FROM adaptive_state WHERE profile_id = ?',
    [profileId],
  );
  return {
    firstTryStreak: row?.first_try_streak ?? 0,
    notch3MissionStreak: row?.notch3_mission_streak ?? 0,
  };
}

export async function setAdaptiveState(profileId: string, s: AdaptiveState): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO adaptive_state (profile_id, first_try_streak, notch3_mission_streak)
     VALUES (?, ?, ?)
     ON CONFLICT (profile_id) DO UPDATE SET
       first_try_streak = excluded.first_try_streak,
       notch3_mission_streak = excluded.notch3_mission_streak`,
    [profileId, s.firstTryStreak, s.notch3MissionStreak],
  );
}

// ---------------------------------------------------------------------------
// Gadgets + badges
// ---------------------------------------------------------------------------

export async function earnGadget(profileId: string, gadgetId: string): Promise<void> {
  await getDb().runAsync(
    `INSERT OR IGNORE INTO profile_gadgets (profile_id, gadget_id, earned_at) VALUES (?, ?, ?)`,
    [profileId, gadgetId, Date.now()],
  );
}

export async function listEarnedGadgetIds(profileId: string): Promise<string[]> {
  const rows = await getDb().getAllAsync<{ gadget_id: string }>(
    'SELECT gadget_id FROM profile_gadgets WHERE profile_id = ? ORDER BY earned_at ASC',
    [profileId],
  );
  return rows.map((r) => r.gadget_id);
}

/** Returns true only when the badge was newly awarded. */
export async function awardBadge(profileId: string, badgeId: string): Promise<boolean> {
  const res = await getDb().runAsync(
    `INSERT OR IGNORE INTO profile_badges (profile_id, badge_id, earned_at) VALUES (?, ?, ?)`,
    [profileId, badgeId, Date.now()],
  );
  return res.changes > 0;
}

export async function listEarnedBadgeIds(profileId: string): Promise<string[]> {
  const rows = await getDb().getAllAsync<{ badge_id: string }>(
    'SELECT badge_id FROM profile_badges WHERE profile_id = ? ORDER BY earned_at ASC',
    [profileId],
  );
  return rows.map((r) => r.badge_id);
}

// ---------------------------------------------------------------------------
// Field Ops — parent-built real-world missions. Device-only by design:
// the family's place names live in this database and nowhere else.
// ---------------------------------------------------------------------------

export async function listFieldOps(): Promise<FieldOp[]> {
  const rows = await getDb().getAllAsync<{ data: string }>(
    'SELECT data FROM field_ops ORDER BY created_at ASC',
  );
  return rows.map((r) => JSON.parse(r.data) as FieldOp);
}

export async function saveFieldOp(op: FieldOp): Promise<void> {
  await getDb().runAsync(
    'INSERT OR REPLACE INTO field_ops (id, data, created_at) VALUES (?, ?, ?)',
    [op.id, JSON.stringify(op), op.createdAt],
  );
}

export async function deleteFieldOp(id: string): Promise<void> {
  await getDb().runAsync('DELETE FROM field_ops WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Parent messages
// ---------------------------------------------------------------------------

interface DbParentMessage {
  id: string;
  profile_id: string;
  audio_path: string;
  played: number;
  label: string;
  created_at: number;
}

const toParentMessage = (r: DbParentMessage): ParentMessage => ({
  id: r.id,
  profileId: r.profile_id,
  audioPath: r.audio_path,
  played: !!r.played,
  label: r.label,
  createdAt: r.created_at,
});

export async function saveParentMessage(
  profileId: string,
  audioPath: string,
  label: string,
): Promise<ParentMessage> {
  const id = uid();
  await getDb().runAsync(
    `INSERT INTO parent_messages (id, profile_id, audio_path, played, label, created_at)
     VALUES (?, ?, ?, 0, ?, ?)`,
    [id, profileId, audioPath, label, Date.now()],
  );
  return { id, profileId, audioPath, played: false, label, createdAt: Date.now() };
}

export async function nextUnplayedParentMessage(profileId: string): Promise<ParentMessage | null> {
  const row = await getDb().getFirstAsync<DbParentMessage>(
    `SELECT * FROM parent_messages WHERE profile_id = ? AND played = 0 ORDER BY created_at ASC LIMIT 1`,
    [profileId],
  );
  return row ? toParentMessage(row) : null;
}

export async function markParentMessagePlayed(id: string): Promise<void> {
  await getDb().runAsync('UPDATE parent_messages SET played = 1 WHERE id = ?', [id]);
}

export async function listParentMessages(profileId: string): Promise<ParentMessage[]> {
  const rows = await getDb().getAllAsync<DbParentMessage>(
    'SELECT * FROM parent_messages WHERE profile_id = ? ORDER BY created_at DESC',
    [profileId],
  );
  return rows.map(toParentMessage);
}
