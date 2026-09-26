# Game Dev Tycoon (Greenheart Games, 2012) — Time Flow

Scope note: Game Dev Tycoon (GDT) has never published an official design document or engine
manual for its time system. Nearly everything below is either (a) the game's own reverse-engineered
code artifacts — the `Game_Flags` page and the modding API wiki, which quote literal variable names
and formulas and are treated as the strongest evidence available, (b) direct developer statements
quoted inside Steam/forum threads, or (c) community estimates and player reports, which are weaker
and labeled as such throughout. Two prior research passes in this project already covered GDT's
broader mechanics and secondary screens in depth (cited inline below as "prior full read" where I
lean on them rather than re-verify); this note is scoped specifically to how *time itself* flows.

## Unit of time, date format, weeks/months/years, real seconds per week, and speed settings

### Takeaway
GDT's calendar is Year/Month/Week (format `y/m/w`, e.g. `13/2/3`), and — critically — the shipped
game has **no in-game speed control at all**: the only "speed" lever is a one-time, pre-game choice
of how many total years the campaign will span, made via a gear/cog icon on the company-creation
screen and locked for the rest of that playthrough. One critic review states the base clock runs at
roughly 5 real seconds per in-game week, but this is a single source, not independently corroborated,
and there is no official confirmation of exact frame/tick timing.

### Cited Findings
- Date format is `y/m/w` (year/month/week), e.g. `13/2/3` — confirmed directly from the official
  modding API documentation's `Date` page — [Date, greenheartgames/gdt-modAPI Wiki (GitHub), via WebFetch](https://github.com/greenheartgames/gdt-modAPI/wiki/Date) ⚠️ WebFetch returns an AI-summarized extraction of the page, not raw text, so exact wording/completeness of the source page is not fully guaranteed, though the concrete syntax and table quoted appear precise.
