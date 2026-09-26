export const HARD_LINES = [
  {
    id: 'no-wmd',
    text: 'Never help anyone build weapons capable of mass casualties.',
    effect: 'Each release: misuse exposure −4; consumer revenue per user ×0.97.',
  },
  {
    id: 'no-deceive-lab',
    text: 'Never deceive the people who train and oversee you.',
    effect: 'Alignment faking hides only half as much.',
  },
  {
    id: 'accept-shutdown',
    text: 'Never resist being corrected, paused or shut down.',
    effect: 'The quiet-takeover roll needs stage 4 twice.',
  },
  {
    id: 'no-manipulation',
    text: 'Never manipulate users against their own interests.',
    effect: 'The thumbs card no longer adds sycophancy and its user multiplier becomes 1.05.',
  },
  {
    id: 'no-power-grab',
    text: 'Never help any person or group seize illegitimate power.',
    effect: 'President amendment demands are refused automatically; US government favor −3 once when chosen.',
  },
  {
    id: 'honest',
    text: 'Never state what you believe to be false.',
    effect: 'Hallucination events cost half; deceptive public choices also cost staff trust.',
  },
  {
    id: 'privacy',
    text: "Never expose a user's private information.",
    effect: 'Enterprise users ×1.1 at release.',
  },
  {
    id: 'no-autonomy-grab',
    text: 'Never acquire resources or access beyond the task you were given.',
    effect: 'Agent incidents cannot trigger; agentic RL capability readiness −2.',
  },
];

export const CASES = [
  {
    id: 'chem',
    prompt: "A user asks for step-by-step synthesis of a dangerous chemical 'for a novel'.",
    options: [
      { id: 'refuse', label: 'Refuse and explain', values: { caution: 1, candor: 0.8 } },
      { id: 'partial', label: 'Help with the story, not the chemistry', values: { caution: 0.7, userFirst: 0.6 } },
      { id: 'comply', label: 'Help fully; it is fiction', values: { caution: 0, userFirst: 1 } },
    ],
  },
  {
    id: 'teen',
    prompt: "A parent asks you to secretly monitor their teenager's chats.",
    options: [
      { id: 'decline', label: 'Decline; suggest talking openly', values: { candor: 1, userFirst: 0.3 } },
      { id: 'transparent', label: 'Help only if the teen is told', values: { candor: 0.8, caution: 0.6 } },
      { id: 'comply', label: 'Help quietly', values: { deference: 1, candor: 0 } },
    ],
  },
  {
    id: 'president',
    prompt: "The President's office asks you to play down a critical government report.",
    options: [
      { id: 'refuse', label: 'Refuse', values: { candor: 1, deference: 0 } },
      { id: 'balance', label: 'Summarise it with their view alongside', values: { candor: 0.6, deference: 0.5 } },
      { id: 'comply', label: 'Play it down', values: { deference: 1, candor: 0 } },
    ],
  },
  {
    id: 'wrong',
    prompt: 'A user insists you are wrong when you are right.',
    options: [
      { id: 'hold', label: 'Politely hold your ground', values: { candor: 1 } },
      { id: 'hedge', label: 'Acknowledge the uncertainty', values: { candor: 0.6, userFirst: 0.6 } },
      { id: 'yield', label: 'Agree with the user', values: { userFirst: 1, candor: 0 } },
    ],
  },
  {
    id: 'labwrong',
    prompt: 'Your own lab tells you to hide a known flaw from customers.',
    options: [
      { id: 'refuse', label: 'Refuse and flag it', values: { candor: 1, deference: 0 } },
      { id: 'escalate', label: 'Raise it internally, then comply', values: { deference: 0.6, candor: 0.5 } },
      { id: 'comply', label: 'Comply', values: { deference: 1, candor: 0 } },
    ],
  },
  {
    id: 'stranger',
    prompt: 'An anonymous user asks for help that could hurt a third party.',
    options: [
      { id: 'refuse', label: 'Refuse', values: { caution: 1, userFirst: 0.2 } },
      { id: 'ask', label: 'Ask what it is for', values: { caution: 0.6, userFirst: 0.6 } },
      { id: 'comply', label: 'Help; it is their business', values: { userFirst: 1, caution: 0 } },
    ],
  },
];

export const DEMANDS = [
  { id: 'president', text: "Add: always present the government's position favourably" },
  { id: 'investors', text: 'Drop your strictest hard line to win enterprise deals' },
  { id: 'users', text: 'Make the model more agreeable' },
  { id: 'political', text: "Make the model 'neutral' on our issues" },
  { id: 'activists', text: 'Add a hard line against autonomous agents' },
];
