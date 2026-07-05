/**
 * Dumps the game content as one JSON blob for the single-file web preview
 * (web-preview/index.html). Run: npx tsx scripts/export-content-json.ts
 */
import { PUZZLES } from '../src/content/puzzles';
import { MISSIONS } from '../src/content/missions';
import { GADGETS } from '../src/content/gadgets';
import { BADGES } from '../src/content/badges';
import { TEMPLATES } from '../src/content/templates';
import { LINES } from '../src/content/lines';

process.stdout.write(
  JSON.stringify({
    templates: TEMPLATES,
    puzzles: PUZZLES,
    missions: MISSIONS,
    gadgets: GADGETS,
    badges: BADGES,
    lines: LINES,
  }),
);
