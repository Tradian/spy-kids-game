/**
 * Visual system: flat, friendly, chunky. Portrait only.
 * Minimum touch target 64pt — TOUCH_TARGET is the floor, not the goal.
 */

export const TOUCH_TARGET = 64;

export const colors = {
  // HQ night-ops palette: deep navy with warm gold accents.
  bgDeep: '#141B33',
  bgPanel: '#1E2A4A',
  bgRaised: '#2A3A63',
  outline: '#3D5087',

  gold: '#FFC94D',
  goldDeep: '#E8A013',

  mint: '#5DE0A1',
  coral: '#FF7B6B',
  sky: '#6BC5FF',
  lilac: '#B79CFF',

  textBright: '#FFFFFF',
  textSoft: '#AAB7DA',
  textOnGold: '#3A2A00',

  // Scroll Room: warmer, lamplit parchment tones.
  scrollBg: '#2E2338',
  scrollPanel: '#3D2F4A',
  parchment: '#F4E3BE',
  parchmentInk: '#4A3520',

  correctGlow: '#5DE0A1',
  wrongSoft: '#FF7B6B',
} as const;

export const radii = {
  tile: 20,
  panel: 28,
  pill: 999,
} as const;

export const type = {
  giant: 56,
  big: 34,
  title: 26,
  body: 18,
  small: 14,
} as const;

export const AVATARS = [
  { id: 'fox', emoji: '🦊', color: '#FF9A5C' },
  { id: 'owl', emoji: '🦉', color: '#B79CFF' },
  { id: 'panda', emoji: '🐼', color: '#6BC5FF' },
  { id: 'bunny', emoji: '🐰', color: '#FF8FB1' },
  { id: 'dino', emoji: '🦖', color: '#5DE0A1' },
  { id: 'cat', emoji: '🐱', color: '#FFC94D' },
] as const;
