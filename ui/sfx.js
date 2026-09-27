// Synthesised sound effects for the release reveal (Web Audio, no sound files). Every sound is
// short and soft-edged and goes through one master gain and a compressor, so stacked ticks never
// clip. The on/off choice and the volume are remembered per browser; the HUD's master mute
// (ui/sound.js) silences them without changing either.
import { browserStorage, readSetting, sound as soundSettings, writeSetting } from './sound.js';

const MUTE_KEY = 'ai-lab-sound-muted';
const VOLUME_KEY = 'ai-lab-sfx-volume';
const DEFAULT_VOLUME = 0.6;
const clamp01 = (value) => Math.min(1, Math.max(0, value));

export function createSfx({ storage = browserStorage(), sound = soundSettings } = {}) {
  let ctx = null;
  let master = null;
  let broken = false;
  let enabled = readSetting(storage, MUTE_KEY) !== '1';
  const savedVolume = Number.parseFloat(readSetting(storage, VOLUME_KEY));
  let volume = Number.isFinite(savedVolume) ? clamp01(savedVolume) : DEFAULT_VOLUME;
  const playing = new Set();

  // The audio context, or null when sound cannot play right now. A browser that refuses audio
  // (no Web Audio, a failed context, a context still waiting for a click) never breaks the caller,
  // and sounds are not queued up to burst out later.
  function ensure() {
    if (broken) return null;
    try {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Context) return null;
      if (!ctx) {
        ctx = new Context();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 4;
        master = ctx.createGain();
        master.gain.value = volume;
        master.connect(comp).connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx.state === 'running' ? ctx : null;
    } catch {
      broken = true;
      return null;
    }
  }

  function track(source) {
    playing.add(source);
    source.onended = () => playing.delete(source);
  }

  const silent = () => !enabled || sound.muted;

  function tone({ freq, type = 'sine', at = 0, dur = 0.12, gain = 0.25, attack = 0.004, slideTo = null, detune = 0 }) {
    if (silent()) return;
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + at;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.detune.value = detune;
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    track(osc);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  let noiseBuffer = null;
  function noise({ at = 0, dur = 0.2, gain = 0.2, from = 800, to = 4000, q = 1.2, type = 'bandpass' }) {
    if (silent()) return;
    const c = ensure();
    if (!c) return;
    if (!noiseBuffer) {
      noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(master);
    track(src);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  // A major pentatonic ladder: every step sounds "right", so a rising count never goes sour.
  const PENTA = [0, 2, 4, 7, 9];
  const ladder = (step, base = 523.25) => base * 2 ** ((PENTA[step % 5] + 12 * Math.floor(step / 5)) / 12);

  return {
    unlock() { ensure(); },
    get enabled() { return enabled; },
    set enabled(value) {
      enabled = value;
      writeSetting(storage, MUTE_KEY, value ? '0' : '1');
    },
    get volume() { return volume; },
    set volume(value) {
      volume = clamp01(Number(value));
      writeSetting(storage, VOLUME_KEY, volume);
      if (master) master.gain.value = volume;
    },
    // Stop every sound already scheduled (a skipped or closed show, or muting).
    hush() {
      for (const source of playing) {
        try {
          source.stop();
        } catch {
          // Already stopped.
        }
      }
      playing.clear();
    },
    // One count-up step; `step` climbs the pentatonic ladder so pitch tracks the number.
    tick(step = 0, { base = 523.25, gain = 0.08 } = {}) {
      tone({ freq: ladder(step, base), type: 'triangle', dur: 0.05, gain });
    },
    // Soft air under a growing bar.
    whoosh(dur = 0.6, gain = 0.05) { noise({ dur, gain, from: 400, to: 3200, q: 0.8 }); },
    // Passing a marker (the last flagship, a rival): a bright two-note ding.
    pass(pitch = 0) {
      const f = 1046.5 * 2 ** (pitch / 12);
      tone({ freq: f, type: 'sine', dur: 0.25, gain: 0.18 });
      tone({ freq: f * 1.5, type: 'sine', at: 0.07, dur: 0.35, gain: 0.16 });
    },
    // A verdict chip or score landing: a low thump with a click on top.
    stamp(gain = 0.5) {
      tone({ freq: 150, type: 'sine', dur: 0.18, gain, slideTo: 55 });
      noise({ dur: 0.05, gain: 0.12, from: 2500, to: 1500, q: 2 });
    },
    // Anticipation: a snare-like roll that speeds up, for the moment before a big number.
    roll(duration = 1.2) {
      let at = 0;
      let gap = 0.09;
      while (at < duration) {
        noise({ at, dur: 0.05, gain: 0.05 + 0.1 * (at / duration), from: 3000, to: 1800, q: 0.7, type: 'highpass' });
        at += gap;
        gap = Math.max(0.028, gap * 0.9);
      }
    },
    // A 9 or 10: a quick rising major arpeggio with a sparkle.
    sparkle(root = 784) {
      [0, 4, 7, 12].forEach((semi, i) => tone({ freq: root * 2 ** (semi / 12), type: 'triangle', at: i * 0.055, dur: 0.3, gain: 0.12 }));
      noise({ at: 0.18, dur: 0.35, gain: 0.03, from: 6000, to: 9000, q: 3 });
    },
    // The big win: a short brass-ish fanfare (detuned saws, major triad resolve).
    fanfare() {
      const notes = [[523.25, 0, 0.14], [659.25, 0.14, 0.14], [783.99, 0.28, 0.14], [1046.5, 0.42, 0.7]];
      for (const [f, at, dur] of notes) {
        tone({ freq: f, type: 'sawtooth', at, dur, gain: 0.07, detune: -6 });
        tone({ freq: f, type: 'sawtooth', at, dur, gain: 0.07, detune: 6 });
        tone({ freq: f / 2, type: 'triangle', at, dur, gain: 0.08 });
      }
      noise({ at: 0.42, dur: 0.8, gain: 0.03, from: 5000, to: 10000, q: 2 });
    },
    // Falling short: a soft minor step down, never a buzzer.
    miss() {
      tone({ freq: 392, type: 'triangle', dur: 0.2, gain: 0.12 });
      tone({ freq: 311.13, type: 'triangle', at: 0.16, dur: 0.35, gain: 0.12 });
    },
    // A new row or card entering, or a training bubble leaving a desk.
    pop(pitch = 0, gain = 0.12) { tone({ freq: 660 * 2 ** (pitch / 12), type: 'sine', dur: 0.09, gain, slideTo: 990 * 2 ** (pitch / 12) }); },
    // One rank climbed on a leaderboard.
    climb(rank = 0) {
      noise({ dur: 0.18, gain: 0.05, from: 900, to: 4000, q: 1 });
      tone({ freq: ladder(rank + 4, 392), type: 'triangle', at: 0.1, dur: 0.16, gain: 0.14 });
    },
  };
}

// One shared instance for the whole game (browsers cap how many audio contexts a page may open).
// Browsers only start audio after a click or key, so the first one anywhere unlocks it.
export const sfx = createSfx();
for (const type of ['pointerdown', 'keydown']) globalThis.addEventListener?.(type, () => sfx.unlock(), { capture: true, once: true });
