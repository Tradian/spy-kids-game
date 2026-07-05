import { Mission, TemplateKey } from '../types';
import { PUZZLES } from './puzzles';

/**
 * Recruit-rank missions. Each mission is 3 code stages; the engine picks
 * the puzzle column matching the child's current difficulty notch.
 *
 * '@name_code' is a sentinel resolved at runtime into a puzzle that spells
 * the child's own name (see logic/puzzleEngine.ts) — it can't be static
 * data because it depends on the profile.
 */

/**
 * The i-th pool puzzle (0-based) for a template at a notch. Falls back to
 * the nearest notch that has data (some templates, like gematria, only
 * start at notch 2).
 */
const pick = (templateKey: TemplateKey, notch: 1 | 2 | 3, i: number): string => {
  const notchesToTry: (1 | 2 | 3)[] = notch === 1 ? [1, 2, 3] : notch === 2 ? [2, 1, 3] : [3, 2, 1];
  for (const n of notchesToTry) {
    const pool = PUZZLES.filter((p) => p.templateKey === templateKey && p.notch === n);
    if (pool.length) return pool[i % pool.length].id;
  }
  throw new Error(`No puzzles for ${templateKey}`);
};

const byNotch = (
  stages: [TemplateKey | '@name_code', number][],
): Record<1 | 2 | 3, string[]> => ({
  1: stages.map(([t, i]) => (t === '@name_code' ? '@name_code' : pick(t, 1, i))),
  2: stages.map(([t, i]) => (t === '@name_code' ? '@name_code' : pick(t, 2, i))),
  3: stages.map(([t, i]) => (t === '@name_code' ? '@name_code' : pick(t, 3, i))),
});

