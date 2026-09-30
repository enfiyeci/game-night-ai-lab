export const TOUR_SEEN_KEY = 'gnal.intro.v2';

// Screen previews use a separate game so the walkthrough cannot spend money or change a plan.
export const TOUR = [
  { who: 'research', title: 'Welcome to your lab', say: 'Let us show you around. We will visit the tools you use to run this lab. Time stays paused during the tour. You can go back or skip at any point.' },
  { who: 'safety', title: 'Capability and alignment', point: 'badges', say: 'Capability is how strong your model is. Alignment is how much of that strength you can trust. Click an advisor in the office for their view before making a decision.' },
  { who: 'cfo', title: 'Cash and runway', point: 'money', say: 'Cash and runway are at the top right. Runway estimates how long your money will last at current spending and income. Money underneath opens the income and costs. Watch for cash warnings and act before the balance reaches zero.' },
  { who: 'research', title: 'Compute', point: 'compute', say: 'Compute beside Money is the chips our models train and run on: online works today, arriving is still on the way. Training and our users share it, and Compute shows where to get more.' },
  { who: 'cfo', title: 'Finance', screen: 'finance', path: 'Floor → Company → Plan the years ahead', say: 'Plan future compute spending and funding here. Compare your cash forecast with your ambitions. A plan is only a forecast: you still need to make the actual deals and funding decisions.' },
  { who: 'cfo', title: 'Budget and compute allocation', screen: 'budget', path: 'Floor → Plan the budget', say: 'Set spending on training, security, product and talent. Divide compute between training and serving customers. Check costs and runway before applying a budget; idle capacity and contracts can still cost money.' },
  { who: 'cfo', title: 'Compute deals', screen: 'deals', path: 'Floor → Company → Sign a compute deal', say: 'Compare capacity, upfront costs, recurring bills and the strings attached to each offer. More compute helps you grow, but commitments can outlast your cash. Later, watch delivery queues and power-site options too.' },
  { who: 'research', title: 'Train your model', screen: 'training', path: 'Floor → Start a training run', say: 'Name your model family, then choose a recipe: model size, training length, alignment share and techniques. Check the cost, compute needs and time required before starting.' },
  { who: 'safety', title: 'Release and learn', screen: 'history', path: 'Floor → Release a model / Lab history', say: 'When training finishes, Release a model becomes available. Choose evaluations and release settings before shipping. Lab history records your releases; use it to compare results and follow the race.' },
  { who: 'research', title: 'People and automation', screen: 'automation', path: 'Floor → Who does the work', say: 'Decide where people or AI do the work and which checks they need. Review the tradeoffs before increasing automation. Some choices only become available as your lab develops.' },
  { who: 'research', title: 'Research', screen: 'research', path: 'Floor → Company → Research a technique early', say: 'Spend research points to unlock techniques early. Check the requirements and team availability; discoveries give you more options for future training recipes.' },
  { who: 'cfo', title: 'Funding and emergencies', screen: 'raise', path: 'Floor → Company → Raise a round', say: 'When investors become available, raise cash before you need it. Compare ownership and other conditions. If runway gets short, Company also offers emergency options with serious tradeoffs.' },
  { who: 'policy', title: 'The board', screen: 'board', path: 'Floor → Company → The board', say: 'Track board support, promises and upcoming votes. Funding and strategy affect who supports you. Read warnings early so you have time to respond before a meeting.' },
  { who: 'policy', title: 'The world outside', say: 'Watch the office feed, advisor warnings and incoming calls. Take a meeting when invited. Later, constitution choices, the Geneva summit and negotiated agreements can shape what your lab is allowed to do.' },
  { who: 'research', title: 'Two actions, shared by the lab', point: 'floor', say: 'You get two team actions total each round, with at most one per team. Research handles training and techniques; Policy handles releases and the summit; Finance handles compute, power and funding; you handle meetings. Training plus a compute deal works; a compute deal plus fundraising must wait because both use Finance. Actions reset at the next quarter, month or week shown on the clock. Research stays busy until training finishes. Budget changes, planning and answering decision cards use no team action, though choices can still cost money.' },
  { who: 'research', title: 'You are ready', point: 'floor', say: 'Click the floor to open your actions. You have two team actions per round, and busy teams may need time. Budget and planning tools are free to inspect. Company holds a replay of this tour. Game holds sound settings and How to play.' },
];

export const CLOCK_NOTE = 'Time runs while you work. Pause whenever you like; ×2 and ×4 hurry it.'; // OWNER WRITES

// A fresh run on the normal start, not a debug route or a scenario that begins later in the story.
export function isFreshStart(state, { scenario = 'start', hash = '' } = {}) {
  return scenario === 'start'
    && !hash
    && !state.ending
    && state.day === 0
    && state.models.length === 0
    && !state.activeRun
    && !state.pendingModel;
}

export function tourSeen(storage) {
  try {
    return storage?.getItem(TOUR_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTourSeen(storage) {
  try {
    storage?.setItem(TOUR_SEEN_KEY, '1');
  } catch {
    // Blocked storage only means the tour may show again next run.
  }
}
