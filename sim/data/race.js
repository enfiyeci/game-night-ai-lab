// Compute race tables. Spec: docs/superpowers/specs/2026-09-26-compute-race-design.md §2.
// First-pass numbers from the prototype (docs/design/mockups/compute-race/prototype/); plan Task 8 re-measures them.
export const FRONTIER = [25, 50, 150, 400, 450]; // units a frontier-pace lab wants online, per era
export const START_FLEET = { openbrain: 14, lodestar: 10, deepthink: 12, qilin: 11 };
export const RIVAL_EDGE = -2; // very sensitive: +6 left 63–88 of 100 prototype runs behind; +2 left an idle lab behind at the era 1 gate on every seed (2026-09-26), so rival pressure is being retuned from era 2 on instead
export const SERVING_ROOM = 0.7; // share of a rival's non-safety compute it trains with; the rest serves users
export const NO_SIZE_GAIN = 2; // a launch when not even a Small model fits
export const CAPPED_GAIN = 5; // the Geneva compute cap, as sim/training.js applies it to the player
export const OFF_BOARD_SHARE = 0.25; // of a rival's remaining shortfall, arriving next round
export const BIG_DEAL_SHARE = 0.25; // a rival deal this big against its fleet is news for the feed (no heat: owner pick F)
export const DENIAL_HEAT = 2; // the player signs a card a rival named
export const STANDING_TIE = 0.5; // score points within which standing decides rank
export const STANDING_WEIGHTS = { top: 0.6, compute: 0.4 }; // first pass (owner 2026-09-26: compute is a background part)
export const BOARD_SUPPLIERS = ['verde', 'azuria', 'coreflame', 'spot', 'gulf', 'loi']; // cards a rival can take
export const RUMOR_PROGRESS = 0.45; // a rival past this share of its launch bar is rumored to launch soon
