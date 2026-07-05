import { Gadget } from '../types';

/** Every gadget is tappable in the locker: a sound line + a wiggle. */
export const GADGETS: Gadget[] = [
  { id: 'g_flashlight', name: 'Night-Vision Flashlight', emoji: '🔦', tapLine: 'Click! Now you can see in the dark. Probably.' },
  { id: 'g_headset', name: 'Super-Ears Headset', emoji: '🎧', tapLine: 'Shhh... I can hear a snail sneezing three houses away.' },
  { id: 'g_magnet', name: 'Mega Magnet', emoji: '🧲', tapLine: 'Boing! Please keep away from the refrigerator door.' },
  { id: 'g_decoder', name: 'Decoder Wheel', emoji: '🛞', tapLine: 'Spin spin spin... every code fears the wheel.' },
  { id: 'g_idscanner', name: 'ID Scanner', emoji: '🪪', tapLine: 'Beep! Identity confirmed: one hundred percent awesome agent.' },
  { id: 'g_compass', name: 'Pattern Compass', emoji: '🧭', tapLine: 'The needle points to... snack time. Every time.' },
  { id: 'g_radio', name: 'Whisper Radio', emoji: '📻', tapLine: 'Krrrrshh... this is headquarters... you are doing great... krrrshh.' },
  { id: 'g_glasses', name: 'X-Ray Spy Glasses', emoji: '🕶️', tapLine: 'Whoa. I can see... exactly what I saw before, but cooler.' },
  { id: 'g_lantern', name: 'Library Lantern', emoji: '🏮', tapLine: 'A warm little light for reading very old scrolls.' },
  { id: 'g_scrollcase', name: 'Golden Scroll Case', emoji: '📜', tapLine: 'The safest place in the world for the greatest words.' },
  { id: 'g_candle', name: 'Everbright Candle', emoji: '🕯️', tapLine: 'This one never blows out. Not even on birthdays.' },
];

export const gadgetById = (id: string): Gadget => {
  const g = GADGETS.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown gadget: ${id}`);
  return g;
};
