# Real compute contracts, chip allocation and financing: tensions for a game (2025 to 26 October 2026)

Scope and method. This file builds on `docs/research/compute-mechanics/report.md` and `docs/research/compute-mechanics/notes/real_compute_deals.md` (both read in full before starting; the second was read in two pages, lines 1-305 then 306-395). It does not redo their deal catalogue (Microsoft-OpenAI restructuring, NVIDIA 100B LOI, AMD warrant, Broadcom, Oracle 300B, Amazon/Google-Anthropic, Meta/Blue Owl, xAI SPV, CoreWeave DDTLs, Nebius-Microsoft). It adds what is new, what changes an earlier claim, and a decision tension per dynamic. Today is 26 October 2026. Anything before 2025 is background and is marked so.

Sourcing caveat that applies to every "read" below: the fetch tool returns a model-written extraction of each page, not raw page text. So "read" means "extracted by the tool in this session," and a page that came back truncated or only as a summary is flagged. Search-result snippets are flagged. Where a source is an aggregator summarizing a paywalled original (The Information, SemiAnalysis, FT, WSJ, Bloomberg), the original was not read and the claim carries a warning.

---

## 1. What is new since September 2026, or not covered earlier (contracts, renegotiations, cancellations, take-or-pay, penalties)

### Takeaway
The big new fact is that the fragile layer got visibly more fragile in October 2026: CoreWeave's bonds trade near distress yields, Gartner forecasts most neoclouds will lose independence by 2030, Microsoft walked away from a UK Nscale site over grid timing, and NVIDIA's own 10-Q shows it carrying about 108.5B of guarantees and 36B of take-or-pay floors to prop up its customers. Earlier notes said no full cancellation had been found; there are now two clean exits (Microsoft at Nscale Loughton, OpenAI pausing Stargate UK) and a visible cut in OpenAI's headline compute plan (1.4T to about 600B).

### Cited Findings

