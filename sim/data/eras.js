export const ERAS = [
  { id: 1, name: 'Chat assistants', monthsPerTurn: 3, turns: 4, targetSafetyShare: 0.15, bottleneck: 'chips', boardVoteAtGate: false },
  { id: 2, name: 'The scale-up', monthsPerTurn: 3, turns: 4, targetSafetyShare: 0.2, bottleneck: 'packaging', boardVoteAtGate: true },
  { id: 3, name: 'Reasoning and agents', monthsPerTurn: 1, turns: 4, targetSafetyShare: 0.25, bottleneck: 'wafers-hbm', boardVoteAtGate: true },
  { id: 4, name: 'The gigawatt race', monthsPerTurn: 1, turns: 4, targetSafetyShare: 0.3, bottleneck: 'power', boardVoteAtGate: true },
  { id: 5, name: 'Self-improvement and pacing', monthsPerTurn: 0.25, turns: 4, targetSafetyShare: 0.35, bottleneck: 'everything', boardVoteAtGate: false },
];

export const eraById = (id) => ERAS[id - 1];
