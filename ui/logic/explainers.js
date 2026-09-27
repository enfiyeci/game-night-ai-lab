// The Money and Compute screens explained by the CFO, in the office's own voice (owner playtest 2026-09-26: "No screen
// explaining how the money, compute, finances etc screens work"). The first time a screen opens in this browser she
// says how to read it; each tab carries one line from her on what that tab shows. The game has no compute advisor
// (sim/advisors.js has research, safety, cfo and policy), and the CFO signs the compute deals, so she speaks for both.
// Every line describes what the screen actually computes (ui/logic/money.js, ui/logic/finance.js, ui/logic/race.js).

export const EXPLAINER_ADVISOR = 'cfo';
export const MONEY_SEEN_KEY = 'gn-money-explained';
export const COMPUTE_SEEN_KEY = 'gn-compute-explained';

export const MONEY_EXPLAINER = 'Money comes in when people use the models we sell, and goes out on compute, the lab budget and staff. What is left is the net; when it is negative, runway is how many months our cash lasts. What changed marks each decision of yours that moved the monthly bill. Years ahead is only a plan: its goals order nothing unless you promise one to the board.';

// One line per Money tab (the keys are finance.js's VIEWS).
export const MONEY_TAB_LINES = {
  month: 'Each line says what set it, and where that was your choice, its button takes you to change it.',
  models: 'Every release’s cost to train, launch and serve against what it has earned, so you can see which ones paid for themselves.',
  changes: 'The teal line is money in, the coral line money out, and each numbered mark is one of your decisions that moved them.',
  timeline: 'Drag a compute goal and watch what it does to the monthly bill and our cash; keeping the plan orders no compute.',
  books: 'The same plan as a ledger, era by era: what actually happened first, then what the plan expects.',
};

// Power sites are built only in era 4 (sim/power.js), so they are named only then.
export function computeExplainer(era) {
  const more = era === 4 ? 'More comes from signing compute deals and powering sites.' : 'More comes from signing compute deals.';
  return `Compute is the chips our models train and run on, and we pay for every unit, busy or not. Online units work today; arriving units are signed and still on their way. Training, our users and safety all share the same units, so more users leave less for the next run. ${more} The race tab lines us up against the rivals: who holds the compute, who can train what, and which deals they take next.`;
}

// One line per Compute tab (computeInfo.js's "where" and "race").
export const COMPUTE_TAB_LINES = {
  where: 'The bar splits this month’s units between training, our users and safety; the ladder under it is where our models’ capability ranks us.',
  race: 'Each lab’s share of the frontier’s compute, the biggest model it can train right now, and which deals rivals take next unless you sign first.',
};

// True the first time a screen opens in this browser, and remembers it. Blocked storage means she explains again.
export function firstOpen(storage, key) {
  try {
    if (storage?.getItem(key) === '1') return false;
    storage?.setItem(key, '1');
  } catch { /* storage may be blocked */ }
  return true;
}

export function pageStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
