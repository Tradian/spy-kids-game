import { FieldOp, FieldSkill, Mission, Profile, Puzzle, TemplateKey } from '../types';
import { PUZZLES } from '../content/puzzles';
import { GADGETS } from '../content/gadgets';

/**
 * Field Ops: parent-built real-world missions ("Operation Jules"). Each
 * stage is a family place name + a skill; the engine picks a concrete
 * puzzle at the child's level and opens the prompt with the location, so
 * the game narrates the actual walk. Data is device-only (see db/repo.ts).
 */

export const SKILL_TEMPLATES: Record<Exclude<FieldSkill, 'surprise'>, TemplateKey> = {
  letters: 'letter_match',
  sounds: 'sound_lock',
  counting: 'count_gadgets',
  patterns: 'pattern_breaker',
  numbers: 'missing_number',
  words: 'sight_word',
  ciphers: 'shape_cipher',
};

export const SKILL_LABELS: Record<FieldSkill, string> = {
  surprise: 'Surprise me',
  letters: 'Letters',
  sounds: 'Letter sounds',
  counting: 'Counting',
  patterns: 'Patterns',
  numbers: 'Numbers',
  words: 'Sight words',
  ciphers: 'Shape codes',
};

export function fieldOpAsMission(op: FieldOp, profile: Profile): Mission {
  return {
    id: op.id,
    title: op.title,
    rank: profile.rank,
    track: 'core',
    icon: op.icon || '💎',
    briefingLine:
      op.briefing || `Agent, a field mission! ${op.title}. Crack every code on the trail!`,
    debriefLine:
      'Field mission complete, Agent. Headquarters is amazed at your outdoor skills. Spymaster out!',
    secretMessageLine: op.secret || 'Mission accomplished, Agent!',
    gadgetRewardId: GADGETS[hashString(op.id) % GADGETS.length].id,
    puzzleIdsByNotch: { 1: [], 2: [], 3: [] }, // resolved from fieldStages instead
    fieldStages: op.stages,
  };
}

export function resolveFieldStages(mission: Mission, profile: Profile): Puzzle[] {
  return (mission.fieldStages ?? []).map((stage, i) => {
    const tkey = stage.skill !== 'surprise' ? SKILL_TEMPLATES[stage.skill] : undefined;
    let pool: Puzzle[] = [];
    if (tkey) {
      for (const notch of [profile.difficultyNotch, 2, 1, 3] as const) {
        pool = PUZZLES.filter((p) => p.templateKey === tkey && p.track === 'core' && p.notch === notch);
        if (pool.length) break;
      }
    }
    if (!pool.length) {
      pool = PUZZLES.filter((p) => p.track === 'core' && p.notch === profile.difficultyNotch);
    }
    if (!pool.length) pool = PUZZLES.filter((p) => p.track === 'core');

    const base = pool[hashString(`${mission.id}:${i}`) % pool.length];
    const intro = stage.location ? `Agent, we made it to ${stage.location}! ` : '';
    return {
      ...base,
      noVo: true, // live location intro: always speak fresh, skip recorded mp3
      payload: { ...base.payload, promptLine: intro + base.payload.promptLine },
    };
  });
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
