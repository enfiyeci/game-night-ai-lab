# Era-by-era event research

Research for the events pass: which event cards each of the five eras holds. Started 2026-09-26 in
the gn-events lane. Each era gets its own folder, filled in order as the owner picks.

## Reading order per era

1. `candidates.md`: the distilled candidate list put to the owner (start here).
2. `raw-*.md`: the research subagents' reports, unverified by the orchestrator, each with its own
   coverage statement. Cite `candidates.md`, not these.
3. `picks-page.html` (era 1) and `../picks-page-eras-2-5.html`: the review pages the owner picks from
   (published as private artifacts). Eras 2 to 5 come from `tools/eras.py` through `tools/build.py`,
   which also writes each era's `candidates.md`.
4. `picks.md` (once the owner answers): the owner's decisions for that era.

## Owner decisions that apply to every era (2026-09-26)

- Each era has a pool of 8–10 cards; one run shows 4–5.
- Two or three anchors land near their real date in every run; the rest fire only when the
  player's own choices set them up.
- Real events only, for now: "for now lets only have the real events then we will do the rest". Events drawn
  from plausible futures (escalated near-misses, forecasts) are parked in `docs/notes/later-events.md`.

## The demo list

`event-list.html` is the full, script-free list of all 48 kept cards (era 1: 10; era 2: 11; eras 3 and
4: 10 each; era 5: 7), built by `tools/build_static.py`. It opens in any viewer, including previews that
block scripts.

## Era 5 note

Era 5 is set after today, so its cards reuse the most recent real events that match its themes
(2025–2026). Its research agent hit a tool limit; the orchestrator re-checked the key items (see the
verification section at the end of `era5/raw-real-events.md`). A widely repeated story that a pacing
truce collapsed with releases 90 minutes apart on September 22, 2026 rests on one Substack post and
was left out.

## Notable catches

- Era 1: the fake-citation card can't fire in era 1 today, because only reasoning training (era 2
  and later) plants the hallucination flag, yet the real case is from June 2023.
- Era 1: the copyright card is gated to era 2 and later, but spec §3 already puts scraped-data
  lawsuits in era 1, and the real suits were filed in July and December 2023.
- Era 1: `flattery` and `companion` have real cases from 2025 and 2024, so the timing rule moves
  them to eras 3 and 2.
