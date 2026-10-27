# IPO research (lane gn-ipo, 2026-10-27)

Research behind making the IPO a long, central arc in Game Night AI Lab. Today the IPO is one choice on one event card
(`sim/data/realEvents.js`, `blacklistAppeal` → `ipo`, +$50M cash). The original design spec left an "IPO sequence"
out of the hackathon build (`docs/superpowers/specs/2026-09-25-game-night-ai-lab-design.md` §10).

Four research subagents (Opus) wrote the notes in `notes/` on 2026-10-27. The orchestrating session read all four
notes end to end and spot-checked the biggest new fact on SEC EDGAR itself (Anthropic's filing list, CIK 2130357).
Every other claim is the subagents' finding, relayed from their notes. Treat the notes as **raw research**: each marks
partial reads with ⚠️ inline and ends with its own coverage statement.

**Disclosure.** The notes were written by Claude models, which Anthropic makes, and Anthropic's own IPO filing is one
of the main sources. The notes report what the filing says and quote it; they add no judgment about Anthropic. The
game's labs stay fictional.

## Reading order

1. This README: the findings that matter for the game, conflicts between notes, and what is unverified.
2. `notes/ipo_process_and_cases.md`: the US IPO stage by stage with real lengths, filing-by-filing timelines from
   EDGAR (SpaceX, CoreWeave, Figma, Arm, Reddit, Snap, Cerebras, Anthropic), bank fees, first-day returns, lockups,
   and the status of every AI lab's listing as of 2026-10-27.
3. `notes/structures_and_mission.md`: dual-class shares, public benefit corporations (PBCs), OpenAI's structures and
   the attorneys general's conditions, Anthropic's Long-Term Benefit Trust as written in its S-1, foundation owners,
   golden shares, capped profit and the Windfall Clause, with a comparison table.
4. `notes/life_after_listing.md`: earnings and guidance, activists, short sellers and "AI washing", takeovers and
   defences, stock pay and retention, disclosure duties around incidents, insider-trading rules, and what lab leaders
   have said about public markets and safety.
5. `notes/games_and_public_markets.md`: how Capitalism Lab, Offworld Trading Company, Software Inc., Startup Company,
   Railroad Tycoon II, Railroads!, OpenTTD, Scaling Laws, Universal Paperclips, Acquire, 1830 and Chicago Express
   model share issues and public markets, and which patterns make an arc rather than a cash button.

## What matters for the game

**The real thing is long, staged and mostly invisible until late.**

- From the first confidential draft to the first trade took 74 days (SpaceX), 102 (CoreWeave), 107 (Figma), about
  4.5 months (Arm), about 27 months (Reddit, through a closed market) and about 23 months with a withdrawal and refiling
  (Cerebras). The SEC's first comment letter came 24 to 30 days after each first draft; later rounds about two weeks
  apart (`notes/ipo_process_and_cases.md`, EDGAR filing lists).
- Anthropic filed a confidential draft on 2026-06-01, five confidential amendments (2026-07-13, 08-10, 09-04, 10-01,
  10-09), and its public S-1 on 2026-10-26. **Verified directly on EDGAR by the orchestrating session.** The drafts
  must be public at least 15 days before the roadshow, so the roadshow can start no earlier than about 2026-11-10.
- The public part is short: flip at least 15 days before the roadshow, a roadshow of one to two weeks, pricing the
  evening before trading, and a first trade that often prints hours after the opening bell.
- Real SEC comment letters read like event cards. CoreWeave's first letter (30 comments) asked it to name its top
  customers, substantiate "AI Hyperscaler driving the AI revolution", file related-party contracts, quantify debt
  service, and explain a material weakness in its controls.

**Pricing night is a real gamble with real base rates.**

- Over 9,345 US IPOs from 1980 to 2025, the average first-day gain was 19.0% (median 7.0%), and 16.5% closed day one
  below the offer price. Deals priced above their range gained 50% on average; deals priced below it, 3% (Ritter).
- Weak demand shrinks the deal: CoreWeave cut from a $47–55 range to $40, leaned on an Nvidia anchor order (news-only),
  and closed flat. Hot demand leaves money on the table: Figma sold at $33 and closed day one at $115.50.
- Bank fees scale down with size: about 7% on mid-size deals, 0.67% on SpaceX's $75 billion deal.

**Governance is decided before listing day, and each lock has a matching weakness.**

- Nasdaq Rule 5640 bars a listed company from cutting existing holders' votes, so control devices must exist before
  the IPO (`notes/structures_and_mission.md`, ⚠️ rule read in part).
- Anthropic's S-1: a trust elects 4 of 7 directors through Class T stock; a founders' LLC holds one Class F share with
  50.1% of general votes; employees get a narrow Class E vote; public Class A holders generally cannot affect votes.
  The S-1 itself says this makes unsolicited bids, tender offers and proxy contests unlikely. The trust can be amended
  or redeemed only by stacked supermajorities (⚠️ S-1 read in excerpts).
- OpenAI's nonprofit appoints every director of OpenAI Group PBC through Class N stock; under the attorneys general's
  October 2025 conditions its Safety and Security Committee can halt model releases even where risk thresholds allow
  them. Control lasts only while the nonprofit keeps its Class N stock.
- A PBC alone is a weak lock: since 2020 a simple majority can drop the status, only 2% (or $2M) holders can sue, and
  there are no reported court opinions. Allbirds, a listed PBC, dropped the status on 2026-06-15 to pivot to AI
  infrastructure.
- More insulation has a price: index-exclusion risk (FTSE Russell's 5% free-float vote rule), a dual-class valuation
  premium that fades over time (⚠️ abstract only), and public holders with "very few governance rights".

**Life after listing is where the pressure lives.**

- Markets punish visible long-term spending and reward cuts within a day: Meta −25% on its metaverse loss warning
  (2022-10-27) and more than +20% after the "Year of Efficiency" (⚠️ rally size from search snippets); Microsoft about −10% on AI capex (January 2026); Meta about
  −10% on a higher AI capex range (April 2026).
- In a survey of 401 executives, 55% would skip a very good project to avoid missing the quarter's consensus (⚠️
  abstract only). Public firms invest less, and respond more slowly to opportunities, than comparable private ones.
- No 8-K item covers an "AI safety incident", but the four-business-day cyber rule, the "hypothetical risk that already
  happened" theory (Facebook paid $100M in 2019) and near-automatic stock-drop suits (CrowdStrike sued 11 days after
  its outage) make an incident a disclosure clock and a lawsuit.
