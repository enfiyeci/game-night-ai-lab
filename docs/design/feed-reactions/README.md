# Feed reactions

What the 100 feed personas (`docs/design/feed-personas.md`) post about everything that happens in
a run: each era, each model release, each rival release, each event card and each public choice,
plus a smaller set of everyday posts that have nothing to do with AI. Drafted 2026-09-26 at the
owner's request; content for review, not yet wired into `sim/data/feed.js`.

## Files, in the order a run meets them

| File | Covers | Posts |
|---|---|---|
| `eras-company-mood.md` | the five era starts, the lab's company news, public mood crossing a line, AI background posts for quiet turns | 94 |
| `releases.md` | launch day by flag, channel, critics, price, thinking effort, servers, version jump, rank, testing, artists; the weeks after; all four rivals' small and big releases | 152 |
| `event-cards.md` | 42 event cards (25 from `events.js`, all 11 in `events6c.js`, all 6 board events): when each breaks, and each public choice. The 26th, the President's promise call, is in `president-summit-finale.md` | 330 |
| `president-summit-finale.md` | both President meetings by answer style, promises coming due, the era 5 summit, the finale choices | 102 |
| `everyday.md` | non-AI posts: hobbies, family, work, sport | 91 (about 12%) |
| **Total** | | **769** |

Every post comes from one of the 100 personas, and every persona posts at least twice. The
commentators post most (`@anon_staffer`, Kay Swanick, the governance and safety voices, 20–27
posts each); hobby accounts post mostly in `everyday.md`.

## Conventions

- `{model}` is the model involved (usually the player's newest); `{lab}` is the player's lab name.
  `{name}` in the finale section is the model's name, as in `sim/data/finale.js`. `{rival}` in
  the summit section is the rival lab the checks caught or accused.
- Each event card already opens with its own post (`card.post` in the sim data) and may have a
  warning post; those are not repeated here. These files add the crowd's reaction around them.
- **When it breaks** posts appear when the event becomes public. **If you pick …** posts appear
  after the player's choice, only for choices the public would see. Events inside the lab (a loss
  spike, the model tampering with its oversight) only reach the feed as a `rumour` from
  `@anon_staffer` or `@crab_apple_leaks`, or when a choice makes them public.
- Each post keeps its persona's voice from the persona file: Rex's emoji and one-liners, Bill's
  capitals and signature, Nia's "Once again:", Gerald Marsh's "as I predicted", Tamsin's error
  bars, Wes's lowercase and ":)".
- `everyday.md` posts marked *(season)* suit a time of year and can be matched to the in-game
  month. Suggested rule: at most one everyday post per turn, and none on a launch or crisis turn.

## Sources read

All read in full on 2026-09-26 from the `ui` branch (the integration branch with the newest event
cards) unless noted: `sim/data/events.js`, `events6c.js`, `boardEvents.js`, `cards.js`,
`launch.js`, `eras.js`, `feed.js`, `president.js`, `promises.js`, `constitution.js`,
`automation.js`, `eventTiming.js`, `compute.js`, `finale.js`, `sim/rivals.js`, and `summit.js`
from the `summit-design` branch.

## Things to know before wiring this in

- The President posts quote the current placeholder answers in `sim/data/president.js` ("Mr.
  Great President", "bury Beijing", "calling me buddy"). The owner is writing that dialogue; if
  the answers change, those posts change with them.
- The posts keyed to the President's answer styles need the sim to report which answers were
  given; it does not today (see the note in `president-summit-finale.md`).
- Event content is still moving on unmerged branches. A card added or renamed after 2026-09-26
  will need its own reactions.
- Wiring is a separate job: turn each section into templates keyed by the sim's triggers, the way
  `sim/data/feed.js` does, and let `sim/feed.js` pick from them.
