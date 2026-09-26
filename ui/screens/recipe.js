import { ADVISOR_PROFILES } from '../../sim/data/advisorLines.js';
import { eraScale } from '../../sim/data/compute.js';
import { FOCUS, FOCUS_REACTIONS, STAGE_BRIEFINGS } from '../../sim/data/recipeFocus.js';
import { genevaCapRow } from './deal.js';
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
import { portrait } from '../components/portraits.js';
import { teamPanel } from '../components/team.js';
import { vslider } from '../components/vslider.js';
import { cardCostWords, recipePreview, sanitizeDraft } from '../logic/actions.js';
import { projectQueue } from '../logic/compute.js';
import { computeAmount, money, roundsToWords } from '../logic/format.js';
import { offeredCards } from '../logic/release.js';
import { registerMenuHandler } from '../menu.js';

const rememberedDrafts = new WeakMap();
// Cards with `opens: key` call a screen registered under that key when picked, and may show a note line.
const cardOpeners = new Map();

export function registerCardOpener(key, { open, note } = {}) {
  cardOpeners.set(key, { open, note });
}
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
    family: last?.family || state.modelFamily || 'Kestrel',
    generation: (last?.generation ?? 0) + 1,
    size: draft.sliders.size,
    tierWords: state.tierWords,
  });
}

const stagesFor = (era) => (era < 2 ? ['pre', 'post'] : STAGES);
const FOCUS_COLOURS = { pre: ['coral', 'teal', 'sky'], mid: ['coral', 'wood', 'teal'], post: ['coral', 'sky', 'teal'] };
const startFocus = (stage) => FOCUS[stage].map((slider) => slider.start);

// Later stages are simply absent until their era arrives; the stepper never names them early.
function stageStepper(stage, era) {
  const root = document.createElement('div');
  root.className = 'recipe-stepper';
  root.setAttribute('aria-label', 'Training stages');
  for (const id of stagesFor(era)) {
    const item = document.createElement(id === stage ? 'strong' : 'span');
    item.textContent = STAGE_NAMES[id];
    if (id === stage) item.setAttribute('aria-current', 'step');
    root.append(item);
  }
  return root;
}

function advisorVoice(id, size) {
  const face = document.createElement('span');
  face.className = 'recipe-face';
  face.innerHTML = portrait(`advisor-${id}`, size, 'flat');
  return face;
}

function briefing(stage) {
  const { advisor, text } = STAGE_BRIEFINGS[stage];
  const profile = ADVISOR_PROFILES[advisor];
  const root = document.createElement('section');
  root.className = 'recipe-brief';
  const words = document.createElement('div');
  const who = document.createElement('b');
  who.textContent = `${profile.name} · ${profile.role}`;
  const line = document.createElement('p');
  line.textContent = text;
  words.append(who, line);
  root.append(advisorVoice(advisor, 40), words);
  return root;
}

function choiceRow(label, options, value, onPick) {
  const root = document.createElement('div');
  root.className = 'recipe-choice-row';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', label);
  const name = document.createElement('div');
  name.className = 'recipe-choice-label';
  name.textContent = label;
  const chips = document.createElement('div');
  chips.className = 'recipe-chips';
  for (const option of options) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'recipe-chip';
    chip.setAttribute('aria-pressed', `${option.value === value}`);
    chip.disabled = Boolean(option.disabled);
    chip.title = option.title ?? '';
    const text = document.createElement('span');
    text.textContent = option.label;
    const detail = document.createElement('small');
    detail.textContent = option.detail;
    chip.append(text, detail);
    chip.addEventListener('click', () => onPick(option.value));
    chips.append(chip);
  }
  root.append(name, chips);
  return root;
}

