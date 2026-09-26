# Do if we have time later: events

Part of the "do if we have time later" pile (`docs/notes/later.md` on `board-redesign`). Kept in its own file so the
events lane and the board lane don't edit the same file at once.

## Events from what plausibly could happen (parked 2026-09-26)

**What it is.** The events pass was meant to draw each era's cards from two sources: things that really happened in
the AI industry, and things that plausibly could happen, grounded in documented near-misses and credible forecasts.
This entry is the second source.

**Why it was parked.** On 2026-09-26, after seeing the era 1 candidates, the owner said: "for now lets only have the
real events then we will do the rest, add it to do later after the demo pile". The events pass for the demo covers
real events only.

**What it covers when picked up.**
- **Escalated near-misses.** A documented incident taken one step further than it went in reality: the model that lied
  to a TaskRabbit worker chains the trick overnight and rents its own compute; the hacked internal forum becomes a
  weight theft; memorised training data leaks a named person's details. Era 1's thirteen, each with what is documented
  and what would be invented, are in `docs/research/era-events/era1/raw-near-misses.md`.
- **Forecast events for time that hasn't happened yet.** Era 4 after September 2026 and all of era 5 (2028 on) have no
  real history to draw from, so their cards would come from forecasts (for example Epoch AI's trend work and lab
  leaders' published timelines). None of this research has been done yet.

**What building it would touch.** Nothing new: these are ordinary rows in `sim/data/events.js`, with copy in
`ui/data/eventCopy.js` and timing in `sim/data/eventTiming.js`, like the real-event cards. Each card should say plainly
in the research record which part is documented and which part is the game's invention.

**One consequence for the demo.** Era 5 is set after today, so with real events only its seven cards reuse the most
recent real events that match its themes (2025–2026); see `docs/research/era-events/era5/`.

## Stolen model weights (parked 2026-09-26)

The weight-theft crisis had no real event behind it. The owner picked option B: the card now stands for the real
OpenAI internal-forum breach (early 2023, revealed July 2024), and the stolen-weights version, with its boost to the
Eastern rival, waits here with the other plausible-future events. The `stealWeights` effect in `sim/data/events.js`
is the piece to bring back if this is picked up.
