// Background music (owner picks 2026-09-26, sources and licences in ui/assets/music/README.md).
// One track at a time, shuffled without an immediate repeat, at a low volume. Browsers block audio
// until the player clicks, so it starts on the first click or key. The release show ducks it, and an
// ending film holds it (films have their own sound). The HUD's master mute silences it too. The title
// screen (branch title-music) loops its own track through playTitle() and hands over with startGame().
import { browserStorage, readSetting, sound as soundSettings, writeSetting } from './sound.js';

// city-of-tomorrow-loop.mp3 is a looping cut of City of Tomorrow: it plays on the title screen and
// stays out of the shuffle.
export const TITLE_TRACK = { file: 'city-of-tomorrow-loop.mp3', title: 'City of Tomorrow', artist: 'Eric Matyas', licence: 'soundimage.org' };
export const TRACKS = [
  { file: 'wallpaper.mp3', title: 'Wallpaper', artist: 'Kevin MacLeod', licence: 'CC BY 4.0' },
  { file: 'bossa-antigua.mp3', title: 'Bossa Antigua', artist: 'Kevin MacLeod', licence: 'CC BY 4.0' },
  { file: 'city-of-tomorrow.mp3', title: 'City of Tomorrow', artist: 'Eric Matyas', licence: 'soundimage.org' },
  { file: 'corporate-ladder.mp3', title: 'Corporate Ladder', artist: 'Eric Matyas', licence: 'soundimage.org' },
  { file: 'network.mp3', title: 'Network', artist: 'Eric Matyas', licence: 'soundimage.org' },
  { file: 'technoscape.mp3', title: 'Technoscape', artist: 'Eric Matyas', licence: 'soundimage.org' },
  { file: 'future-business.mp3', title: 'Future Business', artist: 'Eric Matyas', licence: 'soundimage.org' },
];

const ON_KEY = 'ai-lab-music-on';
const VOLUME_KEY = 'ai-lab-music-volume';
const DEFAULT_VOLUME = 0.35;
const DUCKED = 0.3; // share of the volume left while the release show plays
const clamp01 = (value) => Math.min(1, Math.max(0, value));

// Any track but the last one played.
export function pickNext(count, last, random = Math.random) {
  if (count <= 1) return 0;
  const pick = Math.floor(random() * (count - (last == null ? 0 : 1)));
  return last != null && pick >= last ? pick + 1 : pick;
}

export function createMusic({
  tracks = TRACKS,
  storage = browserStorage(),
  sound = soundSettings,
  makeAudio = (src) => (globalThis.Audio ? new globalThis.Audio(src) : null),
  random = Math.random,
  base = 'ui/assets/music/',
} = {}) {
  const savedVolume = Number.parseFloat(readSetting(storage, VOLUME_KEY));
  let enabled = readSetting(storage, ON_KEY) !== '0';
  let volume = Number.isFinite(savedVolume) ? clamp01(savedVolume) : DEFAULT_VOLUME;
  let started = false;
  let ducked = false;
  let index = null;
  let mode = 'game'; // 'title' loops TITLE_TRACK; 'game' shuffles TRACKS
  let audio = null;
  const holds = new Set();
  const listeners = new Set();
  const notify = () => { for (const listener of listeners) listener(); };

  const audible = () => started && enabled && !sound.muted && holds.size === 0;

  function apply() {
    if (!audio) return;
    audio.volume = volume * (ducked ? DUCKED : 1);
    if (audible()) {
      if (audio.paused) audio.play()?.catch?.(() => {});
    } else if (!audio.paused) audio.pause();
  }

  function swap(src) {
    if (audio) {
      audio.pause();
      audio.removeAttribute?.('src'); // let the browser drop the old file
      audio.load?.();
    }
    audio = src ? makeAudio(src) : null;
  }

  function load(next) {
    index = next;
    swap(`${base}${tracks[index].file}`);
    audio?.addEventListener?.('ended', () => load(pickNext(tracks.length, index, random)));
    apply();
    notify();
  }

  function loadTitle() {
    index = null;
    swap(`${base}${TITLE_TRACK.file}`);
    if (audio) audio.loop = true;
    apply();
    notify();
  }

  const loadMode = () => (mode === 'title' ? loadTitle() : load(pickNext(tracks.length, null, random)));
  const stopListening = sound.subscribe?.(apply) ?? (() => {});

  return {
    // Every click or key: the first one picks a track; later ones retry a play the browser refused
    // (a play started outside a click, or a first key that did not count as one).
    start() {
      if (started) {
        apply();
        return;
      }
      started = true;
      loadMode();
    },
    // The title screen: loop the title track (from the first click, if it has not come yet).
    playTitle() {
      if (mode === 'title') return;
      mode = 'title';
      if (started) loadTitle();
    },
    // The run begins: switch to the shuffle. Safe to call twice, and without playTitle() first.
    startGame() {
      if (mode === 'game') return;
      mode = 'game';
      if (started) load(pickNext(tracks.length, null, random));
    },
    get enabled() { return enabled; },
    set enabled(value) {
      enabled = Boolean(value);
      writeSetting(storage, ON_KEY, enabled ? '1' : '0');
      apply();
      notify();
    },
    get volume() { return volume; },
    set volume(value) {
      volume = clamp01(Number(value));
      writeSetting(storage, VOLUME_KEY, volume);
      apply();
      notify();
    },
    get current() {
      if (!started) return null;
      return mode === 'title' ? TITLE_TRACK : tracks[index];
    },
    duck(on) {
      ducked = Boolean(on);
      apply();
    },
    // Pause while anything holds the music (an ending film); plays again once every hold is released.
    hold(reason) {
      holds.add(reason);
      apply();
    },
    release(reason) {
      holds.delete(reason);
      apply();
    },
    skip() {
      if (started && mode === 'game') load(pickNext(tracks.length, index, random));
    },
    dispose() {
      stopListening();
      swap(null);
      audio = null;
      listeners.clear();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// One player for the whole game, started by the first click or key anywhere.
export const music = createMusic();
for (const type of ['pointerdown', 'keydown']) globalThis.addEventListener?.(type, () => music.start(), { capture: true });
