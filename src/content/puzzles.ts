import { Puzzle, PuzzleOption, PuzzlePayload, Rank, TemplateKey, Track } from '../types';

/**
 * Recruit-rank puzzle pool, notches 1–3 per template.
 *
 * Everything here is data. The helpers below just cut repetition — the
 * Code Stage only ever sees the resulting PuzzlePayload.
 *
 * Audio: promptAudio/hintAudio keys are left unset until the voiceover
 * pipeline batch lands (see docs/voiceover-script.md); until then the
 * audio service speaks promptLine/hintLine via TTS.
 */

const opts = (labels: string[], emojis?: (string | undefined)[]): PuzzleOption[] =>
  labels.map((label, i) => ({ id: label, label, emoji: emojis?.[i] }));

let counter = 0;
const P = (
  templateKey: TemplateKey,
  rank: Rank,
  notch: 1 | 2 | 3,
  track: Track,
  payload: PuzzlePayload,
): Puzzle => ({
  id: `${templateKey}_${rank}_${notch}_${String(++counter).padStart(2, '0')}`,
  templateKey,
  rank,
  notch,
  track,
  payload,
});

// ---------------------------------------------------------------------------
// letter_match — match the shown letter on a 3-button keypad
// ---------------------------------------------------------------------------

const letterMatch = (
  notch: 1 | 2 | 3,
  target: string,
  distractors: string[],
): Puzzle =>
  P('letter_match', 'recruit', notch, 'core', {
    promptLine: `Agent, look at the secret letter. Find the matching ${target} on your keypad.`,
    hintLine: `Look closely, Agent. Which button looks exactly the same as the big letter?`,
    art: { kind: 'emoji', value: target },
    options: opts(shuffleFixed([target, ...distractors])),
    answer: target,
  });

// ---------------------------------------------------------------------------
// sound_lock — highest-value template; "the letter that says mmm"
// ---------------------------------------------------------------------------

const soundLock = (
  notch: 1 | 2 | 3,
  target: string,
  sound: string,
  cueWord: string,
  distractors: string[],
): Puzzle =>
  P('sound_lock', 'recruit', notch, 'core', {
    promptLine: `This lock opens with the letter that says ${sound}, like in ${cueWord}.`,
    hintLine: `${sound}... ${sound}... ${cueWord} starts with that sound. Which letter makes it?`,
    art: { kind: 'emoji', value: '🔒' },
    options: opts(shuffleFixed([target, ...distractors])),
    answer: target,
  });

// ---------------------------------------------------------------------------
// count_gadgets — count 1-10 pictured objects, tap the numeral
// ---------------------------------------------------------------------------

const countGadgets = (
  notch: 1 | 2 | 3,
  n: number,
  emoji: string,
  thing: string,
  numerals: number[],
): Puzzle =>
  P('count_gadgets', 'recruit', notch, 'core', {
    promptLine: `Agent, count the ${thing} on the table. How many do you see?`,
    hintLine: `Touch each one and count out loud with me. One... two... keep going!`,
    art: { kind: 'emoji', value: emoji, count: n },
    options: opts(numerals.map(String)),
    answer: String(n),
  });

// ---------------------------------------------------------------------------
// shape_cipher — legend maps shapes to letters; enter the sequence
// ---------------------------------------------------------------------------

const shapeCipher = (
  notch: 1 | 2 | 3,
  legend: { symbol: string; means: string }[],
  code: string[], // sequence of symbols shown, left to right
): Puzzle => {
  const answer = code.map((s) => legend.find((l) => l.symbol === s)!.means);
  return P('shape_cipher', 'recruit', notch, 'core', {
    promptLine: `A shape code! Use the legend, Agent. Read the shapes left to right and press their letters.`,
    hintLine: `Start with the first shape. Find it in the legend — what letter does it stand for?`,
    art: { kind: 'emoji', value: code.join(' ') },
    options: opts(shuffleFixed(legend.map((l) => l.means))),
    answer,
    legend,
  });
};

