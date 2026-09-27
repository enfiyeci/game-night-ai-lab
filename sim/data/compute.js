// Compute gathering tables. Spec: docs/superpowers/specs/2026-09-25-compute-gathering-design.md.
// First-pass numbers; plan 2C Task 8 tunes them.
export const ERA_SCALE = [1, 3, 8, 30, 80];
export const eraScale = (era) => ERA_SCALE[era - 1];
export const MW_PER_UNIT = 1.7; // about 600 units per gigawatt

export const SPOT_PRICE = { 1: 4.0, 2: 4.0, 3: 4.0, 4: 4.0, 5: 4.0 }; // × base unit price
export const RESALE = { 1: 0.7, 2: 0.7, 3: 0.6, 4: 0.5, 5: 0.5 };    // share of base price recovered for idle units
export const FRAGILE_MONTHLY = 0.02;  // CoreFlame trouble chance per month
export const BUMP_CHANCE = { 3: 0.25, 5: 0.25 }; // spot pulled next turn, per turn, in the tight eras
export const GULF_OPEN = 60;   // US favor needed to sign or restore the Gulf license
export const GULF_REVOKE = 50; // below this the license is revoked
export const EQUITY_SHARE = 0.08;
export const SCALE_DOWN = 0.3;
export const SCALE_DOWN_PENALTY_MONTHS = 2;
export const BREAK_SHARE = 0.25;
export const BUYOUT_MONTHS = 3;
export const RESCUE_MONTHS = 3;
// Raising from the strategic cloud partner locks you in: every other cloud's offer costs this much more from then
// on (owner pick 2026-09-26, "expects favours" made real). Verde chip orders and Azuria are not rival clouds.
export const PARTNER_MARKUP = 1.25;
export const RIVAL_CLOUDS = ['coreflame', 'spot', 'gulf'];
export const partnerMarkup = (state, supplier) => (state.flags.strategicStrings && RIVAL_CLOUDS.includes(supplier) ? PARTNER_MARKUP : 1);
export const spotPrice = (state, era = state.era) => SPOT_PRICE[era] * partnerMarkup(state, 'spot');

// size [lo, hi] is multiplied by eraScale(era); arrival is in turns (an object when it differs by era).
export const SUPPLIERS = {
  verde: { name: 'Verde', kind: 'Chip order', size: [30, 40], arrival: { 1: 3, 2: 3, 4: 2 }, upfrontShare: 0.142, price: 0.85, termMonths: 24, string: null, eras: [1, 2, 4] },
  azuria: { name: 'Azuria', kind: 'Cloud', size: [8, 15], arrival: 1, upfrontShare: 0, price: 2.0, termMonths: 24, string: 'exclusive', eras: [1, 2, 3, 4] },
  coreflame: { name: 'CoreFlame', kind: 'Neocloud', size: [8, 12], arrival: 1, upfrontShare: 0, price: 0.75, termMonths: 12, string: 'fragile', eras: [1, 2, 3, 4, 5] },
  spot: { name: 'Spot market', kind: 'Rent now', size: [2, 5], arrival: 0, upfrontShare: 0, price: null, termMonths: null, string: 'bumpable', eras: [1, 2, 3, 4, 5] },
  azuriaEquity: { name: 'Azuria', kind: 'Investment', size: null, arrival: 1, upfrontShare: 0, price: 1.0, termMonths: 24, string: 'moneyBack', eras: [2, 3, 4] },
  gulf: { name: 'Gulf campus', kind: 'Sovereign', size: [10, 30], arrival: 2, upfrontShare: 0.1, price: 1.0, termMonths: 36, string: 'usGated', eras: [3, 4] },
  loi: { name: 'Verde', kind: 'Letter of intent', size: [20, 20], arrival: 2, upfrontShare: 0.05, price: 1.0, termMonths: 24, string: 'shrinks', eras: [4] },
  grid: { name: 'Grid connection', kind: 'Power reservation', size: null, arrival: null, upfrontShare: 0, price: null, termMonths: null, string: 'gridReservation', eras: [2, 3] },
};
