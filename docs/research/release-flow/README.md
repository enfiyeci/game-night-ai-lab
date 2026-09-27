# Release flow research (plan 2B Task 6)

Research behind the release dialog and the release reveal, gathered 2026-09-26 before any mockup.
Four Sonnet research passes wrote the notes; the orchestrating session read all four end to end,
checked the in-repo claims against the files, and wrote the suggestions.

## Reading order

1. `our-plans-and-code.md` — what the plan, spec, sim and UI already decide or provide. Start here.
2. `game-dev-tycoon-release.md` — Game Dev Tycoon's release, review, sales and report beats.
3. `other-tycoon-games-release.md` — Game Dev Story, Mad Games Tycoon 2, Software Inc., Startup
   Company and Big Pharma, with a cross-game table.
4. `ai-lab-and-tech-games-release.md` — AI-lab and tech-strategy games, plus how real frontier-model
   launches are structured.
5. `suggestions-2026-09-26.md` — the release-flow suggestions offered to the owner, each tied to
   its source.
6. `reveal-juice-2026-09-26.md` — later the same day: how comparable games stage a results reveal
   (animation, number count-ups, sound), the four playable options shown, and the owner's pick
   (one benchmark at a time plus a leaderboard climb). Also records that the critics score 9 or 10
   on almost every simulated release.

What came of it: the owner's picks are at the end of `suggestions-2026-09-26.md`, the final mockup
is `docs/design/mockups/release-flow-final.html` (with two PNGs), and the build plan is
`docs/superpowers/plans/2026-09-26-release-flow.md`.

The three web-research notes are unverified raw output: each one lists its coverage and marks
with ⚠️ every claim that rests on a partial read or a search summary. Cite the checked claims in
`suggestions-2026-09-26.md`, not the raw notes.

## Notable catches

- The plan's Task 6 names three price stances (cheap, market, premium); the sim accepts four
  (`premium`, `market`, `undercut`, `free` in `sim/serving.js`) and rejects anything else.
- The spec (§6b) says a generation jump raises the launch bar and an empty rebrand draws mockery;
  the sim does neither, so the plan's "jump" toggle has no effect today.
- The K2 mockup's badge copy reads "5 of 5"; the sim's `launch.beats` counts the four capability
  benchmarks only, and the plan says "N of 4", hidden on the first release.
- A release preview uses a fixed random seed (`ui/logic/compute.js`), so the dialog must not
  promise benchmark or press numbers before the turn ends.
- Game Dev Tycoon has no Hall of Fame or awards show; those belong to Kairosoft's Game Dev Story.
  Search results conflate the two.
- The critics give 9 or 10 on almost every simulated release, even ones that lose to the rival
  (`reveal-juice-2026-09-26.md`), so the reveal's critic scores rarely disappoint.
