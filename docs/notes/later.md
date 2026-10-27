# Do if we have time later

Ideas the owner liked but parked until the core game is done. Each entry says what it is, why it was parked, and
enough of the design to pick it up cold.

## Call a board member before a meeting (parked 2026-09-26)

**What it is.** Between two board meetings, the player can call one director. The call narrows that director's
support band on the board screen, so the player knows better where they stand before the vote.

**The catch (owner: "there must be some other gotcha to it ... you cant call everybody").**
- One call between meetings, not one per director.
- A call can backfire. If the thing that director cares about is going badly, hearing from the CEO reminds them, and
  their support drifts further away. Calling the mission trustee while public trust is falling makes her firmer
  against you.
- Optional extra, not agreed: the candor watchdog dislikes backchannels, so calling anyone else costs a little
  support with her.

**Why it was parked.** The owner liked it but put it on this list on 2026-09-26, after picking the rest of the board
design (the meeting call, the board screen with its "what moves them" tab, uncertain support bands, deals before the
vote, a warning a month ahead, and pre-meeting events).

**Where it came from.** Terra Invicta shows councilor loyalty as an "apparent" estimate and sells certainty at a cost
(`docs/research/lab-boards/game-board-screens-2026-09-26.md`, section 9).

**What building it would touch.**
- The board screen (L1) gets a "Call" button on each row, disabled once the call is used.
- The staff-read band for that director narrows (a smaller spread) until the next meeting.
- The sim needs a per-meeting "call used" flag and the backfire rule: compare the director's issue trend (the same
  links the "what moves them" tab draws) and nudge support away when it is going badly.
- Real time: "between meetings" is the stretch from one meeting's date to the next, not a count of turns.

## Rethink every ending (parked 2026-10-27)

**What it is.** Every ending gets redesigned and rethought in its own long session. Nothing is built for it now.

**The one firm want (owner: "i do want the ending where your consitution demands what kind of future you get when ai
takes over").** When the AI takes over, the player's constitution decides what kind of future the world gets. A
constitution that put honesty or human oversight first would give a different world from one that put winning first,
so the takeover reads as the result of the player's own written rules.

**Why it was parked.** The owner wants to do all endings together in one dedicated session, not piece by piece
(2026-10-27). The ending clips' "KESTREL" fix waits for that session too (owner: "yeah later, take a note of it").

**Known issue for that session.** The ending clips have "KESTREL" baked into the billboards
(`tools/endings/blender/skyline.py`, the `VARIANT` billboard blocks around lines 329-343), so they cannot show the
player's lab name. Fix it when the clips are re-rendered.

**Research for the redesign.** `docs/research/endings/` (2026-10-27, lane gn-endings-research; start with its
`README.md`, then `report.md`; branch `research/endings`, commit d6d6038, not on main yet): what today's endings read,
twelve constitution-shaped futures keyed to the hard lines, fifteen techniques for visibly earned endings, ten
questions for the session, and the KESTREL re-render cost (about 3 to 3.5 hours). Two of its findings touch the core
game: no ending reads the constitution today, and `learnedConstitution` (`sim/constitution.js`) is never called; and
the quiet takeover is rare for the bots (0 of 2,600 balance runs; `tools/ending-reachability.js` finds it only past
its default 100 seeds, at seed 163 of the "unchecked" policy, which `tests/fixtures/ending-witnesses.json` records).

**What building it would touch.**
- The constitution mechanic: `sim/constitution.js` (the era 3 constitution, set in Safety's draft) and its lines, which
  the takeover ending would read.
- The takeover endings in `sim/endings.js` (`misalignment`, `quietTakeover`) and the rest of the ending list there.
- The ending films and their tooling: `tools/endings/` (Blender scenes, plates, sound) and `ui/endings/`.
