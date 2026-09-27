# Making strategic choices meaningful in a deterministic game, and showing why outcomes happen

**Research note, 2026-09-26.** Written for Game Night AI Lab's design of products, the era wave, features and efficiency.
Produced by an Opus research subagent for lane `gn-model-appeal`; saved verbatim from its report. Its coverage
statement (bottom) is the subagent's own claim.

**How the sources were read.** Web pages went through a fetch tool that hands the page to a small model, which summarises it and says whether the page looked complete. Paraphrases below rest on those summaries. For the two GDC slide decks the subagent pulled the full slide text itself with `pdftotext`. Only one direct quote is used; everything else is paraphrased.

---

## 1. Sid Meier: a game is a series of interesting decisions

**Principle.** Game Developer's write-up of Meier's GDC 2012 talk lists what makes a decision interesting (https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions):
- It involves a trade-off: there is a real cost.
- It is situational: the best option depends on the current game state.
- It lets the player express a personal style.
- It weighs risk against reward, or the short term against the long term.
- The player gets enough information. Meier says to err toward giving too much.
- The game gives feedback. He calls moving on without acknowledging a choice the worst thing a designer can do.
- Ideas that don't produce such decisions get cut. Meier says about a third of what they try gets cut.

The Escapist adds that a choice which is interesting once may not be interesting the tenth time (https://www.escapistmagazine.com/gdc-2012-sid-meier-sees-interesting-decisions-even-in-rhythm-games/). ⚠️ The fetch tool said this page ended in a truncated way. The article body seemed to reach its closing line, but this cannot be confirmed as whole.

**Application.** "Pick the era's hot product" breaks the situational test if the wave is best no matter what the player owns. It also breaks the repetition test, because the same pick recurs in all five eras. The wave bonus has to interact with the player's own state: their existing product line, their serving capacity, and their safety posture. Then the right answer differs between players and between eras.

## 2. Soren Johnson: players optimize the fun out, and transparency helps

**Principle.** In "Water Finds a Crack" (https://www.designer-notes.com/game-developer-column-17-water-finds-a-crack/), Johnson argues that players will find and exploit any dominant strategy, even a tedious one, and cannot then forget it. He adds that players will trade time for safety.

His main example is Infinite City Sleaze in the earlier Civilization games. Many small cities beat a few large ones because of bonuses given per city. Civ IV fixed this with a maintenance cost that grows with the number of cities, so the exploit carries its own counterweight.

In a second column (https://www.gamedeveloper.com/game-platforms/analysis-soren-johnson-on-playing-the-odds), he argues that letting players see the game's calculations makes them comfortable with the mechanics. Civ IV's on-screen combat odds sharply raised player satisfaction.

**Application.** Assume players will find "always chase the wave" or "fill every feature slot" within a few games. Each counterweight should be a cost that scales with the behaviour it limits, as Civ IV's maintenance does. Crowding should grow with the number of rivals already in the wave. Serving cost should grow with the number of features. Show the calculation openly. Johnson's point is that visible maths builds trust, and that matters even more in a game with no randomness to blame.

## 3. Deterministic design: Into the Breach, Burgun, Brough

**Into the Breach.** Justin Ma of Subset Games said the team wanted a game where "every death felt like your own fault" (https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-). In the same interview he says that telegraphed attacks with no chance to miss make the game feel like a puzzle. The tension comes from collateral damage, meaning the choice between protecting buildings and protecting mechs.

The GDC 2019 slide deck (https://media.gdcvault.com/gdc2019/presentations/Into%20the%20Breach%20Postmortem%20Final.pdf) adds several points:
- All enemy attacks are shown, there is no hit or miss, and the player's turn is completely deterministic.
- The team found that manipulating enemies was more fun than killing them.
- The Power Grid mechanic brought randomness into the otherwise deterministic design, and the slides say it annoyed players.
- Much of the design was "UI-guided": show each enemy's target and attack type, keep numbers low, and fit everything on one screen.
- An early turn-order rule set was complex but not deep.
- If a puzzle game is too hard, puzzles become unsolvable, and that threshold is a cliff.

⚠️ Slide text only. The slide images were not seen and the talk (https://www.gdcvault.com/play/1025772/-Into-the-Breach-Design) was not watched, so the speaker's narration is missing.

**Keith Burgun.** Burgun separates input randomness, which the player sees before deciding (a generated map), from output randomness, which comes between a decision and its result (a dice roll) (https://www.gamedeveloper.com/design/randomness-and-game-design). He argues that output randomness breaks the cause-and-effect learning that builds skill. Deterministic games stay deep through emergent complexity: simple rules producing intricate situations.

**Michael Brough.** On 868-HACK, Brough says he paired short-term tactics with long-term decisions, and that the core tension is greed for points against survival (https://www.gamedeveloper.com/design/the-gorgeous-math-of-michael-brough-s-i-868-hack-i-).

**Application.** We ban even input randomness, so variety between games has to come from state: the player's own earlier choices and rivals who follow fixed rules that react to the situation. Telegraphing is how we get tension without dice. Show rivals' planned releases, and upcoming risk thresholds, before the player locks a product.

A counterpoint: one essay (https://www.gamedeveloper.com/design/design-for-theorycrafting) recommends randomness to stop certain-win strategies. We cannot use that tool, so every counterweight has to be structural.

## 4. Trade-off devices in specific games

**Plague Inc: visibility against lethality.** The official wiki's core-stats page explains three stats (https://plagueinc.wiki.gg/wiki/Severity):
- Infectivity spreads the disease without, by itself, drawing attention.
- Severity gets the disease noticed and draws more cure funding. In return it earns more DNA points and makes the disease harder to cure.
- Lethality speeds up cure research and makes countries close borders. It is best held back until every country is infected.

So the same upgrade is right or wrong depending on when you buy it.

*Application:* this maps directly onto capable and agentic products. They should raise scrutiny from the public and regulators, and that scrutiny should slow the player down. The wave's product is then great at one moment and costly at another.

**Slay the Spire: dilution against synergy.** A guide article explains that adding cards usually makes a deck worse (https://cardanoir.com/slay-the-spire-deckbuilder-reinvented-card-games/). A small, focused deck draws its key cards more often, so skipping card rewards that don't fit a plan is correct. This is a fan or guide source, not the designers.

The designer's GDC slides (https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf) state the balance goal: every card should have a place, and nothing should warp the game too much. They also say metrics data is evidence, not a conclusion. ⚠️ Slide text only. The charts are images that were not seen, and the talk was not watched.

*Application:* an extra feature should dilute the product as well as cost serving compute. Every product should have some situation where it is the right pick.

**Universal Paperclips: price against demand (an AI game).** In the game's source code (https://www.decisionproblem.com/paperclips/main.js):
- Public demand is inversely proportional to price, multiplied by 1.1 raised to the marketing level.
- Each sale moves an amount that grows slightly faster than demand.
- When demand exceeds unsold stock, revenue falls back to what the player's production can supply.
- The screen shows average sales per second.

So the right price is never fixed. It moves with the player's production capacity. A small caveat: sales timing uses a random roll each tick, but the game displays the expected rate.

⚠️ Only the demand, sales and average-revenue sections of this 209 KB file were read.

Background on the game's AI premise, Bostrom's paperclip maximizer, comes from https://if50.substack.com/p/2017-universal-paperclips and https://en.wikipedia.org/wiki/Universal_Paperclips.

*Application:* demand you cannot serve is wasted. That is exactly our tension between serving GPUs and training GPUs.

**Frostpunk: moral choices against efficiency.** A review describes how the game's laws work (https://twincitiesgeek.com/2018/05/frostpunk-is-a-struggle-between-morality-and-survival/):
- Laws are irreversible and have cooldowns.
- Laws create promises the player must keep.
- Hope and discontent track how people react.
- Consequences land as individual stories, such as a forced amputation followed by that person's death.

*Application:* safety compromises should be commitments that cannot be undone, and their consequences should be shown at human scale, not only as a number.

## 5. Showing the "why"

- **Civ IV combat odds:** show the calculation before the player commits (Johnson, above).
- **Nested tooltips:** Crusader Kings 3 and Victoria 3 let any highlighted term open its own tooltip, so players can drill as deep as they want. Paradox says this lets players learn advanced concepts while playing (https://www.pcgamesn.com/victoria-3/nested-tooltip-system; https://philip.design/blog/tooltips-in-tooltips/). The first-hand dev diaries could not be reached; see the coverage statement.
- **Into the Breach:** every threat is shown as target plus type, with few and small numbers.
- **Paperclips:** shows the expected sales rate, so price experiments give feedback straight away.
- **Meier:** acknowledge every decision the moment it is made.

**Application.** Each release gets a receipt: one line per factor (fit, wave, crowding, loyalty, feature load, serving shortfall, scrutiny). Each line opens a tooltip with its formula and inputs. A forecast of the same receipt should be visible before the player locks the product.

---

## A checklist for our design

A product, wave, or feature choice counts as a real decision only if it passes these tests:

1. **Either-way test:** a reasonable player would pick each option in some reachable situation. This is the "every card has a place" rule.
2. **Situational test:** which option is best depends on the player's own state (current product line, compute, safety posture), not only on the era.
3. **Repetition test:** the wave decision plays out differently in era 2 than in era 4. It is not the same click five times.
4. **Scaling-cost test:** every popular strategy pays a cost that grows with how hard it is pushed, as in Civ IV's per-city maintenance.
5. **Timing test:** at least one option is good early and bad late, or the reverse, as in Plague Inc's lethality.
6. **Capacity test:** demand the player cannot serve is visibly lost, so bigger is not automatically better, as in Paperclips.
7. **Telegraph test:** everything that decides the outcome (rival releases, thresholds, the wave) can be seen before commitment.
8. **Receipt test:** after a release, the player can trace every point of the result to a named factor and its formula.
9. **Own-fault test:** a losing player can name the choice that lost the game.
10. **Bot-sweep test:** fixed-strategy bots (always follow the wave, never follow it, stay loyal to one line, max out features) finish close together, and each wins under different conditions.

## What this suggests for Game Night AI Lab

1. **Demand limited by serving capacity (from Paperclips).** The wave raises demand, but players can only earn from users their serving GPUs can handle. The shortfall appears on the receipt as "users turned away." A lab short on compute may do better with a less-crowded product it can serve fully.
2. **A scrutiny meter (from Plague Inc).** Agentic and highly capable products and features add deterministic scrutiny. Crossing thresholds that are shown in advance brings friction: a slower release, a compliance cost, or a closed market. Entering the agent wave early means low demand and low scrutiny. Entering late means high demand into a crowded, watched market.
3. **Telegraphed crowding (from Into the Breach).** Before the product locks, show each rival's announced next product and the resulting share split. Rivals choose by fixed, readable rules, for example "Rival B always follows the wave."
4. **Feature dilution (from Slay the Spire).** Each feature outside a product's core set lowers fit a little and adds serving cost. Players then choose a few features, rather than taking every one.
5. **Loyalty that compounds (from Meier, Brough and Frostpunk).** Users carry over and grow within a product line, and a new line starts from zero. Staying in a line is the long-term option and chasing the wave is the short-term one. This makes the switching cost the owner already drafted into a visible, compounding number.

---

## Coverage statement (the subagent's own)

**Read in full** (the fetch tool reported the page complete, or all its text was extracted):
- https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions
- https://www.designer-notes.com/game-developer-column-17-water-finds-a-crack/
- https://www.gamedeveloper.com/game-platforms/analysis-soren-johnson-on-playing-the-odds
- https://www.gamedeveloper.com/design/randomness-and-game-design
- https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-
- https://www.gamedeveloper.com/design/the-gorgeous-math-of-michael-brough-s-i-868-hack-i-
- https://www.gamedeveloper.com/design/design-for-theorycrafting
- https://plagueinc.wiki.gg/wiki/Severity
- https://cardanoir.com/slay-the-spire-deckbuilder-reinvented-card-games/
- https://if50.substack.com/p/2017-universal-paperclips
- https://en.wikipedia.org/wiki/Universal_Paperclips
- https://twincitiesgeek.com/2018/05/frostpunk-is-a-struggle-between-morality-and-survival/
- https://www.pcgamesn.com/victoria-3/nested-tooltip-system
- https://philip.design/blog/tooltips-in-tooltips/
- https://www.dreadcentral.com/news/36863/exclusive-interview-ndemic-creations-ceo-james-vaughan-talks-plague-inc/ (not cited: it had no trade-off content)

Note: "read in full" for web pages means a fetch tool's summarising model processed the page; the subagent did not see
raw full text for those.

**Read partly:**
- ⚠️ https://media.gdcvault.com/gdc2019/presentations/Into%20the%20Breach%20Postmortem%20Final.pdf: all slide text; images and narration missing.
- ⚠️ https://media.gdcvault.com/gdc2019/presentations/Giovannetti_Anthony_SlayTheSpire.pdf: all slide text; chart images and narration missing.
- ⚠️ https://www.decisionproblem.com/paperclips/main.js: only the demand, sales and average-revenue sections.
- ⚠️ https://www.escapistmagazine.com/gdc-2012-sid-meier-sees-interesting-decisions-even-in-rhythm-games/: the tool flagged the page as truncated.
- ⚠️ https://forums.civfanatics.com/threads/interesting-decisions-sid-meiers-gdc-2012-lecture.459731/: only 2 posts visible; not cited.
- ⚠️ https://80.lv/articles/gdc-2019-an-inside-look-at-into-the-breach: a short promotional page flagged as truncated; not cited.

**Could not reach:**
- ⚠️ http://keithburgun.net/randomness-and-game-design/: returned 404 (not found). The Game Developer copy of the same article was used instead.
- ⚠️ https://www.pcgamer.com/frostpunk-developers-on-hope-misery-and-the-ultimately-terrifying-book-of-laws/: only the membership page came back.
- ⚠️ https://store.steampowered.com/news/app/1158310/view/1719750490053071870 and https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/: no article body (Steam) and a browser check page (Paradox forum). The first-hand Crusader Kings 3 tooltip dev diary was therefore not read.
- ⚠️ Videos not watched: the Meier GDC 2012 talk (https://www.gdcvault.com/play/1015756/interesting), the Into the Breach talk (https://www.gdcvault.com/play/1025772/-Into-the-Breach-Design), and the Slay the Spire talk.

**Search snippets not relied on:**
- The widely repeated wording of Johnson's "optimize the fun out of a game" line came from search snippets. The column's argument was used instead.
- The claim that Burgun says single-player games need input randomness came from a search snippet about his site and was not used.
