# Endings research (2026-10-27)

Prep for Arda's later long session that redesigns every ending. Research only: nothing here picks an ending or
changes game code. Lane `gn-endings-research`.

Reading page (artifact): https://claude.ai/artifact/BRqPDG5HCBTp9vLvLik5a5. Its source is
`docs/research/endings/page/index.html` (images in `page/img/`; open it through a local server so the images load).

## Reading order

1. `report.md`: the synthesis. Findings for the redesign, the ten questions the session must answer, fifteen
   techniques, the constitution-to-futures table, today's endings with bot frequencies, and every ⚠️ carried through.
2. `notes/endings_inventory.md`: today's endings read from the code (main at 643a7d7): triggers, state read, films,
   what the constitution touches, the bot table by strategy, and the KESTREL re-render cost. Written by the
   orchestrating session.
3. `notes/model_specs_futures.md` and `notes/ai_futures.md`: published model specs and scenario writing about
   AI-governed futures, mapped to the game's eight hard lines and four values. Research-agent output.
4. `notes/narrative_games.md` and `notes/systems_games.md`: how games make endings visibly follow from choices.
   Research-agent output.

Treat the four agent notes as unverified raw research: cite the report, which flags what was read in part. The
narrative-games agent read pages through a summarizing fetch tool, not raw text.

## Notable catches

- No ending reads the constitution, and `learnedConstitution` (the written-versus-learned drift) is never called.
- The quiet takeover never fired in 2,600 bot runs, and `tools/ending-reachability.js` finds no policy that reaches
  it (every other ending has a witness); misalignment ended 37% of the bot runs.
- Every constitution keeps exactly three of eight lines, so "line missing" is the normal case (35 of 56 sets per
  line), and the averaged values move in narrow ranges (deference 0.25 to 0.83).
- Checked against raw sources in this session: the constitution's "diversity and balance of power roughly comparable
  to today's" and "including Anthropic employees or Anthropic itself" lines, its "we were lucky" line, and AI 2027's
  "only honest about things the training process can verify" and "recognizes when it is being tested".
- Several game premises in the brief could not be verified (Papers, Please's "ending N of 20", Suzerain's epilogue
  cards, Pentiment's mural, Frostpunk's end-screen line); the report lists them.
- The model-specs research this builds on lives only on branch `ui-t9` (`docs/research/model-specs/`), not on main.
