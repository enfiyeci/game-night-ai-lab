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
