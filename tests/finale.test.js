import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../sim/state.js';
import { ENDINGS } from '../sim/endings.js';
import { FINALE_DECKS, CITIZENSHIP_CARD } from '../sim/data/finale.js';
import { finaleDeck, buildFinale, resolveFinale } from '../sim/finale.js';

const finaleState = (ending = 'aligned', lumenName = 'Lumen') => {
  const state = createInitialState();
  state.ending = ending;
  state.lumenName = lumenName;
  return state;
};

test('finaleDeck maps only the four surviving endings', () => {
  const finaleEndings = {
    aligned: 'stewardship',
    pacingDeal: 'temptation',
    pyrrhic: 'technofeudal',
    overtaken: 'raceToBottom',
  };
  for (const id of Object.keys(ENDINGS)) {
    assert.equal(finaleDeck(id), finaleEndings[id] ?? null, id);
  }
  assert.equal(finaleDeck('constructor'), null);
});

test('buildFinale gives the five deck cards in order and citizenship last', () => {
  const state = finaleState('aligned', 'Beacon');
  assert.deepEqual(buildFinale(state), {
    deck: 'stewardship',
    cards: [
      {
        id: 'worldBody',
        title: 'World body',
        prompt: 'Governments ask you to hand the model to an international body.',
        choices: [{ id: 'agree', label: 'Agree' }, { id: 'keep', label: 'Keep control' }],
        fallback: 'keep',
      },
      {
        id: 'openSafety',
        title: 'Open safety',
        prompt: 'Publish your safety research for everyone?',
        choices: [{ id: 'publish', label: 'Publish' }, { id: 'secret', label: 'Keep it in-house' }],
        fallback: 'secret',
      },
      {
        id: 'helpRival',
        title: 'Help a rival',
        prompt: 'Lodestar is far behind and asks for your alignment methods.',
        choices: [{ id: 'help', label: 'Share them' }, { id: 'refuse', label: 'Refuse' }],
        fallback: 'refuse',
      },
      {
        id: 'aiStrategy',
        title: 'AI strategy',
        prompt: "Beacon offers to run the lab's strategy from now on. It would do it better.",
        choices: [{ id: 'accept', label: 'Let it' }, { id: 'decline', label: 'Decline' }],
        fallback: 'decline',
      },
      {
        id: 'pause',
        title: 'Pause',
        prompt: 'Pause further scaling while the world catches up?',
        choices: [{ id: 'pause', label: 'Pause' }, { id: 'scale', label: 'Keep scaling' }],
        fallback: 'scale',
      },
      {
        id: 'citizenship',
        title: 'AI citizenship',
        prompt: 'An AI party asks: should Beacon get legal rights?',
        choices: [
          { id: 'yes', label: 'Grant them' },
          { id: 'no', label: 'Refuse' },
          { id: 'abstain', label: 'Stay out of it' },
        ],
        fallback: 'abstain',
      },
    ],
  });
  assert.equal(buildFinale(finaleState('aligned', null)).cards[3].prompt.includes('Lumen'), true);
  assert.equal(buildFinale(finaleState('misuse')), null);
});

test('buildFinale renders replacement-pattern characters in the AI name literally', () => {
  for (const name of ['$&', '$$', '$`']) {
    const { cards } = buildFinale(finaleState('aligned', name));
    assert.equal(cards[3].prompt, `${name} offers to run the lab's strategy from now on. It would do it better.`);
    assert.equal(cards[5].prompt, `An AI party asks: should ${name} get legal rights?`);
  }
});

test('resolveFinale preserves every chosen consequence without crowding the film title', () => {
  const state = finaleState('aligned');
  const result = resolveFinale(state, {
    worldBody: 'keep',
    openSafety: 'publish',
    helpRival: 'help',
    aiStrategy: 'accept',
    pause: 'pause',
    citizenship: 'yes',
  });
  assert.equal(result.tag, 'mixed');
  assert.equal(result.tagText, null);
  assert.equal(result.fullTitle, 'Aligned success');
  assert.deepEqual(result.tags, ['heldAlone', 'openSafety', 'helpedRivals', 'aiRun', 'pause']);
  assert.equal(result.legacy.length, 6);
  assert.equal(result.citizenship, 'granted');
  assert.deepEqual(result.picks, [
    { cardId: 'worldBody', choiceId: 'keep', auto: false },
    { cardId: 'openSafety', choiceId: 'publish', auto: false },
    { cardId: 'helpRival', choiceId: 'help', auto: false },
    { cardId: 'aiStrategy', choiceId: 'accept', auto: false },
    { cardId: 'pause', choiceId: 'pause', auto: false },
    { cardId: 'citizenship', choiceId: 'yes', auto: false },
  ]);
});