**A. Buyer forecast resets (the dominant failure mode, now with a headline number)**
- OpenAI told investors it targets about 600B of total compute spend by 2030, and Altman said on X that "the world will be capacity-constrained for some time" while launching a "Guaranteed Capacity" product (1, 2 or 3 year commitments, larger discount for longer, sold "until OpenAI sells out of its current allocation"). Private investors value OpenAI above 850B. — [Pulse 2.0, 21 May 2026](https://pulse2.com/openai-new-guaranteed-capacity-offering-lets-customers-secure-long-term-ai-compute/) (read whole page; it is a news write-up of Altman's X post, not the post itself).
- The 600B figure replaced the roughly 1.4T Altman had touted in late 2025. ⚠️ This comparison comes from a search-result summary of Forklog citing CNBC; neither the Forklog nor the CNBC article was opened. — [Forklog via search](https://forklog.com/en/openai-reduces-spending-plans-by-800-billion-amid-stargate-project-setback/)
- WSJ reported on 27-28 April 2026 that OpenAI missed internal revenue and user targets, that CFO Sarah Friar told colleagues she worried OpenAI "may not be able to pay for future computing contracts" if revenue did not grow fast enough, that directors were questioning data-center spending, and that OpenAI had pulled back from Stargate projects in Texas, the UK and Norway. Altman and Friar called the report "ridiculous" and said they were "totally aligned on buying as much compute as we can." Oracle, CoreWeave, NVIDIA and AMD shares fell and the Nasdaq 100 dropped about 1.5% the next day. ⚠️ The WSJ article and the DCD write-up (HTTP 403) were not read. The only page opened was a short Let's Data Science summary that confirms the CFO quote and board scrutiny but has no Stargate or market detail. The rest is from a search-result synthesis. — [Let's Data Science summary](https://letsdatascience.com/news/openai-misses-revenue-and-user-growth-targets-9dc87aea); [search synthesis](https://www.datacenterdynamics.com/en/news/openai-missed-revenue-and-user-targets-faces-internal-concern-over-meeting-data-center-spend-commitments-report/)
- OpenAI paused Stargate UK (reported 9 April 2026): the plan had been announced September 2025 with Nvidia and Nscale and was to include up to 31,000 AI accelerators; cited reasons were regulatory clarity and high UK energy costs; OpenAI "will only move forward when the economics and policy environment better support long-term investment." The same article links this to scrapping the Oracle Texas expansion. — [GuruFocus on Yahoo Finance](https://finance.yahoo.com/sectors/technology/articles/openai-pauses-stargate-uk-project-151318322.html) (read; the article itself says it lacks an OpenAI quote and defers to Bloomberg).
- Microsoft exited a planned Nscale data center in Loughton, UK. The stated reason is UK Power Networks saying sufficient grid capacity may not exist until the early to mid-2030s. Other Microsoft-Nscale projects continue. — [Kapitalmarktexperten, 19 Oct 2026](https://www.kapitalmarktexperten.de/iren-aktie-microsoft-zieht-sich-aus-nscale-projekt-zurueck/) (read, German-language finance site; no Microsoft or Nscale primary statement was found).
- Background, carried from the earlier notes and not redone: Oracle-OpenAI dropped the 600 MW Abilene expansion in March 2026; Microsoft walked from about 2 GW of leases in 2025 (TD Cowen).

**B. The shortest-leash big contract: Anthropic-SpaceX (xAI's Colossus)**
- SpaceX's S-1 describes cloud services agreements signed May 2026 under which Anthropic pays about 1.25B per month through May 2029 for Colossus I and II compute (over 300 MW, more than 220,000 NVIDIA GPUs on Colossus 1), with reduced fees during the May-June 2026 ramp. Either party may terminate on 90 days' notice. — [Search synthesis of several outlets](https://www.techloy.com/spacex-ipo-filing-reveals-anthropic-pays-41-million-a-day/) ⚠️ the S-1 itself, and the Techloy page, were not opened.
- Musk then said on X the real deal is a 180-day base lease followed by a mutual 90-day cancellation right, that "the short term was our request, not Anthropic's," and that SpaceX may need the compute back "if compute gets super tight." The S-1 shows the 90-day clause but not the 180-day base term. A 36-month reading is about 45B; a six-month reading is at most 7.5B. — [The Next Web](https://thenextweb.com/news/musk-spacex-colossus-anthropic-180-day-lease) (read in full).
- Decision tension: headline length (3 years, 45B) versus the real commitment (90 days). Taking a big, fast block of capacity from a rival who can reclaim it, versus paying more for capacity nobody can take back.

**C. Anthropic's stack of take-or-pay reservations (very new, weakly sourced)**
- A 6 September 2026 The Information analysis, as summarized by an aggregator, counts at least 14.8 GW secured "since October" and up to 517B over a decade: AWS 100B / 10 years / 5 GW Trainium3; Google-Broadcom 200B / 5 years / 5 GW; Fluidstack 50B; Nscale 45B; SpaceX 45B (about 1.25B a month); Lambda 35B. The summary calls them take-or-pay reservations "not on Anthropic's balance sheet," and its own items add to about 475B and 10 GW, leaving about 42B and 4.8 GW unattributed. — [AI News Weekly summary](https://aiweekly.co/alerts/the-information-anthropic-has-locked-in-148-gw-of-compute-worth-up-to-517b) ⚠️ this is a summary page; The Information's article was not read, and the "since October" year is not stated on the page.
- Background (Nov 2025): Anthropic committed 30B to Azure and "up to one gigawatt," with NVIDIA investing up to 10B and Microsoft up to 5B in Anthropic. — [Search results quoting the announcement](https://pureai.com/Articles/2025/11/18/Microsoft-and-Nvidia-deepen-ties-with-Anthropic.aspx) ⚠️ snippet only, page not opened.
- Decision tension: signing many large take-or-pay reservations while revenue is still ramping (Anthropic's growth is the reason it can) versus the Friar problem: obligations that outrun revenue.

**D. Take-or-pay with a financing gate: the Nebius-Microsoft contract is more precise than the earlier note said**
- Nebius's own 6-K (8 Sept 2025) says: about 17.4B total through 2031, up to about 19.4B if Microsoft adds capacity; delivery "in several tranches during 2025 and 2026"; Nebius's obligations "commence upon the confirmation by Nebius to Microsoft that it has secured any additional financing"; Microsoft may terminate a GPU service if delivery dates are missed after a grace period and no alternative capacity is supplied; either side may terminate for material breach not cured in 60 days or insolvency not dismissed in 30 days (Chapter 11 carve-out); service levels with liquidated damages for late delivery but no amounts. — [Nebius 6-K on SEC](https://www.sec.gov/Archives/edgar/data/1513845/000110465925088312/tm2525580d1_6k.htm) (primary, read via tool extraction).
- The extraction found no prepayment percentage in the 6-K. So the earlier notes' "about 6.96B upfront, about 40%" still rests on one aggregator (TheEnergyMag) and nothing primary supports it. Treat it as unconfirmed.
- IREN-Microsoft, five years, about 9.7B, reportedly with 20% prepayment, a 5.8B Dell procurement agreement and phased 2026 rollout at Childress, Texas. ⚠️ From a newsletter snippet only; no filing opened. — [Neural Foundry snippet](https://neuralfoundry.beehiiv.com/p/irens-97b-shock-microsoft-deal-is)
- Decision tension: the supplier has to raise money before the clock starts. A buyer can sign a headline contract that does not bind until the supplier's financing closes, so waiting on a fragile supplier costs time, not money.

**E. Delivery slips handled by schedule moves, not cancellation**
- CoreWeave Q3 2025: one data center delayed because an unnamed third-party developer was behind on a powered shell; full-year revenue guidance cut to 5.05-5.15B; customers agreed to adjust delivery schedules so backlog was not reduced; the CEO later said the delay was resolved ahead of the amended schedule; no single customer more than about 35% of backlog versus about 85% at the start of 2025. ⚠️ From a search-result synthesis; the DCD article (HTTP 403) was not read. — [DCD via search](https://www.datacenterdynamics.com/en/news/coreweave-q3-earnings-show-revenue-backlog-doubled-to-556bn/)
- Decision tension: accept a late delivery and keep the contract, or enforce the penalty and risk losing the supplier (and its queue position).

### Corrections to the earlier notes
- Rental prices have been rising since October 2025, not falling. The earlier report quoted H100 falling from 8-10 dollars an hour (2024) to 1.80-3.50 (mid-2026). SemiAnalysis (2 April 2026) shows the H100 one-year contract index up about 40%, from a low of about 1.70 in October 2025 to about 2.35 in March 2026; H100 contracts renewing at their original rates or for four years, through 2028; on-demand sold out across GPU types; Blackwell lead times into June-July 2026. See section 6. — [SemiAnalysis](https://newsletter.semianalysis.com/p/the-great-gpu-shortage-rental-capacity)
- "No full cancellation found" is outdated in spirit: Microsoft left the Nscale Loughton site and OpenAI paused Stargate UK (A above). Both are site-level exits, not breaches of a signed take-or-pay contract; no case of a lab walking from a signed take-or-pay contract was found.
- CoreWeave backlog is now primary-sourced: about 104B at 30 June 2026, excluding more than 25B of net new commitments added in early Q3 (earlier notes had 99.4B at 31 March). — [CoreWeave Q2 2026 release](https://investors.coreweave.com/news/news-details/2026/CoreWeave-Reports-Strong-Second-Quarter-2026-Results/) (read whole page via tool).

### Inferences
- The actual pattern across A-E is that the commitment survives and the schedule or site moves. Cancellation shows up as "paused," "exited a site," "reduced the plan," not "terminated the contract." A game can model exits as scope cuts with a visible reputation or supplier-trust cost.

### Gaps
- No filing was found that shows OpenAI formally reducing a signed Oracle, Microsoft or CoreWeave commitment; the 600B figure is a plan communicated to investors, not an amended contract.
- The Information, FT, WSJ and Bloomberg originals were not reachable (paywall or HTTP 403).

---

## 2. How chip allocation really works (who is served first, prepayment, use-it-or-lose-it, Blackwell to Rubin)

### Takeaway
NVIDIA's public rule is first come, first served, but its own filing shows it also acts as a financier: 279B of supply commitments, 36B of cloud take-or-pay floors and 108.5B of guarantees, so allocation is bundled with credit support for chosen customers. The generation transition is real and messy: Rubin's share of 2026 high-end shipments was cut from 29% to 22% by TrendForce in April, with Blackwell filling the gap.

### Cited Findings
- NVIDIA's 10-Q for the quarter ended 26 July 2026 (extracted by the tool with a targeted question, not read as a whole document): supply and capacity commitments rose "from 119 billion last quarter to 279 billion," mainly memory and manufacturing; some supplier agreements "may be cancelable, rescheduled, or adjustable" before firm orders; five direct customers held 22%, 14%, 13%, 11% and 10% of receivables (three customers held 25%, 18% and 13% at January 2026); for some investment-grade customers NVIDIA may offer 90 days to one year of payment terms. — [NVIDIA 10-Q on SEC](https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000075/nvda-20260726.htm) ⚠️ partial: targeted extraction of the commitments and concentration notes, not the whole filing.
- The same 10-Q: "AI cloud" agreements of 36B (0 for the rest of FY2027, then 6B, 8B, 7B, 6B, 9B), under which the AI clouds buy NVIDIA infrastructure and NVIDIA commits to cloud-service agreements; the clouds "can unilaterally stop providing" that capacity to NVIDIA and resell it to third parties; NVIDIA's commitment falls as third parties or NVIDIA use the capacity; NVIDIA takes a revenue share from third-party customers if criteria are met. — same filing, same caveat.
- SemiAnalysis's reading, via a summary: gross off-balance-sheet exposure of about 530B across six line items (up from 184B), an AI Cloud Partner program with a floor rate of about 2.35 dollars per GPU-hour against a market rate of 4.50-4.60, examples Firmus (21.1B, 360 MW Batam), SharonAI (4.2B), GMI (about 2.2B), and the argument that NVIDIA wins on both the GPU sale and any revenue above the floor while the neocloud "earns nothing but stays solvent" if demand falls. — [AI News Weekly summary of SemiAnalysis, 11 Sept 2026](https://aiweekly.co/alerts/nvidias-off-balance-sheet-backstops-hit-530b-in-latest-10-q) ⚠️ SemiAnalysis's piece was not read; a separate search result says another critique counts only about 164.5B of customer-support items because the 279B is chip-supply commitments, not backstops. The 530B headline is contested.
- Prepayment and term are now visible in SemiAnalysis's market read: AI labs sign 4-5 year offtakes of 50-100 MW (about 24,000-48,000 GB300 NVL72 GPUs); smaller labs sign 1-3 year deals with prepayments "above 20%"; neoclouds now negotiate higher prepayments, longer terms and flexible start dates. — [SemiAnalysis, 2 April 2026](https://newsletter.semianalysis.com/p/the-great-gpu-shortage-rental-capacity) (appears complete; monthly index values and the term structure are paywalled). This is the first non-aggregator support for the "about 20% prepay" figure that the earlier report flagged as aggregator-only; the 10-15% MYPA figure remains unconfirmed.
- Rubin timing. TrendForce (8 April 2026): Rubin 22% of NVIDIA's 2026 high-end GPU shipments (was 29%), Hopper 7% (was 10%), Blackwell GB300/B300 71%; causes are HBM4 validation, the move to ConnectX-9 networking, higher system power and more advanced liquid cooling. NVIDIA had not commented. — [The Register, 8 April 2026](https://www.theregister.com/2026/04/08/nvidia_supply_chain/) (read whole page).
- NVIDIA's stated position, per search snippets only: Vera Rubin is in full production, with production shipments in the second half of 2026 (one source says "this fall"). ⚠️ Search synthesis only; no August 2026 earnings material or October delivery counts were found. — [search results](https://www.eenewseurope.com/en/nvidia-rubin-gpu-samples-vera-rubin-ramp/)
- A reseller (not neutral) argues most non-hyperscale buyers face practical Rubin rack delivery in 2027 and that deployed Blackwell Ultra beats awaited Rubin if the workload earns money now. ⚠️ Search synthesis of vendor pages; treat as sales framing. — [rdp.in](https://rdp.in/gpu-mart/knowledge-base/buy-blackwell-ultra-or-wait-for-rubin-flagship-timing/)
- Custom silicon as an allocation escape: Meta signed to rent Google TPUs (reported 26-27 Feb 2026) and is reportedly negotiating to buy them for its own data centers; deal value undisclosed. — [Dataconomy, 27 Feb 2026](https://dataconomy.com/2026/02/27/meta-signs-multibillion-dollar-deal-to-rent-google-tpus-for-ai-training/) (read; relayed from Reuters, which was not opened). Background: Trainium (AWS-Anthropic) and Broadcom custom parts, covered in the earlier notes. In section 1C, Anthropic's AWS block is 5 GW of Trainium3 and its Google block 5 GW, which is the same escape taken at scale.
- "Use it or lose it" remains aggregator-only (the earlier note's 8-12% demand inflation claim); no primary source was found in this pass.

### Decision tensions
- Buy Blackwell now, or hold cash and capacity slots for Rubin? Waiting means no revenue-earning capacity in the interim; buying now locks you into last generation as rivals get the new one.
- Take a financed, floor-priced deal with the chip maker (cheaper, entangled) or pay market and stay independent?
- Spend on a custom-chip or TPU path (escapes the NVIDIA queue, takes years and engineering) versus the standard GPU queue (fast, scarce, expensive).

### Inferences
- "First come, first served" plus a 20%-plus prepayment norm plus NVIDIA credit support means the queue is effectively ordered by balance sheet and by NVIDIA's willingness to guarantee you. The game can show one public rule and one real rule.

### Gaps
- No primary document describing NVIDIA's allocation algorithm or MYPA terms exists in what was found.
- No post-August data on actual Rubin delivery volumes.

---

## 3. Letters of intent and headline-versus-signed gaps

### Takeaway
New cases keep the pattern: announced gigawatts and dollars shrink, slow or move. The best-documented examples now cover both directions of the "chipmaker pays equity" trade (NVIDIA to OpenAI shrinks; AMD to Meta is a warrant to the buyer) and a hard physical limit (grid timing at Loughton).

### Cited Findings
- Reminder from earlier notes (not redone): NVIDIA-OpenAI "up to 100B" LOI became about 30B in the funding round; Abilene expansion dropped; Microsoft about 2 GW of leases dropped.
- NVIDIA's own 10-Q shows another form of headline-versus-signed: equity commitments to "AI model makers, infrastructure financiers, and other private companies" of 25B in total (18B due in the rest of FY2027, then 3B, 2B, 2B), contingent; the extracted text does not name investees. This sits beside the March 2026 report that Huang said NVIDIA was pulling back from large OpenAI and Anthropic equity checks, so the two should not be read as contradictory without naming recipients. — [NVIDIA 10-Q](https://www.sec.gov/Archives/edgar/data/0001045810/000104581026000075/nvda-20260726.htm) ⚠️ partial extraction.
- NVIDIA's credit support for OpenAI: it guaranteed leases at SB Energy's PORTS campus in Pike County, Ohio (about 4.25 GW IT load across nine construction phases, first expected FY2029; guarantees capped at 105B; triggered by certain tenant defaults and covering limited portions of lease and power payments; terminate on events "including OpenAI achieving a satisfactory credit rating"; NVIDIA holds an option for about 3.8 additional GW). The customer is "affiliated with OpenAI Group PBC." — same 10-Q, same caveat. The 20-year term is from the SemiAnalysis summary only.
- Meta-AMD (24 Feb 2026): a performance warrant for 160 million AMD shares at 0.01 dollars issued with an amendment to a purchase agreement, Meta committed to buy the first 1 GW of AMD Instinct GPUs, further tranches to 6 GW with AMD share-price thresholds, expiry February 2031, up to about 10% of AMD. Reported value is disputed: "more than 100B" (AP) versus "up to 60B over five years" (ROIC.AI citing sources, calling it a correction). — [Search results quoting AMD's 8-K and Latham & Watkins](https://www.lw.com/en/news/latham-advises-amd-in-partnership-with-meta-to-deploy-6-gigawatts-of-gpus) ⚠️ snippets only; the 8-K was not opened. Same direction as the OpenAI-AMD warrant in the earlier notes: the buyer receives the warrant from the chip maker, so AMD has now used the structure twice.
- OpenAI's capacity announcements versus site reality: OpenAI said in April it had secured 10 GW of capacity ahead of its 2029 target while simultaneously pausing UK/Norway/Texas expansions. ⚠️ Search synthesis only. See section 1A for sources.
- A skeptic's data point: Bernstein reportedly sees only 35% of announced North American capacity getting built. ⚠️ Search snippet from an aggregator; no Bernstein document opened. — [AI News Weekly](https://aiweekly.co/alerts/information-industry-execs-see-only-7-10-of-hundreds-of-neoclouds-surviving-as)

### Decision tensions
- Announce the big headline (rivals and investors react, the supplier may then shrink it) or sign only what is binding (quieter, but you lose the narrative and the supplier's attention).
- Treat a rival's headline as real and match it, or discount it (as history shows you should).
- Accept a "satisfactory credit rating" style trigger that unlocks your support only when you least need it.

### Gaps
- No fully itemized table of announced versus delivered capacity exists. Epoch's Stargate tracker (cited in the earlier notes) is the closest and was not re-opened.

---

## 4. Neoclouds: counterparty risk, concentration, covenants, failures and near-failures

### Takeaway
No named neocloud has defaulted, but October 2026 is the first month the market priced it: CoreWeave bonds near 15% yield, credit insurance of about 1,000 basis points, and a Gartner call that over 80% of independent neoclouds will stop operating independently by 2030. NVIDIA is the backstop, which turns the system into one balance sheet.

### Cited Findings
- CoreWeave Q2 2026 (11 Aug 2026, primary): revenue 2,575M (up from 1,212M); net loss 626M; interest expense, net, 640M (267M a year earlier); operating loss 49M; adjusted EBITDA 1,510M; Q2 capex 6,422M (H1 14,117M); cash 5,524M; property and equipment 46,736M; total liabilities 72,046M vs equity 5,024M; derived debt about 35.1B (about 31.4B recourse, about 3.7B non-recourse); new 3.1B delayed-draw term loan; 1B strategic investment from Jane Street; more than 10B of unsecured and convertible debt including a first Eurobond; active power 1.5 GW (up about 500 MW in the quarter), contracted power about 3.7 GW; customer concentration not disclosed in the release; new customers include Bentley, Caterpillar, Grammarly, Isomorphic Labs. — [CoreWeave IR](https://investors.coreweave.com/news/news-details/2026/CoreWeave-Reports-Strong-Second-Quarter-2026-Results/) (read whole page via tool; the debt split is the tool's derivation from the balance sheet).
- 14-15 October 2026 market move: CoreWeave 9.625% notes due 2032 yielding about 14.8% (briefly 15%), 9.75% notes due 2031 about 14.9%, Oracle 2032 notes about 7.24%; CoreWeave shares down about 16%, Oracle nearly 9%, Nebius about 10%, Dell about 11%; S&P rates CoreWeave B+; traders pricing a possible December Fed hike; Alphabet, Amazon, Meta and Oracle issued more than 228B of bonds in 2026 to 13 October (LSEG); CEO Intrator called the reaction irrational in an internal memo and said backlog more than covers all debt. — [investingLive, 15 Oct 2026](https://investinglive.com/stocks/coreweave-bonds-trade-like-distressed-debt-as-ai-spending-outpaces-balance-sheets/) (read whole page via tool).
- Five-year CoreWeave credit default swaps above 1,000 basis points (a market-implied 63% five-year default probability, with a stated recovery-rate caveat) and Oracle CDS at a record 288 basis points; Morgan Stanley counts at least 20 project-financed data center high-yield bonds totaling 45.6B with CoreWeave the largest tenant. ⚠️ Search-result synthesis only; the roic.ai pages returned HTTP 403 and the Reuters/Morgan Stanley originals were not opened. — [roic.ai via search](https://www.roic.ai/news/ai-debt-fears-surge-as-tech-default-insurance-hits-record-highs-10-15-2026)
- Gartner's John Lovelock (reported 20 Oct 2026): over 80% of independent neoclouds will stop operating independently by 2030, by absorption rather than necessarily closure (Microsoft and Amazon likely buyers, as in 2008-09); the server buildout needs about an 18% return on capital that simple business models will not reach until 2032; capacity already exceeds demand. CoreWeave fell 23.85% in the week to 19 October to 61.12 dollars and Nebius 18.96%; Nebius spent 8.13B of capex in H1 2026 and has about 10.0B of convertibles; counterpoint: CoreWeave backlog about 104B and Nebius 37.5B of remaining performance obligations, and both recently raised prices. — [247WallSt, 20 Oct 2026](https://247wallst.com/investing/2026/10/20/gartner-80-of-neocloud-firms-face-extinction-by-2030-as-ai-capex-outpaces-returns/) (read whole page via tool). Note the tension in the source itself: rising rental prices (section 6) sit beside a forecast of oversupply.
- The Information (18 Oct 2026), via summary: industry executives expect only 7-10 of hundreds of neoclouds to survive; NVIDIA offers easier credit terms and site help; a 6.3B capacity agreement already supports CoreWeave; land, power and shell guarantees for AI cloud partners total up to 3.5B gross. — [AI News Weekly](https://aiweekly.co/alerts/information-industry-execs-see-only-7-10-of-hundreds-of-neoclouds-surviving-as) ⚠️ summary page; original not read. The 3.5B matches the NVIDIA 10-Q line, which also records 712M of partner escrow not netted against it.
- FT (29 Sept 2026), via secondary coverage: NVIDIA is in early talks with insurers (Howden Re named) to cover lenders if a neocloud defaults and the pledged GPUs cannot be resold for enough to repay; no deal exists. — [Search results quoting the FT](https://www.bisnow.com/news/national/data-center-capital-markets/nvidia-asks-insurers-to-shoulder-financing-risk-for-some-of-its-largest-customers) ⚠️ FT not read; secondary summary only.
- Microsoft and Oracle financing details showing who bears risk: Oracle's Michigan (Saline Township) campus financing of about 16.3B closed late April 2026: about 14B bonds at 7.5%, 19.5-year maturity, six years interest-only, PIMCO about 10B, about 2B equity from Related Digital and Blackstone, secured against the campus not Oracle's balance sheet; US banks reportedly retreated over demand doubts; S&P and Moody's put negative outlooks on Oracle's BBB/Baa2. A search summary also said lenders demanded Oracle guarantee lease payments regardless of use; the full-page read did not confirm that, so it is dropped. — [The Next Web, 25 Apr 2026](https://thenextweb.com/news/oracle-data-centre-16-billion-financing-stargate) (read whole page).
- Background: CoreWeave DDTL terms and covenants (SOFR+4.5-5.5%, 1.35x coverage) are in the earlier notes and were not re-verified against filings here.

### Decision tensions
- Use the cheap, fast neocloud (cost 1x, risk visible in its bond yield) or the expensive hyperscaler (safer, slower, exclusivity strings)?
- A neocloud's credit rating is a bet on its customers. If you are that customer, your own stumble makes your supplier (and your delivery) worse.
- Pay for a supplier's survival (prepay, equity, guarantee) or let it fail and be absorbed by a hyperscaler (as Gartner expects), losing your negotiated terms.

### Inferences
- The legible trigger for supplier failure is financial conditions (interest rates, bond yields, a big customer's forecast cut), not a random roll. That agrees with the earlier report's recommendation to make failure event-driven.

### Gaps
- No actual neocloud default, covenant breach or distressed capacity auction was found in 2025-October 2026. The "failure" evidence is market pricing and forecasts.
- Customer concentration at CoreWeave in 2026 was not found in a primary source (Q2 release omits it).

---

## 5. Financing strings: equity-for-compute, circularity, warrants, SPVs, GPU-backed debt, rev share, exclusivity, control rights

### Takeaway
Strings now run in several directions, and the new ones are: chipmaker pays you in warrants if you buy (AMD to OpenAI, AMD to Meta), chipmaker pays your landlord's lease guarantees (NVIDIA at the Ohio campus), and chipmaker revenue-shares with the clouds it floors. The old "Microsoft right of first refusal" exclusivity is gone, replaced by volume commitments.

### Cited Findings
- Reverse circularity: Microsoft and NVIDIA invest up to 5B and 10B in Anthropic while Anthropic commits 30B to Azure (Nov 2025). ⚠️ Snippets only (see 1C).
- NVIDIA's AI-cloud structure (section 2): floor payments plus revenue share above the floor, resale rights for the cloud, capacity commitment shrinking as third parties use it. This is the clearest real "revenue share" string on compute. — NVIDIA 10-Q, partial extraction.
- NVIDIA also records 3.3B of equity-method investments in "infrastructure financiers" and 47.9B of non-marketable equity securities, and said it expects to reassign about 20B of third-party data center leases (about 15-year terms, commencing FY2028-FY2029) to third parties. — same filing, same caveat. Gross maximum guarantee exposure in the filing: 108.5B.
- Jane Street took a 1B strategic investment in CoreWeave after an expanded commercial relationship (Q1 2026); CoreWeave also spent 492M on capped calls (a hedge against convertible dilution). — [CoreWeave Q2 release](https://investors.coreweave.com/news/news-details/2026/CoreWeave-Reports-Strong-Second-Quarter-2026-Results/)
- Control rights actually given up (from earlier notes, still the best examples): Microsoft's API exclusivity and 27% stake (Oct 2025), Blue Owl's 80% of Meta's Hyperion JV, NVIDIA warrant-like claims. New in this pass: no case of a board seat traded for compute was found. Musk said SpaceX can reclaim Colossus capacity for its own use, which is a control string on the supplier side. — [The Next Web](https://thenextweb.com/news/musk-spacex-colossus-anthropic-180-day-lease)
- OpenAI as seller: Guaranteed Capacity (May 2026) makes a lab itself an offtaker's supplier, with the lab reserving enough capacity for its own products. — [Pulse 2.0](https://pulse2.com/openai-new-guaranteed-capacity-offering-lets-customers-secure-long-term-ai-compute/)
- Rate sensitivity: the debt stack depends on rates; traders pricing a possible December hike hit highly leveraged builders hardest. — [investingLive](https://investinglive.com/stocks/coreweave-bonds-trade-like-distressed-debt-as-ai-spending-outpaces-balance-sheets/)

### Decision tensions
- Accept the chipmaker's equity or guarantee (cheap money, but it comes back as chip purchases and ties you to one vendor).
- Take SPV or lease financing (off your books, but the financier sets conditions such as a credit-rating trigger).
- Give exclusivity to a hyperscaler for a lower price, or keep options open at a premium.

### Gaps
- The extracted 10-Q text did not name the investees of NVIDIA's 25B equity commitments.
- Revenue-share percentages (Microsoft-OpenAI, NVIDIA-AI cloud) are not disclosed in anything found.

---

## 6. Secondary markets: resale, rental price swings, compute futures

### Takeaway
Rental prices rose through 2026 (the opposite of the earlier report's trend) and a regulated futures market for GPU rental indices was announced but has slipped from 5 October to a pending 9 November start. Resale of reserved capacity exists mostly as subletting and NVIDIA-contract resale rights, not as an open exchange.

### Cited Findings
- SemiAnalysis H100 one-year contract index: about 1.70 dollars per GPU-hour in October 2025, above 2 by late January 2026, up 15-20% more by mid-to-late February, about 2.35 in March 2026; the authors forecast a further 15-20% rise by end of March (a forecast). On-demand sold out across GPU types; half of providers asked were sold out of 8-node H100/H200 requests; some renters subletting cluster capacity; customers competing at about 14 dollars per GPU-hour for AWS p6-b200 spot; drivers include agentic coding and open-weight model demand, DRAM/DDR5 contract prices up roughly 4-5x year on year in Q1 2026, server repricing and tight TSMC N3. — [SemiAnalysis, 2 Apr 2026](https://newsletter.semianalysis.com/p/the-great-gpu-shortage-rental-capacity)
- Vendor price page (Spheron, an interested seller): H100 listed rates 2.20-12.29 dollars per GPU-hour across providers on dated checks in October 2026; Nebius raised its H100 rate from 3.85 to 4.50 on 1 October 2026; CoreWeave about 6.16 but only in 8-GPU bundles; AWS p5 about 6.88; Hyperbolic's rate more than doubled in ten weeks; buyers pay for seven idle GPUs if they need one on an 8-GPU-only provider. — [Spheron](https://www.spheron.network/blog/gpu-price-increase-2026-hyperbolic-h100/) ⚠️ vendor page; the 1 October Nebius figure and all prices are the vendor's own listing.
- NVIDIA-supported clouds floor at about 2.35 dollars per GPU-hour versus a 4.50-4.60 market rate (SemiAnalysis via summary), and the AI clouds can resell NVIDIA-committed capacity to third parties. — [AI News Weekly](https://aiweekly.co/alerts/nvidias-off-balance-sheet-backstops-hit-530b-in-latest-10-q) ⚠️ summary; the 10-Q confirms the resale right but not the dollar floor.
- Compute futures:
  - CME Group and Silicon Data announced (11 Aug 2026) H100 and B200 Rental Index Futures for NYMEX with an announced launch of 5 October 2026 pending regulatory review; each contract covers 730 GPU-hours (about one month of one GPU), cash-settled against Silicon Data's daily rental benchmarks, with listings reported out to 36 months. ⚠️ From search synthesis; the CME press release fetch timed out. — [CME press release](https://www.cmegroup.com/content/cmegroup/en/media-room/press-releases/2026/8/11/cme_group_and_silicondatatolaunchcomputefuturesonoctober5tounloc.html)
  - As of 21 October 2026 the exchange calendar shows a start of 9 November 2026, still "pending review," with regulators not having cleared the market; the page cites a CFTC filing on a review extension and a CFTC request for comment on listing compute derivatives; Silicon Data's benchmarks began in 2024. — [Runtime Wire](https://runtimewire.com/article/silicon-data-cme-compute-futures-november-2026) ⚠️ page was truncated; why the date slipped is not stated.
  - CME announced (15 October) non-tradable forward-curve data for the two indices. ⚠️ Search synthesis only.
  - Other efforts: Nodal Exchange with Compute Desk (BusinessWire, 3 Sept 2026) and ICE Futures US with Ornn's Compute Price Index (H100 symbol HPR, B200 symbol BKL; no listing date set). ⚠️ Search snippets only; the ICE PDF text could not be extracted and the BusinessWire page was not opened. — [ICE notice](https://www.ice.com/publicdocs/futures_us/exchange_notices/ICE_Futures_US_Exchange_Notice_ORNN_Compute_4Q2026_20260929.pdf)
- Retail GPU purchase price: 25,000-35,000 dollars for one H100 (channel listings, 20 July 2026). — Spheron page above, vendor-sourced.

### Decision tensions
- Lock in capacity at today's price when everything says prices are rising, or stay flexible on spot and risk a spike?
- Hold unused reserved capacity as an option, or sublet it at a loss to cut the bill.
- Hedge with an index future (if it ever lists) or accept the swing.

### Inferences
- Rising 2026 rental prices and a 2026 narrative of oversupply (Gartner) coexist. A game can do both by having a bidding squeeze early in a cycle and a collapse later, with the player's forecast deciding which side they are on.

### Gaps
- No evidence any compute futures contract had traded by 26 October 2026; no volume or open-interest data. No secondary market for resale of reserved capacity at a quoted price was found beyond subletting mentions.
- The earlier report's "H100 rental falling to 1.80-3.50" source (ValueAddVC) was not re-opened; the correction rests on SemiAnalysis and one vendor page.

---

## 7. Ranking for a 20-minute game: legible and dramatic versus too fiddly

### Takeaway
Keep tensions that fit one sentence and one visible meter. The strongest are: obligations outrunning revenue, headline-versus-signed shrink, the short leash behind a long headline, and a supplier whose health you can see move. Drop covenants, residual-value maths and index futures.

### Most legible and dramatic (use these)
1. Take-or-pay versus your own forecast (OpenAI 1.4T to 600B, Friar's worry, Abilene, Stargate UK). Tension: sign big while growth is hot, or stay small and risk missing the squeeze. Evidence: sections 1A and 5.
2. Headline versus signed (NVIDIA 100B to 30B; AMD-Meta 100B versus 60B; Bernstein's 35% built). Tension: announce and let rivals react, or stay quiet. Evidence: section 3.
3. Long headline, short leash (SpaceX-Anthropic: 3 years on paper, 90-day exit, 180-day base per Musk). Tension: fast capacity from a rival who can take it back versus slower capacity nobody can reclaim. Evidence: section 1B.
4. A supplier health meter (CoreWeave bond yield 14.8%, CDS above 1,000 bp, S&P B+). Tension: cheap fragile neocloud versus costly hyperscaler. Evidence: section 4.
5. Who backstops whom (NVIDIA floor of about 2.35 dollars vs market 4.50, 36B take-or-pay, 108.5B guarantees, insurer talks). Tension: take the vendor's credit support and its strings. Evidence: sections 2 and 5.
6. Buy now or wait for the next chip (Rubin 29% to 22%). Tension: revenue now versus a better chip later. Evidence: section 2.
7. Rates and refinancing as an era event (a hotter inflation print hit leveraged builders). Tension: pay up to lock financing now or refinance later. Evidence: section 4.
8. Price direction: locking in is cheap when prices are rising (H100 one-year +40%); spot punishes you. Evidence: section 6.

### Too fiddly for this game (skip or compress)
- MYPA percentages, "use it or lose it" demand inflation (unconfirmed).
- DDTL pricing and 1.35x coverage ratio covenants, residual-value guarantee schedules, credit-default-swap maths.
- Tranche-by-tranche liquidated damages (collapse to "late delivery gives you a credit or an exit").
- Compute futures (not trading yet as of this note); at most one flavour card.
- Insurance-wrapped GPU loans (early talks only).

### Inferences
- Of the eight, items 1, 3 and 4 are one-card concepts that also tie to the game's risk story (race pressure from fixed obligations; dependence on a rival; a supplier you can watch).

### Gaps
- Nothing here tests playability; ranking is judgment from how clean each tension is in the evidence.

---

## Coverage statement

Opened through the fetch tool (model-written extraction of the page, not raw text), flagged inline when partial:
- Read whole page: Nebius 6-K (SEC), CoreWeave Q2 2026 release, The Register (8 Apr 2026), Pulse 2.0 (21 May 2026), SemiAnalysis H100 index (2 Apr 2026; the term structure and charts are paywalled), 247WallSt (20 Oct 2026), investingLive (15 Oct 2026), The Next Web x2 (Musk 180-day; Oracle Michigan), GuruFocus/Yahoo (Stargate UK), Kapitalmarktexperten (19 Oct 2026), Dataconomy (Meta-Google), SD Times (OpenAI-AWS 38B, 3 Nov 2025), Spheron price page (vendor).
- Read partially or only as a summary: NVIDIA 10-Q for 26 July 2026 (targeted extraction of commitments, guarantees and concentration; whole filing not read); AI News Weekly pages summarizing The Information (two) and SemiAnalysis; Let's Data Science summary of the WSJ report (short); Runtime Wire (truncated).
- Could not reach: DCD OpenAI-targets article (HTTP 403), DCD UAE export-control article (HTTP 403), DCD CoreWeave Q3 2025 article (HTTP 403), roic.ai CDS page (HTTP 403), Fintool OpenAI-600B (redirected to an unrelated page), CME press release (timeout), ICE/Ornn exchange notice (PDF text not extractable), HotHardware (only headline returned), and every original Reuters, FT, WSJ, Bloomberg and The Information article.
- Used only as search-result snippets (marked ⚠️ in text): SpaceX S-1 terms (via several outlets), Meta-AMD 8-K, IREN-Microsoft, Anthropic-Azure announcement, Stargate UAE licensing (including a reported 10 July 2026 move of the UAE into Country Group A:5, which is not in the body above because it rests on one unread DCD item), Rubin timing statements, NVIDIA-insurer talks, Nodal and ICE futures, Bernstein 35%, CoreWeave Q3 2025 delay, CDS levels.
- Not searched: Microsoft FY2026 lease commitments, Google or Amazon 10-Q cloud backlog, AMD-OpenAI first-tranche status, xAI/SpaceX Colossus 2 financing close, Core Scientific, Lambda/Crusoe filings, Cerebras. No email address was put into any request.
