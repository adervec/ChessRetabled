// Tiny synthesised sound effects — no audio files, no dependency, nothing to
// download. Every cue is a couple of short oscillator blips through one lazily
// created AudioContext, so the whole "sound pack" is this file.
// ponytail: synth over samples; swap in real assets only if the app ever wants
// recorded foley (that means shipping + caching audio in the service worker).

import { useSettings } from "./useSettings";

export type SfxName =
  | "ui"        // buttons, chips, links
  | "select"    // picking up a piece / selecting a cell
  | "move"      // a piece or card lands
  | "capture"   // something got taken
  | "deal"      // card dealt / flipped
  | "hint"      // 💡 nudge
  | "win"
  | "lose"
  | "draw";

type Voice = {
  /** [frequency, start offset (s)] pairs. */
  notes: [number, number][];
  dur: number;
  type: OscillatorType;
  gain: number;
};

const VOICES: Record<SfxName, Voice> = {
  ui:      { notes: [[660, 0]], dur: 0.05, type: "triangle", gain: 0.5 },
  select:  { notes: [[520, 0]], dur: 0.05, type: "sine", gain: 0.45 },
  move:    { notes: [[300, 0]], dur: 0.08, type: "triangle", gain: 0.9 },
  capture: { notes: [[260, 0], [150, 0.045]], dur: 0.1, type: "square", gain: 0.5 },
  deal:    { notes: [[900, 0]], dur: 0.045, type: "sine", gain: 0.5 },
  hint:    { notes: [[880, 0], [1175, 0.07]], dur: 0.09, type: "sine", gain: 0.5 },
  win:     { notes: [[523, 0], [659, 0.09], [784, 0.18], [1047, 0.27]], dur: 0.22, type: "triangle", gain: 0.8 },
  lose:    { notes: [[392, 0], [330, 0.12], [247, 0.24]], dur: 0.26, type: "triangle", gain: 0.7 },
  draw:    { notes: [[440, 0], [440, 0.14]], dur: 0.16, type: "triangle", gain: 0.6 },
};

/** Master trim so "volume 1" is pleasant rather than startling. */
const MASTER = 0.16;

let ctx: AudioContext | null = null;
const lastPlayed: Partial<Record<SfxName, number>> = {};

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // Browsers start the context suspended until a user gesture; a resume() from
  // inside any click unlocks it for the AI's replies later.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playSfx(name: SfxName): void {
  const { sound, volume } = useSettings.getState();
  if (!sound || volume <= 0) return;

  // Two identical cues in the same frame just crackle — keep the first.
  const now = Date.now();
  if (now - (lastPlayed[name] ?? 0) < 40) return;
  lastPlayed[name] = now;

  const ac = audio();
  if (!ac) return;
  const v = VOICES[name];
  const level = MASTER * volume * v.gain;

  for (const [freq, offset] of v.notes) {
    const at = ac.currentTime + offset;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = v.type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + v.dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(at);
    osc.stop(at + v.dur + 0.02);
  }
}

/**
 * One delegated listener gives every button, chip and link in the app a click
 * cue — no per-component wiring. Game surfaces (board cells, cards) are left
 * out on purpose: they have their own, more specific sounds.
 */
export function installUiSfx(): () => void {
  const onClick = (e: Event) => {
    const el = e.target as HTMLElement | null;
    if (el?.closest?.(".btn, .chip-btn, .theme-chip, .nav__link, .nav__menuitem, a[href]")) {
      playSfx("ui");
    }
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
