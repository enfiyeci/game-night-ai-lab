// The master mute behind the HUD's speaker button: silences music and sound effects together
// without touching either one's own on/off and volume. Remembered per browser.
const MUTE_KEY = 'ai-lab-all-muted';

export const browserStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // storage blocked (private window): settings last for this page only
  }
};

export function readSetting(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeSetting(storage, key, value) {
  try {
    storage?.setItem(key, String(value));
  } catch {
    // Storage can be blocked; the choice then lasts for this page only.
  }
}

export function createSoundSettings(storage = browserStorage()) {
  let muted = readSetting(storage, MUTE_KEY) === '1';
  const listeners = new Set();
  return {
    get muted() { return muted; },
    set muted(value) {
      muted = Boolean(value);
      writeSetting(storage, MUTE_KEY, muted ? '1' : '0');
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const sound = createSoundSettings();
