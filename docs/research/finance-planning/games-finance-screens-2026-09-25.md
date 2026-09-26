# Finance / budget / projection screens in management & tycoon games — reference sweep

> Provenance: written by a Sonnet research subagent on 2026-09-25 for the finance planner mockups
> (`docs/design/mockups/K2-finance-plan.html`). The orchestrator looked at eight of the screenshots
> directly and corrected one misreading: in the Football Manager FFP image, "Currently £97.55M" is shown
> in green, not flagged red or orange as the subagent first wrote. Treat the rest as the subagent's
> claims until traced.

Purpose: reference designs for a finance-and-forward-planning screen for an AI-lab management
game (player buys compute, trains models, pays monthly bills, races rivals over ~5 eras).

All screenshots are saved in `shots/` next to this report, re-encoded as JPEG (so a `.png` source
became a `.jpg` file with the same name).

Every screenshot below was downloaded in this session and opened with the Read tool to confirm
it actually shows a finance/budget/chart screen (not just generic gameplay). Filenames match
what is on disk.

---

## 1. AI Lab Tycoon (Steam, 2026) — an AI-lab management game, directly on-topic

**Screenshot:** `01-ai-lab-tycoon-cash-profit-hud-loss-chart.jpg`
**Image source:** `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5015590/387a8d0d81bd5192321643f86fe4eb1473d20fb5/ss_387a8d0d81bd5192321643f86fe4eb1473d20fb5.1920x1080.jpg` (official Steam store screenshot)
**Page:** `https://store.steampowered.com/app/5015590/AI_Lab_Tycoon/`

What it shows: a persistent top HUD strip with **Cash** ($183K), **Profit/mo** (–$67.08K, shown
in red), **Compute**, **Reputation**, and **Rivals** — always visible, not a separate screen. In
this shot a pop-up email/sticky-note event shows a hand-drawn-style line chart of a model's
"train loss" over training epochs, tied to narrative events (morale/objective bumps). This is
the closest direct comparable to our own game (same genre, same "cash + monthly burn + compute"
framing), but note this screenshot shows the **live top-bar HUD**, not a dedicated finance
screen — I did not find (in the 12 official screenshots checked) a separate budget/projection
page for this game. Unconfirmed whether one exists.

Design takeaway: a persistent "cash / profit-per-month / compute" HUD row, always on screen, is
a cheap way to keep burn rate visible without a dedicated screen — worth doing regardless of
whatever full finance screen we build.

## 2. Startup Company (Steam, Behold Studios/Alex Nichiporchik)

**Screenshot:** `02-startup-company-website-finance-stats.jpg`
**Image source:** `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/606800/ss_60b0b2a8fb13081564c418913f9afbebe78c3562.1920x1080.jpg` (official Steam screenshot)
**Page:** `https://store.steampowered.com/app/606800/Startup_Company/`

What it shows: a per-product ("website") stats popup with tabs (Stats / Features / Hosting /
Marketing / Venture Capital / Support). The Stats tab shows "Right now" (online users), "Today's
Estimated Income" ($308.14K, with a parenthetical alternate estimate), itemized expenses and
valuation, a server-usage gauge, and **two historical line/area charts** ("Online users" by
hour, "Registered Users" by day) below.

Design takeaway: pairing a single big "today's estimated income" number with small historical
trend charts right underneath (hour-granularity and day-granularity side by side) is a good
pattern for showing both "right now" and "how did we get here" without needing a separate
screen — very transferable to an AI-lab game's per-model or per-product revenue view.

## 3. Victoria 3 (Paradox)

**Screenshot:** `03-victoria3-company-profit-chart.jpg`
**Image source:** official Steam screenshot, `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/529340/46994093243bf46a6d786ac66604829a76db0de4/ss_46994093243bf46a6d786ac66604829a76db0de4.1920x1080.jpg`
**Page:** `https://store.steampowered.com/app/529340/Victoria_3/` (appid confirmed via Steam storesearch API)

What it shows: a company-level "Statistics" tab (for the in-game company "Hudson's Bay
Company") with six small line-chart tiles: Productivity, Prosperity, **Company Profit** (a
33-year span, 1836–1869, showing a slow climb), and three building-count tiles (Logging Camps,
Fishing Wharves, Trade Center). Each tile is a full historical series, not a projection.

