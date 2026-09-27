import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TITLE_TRACK, TRACKS, createMusic, pickNext } from '../ui/music.js';
import { createSoundSettings } from '../ui/sound.js';
import { createSfx } from '../ui/sfx.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    values,
  };
}

// A stand-in for HTMLAudioElement: records what the music asked of it.
function fakeAudioFactory() {
  const made = [];
  const make = (src) => {
    const audio = {
      src,
      volume: 1,
      paused: true,
      listeners: {},
      play() { this.paused = false; return Promise.resolve(); },
      pause() { this.paused = true; },
      addEventListener(type, fn) { this.listeners[type] = fn; },
      removeAttribute() {},
      load() {},
    };
    made.push(audio);
    return audio;
  };
  return { make, made, get last() { return made.at(-1); } };
}

const setup = ({ storage = memoryStorage(), sound = createSoundSettings(memoryStorage()), random = () => 0 } = {}) => {
  const audio = fakeAudioFactory();
  const music = createMusic({ storage, sound, makeAudio: audio.make, random });
  return { music, audio, storage, sound };
};

test('the track list holds the owner-picked tracks with their credit lines', () => {
  assert.equal(TRACKS.length, 7);
  for (const track of TRACKS) {
    assert.match(track.file, /^[a-z-]+\.mp3$/);
    assert.ok(track.title && track.artist && track.licence, track.file);
  }
  assert.ok(TRACKS.some((track) => track.title === 'Bossa Antigua' && track.artist === 'Kevin MacLeod'));
});

test('the shuffle never plays the same track twice in a row and reaches every track', () => {
  let last = null;
  const seen = new Set();
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 400; i += 1) {
    const next = pickNext(TRACKS.length, last, random);
    assert.notEqual(next, last);
    assert.ok(next >= 0 && next < TRACKS.length);
    seen.add(next);
    last = next;
  }
  assert.equal(seen.size, TRACKS.length);
});

test('nothing loads before the first click, and start is safe to call twice', () => {
  const { music, audio } = setup();
  assert.equal(audio.made.length, 0);
  music.start();
  music.start();
  assert.equal(audio.made.length, 1);
  assert.equal(audio.last.paused, false);
  assert.match(audio.last.src, /^ui\/assets\/music\/[a-z-]+\.mp3$/);
});

test('music plays low by default and remembers the player’s settings', () => {
  const storage = memoryStorage();
  const { music, audio } = setup({ storage });
  assert.equal(music.enabled, true);
  assert.equal(music.volume, 0.35);
  music.start();
  assert.equal(audio.last.volume, 0.35);

  music.volume = 0.8;
  music.enabled = false;
  assert.equal(audio.last.paused, true);
  const again = setup({ storage }).music;
  assert.equal(again.volume, 0.8);
  assert.equal(again.enabled, false);
});

test('volume is clamped to 0-1 and a bad saved value falls back to the default', () => {
  const { music } = setup({ storage: memoryStorage({ 'ai-lab-music-volume': 'loud' }) });
  assert.equal(music.volume, 0.35);
  music.volume = 3;
  assert.equal(music.volume, 1);
  music.volume = -1;
  assert.equal(music.volume, 0);
});

test('the release show ducks the music and lets it back up afterwards', () => {
  const { music, audio } = setup();
  music.start();
  music.duck(true);
  assert.ok(Math.abs(audio.last.volume - 0.35 * 0.3) < 1e-9);
  assert.equal(audio.last.paused, false);
  music.duck(false);
  assert.equal(audio.last.volume, 0.35);
});

test('an ending film pauses the music until every hold is released', () => {
  const { music, audio } = setup();
  music.start();
  music.hold('film');
  assert.equal(audio.last.paused, true);
  music.hold('other');
  music.release('film');
  assert.equal(audio.last.paused, true);
  music.release('other');
  assert.equal(audio.last.paused, false);
});

