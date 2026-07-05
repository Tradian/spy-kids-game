/**
 * Emits docs/voiceover-script.md — every Spymaster line in the game, keyed
 * by the audio asset name the app expects. Feed this to the AI voiceover
 * pipeline, drop the mp3s in assets/vo/, register them in
 * src/audio/audioService.ts VOICE_ASSETS, and the TTS fallback retires.
 *
 * Run: npm run voiceover-script
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PUZZLES } from '../src/content/puzzles';
import { MISSIONS } from '../src/content/missions';
import { GADGETS } from '../src/content/gadgets';
import { LINES } from '../src/content/lines';

const out: string[] = [];
const w = (s = '') => out.push(s);

w('# Little Agents — Spymaster Voiceover Script');
w();
w('One voice throughout (the Spymaster): warm, playful, a little conspiratorial,');
w('never sarcastic at the child. Pace slow-ish; these ears are 4–6 years old.');
w();
w('Asset key → file name convention: `<key>` → `assets/vo/<key>.mp3`.');
w();
w('> **Scroll Room guardrails:** verse texts below default to the Tree of Life');
w('> Version and say “the LORD” / “Adonai” for the divine name. **Ian approves');
w('> every scroll message script and all Hebrew pronunciation before anything');
w('> is bundled** — AI Hebrew is inconsistent; a human re-record may beat the');
w('> pipeline here (spec §6).');
w();

w('## Generic lines');
w();
w('| key | line |');
w('|---|---|');
LINES.wrongTap.forEach((l, i) => w(`| generic_wrong_${i + 1} | ${l} |`));
LINES.correctTap.forEach((l, i) => w(`| generic_correct_${i + 1} | ${l} |`));
w(`| generic_glow_nudge | ${LINES.glowNudge} |`);
w(`| generic_vault_opening | ${LINES.vaultOpening} |`);
w(`| generic_mission_complete | ${LINES.missionComplete} |`);
w(`| generic_welcome_hq | ${LINES.welcomeHQ} |`);
w(`| generic_promotion | ${LINES.promotion} |`);
w(`| generic_parent_incoming | ${LINES.parentMessageIncoming} |`);
w(`| generic_session_done | ${LINES.sessionDone} |`);
w();

w('## Missions (briefing / secret message / debrief)');
for (const m of MISSIONS) {
  w();
  w(`### ${m.title}${m.track === 'scroll' ? ' *(Scroll Room — Ian approval required)*' : ''}`);
  w();
  w(`| key | line |`);
  w(`|---|---|`);
  w(`| briefing_${m.id} | ${m.briefingLine} |`);
  w(`| secret_${m.id} | ${m.secretMessageLine} |`);
  w(`| debrief_${m.id} | ${m.debriefLine} |`);
}
w();

w('## Puzzle prompts and hints');
w();
let currentTemplate = '';
for (const p of PUZZLES) {
  if (p.templateKey !== currentTemplate) {
    currentTemplate = p.templateKey;
    w();
    w(`### ${currentTemplate}${p.track === 'scroll' ? ' *(Scroll Room — Ian approval required)*' : ''}`);
    w();
    w('| key | line |');
    w('|---|---|');
  }
  w(`| prompt_${p.id} | ${p.payload.promptLine} |`);
  w(`| hint_${p.id} | ${p.payload.hintLine} |`);
}
w();

w('## Gadget tap lines');
w();
w('| key | line |');
w('|---|---|');
for (const g of GADGETS) w(`| gadget_${g.id} | ${g.tapLine} |`);
w();

w('---');
w();
w('*Generated from src/content by scripts/generate-voiceover-script.ts — do not edit by hand.*');

mkdirSync(join(__dirname, '..', 'docs'), { recursive: true });
writeFileSync(join(__dirname, '..', 'docs', 'voiceover-script.md'), out.join('\n') + '\n');
console.log(`wrote docs/voiceover-script.md (${out.length} lines)`);
