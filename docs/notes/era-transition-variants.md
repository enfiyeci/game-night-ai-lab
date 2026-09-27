# Era-transition options awaiting owner selection

Built from `origin/ui` at `a76020e`, after fetching and verifying the requested anchor `04650e0ade1b8a57741c3c74d03f112413a2635d`. Work branch: `codex/era-transition-variants`.

- **A — The briefing:** a full-screen editorial spread using `eraIntro` headline, current changes, bottleneck and pace. Optional ink-reveal motion.
- **B — Moving day:** the outgoing office becomes a keepsake photograph while the incoming office takes the stage; an advisor speaks from their desk. Optional office-move motion.
- **C — First morning:** an experimental operations note, research sticky note and coffee over a darkened office. The era arrives as work on the player's desk. Optional lights-on motion.

Use `?eraTransition=A`, `B`, or `C`. Missing or invalid values retain existing behavior. Screens trigger on successful `eraStart` events only, never at a fresh game start. No future-era roadmap or gate text is shown. Each pauses the clock synchronously, waits for active dialogs/board meetings, and restores the selected speed after dismissal. Escape, the primary button, and focus containment use the existing dialog component. Motion plays only when requested and respects reduced-motion preferences.

## Reproduce

Run `node tools/era-transition-shots.mjs` with Node 22+ and Chrome installed. Set `CHROME` to an alternate Chrome executable if needed. The script starts a temporary localhost server and headless browser; all fixture states come from real sim actions. It advances 1→2 with `game.advanceDays(1)` and completes the actual board meeting for 2→3, 3→4 and 4→5. `VARIANTS=B` or `ERAS=2,4` limits a rerun. `GALLERY_ONLY=1` rebuilds the comparison sheet from existing captures.

Artifacts: `shots/era-transitions/index.html`, `comparison.png`, twelve option screenshots at 1440×900 and 1000×700, default screenshots, and `verification.json`. These are ignored by Git. The desktop checkout's `shots/era-transitions/` contains a delivery copy.

Interactive debug routes: `?scenario=beforeEra2&seed=1&eraTransition=A` (first transition after one story day) or `?scenario=beforeEra4&seed=1&eraTransition=B` (join the board meeting, call the vote, then return to work). `beforeEra3` and `beforeEra5` cover the other gates. Add `&paused` for a stable pre-gate state.

## Validation

The 16-combination browser matrix (default/A/B/C × all four gates) passed with no browser exceptions or console errors. The harness checks pause reason, keyboard focus, button/Escape dismissal, manual pause preservation, reduced motion, opt-in animation, and a frozen story day while the screen is open. An additional B run checks ×4 restoration. Both requested transitions were inspected at both viewport sizes. Read-only review approved after fixing copied SVG gradient IDs and using the canonical advisor names.

The base-build full suite reported 1,091 passing, 2 failing and 5 TODO tests. The two failures are difficulty targets in `tests/balance.test.js` and `tests/compute-balance.test.js`; base-commit reproduction is recorded in the handoff completion note.

## Next action

Owner picks **A**, **B**, or **C**. Keep every option and the unchanged default until that choice. The handoff's Claude orchestrator then applies the design-skill check and removes the losing variants. Do not push without the owner's authorization.