export const MISSIONS: Mission[] = [
  // ------------------------------- CORE ---------------------------------
  {
    id: 'm_jam_jar',
    title: 'The Jam Jar Job',
    rank: 'recruit',
    track: 'core',
    icon: '🫙',
    briefingLine:
      'Agent, we have a situation. Someone hid the strawberry jam in a locked cabinet — and snack time is in danger. Crack the codes and save the jam!',
    debriefLine:
      'The jam is safe, Agent. Outstanding work. Remember: never shake a jam jar near a laptop. Spymaster out!',
    secretMessageLine: 'The secret message says: THE JAM IS IN THE TALL CUPBOARD. Mission accomplished!',
    gadgetRewardId: 'g_flashlight',
    puzzleIdsByNotch: byNotch([
      ['letter_match', 0],
      ['count_gadgets', 0],
      ['letter_match', 1],
    ]),
  },
  {
    id: 'm_squeaky_door',
    title: 'The Squeaky Door',
    rank: 'recruit',
    track: 'core',
    icon: '🚪',
    briefingLine:
      'Listen carefully, Agent. The squeaky door at headquarters is locked with sound codes. Only an agent with sharp ears can open it.',
    debriefLine:
      'You heard every sound perfectly, Agent. I once tried to oil that door with honey. Do not do that. Spymaster out!',
    secretMessageLine: 'The door whispers: WELL DONE, AGENT. YOUR EARS ARE ELITE.',
    gadgetRewardId: 'g_headset',
    puzzleIdsByNotch: byNotch([
      ['sound_lock', 0],
      ['sound_lock', 1],
      ['letter_match', 2],
    ]),
  },
  {
    id: 'm_gadget_inventory',
    title: 'Gadget Inventory Night',
    rank: 'recruit',
    track: 'core',
    icon: '🧰',
    briefingLine:
      'Big job tonight, Agent. The gadget room is a mess and we must count everything before the inspector arrives at bedtime.',
    debriefLine:
      'Every gadget counted and shelved. The inspector is amazed. She says hello, by the way. Spymaster out!',
    secretMessageLine: 'Inventory complete! The secret message says: YOU COUNT, THEREFORE YOU ARE... A GREAT AGENT.',
    gadgetRewardId: 'g_magnet',
    puzzleIdsByNotch: byNotch([
      ['count_gadgets', 1],
      ['missing_number', 0],
      ['count_gadgets', 2],
    ]),
  },
  {
    id: 'm_shape_safe',
    title: 'The Shape Safe',
    rank: 'recruit',
    track: 'core',
    icon: '🔐',
    briefingLine:
      'Agent, the old shape safe has been found! Nobody has opened it in one hundred years. The legend on the door is your only clue.',
    debriefLine:
      'One hundred years locked, and YOU opened it. Inside was... my missing sandwich. Still can not explain that. Spymaster out!',
    secretMessageLine: 'The safe swings open! Inside, a note: SHAPES ARE JUST CODES WEARING COSTUMES.',
    gadgetRewardId: 'g_decoder',
    puzzleIdsByNotch: byNotch([
      ['shape_cipher', 0],
      ['pattern_breaker', 0],
      ['shape_cipher', 1],
    ]),
  },
  {
    id: 'm_sign_in',
    title: 'Agent, Sign In',
    rank: 'recruit',
    track: 'core',
    icon: '🪪',
    briefingLine:
      'Security upgrade, Agent! From today, headquarters only opens for agents who can code in their own name. Show the door who you are.',
    debriefLine:
      'The door knows your name now. It will probably say hello every morning. It is very friendly for a door. Spymaster out!',
    secretMessageLine: 'ACCESS GRANTED. The computer says: WELCOME, AGENT. WE ARE PROUD OF YOU.',
    gadgetRewardId: 'g_idscanner',
    puzzleIdsByNotch: byNotch([
      ['letter_match', 3],
      ['@name_code', 0],
      ['@name_code', 1],
    ]),
  },
  {
    id: 'm_pattern_vault',
    title: 'The Pattern Vault',
    rank: 'recruit',
    track: 'core',
    icon: '🌀',
    briefingLine:
      'Agent, the pattern vault hums a rhythm. Everything inside it follows a pattern — crack three of them and the vault sings open.',
    debriefLine:
      'The vault sang! It was a little off-key, but we do not mention that. Beautiful pattern work, Agent. Spymaster out!',
    secretMessageLine: 'The vault sings: PATTERNS ARE EVERYWHERE. AGENTS WHO SEE THEM SEE THE FUTURE.',
    gadgetRewardId: 'g_compass',
    puzzleIdsByNotch: byNotch([
      ['pattern_breaker', 1],
      ['missing_number', 1],
      ['pattern_breaker', 0],
    ]),
  },
  {
    id: 'm_word_wire',
    title: 'Word on the Wire',
    rank: 'recruit',
    track: 'core',
    icon: '📻',
    briefingLine:
      'Shh! Secret words are coming through the radio, Agent. Listen for each password and find it on the word wall. The wire is live!',
    debriefLine:
      'Every password caught! The radio is impressed. It only plays static for agents it respects. Spymaster out!',
    secretMessageLine: 'The final transmission reads: YOU CAN READ SECRET WORDS. THAT IS A SUPERPOWER.',
    gadgetRewardId: 'g_radio',
    puzzleIdsByNotch: byNotch([
      ['sight_word', 0],
      ['sight_word', 1],
      ['sound_lock', 2],
    ]),
  },
  {
    id: 'm_midnight_snack',
    title: 'The Midnight Snack Cipher',
    rank: 'recruit',
    track: 'core',
    icon: '🍪',
    briefingLine:
      'Someone is sneaking cookies at midnight, Agent, and they leave coded notes. Tonight we decode everything and solve the Cookie Question.',
    debriefLine:
      'Case closed! The midnight snacker was... the dog. We have chosen to forgive him. Spymaster out!',
    secretMessageLine: 'The decoded note says: THE COOKIES WERE DELICIOUS. SIGNED, A VERY GOOD DOG.',
    gadgetRewardId: 'g_glasses',
    puzzleIdsByNotch: byNotch([
      ['shape_cipher', 0],
      ['sight_word', 2],
      ['missing_number', 1],
    ]),
  },

  // ---------------------------- SCROLL ROOM -----------------------------
  {
    id: 's_creation',
    title: 'The Creation Scroll',
    rank: 'recruit',
    track: 'scroll',
    icon: '🌍',
    briefingLine:
      'Agent, the oldest scroll in the whole library is missing its pieces — the story of how everything began. Count your way through the days and bring it home.',
    debriefLine:
      'The Creation Scroll is back on its shelf, glowing a little. Scrolls do that when they are happy. Wonderful work, Agent.',
    secretMessageLine:
      'The scroll unrolls... In the beginning, God created the heavens and the earth.',
    gadgetRewardId: 'g_lantern',
    puzzleIdsByNotch: byNotch([
      ['creation_count', 0],
      ['creation_count', 1],
      ['creation_count', 2],
    ]),
  },
  {
    id: 's_shema',
    title: 'The Shema Scroll',
    rank: 'recruit',
    track: 'scroll',
    icon: '📜',
    briefingLine:
      'This scroll holds the most important words in the library, Agent. Its letters are scattered — find each scroll letter and the words come home.',
    debriefLine:
      'The great words are safe again. The whole library feels quieter now, in a good way. Thank you, Agent.',
    secretMessageLine:
      'The scroll unrolls... Shema Yisrael, Adonai Eloheinu, Adonai Echad. Hear, O Israel: the LORD our God, the LORD is one.',
    gadgetRewardId: 'g_scrollcase',
    puzzleIdsByNotch: byNotch([
      ['alephbet_match', 0],
      ['alephbet_match', 1],
      ['hebrew_sound_lock', 0],
    ]),
  },
  {
    id: 's_light',
    title: 'The Light Mission',
    rank: 'recruit',
    track: 'scroll',
    icon: '🕯️',
    briefingLine:
      'The lamps in the scroll library have gone dark, Agent. Crack the codes to light each one, and find the message hiding in the light.',
    debriefLine:
      'Every lamp is burning bright, and the library is golden. You did that, Agent. Sleep well tonight.',
    secretMessageLine: 'The lamps flicker and spell it out... You are the light of the world.',
    gadgetRewardId: 'g_candle',
    puzzleIdsByNotch: byNotch([
      ['hebrew_sound_lock', 1],
      ['gematria', 0],
      ['alephbet_match', 2],
    ]),
  },
];

export const missionById = (id: string): Mission => {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown mission: ${id}`);
  return m;
};

export const missionsFor = (rank: string, track: string): Mission[] =>
  MISSIONS.filter((m) => m.rank === rank && m.track === track);