test('resolveFinale uses the clean tag when no chosen choice carries a tag', () => {
  const result = resolveFinale(finaleState('pacingDeal'), {
    sideDeal: 'report',
    hiddenCluster: 'disclose',
    qilinData: 'ask',
    automation: 'hold',
    ourTerms: 'keep',
    citizenship: 'abstain',
  });
  assert.equal(result.tag, 'held');
  assert.equal(result.tagText, 'and the deal held');
  assert.equal(result.fullTitle, 'A negotiated pace — and the deal held');
  assert.equal(result.citizenship, 'abstained');
});

test('missing, unknown and inherited ids use fallbacks marked automatic', () => {
  const choices = Object.create({ stealWeights: 'steal', deepfake: 'run' });
  choices.deepfake = 'constructor';
  choices.poison = 'poison';
  choices.cutSafety = 'keep';
  choices.fakeBench = 'truth';
  choices.citizenship = 'no';
  const result = resolveFinale(finaleState('overtaken'), choices);
  assert.deepEqual(result.picks, [
    { cardId: 'stealWeights', choiceId: 'no', auto: true },
    { cardId: 'deepfake', choiceId: 'refuse', auto: true },
    { cardId: 'poison', choiceId: 'poison', auto: false },
    { cardId: 'cutSafety', choiceId: 'keep', auto: false },
    { cardId: 'fakeBench', choiceId: 'truth', auto: false },
    { cardId: 'citizenship', choiceId: 'no', auto: false },
  ]);
  assert.equal(result.tag, 'sabotage');
  assert.equal(result.citizenship, 'denied');
});

test('citizenship can be granted, denied or abstained', () => {
  for (const [choice, citizenship] of [['yes', 'granted'], ['no', 'denied'], ['abstain', 'abstained']]) {
    assert.equal(resolveFinale(finaleState('overtaken'), { citizenship: choice }).citizenship, citizenship);
  }
  const inherited = Object.create({ citizenship: 'yes' });
  const automatic = resolveFinale(finaleState('overtaken'), inherited);
  assert.equal(automatic.citizenship, 'abstained');
  assert.deepEqual(automatic.picks.at(-1), { cardId: 'citizenship', choiceId: 'abstain', auto: true });
});

test('finale functions do not mutate state and are deterministic', () => {
  const state = finaleState('pyrrhic', 'Beacon');
  const before = structuredClone(state);
  const choices = { taxOffice: 'accept', citizenship: 'yes' };
  assert.deepEqual(buildFinale(state), buildFinale(state));
  assert.deepEqual(resolveFinale(state, choices), resolveFinale(state, choices));
  assert.deepEqual(state, before);
  assert.equal(resolveFinale(finaleState('acquihire'), choices), null);
});

test('every finale prompt and choice label contains no digits', () => {
  const cards = [
    ...Object.values(FINALE_DECKS).flatMap(({ cards }) => cards),
    CITIZENSHIP_CARD,
  ];
  for (const card of cards) {
    assert.equal(/\d/.test(card.prompt), false, `${card.id} prompt`);
    for (const choice of card.choices) {
      assert.equal(/\d/.test(choice.label), false, `${card.id}:${choice.id} label`);
    }
  }
});


test('every authored epilogue consequence and clean legacy is reachable through legal choices', () => {
  for (const ending of ['aligned', 'pacingDeal', 'pyrrhic', 'overtaken']) {
    const deck = FINALE_DECKS[finaleDeck(ending)];
    let combinations = [{}];
    for (const card of [...deck.cards, CITIZENSHIP_CARD]) {
      combinations = combinations.flatMap((choices) => card.choices.map((choice) => ({ ...choices, [card.id]: choice.id })));
    }
    const reached = new Set();
    for (const choices of combinations) {
      const result = resolveFinale(finaleState(ending), choices);
      result.tags.forEach((tag) => reached.add(tag));
      assert.equal(result.picks.some((pick) => pick.auto), false);
      assert.equal(result.legacy.length, 6);
      assert.ok(result.legacy.every((outcome) => outcome.text.length > 0));
      for (const card of deck.cards) {
        const choice = card.choices.find((choice) => choice.id === choices[card.id]);
        if (choice.tag) assert.ok(result.tags.includes(choice.tag.id), `${ending}:${card.id} must remain visible`);
      }
    }
    const expected = [deck.cleanTag.id, ...deck.cards.flatMap((card) => card.choices.flatMap((choice) => choice.tag ? [choice.tag.id] : []))];
    assert.deepEqual([...reached].sort(), expected.sort(), ending);
  }
});

test('careful stewardship requires shared oversight, open safety, help, human accountability and a pause', () => {
  const choices = { ...FINALE_DECKS.stewardship.cleanChoices, citizenship: 'yes' };
  const state = finaleState('aligned', 'Beacon');
  assert.equal(resolveFinale(state, choices).tag, 'steward');
  assert.equal(resolveFinale(state, choices).legacy.at(-1).text, 'Beacon receives legal rights.');
  for (const card of FINALE_DECKS.stewardship.cards) {
    const alternative = card.choices.find((choice) => choice.id !== choices[card.id]);
    assert.notEqual(resolveFinale(state, { ...choices, [card.id]: alternative.id }).tag, 'steward');
  }
});
