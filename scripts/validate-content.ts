/**
 * Content sanity checks — run with `npm run validate` after any puzzle or
 * mission data change. Catches the failure modes that would otherwise only
 * show up in a four-year-old's hands.
 */
import { PUZZLES } from '../src/content/puzzles';
import { MISSIONS } from '../src/content/missions';
import { GADGETS } from '../src/content/gadgets';
import { TEMPLATES, templateByKey } from '../src/content/templates';

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`✗ ${msg}`);
};

// --- puzzles ---
const ids = new Set<string>();
for (const p of PUZZLES) {
  if (ids.has(p.id)) fail(`duplicate puzzle id ${p.id}`);
  ids.add(p.id);

  const template = templateByKey(p.templateKey);
  if (template.track !== p.track) fail(`${p.id}: track mismatch with template`);

  const optionIds = p.payload.options.map((o) => o.id);
  if (new Set(optionIds).size !== optionIds.length) fail(`${p.id}: duplicate option ids`);

  const answers = Array.isArray(p.payload.answer) ? p.payload.answer : [p.payload.answer];
  if (answers.length === 0) fail(`${p.id}: empty answer`);
  for (const a of answers) {
    if (!optionIds.includes(a)) fail(`${p.id}: answer "${a}" not among options [${optionIds.join(', ')}]`);
  }
  if (template.mode === 'choice' && Array.isArray(p.payload.answer)) {
    fail(`${p.id}: choice template with sequence answer`);
  }
  if (template.mode === 'sequence' && !Array.isArray(p.payload.answer)) {
    fail(`${p.id}: sequence template with single answer`);
  }
  if (p.payload.options.length < 2) fail(`${p.id}: fewer than 2 options`);
  if (p.payload.options.length > 8) fail(`${p.id}: too many options for small hands`);
  if (!p.payload.promptLine) fail(`${p.id}: missing prompt line`);
  if (!p.payload.hintLine) fail(`${p.id}: missing hint line`);
  if (template.mode === 'sequence' && !p.payload.legend && p.templateKey !== 'name_code') {
    fail(`${p.id}: sequence puzzle without a legend`);
  }
}

// --- missions ---
const gadgetIds = new Set(GADGETS.map((g) => g.id));
const missionIds = new Set<string>();
for (const m of MISSIONS) {
  if (missionIds.has(m.id)) fail(`duplicate mission id ${m.id}`);
  missionIds.add(m.id);
  if (!gadgetIds.has(m.gadgetRewardId)) fail(`${m.id}: unknown gadget ${m.gadgetRewardId}`);

  for (const notch of [1, 2, 3] as const) {
    const stageIds = m.puzzleIdsByNotch[notch];
    if (stageIds.length !== 3) fail(`${m.id} notch ${notch}: expected 3 stages, got ${stageIds.length}`);
    for (const id of stageIds) {
      if (id === '@name_code') continue;
      const p = PUZZLES.find((x) => x.id === id);
      if (!p) {
        fail(`${m.id} notch ${notch}: unknown puzzle ${id}`);
        continue;
      }
      if (p.track !== m.track) fail(`${m.id}: puzzle ${id} is ${p.track}-track in a ${m.track} mission`);
    }
  }
}

// --- summary ---
const byTemplate = new Map<string, number>();
for (const p of PUZZLES) byTemplate.set(p.templateKey, (byTemplate.get(p.templateKey) ?? 0) + 1);
console.log(`\n${PUZZLES.length} puzzles across ${byTemplate.size}/${TEMPLATES.length} templates:`);
for (const [k, n] of byTemplate) console.log(`  ${k}: ${n}`);
console.log(`${MISSIONS.length} missions (${MISSIONS.filter((m) => m.track === 'scroll').length} scroll)`);

if (failures) {
  console.error(`\n${failures} content problem(s) found`);
  process.exit(1);
}
console.log('\n✓ content is coherent');