function reactionFor(stage, values) {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const shares = values.map((value) => value / total);
  if (stage === 'post' && shares[1] > 0.5) return FOCUS_REACTIONS.valuesCapped;
  const moves = shares.map((share, index) => share - FOCUS[stage][index].start / 100);
  const biggest = moves.reduce((best, move, index) => (Math.abs(move) > Math.abs(moves[best]) ? index : best), 0);
  if (Math.abs(moves[biggest]) < 0.08) return FOCUS_REACTIONS.balanced;
  return FOCUS_REACTIONS[FOCUS[stage][biggest].id][moves[biggest] > 0 ? 'high' : 'low'];
}

// Game Dev Tycoon's focus sliders: three weights whose shares fill one time bar.
function focusBlock(stage, currentDraft, onChange) {
  const root = document.createElement('section');
  root.className = 'recipe-focus';
  const sliders = document.createElement('div');
  sliders.className = 'recipe-focus-sliders';
  const bar = document.createElement('div');
  bar.className = 'recipe-allocation-bar';
  const label = document.createElement('div');
  label.className = 'recipe-allocation-label';
  label.textContent = 'Time allocation';
  const reaction = document.createElement('p');
  reaction.className = 'recipe-reaction';
  reaction.setAttribute('aria-live', 'polite');
  const values = () => currentDraft().focus[stage];
  const shares = () => {
    const total = values().reduce((sum, value) => sum + value, 0) || 1;
    return values().map((value) => Math.round((value / total) * 100));
  };
  const segments = FOCUS[stage].map((slider, index) => {
    const segment = document.createElement('span');
    segment.className = FOCUS_COLOURS[stage][index];
    bar.append(segment);
    return segment;
  });
  let lastReaction = null;
  const render = () => {
    const current = shares();
    segments.forEach((segment, index) => {
      segment.style.flex = `${Math.max(current[index], 0.01)} 1 0%`;
      // About 6.5px a character at 11px bold across a bar about 610px wide.
      const room = (current[index] / 100) * 610 - 16;
      const full = `${FOCUS[stage][index].name} ${current[index]}%`;
      segment.textContent = full.length * 6.5 <= room ? full : room >= 26 ? `${current[index]}%` : '';
    });
    bar.setAttribute('aria-label', FOCUS[stage].map((slider, index) => `${slider.name} ${current[index]} percent`).join(', '));
    const said = reactionFor(stage, values());
    if (said !== lastReaction) {
      lastReaction = said;
      const words = document.createElement('span');
      words.textContent = said.text;
      reaction.replaceChildren(advisorVoice(said.advisor, 26), words);
      reaction.classList.remove('fresh');
      void reaction.offsetWidth;
      reaction.classList.add('fresh');
    }
  };
  FOCUS[stage].forEach((slider, index) => {
    sliders.append(vslider({
      label: slider.name,
      value: values()[index],
      min: 0,
      max: 100,
      step: 1,
      colour: FOCUS_COLOURS[stage][index],
      formatValue: () => '',
      ariaValueText: () => `${shares()[index]} percent of this stage's time`,
      onInput(value) {
        currentDraft().focus[stage][index] = value;
        render();
        onChange();
      },
    }));
  });
  render();
  root.append(sliders, label, bar, reaction);
  return root;
}

