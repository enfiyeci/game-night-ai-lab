> Provenance: written by a Sonnet research subagent on 2026-09-26 for the board UI round 2 (the board meeting as a
> video call, and the between-meetings lookup screen). The orchestrator did not re-read its sources; the coverage
> statement at the end is the subagent's own claim. Claims marked ⚠️ rest on a source it could not read in full.
> Treat this as unverified raw research: trace any claim back to its source before a design decision rests on it alone.

# How other games show board or council support and stage votes

Question: what do comparable games show on their board, council, cabinet, faction or investor screens, and how do they
make votes tense? Asked for the Game Night board (seven members, 4 of 7 keep the player, votes at the end of eras 2 to 4,
support shown only as an uncertain estimate, the cut-off never shown).

## 1. Frostpunk 2 (the closest match)

The Council has 100 delegates split across factions. On the law screen each delegate is For, Against or Hesitant: one bar
with a blue "for" section, a red "against" section and a faint blend for the undecided middle. A normal law needs 51 votes;
laws that grow the Steward's own power need 67. Before a vote the player can open "Negotiate" and trade promises (pass a
law they want, fund research, build or destroy something, act against a rival faction) for votes; breaking a promise
later hurts relations with that faction badly.

Frostpunk 2 also has a "Vote of Trust" the Council can call on the Steward; losing it ends the campaign. A community
guide's rule of thumb for predicting it: guaranteed supporters plus roughly half the hesitant delegates. The game
director told Game Developer the vote-tally animation was built for suspense, "the same excitement as watching a dice
roll in Baldur's Gate 3", and that most votes open with a mix of for, against and undecided so the outcome feels live.

- Read in full: gamedeveloper.com dev interview ("Frostpunk 2's developers didn't want it to be a jackass simulator"),
  gamepressure.com Council guide, thegamer.com Council guide, 2upskill.com Vote of Trust guide.
- ⚠️ frostpunk.fandom.com/wiki/The_Council and twinfinite.net's voting guide returned 402/403; nothing rests on them.
- ⚠️ The "100 delegates" figure is corroborated only across search snippets, not one fully read primary source.

## 2. Suzerain

No running vote counter. Cabinet decisions happen in dialogue, and parliament's arithmetic is kept opaque. Vice's review
calls the constitutional-reform vote "as nail-biting as a high-stakes boss battle" because allies' "true positions remain
ambiguous until revealed", and describes last-minute chaos on the floor as members are pulled into sudden meetings. The
tension comes from things visibly still moving right up to the reveal.

- Read in full: vice.com Suzerain review; gamingtrend.com Suzerain review (thin on mechanics).
- ⚠️ The Suzerain wiki returned 402 twice; the "250 seats, 166 to pass" figures come from a search snippet only.

## 3. Software Inc. (negative finding)

No board-fires-the-player mechanic found. There is a shares system (going public, buying over 50% of another company to
take it over). The wiki page is marked work in progress, with its hostile-takeover sections unwritten.

- Read in full: softwareinc.coredumping.com/wiki/index.php/Stocks.

## 4. Capitalism Lab

