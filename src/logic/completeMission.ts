import { Mission, Profile, Rank, StageResult } from '../types';
import {
  awardBadge,
  countCompletedMissions,
  earnGadget,
  getProgressForProfile,
  recordMissionComplete,
} from '../db/repo';
import { missionsFor } from '../content/missions';
import { applyMissionResults, stampsFor } from './adaptive';

export interface MissionOutcome {
  stamps: number;
  promotedTo: Rank | null;
  newBadgeIds: string[];
}

/**
 * Everything that happens when the vault opens: progress row, gadget,
 * adaptive notch/rank movement, badge milestones. Called exactly once per
 * mission run (from the Unlock screen).
 */
export async function completeMission(
  profile: Profile,
  mission: Mission,
  results: StageResult[],
): Promise<MissionOutcome> {
  const stamps = stampsFor(results);
  const glows = results.filter((r) => r.glowed).length;

  await recordMissionComplete(profile.id, mission.id, stamps, glows);
  await earnGadget(profile.id, mission.gadgetRewardId);

  const adaptive = await applyMissionResults(profile, results);

  const newBadgeIds: string[] = [];
  const maybe = async (badgeId: string, condition: boolean) => {
    if (condition && (await awardBadge(profile.id, badgeId))) newBadgeIds.push(badgeId);
  };

  const totalDone = await countCompletedMissions(profile.id);
  await maybe('b_first_mission', totalDone >= 1);
  await maybe('b_three_missions', totalDone >= 3);
  await maybe('b_first_scroll', mission.track === 'scroll');
  await maybe('b_daily_streak', mission.id.startsWith('daily_'));
  await maybe('b_promotion', adaptive.promotedTo !== null);
  await maybe(
    'b_sharp_ears',
    mission.id === 'm_squeaky_door' && results.every((r) => r.firstTry),
  );

  // Recruit Star: every core recruit mission completed.
  const coreRecruit = missionsFor('recruit', 'core').map((m) => m.id);
  const progress = await getProgressForProfile(profile.id);
  const doneIds = new Set(progress.filter((p) => p.status === 'completed').map((p) => p.missionId));
  doneIds.add(mission.id);
  await maybe('b_all_recruit', coreRecruit.every((id) => doneIds.has(id)));

  return { stamps, promotedTo: adaptive.promotedTo, newBadgeIds };
}
