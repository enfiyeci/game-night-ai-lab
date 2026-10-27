# Reward loops and event cadence (2026-10-26)

Research for lane `gn-reward-loops`, after Arda asked how to build the "dopamine loop": event recurrence, core loops
and reward pacing, how other games do it, and what Game Night should change. It answers the playtest line "at times
there were so many decisions to make that it overwhelmed me and then there were weeks when nothing happened"
(`docs/playtests/2026-10-14-itch-feedback.md`). Research and design only: no game code changed.

## Reading order

1. **Raw, unverified:** `notes/`. One file per research track, each ending in a coverage statement; ⚠️ marks claims
   resting on less than a whole source. Six tracks were written by Sonnet research subagents, so their findings are
   the subagents' readings of sources, not re-read here.
   - `todays_loops.md`: the current game's loops, measured on `main` 28cdc52 with `tools/pacing/measure.mjs` (40 seeds,
     careful and balanced bots), a hand-played run of era 1 and early era 2, and a code inventory. Written by the
     orchestrating session; the most directly sourced note.
   - `event_cadence_and_pacing.md`: Left 4 Dead's AI Director, RimWorld's storytellers, Paradox event scheduling.
   - `loop_theory_and_evidence.md`: core and compulsion loops, reward schedules, what the dopamine evidence supports.
   - `tycoon_and_management_games.md`: Game Dev Tycoon, Two Point Hospital, Frostpunk.
   - `card_roguelite_narrative_games.md`: Reigns, FTL, Slay the Spire, Balatro, Hades, 80 Days, Citizen Sleeper.
   - `idle_incremental_games.md`: Universal Paperclips, Cookie Clicker, A Dark Room, Pecorella's idle-game math.
   - `ethics_and_teaching_games.md`: dark patterns, regulation, Bad News and Harmony Square.
2. **Distilled:** `report.md`. Synthesis of all seven notes by an Opus subagent, with an evidence-versus-folk-wisdom
   table, cadence targets and a merged coverage section. Cite the report or the notes' sources, not this README.
3. **Options:** `options.md`. Seven loop and cadence changes (O1-O7, safe to experimental) with the recommended
   combination, written by the orchestrating session from the report and the notes.
4. **Picker:** `picker/reward-loops-picker.html` with `picker/img/` (real 1440×900 captures of `main`). Published for
   Arda as a private artifact; his picks are saved in the artifact's database.

## Notable catches

- The "empty weeks" are mostly a calendar effect: gaps of 50-60 s of running clock read as seven or eight blank story
  weeks in eras 1-2, where a story day lasts one second.
- The core loop nearly vanishes in era 5: no careful-bot training run finishes there and 0.3 reveals happen per game.
- The release reveal's reaction posts are picked by release count, so a second release repeats the first one's posts;
  the era intro's written "what changes" bullets are never shown; the board vote has no sound.
- No source gives a number of decisions per minute for any real-time game. Every cadence target in `report.md` and
  `options.md` is scaled from a named source's ratios and needs bot runs and a playtest.
- "Decision fatigue" as used-up willpower failed a 23-lab replication (⚠️ abstract only), and dopamine tracks wanting
  and prediction error, not pleasure; the "dopamine loop" framing is mostly folk wisdom.
- Most fetches went through a tool that returns a model-written extract, not raw text; the notes and the report mark
  these "(extract)". Fandom wikis returned HTTP 402 throughout.
- The research found no source on how AI labs tune their own products for engagement (one fetch returned 403).
