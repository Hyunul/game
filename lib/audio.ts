// lib/audio.ts — Web Audio synthesis engine for 기억의 상자
// No external audio files; SSR-safe (no-op when window is undefined).

export type Sfx = 'click' | 'pickup' | 'correct' | 'wrong' | 'door' | 'shard';

// ── Module state ──────────────────────────────────────────────────────────────
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let muted = false;

let bgmRoom: string | null = null;
let bgmTimer: ReturnType<typeof setInterval> | null = null;
let bgmNotes: { freq: number; dur: number }[] = [];
let bgmIdx = 0;
let bgmNextTime = 0;
const BGM_BPM = 72;
const BEAT_SEC = 60 / BGM_BPM;

// ── Init ──────────────────────────────────────────────────────────────────────
export function initAudio(): void {
  if (typeof window === 'undefined') return;
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  ctx = new AudioContext();
  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : 1;
  masterGain.connect(ctx.destination);

  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.08;
  bgmGain.connect(masterGain);
}

// ── Mute ──────────────────────────────────────────────────────────────────────
export function setMuted(m: boolean): void {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 1;
}

export function isMuted(): boolean {
  return muted;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function osc(
  type: OscillatorType,
  freq: number,
  startTime: number,
  gainPeak: number,
  decayDur: number,
  destination: AudioNode,
): void {
  if (!ctx) return;
  const g = ctx.createGain();
  g.connect(destination);
  g.gain.setValueAtTime(gainPeak, startTime);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + decayDur);

  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, startTime);
  o.connect(g);
  o.start(startTime);
  o.stop(startTime + decayDur + 0.01);
}

// ── SFX ───────────────────────────────────────────────────────────────────────
export function playSfx(name: Sfx): void {
  if (typeof window === 'undefined' || !ctx || !masterGain) return;
  const now = ctx.currentTime;

  switch (name) {
    case 'click':
      osc('sine', 880, now, 0.4, 0.05, masterGain);
      break;

    case 'correct':
      osc('sine', 1318, now, 0.35, 0.3, masterGain);
      osc('sine', 1568, now + 0.03, 0.3, 0.3, masterGain);
      break;

    case 'wrong':
      osc('sawtooth', 150, now, 0.4, 0.2, masterGain);
      break;

    case 'pickup': {
      const g = ctx.createGain();
      g.connect(masterGain);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(400, now);
      o.frequency.linearRampToValueAtTime(900, now + 0.2);
      o.connect(g);
      o.start(now);
      o.stop(now + 0.22);
      break;
    }

    case 'shard':
      // C5=523 E5=659 G5=784
      osc('sine', 523, now, 0.25, 2.0, masterGain);
      osc('sine', 659, now + 0.02, 0.2, 2.0, masterGain);
      osc('sine', 784, now + 0.04, 0.18, 2.0, masterGain);
      break;

    case 'door': {
      // Low thump: 80Hz triangle fast decay
      osc('triangle', 80, now, 0.5, 0.15, masterGain);
      // Tiny noise feel via detuned sines
      osc('sine', 75, now, 0.2, 0.08, masterGain);
      osc('sine', 85, now, 0.15, 0.06, masterGain);
      break;
    }
  }
}

// ── playNote (organ key) ──────────────────────────────────────────────────────
export function playNote(freq: number, dur = 0.4): void {
  if (typeof window === 'undefined' || !ctx || !masterGain) return;
  const now = ctx.currentTime;
  osc('sine', freq, now, 0.4, dur, masterGain);
  osc('sine', freq * 2, now, 0.08, dur, masterGain); // soft overtone
}

