import { ENDINGS } from './endings.js';
import { FINALE_DECKS, CITIZENSHIP_CARD } from './data/finale.js';

const ENDING_DECKS = {
  aligned: 'stewardship',
  pacingDeal: 'temptation',
  pyrrhic: 'technofeudal',
  overtaken: 'raceToBottom',
};

export function finaleDeck(endingId) {
  return typeof endingId === 'string' && Object.hasOwn(ENDING_DECKS, endingId)
    ? ENDING_DECKS[endingId]
    : null;
}

const render = (text, state) => text.replaceAll('{name}', () => state.lumenName ?? 'Lumen');

const publicCard = (card, state) => ({
  id: card.id,
  title: render(card.title, state),
  prompt: render(card.prompt, state),
  choices: card.choices.map(({ id, label }) => ({ id, label: render(label, state) })),
  fallback: card.fallback,
});

export function buildFinale(state) {
  const deck = finaleDeck(state.ending);
  if (deck === null) return null;
  return {
    deck,
    cards: [...FINALE_DECKS[deck].cards, CITIZENSHIP_CARD].map((card) => publicCard(card, state)),
  };
}

export function resolveFinale(state, choices) {
  const deckId = finaleDeck(state.ending);
  if (deckId === null) return null;

  const deck = FINALE_DECKS[deckId];
  const supplied = choices !== null && (typeof choices === 'object' || typeof choices === 'function')
    ? choices
    : {};
  const picks = [];
  const consequences = [];
  const legacy = [];
  let citizenship;

  for (const card of [...deck.cards, CITIZENSHIP_CARD]) {
    const suppliedId = Object.hasOwn(supplied, card.id) ? supplied[card.id] : undefined;
    const suppliedChoice = card.choices.find((choice) => choice.id === suppliedId);
    const selected = suppliedChoice ?? card.choices.find((choice) => choice.id === card.fallback);
    picks.push({ cardId: card.id, choiceId: selected.id, auto: suppliedChoice === undefined });
    legacy.push({ cardId: card.id, title: render(card.title, state), text: render(selected.consequence, state) });
    if (selected.tag) consequences.push({ cardId: card.id, ...selected.tag });
    if (selected.citizenship) citizenship = selected.citizenship;
  }

  const clean = deck.cleanChoices
    ? Object.entries(deck.cleanChoices).every(([cardId, choiceId]) => picks.some((pick) => pick.cardId === cardId && pick.choiceId === choiceId))
    : consequences.length === 0;
  const selectedTag = clean ? deck.cleanTag : consequences.length === 1 ? consequences[0] : null;
  const endingId = state.ending;
  const tagText = selectedTag?.text ?? null;
  return {
    endingId,
    deck: deckId,
    tag: selectedTag?.id ?? 'mixed',
    tags: [...(clean ? [deck.cleanTag.id] : []), ...consequences.map(({ id }) => id)],
    consequences,
    legacy,
    tagText,
    fullTitle: tagText ? `${ENDINGS[endingId].title} — ${tagText}` : ENDINGS[endingId].title,
    citizenship,
    picks,
  };
}
