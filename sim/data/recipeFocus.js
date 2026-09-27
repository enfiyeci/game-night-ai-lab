// Focus sliders for the training recipe: three per stage, like Game Dev Tycoon's development phases.
// Each slider is a weight; its share of the stage's time is value / sum. At the start split every
// effect is zero, so a recipe without focus (the balance bot) plays exactly as before.
// Research basis: docs/research/training-options/report.md Part 1 (Llama 3 data mix, OLMo 2 midtraining
// and loss spikes, Phi-4 long context, OctoThinker readiness).
export const FOCUS = {
  pre: [
    { id: 'web', name: 'Web knowledge', start: 50 },
    { id: 'math', name: 'Math and code', start: 30 },
    { id: 'clean', name: 'Cleaning and filtering', start: 20 },
  ],
  mid: [
    { id: 'anneal', name: 'Best-data anneal', start: 40 },
    { id: 'long', name: 'Long documents', start: 30 },
    { id: 'prep', name: 'Reasoning prep', start: 30 },
  ],
  post: [
    { id: 'skills', name: 'Skills', start: 60 },
    { id: 'values', name: 'Values', start: 20 },
    { id: 'red', name: 'Red-teaming', start: 20 },
  ],
};

// Owner-approved 2026-09-26 on the recipe pick page. Advisors never quote numbers.
export const STAGE_BRIEFINGS = {
  pre: {
    advisor: 'research',
    text: 'This is where the model reads. Size and length decide the bill; the mix decides what it is good at. Math and code now pays off when we train it on checkable problems later.',
  },
  mid: {
    advisor: 'research',
    text: 'A short, cheap pass on our best data while the learning rate cools. Small models gain a lot here; big ones barely notice.',
  },
  post: {
    advisor: 'safety',
    text: 'This is where it learns how to behave. Time on skills shows up in the benchmarks next week. Time on values and red-teaming shows up only on the day something goes wrong.',
  },
};

// One line per slider for a large move up (high) or down (low) from the start split.
export const FOCUS_REACTIONS = {
  balanced: { advisor: 'cfo', text: 'A balanced split. Nobody is arguing yet.' },
  valuesCapped: { advisor: 'safety', text: 'Past half the time, more values work stops paying off.' },
  web: {
    high: { advisor: 'research', text: 'Fast scores. Thin reasoning later.' },
    low: { advisor: 'research', text: 'It will know less about the world than our last one.' },
  },
  math: {
    high: { advisor: 'research', text: 'It will think better than it talks.' },
    low: { advisor: 'research', text: 'Light on math. Reinforcement learning will struggle later.' },
  },
  clean: {
    high: { advisor: 'safety', text: 'Cleaner data, fewer 3 a.m. restarts. Slower gains.' },
    low: { advisor: 'safety', text: 'Dirty data. Expect loss spikes and some knowledge we did not want.' },
  },
  anneal: {
    high: { advisor: 'research', text: 'The cheapest boost on the menu.' },
    low: { advisor: 'research', text: 'We are skipping the cheapest boost we have.' },
  },
  long: {
    high: { advisor: 'cfo', text: 'Enterprise buyers will want this one.' },
    low: { advisor: 'cfo', text: 'Short memory. Enterprise buyers will notice.' },
  },
  prep: {
    high: { advisor: 'research', text: 'Pays off in the next stage, not this one.' },
    low: { advisor: 'research', text: 'Reinforcement learning will be rougher without this.' },
  },
  skills: {
    high: { advisor: 'research', text: 'The benchmarks will love it.' },
    low: { advisor: 'research', text: 'We will lose ground on the benchmarks.' },
  },
  values: {
    high: { advisor: 'safety', text: 'Priya will say we are slow. She is right.' },
    low: { advisor: 'safety', text: 'We are teaching it what to do, not why.' },
  },
  red: {
    high: { advisor: 'policy', text: 'Harder to jailbreak. Some users will hit refusals.' },
    low: { advisor: 'policy', text: 'The jailbreak forums will have a good week.' },
  },
};

// Model size in hardware terms (owner 2026-09-26: "info about gpu" instead of Small/Medium/Large).
// One compute unit is 1,000 of the era's top chips. Comparisons were checked by gn-pacing against Epoch AI's
// training-cluster-size table (epoch.ai/data-insights/training-cluster-size) and Meta's Llama 3 paper; sizes
// without a real comparable stay blank.
export const ERA_CHIP = ['A100', 'H100', 'H200', 'GB200', 'Rubin'];
export const SIZE_COMPARISONS = {
  1: { medium: 'PaLM (2022): 6,144 chips', large: 'GPT-3: 10,000 GPUs' },
  2: { medium: 'Llama 3.1 405B: 16,384 H100s', large: 'GPT-4: 25,000 GPUs', xl: 'Gemini 1.0 Ultra: 57,000 chips' },
  3: { small: 'Llama 3.1 405B scale', medium: 'Llama 4 Behemoth: 32,000 GPUs', large: 'Grok 3: 80,000 GPUs', xl: 'Grok 4: 200,000 GPUs' },
  4: { medium: 'Grok 4: 200,000 GPUs', xl: 'Stargate Abilene: about 840 MW by late 2026' },
  5: { xl: 'A projection' },
};
