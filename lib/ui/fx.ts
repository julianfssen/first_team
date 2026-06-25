"use client";

/**
 * Sound + haptics, synthesised at runtime via the Web Audio API — no asset
 * files, works offline. Everything is a safe no-op on the server, when audio
 * isn't available, or when muted. One toggle gates both sound and vibration.
 */

let context: AudioContext | null = null;
let enabled: boolean | null = null;

function soundOn(): boolean {
  if (enabled === null) {
    enabled = true;
    try {
      if (typeof window !== "undefined") {
        enabled = window.localStorage.getItem("first-team:sound") !== "off";
      }
    } catch {
      /* ignore */
    }
  }
  return enabled;
}

export function isSoundOn(): boolean {
  return soundOn();
}

export function toggleSound(): boolean {
  enabled = !soundOn();
  try {
    window.localStorage.setItem("first-team:sound", enabled ? "on" : "off");
  } catch {
    /* ignore */
  }
  return enabled;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!context) {
    try {
      context = new AC();
    } catch {
      return null;
    }
  }
  if (context.state === "suspended") context.resume().catch(() => {});
  return context;
}

type ToneOpts = { type?: OscillatorType; gain?: number; slideTo?: number; delay?: number };

function tone(freq: number, dur: number, opts: ToneOpts = {}): void {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type ?? "sine";
  o.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.2, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, opts: { gain?: number; type?: BiquadFilterType; freq?: number } = {}): void {
  const c = ac();
  if (!c) return;
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = opts.type ?? "lowpass";
  f.frequency.value = opts.freq ?? 1000;
  const g = c.createGain();
  g.gain.setValueAtTime(opts.gain ?? 0.2, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start();
  src.stop(c.currentTime + dur + 0.02);
}

export const sfx = {
  /** Boot a thump + thwack on the strike. */
  kick() {
    if (!soundOn()) return;
    noise(0.05, { gain: 0.25, type: "lowpass", freq: 2000 });
    tone(150, 0.12, { type: "sine", gain: 0.28, slideTo: 60 });
  },
  /** A bright two-note + crowd swell. */
  goal() {
    if (!soundOn()) return;
    tone(523, 0.18, { type: "triangle", gain: 0.22 });
    tone(784, 0.26, { type: "triangle", gain: 0.2, delay: 0.08 });
    noise(0.6, { gain: 0.12, type: "bandpass", freq: 1100 });
  },
  /** A dull thud. */
  save() {
    if (!soundOn()) return;
    tone(120, 0.14, { type: "sine", gain: 0.22, slideTo: 70 });
    noise(0.05, { gain: 0.14, type: "lowpass", freq: 800 });
  },
  /** A glum downward tone. */
  concede() {
    if (!soundOn()) return;
    tone(220, 0.3, { type: "sawtooth", gain: 0.12, slideTo: 130 });
  },
  /** Referee whistle. */
  whistle() {
    if (!soundOn()) return;
    tone(2100, 0.18, { type: "square", gain: 0.1 });
  },
};

/** Vibrate (Android; no-op on iOS Safari / unsupported). Gated by the same toggle. */
export function haptic(pattern: number | number[]): void {
  if (!soundOn()) return;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore */
  }
}

export const haptics = {
  light: () => haptic(12),
  goal: () => haptic([0, 40, 30, 90]),
  save: () => haptic(30),
};
