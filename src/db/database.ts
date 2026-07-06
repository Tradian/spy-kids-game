import * as SQLite from 'expo-sqlite';
import { GADGETS } from '../content/gadgets';
import { MISSIONS } from '../content/missions';
import { PUZZLES } from '../content/puzzles';
import { TEMPLATES } from '../content/templates';
import { BADGES } from '../content/badges';

/**
 * Local-first storage, spec section 2. No backend, no accounts, no sync.
 *
 * Static content (templates / puzzles / missions / gadgets / badges) is
 * authored in src/content as TypeScript and re-seeded idempotently on every
 * launch, so shipping new content is just an app update. Dynamic state
 * (profiles, progress, parent messages, badge awards) lives only here.
 */

let db: SQLite.SQLiteDatabase | null = null;

export const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) throw new Error('Database not initialized — call initDatabase() first');
  return db;
};

export async function initDatabase(): Promise<void> {
  if (db) return;
  db = await SQLite.openDatabaseAsync('little_agents.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      rank TEXT NOT NULL DEFAULT 'recruit',
      difficulty_notch INTEGER NOT NULL DEFAULT 1,
      scroll_room_enabled INTEGER NOT NULL DEFAULT 0,
      missions_per_session INTEGER NOT NULL DEFAULT 0,
      difficulty_locked INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS code_templates (
      id TEXT PRIMARY KEY,
      template_key TEXT NOT NULL,
      track TEXT NOT NULL,
      mode TEXT NOT NULL,
      parent_label TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS puzzles (
      id TEXT PRIMARY KEY,
      template_key TEXT NOT NULL,
      rank TEXT NOT NULL,
      notch INTEGER NOT NULL,
      track TEXT NOT NULL,
      payload TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      rank TEXT NOT NULL,
      track TEXT NOT NULL,
      icon TEXT NOT NULL,
      briefing_line TEXT NOT NULL,
      debrief_line TEXT NOT NULL,
      secret_message_line TEXT NOT NULL,
      gadget_reward_id TEXT NOT NULL,
      puzzle_ids_by_notch TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gadgets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      tap_line TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress (
      profile_id TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'locked',
      stamps INTEGER NOT NULL DEFAULT 0,
      first_try_streak INTEGER NOT NULL DEFAULT 0,
      hint_glow_count INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      PRIMARY KEY (profile_id, mission_id)
    );

    CREATE TABLE IF NOT EXISTS profile_gadgets (
      profile_id TEXT NOT NULL,
      gadget_id TEXT NOT NULL,
      earned_at INTEGER NOT NULL,
      PRIMARY KEY (profile_id, gadget_id)
    );

    CREATE TABLE IF NOT EXISTS profile_badges (
      profile_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      earned_at INTEGER NOT NULL,
      PRIMARY KEY (profile_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS parent_messages (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      audio_path TEXT NOT NULL,
      played INTEGER NOT NULL DEFAULT 0,
      label TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS field_ops (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS adaptive_state (
      profile_id TEXT PRIMARY KEY,
      first_try_streak INTEGER NOT NULL DEFAULT 0,
      notch3_mission_streak INTEGER NOT NULL DEFAULT 0
    );
  `);

  await seedContent(db);
}

/** Re-seed static content from the TS source of truth (idempotent). */
async function seedContent(d: SQLite.SQLiteDatabase): Promise<void> {
  await d.withTransactionAsync(async () => {
    for (const t of TEMPLATES) {
      await d.runAsync(
        `INSERT OR REPLACE INTO code_templates (id, template_key, track, mode, parent_label)
         VALUES (?, ?, ?, ?, ?)`,
        [t.key, t.key, t.track, t.mode, t.parentLabel],
      );
    }
    for (const p of PUZZLES) {
      await d.runAsync(
        `INSERT OR REPLACE INTO puzzles (id, template_key, rank, notch, track, payload)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.id, p.templateKey, p.rank, p.notch, p.track, JSON.stringify(p.payload)],
      );
    }
    let order = 0;
    for (const m of MISSIONS) {
      await d.runAsync(
        `INSERT OR REPLACE INTO missions
           (id, title, rank, track, icon, briefing_line, debrief_line,
            secret_message_line, gadget_reward_id, puzzle_ids_by_notch, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id, m.title, m.rank, m.track, m.icon, m.briefingLine, m.debriefLine,
          m.secretMessageLine, m.gadgetRewardId, JSON.stringify(m.puzzleIdsByNotch), order++,
        ],
      );
    }
    for (const g of GADGETS) {
      await d.runAsync(
        `INSERT OR REPLACE INTO gadgets (id, name, emoji, tap_line) VALUES (?, ?, ?, ?)`,
        [g.id, g.name, g.emoji, g.tapLine],
      );
    }
    for (const b of BADGES) {
      await d.runAsync(
        `INSERT OR REPLACE INTO badges (id, name, emoji, description) VALUES (?, ?, ?, ?)`,
        [b.id, b.name, b.emoji, b.description],
      );
    }
  });
}
