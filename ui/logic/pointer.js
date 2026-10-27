// "tap" on a touch screen, "click" with a mouse (phone redesign, 2026-10-26), for lines that name the gesture.
// Read each time a line is built, so a line follows the device it shows on; `?layout=phone` counts as touch, as in ui/phone.js.
function touch() {
  const forced = new URLSearchParams(globalThis.location?.search ?? '').get('layout');
  if (forced) return forced === 'phone';
  return globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;
}

export const press = () => (touch() ? 'tap' : 'click');
export const Press = () => (touch() ? 'Tap' : 'Click');