⚠️ I could **not** find (within this session's search) a screenshot of the specific national
**budget/treasury panel with a "weekly balance" projection** that the original task brief
described from written sources (Paradox forum/wiki text confirms the mechanic exists — "at the
end of every week, income and expenses are tallied" — but I did not get an image of that exact
panel; I checked 5 of Victoria 3's 17 official screenshots plus a battle screen and a tech-tree
screen, none of which show it). Treat the "weekly balance projection" claim as **unconfirmed by
screenshot** — the company-profit chart above is confirmed and relevant, but is a different
panel (company-level historical profit, not the national weekly-balance forecast).

Design takeaway (from the confirmed chart): long historical series (decades, not just a
"business quarter") shown as small multiples side by side lets the player see whether a metric
is trending, not just its current value — good pattern for an AI-lab game spanning eras.

## 4. RollerCoaster Tycoon (RCT1/RCT2 shared UI) — "Financial Summary" window

**Screenshot:** `04-rollercoaster-tycoon-financial-summary.jpg`
**Image source:** `https://static.wikia.nocookie.net/rct/images/e/e5/Financial_Summary.jpg` (RollerCoaster Tycoon Fandom wiki)
**Page:** `https://rct.fandom.com/wiki/Financial_Summary`

⚠️ Coverage note: the page this image sits on is titled for the original **RollerCoaster
Tycoon**, and the wiki treats the Financial Summary window as effectively unchanged between RCT1
and RCT2 (same tab set: Summary / Graph / Value graph / Profit graph, same table). I could not
independently confirm from an RCT2-specific screenshot that the exact table layout is pixel
identical in RCT2 (none of RCT2's 5 official Steam screenshots show the finance window), so I'm
presenting this as "the RCT-series Financial Summary design," not confirmed RCT2-exact pixels.

What it shows: a **monthly ledger table**, columns = months (May–September), rows = income/cost
line items (ride construction, running costs, land purchase, landscaping, park entrance
tickets, ride tickets, shop sales/stock, food/drink sales/stock, staff wages, marketing,
research, loan interest), with a **total row per month** and running **Loan** amount + interest
rate, **Park value**, **Company value**, and **Cash** at the bottom.

Design takeaway: itemized monthly income/expense table with per-category rows and a visible
loan balance + interest rate is the classic "you can see exactly why you're losing money"
design — very translatable to a monthly compute-bill breakdown (training runs, inference
serving, staff, data licensing, etc.) in our game.

## 5. Prison Architect — Finance report

**Screenshot:** `05-prison-architect-finance-cashflow.jpg`
**Image source:** `https://static.wikia.nocookie.net/prison-architect/images/b/b6/Reports_finance.png` (Prison Architect Fandom wiki)
**Page:** `https://prison-architect.fandom.com/wiki/Finance`

What it shows: a "Finance" report card (under Reports, requires hiring an Accountant) split into
"Cashflow" (Federal Grant, Prisoner Grant, wages by role, days-without-incident bonus,
corporation tax) and "Other Transactions" (food, reform programs, exports, shop revenue), each
with an Income and an Expenses column, a Total row, and a big **Net $/day** figure at the
bottom — plus **Pay Cut 10% / Pay Raise 10%** buttons directly under the net figure that show
the total pay-rise percentage and its dollar cost per day live.

Design takeaway: putting the "here's a lever you can pull" control (staff pay raise/cut)
directly beside the net-income figure it affects, with the cost of pulling it shown immediately,
is a strong pattern for tying a *goal* (better morale via pay raise) directly to its *cost* — we
could use exactly this for e.g. "give researchers a raise" or "buy more compute" decisions.

## 6. Motorsport Manager

**Screenshot:** `06-motorsport-manager-hq-balance-benchmark-chart.jpg`
**Image source:** official Steam screenshot, `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/415200/ss_49297131e20d1919ecf867710d4c7723e823fde7.1920x1080.jpg`
**Page:** `https://store.steampowered.com/app/415200/Motorsport_Manager/`

What it shows: the Headquarters screen with a persistent **Balance** figure top-of-screen (a
dropdown, suggesting more detail is one click away) and a "Headquarters Stats" panel with a
green **bar chart comparing your team's facility stats to "Best in Championship" vs "Average
Team"** — i.e., a relative-benchmark chart, not a time series. A "Finances" tab is visible in
the bottom nav bar but its content isn't in this screenshot.

⚠️ I did not get a screenshot of the Finances tab's actual content — this is inferred from the
visible tab only, not confirmed.

Design takeaway: benchmarking your own numbers against "best rival" and "average rival" bars
(rather than only your own history) is a good way to make a lab's spend/output feel
competitive — could work well for comparing compute budget or model quality against rival labs
in our game (the brief already mentions racing rivals).

## 7. Offworld Trading Company

**Screenshot:** `07-offworld-trading-company-live-market.jpg`
**Image source:** official Steam screenshot, `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271240/ss_fdb1d1301e763bd7cdbed153a2e83a2801bbdc67.1920x1080.jpg`
**Page:** `https://store.steampowered.com/app/271240/Offworld_Trading_Company/`

What it shows: this game's entire economic core is a **live commodity market sidebar** — each
resource (power, water, food, O2, etc.) has a live price, a rate-of-change indicator (+1.55,
–0.25...), quantity-to-trade steppers, and a buy/sell price; a right-hand panel shows rival
companies' cash, stock ownership percentages and health bars, with a **news ticker** below
narrating stock buyouts and sabotage in real time ("Sam Moreno bought 1,000 shares of Frank
Dawson's stock!"). There's also a **debt/interest tracker** ("Debt $51,676") with a Pay Debt
button top-left.

Design takeaway: live, constantly-ticking prices (rather than a static end-of-month report) plus
a narrated news feed of rivals' financial moves makes the economy feel alive and competitive —
relevant if we want the player to feel rivals reacting to compute/talent prices in real time
rather than just checking a monthly statement.

## 8. Big Pharma

**Screenshot:** `08-big-pharma-loans-comparison.jpg`
**Image source:** official Steam screenshot, `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/344850/ss_1791627c95df678db6ddd177cbde14954cc88a08.1920x1080.jpg`
**Page:** `https://store.steampowered.com/app/344850/Big_Pharma/`

What it shows: a "Loans" popup listing **three competing lenders** ("Future Money", "McLoans",
"Loans 'R' Us"), each showing available cash, interest rate (18–20%), term length (2–4 years),
and **daily payment** — with Repay/Take buttons per lender. This is a direct, explicit
loan-shopping screen.

Design takeaway: presenting 2–3 loan/financing offers side by side with rate/term/daily-cost
made explicit (rather than one fixed loan mechanic) is exactly the "what-if" financing decision
the brief asked about — directly reusable for a "raise capital / take investor money" screen in
our game, with different investors offering different strings attached.

## 9. Universal Paperclips (browser game, Frank Lantz)

**Screenshot:** `09-universal-paperclips-business-panel.jpg`
**Image source:** live capture of `https://www.decisionproblem.com/paperclips/index2.html` (headless Chrome screenshot, official/only version of the game)

What it shows: this is the actual game's minimalist "Business" panel at the very start of a run:
Available Funds, Unsold Inventory, Price per Clip (with lower/raise buttons), Public Demand %,
and a Marketing upgrade with its cost — plus a separate "Manufacturing" section with per-unit
wire cost. ⚠️ This is the **early-game state only**; the game's economy grows far more complex
later (a "Trust"/investor mechanic, a stock-market-like AutoClipper economy, eventually
computational resource management directly relevant to an AI-lab game) but a static screenshot
can't show a later save state without progressing the idle game, which was out of scope for this
sweep.

Design takeaway: even an extremely minimal, text-only economy panel (a handful of labeled
numbers and two buttons) can carry the "am I making money and why" feeling — useful reminder
that our finance screen doesn't need heavy chrome to communicate the essentials.

## 10. Cities: Skylines

**Screenshot:** `10-cities-skylines-economy-budget-taxes.jpg`
**Image source:** `https://static.wikia.nocookie.net/skylines/images/6/64/Economy_interface.jpg` (Cities: Skylines Fandom wiki)
**Page:** `https://skylines.fandom.com/wiki/Economy`

What it shows: the "Economy" window with three tabs (**Taxes / Budget / Loans**). The Taxes tab
shown has six zone-type tax-rate sliders (residential low/high density, commercial low/high,
industrial, office), each defaulted to 9%, and a bottom "Income / Expenses" panel breaking out
Total income by zone type, a detailed Expenses list by service (police, fire, healthcare, parks,
etc.), and a bottom-line **Total / Income** figure.

Design takeaway: a tax-rate slider per revenue category, with the resulting income total updated
live below, is a clean "adjust a lever, see immediate effect on the bottom line" pattern — could
map to e.g. pricing tiers for an AI model API, or spend-allocation sliders across
research/compute/marketing.

## 11. OpenTTD (open-source Transport Tycoon)

**Screenshots:** `11-openttd-finances-3year-table.jpg` (shipped design) and
`11b-openttd-finances-redesign-proposal.jpg` (a since-discussed redesign)
**Image source:** both from a GitHub pull request discussing finance-window improvements,
`https://github.com/OpenTTD/OpenTTD/pull/9827` (screenshots embedded by the PR author,
`user-images.githubusercontent.com`)
**Page:** `https://github.com/OpenTTD/OpenTTD/pull/9827`; background text from
`https://wiki.openttd.org/en/Manual/Finances` (page had no embedded screenshot itself — text
only, confirmed by reading it, hence sourcing the image from the linked PR instead)

What it shows: the actual OpenTTD company finance window — a **3-year table** (matching the
task brief's description exactly) with rows for Train/Road Vehicle/Aircraft/Ship income and
running costs, property maintenance, loan interest, construction and other costs, a Total row
per category-group, and **Bank Balance / Loan / Maximum Loan** with **Borrow £10,000 / Repay
£10,000** buttons at the bottom. The "b" image shows a community-proposed redesign that groups
the same data under Revenue / Operating Expenses / Capital Expenses with an explicit **Net
Profit** row.

Design takeaway: showing 3 years side by side (not just current vs. last month) lets the player
see whether a cost category is a one-off or a trend; the redesign's "Net Profit" row addition is
a good reminder that a running total should always be visible so the player doesn't have to
sum columns mentally.

## 12. Football Manager (SI Games / SEGA)

**Screenshots:** `12-football-manager-transfer-budget-inbox.jpg`,
`12b-football-manager-ffp-three-year-finances.jpg`
**Image source:** official developer marketing images, `https://cdn.footballmanager.com/site/inline-images/Transfer%20Budget_ENG_V2_WIP.png` and `.../FFP_ENG_V2_WIP.png`
**Page:** `https://www.footballmanager.com/features/smarter-transfers-squad-building-and-finance`

What it shows: two inbox-message screenshots (not the full Finances screen itself — see caveat
below) from the "Finances" module: one shows an "Insufficient transfer budget" warning breaking
out Transfer Budget, Wage Budget (with current vs. committed weekly spend), and an "Amount
Needed" figure with a link into "Finances - Budgets"; the other shows a "Financial Fair Play
Regulations" notice stating a **Board Investment cap** and a **"Finances (Three-Year Period)"
cap** ("Max. (£15M)", "Currently £97.55M" shown in green), with a "View
Finances" button.

⚠️ I could not get a screenshot of the actual Finances overview screen (the one widely described
online as having a "projected balance" graph across future seasons) — only these two inbox
notifications that reference budgets. Treat "Football Manager has a graphed multi-year balance
projection" as **plausible but unconfirmed by screenshot** in this session (community
wiki/community threads describe income vs. wage projections at the start of each season, but I
did not verify with an image).

Design takeaway: framing a hard financial rule (FFP) as a **regulatory cap tied to a rolling
multi-year total**, with the club shown as currently over/under that cap, is a strong "long-term
constraint, not just a monthly number" pattern — could map well to something like a "burn-rate
runway" or "investor covenant" mechanic across multiple eras in our game.

## 13. Capitalism Lab (Enlight Software)

**Screenshot:** `13-capitalism-lab-income-statement.jpg`
**Image source:** `https://www.capitalismlab.com/wp/wp-content/uploads/2017/07/income-statement.png` (official developer screenshot)
**Page:** `https://www.capitalismlab.com/ces-dlc/ultra-realistic-city-economic-simulation/`

What it shows: an extremely dense **city Income Statement** window with three time-granularity
columns side by side — **Last Month, Year-to-Date, and Lifetime (54 years in this save)** — for
every revenue and expenditure category (consumer/income/corporate taxes, land sales, sector
income; administrative, education, police, fire, healthcare, unemployment benefits, bond
interest), each with an inline bar showing relative size, plus Total Revenue / Total
Expenditures / Surplus-Deficit rows. A separate side panel shows macro indicators: Inflation,
Unemployment Rate, Real Wage Rate, Economic State (flagged "Recession"), GDP Growth, Loan
Interest Rate, Central Bank Attitude/Policy, and Money Supply vs Money Demand bars.

Design takeaway: showing the **same line items at three time granularities at once** (last
month / year-to-date / all-time) avoids needing separate screens for "how am I doing now" vs
"how am I doing overall" — probably the single most directly reusable layout idea in this sweep
for a finance screen that also needs to answer "are we on track for the 5-era goal."

## 14. LLM Tycoon (Steam) — bonus / partially confirmed

**Screenshot:** `14-llm-tycoon-company-finance-tab-unconfirmed.jpg`
**Image source:** official Steam screenshot, `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4861430/3bdf24305d8e1ea2babefa212eb4f4655f6a18e9/ss_3bdf24305d8e1ea2babefa212eb4f4655f6a18e9.1920x1080.jpg`
**Page:** `https://store.steampowered.com/app/4861430/LLM_Tycoon/`

⚠️ This screenshot only proves the game **has** a dedicated "Company" panel with **Overview /
Finance** tabs (visible top-right of the popup) — the screenshot happens to show the Overview
tab, not Finance, so the actual finance-screen content is **unconfirmed**. I checked all 6 of
this game's official screenshots (also showing Hardware/Compute-allocation and Market/World
Economy panels, both close cousins to our own game's compute-budget concept) and none land on
the Finance tab itself. Listed here only because the game is directly on-topic (an
LLM-company management game with Cash/Compute HUD, model pricing, and a dedicated Finance tab)
and because the existence of a Finance tab is itself a useful signal that this genre expects one.

---

## Games checked but NOT included (no confirmed finance screenshot found)

Per the "never invent a feature" instruction, these were investigated but dropped rather than
represented by a guess:

- **Software Inc.** — Steam discussions describe a "monthly profit breakdown" and requests for
  "more detailed financial reports," and the game is finance-heavy by reputation, but none of
  its 7 official Steam screenshots show a finance window, and its community wiki has no
  "Finances" article (confirmed empty on the `softwareinc.fandom.com` wiki search). Unconfirmed.
- **Mad Games Tycoon 2** — its Steam description explicitly promises "tons of charts and
  numbers to track your current and all-time successes," but none of its 15 official
  screenshots show that screen, and a search for community screenshots of it did not surface one
  within this session's time budget. Unconfirmed.
- **SimCity 4 / SimCity (2013)** — not checked in depth this session (time budget); dropped in
  favor of the confirmed Cities: Skylines and Capitalism Lab budget panels, which cover the same
  design space (tax sliders + income/expense breakdown).
- **Airport CEO** — 26 official screenshots reviewed via contact sheet; none clearly show a
  finance-specific screen (one "Operations Overview" panel was visible but not confirmed as
  finance-related at readable resolution). Dropped rather than guessed.

## Patterns worth stealing (forward-projection emphasis)

1. **Multiple time granularities of the same line items, side by side** (Capitalism Lab: Last
   Month / YTD / Lifetime). This is the single strongest idea for a game spanning "~5 eras" —
   the player needs both "am I solvent this month" and "am I on pace for the whole run" without
   switching screens.
2. **Itemized category rows with a visible running total** (RollerCoaster Tycoon, Prison
   Architect, OpenTTD, Cities: Skylines) — every strong example broke spend into named
   categories (wages, compute/rides/services, marketing, interest) rather than one lump number,
   so the player can see *which* lever to pull.
3. **Ties between a lever and its cost, shown together** (Prison Architect's pay-cut/raise
   buttons directly under net income; Cities: Skylines' tax sliders directly above the resulting
   income total; Big Pharma's per-lender rate/term/daily-payment side by side). None of the
   games surveyed showed a true "drag a slider N years into the future and see the projected
   balance change live" control — the closest anyonegot was multi-year historical tables (RCT,
   OpenTTD, Capitalism Lab, Victoria 3's company charts) plus hard forward-looking caps (Football
   Manager's FFP three-year spending ceiling). **A genuinely interactive forward projection
   (not just a historical trend line) looks like a gap in this genre, not a solved, copyable
   pattern** — worth treating as a design opportunity rather than assuming a reference exists to
   copy.
4. **Persistent top-bar HUD for burn rate** (AI Lab Tycoon's Cash/Profit-per-month HUD,
   Motorsport Manager's Balance dropdown, Offworld's live ticker) — cheap way to keep the
   player aware of burn without opening a screen; complements rather than replaces a full
   finance screen.
5. **Loan/financing comparison as a real decision** (Big Pharma's three lenders; RCT's and
   OpenTTD's visible loan-plus-interest-rate) — gives "raise capital" real trade-offs (higher
   daily cost vs. more cash now), which maps naturally onto an "investor round" or "take on
   compute debt" mechanic.
6. **Rival/competitive framing of the numbers** (Motorsport Manager's Best-in-Championship vs
   Average-Team bars; Offworld's live rival cash + stock ownership + news ticker) — since the
   brief's game already races rivals over eras, showing the player's burn/output next to a
   rival's (even approximate) numbers would fit the genre's established taste.
7. **What players complain about**: the one concrete complaint found in this sweep (Steam
   discussion) was about **Software Inc.** — players wanting a more detailed financial report
   than the existing monthly dropdown. ⚠️ This is a single discussion thread I saw in search
   results, not something I read end-to-end or verified with a screenshot — flagging as a weak
   signal only: players want *more* financial detail/history available, not less, when a game's
   report feels shallow.

## Coverage statement

**Fully read/verified this session (opened and read to the end, or, for images, opened and
visually confirmed):**
- All 16 images in `shots/` were downloaded in this session and opened with the Read tool before
  being included or excluded.
- Wiki pages read via the in-app Browser tool and confirmed to their content (not just a
  snippet): `https://rct.fandom.com/wiki/Financial_Summary` (image extracted, no body text to
  read), `https://prison-architect.fandom.com/wiki/Finance` (image extracted),
  `https://skylines.fandom.com/wiki/Economy` (image extracted), `https://softwareinc.fandom.com/wiki/Finances`
  (confirmed empty/does-not-exist), `https://softwareinc.fandom.com/wiki/Special:Search?query=finance`
  (confirmed no relevant article), `https://wiki.openttd.org/en/Manual/Finances` (confirmed no
  body text/no image on page, redirected sourcing to the linked GitHub PR),
  `https://www.footballmanager.com/features/smarter-transfers-squad-building-and-finance` (page
  images enumerated and two downloaded/verified), `https://www.capitalismlab.com/ces-dlc/ultra-realistic-city-economic-simulation/`
  (image extracted and verified).
- Steam store data: fetched via the official `store.steampowered.com/api/appdetails` endpoint
  for all 13 games with Steam pages (AI Lab Tycoon, LLM Tycoon, Software Inc., Mad Games Tycoon
  2, Startup Company, Victoria 3, Prison Architect, RollerCoaster Tycoon 2, Motorsport Manager,
  Offworld Trading Company, Big Pharma, Airport CEO, Cities: Skylines) — full screenshot lists
  retrieved and every game's screenshot set reviewed via a generated contact sheet (all
  thumbnails), with individual full-resolution downloads for every screenshot that looked
  promising.

**⚠️ Not fully verified / partial or unreached:**
- **Victoria 3's national "weekly balance" budget/treasury panel** — described only from text
  (Paradox forum + wiki), never seen as an image in this session. The Victoria 3 screenshot used
  in this report (company profit chart) is a *different, confirmed* panel.
- **Football Manager's actual Finances overview screen** (with any projected-balance graph) —
  not reached; only two inbox-notification screenshots referencing budgets were confirmed.
- **RollerCoaster Tycoon 2-specific pixels** for the Financial Summary window — the confirmed
  image is captioned for the original RollerCoaster Tycoon; RCT2 is understood (per the wiki
  text) to share the same window design but this was not independently confirmed against an
  RCT2 screenshot.
- **Software Inc. and Mad Games Tycoon 2 finance/chart screens** — actively searched (official
  Steam screenshots, community wikis, Steam community screenshot listings) but no qualifying
  image found; excluded rather than guessed.
- **SimCity 4, SimCity (2013), Airport CEO's finance screen specifically** — lower-effort pass
  only (contact-sheet review for Airport CEO; no dedicated search for the SimCity titles) given
  the session's time budget once 13+ other games were already confirmed.
- A few web pages returned only short AI-generated summaries from the search tool rather than
  full page text (marked inline where relied upon, e.g. the Steam-discussion complaint about
  Software Inc.'s financial reporting) — treated as a weak/unverified signal, not a confirmed
  finding.

No feature was asserted as present in a game without either a screenshot confirming it or an
explicit "unconfirmed"/"plausible but unconfirmed" flag next to the claim.
