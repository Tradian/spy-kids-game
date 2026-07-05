import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, type } from '../theme';
import { Mission, Puzzle, PuzzleOption, StageResult } from '../types';
import { templateByKey } from '../content/templates';
import { nextCorrectLine, nextWrongLine, LINES } from '../content/lines';
import { resolveMissionPuzzles } from '../logic/puzzleEngine';
import { useApp } from '../state/AppContext';
import { ScreenShell } from '../components/ScreenShell';
import { OptionTile } from '../components/OptionTile';
import { SpymasterBubble } from '../components/SpymasterBubble';
import { say, stopSpeaking } from '../audio/audioService';

/**
 * The workhorse screen, spec section 3.5. Layout is constant across every
 * template: scene art on top, prompt replay (Spymaster face), answer area
 * below. Two interaction modes cover all templates:
 *   choice   — tap the one right tile
 *   sequence — press the code in order (each press checked immediately)
 *
 * Miss ladder: 1st wrong = soft shake + "hmm, not that one"; 2nd = hint
 * audio; 3rd = the correct tile glows until tapped.
 */
export function CodeStageScreen({ mission }: { mission: Mission }) {
  const { profile, replace, goHome } = useApp();

  const puzzles = useMemo(
    () => (profile ? resolveMissionPuzzles(mission, profile) : []),
    [mission, profile],
  );

  const [stageIndex, setStageIndex] = useState(0);
  const results = useRef<StageResult[]>([]);

  if (!profile || puzzles.length === 0) return null;

  const puzzle = puzzles[stageIndex];

  const onStageDone = (result: StageResult) => {
    results.current = [...results.current, result];
    if (stageIndex + 1 < puzzles.length) {
      setStageIndex(stageIndex + 1);
    } else {
      stopSpeaking();
      replace({ name: 'unlock', mission, results: results.current });
    }
  };

  return (
    <ScreenShell onBack={goHome} scroll={mission.track === 'scroll'} title={mission.title}>
      <StagePips total={puzzles.length} current={stageIndex} />
      <Stage key={puzzle.id + stageIndex} puzzle={puzzle} onDone={onStageDone} />
    </ScreenShell>
  );
}

function StagePips({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.pips}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.pip,
            i < current && { backgroundColor: colors.mint },
            i === current && { backgroundColor: colors.gold },
          ]}
        />
      ))}
    </View>
  );
}

function Stage({ puzzle, onDone }: { puzzle: Puzzle; onDone: (r: StageResult) => void }) {
  const template = templateByKey(puzzle.templateKey);
  const { payload } = puzzle;
  const answerSeq = Array.isArray(payload.answer) ? payload.answer : [payload.answer];

  const [misses, setMisses] = useState(0);
  const [seqPos, setSeqPos] = useState(0);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const everGlowed = useRef(false);

  useEffect(() => {
    say(payload.promptLine, puzzle.id ? `prompt_${puzzle.id}` : undefined);
    return stopSpeaking;
    // re-prompt only when the puzzle changes
  }, [puzzle.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const glowing = misses >= 3;
  if (glowing) everGlowed.current = true;
  const expectedId = answerSeq[seqPos];

  const handleWrong = (o: PuzzleOption) => {
    setShakingId(o.id);
    setTimeout(() => setShakingId(null), 400);
    const nextMisses = misses + 1;
    setMisses(nextMisses);
    if (nextMisses === 1) say(nextWrongLine());
    else if (nextMisses === 2) say(payload.hintLine, `hint_${puzzle.id}`);
    else say(LINES.glowNudge);
  };

  const handleRight = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (seqPos + 1 < answerSeq.length) {
      // mid-sequence: quiet tick forward, fresh miss ladder per step
      setSeqPos(seqPos + 1);
      setMisses(0);
      return;
    }
    setSolved(true);
    say(nextCorrectLine());
    setTimeout(() => {
      onDone({
        puzzleId: puzzle.id,
        firstTry: !everGlowed.current && misses === 0 && seqPosWasClean.current,
        glowed: everGlowed.current,
      });
    }, 1100);
  };

  // a sequence is only "first try" if no step ever missed
  const seqPosWasClean = useRef(true);

  const onTile = (o: PuzzleOption) => {
    if (solved) return;
    if (o.id === expectedId) {
      handleRight();
    } else {
      seqPosWasClean.current = false;
      handleWrong(o);
    }
  };

  const isWordTiles = puzzle.templateKey === 'sight_word';

  return (
    <View style={styles.stage}>
      {/* Scene art */}
      <View style={styles.art}>
        {payload.art ? (
          payload.art.count ? (
            <View style={styles.countGrid}>
              {Array.from({ length: payload.art.count }, (_, i) => (
                <Text key={i} style={styles.countEmoji}>{payload.art!.value}</Text>
              ))}
            </View>
          ) : (
            <Text style={styles.artBig}>{payload.art.value}</Text>
          )
        ) : null}

        {/* Legend for cipher templates */}
        {payload.legend && (
          <View style={styles.legend}>
            {payload.legend.map((l) => (
              <View key={l.symbol} style={styles.legendItem}>
                <Text style={styles.legendText}>{l.symbol} = {l.means}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sequence progress: filled boxes for entered steps */}
        {template.mode === 'sequence' && (
          <View style={styles.seqRow}>
            {answerSeq.map((id, i) => (
              <View key={i} style={[styles.seqBox, i < seqPos && styles.seqBoxDone]}>
                <Text style={styles.seqBoxText}>{i < seqPos ? id : ''}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <SpymasterBubble line={payload.promptLine} audioKey={`prompt_${puzzle.id}`} />

      {/* Answer area */}
      <View style={styles.options}>
        {payload.options.map((o) => (
          <OptionTile
            key={o.id}
            option={o}
            onPress={onTile}
            glowing={glowing && o.id === expectedId}
            shaking={shakingId === o.id}
            wordTile={isWordTiles}
            disabled={solved}
          />
        ))}
      </View>

      {solved && <Text style={styles.solvedFlash}>✅</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pips: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  pip: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.bgRaised,
    marginHorizontal: 5,
  },
  stage: { flex: 1 },
  art: {
    flex: 1,
    backgroundColor: colors.bgPanel,
    borderRadius: radii.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    padding: 12,
  },
  artBig: { fontSize: 96, color: colors.textBright, fontWeight: '900', textAlign: 'center' },
  countGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 320,
  },
  countEmoji: { fontSize: 44, margin: 4 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: colors.bgRaised,
    borderRadius: radii.tile,
    padding: 8,
    marginTop: 10,
  },
  legendItem: { paddingHorizontal: 10, paddingVertical: 4 },
  legendText: { color: colors.gold, fontSize: type.title, fontWeight: '800' },
  seqRow: { flexDirection: 'row', marginTop: 12 },
  seqBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.outline,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDeep,
  },
  seqBoxDone: { borderColor: colors.mint, backgroundColor: colors.bgRaised },
  seqBoxText: { color: colors.mint, fontSize: 28, fontWeight: '900' },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  solvedFlash: {
    position: 'absolute',
    alignSelf: 'center',
    top: '35%',
    fontSize: 90,
  },
});
