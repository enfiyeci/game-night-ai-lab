// Injected by the iOS shell at document start, before the game's modules run (ios/App/GameWebView.swift).
// Never part of the web build. It does three things:
// 1. Restores localStorage from the app's own copy (ios/App/SaveStore.swift) wherever the two differ.
// 2. Mirrors every localStorage write back to that copy.
// 3. Applies the Duo layout the shell sends: data-native-posture and --native-fold-* on <html>, and a
//    native-layout event (contract: the gn-ios-shell viewport note, summarized in ios/README.md). The fold
//    values are CSS pixels before any zoom the page puts on <html>.
(() => {
  const saved = /*SAVED_ITEMS*/{};
  const post = (message) => {
    try { webkit.messageHandlers.gameNightStorage.postMessage(message); } catch { /* not in the app */ }
  };

  // WebKit picks the audio session for the page's own <audio> and <video> (the music and the ending films);
  // ambient lets the player's own audio keep playing and follows the silent switch, like the app's session.
  if (navigator.audioSession) navigator.audioSession.type = 'ambient';

  const root = document.documentElement;
  root.dataset.native = 'ios';
  root.dataset.nativePosture = 'none';

  let storage = null;
  try { storage = globalThis.localStorage; } catch { /* storage blocked */ }
  if (storage) {
    // The app's copy is the authority: it is written at once, in order, on every change, while WebKit
    // writes its storage to disk later and can lose the last writes in a crash. (setItem is not patched
    // yet, so restoring sends nothing back.)
    for (const [key, value] of Object.entries(saved)) {
      try { if (storage.getItem(key) !== value) storage.setItem(key, value); } catch { /* full */ }
    }
    const items = {};
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key !== null) items[key] = storage.getItem(key);
    }
    post({ type: 'snapshot', items });

    const proto = Storage.prototype;
    const { setItem, removeItem, clear } = proto;
    proto.setItem = function (key, value) {
      setItem.call(this, key, value); // throws when full, and then nothing is mirrored
      if (this === storage) post({ type: 'set', key: String(key), value: String(value) });
    };
    proto.removeItem = function (key) {
      removeItem.call(this, key);
      if (this === storage) post({ type: 'remove', key: String(key) });
    };
    proto.clear = function () {
      clear.call(this);
      if (this === storage) post({ type: 'clear' });
    };
  }

  // A game should not show text loupes or link previews on long presses, or zoom on a double tap.
  const style = document.createElement('style');
  style.textContent = 'html { touch-action: manipulation; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; -webkit-text-size-adjust: 100%; }'
    + ' input, textarea, [contenteditable] { -webkit-user-select: auto; user-select: auto; }';
  root.append(style);

  const px = (value) => `${Math.round(value ?? 0)}px`;
  globalThis.__gameNightShell = {
    background: false,
    layout: null,
    applyLayout(detail) {
      this.layout = detail;
      root.dataset.nativePosture = detail.posture;
      const fold = detail.fold;
      root.style.setProperty('--native-fold-x', px(fold?.x));
      root.style.setProperty('--native-fold-y', px(fold?.y));
      root.style.setProperty('--native-fold-width', px(fold?.width));
      root.style.setProperty('--native-fold-height', px(fold?.height));
      dispatchEvent(new CustomEvent('native-layout', { detail }));
    },
  };
})();