// ---------------------------------------------------------------------------
// pattern_breaker — AB, then AAB/ABB/ABC patterns
// ---------------------------------------------------------------------------

const patternBreaker = (
  notch: 1 | 2 | 3,
  shown: string[],
  next: string,
  choices: string[],
): Puzzle =>
  P('pattern_breaker', 'recruit', notch, 'core', {
    promptLine: `The pattern lock! Say the pattern out loud, Agent. What comes next?`,
    hintLine: `Read it again from the start. Listen to the beat of it — what belongs in the empty spot?`,
    art: { kind: 'emoji', value: `${shown.join(' ')} ❔` },
    options: opts(choices),
    answer: next,
  });

// ---------------------------------------------------------------------------
// missing_number — 4, 5, __, 7 on a countdown panel
// ---------------------------------------------------------------------------

const missingNumber = (
  notch: 1 | 2 | 3,
  shown: (number | null)[],
  answer: number,
  choices: number[],
): Puzzle =>
  P('missing_number', 'recruit', notch, 'core', {
    promptLine: `The countdown panel is broken, Agent! One number is missing. Which one goes in the gap?`,
    hintLine: `Count along the panel with me and clap at the empty spot. What number did we clap on?`,
    art: { kind: 'emoji', value: shown.map((x) => (x === null ? '▢' : String(x))).join(' ') },
    options: opts(choices.map(String)),
    answer: String(answer),
  });

// ---------------------------------------------------------------------------
// sight_word — Spymaster says a word; tap it among four (Dolch pre-primer)
// ---------------------------------------------------------------------------

const sightWord = (notch: 1 | 2 | 3, target: string, distractors: string[]): Puzzle =>
  P('sight_word', 'recruit', notch, 'core', {
    promptLine: `The password is the word "${target}". Find "${target}" on the wall and tap it.`,
    hintLine: `"${target}". Look at the first letter of each word. Which one starts like "${target}"?`,
    art: { kind: 'emoji', value: '🗝️' },
    options: opts(shuffleFixed([target, ...distractors])),
    answer: target,
  });

// ---------------------------------------------------------------------------
// Scroll Room — Hebrew as the cipher
// ---------------------------------------------------------------------------

const alephbetMatch = (
  notch: 1 | 2 | 3,
  target: string,
  name: string,
  distractors: string[],
): Puzzle =>
  P('alephbet_match', 'recruit', notch, 'scroll', {
    promptLine: `This scroll letter is called ${name}. Find the matching ${name} on your keypad, Agent.`,
    hintLine: `Look at its shape very closely. Which button is exactly the same as the scroll letter?`,
    art: { kind: 'emoji', value: target },
    options: opts(shuffleFixed([target, ...distractors])),
    answer: target,
  });

const hebrewSoundLock = (
  notch: 1 | 2 | 3,
  target: string,
  name: string,
  sound: string,
  distractors: string[],
): Puzzle =>
  P('hebrew_sound_lock', 'recruit', notch, 'scroll', {
    promptLine: `This lock opens with the scroll letter that says ${sound}. Listen: ${sound}. Tap it!`,
    hintLine: `${sound}... that letter is called ${name}. Can you find ${name}?`,
    art: { kind: 'emoji', value: '📜' },
    options: opts(shuffleFixed([target, ...distractors])),
    answer: target,
  });

const creationCount = (
  notch: 1 | 2 | 3,
  n: number,
  emoji: string,
  thing: string,
  prompt: string,
  numerals: number[],
): Puzzle =>
  P('creation_count', 'recruit', notch, 'scroll', {
    promptLine: prompt,
    hintLine: `Touch each ${thing} on the scroll and count out loud. One... two... keep going!`,
    art: { kind: 'emoji', value: emoji, count: n },
    options: opts(numerals.map(String)),
    answer: String(n),
  });

