/**
 * The Spymaster's generic script lines — everything not attached to a
 * specific puzzle or mission. This file plus puzzles.ts and missions.ts
 * IS the voiceover script source; docs/voiceover-script.md is generated
 * from the same content for the recording batch.
 */

export const LINES = {
  wrongTap: [
    'Hmm, not that one, Agent.',
    'Close! Try another button.',
    'Not quite. Steady hands, Agent.',
  ],
  correctTap: [
    'Yes! That is it!',
    'Cracked it!',
    'Outstanding, Agent!',
    'You got it!',
  ],
  glowNudge: 'Watch the glowing button, Agent. That is the one!',
  vaultOpening: 'The vault is opening...',
  missionComplete: 'Mission accomplished, Agent!',
  welcomeHQ: 'Welcome to headquarters, Agent. Pick a door!',
  promotion:
    'Attention! By the power of Spy Academy, you are hereby promoted. Stand tall, Agent. We are so proud of you.',
  parentMessageIncoming: 'Special transmission incoming... this one is just for you.',
  sequenceProgress: 'Keep going...',
  sessionDone: 'That is all the missions for now, Agent. Headquarters will call you tomorrow!',
} as const;

let wrongIdx = 0;
let correctIdx = 0;

export const nextWrongLine = (): string => LINES.wrongTap[wrongIdx++ % LINES.wrongTap.length];
export const nextCorrectLine = (): string => LINES.correctTap[correctIdx++ % LINES.correctTap.length];

/**
 * Reverse lookup: line text → voiceover asset key (matches the keys in
 * docs/voiceover-script.md). Lets call sites say(line) without threading a
 * key, while still picking up the bundled mp3 once the batch lands.
 */
export const GENERIC_LINE_KEYS: Record<string, string> = {
  ...Object.fromEntries(LINES.wrongTap.map((l, i) => [l, `generic_wrong_${i + 1}`])),
  ...Object.fromEntries(LINES.correctTap.map((l, i) => [l, `generic_correct_${i + 1}`])),
  [LINES.glowNudge]: 'generic_glow_nudge',
  [LINES.vaultOpening]: 'generic_vault_opening',
  [LINES.missionComplete]: 'generic_mission_complete',
  [LINES.welcomeHQ]: 'generic_welcome_hq',
  [LINES.promotion]: 'generic_promotion',
  [LINES.parentMessageIncoming]: 'generic_parent_incoming',
  [LINES.sessionDone]: 'generic_session_done',
};