test('a hold before the first click keeps the music from starting', () => {
  const { music, audio } = setup();
  music.hold('film');
  music.start();
  assert.equal(audio.made.length, 1);
  assert.equal(audio.last.paused, true);
});

test('the master mute silences the music without changing its own settings', () => {
  const sound = createSoundSettings(memoryStorage());
  const { music, audio } = setup({ sound });
  music.start();
  sound.muted = true;
  assert.equal(audio.last.paused, true);
  assert.equal(music.enabled, true);
  sound.muted = false;
  assert.equal(audio.last.paused, false);
});

test('when a track ends the next one starts, and skip moves on at once', () => {
  let n = 0;
  const { music, audio } = setup({ random: () => [0, 0.5, 0.9][n++ % 3] });
  music.start();
  const first = music.current;
  audio.last.listeners.ended();
  assert.equal(audio.made.length, 2);
  assert.notEqual(music.current, first);
  const second = music.current;
  music.skip();
  assert.equal(audio.made.length, 3);
  assert.notEqual(music.current, second);
  assert.equal(audio.made[1].paused, true);
});

test('listeners hear about track and setting changes', () => {
  const { music } = setup();
  let calls = 0;
  const stop = music.subscribe(() => { calls += 1; });
  music.start();
  music.volume = 0.5;
  stop();
  music.enabled = false;
  assert.equal(calls, 2);
});

test('a browser without audio never breaks the game', () => {
  const music = createMusic({ storage: memoryStorage(), sound: createSoundSettings(memoryStorage()), makeAudio: () => null });
  assert.doesNotThrow(() => {
    music.start();
    music.duck(true);
    music.hold('film');
    music.release('film');
    music.skip();
  });
});

test('the master mute is remembered and announced', () => {
  const storage = memoryStorage();
  const sound = createSoundSettings(storage);
  let heard = null;
  sound.subscribe(() => { heard = sound.muted; });
  sound.muted = true;
  assert.equal(heard, true);
  assert.equal(createSoundSettings(storage).muted, true);
});

test('sound effects keep their own remembered volume', () => {
  const storage = memoryStorage();
  const sfx = createSfx({ storage, sound: createSoundSettings(memoryStorage()) });
  assert.equal(sfx.volume, 0.6);
  sfx.volume = 0.25;
  assert.equal(createSfx({ storage, sound: createSoundSettings(memoryStorage()) }).volume, 0.25);
  sfx.volume = 9;
  assert.equal(sfx.volume, 1);
});

test('a play the browser refused is retried on the next click or key', () => {
  const { music, audio } = setup();
  music.start();
  audio.last.paused = true; // the browser refused the first play()
  music.start();
  assert.equal(audio.last.paused, false);
  assert.equal(audio.made.length, 1);
});

test('the title screen loops its own track, then the run switches to the shuffle', () => {
  const { music, audio } = setup();
  music.playTitle();
  assert.equal(audio.made.length, 0);
  music.start();
  assert.equal(audio.last.src, `ui/assets/music/${TITLE_TRACK.file}`);
  assert.equal(audio.last.loop, true);
  assert.equal(music.current, TITLE_TRACK);
  music.skip();
  assert.equal(audio.made.length, 1);
  music.startGame();
  music.startGame();
  assert.equal(audio.made.length, 2);
  assert.ok(TRACKS.includes(music.current));
  assert.equal(audio.made[0].paused, true);
});

test('startGame before the first click leaves the shuffle to start()', () => {
  const { music, audio } = setup();
  music.playTitle();
  music.startGame();
  music.start();
  assert.equal(audio.made.length, 1);
  assert.ok(TRACKS.includes(music.current));
});

test('a disposed player stops and no longer follows the master mute', () => {
  const sound = createSoundSettings(memoryStorage());
  const { music, audio } = setup({ sound });
  music.start();
  const element = audio.last;
  music.dispose();
  assert.equal(element.paused, true);
  sound.muted = true;
  sound.muted = false;
  assert.equal(element.paused, true);
});