const gematria = (
  notch: 1 | 2 | 3,
  legend: { symbol: string; means: string }[], // symbol = numeral, means = hebrew letter
  code: string[], // numerals shown left to right
  wordMeaning: string,
): Puzzle => {
  const answer = code.map((s) => legend.find((l) => l.symbol === s)!.means);
  return P('gematria', 'recruit', notch, 'scroll', {
    promptLine: `Number code, Agent! In scroll code, every letter has a number. Use the legend to press the letters.`,
    hintLine: `Find the first number in the legend. Which scroll letter does it stand for?`,
    art: { kind: 'emoji', value: `${code.join(' ')}  (${wordMeaning})` },
    options: opts(shuffleFixed(legend.map((l) => l.means))),
    answer,
    legend,
  });
};

/**
 * Deterministic option ordering — no Math.random so puzzle rows are stable
 * across app launches (answers should not always sit on the first tile).
 */
function shuffleFixed<T>(arr: T[]): T[] {
  const out = [...arr];
  // simple deterministic rotation based on content, enough to move the
  // answer off position 0 most of the time
  const k = out.map((x) => String(x)).join('').length % out.length;
  return [...out.slice(k), ...out.slice(0, k)];
}

// ===========================================================================
// THE POOL
// ===========================================================================

export const PUZZLES: Puzzle[] = [
  // ---- letter_match: notch 1 visually distinct, notch 3 lookalikes (b/d) ----
  letterMatch(1, 'S', ['O', 'X']),
  letterMatch(1, 'A', ['T', 'O']),
  letterMatch(1, 'M', ['S', 'I']),
  letterMatch(1, 'T', ['V', 'O']),
  letterMatch(2, 'E', ['F', 'L']),
  letterMatch(2, 'a', ['e', 'o']),
  letterMatch(2, 'g', ['j', 'y']),
  letterMatch(2, 'R', ['P', 'B']),
  letterMatch(3, 'b', ['d', 'p']),
  letterMatch(3, 'd', ['b', 'q']),
  letterMatch(3, 'm', ['w', 'n']),
  letterMatch(3, 'u', ['n', 'v']),

  // ---- sound_lock: the workhorse — most data lives here ----
  soundLock(1, 'M', 'mmm', 'moon', ['S', 'T']),
  soundLock(1, 'S', 'sss', 'sun', ['M', 'O']),
  soundLock(1, 'T', 'tuh', 'turtle', ['S', 'A']),
  soundLock(1, 'O', 'ah', 'octopus', ['T', 'M']),
  soundLock(1, 'A', 'aah', 'apple', ['O', 'S']),
  soundLock(2, 'B', 'buh', 'ball', ['P', 'D']),
  soundLock(2, 'F', 'fff', 'fish', ['V', 'S']),
  soundLock(2, 'N', 'nnn', 'nest', ['M', 'R']),
  soundLock(2, 'P', 'puh', 'penguin', ['B', 'T']),
  soundLock(2, 'D', 'duh', 'dog', ['B', 'T']),
  soundLock(2, 'K', 'kuh', 'kite', ['G', 'C']),
  soundLock(3, 'E', 'eh', 'egg', ['I', 'A']),
  soundLock(3, 'I', 'ih', 'igloo', ['E', 'A']),
  soundLock(3, 'G', 'guh', 'goat', ['K', 'J']),
  soundLock(3, 'J', 'juh', 'jet', ['G', 'Y']),
  soundLock(3, 'U', 'uh', 'umbrella', ['O', 'A']),

  // ---- count_gadgets ----
  countGadgets(1, 3, '🔦', 'flashlights', [2, 3, 4]),
  countGadgets(1, 2, '🕶️', 'spy glasses', [1, 2, 3]),
  countGadgets(1, 4, '🎒', 'mission packs', [3, 4, 5]),
  countGadgets(1, 5, '🧲', 'magnets', [4, 5, 6]),
  countGadgets(2, 6, '🔑', 'keys', [5, 6, 7, 8]),
  countGadgets(2, 7, '📡', 'antennas', [6, 7, 8, 9]),
  countGadgets(2, 5, '🧭', 'compasses', [4, 5, 6, 7]),
  countGadgets(2, 8, '🔋', 'batteries', [6, 7, 8, 9]),
  countGadgets(3, 9, '💾', 'data disks', [7, 8, 9, 10]),
  countGadgets(3, 10, '📎', 'paperclips', [8, 9, 10, 7]),
  countGadgets(3, 8, '🎧', 'headsets', [8, 9, 10, 6]),

  // ---- shape_cipher ----
  shapeCipher(1, [{ symbol: '🔺', means: 'G' }, { symbol: '🟡', means: 'O' }], ['🔺', '🟡']),
  shapeCipher(1, [{ symbol: '🟦', means: 'U' }, { symbol: '🟣', means: 'P' }], ['🟦', '🟣']),
  shapeCipher(2, [{ symbol: '🔺', means: 'C' }, { symbol: '🟡', means: 'A' }, { symbol: '🟦', means: 'T' }], ['🔺', '🟡', '🟦']),
  shapeCipher(2, [{ symbol: '⭐', means: 'S' }, { symbol: '🟣', means: 'P' }, { symbol: '🟡', means: 'Y' }], ['⭐', '🟣', '🟡']),
  shapeCipher(3, [{ symbol: '🔺', means: 'S' }, { symbol: '🟡', means: 'T' }, { symbol: '🟦', means: 'O' }, { symbol: '⭐', means: 'P' }], ['🔺', '🟡', '🟦', '⭐']),
  shapeCipher(3, [{ symbol: '🟣', means: 'O' }, { symbol: '⭐', means: 'P' }, { symbol: '🟡', means: 'E' }, { symbol: '🔺', means: 'N' }], ['🟣', '⭐', '🟡', '🔺']),

  // ---- pattern_breaker: AB → AAB/ABB → ABC ----
  patternBreaker(1, ['🔴', '🔵', '🔴', '🔵', '🔴'], '🔵', ['🔵', '🔴', '🟡']),
  patternBreaker(1, ['⭐', '🌙', '⭐', '🌙'], '⭐', ['🌙', '⭐', '☁️']),
  patternBreaker(2, ['🍎', '🍎', '🍌', '🍎', '🍎'], '🍌', ['🍎', '🍌', '🍇']),
  patternBreaker(2, ['🐟', '🐢', '🐢', '🐟', '🐢'], '🐢', ['🐟', '🐢', '🦀']),
  patternBreaker(3, ['🔴', '🟡', '🔵', '🔴', '🟡'], '🔵', ['🔵', '🔴', '🟡']),
  patternBreaker(3, ['🚗', '🚌', '🚁', '🚗', '🚌'], '🚁', ['🚗', '🚁', '🚌']),

  // ---- missing_number ----
  missingNumber(1, [1, 2, null, 4], 3, [3, 5, 2]),
  missingNumber(1, [2, 3, null, 5], 4, [4, 1, 6]),
  missingNumber(2, [4, 5, null, 7], 6, [6, 8, 3]),
  missingNumber(2, [6, null, 8, 9], 7, [7, 5, 10]),
  missingNumber(3, [10, 9, null, 7], 8, [8, 6, 9]),
  missingNumber(3, [5, null, 7, 8, 9], 6, [6, 4, 10]),

  // ---- sight_word: Dolch pre-primer ----
  sightWord(1, 'the', ['go', 'me']),
  sightWord(1, 'a', ['I', 'to']),
  sightWord(1, 'go', ['we', 'my']),
  sightWord(2, 'see', ['me', 'we', 'so']),
  sightWord(2, 'can', ['cat', 'car', 'an']),
  sightWord(2, 'you', ['yes', 'to', 'out']),
  sightWord(3, 'the', ['they', 'then', 'she']),
  sightWord(3, 'like', ['look', 'little', 'bike']),
  sightWord(3, 'we', ['me', 'be', 'he']),

  // ---- Scroll Room: alephbet_match — distinct first, lookalikes later ----
  alephbetMatch(1, 'א', 'aleph', ['ש', 'מ']),
  alephbetMatch(1, 'ש', 'shin', ['א', 'ל']),
  alephbetMatch(1, 'מ', 'mem', ['ש', 'ת']),
  alephbetMatch(2, 'ל', 'lamed', ['ג', 'נ']),
  alephbetMatch(2, 'ת', 'tav', ['ח', 'ה']),
  alephbetMatch(2, 'ג', 'gimel', ['נ', 'ל']),
  alephbetMatch(3, 'ב', 'bet', ['כ', 'נ']),
  alephbetMatch(3, 'ד', 'dalet', ['ר', 'ך']),
  alephbetMatch(3, 'ה', 'hey', ['ח', 'ת']),

  // ---- hebrew_sound_lock ----
  hebrewSoundLock(1, 'ב', 'bet', 'buh', ['ש', 'מ']),
  hebrewSoundLock(1, 'מ', 'mem', 'mmm', ['ב', 'ל']),
  hebrewSoundLock(1, 'ש', 'shin', 'shh', ['מ', 'ת']),
  hebrewSoundLock(2, 'ל', 'lamed', 'lll', ['ר', 'נ']),
  hebrewSoundLock(2, 'ת', 'tav', 'tuh', ['ד', 'ט']),
  hebrewSoundLock(2, 'נ', 'nun', 'nnn', ['מ', 'ל']),
  hebrewSoundLock(3, 'ד', 'dalet', 'duh', ['ת', 'ר']),
  hebrewSoundLock(3, 'ר', 'resh', 'rrr', ['ד', 'ל']),
  hebrewSoundLock(3, 'כ', 'kaf', 'kuh', ['ב', 'ג']),

  // ---- creation_count: through the seven days ----
  creationCount(1, 2, '💡', 'lights', 'Day one! Count the lights God made. How many?', [1, 2, 3]),
  creationCount(1, 3, '🌊', 'waves', 'Day two, the waters! Count the waves on the scroll.', [2, 3, 4]),
  creationCount(2, 5, '🌳', 'trees', 'Day three! Count the trees that grew. How many?', [4, 5, 6, 7]),
  creationCount(2, 4, '⭐', 'stars', 'Day four! Count the stars in the sky. How many?', [3, 4, 5, 6]),
  creationCount(2, 6, '🐟', 'fish', 'Day five! Count the fish in the sea, Agent.', [5, 6, 7, 8]),
  creationCount(3, 7, '🦁', 'animals', 'Day six, the animals! Count every one on the scroll.', [6, 7, 8, 9]),
  creationCount(3, 7, '🕯️', 'candles', 'How many days until Shabbat rest? Count them on the scroll.', [5, 6, 7, 8]),

  // ---- gematria: aleph=1, bet=2 legend on screen ----
  gematria(2, [{ symbol: '1', means: 'א' }, { symbol: '2', means: 'ב' }], ['1', '2'], 'av — father'),
  gematria(2, [{ symbol: '2', means: 'ב' }, { symbol: '3', means: 'ג' }, { symbol: '4', means: 'ד' }], ['4', '3'], 'dag — fish'),
  gematria(3, [{ symbol: '1', means: 'א' }, { symbol: '2', means: 'ב' }, { symbol: '3', means: 'ג' }], ['3', '2'], 'gav — back'),
  gematria(3, [{ symbol: '1', means: 'א' }, { symbol: '3', means: 'ג' }, { symbol: '4', means: 'ד' }], ['1', '4'], 'ed — witness'),
];

export const puzzleById = (id: string): Puzzle => {
  const p = PUZZLES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown puzzle: ${id}`);
  return p;
};

/** All puzzles for a rank/notch/track — used by the daily mission generator. */
export const puzzlesFor = (rank: Rank, notch: 1 | 2 | 3, track: Track): Puzzle[] =>
  PUZZLES.filter((p) => p.rank === rank && p.notch === notch && p.track === track);