An unhappy chairman first sends a scripted warning ("turn the company around by my next review, or I will replace you as
CEO"). The player is guaranteed one full review cycle to fix things; only a still-poor result at the next review gets
them replaced. The Shareholders page shows who controls what share of the company.

- Read in full: capitalismlab.com/playing-without-company; capitalismlab.com subsidiary-control page (thin).

## 5. Democracy 4

The developer blogged about exactly the hidden-cliff problem: approval is a 0 to 100 average but votes are binary, so a
move from 49 to 51 can flip a whole group. The fix overlays the polling graph with blobs sized by how many voters sit in
each bracket, so the player can see a cluster bunched near the tipping point. The game also shows "would vote for me"
and average approval as two separate graphs, because they diverge.

- Read in full: positech.co.uk/cliffsblog/2022/03/02/on-the-visualization-of-voter-approval-distribution-in-democracy-4.
- ⚠️ Democracy 3 not researched separately.

## 6. Crusader Kings III

Vassal opinion is an exact number; a community guide turns it into bands (above +50 safe, 0 to +50 risky, below 0
danger). The most powerful vassals take a flat −40 if denied a council seat, an always-on grievance. Levers before a
faction moves: the slow Sway scheme, gifts, marriages, tax relief, bribing a faction leader.

- Read in full: Steam guide "Keeping Your Throne: Council & Vassal Trust Strategies" (id 3552604429).
- ⚠️ Not confirmed whether the opinion number is ever shown as a range.

## 7. Reigns

The four meters are fill-level bars with no digits; Nintendo Life notes the game "deliberately withholds specific numbers
to heighten tension". An unlockable perk temporarily reveals the numbers and the exact effect of the next choice.

- Read in full: nintendolife.com Reigns: Kings & Queens review.
- ⚠️ tvtropes.org and androidcentral.com were unusable.

## 8. Tropico 6

Faction support lives in the Almanac with a per-member breakdown; elections track an "undecided" bucket separately from
committed supporters. Levers before a vote: quick-build buildings a faction likes, propaganda about three months out,
bribes, early tax cuts, speech promises (broken ones cost approval later), or rigging at a stated risk.

- Read in full: Steam guide "Guide to Political Support" (id 1702878108).

## 9. Terra Invicta

Councilor loyalty is shown as "Apparent Loyalty", an estimate of a hidden true value that can be wrong. An implant shows
the true number at the cost of a lower loyalty cap: certainty has a price. A player notes the estimate rarely matters in
practice, a warning that an estimate needs real stakes or it reads as flavour text.

- Read in full: Steam discussion "Apparent Loyalty - What's the Point?" (app 1176470).
- ⚠️ The Terra Invicta wiki's Loyalty page returned 403.

## Also: EU4 estates and Stellaris factions

EU4 shows exact 0 to 100 loyalty bucketed as disloyal / neutral / loyal with public danger thresholds, managed through
privileges with real costs. Stellaris shows faction approval with effect tiers and flags unhappy factions by size in the
outliner; levers are Promote, Suppress and Embrace. Read in full: the official Paradox wikis (Factions, Estates).

## Transferable ideas (the subagent's list)

1. A running for / undecided / against bar during the vote reveal (Frostpunk 2).
2. Named bands instead of a percentage (CK3 guide convention, EU4 tiers, Democracy 4).
3. Label the estimate as an estimate ("apparent support") (Terra Invicta).
4. Put a price on certainty (Terra Invicta's implant, Reigns' perk).
5. Warn before the vote, with one guaranteed turn to fix things (Capitalism Lab).
6. A between-meetings temperature check separate from the vote arithmetic (Capitalism Lab, Stellaris).
7. Persuasion as promises with consequences, not a one-shot bump (Frostpunk 2).
8. Let dissent move during the meeting itself (Suzerain).
9. Two readings that can diverge, such as mood and vote intent (Democracy 4).
10. An explicit undecided bloc that last-minute moves can target (Tropico 6, Frostpunk 2).
11. A standing grievance for structural slights, such as not consulting a member (CK3).
12. A costly option against a member who will never be won over (Stellaris's Suppress).

## Coverage statement (the subagent's)

Read in full: the gamedeveloper.com Frostpunk 2 interview; gamepressure.com, thegamer.com and 2upskill.com Frostpunk 2
guides; the vice.com and gamingtrend.com Suzerain reviews; two capitalismlab.com pages; the positech.co.uk Democracy 4
blog post; Steam guides 3552604429 (CK3) and 1702878108 (Tropico 6); the Terra Invicta Steam discussion (app 1176470);
the nintendolife.com Reigns review; the Stellaris and EU4 Paradox wikis; the Software Inc. Stocks wiki page.

Could not reach (402/403 or navigation only), nothing rests on them: frostpunk.fandom.com The_Council; twinfinite.net's
Frostpunk 2 guide; suzerain.fandom.com Government_of_Sordland; neoseeker.com Suzerain constitutional reform guide;
wiki.hoodedhorse.com Terra_Invicta/Loyalty; tvtropes.org Reigns; androidcentral.com Reigns guide; a Steam Frostpunk 2
"vote of confidence" thread.

Search snippets only (not relied on): Suzerain's seat counts; Frostpunk 2's 100 delegates; Democracy 3's UI.
