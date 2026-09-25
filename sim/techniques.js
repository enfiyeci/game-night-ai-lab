// era: when the industry makes it available. standard: from which era it is built into every
// new model automatically (6 = never). auto: effects added to every model once standard.
export const TECHNIQUES = [
  { id: 'moe', name: 'Mixture-of-experts', era: 2, standard: 6, researchCost: 30 },
  { id: 'synthetic', name: 'Synthetic data', era: 2, standard: 6, researchCost: 25 },
  { id: 'rlvr', name: 'Verifiable-reward RL', era: 2, standard: 6, researchCost: 35 },
  { id: 'cot', name: 'Chain-of-thought reasoning', era: 3, standard: 3, researchCost: 40, auto: { cap: 4, ad: 2, flags: ['hallucination'], spec: { reasoningCapable: true } } },
  { id: 'agents', name: 'Tool use and agents', era: 3, standard: 4, researchCost: 50, auto: { cap: 3, ad: 3 } },
  { id: 'fp4', name: 'Low-precision serving', era: 4, standard: 6, researchCost: 30 },
];

export const techById = (id) => TECHNIQUES.find((t) => t.id === id);

export function techAvailable(state, id) {
  const t = techById(id);
  if (!t) return false;
  return state.era >= t.era || (state.researched.includes(id) && state.era >= t.era - 1);
}

export function standardTechniques(state) {
  return TECHNIQUES.filter((t) => state.era >= t.standard);
}

export function researchTechnique(state, id) {
  const t = techById(id);
  if (!t) return { ok: false, error: `unknown technique ${id}` };
  if (techAvailable(state, id)) return { ok: false, error: `${t.name} is already available` };
  if (state.era < t.era - 1) return { ok: false, error: `${t.name} can only be researched from era ${t.era - 1}` };
  if (state.researchPoints < t.researchCost) return { ok: false, error: 'not enough research points' };
  state.researchPoints -= t.researchCost;
  state.researched.push(id);
  return { ok: true, techId: id };
}
