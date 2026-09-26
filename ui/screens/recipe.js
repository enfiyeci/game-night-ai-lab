import { eraScale } from '../../sim/data/compute.js';
import { CARDS } from '../../sim/data/cards.js';
import {
  LENGTHS,
  SIZES,
  SIZE_UNITS,
  cardById,
  slotsFor,
} from '../../sim/recipe.js';
import { modelName } from '../../sim/release.js';
import { computeSlices } from '../../sim/split.js';
import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { vslider } from '../components/vslider.js';
import { cardCostWords, recipePreview, sanitizeDraft } from '../logic/actions.js';
import { projectQueue } from '../logic/compute.js';
import { computeAmount, money } from '../logic/format.js';
import { offeredCards } from '../logic/release.js';
import { registerMenuHandler } from '../menu.js';

const rememberedDrafts = new WeakMap();
const STAGES = ['pre', 'mid', 'post'];
const STAGE_NAMES = { pre: 'Pretraining', mid: 'Midtraining', post: 'Post-training' };
const GROUP_NAMES = {
  data: 'Data',
  arch: 'Architecture',
  stability: 'Stability',
  hazard: 'Hazard filtering',
  anneal: 'Anneal',
  context: 'Context length',
  ready: 'Reasoning readiness',
  decontam: 'Decontamination',
  'align-data': 'Alignment data',
  sft: 'Instruction data',
  feedback: 'Feedback',
  rl: 'Reinforcement learning',
  character: 'Character',
  safeguards: 'Safeguards',
  eval: 'How you check it',
  channel: 'Who gets it',
  precision: 'Serving',
};
const SIZE_NAMES = { small: 'Small', medium: 'Medium', large: 'Large', xl: 'Extra large' };
const LENGTH_NAMES = {
  optimal: 'Compute-optimal',
  over: 'Overtrained',
  heavy: 'Heavily overtrained',
};

const cloneDraft = (draft) => structuredClone(draft);

function workingName(state, draft) {
  const last = state.models.at(-1);
  return modelName({
    family: last?.family ?? 'Kestrel',
    generation: (last?.generation ?? 0) + 1,
    size: draft.sliders.size,
    tierWords: state.tierWords,
  });
}

function stageStepper(stage, era) {
  const root = document.createElement('div');
  root.className = 'recipe-stepper';
  root.setAttribute('aria-label', 'Training stages');
  for (const id of STAGES) {
    const item = document.createElement(id === stage ? 'strong' : 'span');
    item.textContent = STAGE_NAMES[id];
    if (id === 'mid' && era < 2) {
      item.className = 'locked';
      item.textContent = 'Midtraining · opens in era 2';
    }
    if (id === stage) item.setAttribute('aria-current', 'step');
    root.append(item);
  }
  return root;
}

function recap(draft) {
  const root = document.createElement('section');
  root.className = 'recipe-recap';
  const heading = document.createElement('h2');
  heading.textContent = 'Your run so far';
  const rows = [
    ['Model size', SIZE_NAMES[draft.sliders.size]],
    ['Training length', LENGTH_NAMES[draft.sliders.length]],
    ['Pretraining techniques', draft.picks.pre.map((id) => cardById(id)?.name).filter(Boolean).join(', ') || 'Defaults only'],
  ];
  const list = document.createElement('dl');
  for (const [term, description] of rows) {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = description;
    list.append(dt, dd);
  }
  root.append(heading, list);
  return root;
}