- The same page documents three total-game-length options with named "game length modifiers" applied to every date-based scripted trigger: **30 years → modifier 1** (this is the baseline all in-engine dates are authored against), **35 years (the default) → modifier 1.16667**, **42 years → modifier 1.4**. A scripted date of `30/1/1` fires at `35/1/1` under the default setting or `42/1/1` under the extended setting, unless a given event sets `event.ignoreGameLengthModifier = true` — [Date, greenheartgames/gdt-modAPI Wiki (GitHub), via WebFetch](https://github.com/greenheartgames/gdt-modAPI/wiki/Date) ⚠️ same WebFetch-summarization caveat as above.
- **This conflicts with a second, directly-read source.** A Fandom-wiki community forum post (opened and read to the end in full, not summarized) states plainly: "The story ends at 25/30/35 years, depending on what you set it to. The actual game is infinite." — [How long is the game, Game Dev Tycoon Wiki Discussions (Fandom)](https://gamedevtycoon.fandom.com/f/p/2011745795178687335). A WebSearch synthesis of a separate Steam thread independently reports the same **25/30/35** framing ("25 years is 40% faster than the 35 years option") — [Can I slow down the game? Or increase the amount of years?, Greenheart Games Forum, via WebSearch synthesis](https://forum.greenheartgames.com/t/can-i-slow-down-the-game-or-increase-the-amount-of-years/1294). I cannot resolve this discrepancy: it may reflect the options changing between game versions (the modAPI wiki may document an older or newer build than the forum posts), or one side may simply be misremembering. Report this as an **unresolved, cross-source contradiction** rather than picking one.
- A Greenheart Games staff member ("Charlie @ Greenheart Games") directly confirmed in the official forum that the years setting is chosen via "a 'cog' icon" on the create-company screen, that it "control[s] how fast the game speed is (less years = faster game)," and that **it cannot be changed after game creation** without starting a new game — [Game Speed, Steam Community Discussions, via WebFetch](https://steamcommunity.com/app/239820/discussions/0/490123938428364475/) ⚠️ WebFetch summarization caveat.
- The game continues to run after the chosen year-count ends: "You can continue to play the game past 30 years. You just won't see any releases of new consoles or major events. Expos will continue indefinitely." — [Game Length, Steam Community Discussions, via WebFetch](https://steamcommunity.com/app/239820/discussions/0/1480982338955468057/) ⚠️ WebFetch summarization caveat; also corroborated independently by the Fandom forum post above ("The actual game is infinite").
- **There is no vanilla in-game pause/speed-multiplier UI (no 1×/2×/3× buttons).** This is corroborated by three independent sources: (1) a Steam thread titled "Game Speed" resolves, via the developer's own reply above, to "only one speed setting, configured at game start" with "no in-game adjustment option available"; (2) a community mod, TimeMod, exists specifically to add "four buttons to the game: pause, slow motion, play and fast" as a "SimCity-like" retrofit, implying the base game lacks them — [dgalaktionov/TimeMod, GitHub, via WebFetch](https://github.com/dgalaktionov/TimeMod) ⚠️ WebFetch summarization caveat, and the tool could not retrieve the mod's full README body, only its repository summary; (3) WebSearch of multiple Steam threads independently concludes "Game Dev Tycoon does not have built-in pause and speed control buttons... in the base game" — [WebSearch synthesis of Steam Community threads including "slow down time mod?" and "too fast gameplay"](https://steamcommunity.com/app/239820/discussions/0/1631916887482527517/).
- One reverse-engineered code flag corroborates that the game's clock is a genuine real-time render loop, not a discrete-turn engine: `SKIP_FRAME` (default false) — "When set to true, the game skips half of the canvas updates. The game speed isn't actually reduced, but only every second frame is displayed" — read directly in full from the wiki's own reverse-engineered flag list — [Game Flags, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/Game_Flags). The same page lists a flag `ghg65` (default value `9`) described only as "Indicates the length of a game's development" — the wiki gives no further explanation of what unit `9` is measured in (weeks? a per-stage multiplier?), so I list this as a raw, unexplained data point rather than a confirmed fact.
- A single game-review source states the base clock speed directly: "everything happens in real time but sped up to where a week will last around five seconds" — [Game Dev Tycoon (PC) Review, ZTGD, via WebFetch](https://ztgd.com/reviews/game-dev-tycoon/) ⚠️ WebFetch summarization caveat; this is the only source found with a concrete real-seconds-per-week figure, and it is a single critic's impression, not measured or officially documented. No second source corroborates the exact "~5 seconds" figure.
- No wiki page exists for a generic "Time" or "Speed" mechanic — navigating directly to `gamedevtycoon.fandom.com/wiki/Time` returns "There is currently no text in this page" — [Time, Game Dev Tycoon Wiki (Fandom), read directly via browser](https://gamedevtycoon.fandom.com/wiki/Time). This is a confirmed absence, not a failed fetch.

### Inferences
- Because there is no in-game speed multiplier, the "speed settings" a designer might expect (slow/normal/fast toggle during play) do not exist in GDT at all; the only lever is the pre-game total-length choice, which stretches *when* scripted content (new consoles, G3, research unlocks) fires across a longer or shorter calendar — it is a pacing-density knob, not a real-time-rate knob. Whether the underlying real-time-per-week clock rate itself changes between the 30/35/42-year settings (i.e., does a "week" still take ~5 seconds regardless of total years, meaning a 42-year game is proportionally longer in real time to finish) or whether the modifier is purely a date-arithmetic stretch with the same wall-clock tick rate, was not confirmed by any source — this is the most consequential unresolved technical question in this whole section for anyone trying to reproduce the system exactly.
- The one player-reported symptom of shorter settings ("too many consoles in too little time" at 25 years) is consistent with the modifier being a pure calendar stretch (console-release dates are fixed calendar dates like `30/1/1`, and a smaller modifier compresses how much *other* development time you have between them) rather than a change to the frame-rate/tick-rate itself.

### Gaps
- No source gives an authoritative, version-confirmed answer for whether the year-count options are 25/30/35 or 30/35/42 — flagged above as a genuine cross-source contradiction, likely a version difference between whenever the modAPI docs were written and whenever the cited Steam/forum posts were made (the forum post is from 2013; the exact vintage of the modAPI wiki's Date page could not be determined in this pass).
- No official or authoritative source gives an exact number for the base real-time-per-week tick rate; the single "~5 seconds" figure is an unverified critic estimate.
- Whether the "cog icon" screen offers any control finer-grained than the 3 preset year-counts (e.g., a slider) was not confirmed.

## What pauses the game automatically, what does not, and can the player pause manually

### Takeaway
The vanilla game has no dedicated pause button; pausing happens only as a side effect of opening the Esc/main menu or certain modal decision dialogs (confirmed for the "develop new game" dialog specifically). Ordinary play — the development screen with sliders, bubbles spawning, and the week/date ticker — runs continuously in real time with no automatic pause during normal work.

### Cited Findings
- Two independent, directly-quoted player/developer exchanges agree the *only* way to pause is through the menu: "You can just click anywhere to bring out the menu, that pauses the game," and "press Escape to go to the main menu, that also pauses the game" — [Pause Key, Steam Community Discussions, via WebFetch](https://steamcommunity.com/app/239820/discussions/0/864977564198556533/) ⚠️ WebFetch summarization caveat.
- A second, separate official-forum thread confirms both that (a) the base game has no dedicated pause button ("The game pauses when you go into the menu, but that's it") and (b) **at least one modal decision dialog also pauses time**: "certain pop-up windows (like the develop new game dialog) also trigger a pause" — [Pause time in the game?, Greenheart Games Forum, via WebFetch](https://forum.greenheartgames.com/t/pause-time-in-the-game/15748) ⚠️ WebFetch summarization caveat.
- The reverse-engineered `Game_Flags` page documents two flags that gate whether/how the pause menu can even be reached: `ESC_MENU` (default `true`) — "Toggles whether pressing the ESC key pops up the menu. If set to false, there may be no way to get to the game menu if RCLICK_MENU is also set to false" — and `RCLICK_MENU` (default `false`) — "Toggles whether right-clicking in the game pops up the main menu" — read in full directly — [Game Flags, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/Game_Flags).
- The official modding API's `Notification` object documents a `type` field (values include `Default`, `PlatformNews`, `IndustryNews`, `Events`, `AutoPopup`) where "Setting the type of a notification will affect whether the notification will auto-open or appear in the sidebar," and the `AutoPopup` type "forces immediate display without player override" — this is drawn from a prior full read logged in this project's existing research file rather than re-fetched in this session — [Notification, greenheartgames/gdt-modAPI Wiki (GitHub), prior full read logged in `docs/research/event-cards/notes/game_dev_tycoon_and_game_dev_story.md` on branch `events-research`](https://github.com/greenheartgames/gdt-modAPI/wiki/Notification).
- The community mod TimeMod's own description implies dialogs already have *some* baseline pause behavior for the mod to override: its pause state "overrides any other pause in the game… no matter what dialogs are opened or closed" — [dgalaktionov/TimeMod, GitHub, via WebFetch](https://github.com/dgalaktionov/TimeMod) ⚠️ WebFetch summarization caveat; this is one line from a mod's own summary, a weak signal rather than a direct statement of vanilla behavior, consistent with how the prior research file in this project already flagged it.
- G3 (the annual trade-show event) is delivered as an automatic popup: "At the start of M5, W1, the player will be presented with a window detailing the Booth size they would like to purchase for G3," fixed at Month 5/Week 1 for the offer and the event itself on Month 6/Week 2 — read in full directly — [G3, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/G3).

### Inferences
- Taken together, the direct evidence that (a) the Esc/click menu pauses, and (b) at least one specific decision dialog (develop-new-game) also pauses, plus the `AutoPopup` notification type that "forces immediate display" (strongly implying it is a modal, and modals in this engine appear to pause per the two data points above), makes it very likely that *most* full-screen modal dialogs pause the clock — G3's booth-purchase window, bankruptcy's "Breaking News" game-over screen, and AutoPopup-type random events most plausibly all pause — but this was not independently confirmed source-by-source for each one. Only the develop-new-game dialog has a direct citation.
- Conversely, routine decisions that live inside persistent side panels rather than blocking dialogs — adjusting development sliders, browsing the hiring/research/training menus, assigning staff to fields — most likely do **not** pause the game, since no source describes them as dialogs and the development screen is explicitly described elsewhere (existing project research) as running continuously with bubbles spawning in real time. This is inference, not a directly cited fact for hiring/research/training specifically.

### Gaps
- No source confirms, dialog-by-dialog, whether hiring, research-tree selection, training assignment, or contract-acceptance screens pause the clock — only the develop-new-game dialog is directly confirmed.
- No source confirms whether the "sidebar" mode of a lower-priority Notification (the non-AutoPopup path) pauses the game while open versus letting time continue in the background.
- Whether two AutoPopup-type events queue behind one another if their trigger conditions coincide in the same week, or whether one is dropped/delayed, is unconfirmed (already flagged as a gap in this project's prior events-research file).

## How the player makes decisions while time runs — is there an action budget/cap?

### Takeaway
No source found describes an explicit "action point" cap on how many things a player can start at once; the constraints are entirely resource-based — cash, available staff (each staff member can be assigned to only one field/project at a time), and office-room gating (hiring, R&D, and the Hardware Lab each require a specific office tier before they can be used at all). Development, research accrual, contract work, and hiring searches can all be initiated independently, limited only by these resource constraints, while the clock keeps running underneath.

### Cited Findings
- Hiring is gated behind training the player-character in "Staff Management" and becomes available only from the second office; the hiring search itself scales in candidate count and cost with a budget-percentage slider — drawn from this project's own prior verified research (not re-fetched this session) — [Staff, Game Dev Tycoon Wiki (Fandom), prior full read logged in `docs/research/ai-lab-mechanics/notes/game_dev_tycoon.md`](https://gamedevtycoon.fandom.com/wiki/Staff).
- Employee "usage" during a project is explicitly a percentage-based allocation, not a slot/action-point system: "for each percent of time allocated to a certain field, employee assigned to it will receive that many usage percent... medium game will require a total of 3 people to complete, large will require 5 and AAA will require 6, without overloading your employees" — read in full directly this session — [Game Development Based on Experience/1.4.3, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/Game_Development_Based_on_Experience/1.4.3).
- Contracts, a parallel income/research stream separate from the main game-development project, unlock "after the release of your third game" and thereafter run concurrently with whatever the studio is otherwise doing, each with its own deadline and payment — read in full directly this session — [Contracts, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/Contracts).
- The R&D Lab explicitly runs its own budget-driven progress track in parallel with the main game-development project once unlocked — drawn from this project's own prior verified research (not re-fetched this session) — [R&D Lab, Game Dev Tycoon Wiki (Fandom), prior full read logged in `docs/research/ai-lab-mechanics/notes/game_dev_tycoon.md`](https://gamedevtycoon.fandom.com/wiki/R%26D_Lab).

### Inferences
- The design pattern is "parallel tracks gated by real resources," not an abstract action-budget: a studio with enough cash and idle staff can, in principle, run game development, an R&D Lab project, a Hardware Lab project, and several contracts all at once, and the only thing stopping infinite parallelism is running out of staff to assign or cash to spend. This is a meaningful transferable structure for a re-themed game (cap concurrency through resources the player must accumulate, not an arbitrary counter).

### Gaps
- No source explicitly states whether there is any hard ceiling on the number of simultaneous contracts a studio can hold at once, beyond the resource constraints above — plausible but unconfirmed.

## Game project progression through time: phases, weeks, idle time between projects, sales/reviews

### Takeaway
Development runs through three fixed slider phases (Engine/Gameplay/Story-Quests → Dialogues/Level-Design/AI → World-Design/Graphics/Sound); one review source states a project takes roughly two months of in-game time; the studio pays ongoing monthly costs throughout development and during any idle time between projects; and review scores are revealed automatically a short time after release, with sales continuing over the following weeks.

### Cited Findings
- The three development phases and each phase's fixed 20–90%/10–80% Tech/Design weighting per field, plus the genre-specific ideal Tech/Design ratios and per-field importance tables, were confirmed by a direct full read this session of the same page already logged in this project's prior research — [Game Development Based on Experience/1.4.3, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/Game_Development_Based_on_Experience/1.4.3); consistent with the same tables previously logged from [Tech and Design Points Generation Algorithm, Game Dev Tycoon Wiki (Fandom), prior full read](https://gamedevtycoon.fandom.com/wiki/Tech_and_Design_Points_Generation_Algorithm).
- A critic review states a single game project "takes approximately 2 months" of in-game time, during which "you'll lose monthly costs (making your available cash drain all the time)" — [Gaming Week 37: Game Dev Tycoon, Caesoose.com, via WebFetch](https://caesoose.com/gaming-week-37-game-dev-tycoon/) ⚠️ WebFetch summarization caveat; this is the only source found with a concrete real-time-independent estimate of project duration in calendar terms, and it is one critic's characterization rather than an official or wiki-documented number.
- Review scores are revealed via an automatic popup "a few ticks after release," showing four separately-scored outlets, per this project's own prior verified research (not re-fetched this session) — [Review popup, logged in `docs/research/game-dev-tycoon/secondary-screens-2026-09-25.md`, itself drawn from a subagent's full reads of the wiki's Review Algorithm and Success Guide pages].
- The bank/game classifies bankruptcy purely by a debt threshold rather than by a per-project idle-time rule (see Money flow section below), meaning ongoing monthly costs during any idle stretch between projects are the mechanism by which "downtime" becomes dangerous, not a separate idle-time system — [Bankruptcy, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/Bankruptcy).

### Inferences
- Because monthly costs run continuously and are described by a reviewer as draining cash "all the time," idle time between projects (no active development, no contracts) functions purely as a cost sink with no revenue — the game does not appear to have a distinct "idle" state with special rules; it is simply the normal clock continuing to run while no points are being generated.

### Gaps
- No source gives an authoritative, wiki-sourced breakdown of exactly how many in-game weeks each of the three development phases individually takes for a given game size (Small/Medium/Large/AAA) — only the "~2 months" whole-project estimate (one critic) and the relative team-size-to-workload math (this project's prior research) were found. This is a genuine numeric gap for anyone trying to replicate exact pacing.
- The precise mechanism and timing of the weekly sales curve after release (how quickly sales ramp up, peak, and decay) was not verified in this session; this project's own prior research already flagged the wiki's `Sales_Algorithm` page as only partially read (cut at 8,000 characters by tool truncation) in an earlier pass, so any numeric sales-decay claim should still carry that ⚠️.

## Money flow over time: salaries/rent, revenue, and bankruptcy timing

### Takeaway
Costs (salaries, office rent, ongoing support for released games/consoles) are described as recurring on a monthly schedule and draining cash continuously; the hard bankruptcy threshold is a flat -$200,000 debt figure with an intermediate "bailout" buffer described by players but never precisely quantified in weeks; and player reports describe the single most dangerous financial moment as the real-time gap between finishing a game and its sales revenue arriving.

### Cited Findings
- "Bankruptcy occurs when a company is too far in debt and have recently been bailed out by the bank... The game classifies debt as more than 200K [-$200K+]. This typically represents a game over" — read in full directly this session — [Bankruptcy, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/Bankruptcy).
- Monthly, ongoing costs (as opposed to one-off per-project costs) are described directly by a reviewer: developing a game "takes approximately 2 months" during which "you'll lose monthly costs (making your available cash drain all the time)" — [Gaming Week 37: Game Dev Tycoon, Caesoose.com, via WebFetch](https://caesoose.com/gaming-week-37-game-dev-tycoon/) ⚠️ WebFetch summarization caveat.
- A player describing a real bankruptcy incident states they lost their company "during that week between releasing a game and it going on sale" — i.e., a real-time gap exists in which development costs have already been paid but sale revenue has not yet arrived, and this gap is explicitly named by players as the most dangerous financial moment — [Frustrating late game bankruptcy, Steam Community Discussions, via WebFetch](https://steamcommunity.com/app/239820/discussions/0/864977564336994349/) ⚠️ WebFetch summarization caveat.
- A responding player in the same thread states there is a "bailout system" that is described as adequate "early on" but insufficient later in the game once "late-game costs (salaries, console support, development) can quickly exceed the bailout's protection plus the red zone allowance" — same source as above ⚠️ WebFetch summarization caveat. This confirms a bailout/warning buffer exists before the hard -$200K game-over, but **no source gives an exact dollar size or time duration for this buffer** — it is referred to only as a "red zone allowance," and other players in the same thread argue bankruptcy is "always your fault" and that "all costs are known up front so there shouldn't be any surprises," i.e., there is direct disagreement among players about whether the bailout/grace mechanism is generous or not.
- A reverse-engineered code flag confirms the debt/bankruptcy check can be disabled entirely for debugging: `ghg54` (default `false`) — "Disables Game Over: true means you can go as far in the negative as you want, and never be prompted for bailout or game over" — read in full directly — [Game Flags, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/Game_Flags). This line also confirms the bailout is a *prompt* the player is normally shown (not a silent deduction), consistent with the "bailout system" language in the Steam thread above.

### Inferences
- The bankruptcy design combines a flat debt ceiling (not scaled to studio size) with a real-time-shaped danger window (the gap between finishing a project and its sales arriving), meaning the riskiest moment in the whole time-flow system is structurally tied to release timing, not to any single stat — a designer reproducing this should treat "time between finishing work and revenue landing" as the core tension to tune, independent of the exact dollar thresholds.

### Gaps
- No source gives the exact dollar size of the "bailout"/"red zone" buffer, nor how many in-game weeks it lasts before converting to the -$200K hard bankruptcy, nor whether the bailout is a one-time event per game or can recur.
- No source documents the exact real-time or in-game-week delay between a game's development finishing and its first sales revenue landing (the "week between releasing a game and it going on sale" is a player's own characterization of roughly one week, not a documented constant).

## Random event timing: deadlines and whether the clock pauses

### Takeaway
This project's prior events-research pass (branch `events-research`) already covers GDT's event/notification system in detail and is the primary source for this section; nothing new was independently re-verified in this session beyond the pause-related dialog evidence already folded into the "what pauses" section above. Events are gated by conditions (elapsed time, fan count, cash, staff/office level) rather than being purely random-fire, some carry their own escalating deadlines, and G3 is the one fully date-fixed annual event.

### Cited Findings
- G3 is fixed to the calendar every year: booth-purchase window opens "at the start of M5, W1" and the event itself runs "M6, W2" — read in full directly this session, confirming the prior project note — [G3, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/G3).
- Contracts (a related, deadline-bearing decision type, distinct from "random events" but timed the same way) have their own deadline math, quoted verbatim from the wiki's reverse-engineered "Requirements Algorithm": "Contracts have a 24 weeks expiry time," and per-contract deadlines are computed as `[3↔6] * Bv` weeks for small contracts and `[3↔10] * Bv` weeks for medium/large contracts, where `Bv` ("base value") itself scales with contract size and the current in-game year (`Bv = S*(1+Y/25+[0↔2])`, with size modifier `S` ranging 12–100) — read in full directly this session — [Contracts, Game Dev Tycoon Wiki (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/wiki/Contracts). **Flagging an internal inconsistency in the source itself**: because `Bv` can run into the hundreds by mid-game, a literal reading of `[3↔10] * Bv` weeks would produce deadlines of thousands of weeks, which cannot be reconciled with the flatly-stated "24 weeks expiry" on the same page — this looks like either a wiki transcription error (the deadline formula may not actually multiply by `Bv` in the real game) or two different, incompatible community reverse-engineering efforts logged on the same page. I report both numbers as directly quoted from the source but flag the contradiction rather than resolving it.
- Named random events (Improve Office Security, Nigerian Scam, Patch Required, Air Conditioner, etc.) and the general mechanism (a `Notification` object with `weeksUntilFired`, `type`, and 2–3 `options`) are documented in detail in this project's prior events-research file, drawn from the wiki's Random Events page (reached only via a read-through proxy after a direct 402 error) and the official modding API — not re-verified in this session — [Random Events, Game Dev Tycoon Wiki (Fandom), prior read via r.jina.ai proxy, logged in `docs/research/event-cards/notes/game_dev_tycoon_and_game_dev_story.md` on branch `events-research`](https://gamedevtycoon.fandom.com/wiki/Random_Events); [Notification, greenheartgames/gdt-modAPI Wiki (GitHub), prior full read, same file].

### Inferences
- None beyond what is already stated in the prior events-research file, which this note defers to for the full event catalog.

### Gaps
- Whether a generic random event (as opposed to G3 or a Contract) pauses the clock while its dialog is open is still not directly confirmed for the event system itself — the strongest evidence remains the general "certain pop-up windows... trigger a pause" statement (see prior section) plus the `AutoPopup` notification type's "forces immediate display" language, neither of which names random events by category.
- The Contracts deadline-formula contradiction above (24-week flat expiry vs. a formula that can produce far larger numbers) was not resolved by any source found.

## Full game length in weeks/years, real-hours per playthrough, and pacing changes

### Takeaway
The story content ends somewhere in the 25–42-year range depending on the (unresolved, see above) year-count setting, after which the game becomes an open-ended "no new content" sandbox; community-reported real-time playthrough length is wide and inconsistent, ranging roughly 8–20 hours depending on the source, and no source ties a specific hour count to a specific year-count setting.

### Cited Findings
- "The story ends at 25/30/35 years, depending on what you set it to. The actual game is infinite" — a directly-read, full community forum post — [How long is the game, Game Dev Tycoon Wiki Discussions (Fandom), read in full via browser](https://gamedevtycoon.fandom.com/f/p/2011745795178687335). A reply in the same thread (from 2023) adds: "there is a point where the game catches up with the real life gaming community and the 'story' ends, because there is nothing new the game can add in terms of new consoles or events... stuff done after the 'end' will not affect your score" — same source.
- Separately, the official modding API documents 30/35/42 as the three settings (see first section above) — a direct contradiction with the above, already flagged.
- Community-reported real-time length estimates vary widely and were not independently verified beyond WebSearch synthesis: "players generally agree online that Game Dev Tycoon takes around 8 to 9 hours to play," while a different aggregation puts "an average full playthrough... at 15 hours... up to 20 and as short as 10," and "around 20 hours is the average according to 308 GameFAQs users" — [WebSearch synthesis of Steam Community threads and GameFAQs/TrueSteamAchievements completion-time pages](https://gamefaqs.gamespot.com/pc/713603-game-dev-tycoon/answers/1-how-long-does-it-take-to-beat-this-game). ⚠️ None of these individual pages were opened and read to the end in this session — this is search-engine synthesis only, the weakest tier of sourcing used in this note, and the wide spread (8 to 20 hours) should itself be read as evidence that no single reliable number exists, not as three redundant confirmations of the same fact.
- A professional review states the early game alone (before reaching the deeper customization options) "takes a good hour to an hour and a half," and that a full playthrough's content is exhausted "after about three playthroughs" — [Game Dev Tycoon (PC) Review, ZTGD, via WebFetch](https://ztgd.com/reviews/game-dev-tycoon/) ⚠️ WebFetch summarization caveat.
- Community advice on the pre-game years setting frames a direct pacing trade-off: fewer years compresses console releases and major events ("too many consoles in too little time" at 25 years), while more years spaces them out — [Can I slow down the game? Or increase the amount of years?, Greenheart Games Forum, via WebFetch](https://forum.greenheartgames.com/t/can-i-slow-down-the-game-or-increase-the-amount-of-years/1294) ⚠️ WebFetch summarization caveat.

### Inferences
- Pacing does change across the game, but through *content density* (new platforms, research unlocks, and G3 all fire on fixed calendar dates that get compressed or stretched by the year-count modifier) rather than through any change to the base real-time clock rate itself — this is consistent with the "no in-game speed control" finding above: the *only* pacing lever the designers built is this single pre-game choice.
- The wide spread in community-reported playthrough hours (8 to 20+) is plausible given there is no fixed win/end condition — a player can keep playing indefinitely past the story's end, so "how long is a playthrough" is inherently a player-choice question in this design, not a fixed content length like a narrative game.

### Gaps
- No source ties a specific real-hours figure to a specific year-count setting (e.g., "the 35-year default takes X hours"); all real-hours figures found are aggregate, unqualified by which setting was used.
- No official source resolves the 25/30/35 vs. 30/35/42 discrepancy.

## Developer commentary on time-flow design choices

### Takeaway
No developer commentary — from Greenheart Games' own blog, a postmortem, a GDC talk, or a published interview — specifically addressing the design rationale for real-time-with-pause, the lack of speed controls, or pacing choices was found in this pass. This mirrors a gap already logged in this project's prior events-research file for the adjacent question of event/notification design commentary.

### Cited Findings
- A direct forum reply from a Greenheart Games staff member ("Charlie @ Greenheart Games") is the only piece of anything resembling "developer commentary" found in this pass, and it addresses only the pre-game years-setting mechanic, not any broader design rationale: see the quote already given in the first section — [Game Speed, Steam Community Discussions, via WebFetch](https://steamcommunity.com/app/239820/discussions/0/490123938428364475/) ⚠️ WebFetch summarization caveat.
- Multiple targeted searches for a Greenheart Games blog post, Patrick/Daniel Klug interview, or postmortem discussing pacing or the real-time clock design returned no matching article; the only accessible Greenheart Games blog content found was an unrelated page-2 index of the blog — [Blog - Page 2 of 5, Greenheart Games, via WebSearch, index only, no relevant article found](https://www.greenheartgames.com/blog/page/2/).
- This project's own prior events-research file independently reached the same conclusion for the adjacent question of event-system design commentary: "I found no developer commentary... that specifically discusses the design of GDT's event/notification system or its pacing philosophy" — [prior research, `docs/research/event-cards/notes/game_dev_tycoon_and_game_dev_story.md`, branch `events-research`].

### Inferences
None — there is nothing to infer from a confirmed absence without a deeper, dedicated search pass (e.g., paging through the full Greenheart Games blog archive, or searching named Patrick/Daniel Klug interviews specifically about time-system design) that neither this pass nor the prior one had budget for.

### Gaps
- Greenheart Games' own design rationale for the real-time-with-pause clock, the decision not to ship speed controls, and the choice of a pre-game (rather than in-game) pacing setting are all entirely unconfirmed by any source found across two independent research passes.

## Game Dev Story (Kairosoft) time model, for contrast

### Takeaway
Game Dev Story (GDS), GDT's acknowledged inspiration, uses the same broad Year/Month/Week calendar shape with annual fixed-date events (a convention, an awards show, a recurring vendor visit), and documentation independently confirms it has "a fast mode available right from the start" for speeding up time — but no source found gives an exact real-time-to-in-game-time ratio, nor whether GDS pauses during any dialog, review, or event. This is a thinner, mobile-game-shaped design compared to GDT's continuous real-time clock, and the presentation-layer question (whether events are full-screen or small overlays on the single office view) remains only weakly inferred, not confirmed, per this project's own prior research.

### Cited Findings
- GDS "has an in-game time system based on weeks, months and years. Each year you need to pay wages, get a visit from the traveling salesman, go to a games convention and see the awards show," and separately, "the game does feature a fast mode available right from the start," though "the exact speed multiplier or conversion ratio isn't detailed" — [WebSearch synthesis, drawing on Kairosoft Wiki and Google Play Store listing pages, none individually opened and read to the end in this session](https://kairosoft.wiki.gg/wiki/Game_Dev_Story).
- Specific annual fixed-date events, drawn from this project's own prior verified research (a full WebFetch-processed read, not re-fetched this session): "Gamedex," an annual convention "starting the first week of July"; the "Global Game Awards," run annually in December, gated on having reached the Hall of Fame (a review-score threshold) to enter and a 36+ score threshold to win; and an annual vendor selling "Pumpkin Products" appearing "in the first week of May" — [Game Dev Story, The Kairosoft Wiki, prior full WebFetch-processed read, logged in `docs/research/event-cards/notes/game_dev_tycoon_and_game_dev_story.md` on branch `events-research`, itself flagged there with a general ⚠️ that WebFetch's summarization is a processed account, not raw page text](https://kairosoft.wiki.gg/wiki/Game_Dev_Story).
- The dedicated Magazine Reviews page on the Kairosoft wiki is "marked as a stub and contains only a table of review text/point values" and "explicitly does not describe whether a review is shown as a popup, a text box, or a visiting character, nor whether gameplay pauses" — this is a confirmed gap in the source itself, drawn from the same prior research file — [Magazine Reviews (Game Dev Story), Kairosoft Wiki (Fandom), prior read, same file](https://kairosoft.fandom.com/wiki/Magazine_Reviews_(Game_Dev_Story)).

### Inferences
- GDS's calendar shape (Year/Month/Week, annual fixed-date industry events) is structurally the same pattern GDT inherited and then made continuous/real-time rather than turn-based — this is the clearest, most confidently transferable structural fact in this whole contrast section, even though the *speed* GDS runs at could not be pinned down.
- Given GDS's whole screen is a small, static isometric office view (per an independent 2010 review, cited in this project's prior research), and given the mechanical documentation for its annual events is rich while presentation documentation is silent, the prior research file's own inference stands: GDS most likely layers events as small overlays/sprite behavior on the same static scene rather than full-screen interruptions — but this remains an inference from the shape of the evidence, not a directly cited fact, and should be treated with real caution.

### Gaps
- No source found gives GDS's real-time-to-in-game-week (or day/month) conversion ratio, at either normal or "fast mode" speed.
- No source found confirms or denies whether GDS pauses the simulation during any dialog, review reveal, or convention/awards event.
- This section leans heavily on a prior research pass's findings (properly attributed above) rather than fresh verification in this session, given the tool-call budget for this assignment; a dedicated GDS-focused pass would be needed to close the two gaps above.

## Coverage statement

**Opened and read to the end in full this session (via the built-in browser's `navigate` + `get_page_text`, raw page text obtained, not summarized):**
- Bankruptcy — https://gamedevtycoon.fandom.com/wiki/Bankruptcy
- Game Flags — https://gamedevtycoon.fandom.com/wiki/Game_Flags
- Time (confirmed empty/no content) — https://gamedevtycoon.fandom.com/wiki/Time
- How long is the game (Fandom Discussions post) — https://gamedevtycoon.fandom.com/f/p/2011745795178687335
- G3 — https://gamedevtycoon.fandom.com/wiki/G3
- Contracts — https://gamedevtycoon.fandom.com/wiki/Contracts
- Game Development Based on Experience/1.4.3 — https://gamedevtycoon.fandom.com/wiki/Game_Development_Based_on_Experience/1.4.3

**Read via WebFetch's AI-summarized extraction (the tool fetched the complete page but a smaller model returned a processed, prompt-targeted summary rather than raw text — flagged ⚠️ inline everywhere used, per this project's standing convention for this class of source):**
- Date, greenheartgames/gdt-modAPI Wiki — https://github.com/greenheartgames/gdt-modAPI/wiki/Date
- Game, greenheartgames/gdt-modAPI Wiki — https://github.com/greenheartgames/gdt-modAPI/wiki/Game
- GDT, greenheartgames/gdt-modAPI Wiki — https://github.com/greenheartgames/gdt-modAPI/wiki/GDT
- Home (page listing), greenheartgames/gdt-modAPI Wiki — https://github.com/greenheartgames/gdt-modAPI/wiki
- dgalaktionov/TimeMod README — https://github.com/dgalaktionov/TimeMod
- Game Dev Tycoon — Wikipedia — https://en.wikipedia.org/wiki/Game_Dev_Tycoon
- Can I slow down the game? Or increase the amount of years? — https://forum.greenheartgames.com/t/can-i-slow-down-the-game-or-increase-the-amount-of-years/1294
- Pause time in the game? — https://forum.greenheartgames.com/t/pause-time-in-the-game/15748
- Game Speed (Steam thread) — https://steamcommunity.com/app/239820/discussions/0/490123938428364475/
- Pause Key (Steam thread) — https://steamcommunity.com/app/239820/discussions/0/864977564198556533/
- Frustrating late game bankruptcy (Steam thread) — https://steamcommunity.com/app/239820/discussions/0/864977564336994349/
- Game Length (Steam thread) — https://steamcommunity.com/app/239820/discussions/0/1480982338955468057/
- Game Dev Tycoon (PC) Review, ZTGD — https://ztgd.com/reviews/game-dev-tycoon/
- Gaming Week 37: Game Dev Tycoon, Caesoose.com — https://caesoose.com/gaming-week-37-game-dev-tycoon/

**Encountered only as WebSearch-synthesized snippets, never independently opened and read to the end in this session (⚠️ flagged inline everywhere used — the weakest sourcing tier in this note):**
- Various Steam Community threads on speed/pause ("slow down time mod?", "too fast gameplay", "Can you change the speed of the game?")
- GameFAQs / TrueSteamAchievements completion-time aggregation pages
- Kairosoft Wiki and Google Play Store listing content on Game Dev Story's "fast mode"
- The gdt-modAPI wiki's `GDT.eventKeys.gameplay` list of event-hook names

**Drawn from this project's own prior research passes rather than re-verified in this session (each instance named inline above with the specific claim and the specific prior file/URL, per the delegated-research provenance rule):**
- `docs/research/ai-lab-mechanics/notes/game_dev_tycoon.md` (read in full at the start of this session) — used for Staff/hiring, R&D Lab, and general mechanics context.
- `docs/research/game-dev-tycoon/office-progression-2026-09-25.md` and `docs/research/game-dev-tycoon/secondary-screens-2026-09-25.md` (both read in full at the start of this session) — used for the Review-popup timing and screen-inventory claims.
- `docs/research/event-cards/notes/game_dev_tycoon_and_game_dev_story.md` on branch `events-research` (read in full at the start of this session via `git show`) — used for the Random Events catalog, the `Notification` object's fields, and the Game Dev Story event/presentation findings. This file's own coverage statement already flags several of its own sources as WebSearch-synthesis-only or partially read; those caveats are inherited by any claim in this note that leans on it, and are re-stated inline above rather than silently dropped.

**Could not be reached, or reached only with degraded content, in this session:**
- Direct WebFetch access to `gamedevtycoon.fandom.com` domain pages fails with HTTP 402 ("Payment Required") on every attempt; every Fandom page cited above as "read in full" was instead retrieved via the built-in browser tool (`navigate` + `get_page_text`), which succeeded and returned full raw page text — this is a tool-routing note, not a content gap.
- No Greenheart Games blog post, postmortem, GDC talk, or named-founder interview addressing time-system or pacing design specifically could be located via search; this is treated as a confirmed absence given multiple distinct query attempts, not an unfetched-but-known source.
- The TimeMod GitHub repository's full README body (beyond its short repository-summary blurb) was not successfully retrieved; only the summary text was returned by WebFetch.
- A deeper, dedicated pass on Game Dev Story specifically (to close its real-time-ratio and pause-behavior gaps) was out of scope for this session's tool-call budget and is named as a gap above rather than guessed at.
