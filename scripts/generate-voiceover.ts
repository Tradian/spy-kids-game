/**
 * ElevenLabs voiceover + sound-effects generator.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... npm run voiceover            # core track only
 *   ELEVENLABS_API_KEY=sk_... npm run voiceover -- --scroll # include Scroll Room lines
 *   ELEVENLABS_API_KEY=sk_... npm run voiceover -- --sfx    # include sound effects
 *
 * Output: assets/vo/<key>.mp3 and assets/sfx/<key>.mp3. Existing files are
 * skipped, so re-runs only fill gaps — delete a file to re-record it.
 * After generating, run `npm run voice-manifest` to refresh the app's
 * asset registry, and copy assets/vo + assets/sfx onto the gh-pages branch
 * (as vo/ and sfx/) to give the web version the same voice.
 *
 * Scroll Room guardrail (spec §5/§6): scroll-track lines are EXCLUDED
 * unless --scroll is passed — Ian reviews every scroll message script and
 * all Hebrew pronunciation before they ship to the kids. AI Hebrew is
 * inconsistent; listen to every scroll file before bundling.
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PUZZLES } from '../src/content/puzzles';
import { MISSIONS } from '../src/content/missions';
import { GADGETS } from '../src/content/gadgets';
import { LINES } from '../src/content/lines';

const API_KEY = process.env.ELEVENLABS_API_KEY;
// Default: "George" — warm storyteller stock voice. Override with your own
// Spymaster voice id once you've picked one in the ElevenLabs voice library.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? 'JBFqnCBsd6RMkjVDRZzb';
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';

const includeScroll = process.argv.includes('--scroll');
const includeSfx = process.argv.includes('--sfx');

interface Line { key: string; text: string; track: 'core' | 'scroll' }

function collectLines(): Line[] {
  const lines: Line[] = [];
  LINES.wrongTap.forEach((l, i) => lines.push({ key: `generic_wrong_${i + 1}`, text: l, track: 'core' }));
  LINES.correctTap.forEach((l, i) => lines.push({ key: `generic_correct_${i + 1}`, text: l, track: 'core' }));
  lines.push(
    { key: 'generic_glow_nudge', text: LINES.glowNudge, track: 'core' },
    { key: 'generic_vault_opening', text: LINES.vaultOpening, track: 'core' },
    { key: 'generic_mission_complete', text: LINES.missionComplete, track: 'core' },
    { key: 'generic_welcome_hq', text: LINES.welcomeHQ, track: 'core' },
    { key: 'generic_promotion', text: LINES.promotion, track: 'core' },
    { key: 'generic_parent_incoming', text: LINES.parentMessageIncoming, track: 'core' },
    { key: 'generic_session_done', text: LINES.sessionDone, track: 'core' },
  );
  for (const m of MISSIONS) {
    lines.push(
      { key: `briefing_${m.id}`, text: m.briefingLine, track: m.track },
      { key: `secret_${m.id}`, text: m.secretMessageLine, track: m.track },
      { key: `debrief_${m.id}`, text: m.debriefLine, track: m.track },
    );
  }
  for (const p of PUZZLES) {
    lines.push(
      { key: `prompt_${p.id}`, text: p.payload.promptLine, track: p.track },
      { key: `hint_${p.id}`, text: p.payload.hintLine, track: p.track },
    );
  }
  for (const g of GADGETS) lines.push({ key: `gadget_${g.id}`, text: g.tapLine, track: 'core' });
  return lines;
}

/** Sound effects, generated with the ElevenLabs sound-generation API. */
const SFX: { key: string; prompt: string; seconds: number }[] = [
  { key: 'sfx_correct', prompt: 'Short bright playful two-note toy chime, spy gadget confirmation beep, cheerful, for a kids game', seconds: 1 },
  { key: 'sfx_wrong', prompt: 'Soft low gentle muted thud, friendly and not scary at all, very brief, for a kids game wrong answer', seconds: 1 },
  { key: 'sfx_tick', prompt: 'Tiny single click beep, light and quick, keypad tick for a kids spy game', seconds: 0.5 },
  { key: 'sfx_vault', prompt: 'Metal vault wheel spinning then a large heavy door sliding open with a deep satisfying clunk, cartoonish, for a kids spy game', seconds: 3 },
  { key: 'sfx_confetti', prompt: 'Party popper burst with light sparkle shimmer, celebratory, short, for a kids game victory', seconds: 2 },
  { key: 'sfx_stamp', prompt: 'Rubber stamp thumping onto paper, satisfying and playful, short', seconds: 1 },
  { key: 'sfx_promotion', prompt: 'Short triumphant playful toy trumpet fanfare for a kids game promotion ceremony', seconds: 3 },
];

async function tts(text: string): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_96`, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY!, 'content-type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.35, speed: 0.92 },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function soundEffect(prompt: string, seconds: number): Promise<Buffer> {
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY!, 'content-type': 'application/json' },
    body: JSON.stringify({ text: prompt, duration_seconds: seconds, prompt_influence: 0.4 }),
  });
  if (!res.ok) throw new Error(`SFX ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= 4) throw e;
      const wait = 2000 * attempt;
      console.warn(`  retry ${attempt} for ${label} in ${wait}ms: ${(e as Error).message.slice(0, 120)}`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function main() {
  if (!API_KEY) {
    console.error('Set ELEVENLABS_API_KEY. Optional: ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID.');
    process.exit(1);
  }

  const voDir = join(__dirname, '..', 'assets', 'vo');
  const sfxDir = join(__dirname, '..', 'assets', 'sfx');
  mkdirSync(voDir, { recursive: true });
  mkdirSync(sfxDir, { recursive: true });

  const lines = collectLines().filter((l) => includeScroll || l.track === 'core');
  const skippedScroll = collectLines().length - lines.length;
  if (skippedScroll) {
    console.log(`Skipping ${skippedScroll} Scroll Room lines (pass --scroll after Ian approves the scripts).`);
  }

  let made = 0, skipped = 0;
  for (const line of lines) {
    const file = join(voDir, `${line.key}.mp3`);
    if (existsSync(file)) { skipped++; continue; }
    const audio = await withRetry(() => tts(line.text), line.key);
    writeFileSync(file, audio);
    made++;
    console.log(`✓ vo/${line.key}.mp3 (${made} new)`);
  }

  if (includeSfx) {
    for (const s of SFX) {
      const file = join(sfxDir, `${s.key}.mp3`);
      if (existsSync(file)) { skipped++; continue; }
      const audio = await withRetry(() => soundEffect(s.prompt, s.seconds), s.key);
      writeFileSync(file, audio);
      made++;
      console.log(`✓ sfx/${s.key}.mp3`);
    }
  }

  console.log(`\nDone: ${made} generated, ${skipped} already existed.`);
  console.log('Next: npm run voice-manifest  (refreshes the app asset registry)');
  console.log('Web:  copy assets/vo -> gh-pages:/vo and assets/sfx -> gh-pages:/sfx');
}

main();