// ── BGM melodies ──────────────────────────────────────────────────────────────
// freq=0 → rest; dur in beats
const MELODIES: Record<string, { freq: number; dur: number }[]> = {
  attic: [
    // Slow C major arpeggio, dreamy
    { freq: 261.63, dur: 1.5 }, // C4
    { freq: 329.63, dur: 1.5 }, // E4
    { freq: 392.0,  dur: 1.5 }, // G4
    { freq: 523.25, dur: 2.0 }, // C5
    { freq: 392.0,  dur: 1.5 }, // G4
    { freq: 329.63, dur: 1.5 }, // E4
    { freq: 261.63, dur: 2.0 }, // C4
    { freq: 0,      dur: 1.0 }, // rest
  ],

  home: [
    // 섬집아기-inspired minor-tinged lullaby (A minor feel)
    { freq: 440.0,  dur: 1.0 }, // A4
    { freq: 392.0,  dur: 1.0 }, // G4
    { freq: 349.23, dur: 2.0 }, // F4
    { freq: 329.63, dur: 1.0 }, // E4
    { freq: 293.66, dur: 1.0 }, // D4
    { freq: 261.63, dur: 2.0 }, // C4
    { freq: 293.66, dur: 1.0 }, // D4
    { freq: 329.63, dur: 1.0 }, // E4
    { freq: 349.23, dur: 2.0 }, // F4
    { freq: 440.0,  dur: 1.0 }, // A4
    { freq: 392.0,  dur: 3.0 }, // G4
    { freq: 0,      dur: 1.0 }, // rest
  ],

  class: [
    // 학교종 variation (솔솔라라솔솔미...)
    { freq: 392.0,  dur: 1.0 }, // G4
    { freq: 392.0,  dur: 1.0 }, // G4
    { freq: 440.0,  dur: 1.0 }, // A4
    { freq: 440.0,  dur: 1.0 }, // A4
    { freq: 392.0,  dur: 1.0 }, // G4
    { freq: 392.0,  dur: 1.0 }, // G4
    { freq: 329.63, dur: 2.0 }, // E4
    { freq: 392.0,  dur: 1.0 }, // G4
    { freq: 392.0,  dur: 1.0 }, // G4
    { freq: 329.63, dur: 1.0 }, // E4
    { freq: 329.63, dur: 1.0 }, // E4
    { freq: 293.66, dur: 2.0 }, // D4
    { freq: 0,      dur: 1.0 }, // rest
  ],

  store: [
    // Light pentatonic (C D E G A)
    { freq: 523.25, dur: 0.5 }, // C5
    { freq: 587.33, dur: 0.5 }, // D5
    { freq: 659.25, dur: 1.0 }, // E5
    { freq: 783.99, dur: 0.5 }, // G5
    { freq: 659.25, dur: 0.5 }, // E5
    { freq: 587.33, dur: 1.0 }, // D5
    { freq: 523.25, dur: 0.5 }, // C5
    { freq: 440.0,  dur: 0.5 }, // A4
    { freq: 523.25, dur: 1.0 }, // C5
    { freq: 659.25, dur: 0.5 }, // E5
    { freq: 783.99, dur: 0.5 }, // G5
    { freq: 880.0,  dur: 1.5 }, // A5
    { freq: 0,      dur: 0.5 }, // rest
  ],
};

function scheduleBgm(): void {
  if (!ctx || !bgmGain || bgmNotes.length === 0) return;
  const lookAhead = 0.3;
  while (bgmNextTime < ctx.currentTime + lookAhead) {
    const { freq, dur } = bgmNotes[bgmIdx % bgmNotes.length];
    const durSec = dur * BEAT_SEC;
    if (freq > 0) {
      osc('sine', freq, bgmNextTime, 0.5, durSec * 0.9, bgmGain);
      osc('sine', freq * 2, bgmNextTime, 0.08, durSec * 0.9, bgmGain); // overtone
    }
    bgmNextTime += durSec;
    bgmIdx++;
  }
}

export function playBgm(room: 'attic' | 'home' | 'class' | 'store'): void {
  if (typeof window === 'undefined' || !ctx) return;
  if (bgmRoom === room) return;
  stopBgm();
  bgmRoom = room;
  bgmNotes = MELODIES[room] ?? [];
  bgmIdx = 0;
  bgmNextTime = ctx.currentTime + 0.1;
  scheduleBgm();
  bgmTimer = setInterval(scheduleBgm, 100);
}

export function stopBgm(): void {
  if (bgmTimer !== null) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
  bgmRoom = null;
  bgmNotes = [];
}
