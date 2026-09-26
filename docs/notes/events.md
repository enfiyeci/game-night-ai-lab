# Event notes

Ideas for event cards that the owner asked for but nobody has designed or built yet. Each note says where the idea came
from and what in the sim it would hook into. When an idea gets built, delete its note here and link the commit.

## State attorney general sets conditions on a restructure

- **Asked for:** by the owner on 2026-09-26, during the board redesign.
- **Real basis:** in October 2025 the California and Delaware attorneys general let OpenAI restructure only on
  conditions. Directors must weigh only the mission on safety questions, the safety committee can halt a model
  release, and the attorneys general get notice before governance changes. See
  `docs/research/lab-boards/real-lab-boards-2026-09-26.md`, the section "What the attorneys general imposed".
- **Sim hook:** the `structureChange` emergency option in `sim/economy.js` (`useEmergency`) is the restructure. It
  sets `flags.conversionDeadline`, and `sim/turn.js` fires the `conversionFight` event when the deadline passes. The
  attorney general's card would land between those two points.
- **Not decided:** which conditions the player can accept or fight, and what each one costs.

## The Pentagon blacklists the lab

- **Asked for:** by the owner on 2026-09-26, during the board redesign.
- **Real basis:** in March 2026 the Pentagon named Anthropic a "supply chain risk" after it refused to drop limits on
  surveillance and autonomous weapons, and a federal judge blocked the designation. See the section "Other labs and
  oversight bodies" in the same research doc.
- **Sim hook:** the sim already has a silent version. `flags.supplyChainRisk` is set when the player gives the
  President no flattery (`sim/president.js`) or refuses a promise to the President (`sim/promises.js`). It closes the
  Gulf compute deal and darkens Gulf contracts (`sim/contracts.js`), but no card tells the player. This event would
  make the blacklist visible, and the security hawk on the board (`sim/board.js`) already reacts when US favor falls.
- **Not decided:** whether the player can fight it in court (as Anthropic did) and what that costs.
