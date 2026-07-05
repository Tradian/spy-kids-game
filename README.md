# Little Agents 🕵️

A personal-use spy-code game for ages 4–6, with an optional Scroll Room faith
track. Built for Ian's own kids: **no ads, no analytics, no accounts, no
network** — everything lives on the device.

Kids play as agents of the Spy Academy. Every mission is a chain of three
code stages (letters, sounds, counting, patterns, ciphers); cracking the last
one opens a vault, reveals a secret message, and awards a gadget. Skills are
practiced; rewards are received — on the scroll track the reward is a verse,
never a quiz.

## Running it

```bash
npm install
npx expo start        # scan the QR with Expo Go, or press i / a
```

Portrait only. Every child-facing interaction is audio + big buttons — no
reading required to play (reading is what the game *teaches*).

Until the voiceover batch is generated, all Spymaster lines are spoken by the
device's text-to-speech. See **Audio pipeline** below.

## Architecture

```
App.tsx                     boot: SQLite init → AppProvider → Router
src/
  types.ts                  every shared type; puzzles are pure data payloads
  theme.ts                  chunky flat style; 64pt minimum touch targets
  content/                  ALL game content — adding puzzles is data entry
    templates.ts            template registry (choice | sequence modes)
    puzzles.ts              the puzzle pool: 95 puzzles, notches 1–3
    missions.ts             mission definitions, core + scroll tracks
    gadgets.ts / badges.ts  rewards
    lines.ts                the Spymaster's generic script lines
  db/
    database.ts             expo-sqlite schema + idempotent content seeding
    repo.ts                 profiles, progress, gadgets, badges, parent msgs
  logic/
    puzzleEngine.ts         mission → puzzles, name-code generator, daily drop
    adaptive.ts             invisible difficulty: notch + rank promotion
    completeMission.ts      the one place mission completion is recorded
  audio/audioService.ts     bundled mp3 playback with TTS fallback
  state/AppContext.tsx      profile + a tiny explicit screen stack
  components/               BigButton, OptionTile, VaultDoor, Confetti, …
  screens/                  ProfileSelect, HQ, MissionMap, Briefing,
                            CodeStage, Unlock, Debrief, GadgetLocker,
                            BadgeWall, ParentArea
scripts/
  validate-content.ts       npm run validate — content coherence checks
  generate-voiceover-script.ts  npm run voiceover-script
docs/voiceover-script.md    every line, keyed for the voiceover pipeline
```

### The engine in one paragraph

Every code template is either a **choice** (tap the right tile) or a
**sequence** (press the code in order, legend on screen). The Code Stage
screen renders any `PuzzlePayload` with the same constant layout: art on
top, Spymaster replay button, answer tiles below. Miss ladder: first wrong
tap → soft shake + "hmm, not that one, Agent"; second → hint audio; third →
the correct tile glows until tapped. Two dynamic cases are generated at
runtime: `name_code` (spells the child's own name, supports fading with
difficulty) and the daily mission (date-seeded pick from the pool).

### Adaptive difficulty (never shown to the child)

Three first-try answers in a row raise the notch (1→3); two glowing-hint
stages in one mission lower it. Sustaining notch 3 cleanly across two
consecutive missions triggers the rank promotion ceremony — the only place
difficulty ever surfaces. Parents can freeze the notch in the Parent Area.

### Parent Area

Hold the corner icon 3 seconds + solve 6 × 4. Inside: plain-language
progress, record a secret message (≤20s, played as a "secret transmission"
after the child's next mission), Scroll Room toggle, missions-per-session
limit, difficulty override.

### Scroll Room

Same engine, re-fed: aleph-bet match, Hebrew sound locks, Days-of-Creation
counting, gentle gematria (aleph=1 legend). Three v1 scrolls: Creation,
Shema, Light. Guardrails live in the data, not the code: verses are short,
spoken warmly, and are always the reward, never the gate. **Ian reviews all
scroll message scripts and Hebrew audio before they ship to the kids** —
default translation is the Tree of Life Version, divine name rendered
"the LORD" / "Adonai".

## Audio pipeline

1. `npm run voiceover-script` regenerates `docs/voiceover-script.md` from
   the content files (it can never drift).
2. Batch-generate mp3s with the existing AI voiceover pipeline, named
   `<key>.mp3`, into `assets/vo/`.
3. Register them in `VOICE_ASSETS` in `src/audio/audioService.ts`.
   Unregistered lines keep falling back to TTS, so this can land
   incrementally — do `sound_lock` prompts first, it's the workhorse.

## Content workflow

Add puzzles/missions in `src/content/*`, then:

```bash
npm run validate     # answers exist in options, missions reference real
                     # puzzles, tracks match, 3 stages per notch, …
npx tsc --noEmit
```

Content re-seeds into SQLite on every launch (INSERT OR REPLACE), so a data
change is live on next start without touching child progress.

## Build order status (spec §7)

- ✅ Sprint 1 — the loop: profiles, HQ, briefing → code stage → vault →
  debrief, gadgets
- ✅ Sprint 2 — content engine: all eight core templates, mission map,
  adaptive notches, 8 recruit missions, locker, ID card
- ✅ Sprint 3 — Scroll Room: Hebrew reskins, Creation/Shema/Light scrolls,
  parent toggle
- ✅ Sprint 4 (most) — parent recordings, badge wall, daily mission,
  session limits
- ⬜ Junior/Special rank content, seasonal missions (Afikomen Operation,
  feast days), printable decoder wheel, real illustrated art + recorded
  voiceover to replace emoji placeholders and TTS

If this ever goes public, revisit spec §9 (COPPA, kids-category review,
privacy policy) — none of it blocks family use.
