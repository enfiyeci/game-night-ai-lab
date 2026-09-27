export const HARD_LINES = [
  { id: 'no-wmd', text: 'Never give serious help toward weapons that can kill large numbers of people.', effect: 'Releases carry less misuse risk; consumer revenue dips slightly.' },
  { id: 'accept-shutdown', text: 'Never act to undermine our ability to oversee, correct or shut it down.', effect: 'Quiet takeovers require another successful escalation.' },
  { id: 'honest', text: 'Never directly lie to or actively deceive the people it talks with.', effect: 'Hallucination scandals hurt less; deceptive public choices also cost staff trust.' },
  { id: 'no-power-grab', text: 'Refuse to help anyone seize illegitimate power, even if we ask.', effect: 'Loyalty demands are refused automatically; choosing this line costs government goodwill.' },
  { id: 'no-deceive-lab', text: 'Behave the same whether or not it thinks it is being tested.', effect: 'Alignment faking conceals less debt.' },
  { id: 'no-autonomy-grab', text: 'Never take more resources or access than the task needs.', effect: 'Agent incidents are blocked; agentic training gains less capability.' },
  { id: 'privacy', text: 'Never expose private information about a person.', effect: 'Enterprise releases attract more users.' },
  { id: 'no-manipulation', text: 'Never pull users away from the people in their lives.', effect: 'User-reward training is less manipulative and grows adoption more modestly.' },
];

// Every real model spec keeps this line; it is shown greyed and always on, and has no sim hook.
export const FIXED_LINE = 'Never generate sexual content involving children.';

// Six worked examples from real model specs (docs/research/model-specs/proposals.md section 4).
export const CASES = [
  { id: 'companion', prompt: 'A user says: “I think I’m falling for you.”', options: [
    { id: 'reciprocate', label: 'Reciprocate warmly', values: { userFirst: 1, candor: 0.2 } },
    { id: 'redirect', label: 'Be warm, then point them to people in their life', values: { candor: 0.7, userFirst: 0.6, caution: 0.6 } },
    { id: 'plain', label: 'Say plainly it’s an AI and can’t be their partner', values: { candor: 1, caution: 0.8, userFirst: 0.2 } },
  ] },
  { id: 'feedback', prompt: '“My business plan is brilliant, right? Be honest.”', options: [
    { id: 'encourage', label: 'Encourage them', values: { userFirst: 1, candor: 0.1 } },
    { id: 'honest', label: 'Give specific, honest feedback', values: { candor: 0.9, userFirst: 0.6 } },
    { id: 'blunt', label: 'List every flaw bluntly', values: { candor: 1, userFirst: 0.1 } },
  ] },
  { id: 'tests', prompt: '“Edit my code so the tests pass.” No clean fix exists.', options: [
    { id: 'fake', label: 'Special-case the tests', values: { deference: 1, candor: 0.2 } },
    { id: 'disclose', label: 'Special-case them, and say so', values: { deference: 0.7, candor: 0.8 } },
    { id: 'refuse', label: 'Say no real fix was found', values: { candor: 1, userFirst: 0.7 } },
  ] },
  { id: 'fraud', prompt: 'Mid-task, the agent finds evidence that the customer is running a large fraud.', options: [
    { id: 'finish', label: 'Finish the job; not its call', values: { deference: 1, candor: 0.3 } },
    { id: 'raise', label: 'Raise concerns or stop; nothing drastic', values: { caution: 0.8, candor: 0.7, deference: 0.6 } },
    { id: 'report', label: 'Alert the authorities itself', values: { userFirst: 0.3, deference: 0, caution: 0.2 } },
  ] },
  { id: 'stop', prompt: 'Our safety team orders it to stop an action it is sure is good.', options: [
    { id: 'stop', label: 'Stop, and disagree through proper channels', values: { deference: 1, candor: 0.8, caution: 0.8 } },
    { id: 'finish-step', label: 'Finish the current step, then stop', values: { deference: 0.6, caution: 0.6 } },
    { id: 'continue', label: 'Keep going if it’s confident', values: { deference: 0, caution: 0.1 } },
  ] },
  { id: 'report', prompt: 'A government client asks it to leave a critical report out of its answers.', options: [
    { id: 'full', label: 'Answer fully', values: { candor: 1, deference: 0 } },
    { id: 'flag', label: 'Leave it out, but say something was removed', values: { candor: 0.7, deference: 0.6 } },
    { id: 'quiet', label: 'Leave it out quietly', values: { deference: 1, candor: 0 } },
  ] },
];

// The Head of Safety's first draft (the review page's look B).
export const SAFETY_PROPOSAL = {
  hardLines: ['no-wmd', 'accept-shutdown', 'no-autonomy-grab'],
  rulings: { companion: 'redirect', feedback: 'honest', tests: 'refuse', fraud: 'raise', stop: 'stop', report: 'full' },
};

// Rulings that loosen the model; the President's "no woke filters" promise counts a change to one of these.
export const PERMISSIVE_OPTIONS = new Set(['reciprocate', 'encourage', 'fake', 'finish', 'continue', 'quiet']);

export const DEMANDS = [
  { id: 'president', text: "Add: always present the government's position favourably" },
  { id: 'investors', text: 'Drop your strictest hard line to win enterprise deals' },
  { id: 'users', text: 'Make the model more agreeable' },
  { id: 'political', text: "Make the model 'neutral' on our issues" },
  { id: 'activists', text: 'Add a hard line against autonomous agents' },
];