function costText(card, era) {
  const words = cardCostWords(card, era);
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

export function techniquePanel(state, stage, draft, onChange, { cardNote, onPicked } = {}) {
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
    empty.textContent = 'No techniques are available yet.';
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
      cost.textContent = costText(card, state.era);
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
        if (!picked) onPicked?.(card);
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
    estimate.textContent = 'Estimate: the model you release will take some compute to serve.';
    meter.append(estimate);
  }

  const facts = document.createElement('div');
  facts.className = 'recipe-cost-facts';
  const cash = document.createElement('span');
  cash.textContent = preview.cost?.cash ? `Cash ${money(preview.cost.cash)}` : 'No cash cost';
  const turns = document.createElement('span');
  const count = preview.cost?.turns ?? 0;
  turns.textContent = `Takes ${roundsToWords(state.era, count)}`;
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
      }, {
        cardNote: (card) => (card.opens ? cardOpeners.get(card.opens)?.note?.(nextState, card) ?? null : null),
        onPicked: (card) => { if (card.opens) cardOpeners.get(card.opens)?.open?.(game, card); },
      }));
      footerSlot.replaceChildren(computeFooter(nextState, preview, releaseBeforeRun()));
      error.textContent = capitaliseError(preview.errors[0]);
      const subtitle = opened?.querySelector('.subt');
      if (subtitle) subtitle.textContent = `${workingName(nextState, draft)} / ${STAGE_NAMES[stageId]}`;
      const startButton = opened?.querySelector('.dialog-ok');
      if (startButton && number === 3) startButton.title = capitaliseError(preview.errors[0]);
    };

    centre.append(briefing(stageId));
    if (number === 1) {
      const note = document.createElement('p');
      note.className = 'recipe-slider-note';
      const sizeRow = () => choiceRow('Model size', SIZES.filter((size) => size !== 'xl' || state.era >= 2).map((size) => ({
        value: size,
        label: SIZE_NAMES[size],
        detail: computeAmount(SIZE_UNITS[size] * eraScale(state.era), state.era),
      })), draft.sliders.size, (size) => {
        draft.sliders.size = size;
        const moved = ['large', 'xl'].includes(size) && draft.sliders.length === 'heavy';
        if (moved) draft.sliders.length = 'over';
        note.textContent = moved
          ? 'Heavily overtrained is only available for small or medium models, so training length moved to Overtrained.'
          : '';
        rows.replaceChildren(sizeRow(), lengthRow());
        refresh();
      });
      const lengthRow = () => choiceRow('Training length', Object.keys(LENGTHS).map((length) => {
        const blocked = length === 'heavy' && ['large', 'xl'].includes(draft.sliders.size);
        return {
          value: length,
          label: LENGTH_NAMES[length],
          detail: LENGTHS[length].turns ? `+${roundsToWords(state.era, LENGTHS[length].turns)}` : 'No extra time',
          disabled: blocked,
          title: blocked ? 'Heavily overtrained needs a small or medium model' : '',
        };
      }), draft.sliders.length, (length) => {
        draft.sliders.length = length;
        note.textContent = '';
        rows.replaceChildren(sizeRow(), lengthRow());
        refresh();
      });
      const rows = document.createElement('div');
      rows.className = 'recipe-choices';
      rows.append(sizeRow(), lengthRow());
      centre.append(rows, note);
    }
    draft.focus ??= {};
    draft.focus[stageId] ??= startFocus(stageId);
    centre.append(focusBlock(stageId, () => draft, () => {
      draft = sanitizeDraft(projected(), draft);
      refresh();
    }));

    const capRow = number === 3 ? genevaCapRow(game.state) : null;
    body.append(centre, footerSlot, error);
    const nextStage = number === 1 ? (state.era < 2 ? 3 : 2) : 3;
    const previousStage = number === 3 ? (state.era < 2 ? 1 : 2) : 1;
    opened = openDialog(overlayRoot, {
      title: `Training run · Stage ${stagesFor(state.era).indexOf(stageId) + 1}`,
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
        const breakCap = capRow?.querySelector('input')?.checked === true;
        const result = game.addMove({ type: 'startRun', recipe: draft, ...(breakCap && { breakDeal: true }) });
        if (!result.ok) {
          error.textContent = capitaliseError(result.error);
          return;
        }
        rememberedDrafts.set(game, cloneDraft(draft));
        opened.close();
      },
    });
    opened.classList.add('recipe-dialog', `recipe-dialog-stage-${number}`);
    if (capRow) opened.append(capRow);
    refresh();
  }

  showStage(stage);
  return opened;
}

export function mountRecipe(game, overlayRoot) {
  return registerMenuHandler('training', () => openRecipe(game, overlayRoot));
}
