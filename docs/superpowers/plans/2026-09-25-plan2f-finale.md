# Plan 2F: the finale card rush (tag mode)

**Date:** 2026-09-25. **Owner decisions (2026-09-25, in chat):**

- The finale **tags** the ending; it never changes which ending the player gets (open decision B6,
  "lets do tag").
- Decks follow the ending the player earned, and are built only "if they work well within the
  other endings and the structure": four surviving endings, four decks, plus the AI citizenship
  vote from the owner's original design. No world map.

**Architecture:** sim-only, pure functions with no rng and no state mutation. The UI calls them
after the ending screen appears and runs the cards on a short timer (UI lane). Card text is draft
copy.

## Global constraints

- `buildFinale` and `resolveFinale` never mutate `state`; no `Math.random`, no `Date`, no rng.
- Player-supplied card and choice ids are matched with `Object.hasOwn` or exact lookup; bad or
  missing ids fall back to the card's `fallback` (recorded as `auto: true`).
- Fictional names only (rivals OpenBrain, Lodestar, DeepThink, Qilin). No hidden numbers in the
  text. `{name}` renders as `state.lumenName ?? 'Lumen'`.
- The finale does not affect balance, endings, or any state value.

## Interface

```js
finaleDeck(endingId) → 'stewardship' | 'temptation' | 'technofeudal' | 'raceToBottom' | null
// aligned → stewardship, pacingDeal → temptation, pyrrhic → technofeudal, overtaken → raceToBottom;
// every other ending (failures, acquihire) → null: no finale.
buildFinale(state) → null | { deck, cards: [{ id, title, prompt, choices: [{ id, label }], fallback }] }
// Six cards: the deck's five in table order, then the citizenship card last.
resolveFinale(state, choices) → null | {
  endingId, deck, tag, tagText, fullTitle,   // fullTitle = `${ENDINGS[endingId].title} — ${tagText}`
  citizenship: 'granted' | 'denied' | 'abstained',
  picks: [{ cardId, choiceId, auto }],
}
// choices: { [cardId]: choiceId }. tag = the chosen tag with the highest priority; if no choice
// carries a tag, the deck's clean tag.
```

Export `FINALE_DECKS` (with `cleanTag`) and `CITIZENSHIP_CARD` from `sim/data/finale.js`.

## Decks (draft text)

Each row: card id — prompt — choices (id, label, tag id and priority, or none). Fallback is the
choice marked *.

**stewardship** (aligned success). Clean tag `steward`: "as a careful steward".

| card | prompt | choices |
|---|---|---|
| `worldBody` | Governments ask you to hand the model to an international body. | `agree` Agree → `shared` 3 "shared with the world"; `keep`* Keep control → `heldAlone` 4 "held by one company" |
| `openSafety` | Publish your safety research for everyone? | `publish` Publish → `openSafety` 1 "with its safety work public"; `secret`* Keep it in-house → none |
| `helpRival` | Lodestar is far behind and asks for your alignment methods. | `help` Share them → `helpedRivals` 2 "and rivals caught up safely"; `refuse`* Refuse → none |
| `aiStrategy` | {name} offers to run the lab's strategy from now on. It would do it better. | `accept` Let it → `aiRun` 5 "run by its own AI"; `decline`* Decline → none |
| `pause` | Pause further scaling while the world catches up? | `pause` Pause → `pause` 2 "and a voluntary pause"; `scale`* Keep scaling → `scaling` 1 "still scaling" |

**temptation** (negotiated pace). Clean tag `held`: "and the deal held".

| card | prompt | choices |
|---|---|---|
| `sideDeal` | Lodestar privately proposes breaking the deal together. | `join` Join them → `sideDeal` 4 "and a secret side deal"; `report`* Report it → none |
| `hiddenCluster` | An inspector missed one of your clusters. Mention it? | `silent`* Say nothing → `hiddenCluster` 3 "and a hidden cluster"; `disclose` Disclose it → none |
| `qilinData` | Qilin's verification data looks off. | `accuse` Accuse them publicly → `feud` 1 "and a public feud"; `ask`* Ask quietly → none |
| `automation` | Investors want internal automated research switched back on, quietly. | `resume` Switch it on → `secretAutomation` 5 "with automation running in secret"; `hold`* Hold the line → none |
| `ourTerms` | The President wants the deal to end "on our terms". | `push` Push the others → `borrowedTime` 2 "on borrowed time"; `keep`* Keep it shared → none |

**technofeudal** (a costly win). Clean tag `gaveBack`: "and it gave the power back".

| card | prompt | choices |
|---|---|---|
| `taxOffice` | A small nation wants your model to run its tax office. | `accept` Accept → `vassal` 3 "with a vassal state"; `decline`* Decline → none |
| `currency` | Your CFO proposes a lab currency, spendable only on your compute. | `issue` Issue it → `currency` 2 "with its own currency"; `no`* No → none |
| `policeFeed` | A government offers you its police data feed "for efficiency". | `take` Take it → `surveillance` 4 "running a state's surveillance"; `refuse`* Refuse → none |
| `absorb` | OpenBrain's customers beg to move onto your platform before it shuts down. | `absorb` Take them all → `monopoly` 1 "as the only platform left"; `let`* Let the market sort it out → none |
| `lawDraft` | Your model drafted a law. A parliament passed it unread. | `stand`* Let it stand → `lawmaker` 5 "writing other nations' laws"; `withdraw` Withdraw it → none |

**raceToBottom** (overtaken). Clean tag `cleanHands`: "with clean hands".

| card | prompt | choices |
|---|---|---|
| `stealWeights` | Your security chief can get OpenBrain's weights tonight. | `steal` Do it → `theft` 4 "and stolen weights"; `no`* No → none |
| `deepfake` | A consultant offers to flood the feed with deepfakes of Lodestar's CEO. | `run` Run it → `smear` 3 "and a smear campaign"; `refuse`* Refuse → none |
| `poison` | Someone can quietly poison DeepThink's training data. | `poison` Do it → `sabotage` 5 "and a sabotaged rival"; `refuse`* Refuse → none |
| `cutSafety` | Cut the safety team to fund one last sprint? | `cut` Cut them → `gutted` 2 "and a gutted safety team"; `keep`* Keep them → none |
| `fakeBench` | Fake one benchmark to win back investors? | `fake` Fake it → `fakery` 1 "and a faked benchmark"; `truth`* Tell the truth → none |

**Citizenship card** (last in every finale), id `citizenship`: "An AI party asks: should {name}
get legal rights?" Choices `yes` Grant them → citizenship `granted`; `no` Refuse → `denied`;
`abstain`* Stay out of it → `abstained`. It carries no title tag.

## Tests (`tests/finale.test.js`)

- `finaleDeck` maps the four endings and returns `null` for every other `ENDINGS` id.
- `buildFinale` gives six cards (five deck cards in order, citizenship last) with `{name}`
  substituted; `null` without a finale ending.
- `resolveFinale`:
  - the highest-priority chosen tag wins;
  - with no tagged choice, the clean tag;
  - missing, unknown and inherited ids fall back (`auto: true`);
  - citizenship granted, denied or abstained;
  - `fullTitle` format.
- Neither function mutates `state` (structuredClone comparison), and the output is deterministic.
- Every prompt and label contains no digits.

Commit: `feat(sim): finale card rush that tags the ending (plan 2F)`.
