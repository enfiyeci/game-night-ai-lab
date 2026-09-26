# Open decisions for the owner

As of 2026-09-25 ~1:30 PM PT. Grouped by what each one blocks. Each item gives the options, the
recommendation, and why it matters. Decided items move into the spec
(`docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md`) and get deleted here.

## A. Blocks the next build step (plan 2: screens and events)

1. **Visual design direction.** DECIDED 2026-09-25: look K2 (spec 7b); the rest of this item is kept for history. You choose the look. Proposal: bring 2–3 rendered directions
   through your `design` skill (taste profile, screenshot critique) and you pick one. Blocks
   every screen. Questions inside it: overall mood (a cozy Game Dev Tycoon office, a dark
   "war room" dashboard, a founder's-desktop OS like your NimbusOS slice); whether there is an
   animated office scene or only panels; how advisors look (portraits, icons, text only).
Decided 2026-09-25 and moved into the spec: era 5 pacing (spec 6e), misalignment during
development (spec 6d), the constitution format and amendment sources (spec 6), and the
difficulty target (spec 9).

## B. Needed before content writing

5. **President meetings.** DECIDED 2026-09-25: pick answers from nine styles, his agenda is the
   AI war against "the woke" and China, and promises come due (spec 6, plan 2E). Still open: the
   final dialogue (the owner writes it) and whether he stays fictional (recommended) or is named.
6. **Finale after era 5.** DECIDED 2026-09-25: tag mode, four decks plus the citizenship vote,
   no world map (spec 3, plan 2F).
7. **Humanoid line in era 4.** How it unlocks (a research technique, a channel, a separate
   product line), what it earns, and what its incidents look like (physical harm, recalls,
   labor backlash). Currently invented, not research-based.
   ON THE BACK BURNER (owner 2026-09-25): leaning towards a product line, or deals with outside
   humanoid companies instead of building one; only if time allows.
8. **A narrator character.** DECIDED 2026-09-25: Lumen, present all game (option a); spec 6.
9. **Launch reviewers.** DECIDED 2026-09-25: benchmarks plus a press panel of four parody critics (spec 6f).  The launch reveal shows four outlet scores. Use your five parody
   critics from the original design (PitchCrunch, Strategery, AI Snake Eyes, The Toe Rojen
   Experience, Æon Review — pick four), or new ones.
10. **Names.** Working title; rival labs (provisional: OpenBrain, Lodestar, DeepThink, Qilin);
    compute suppliers (Verde, Azuria, CoreFlame, a Gulf sovereign campus); model-name theme sets (birds, weather, music, stone, light,
    numbers).
    PARTLY DECIDED 2026-09-25 (owner): the player names their own lab, and the player names
    each released model by typing its family ("Kestrel" gives "Kestrel 3 Grand"; the number and
    size word are automatic, and the player names the four size words once for the lab). Still open: the game title, rival labs, suppliers, advisors.
11. **Onboarding.** Judges play once, quickly. Decide between a short guided first turn, an
    advisor-led tutorial, or a one-screen "how to play". Strongly affects the fun score.
12. **End-of-run reveal.** What it shows: the true hidden values over time next to each
    advisor's readings, which choices planted which incidents, a replay prompt ("try a
    different constitution").

Decided 2026-09-25 and moved into the spec: the advisor cast (spec 6), the feed's purpose
(spec 6).

## C. Submission logistics

13. **Hosting.** itch.io (free, HTML upload, public page) or GitHub Pages (the repo is private;
    Pages from a private repo needs a paid plan, or a separate public repo).
14. **Demo video (3–5 minutes).** Who records it, and the storyline to show (one run from
    founding to an ending, plus the reveal).
15. **AI-tool disclosure text.** Required by the hackathon; wording is yours.
16. **Solo or team.** Mangrove matches solo entrants to teams; decide whether to take a match.

## D. Scope if time runs short

17. Which deferred features are in or out (weight theft is IN, owner 2026-09-25, plan 2E): distilled sibling models, sound
    effects, music, a save button, mobile layout. Recommended cut order when behind: music →
    save → mobile → distilled siblings → weight theft.
18. **Open weights.** ON THE BACK BURNER (owner 2026-09-26): hidden for now; think about it again
    only if time allows. Today an open-weights release earns nothing (no users, no revenue, no
    serving cost) and only adds race heat, international favour and permanent misuse risk, so it
    is all downside for money (spec 6f). The idea to revisit: a separate "open-source an older
    model" action with its own payoff, modelled on how real labs earn from open models (hosted
    access to the same model, enterprise licences and support, fine-tuning services, licence terms
    for big competitors, goodwill and hiring). To bring the current option back, delete
    `hidden: true` from `channel-open` and `tamper` in `sim/data/cards.js`.

## E. The board (built 2026-09-26 on `board-redesign`; plan `docs/superpowers/plans/2026-09-26-board-ui.md`)

Everything below was decided during the build so it would not stall; each is a quick yes or no for the owner.

1. **Removal rates went up.** The six pre-meeting cards all cost support when nobody answers them, and the balance
   strategies never answer. Out of 200 runs each: speed 34 → 57 removed, hand-to-mouth 11 → 66, balanced 1 → 7,
   random 28 → 30; the others moved by 1 to 4. Nothing was retuned (owner defers balance). Offering every deal at
   every meeting also raises removals, because a broken deal loses that director for good.
2. **A third vote kind, "emergency".** The existing "board calls an emergency vote" card now records its vote as an
   emergency meeting, not a promise vote, so the meeting and result copy stop blaming a compute promise that was
   never made.
3. **One vote per meeting.** If an emergency vote is held in an era's last month, the era-end vote is skipped that
   round (it happened in 2 of 400 test runs). Before, both ran and the screen could show only one.
4. **Deals when a vote is put off.** If the lab is insolvent, a due vote waits a round. The meeting says "the vote
   is put off", and deals made stand; they are judged after the vote that is eventually held.
5. **Pronouns.** Board copy on the new screens uses they/them for every director. The six card texts keep the
   mockup frames' lines ("she will notice", "Walk him through the long plan"). Pick one.
6. **Deal wording.** "Security above 40" and "Public trust above 55" pass at exactly 40 and 55.
7. **What the board screen reads from true support.** The trend arrows and "Cooling fastest" follow real movement,
   not the staff read (no numbers are shown). Say if they should follow the read instead.
8. **The candor director can be dropped twice** if the cleaned-up safety report leaks while a candor deal is open
   (she is already capped below the vote line, so no vote changes).
9. **Owner copy.** Every director line, caption, joke, advisor line and consequence line is a placeholder marked
   `// OWNER WRITES` in `ui/data/boardCopy.js` and `ui/data/eventCopy.js`, including the lines for losing the vote.
10. **Not built:** the op-ed card's newspaper picture and the leak's toast from the mockups; calling a director
    (parked in `docs/notes/later.md`); the whistleblower card.
11. **Real time.** Ported before merging into `ui`: the meeting opens by itself on the last story day before a vote
    mark and holds the clock; the board's round-end work runs at the hidden round mark; the finance planner records a
    history row at each mark.
