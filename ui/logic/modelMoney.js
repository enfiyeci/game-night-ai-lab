// The finance page's "Each model" view: what each release cost to make, what serving it has cost, and what it has
// earned, from the books the sim keeps on every model (sim/economy.js accrueEconomy, sim/training.js, sim/release.js).
import { activeModels } from '../../sim/serving.js';
import { storyDate } from '../../sim/time.js';
import { storyDayForTurn } from './format.js';

const known = (value) => (Number.isFinite(value) ? value : null);

function statusOf(model, serving) {
  if (model.channel === 'open') return 'open';
  if (serving.has(model)) return 'serving';
  if (!model.active) return 'retired';
  return 'upcoming';
}

export function moneyRows(state) {
  const serving = new Set(activeModels(state));
  const released = (state.models ?? [])
    .map((model, index) => ({ model, index }))
    .filter(({ model }) => Number.isFinite(model.releasedTurn))
    .sort((a, b) => a.model.releasedTurn - b.model.releasedTurn || a.index - b.index)
    .map(({ model }) => {
      // Saves from before the books existed have no training figure; they show a dash rather than a made-up cost.
      const made = known(model.trainingCost) == null ? null : model.trainingCost + (model.launchCost ?? 0);
      const earned = model.earned ?? 0;
      const servingSpent = model.servingSpent ?? 0;
      return {
        kind: 'model',
        name: model.name,
        date: storyDate(Number.isFinite(model.releasedDay) ? model.releasedDay : storyDayForTurn(model.releasedTurn)).label,
        status: statusOf(model, serving),
        monthsOnSale: model.monthsOnSale ?? 0,
        made,
        serving: servingSpent,
        earned,
        net: made == null ? null : earned - servingSpent - made,
      };
    });
  const extra = [];
  if (state.pendingModel) {
    const made = known(state.pendingModel.trainingCost);
    extra.push({ kind: 'pending', name: 'Trained, not released yet', made, serving: 0, earned: 0, net: -(made ?? 0) });
  }
  if (state.activeRun) {
    const spent = (state.activeRun.spent?.cash ?? 0) + (state.activeRun.spent?.compute ?? 0);
    extra.push({ kind: 'training', name: 'In training now', made: spent, serving: 0, earned: 0, net: -spent });
  }
  const rows = [...released, ...extra];
  // A row with an unknown cost stays out of the totals' net rather than counting that cost as zero.
  const sum = (key) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);
  const total = { made: sum('made'), serving: sum('serving'), earned: sum('earned'), net: sum('net') };
  return { rows, total, paidBack: released.filter((row) => row.made != null && row.net >= 0).length, released: released.length };
}
