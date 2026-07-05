/**
 * Shared types for Operation Little Agents.
 *
 * The whole game is data-driven: every puzzle is a PuzzlePayload fed into
 * one of two interaction modes on the Code Stage. New puzzles are data
 * entry, not code.
 */

export type Rank = 'recruit' | 'junior' | 'special';
export type Track = 'core' | 'scroll';

export const RANK_ORDER: Rank[] = ['recruit', 'junior', 'special'];

export const RANK_LABELS: Record<Rank, string> = {
  recruit: 'Recruit',
  junior: 'Junior Agent',
  special: 'Special Agent',
};

export type TemplateKey =
  // Core eight (build order per spec section 4)
  | 'letter_match'
  | 'sound_lock'
  | 'count_gadgets'
  | 'shape_cipher'
  | 'pattern_breaker'
  | 'name_code'
  | 'missing_number'
  | 'sight_word'
  // Scroll Room reskins (same engine, re-fed data)
  | 'alephbet_match'
  | 'hebrew_sound_lock'
  | 'creation_count'
  | 'gematria';

/**
 * Two interaction modes cover every template:
 *  - choice: tap one tile among options
 *  - sequence: enter an ordered code on a keypad (with optional legend)
 */
export type InteractionMode = 'choice' | 'sequence';

export interface TemplateDef {
  key: TemplateKey;
  track: Track;
  mode: InteractionMode;
  /** Human name shown only in the parent area, never to the child. */
  parentLabel: string;
}

export interface ArtSpec {
  /** Placeholder art system: chunky emoji until illustrated assets land. */
  kind: 'emoji';
  value: string;
  /** For counting templates: render `value` this many times. */
  count?: number;
}

export interface PuzzleOption {
  id: string;
  /** Big label rendered on the tile (letter, numeral, symbol, word). */
  label: string;
  /** Optional smaller emoji rendered above the label. */
  emoji?: string;
}

export interface LegendEntry {
  symbol: string;
  means: string;
}

export interface PuzzlePayload {
  /** Spymaster prompt — spoken via bundled mp3 when present, TTS fallback. */
  promptLine: string;
  promptAudio?: string;
  /** Second-miss hint audio. */
  hintLine: string;
  hintAudio?: string;
  /** Scene art above the answer area. */
  art?: ArtSpec;
  options: PuzzleOption[];
  /** choice mode: single option id. sequence mode: ordered option ids. */
  answer: string | string[];
  /** For cipher templates: on-screen legend the child reads left to right. */
  legend?: LegendEntry[];
}

export interface Puzzle {
  id: string;
  templateKey: TemplateKey;
  rank: Rank;
  /** Difficulty notch 1-3 within the rank. */
  notch: 1 | 2 | 3;
  track: Track;
  payload: PuzzlePayload;
}

export interface Mission {
  id: string;
  title: string;
  rank: Rank;
  track: Track;
  /** Emoji badge for the mission node on the map. */
  icon: string;
  briefingLine: string;
  briefingAudio?: string;
  debriefLine: string;
  debriefAudio?: string;
  /**
   * The secret message revealed when the vault opens. On the scroll track
   * this is the verse — always the reward, never the gate.
   */
  secretMessageLine: string;
  secretMessageAudio?: string;
  gadgetRewardId: string;
  /**
   * Puzzle ids per notch. The engine picks the column matching the child's
   * current difficulty notch so missions adapt without changing shape.
   */
  puzzleIdsByNotch: Record<1 | 2 | 3, string[]>;
}

export interface Gadget {
  id: string;
  name: string;
  emoji: string;
  tapLine: string;
  tapAudio?: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  /** Plain-language description shown in the parent area / badge wall. */
  description: string;
}

export interface Profile {
  id: string;
  name: string;
  avatarId: string;
  createdAt: number;
  rank: Rank;
  difficultyNotch: 1 | 2 | 3;
  scrollRoomEnabled: boolean;
  /** Parent-set cap on missions per session (0 = unlimited). */
  missionsPerSession: number;
  /** Parent override: when set, adaptive logic stops moving the notch. */
  difficultyLocked: boolean;
}

export type MissionStatus = 'locked' | 'available' | 'completed';

export interface ProgressRow {
  profileId: string;
  missionId: string;
  status: MissionStatus;
  stamps: number;
  firstTryStreak: number;
  hintGlowCount: number;
  completedAt: number | null;
}

export interface ParentMessage {
  id: string;
  profileId: string;
  audioPath: string;
  played: boolean;
  label: string;
  createdAt: number;
}

export interface AvatarDef {
  id: string;
  emoji: string;
  color: string;
}

/** Result of one code stage, fed to the adaptive logic. */
export interface StageResult {
  puzzleId: string;
  firstTry: boolean;
  /** True when the child needed the third-miss glowing answer. */
  glowed: boolean;
}
