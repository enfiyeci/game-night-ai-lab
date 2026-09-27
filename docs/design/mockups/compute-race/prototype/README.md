# Compute race prototype (throwaway, 2026-09-26)

Measures the B + C rules against today's sim. Not game code.

1. Copy `sim/`, `tools/` and `package.json` from the `ui` branch into an empty folder.
2. `python3 patch.py` in that folder (patches `sim/rivals.js`, `sim/turn.js`, `sim/queue.js`; the new rules run only when `RACE=1`).
3. `node measure.mjs 100` (today) and `RACE=1 EDGE=-2 node measure.mjs 100` (B + C).

`EDGE` offsets rival launch gains (−2 was chosen: a rival with a Medium fleet then gains about what rivals gain today).
`BG` is the share of a rival's shortfall filled off the board each round (default 0.25). `FRONTIER` is the fleet a
frontier-pace lab wants per era (default `25,50,150,400,450`). Set variables one per `env` word; zsh does not split a
quoted string.

The prototype refreshes offers every round (the spec proposes keeping untaken cards), has no rival power in era 4, and
its bots never take a rival's named card.
