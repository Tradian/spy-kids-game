import { TemplateDef } from '../types';

/**
 * Template registry. The Code Stage renders purely from a template's
 * interaction mode plus the puzzle payload — adding a template here plus
 * payload data in puzzles.ts is all it takes to ship a new code type.
 */
export const TEMPLATES: TemplateDef[] = [
  // ---- Core eight ----
  { key: 'letter_match', track: 'core', mode: 'choice', parentLabel: 'Letter Match (find the matching letter)' },
  { key: 'sound_lock', track: 'core', mode: 'choice', parentLabel: 'Sound Lock (letter sounds)' },
  { key: 'count_gadgets', track: 'core', mode: 'choice', parentLabel: 'Count the Gadgets (counting 1–10)' },
  { key: 'shape_cipher', track: 'core', mode: 'sequence', parentLabel: 'Shape Cipher (decode with a legend)' },
  { key: 'pattern_breaker', track: 'core', mode: 'choice', parentLabel: 'Pattern Breaker (what comes next)' },
  { key: 'name_code', track: 'core', mode: 'sequence', parentLabel: 'Name Code (spell your own name)' },
  { key: 'missing_number', track: 'core', mode: 'choice', parentLabel: 'Missing Number (number lines)' },
  { key: 'sight_word', track: 'core', mode: 'choice', parentLabel: 'Sight Words (Dolch pre-primer)' },

  // ---- Scroll Room reskins: same engine, re-fed ----
  { key: 'alephbet_match', track: 'scroll', mode: 'choice', parentLabel: 'Aleph-Bet Match (Hebrew letters)' },
  { key: 'hebrew_sound_lock', track: 'scroll', mode: 'choice', parentLabel: 'Hebrew Sound Lock (letter sounds)' },
  { key: 'creation_count', track: 'scroll', mode: 'choice', parentLabel: 'Days of Creation Counting' },
  { key: 'gematria', track: 'scroll', mode: 'sequence', parentLabel: 'Gentle Gematria (aleph=1, bet=2)' },
];

export const templateByKey = (key: string): TemplateDef => {
  const t = TEMPLATES.find((x) => x.key === key);
  if (!t) throw new Error(`Unknown template: ${key}`);
  return t;
};
