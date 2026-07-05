import { Profile, Rank, RANK_ORDER, StageResult } from '../types';
import { getAdaptiveState, setAdaptiveState, updateProfile } from '../db/repo';

/**
 * Adaptive difficulty, spec section 2:
 *  - 3 first-try-correct stages in a row raise difficulty_notch (max 3)
 *  - two glowing-hint stages in one mission lower it (min 1)
 *  - rank promotion when the child sustains notch 3 across two
 *    consecutive missions
 *
 * None of this is ever surfaced to the child except the promotion
 * ceremony. Parents can freeze the notch with difficultyLocked.
 */

export interface AdaptiveOutcome {
  newNotch: 1 | 2 | 3;
  promotedTo: Rank | null;
}

export async function applyMissionResults(
  profile: Profile,
  results: StageResult[],
): Promise<AdaptiveOutcome> {
  const state = await getAdaptiveState(profile.id);
  let notch = profile.difficultyNotch;
  let promotedTo: Rank | null = null;

  const glowsThisMission = results.filter((r) => r.glowed).length;

  if (!profile.difficultyLocked) {
    // First-try streak persists across missions until broken.
    for (const r of results) {
      state.firstTryStreak = r.firstTry ? state.firstTryStreak + 1 : 0;
      if (state.firstTryStreak >= 3 && notch < 3) {
        notch = (notch + 1) as 1 | 2 | 3;
        state.firstTryStreak = 0;
      }
    }

    // Two glowing-hint stages in one mission drop the notch.
    if (glowsThisMission >= 2 && notch > 1) {
      notch = (notch - 1) as 1 | 2 | 3;
      state.firstTryStreak = 0;
    }
  }

  // Promotion: a mission counts toward promotion when it was PLAYED at
  // notch 3 and finished without any glowing-hint stage.
  if (profile.difficultyNotch === 3 && notch === 3 && glowsThisMission === 0) {
    state.notch3MissionStreak += 1;
  } else {
    state.notch3MissionStreak = 0;
  }

  const rankIdx = RANK_ORDER.indexOf(profile.rank);
  if (state.notch3MissionStreak >= 2 && rankIdx < RANK_ORDER.length - 1) {
    promotedTo = RANK_ORDER[rankIdx + 1];
    state.notch3MissionStreak = 0;
    state.firstTryStreak = 0;
    notch = 1; // fresh rank starts gentle
  }

  await setAdaptiveState(profile.id, state);
  await updateProfile(profile.id, {
    difficultyNotch: notch,
    ...(promotedTo ? { rank: promotedTo } : {}),
  });

  return { newNotch: notch, promotedTo };
}

/** Stamps earned for a mission: 3 minus a stamp per glowing stage, min 1. */
export const stampsFor = (results: StageResult[]): number =>
  Math.max(1, 3 - results.filter((r) => r.glowed).length);
