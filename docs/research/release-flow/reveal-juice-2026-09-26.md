# Release reveal: animation and sound research (2026-09-26)

Why the reveal got a launch show. The owner asked for the release to hit like a reward: bars
climbing, numbers counting, ratings resolving, a clear comparison with rivals, and sound. One
Sonnet research pass surveyed comparable games and game-feel writing. Its report is copied below as
**unverified raw output**: the orchestrating session did not re-read its sources, and every claim
resting on a partial read carries ⚠️. Its coverage statement is at the end.

## What came of it

- Four playable options with synthesised sound were shown on three real simulated releases (a big
  leap, a near miss, a slip below the player's own last model): A today's screen with every number
  counting in, B one benchmark at a time then the critics flipped one by one, C a leaderboard
  climb, D the lab's own launch livestream. Prototype page: the private artifact
  `https://claude.ai/artifact/19rWzHe7a2ZnjtdZN4Phad`.
- Owner pick: **B, plus C's leaderboard climb**, played on every release, with clicks hurrying it
  along. Built in `ui/screens/reveal.js` (the show), `ui/sfx.js` (the sounds) and
  `leaderboard()` in `ui/logic/release.js`.
- The owner also noted that Game Dev Tycoon's review screen works because each game took a long
  time to build, while this game releases too often; the reveal plays every time anyway.

## Catch from the simulation, not the web

In 40 simulated runs (`SCENARIOS.ending`, seeds 1 to 40), the critics gave 9 or 10 on almost every
release, even when the model lost to the best rival on three of four capability benchmarks; the
lowest score seen was 7. A score reveal only lands if the score can disappoint. Game Dev Tycoon
spreads its four reviewers around one true score and holds back a perfect 10 until it is earned
(`game-dev-tycoon-release.md` in this folder). The owner parked a fix to the press formula in
`sim/launch.js` for the end of the build.

---

## Raw report (unverified)

### Per-game and per-source findings

**Game Dev Tycoon** (read to the end: Game Dev Tycoon Wiki, "Review Algorithm/1.4.4") — only one
true game score is computed; the four reviewer scores are that score, rounded down, then jittered
per reviewer (50% +0, 25% +1, 25% −1, wider near 5–6). If the first three rolled 10 and a perfect
score is not yet unlockable, the fourth is knocked down to 9. ⚠️ The wiki documents the score maths
in full but says almost nothing about the screen's staging (timing, sound, animation); gameplay
videos were not watched.

**Game Dev Tycoon sales chart** — ⚠️ the Sales Algorithm wiki page could not be read (HTTP 402);
no numbers are reported from it.

**Balatro** (read to the end: blakecrosley.com/guides/design/balatro, a third-party design
analysis, not developer commentary) — the scoring reveal stacks five layers: cards slide in with a
spring bounce; chips count up first, then the multiplier; screen shake scales with the score's
size; particles trail the total; a rising note per scoring card, a distinct sound on multiplier
triggers, and a bass drop with a flash when a threshold is crossed. Jokers fire left to right,
about 300 ms each, with a running total, so players learn causes by watching them.

**Peggle** (read: Wikipedia, Gameplay and Development; ⚠️ Reception and Versions not read) — Extreme
Fever (Ode to Joy, slow-motion zoom on the last ball) began as a placeholder; playtests preferred it
to wilder versions, so PopCap kept it and only added the zoom. The payoff escalates in focus, not in
volume.

**Two Point Hospital** (read to the end: Two Point Hospital Wiki, "Hospital Awards Ceremony") —
award envelopes can be opened one at a time or all at once: a paced default with an instant escape.

**Hearthstone pack opening** (read to the end: TouchArcade interview with art director Ben
Thompson, 2017) — one fixed opening animation per expansion, storyboarded to that set's beats.
Varying it at random was rejected because players read meaning into any variation.

**Vampire Survivors** (read to the end: PC Gamer, July 2023, reporting on a Noclip documentary, ⚠️
the documentary itself was not watched; The Conversation, April 2023) — the creator came from
mobile slots and based the chest jingle on a slot machine's; the academic piece frames the
near-miss structure as the casino mechanism.

**Gacha and loot-box rarity tells** (⚠️ read to the end, but the source, cogconnected.com, Sept 2026,
carries affiliate links to casino sites) — a rarity colour or glow appears before the item,
making anticipation its own beat.

**Steve Swink, "Game Feel"** (⚠️ read only through Liz England's 2015 review, not the book) — game
feel is real-time response, simulated space and polish; reveal juice belongs to polish.

**"Juice it or lose it"** (Jonasson and Purho, GDC Europe 2012) — ⚠️ not reached: the GDC Vault page
is a paywalled abstract and the talk video was not watched. Only the well-known description (a plain
Breakout clone juiced live with shake, tweens, particles and scale pulses) is reported.

**Jan Willem Nijman, "The Art of Screenshake"** (2013) — ⚠️ not reached: the Internet Archive item
has slides without a transcript and the talk was not watched.

**Shepard tone** (read: Wikipedia, Construction and Variants; ⚠️ Examples not finished) — stacked
octave sines crossfading give an endlessly rising pitch; the trick behind rising combo ladders.

**Football Manager** (⚠️ FMScout "Match Day" guide read only to about 6,000 characters, and it was
about the live match view) — no theatrical results ceremony found; ratings update live.
**Motorsport Manager** — nothing documented found (a gap, not a confirmed absence).

**Cookie Clicker, EA FC rating reveals, Slay the Spire and Hades summaries, Pokémon EXP bar, Marvel
Snap** — ⚠️ only search-engine summaries; used as pointers, not sourced claims.

### Distilled techniques (with sources)

1. Derive several reviewer numbers from one true score with small independent jitter. [Game Dev Tycoon]
2. Hold back an unearned perfect score. [Game Dev Tycoon]
3. Reveal parts in sequence rather than the total at once. [Balatro]
4. Scale a physical effect (shake) to the size of the result. [Balatro]
5. A rising note per step as an anticipation ladder. [Balatro; Shepard tone for an endless version]
6. A bass drop plus a flash at a threshold crossing. [Balatro]
7. A per-element pulse with a running total, about 300 ms a beat. [Balatro]
8. Let the player choose a paced reveal or all at once. [Two Point Hospital]
9. One fixed reveal animation, not randomised. [Hearthstone]
10. Storyboard the reveal to the release's own beats. [Hearthstone]
11. Slow motion and zoom to focus the payoff instead of adding effects. [Peggle]
12. The plain version may beat the spectacular one in testing. [Peggle]
13. A quality tell before the full reveal. [loot-box pattern, ⚠️ secondary]
14. Near-miss framing keeps players going. [Vampire Survivors analysis]
15. Staggered odometer digits read as more premium than a flat count. [Balatro blog]
16. Consistent colour per quantity so meaning reads without labels. [Balatro]
17. Keep input response under about 100 ms; the reveal itself may be slow on purpose. [Swink via England]

### Pitfalls

- Reveal fatigue: a reveal played every release needs a skip from day one (Two Point Hospital's
  open-all is the precedent).
- Cosmetic randomness teaches false patterns (Hearthstone).
- Escalation is not satisfaction (Peggle).
- Near misses and pre-reveal tells come from gambling design; a single-player game with no
  monetisation should stay on the side of satisfying feedback.
- Game Dev Tycoon's on-screen choreography is undocumented; check footage before claiming it.

### Coverage statement (the subagent's)

Read to the end: gamedevtycoon.fandom.com "Review Algorithm/1.4.4"; two-point-hospital.fandom.com
"Hospital Awards Ceremony"; blakecrosley.com/guides/design/balatro; toucharcade.com 2017 Ben
Thompson interview; lizengland.com review of "Game Feel"; roblog.co.uk "Juice it or lose it" post
(short); archive.org "The Art of Screenshake" item page (metadata only); gdcvault.com "Juice It or
Lose It" page (paywalled abstract only); cogconnected.com loot-box piece (affiliate content);
pcgamer.com Vampire Survivors article; theconversation.com Vampire Survivors piece.
⚠️ Partial: Wikipedia "Shepard tone" (Examples not finished); Wikipedia "Peggle" (Reception and
Versions not read); fmscout.com/match_day.htm (about 6,000 characters, off target); YouTube pages
for pack openings and the juice talk (metadata only, videos not watched).
⚠️ Not reached: gamedevtycoon.fandom.com "Sales Algorithm" (HTTP 402); any Game Dev Tycoon footage
of the review screen.
⚠️ Search summaries only, not opened: Mad Games Tycoon 2 and Game Dev Story wikis, Hearthstone
"Open Packs", Marvel Snap variant sites, Pokémon level-up sound, Vampire Survivors chest page,
Cookie Clicker design sources, EA FC rating pages, Slay the Spire and Hades summaries,
dark-pattern and variable-reward articles, count-up UI tutorials.