function allocationBar(alignShare) {
  const root = document.createElement('div');
  root.className = 'recipe-allocation';
  const label = document.createElement('div');
  label.className = 'recipe-allocation-label';
  label.textContent = 'Time allocation (preview)';
  const bar = document.createElement('div');
  bar.className = 'recipe-allocation-bar';
  const capability = document.createElement('span');
  capability.className = 'capability';
  capability.style.flex = `${1 - alignShare} 1 0%`;
  const capabilityLabel = document.createElement('b');
  capabilityLabel.textContent = `Capability ${Math.round((1 - alignShare) * 100)}%`;
  capability.append(capabilityLabel);
  const alignment = document.createElement('span');
  alignment.className = 'alignment';
  alignment.style.flex = `${alignShare} 1 0%`;
  const alignmentLabel = document.createElement('b');
  alignmentLabel.textContent = `Alignment ${Math.round(alignShare * 100)}%`;
  alignment.append(alignmentLabel);
  bar.setAttribute('aria-label', `Capability ${Math.round((1 - alignShare) * 100)} percent, Alignment ${Math.round(alignShare * 100)} percent`);
  bar.append(capability, alignment);
  root.append(label, bar);
  return root;
}

function costText(card) {
  const words = cardCostWords(card);
  return words.length > 0 ? words.join(' · ') : 'Free';
}

function capitaliseError(message = '') {
  return message ? message[0].toUpperCase() + message.slice(1) : '';
}

function computeUsageText(used, free, era) {
  const [rawUsedValue, ...usedUnitParts] = computeAmount(used, era).split(' ');
  const [freeValue, ...freeUnitParts] = computeAmount(free, era).split(' ');
  const usedUnit = usedUnitParts.join(' ');
  const freeUnit = freeUnitParts.join(' ');
  const usedValue = usedUnit === 'MW' && freeUnit === 'GW'
    ? (Number(rawUsedValue) / 1000).toFixed(2)
    : rawUsedValue;
  const availability = freeUnit === 'units' ? 'free units' : `${freeUnit} free`;
  return `Uses ${usedValue} of ${freeValue} ${availability}`;
}

export function techniquePanel(state, stage, draft, onChange, { cardNote } = {}) {
  const root = document.createElement('div');
  root.className = 'recipe-techniques';
  const counter = document.createElement('div');
  counter.className = 'recipe-pick-count';
  const selected = draft.picks[stage];
  const slots = slotsFor(state, stage);
  counter.textContent = `${selected.length} of ${slots} picked`;
  root.append(counter);

  const list = document.createElement('div');
  list.className = 'recipe-technique-list';
  const cards = offeredCards(state, stage);
  const groupIds = [...new Set(cards.map((card) => card.group))];
  if (cards.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'recipe-technique-empty';
    empty.textContent = stage === 'mid' ? 'Midtraining opens in era 2.' : 'No techniques are available yet.';
    list.append(empty);
  }

  for (const group of groupIds) {
    const section = document.createElement('section');
    section.className = 'recipe-technique-group';
    section.dataset.group = group;
    const header = document.createElement('div');
    header.className = 'recipe-group-header';
    header.textContent = GROUP_NAMES[group] ?? group;
    section.append(header);
    const fallback = CARDS.find((card) => card.stage === stage && card.group === group && card.default);
    if (fallback) {
      const defaultLine = document.createElement('div');
      defaultLine.className = 'recipe-default';
      defaultLine.textContent = `If none: ${fallback.name}`;
      defaultLine.title = fallback.hint;
      section.append(defaultLine);
      const fallbackNote = cardNote?.(fallback);
      if (fallbackNote) {
        const chip = document.createElement('span');
        chip.className = `release-ship ${fallbackNote.later ? 'later' : 'now'}`;
        chip.textContent = fallbackNote.text;
        defaultLine.append(' ', chip);
      }
    }

    const selectedInGroup = selected.find((id) => cardById(id)?.group === group);
    for (const card of cards.filter((candidate) => candidate.group === group)) {
      const picked = selected.includes(card.id);
      const blocked = selected.length >= slots && !picked && !selectedInGroup;
      const reason = blocked ? `All ${slots} picks are used — remove one first` : '';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'recipe-card';
      button.classList.toggle('selected', picked);
      button.setAttribute('aria-pressed', `${picked}`);
      if (blocked) {
        button.setAttribute('aria-disabled', 'true');
        button.title = reason;
      }
      const main = document.createElement('span');
      main.className = 'recipe-card-main';
      const name = document.createElement('strong');
      if (picked) {
        const check = document.createElement('i');
        check.className = 'recipe-check';
        check.setAttribute('aria-hidden', 'true');
        name.append(check);
      }
      name.append(card.name);
      const cost = document.createElement('b');
      cost.textContent = costText(card);
      main.append(name, cost);
      const hint = document.createElement('span');
      hint.className = 'recipe-card-hint';
      hint.textContent = card.hint;
      button.append(main, hint);
      const note = cardNote?.(card);
      if (note) {
        const chip = document.createElement('span');
        chip.className = `release-ship ${note.later ? 'later' : 'now'}`;
        chip.textContent = note.text;
        button.append(chip);
      }
      if (blocked) {
        const hidden = document.createElement('span');
        hidden.className = 'visually-hidden';
        hidden.textContent = `: ${reason}`;
        button.append(hidden);
      }
      button.addEventListener('click', () => {
        if (blocked) return;
        const next = [...draft.picks[stage]];
        const same = next.indexOf(card.id);
        if (same >= 0) next.splice(same, 1);
        else {
          const groupIndex = next.findIndex((id) => cardById(id)?.group === group);
          if (groupIndex >= 0) next[groupIndex] = card.id;
          else next.push(card.id);
        }
        onChange(next);
      });
      section.append(button);
    }
    list.append(section);
  }
  root.append(list);
  return root;
}

