# Model appeal research: how other games keep "what to build" a real choice

Lane `gn-model-appeal`, 2026-09-26. Asked by the owner during the brainstorm on what makes a model popular and
profitable, after they pointed out that a fixed "hot product per era" plus era-unlocked features would be a checklist,
not a choice.

Three Opus research subagents wrote the notes; each note is saved verbatim with the subagent's own coverage statement
and ⚠️ marks. Web pages were read through a fetch tool's summarising model, not as raw text, so every note is a
secondary summary of its sources.

## Reading order

1. `notes/choice_design_principles.md` — Sid Meier's "interesting decisions", Soren Johnson on dominant strategies,
   Into the Breach and deterministic design, Plague Inc, Slay the Spire, Universal Paperclips, Frostpunk, legible
   scoring. Ends with a ten-test checklist for a real decision.
2. `notes/tycoon_product_games.md` — Mad Games Tycoon 2, Game Dev Story, Software Inc., Big Pharma, Automation.
3. `notes/market_competition_games.md` — Offworld Trading Company, Motorsport Manager, Food Chain Magnate, Power Grid,
   Brass: Birmingham, Capitalism Lab.

Game Dev Tycoon is covered separately in `docs/research/ai-lab-mechanics/notes/game_dev_tycoon.md`.

## Notable catches

- A fixed fit table gets solved and then repeated (Game Dev Story's late game, Mad Games Tycoon 2 players reading the
  answers from a data file). Fit is a skill floor, not a strategic choice.
- Crowding relative to rivals is the device that keeps product choice open in nearly every game studied, and it must
  be visible and must recover (Big Pharma's markets that never recover are the warning case).
- A flat anti-repetition penalty reads as punishment; a cost that rises with the behaviour reads as natural (Mad Games
  Tycoon 2's "bored fans" against its saturation; Civilization IV's per-city maintenance).
- Even small hidden noise makes a fit system feel random (Game Dev Tycoon, Software Inc.); visible maths builds trust
  (Civilization IV's combat odds, Automation's side-by-side panel against the top three rivals).
