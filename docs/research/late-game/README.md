# Late game: bigger eras 4 and 5, a fight for the world, more releases

Lane `gn-late-game`, 2026-10-27. Asked by Arda on 2026-10-26: (6) more model releases and (7) eras 4 and 5 much
bigger, ending in a fight for world dominance. Research and design only; no game code was changed.

## Reading order

1. **Raw** (unverified; kept for provenance, cite the report instead): `research_notes/Late game escalation and
   dominance/`, six notes written by research subagents (Sonnet), each ending with its own coverage statement.
   - `strategy_4x_late_game.md`: Civilization V-VII, Stellaris crises, Terra Invicta, Soren Johnson's Old World notes.
   - `narrative_survival_board_late_game.md`: Plague Inc., Frostpunk 1 and 2, Twilight Struggle (GMT rulebook), Suzerain.
   - `scenarios_2027_2030.md`: AI 2027 and its 2025-2026 revisions, Situational Awareness, Epoch AI, AI 2040.
   - `governments_us_china.md`: state control of labs, export controls, summits, the MAIM escalation ladder.
   - `world_dominance.md`: decisive strategic advantage, AI-enabled coups, gradual disempowerment, the intelligence
     curse, GATE, and how games score several victory routes.
   - `release_cadence.md`: the labs' 2023-2026 release and deprecation history, Mad Games Tycoon 2, Game Dev Story.

   One caution applies to all six: the fetch tool returned a model-written extract of each page, not raw text, so
   quoted words are the extract's wording. Each note flags its partial reads with ⚠️ on the claim.
2. **Distilled:** `reports/Late game escalation and dominance.md`, the synthesis (Opus report writer), with ten design
   patterns for Game Night and a merged coverage statement. Flags carry over on the claims. It fills the thin
   tycoon half of `release_cadence.md` from the earlier `docs/research/release-flow/`.
3. **Options and mockups:** `docs/design/mockups/late-game/` (picker page, frames and captures). Published picker:
   https://claude.ai/artifact/7txBkceGHqTDX6vyZrak6E

## Notable catches

- **The calendar is part of the problem.** Era 5 is four weeks of January 2027, which ends before every published
  scenario's decisive months (AI 2027: theft in February 2027, the vote in October). Its authors now say reality runs
  at about 70-90% of the scenario's speed (⚠️ summarizer read).
- **Few era 5 releases is realistic for four weeks.** At the labs' 2026 pace, a four-week window holds about one
  release per lab; more releases need a longer finale or a smaller release unit (a checkpoint).
- **The frontier barely grows in era 5.** The compute-race spec sets it at 400 units in era 4 and 450 in era 5;
  Epoch's projections point to two to five times era 4 for 2027 (⚠️ summarizer read).
- **Unreachable:** RAND's pages (403), any CSET or GovAI publication, the Game Dev Tycoon wiki (402), Bostrom's
  chapter 5, and Paradox's own Stellaris crisis diary. The government and military sections are the thinnest.
- **Real-name caution:** the governments note covers the 2026 dispute between the Pentagon and Anthropic (the maker of
  the model that wrote these notes); it is reported only from cited coverage, and the game keeps its own fictional
  labs and president.
