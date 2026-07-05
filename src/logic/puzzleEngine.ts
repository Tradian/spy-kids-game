import { Mission, Profile, Puzzle, PuzzleOption } from '../types';
import { puzzleById, puzzlesFor } from '../content/puzzles';

/**
 * Resolves a mission's stage list into concrete puzzles for a profile,
 * handling the two dynamic cases:
 *  - '@name_code' → a puzzle spelling the child's own name
 *  - the daily mission → picked from the pool, seeded by the calendar day
 */

export function resolveMissionPuzzles(mission: Mission, profile: Profile): Puzzle[] {
  const ids = mission.puzzleIdsByNotch[profile.difficultyNotch];
  let nameCodeCount = 0;
  return ids.map((id) =>
    id === '@name_code' ? makeNameCodePuzzle(profile, nameCodeCount++) : puzzleById(id),
  );
}

/**
 * name_code — spell the child's own name with fading letter supports.
 * Support fades with the difficulty notch AND with repetition inside a
 * mission: notch 1 shows the name as on-screen art to copy; notch 2 shows
 * only the first letter; notch 3 shows nothing but the prompt.
 */
export function makeNameCodePuzzle(profile: Profile, variant: number): Puzzle {
  const name = profile.name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'AGENT';
  const letters = name.split('');
  const support = Math.max(1, profile.difficultyNotch + (variant > 0 ? 1 : 0)) as 1 | 2 | 3;

  const distractorPool = 'BDGKMOPRSTW'.split('').filter((c) => !letters.includes(c));
  const distractors = distractorPool.slice(0, Math.min(3, 2 + profile.difficultyNotch));
  const keypad = dedupe([...letters, ...distractors]).sort();

  const art =
    support === 1
      ? { kind: 'emoji' as const, value: name }
      : support === 2
        ? { kind: 'emoji' as const, value: `${letters[0]} ${'▢ '.repeat(letters.length - 1).trim()}` }
        : { kind: 'emoji' as const, value: '🪪' };

  const options: PuzzleOption[] = keypad.map((label) => ({ id: label, label }));

  return {
    id: `@name_code_${profile.id}_${variant}`,
    templateKey: 'name_code',
    rank: profile.rank,
    notch: profile.difficultyNotch,
    track: 'core',
    payload: {
      promptLine: `Agent ${profile.name}, code in your name. Press your letters in order!`,
      hintLine: `Your name starts with ${letters[0]}. Say your name slowly and listen for each letter.`,
      art,
      options,
      answer: letters,
    },
  };
}

/**
 * The daily-fresh mission: three puzzles from the profile's current
 * rank/notch pool, chosen by a date-seeded shuffle so it changes every
 * day but stays stable within the day.
 */
export function makeDailyMission(profile: Profile, dayKey: string): Mission {
  const seed = hashString(`${dayKey}:${profile.id}`);
  const pool = [
    ...puzzlesFor(profile.rank, profile.difficultyNotch, 'core'),
    // fall back so a thin notch still fills three stages
    ...puzzlesFor(profile.rank, 2, 'core'),
    ...puzzlesFor(profile.rank, 1, 'core'),
  ];
  const chosen = seededPick(dedupeBy(pool, (p) => p.id), 3, seed);
  const ids = chosen.map((p) => p.id);
  return {
    id: `daily_${dayKey}`,
    title: 'Daily Drop',
    rank: profile.rank,
    track: 'core',
    icon: '📬',
    briefingLine:
      'Fresh orders just arrived, Agent! A brand new drop, today only. Ready for it?',
    debriefLine:
      'Daily drop complete. Same time tomorrow, Agent — headquarters never sleeps. Well, it naps. Spymaster out!',
    secretMessageLine: 'Today’s secret message: EVERY DAY YOU PRACTICE, YOUR AGENT POWERS GROW.',
    gadgetRewardId: 'g_radio',
    puzzleIdsByNotch: { 1: ids, 2: ids, 3: ids },
  };
}

export const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededPick<T>(arr: T[], n: number, seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, Math.min(n, out.length));
}

const dedupe = <T,>(arr: T[]): T[] => [...new Set(arr)];

function dedupeBy<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
