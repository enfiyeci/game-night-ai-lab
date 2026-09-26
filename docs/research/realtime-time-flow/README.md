# Real-time time flow research (2026-09-26)

Research for turning Game Night's 20 discrete turns into a running clock, after the owner picked
"Real time, like Game Dev Tycoon" on 2026-09-26.

Reading order:

1. `notes/` — raw research, one file per question. Each note ends with a coverage statement;
   claims read through search summaries or summarized fetches carry ⚠️.
   - `game_dev_tycoon_time.md`: how Game Dev Tycoon's clock, pauses, events and money work over time.
   - `turn_to_realtime_patterns.md`: how RimWorld, Paradox games, Frostpunk and others run a clock
     over a fixed tick, and how they replace a per-turn action cap.
   - `our_turn_assumptions.md`: every place in `sim/`, `ui/`, the spec and the plans that assumes
     turns, with file:line citations.
2. `report.md` — the synthesis: four ways to go real time (A clock over the unchanged engine,
   B plan-then-play, C instant actions, D week-by-week simulation) and which can ship by the
   2026-09-27 submission.
3. `suggestions-2026-09-26.html` (with `img/`) — the owner's pick page, published as
   https://claude.ai/artifact/SthgBQiha5yccwFxpxtSEm. Pictures come from
   `docs/design/mockups/K2-realtime.html` over a real era-2 save (seed 10).

Notable catches:

- Vanilla Game Dev Tycoon has no pause, play or fast buttons; speed is a one-time game-length
  choice (⚠️ three agreeing sources, all read through summaries).
- Auto-pause on every card and dialog is required, not optional: `endTurn` auto-resolves any
  unanswered card with its fallback (`sim/turn.js:182-188`) and treats an unanswered President
  meeting as a walkout (`sim/turn.js:228-234`).
- Round length shrinks 12× from era 1 to era 5 (`sim/data/eras.js`), while most random rolls are
  flat per turn, so a constant-speed calendar would make era-5 surprises about 13× as frequent.

## Owner's picks (2026-09-26)

- 1D, built in stages (the owner asked how Game Dev Tycoon does it, then chose its model). Stage 1,
  for the 1 PM demo: a weekly clock, instant actions, team slots, weekly money and progress, and
  card deadlines in story days enforced by the sim. Stage 2, after the trailer: move rival
  launches, lawsuits, promises and era changes from hidden round marks onto the weekly clock, and
  retune the balance.
- 2A: each era takes the same real time (about 3 minutes at ×1).
- 3C: each team does one thing at a time, with 2 new actions per quarter, month or week for now
  ("we will balance it out").
- 4C: no skip button; pause, ×1, ×2 and ×4 only.
- Warnings don't pause the clock; only cards that need an answer do.
