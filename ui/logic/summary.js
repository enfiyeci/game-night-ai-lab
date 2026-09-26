import { ENDINGS } from '../../sim/endings.js';

const ADVISORS = ['research', 'safety', 'cfo', 'policy'];
const ERROR_SCALE = { research: 10, safety: 15, cfo: 6, policy: 10 };
const FIRST_NAME = { research: 'Priya', safety: 'Tomas', cfo: 'Margot', policy: 'Jules' };

const verdictFor = (meanError) => (
  meanError < 0.5 ? 'reliable' : meanError < 1 ? 'mixed' : 'misleading'
);

function advisorSummaries(history = []) {
  const errors = Object.fromEntries(ADVISORS.map((id) => [id, []]));
  for (const briefing of history) {
    for (const reading of briefing.readings ?? []) {
      if (!Object.hasOwn(errors, reading.id)) continue;
      const error = Math.abs(reading.estimate - reading.truth) / ERROR_SCALE[reading.id];
      if (Number.isFinite(error)) errors[reading.id].push(error);
    }
  }

  return ADVISORS.flatMap((id) => {
    if (errors[id].length === 0) return [];
    const meanError = errors[id].reduce((sum, error) => sum + error, 0) / errors[id].length;
    return [{ id, meanError, verdict: verdictFor(meanError) }];
  });
}

function extremeAdvisor(advisors, better) {
  if (advisors.length === 0) return null;
  return advisors.reduce((best, advisor) => (
    better(advisor.meanError, best.meanError) ? advisor : best
  )).id;
}

function bestModelName(models) {
  let best = null;
  for (const model of models) {
    if (!Number.isFinite(model.launchScore)) continue;
    if (best == null || model.launchScore > best.launchScore) best = model;
  }
  return best?.name ?? null;
}

function summaryLine(title, era, modelCount, mostReliable, mostMisleading) {
  const models = `${modelCount} ${modelCount === 1 ? 'model' : 'models'}`;
  const result = `${title} in era ${era} after ${models}`;
  if (mostReliable == null) return `${result}.`;
  if (mostReliable === mostMisleading) return `${result}; ${FIRST_NAME[mostReliable]} gave the clearest read.`;
  return `${result}; ${FIRST_NAME[mostReliable]} saw it coming, while ${FIRST_NAME[mostMisleading]} did not.`;
}

export function runSummary(state) {
  const ending = ENDINGS[state.ending] ?? { title: 'Run complete', kind: null };
  const models = state.models ?? [];
  const advisors = advisorSummaries(state.advisorHistory);
  const mostReliable = extremeAdvisor(advisors, (error, best) => error < best);
  const mostMisleading = extremeAdvisor(advisors, (error, worst) => error > worst);

  return {
    endingId: state.ending,
    title: ending.title,
    kind: ending.kind,
    era: state.era,
    turn: state.turn,
    models: models.length,
    bestModel: bestModelName(models),
    advisors,
    mostReliable,
    mostMisleading,
    shareLine: summaryLine(ending.title, state.era, models.length, mostReliable, mostMisleading),
  };
}
