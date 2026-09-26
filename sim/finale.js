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
  let winningTag = null;
  let citizenship;

  for (const card of [...deck.cards, CITIZENSHIP_CARD]) {
    const suppliedId = Object.hasOwn(supplied, card.id) ? supplied[card.id] : undefined;
    const suppliedChoice = card.choices.find((choice) => choice.id === suppliedId);
    const selected = suppliedChoice ?? card.choices.find((choice) => choice.id === card.fallback);
    picks.push({ cardId: card.id, choiceId: selected.id, auto: suppliedChoice === undefined });
    if (selected.tag && (winningTag === null || selected.tag.priority > winningTag.priority)) {
      winningTag = selected.tag;
    }
    if (selected.citizenship) citizenship = selected.citizenship;
  }

  const selectedTag = winningTag ?? deck.cleanTag;
  const endingId = state.ending;
  const tagText = selectedTag.text;
  return {
    endingId,
    deck: deckId,
    tag: selectedTag.id,
    tagText,
    fullTitle: `${ENDINGS[endingId].title} — ${tagText}`,
    citizenship,
    picks,
  };
}
