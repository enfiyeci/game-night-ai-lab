import { openDialog } from '../components/dialog.js';
import { teamPanel } from '../components/team.js';
import { vslider } from '../components/vslider.js';
import { projectQueue } from '../logic/compute.js';
import { money } from '../logic/format.js';
import {
  PRICE_NAMES, PRICE_STOPS, REASONING_NAMES, REASONING_STOPS, SIZE_ORDER,
  canSkip, laterMoveProblem, nextGeneration, perMillion, pricePerMillion, releaseDraft, releaseOpinions,
  queueBeforeRelease, releasePayload, releasePreview, releaseSpec, shipDelay, shipWords, withCard,
} from '../logic/release.js';
import { tierWord } from '../../sim/release.js';
import { registerMenuHandler } from '../menu.js';
import { techniquePanel } from './recipe.js';

const remembered = new WeakMap();
const SIZE_LABELS = { small: 'Small', medium: 'Medium', large: 'Large', xl: 'Extra large' };

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

export function openRelease(game, overlayRoot, { stage } = {}) {
  const projected = () => projectQueue(game.state, queueBeforeRelease(game.queue));
  let draft = releaseDraft(projected(), remembered.get(game));
  let opened;
  // Editing an already-queued release replaces it in place rather than spending a second move.
  const isEditing = game.queue.moves.some((move) => move.type === 'release');

  // `fromMain` is true only when this step was reached via "Rename sizes" inside the main dialog,
  // where there is a main dialog to return to with the draft intact. On the very first release
  // (nothing remembered yet, entered directly) there is no main dialog behind it, so cancelling
  // closes the whole flow as before.
  function showSizes(fromMain = false) {
    const body = el('div', 'release-sizes');
    body.append(el('p', 'release-note', 'You name these once. Every model takes one from its size, like Kestrel 4 Core.'));
    const inputs = {};
    for (const size of SIZE_ORDER) {
      const label = el('label', 'release-size');
      label.append(el('span', 'lbl', SIZE_LABELS[size]));
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `release-size-${size}`;
      input.maxLength = 16;
      input.value = draft.tierWords[size];
      label.append(input);
      inputs[size] = input;
      body.append(label);
    }
    opened = openDialog(overlayRoot, {
      title: 'Name your model sizes',
      subtitle: 'Small, medium, large and extra large models each get a word',
      body,
      okLabel: 'Save sizes',
      backLabel: fromMain ? 'Back' : undefined,
      onBack: fromMain ? () => showMain() : undefined,
      onCancel: fromMain ? () => showMain() : undefined,
      onOk() {
        for (const size of SIZE_ORDER) draft.tierWords[size] = inputs[size].value.trim() || tierWord(size);
        showMain();
      },
    });
    opened.classList.add('release-dialog', 'release-dialog-sizes');
  }

  function showMain() {
    const state = projected();
    const model = state.pendingModel;
    const body = el('div', 'release-body');
    const leftContent = el('div');
    const rightContent = el('div');

    // Name: family (typed), number (automatic), size word (from the model's size).
    body.append(el('div', 'lbl release-heading', 'Name'));
    const nameRow = el('div', 'release-name');
    const familyField = el('label', 'release-field');
    familyField.append(el('span', 'lbl', 'Family (you type it)'));
    const family = document.createElement('input');
    family.type = 'text';
    family.id = 'release-family';
    family.maxLength = 24;
    family.placeholder = 'Type a family name';
    family.value = draft.family;
    familyField.append(family);
    const numberField = el('div', 'release-field');
    numberField.append(el('span', 'lbl', 'Number'));
    const number = el('div', 'release-auto');
    numberField.append(number);
    const sizeField = el('div', 'release-field');
    sizeField.append(el('span', 'lbl', 'Size'));
    sizeField.append(el('div', 'release-auto', draft.tierWords[model?.size ?? 'medium']));
    nameRow.append(familyField, numberField, sizeField);

    const skipLabel = el('label', 'release-skip');
    const skip = document.createElement('input');
    skip.type = 'checkbox';
    skip.id = 'release-skip';
    skip.checked = draft.skip;
    skip.disabled = !canSkip(state);
    skipLabel.append(skip, el('span', null, 'Skip ahead a number'));
    const skipWarning = el('span', 'release-skip-warning', '· critics expect a bigger leap, and the feed will talk about it');
    skipLabel.append(skipWarning);

    const preview = el('div', 'release-preview');
    const previewName = el('b');
    const rename = el('button', 'release-link', 'Rename sizes');
    rename.type = 'button';
    rename.addEventListener('click', () => showSizes(true));
    preview.append('It will ship as ', previewName, ' · ', rename);
    body.append(nameRow, skipLabel, preview, el('div', 'rule'));

    // Price and thinking effort sliders.
    const sliders = el('div', 'release-sliders');
    const priceSlot = el('div');
    const thinkingSlot = el('div');
    sliders.append(priceSlot, thinkingSlot);
    body.append(sliders);

    const shipLine = el('div', 'release-shipline');
    const error = el('div', 'dialog-error release-error');
    error.setAttribute('role', 'alert');
    body.append(shipLine, error);

    const priceSlider = () => {
      const spec = releaseSpec(state, draft.picks, draft.reasoning);
      if (spec.channel === 'open') {
        return el('p', 'release-note', 'Open weights are a free download. There is no price to set.');
      }
      return vslider({
        label: 'Price',
        role: 'CFO',
        value: PRICE_STOPS.indexOf(draft.price),
        min: 0,
        max: PRICE_STOPS.length - 1,
        step: 1,
        colour: 'wood',
        formatValue: (value) => PRICE_NAMES[PRICE_STOPS[value]],
        ariaValueText: (value) => PRICE_NAMES[PRICE_STOPS[value]],
        notches: PRICE_STOPS.map((stop, index) => {
          const price = pricePerMillion(spec, state.era, stop);
          return {
            value: index,
            label: PRICE_NAMES[stop],
            detail: stop === 'free' ? 'ads and upgrades' : price === null ? 'free download' : `${perMillion(price)} per M tokens`,
          };
        }),
        onInput(value) {
          draft.price = PRICE_STOPS[value];
          refresh();
        },
      });
    };

    const thinkingSlider = () => {
      if (!model?.spec?.reasoningCapable) return el('p', 'release-note', 'This model cannot think longer. Train with reasoning RL to unlock thinking effort.');
      return vslider({
        label: 'Thinking effort',
        role: 'Head of Research',
        value: REASONING_STOPS.indexOf(draft.reasoning),
        min: 0,
        max: REASONING_STOPS.length - 1,
        step: 1,
        colour: 'coral',
        formatValue: (value) => REASONING_NAMES[REASONING_STOPS[value]],
        ariaValueText: (value) => REASONING_NAMES[REASONING_STOPS[value]],
        notches: REASONING_STOPS.map((stop, index) => ({ value: index, label: REASONING_NAMES[stop] })),
        onInput(value) {
          draft.reasoning = REASONING_STOPS[value];
          priceSlot.replaceChildren(priceSlider()); // per-token prices depend on thinking effort
          refresh();
        },
      });
    };

    function refresh() {
      const now = projected();
      const check = releasePreview(game.state, game.queue, draft);
      number.textContent = `${nextGeneration(now, draft.skip)}`;
      number.classList.toggle('skipped', draft.skip);
      skipWarning.hidden = !draft.skip;
      previewName.textContent = check.name;
      const when = el('span', null, 'Ships ');
      when.append(el('span', `release-when ${check.delay > 0 ? 'later' : 'now'}`, shipWords(check.delay, game.state.era)));
      shipLine.replaceChildren(
        when,
        el('span', null, `${check.cash > 0 ? `Costs ${money(check.cash)}` : 'No cash cost'} · ${isEditing ? 'replaces your queued release' : 'uses 1 of your 2 moves'}`),
      );
      error.textContent = check.errors[0] ?? '';
      leftContent.replaceChildren(teamPanel(now, { opinions: releaseOpinions(now, draft) }));
      rightContent.replaceChildren(techniquePanel(now, 'release', { picks: { release: draft.picks } }, (picks) => {
        draft.picks = picks;
        priceSlot.replaceChildren(priceSlider()); // the channel changes per-token prices
        refresh();
      }, {
        cardNote: (card) => (card.group === 'eval'
          ? { text: `Ships ${shipWords(shipDelay(now, withCard(draft.picks, card)), game.state.era)}`, later: shipDelay(now, withCard(draft.picks, card)) > 0 }
          : null),
      }));
      const ok = opened?.querySelector('.dialog-ok');
      if (ok) ok.textContent = `Release ${check.name}`;
    }

    family.addEventListener('input', () => {
      draft.family = family.value;
      refresh();
    });
    skip.addEventListener('change', () => {
      draft.skip = skip.checked;
      refresh();
    });

    priceSlot.append(priceSlider());
    thinkingSlot.append(thinkingSlider());

    opened = openDialog(overlayRoot, {
      title: 'Release a model',
      subtitle: `Trained in era ${state.era} · ${model?.spec?.reasoningCapable ? 'a reasoning model' : 'a standard model'}`,
      left: { title: 'Team', content: leftContent },
      right: { title: 'Release choices', content: rightContent },
      body,
      okLabel: 'Release',
      backLabel: 'Back',
      onBack: () => opened.close(),
      onOk() {
        const check = releasePreview(game.state, game.queue, draft);
        if (!check.ok) {
          error.textContent = check.errors[0];
          return;
        }
        const move = { type: 'release', release: releasePayload(projected(), draft) };
        const moves = game.queue.moves.map((queued) => structuredClone(queued));
        const index = moves.findIndex((queued) => queued.type === 'release');
        // Check the whole queue as it would be, so a changed release cannot silently break a later move
        // (for example a training run that no longer fits the cash left after a pricier evaluation).
        const after = { ...game.queue, moves: index < 0 ? [...moves, move] : moves.map((queued, at) => (at === index ? move : queued)) };
        const problem = laterMoveProblem(game.state, game.queue, after);
        if (problem) {
          // The release itself already passed the check above, so a problem here means a move
          // queued after it (for example a training run that no longer fits the cash left after
          // a pricier evaluation) would fail.
          error.textContent = `A move queued after the release would fail: ${problem}`;
          return;
        }
        let result;
        if (index < 0) result = game.addMove(move);
        else {
          // Replace the queued release in place: a training run queued after it depends on it.
          for (let at = moves.length - 1; at >= index; at -= 1) game.removeMove(at);
          result = game.addMove(move);
          const rest = result.ok ? moves.slice(index + 1) : moves.slice(index);
          for (const queued of rest) game.addMove(queued);
        }
        if (!result.ok) {
          error.textContent = result.error[0].toUpperCase() + result.error.slice(1);
          return;
        }
        remembered.set(game, structuredClone(draft));
        opened.close();
        // The release applied at once and its reveal is already open; closing this dialog moved focus behind it.
        // While the launch show plays there is no Continue yet, so the reveal panel takes focus.
        (overlayRoot.querySelector('.reveal-layer .reveal-continue') ?? overlayRoot.querySelector('.reveal-layer .reveal'))?.focus();
      },
    });
    opened.classList.add('release-dialog');
    refresh();
    family.focus();
  }

  // Sizes are named once: skip that step when this session already saved a release draft with its words.
  if (stage === 'sizes' || (stage !== 'main' && !game.state.tierWords && !remembered.has(game))) showSizes();
  else showMain();
  return opened;
}

export function mountRelease(game, overlayRoot) {
  return registerMenuHandler('release', () => openRelease(game, overlayRoot));
}