function computeFooter(state, preview, releaseEstimate = false) {
  const root = document.createElement('section');
  root.className = 'recipe-cost';
  const meter = document.createElement('div');
  meter.className = 'recipe-compute';
  const label = document.createElement('div');
  label.className = 'recipe-cost-label';
  label.textContent = 'Training compute';
  const trackWrap = document.createElement('div');
  trackWrap.className = 'recipe-compute-track-wrap';
  const track = document.createElement('div');
  track.className = 'recipe-compute-track';
  const fill = document.createElement('span');
  fill.className = 'recipe-compute-fill';
  const units = preview.cost?.units ?? 0;
  fill.style.width = `${preview.free > 0 ? Math.min(100, (units / preview.free) * 100) : 0}%`;
  track.append(fill);
  trackWrap.append(track);
  if (preview.free > 0 && units > preview.free) {
    const overflow = document.createElement('span');
    overflow.className = 'recipe-compute-overflow';
    overflow.style.width = `${Math.min(42, ((units - preview.free) / preview.free) * 100)}%`;
    trackWrap.append(overflow);
  }
  const line = document.createElement('div');
  line.className = 'recipe-compute-line';
  if (preview.free === 0) {
    const slices = computeSlices(state);
    const reason = state.activeRun
      ? 'a run is under way'
      : slices.serving > 0 ? 'everything is serving users' : 'everything online is allocated';
    line.textContent = `No free compute — ${reason}`;
  } else if (!preview.cost) line.textContent = 'Choose a valid size and training length.';
  else if (!preview.fits) {
    line.textContent = `Needs ${computeAmount(units, state.era)} — only ${computeAmount(preview.free, state.era)} are free`;
  } else line.textContent = computeUsageText(units, preview.free, state.era);
  meter.append(label, trackWrap, line);
  if (releaseEstimate) {
    const estimate = document.createElement('div');
    estimate.className = 'recipe-compute-line';
    estimate.textContent = 'Estimate: the model you release this turn will take some compute to serve.';
    meter.append(estimate);
  }

  const facts = document.createElement('div');
  facts.className = 'recipe-cost-facts';
  const cash = document.createElement('span');
  cash.textContent = preview.cost?.cash ? `Cash ${money(preview.cost.cash)}` : 'No cash cost';
  const turns = document.createElement('span');
  const count = preview.cost?.turns ?? 0;
  turns.textContent = `Takes ${count} ${count === 1 ? 'turn' : 'turns'}`;
  facts.append(cash, turns);
  root.append(meter, facts);
  return root;
}