- Activists (5% stake, universal proxy since 2022) demand cuts, buybacks and seats; short sellers attack hype and soft
  metrics (Hindenburg on Super Micro: delayed filing, auditor resignation, subpoenas); the SEC has brought "AI washing"
  cases since 2024.
- Lockups are now staged and tied to earnings (Anthropic: 10% on day one for some insiders, 35% more after the 2026
  annual results, founders up to 365 days). CoreWeave rose from $40 to above $183, then fell to about $93 after its
  lockup ended as insiders sold (news-only).
- Lab leaders have said public markets and safety decisions can conflict. Altman in 2023: public investors would view
  some superintelligence decisions "very strangely". OpenAI filed confidentially (announced 2026-06-08) and on
  2026-09-12 Altman called an IPO now "ill-advised" on safety grounds (news-only). Anthropic's S-1 lists "moderating
  the pace of the development of our models for safety-related reasons" among actions that may hurt results.

**Games almost never stage the IPO itself; the arc lives after it.**

- Capitalism Lab's whole IPO page is three sentences. No video game surveyed stages listing day as an event with an
  uncertain outcome, so that part is open ground.
- The arcs that work put an opponent on your stock and a judge on your results: Offworld Trading Company's own shares
  as visible hit points (made slow and readable after players hated surprise buyouts); Railroad Tycoon II investors
  who fire the chairman over a five-year return; Capitalism Lab's chairman who warns once, then fires; board games
  where raising money and selling control are the same act.
