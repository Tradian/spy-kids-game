import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { GENERIC_LINE_KEYS } from '../content/lines';

/**
 * All Spymaster audio ships as bundled mp3s from the AI voiceover pipeline
 * (spec section 6). Until that batch is generated, every line falls back to
 * device text-to-speech so the game is fully playable today.
 *
 * To wire real assets: add entries to VOICE_ASSETS keyed by the line's
 * audio key, e.g.  briefing_m_jam_jar: require('../../assets/vo/briefing_m_jam_jar.mp3')
 * The keys are enumerated in docs/voiceover-script.md.
 */
const VOICE_ASSETS: Record<string, number> = {
  // populated by the voiceover batch — intentionally empty for now
};

let currentPlayer: AudioPlayer | null = null;
let audioModeReady = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  audioModeReady = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // non-fatal: TTS still works
  }
}

export function stopSpeaking(): void {
  Speech.stop();
  if (currentPlayer) {
    try {
      currentPlayer.pause();
      currentPlayer.remove();
    } catch {
      // player may already be released
    }
    currentPlayer = null;
  }
}

/**
 * Speak a Spymaster line. Plays the bundled asset when the batch has
 * landed; otherwise falls back to TTS (slow and warm for small ears).
 */
export async function say(line: string, audioKey?: string): Promise<void> {
  await ensureAudioMode();
  stopSpeaking();

  const key = audioKey ?? GENERIC_LINE_KEYS[line];
  if (key && VOICE_ASSETS[key] !== undefined) {
    currentPlayer = createAudioPlayer(VOICE_ASSETS[key]);
    currentPlayer.play();
    return;
  }

  Speech.speak(line, { rate: 0.92, pitch: 1.0 });
}

/** Play a parent-recorded message (or any local file) by uri. */
export async function playFile(uri: string): Promise<void> {
  await ensureAudioMode();
  stopSpeaking();
  currentPlayer = createAudioPlayer({ uri });
  currentPlayer.play();
}