export function openRecipe(game, overlayRoot, { stage = 1 } = {}) {
  const projected = () => projectQueue(game.state, game.queue);
  const releaseBeforeRun = () => {
    const moves = game.queue.moves ?? [];
    const runIndex = moves.findIndex((move) => move.type === 'startRun');
    return moves.slice(0, runIndex < 0 ? moves.length : runIndex).some((move) => move.type === 'release');
  };
  let draft = sanitizeDraft(projected(), rememberedDrafts.get(game));
  let lengthWasAdjusted = false;
  let automaticLengthChange = false;
  let opened;

  function showStage(requested) {
    const state = projected();
    const number = requested === 2 && state.era < 2 ? 3 : Math.max(1, Math.min(3, requested));
    const stageId = STAGES[number - 1];
    draft = sanitizeDraft(state, draft);

    const body = document.createElement('div');
    body.className = 'recipe-body';
    body.append(stageStepper(stageId, state.era));
    const centre = document.createElement('div');
    centre.className = `recipe-centre recipe-centre-${stageId}`;
    const rightContent = document.createElement('div');
    const footerSlot = document.createElement('div');
    footerSlot.className = 'recipe-footer-slot';
    const error = document.createElement('div');
    error.className = 'dialog-error recipe-error';
    error.setAttribute('role', 'alert');

    const refresh = () => {
      const nextState = projected();
      const preview = recipePreview(nextState, draft);
      rightContent.replaceChildren(techniquePanel(nextState, stageId, draft, (picks) => {
        draft.picks[stageId] = picks;
        draft = sanitizeDraft(projected(), draft);
        refresh();
      }));
      footerSlot.replaceChildren(computeFooter(nextState, preview, releaseBeforeRun()));
      error.textContent = capitaliseError(preview.errors[0]);
      const subtitle = opened?.querySelector('.subt');
      if (subtitle) subtitle.textContent = `${workingName(nextState, draft)} / ${STAGE_NAMES[stageId]}`;
      const startButton = opened?.querySelector('.dialog-ok');
      if (startButton && number === 3) startButton.title = capitaliseError(preview.errors[0]);
    };

    if (number === 1) {
      const sliders = document.createElement('div');
      sliders.className = 'recipe-sliders recipe-stage-one-sliders';
      const sizeNotches = SIZES.map((size, index) => ({
        value: index,
        label: SIZE_NAMES[size],
        detail: size === 'xl' && state.era < 2
          ? 'opens in era 2'
          : computeAmount(SIZE_UNITS[size] * eraScale(state.era), state.era),
        title: size === 'xl' && state.era < 2 ? 'Extra large opens in era 2' : '',
      }));
      let lengthSlider;
      const sizeSlider = vslider({
        label: 'Model size',
        role: 'Head of Research',
        value: SIZES.indexOf(draft.sliders.size),
        min: 0,
        max: SIZES.length - 1,
        step: 1,
        colour: 'coral',
        formatValue: (value) => SIZE_NAMES[SIZES[value]],
        ariaValueText: (value) => SIZE_NAMES[SIZES[value]],
        notches: sizeNotches,
        disabledValues: state.era < 2 ? [3] : [],
        onInput(value) {
          draft.sliders.size = SIZES[value];
          const large = value >= 2;
          lengthWasAdjusted = false;
          if (large && draft.sliders.length === 'heavy') {
            lengthWasAdjusted = true;
            automaticLengthChange = true;
          }
          lengthSlider.setDisabledValues(large ? [2] : []);
          automaticLengthChange = false;
          note.textContent = lengthWasAdjusted
            ? 'Heavily overtrained is only available for small or medium models, so training length moved to Overtrained.'
            : '';
          refresh();
        },
      });
      const lengthKeys = Object.keys(LENGTHS);
      lengthSlider = vslider({
        label: 'Training length',
        role: 'Researcher',
        value: lengthKeys.indexOf(draft.sliders.length),
        min: 0,
        max: lengthKeys.length - 1,
        step: 1,
        colour: 'teal',
        formatValue: (value) => LENGTH_NAMES[lengthKeys[value]],
        ariaValueText: (value) => LENGTH_NAMES[lengthKeys[value]],
        notches: lengthKeys.map((length, index) => ({
          value: index,
          label: LENGTH_NAMES[length],
          detail: LENGTHS[length].turns ? `+${LENGTHS[length].turns} ${LENGTHS[length].turns === 1 ? 'turn' : 'turns'}` : '',
          title: length === 'heavy' && ['large', 'xl'].includes(draft.sliders.size)
            ? 'Heavily overtrained needs a small or medium model' : '',
        })),
        disabledValues: ['large', 'xl'].includes(draft.sliders.size) ? [2] : [],
        onInput(value) {
          draft.sliders.length = lengthKeys[value];
          if (!automaticLengthChange) lengthWasAdjusted = false;
          note.textContent = lengthWasAdjusted
            ? 'Heavily overtrained is only available for small or medium models, so training length moved to Overtrained.'
            : '';
          refresh();
        },
      });
      const note = document.createElement('p');
      note.className = 'recipe-slider-note';
      note.textContent = '';
      sliders.append(sizeSlider, lengthSlider);
      centre.append(sliders, note);
    } else if (number === 2) centre.append(recap(draft));
    else {
      const sliderWrap = document.createElement('div');
      sliderWrap.className = 'recipe-stage-three-slider';
      sliderWrap.append(vslider({
        label: 'Alignment share',
        role: 'Head of Safety',
        value: draft.sliders.alignShare * 100,
        min: 0,
        max: 50,
        step: 5,
        colour: 'sky',
        notches: Array.from({ length: 11 }, (_, index) => ({
          value: index * 5,
          label: index % 2 === 0 ? `${index * 5}%` : '',
          ariaLabel: `${index * 5}%`,
        })),
        onInput(value) {
          draft.sliders.alignShare = value / 100;
          allocation.replaceWith(allocation = allocationBar(draft.sliders.alignShare));
          refresh();
        },
      }));
      let allocation = allocationBar(draft.sliders.alignShare);
      centre.append(sliderWrap, allocation);
    }

    body.append(centre, footerSlot, error);
    const nextStage = number === 1 ? (state.era < 2 ? 3 : 2) : 3;
    const previousStage = number === 3 ? (state.era < 2 ? 1 : 2) : 1;
    opened = openDialog(overlayRoot, {
      title: `Training run · Stage ${number}`,
      subtitle: `${workingName(state, draft)} / ${STAGE_NAMES[stageId]}`,
      left: { title: 'Team', content: teamPanel(state, { lines: true }) },
      right: { title: 'Selected techniques', content: rightContent },
      body,
      okLabel: number === 3 ? 'Start training' : 'Next',
      backLabel: number > 1 ? 'Back' : undefined,
      onBack: () => showStage(previousStage),
      onOk() {
        if (number < 3) {
          showStage(nextStage);
          return;
        }
        const nextState = projected();
        draft = sanitizeDraft(nextState, draft);
        const preview = recipePreview(nextState, draft);
        if (!preview.ok) {
          error.textContent = capitaliseError(preview.errors[0]);
          return;
        }
        const result = game.addMove({ type: 'startRun', recipe: draft });
        if (!result.ok) {
          error.textContent = capitaliseError(result.error);
          return;
        }
        rememberedDrafts.set(game, cloneDraft(draft));
        opened.close();
      },
    });
    opened.classList.add('recipe-dialog', `recipe-dialog-stage-${number}`);
    refresh();
  }

  showStage(stage);
  return opened;
}

export function mountRecipe(game, overlayRoot) {
  return registerMenuHandler('training', () => openRecipe(game, overlayRoot));
}