- The common failure is a share price the player can pump with their own trades or cash (Railroads!, Railroad Tycoon
  II buybacks, OpenTTD's infinite-money loop, Software Inc.'s patched exploits). In a real-time-with-pause game, check
  that no market action can be chained inside one paused instant.
- Scaling Laws is the only AI-lab game with a real funding model (valuation from frontier position, revenue and a
  sentiment cycle; a state loan that blocks takeovers at a price). None of the AI-lab games was found to have an IPO.

## Conflicts and corrections between notes

- **Earlier project research is out of date.** `docs/research/ai-lab-mechanics/report.md` listed "the S-1 filing dates
  of both labs" as unverified. Anthropic's dates are now verified on EDGAR; OpenAI's confidential draft is announced
  but not visible on EDGAR (expected while it is confidential), and its reported submission date (about 2026-05-22)
  is unverified.
- **xAI** is no longer independent: SpaceX acquired it effective 2026-02-02 and listed on 2026-06-12 (SpaceX 424B4).
  xAI dropped its Nevada benefit-corporation status by 2024-05-09 (news-only).
- **Anthropic trustees:** the S-1 and Anthropic's trust web page disagree on two trustees' start dates, and the web
  page lists a trustee the S-1 does not. Unresolved.
- **Oracle–PeopleSoft opening bid:** $16 in one account, $24 in the AP article read. Unresolved; not used.
- **Meta's October 2025 drop:** 6% or about 11% depending on the source. Unresolved; not used.

## Not verified (do not state as fact)

- Anthropic's reported mid-November listing date and $1.5–2 trillion valuation; the size of its raise.
- OpenAI's submission date, banks and $1 trillion target.
- The often-quoted "about 80% of executives would cut R&D to hit earnings" (only the abstract was reachable).
- Every first-day trading price (news-only), Nvidia's $250M CoreWeave anchor order, the CoreWeave lockup slide.
- Jensen Huang's March 2026 "last checks" remark (paraphrase only, no exact quote).
- Hindenburg's closure; whether the SEC adopted optional half-year reporting (proposed 2026-05-05).
- Mechanics of several games (share-price formulas for Capitalism, Software Inc. and Railroads!; session lengths; the
  unreleased Steam "AI Lab Tycoon").

## Coverage

- **Read in full by the orchestrating session:** the four notes in `notes/`; the EDGAR filing list for Anthropic, PBC
  (CIK 2130357), which confirms the DRS dates and the S-1 date above.
- **Read by the subagents:** see each note's coverage statement. Common gaps, flagged ⚠️ in the notes:
  - the Anthropic S-1 (about 1.56 million characters) was read in targeted excerpts by three agents, never end to end;
  - the SpaceX, Cerebras, CoreWeave, Arm, Reddit, Snap and Figma prospectuses were read in their first 100,000
    characters or in excerpts;
  - academic papers (Graham–Harvey–Rajgopal, Asker et al., Skinner–Sloan, Field–Hanka, Cremers et al.,
    Bebchuk–Kastiel) were read as abstracts or author summaries only;
  - the Railroad Tycoon II and Capitalism II manuals and the 1830 rulebook were read in their finance and stock
    sections only.
- **Method caveat** (from `notes/ipo_process_and_cases.md`): most web pages were read through a fetch tool that returns
  a model-written digest of the page, not its raw text.
- **Access:** www.sec.gov refuses scripted downloads without a contact email in the request header; per the research
  rules no email was supplied, so filings were read through EDGAR's full-text search index and a browser tab.
- Downloaded source text (SEC forms, Ritter's statistics PDF) stayed in the session scratchpad and is not committed;
  every source is linked from the notes.
