import { BadgeDef } from '../types';

export const BADGES: BadgeDef[] = [
  { id: 'b_first_mission', name: 'First Mission', emoji: '🥇', description: 'Completed a first mission.' },
  { id: 'b_three_missions', name: 'Triple Agent', emoji: '🎖️', description: 'Completed three missions.' },
  { id: 'b_all_recruit', name: 'Recruit Star', emoji: '⭐', description: 'Completed every Recruit mission.' },
  { id: 'b_sharp_ears', name: 'Sharp Ears', emoji: '👂', description: 'Cracked five sound locks on the first try.' },
  { id: 'b_first_scroll', name: 'Scroll Finder', emoji: '📜', description: 'Recovered a first scroll.' },
  { id: 'b_promotion', name: 'Promoted!', emoji: '🏅', description: 'Earned a promotion to a new rank.' },
  { id: 'b_daily_streak', name: 'Daily Agent', emoji: '📅', description: 'Completed a daily mission.' },
];

export const badgeById = (id: string): BadgeDef => {
  const b = BADGES.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown badge: ${id}`);
  return b;
};
