# How real frontier AI labs plan compute against cost (research as of 2026-09-25)

> Provenance: written by an Opus research subagent on 2026-09-25 for the finance planner mockups. The
> orchestrator read the report end to end but did not trace its figures back to the original sources.
> Its three Epoch AI chart captures are in `shots/` as `50-epoch-*.jpg` (the paths below point at the
> session scratchpad where they were first saved).

Purpose: ground a management-game screen where the player sets compute goals for future years and
sees monthly cost and cash consequences.

**Labels used throughout**
- **Reported**: a number stated by the company, a filing, or a named news outlet.
- **Estimate**: a number produced by an analyst group (Epoch AI, for example) with its own model.
- **Derived**: my own arithmetic on reported numbers. The formula is shown every time. These are not sourced facts.
- ⚠️ marks any claim whose source I could not read in full (paywall, fetch failure, truncation, a snippet, or a deliberately partial read of a very long filing). Each ⚠️ says what was missing.

**Headline findings**
1. Labs state goals in **gigawatts (GW) of power**, then in **dollars of multi-year commitments**, and only occasionally in chip counts. OpenAI's Stargate goal was "10 GW, $500B, 4 years"; Anthropic's deals are "up to 5 GW", "2 GW", "460 MW for $45B over 6 years".
2. The going rate for all-in build cost is **about $40-60B per GW**. OpenAI said more than $40B (October 2025). Nvidia said about $60B (August 2026). Epoch AI's model gives $38B per GW of IT power, or roughly $30B per GW of total facility power.
3. **Owning** 1 GW costs about **$0.7B per month** in total cost of ownership, with the build cost spread over the life of the equipment (Epoch estimate). **Renting** 1 GW costs **about $1.35B to $4.2B per month** (derived from the Nscale and SpaceX contracts). Electricity alone is only about **$50-70M per month per GW**.
4. The usual lag from announcing a goal to having power switched on is **1 to 3 years**, and the largest campuses take up to **6 years**. xAI is the outlier: it brought 130-220 MW clusters online in 64-122 days.
5. Compute spending runs **at or above revenue** for several years. OpenAI's July 2026 plan (per the FT) is **$856B of compute and infrastructure for 2026-2030 against about $840B of cumulative revenue**. Its annual cash burn peaks in year 3 (2028), and it expects to turn cash-positive only in 2030. Anthropic has signed deals worth up to **$517B**, against the **$180B** it had told investors it would spend through 2029.
6. Plans get revised constantly, and those revisions are themselves game-relevant. Examples: OpenAI's stated spend went from $1.4T down to "about $600B by 2030" and then up to $856B in a private deck; Nvidia's $100B letter of intent became a $30B equity stake; the Abilene expansion was cancelled, the UK site paused and the Norway site dropped; Oracle sent a force-majeure notice on the New Mexico site.

---

## 1. OpenAI

| Date | Claim | Number | Source |
|---|---|---|---|
| 2025-01-21 | Stargate launched: "invest $500 billion over the next four years", with $100B deployed "immediately" (reported) | $500B / 4 yrs | https://openai.com/index/announcing-the-stargate-project/ |
| 2025-07-22 | Oracle deal for 4.5 GW of additional Stargate capacity. With Abilene, "over 5 gigawatts … will run over 2 million chips". This is the first time the goal is described as "$500 billion into 10 gigawatts" (reported) | 4.5 GW; >5 GW ≈ 2M chips | https://openai.com/index/stargate-advances-with-partnership-with-oracle/ |
| 2025-09-22 | Nvidia letter of intent: "at least 10 gigawatts" of Nvidia systems. Nvidia "intends to invest up to $100 billion … progressively as each gigawatt is deployed". First GW on Vera Rubin in the second half of 2026 (reported) | 10 GW; up to $100B | https://openai.com/index/openai-nvidia-systems-partnership/ |
| 2025-09-23 | Five new sites bring Stargate to "nearly 7 gigawatts of planned capacity and over $400 billion in investment over the next three years". The Oracle partnership "exceeds $300 billion … over the next five years". The Lordstown and Milam sites "can scale to 1.5 gigawatts over the next 18 months" (reported) | ~7 GW, >$400B / 3 yrs; Oracle >$300B / 5 yrs | https://openai.com/index/five-new-stargate-sites/ |
| 2025-09 (post undated on page) | Altman, "Abundant Intelligence": "we want to create a factory that can produce a gigawatt of new AI infrastructure every week … it will take us years to get to this milestone" (reported) | 1 GW/week (goal) | https://blog.samaltman.com/abundant-intelligence |
| 2025-10-06 | AMD: 6 GW over multiple chip generations. The first 1 GW of MI450 starts in the second half of 2026. AMD issued a warrant for up to 160M shares that vests as deployments scale (reported) | 6 GW | https://openai.com/index/openai-amd-strategic-partnership/ |
| 2025-10-13 | Broadcom: 10 GW of custom accelerators, deployment "targeted to start in the second half of 2026, to complete by end of 2029" (reported) | 10 GW, 2026-2029 | https://openai.com/index/openai-and-broadcom-announce-strategic-collaboration/ |
| 2025-10-28 | Microsoft restructuring: OpenAI "contracted to purchase an incremental $250B of Azure services" (reported) | $250B | https://openai.com/index/next-chapter-of-microsoft-openai-partnership/ |
| 2025-10-28 | Livestream (Reuters, via syndication): "committed to developing 30 gigawatts … for $1.4 trillion". Each GW "currently comes with a capital cost of more than $40 billion", and Altman said "capital costs could halve" (reported) | 30 GW; $1.4T; >$40B/GW | https://stratnewsglobal.com/team-sng/openais-altman-eyes-ipo-trillions-in-funding-for-growth/ |
| 2025-11-03 | AWS: "$38 billion agreement … over the next seven years", "hundreds of thousands" of GB200/GB300 GPUs, all capacity "targeted to be deployed before the end of 2026" (reported) | $38B / 7 yrs | https://openai.com/index/aws-and-openai-partnership/ |
| 2025-11-06 | Altman on X (quoted by TechCrunch/Yahoo): "above $20 billion in annualized revenue run rate … commitments of about $1.4 trillion over the next 8 years" (reported) | $20B ARR; $1.4T / 8 yrs | https://finance.yahoo.com/news/sam-altman-says-openai-20b-211806316.html |
| 2026-02-20 | CNBC: OpenAI told investors it now targets "roughly $600 billion in total compute spend by 2030" and ">$280 billion" of 2030 revenue. 2025 revenue was $13.1B and 2025 cash burn was $8B (reported, anonymous sources) | $600B by 2030; $280B rev 2030 | https://www.cnbc.com/2026/02/20/openai-resets-spend-expectations-targets-around-600-billion-by-2030.html |
| 2026-02-21 | The Decoder, citing The Information: projected burn of $25B (2026), $57B (2027), $85B (2028), $51B (2029), then +$39B in 2030. Revenue of $30B (2026) and about $62B (2027). Training spend of $32B (2026), about $65B (2027), and nearly $440B through 2030. Adjusted gross margin was 33% in 2025 (reported second-hand) ⚠️ *The Decoder page ends in a subscriber teaser, and The Information original is paywalled and was not read.* | see table in source | https://the-decoder.com/openai-adds-111-billion-to-its-cash-burn-forecast-as-ai-costs-spiral-beyond-projections/ |
| 2026-03-31 | Round closed: "$122 billion in committed capital at a post money valuation of $852 billion". "We are now generating $2B in revenue per month" (reported) | $122B raised; ~$24B ARR | https://openai.com/index/accelerating-the-next-phase-ai/ |
| 2026-04-29 | "We committed to securing 10GW … by 2029. Just over a year later, we have already surpassed that milestone, with more than 3GW added in the last 90 days alone" (reported). The Decoder adds: the Texas expansion was rejected, the UK site paused and the Norway site dropped ⚠️ *The Decoder item is a teaser; the full article is paywalled.* | 10 GW secured, ~3 years early | https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/ ; https://the-decoder.com/openai-says-it-hit-its-10-gigawatt-compute-goal-years-ahead-of-schedule/ |
| 2026-04-17 (updated 04-23) | Epoch AI: 7 Stargate sites, >9 GW planned. Abilene is at about 0.3 GW now and 1.2 GW by Q4 2026; the other 5 large sites complete in Q4 2028 (estimate, satellite-based) | >9 GW by 2029 | https://epoch.ai/publications/openai-stargate-where-the-us-sites-stand |
| 2026-07 deck, reported 2026-09-17/20 | FT, via TNW and TechTimes: negative free cash flow of $278B over 2026-2030 (down from $305B in May). Compute and infrastructure of about $856B. Revenue of about $36B (2026) rising to $350B (2030), about $840B cumulative. The $122B raise runs out around 2028 ⚠️ *The FT and Bloomberg originals are paywalled and not read; these figures are second-hand.* | $856B compute vs ~$840B revenue | https://thenextweb.com/news/openai-856bn-compute-vs-600bn-reset-burn-improved ; https://www.techtimes.com/articles/327752/20260920/openai-projects-278b-cash-burn-record-round-runs-dry-before-revenue-catches.htm |
| 2026-08-17 | PORTS-Pike, Ohio: about 8 GW of IT capacity under a 20-year SB Energy lease. "The first 800 megawatts are expected to become available in 2028". Buildout runs six years, through 2032. "OpenAI will begin paying only as completed capacity becomes available for lease". Nvidia provides credit support for the first 4.25 GW of IT capacity. SB Energy is building "at least 10 gigawatts of new energy generation, which results in 8 IT-GW" (reported) | 8 GW IT; first 0.8 GW in 2028; done 2032 | https://openai.com/index/openai-joins-ports-pike-project/ ; https://nvidianews.nvidia.com/news/nvidia-guarantees-sb-energy-s-ports-pike-technology-campus-in-ohio-to-exclusively-host-nvidia-ai-compute |
| 2026-08-17 | TechCrunch, citing Bloomberg: OpenAI revenue doubled to $40B (run rate), from $20B at the end of 2025 (reported) | $40B ARR | https://techcrunch.com/2026/08/17/anthropics-annualized-revenue-surges-to-65b/ |
| 2026-08-26 | Nvidia earnings call: "OpenAI's existing and planned commitments represent approximately 12 gigawatts of NVIDIA compute" (reported) | ~12 GW Nvidia | https://www.fool.com/earnings/call-transcripts/2026/08/31/nvidia-nvda-q2-2027-earnings-call-transcript/ |
| 2026-09-24 | Oracle sent a force-majeure notice on Project Jupiter, New Mexico (2.45 GW, due 2028), so that it can delay payments if the site slips. The gas pipeline has slipped to 2027-02-01. Oracle says the project is on schedule (reported) | 2.45 GW at risk | https://techcrunch.com/2026/09/24/oracle-sends-force-majeure-notice-on-its-new-mexico-stargate-data-center/ ; https://www.cnbc.com/2026/09/24/oracle-data-center-force-majeure.html |

Also reported, second-hand via TechTimes: Nvidia's $100B letter of intent "was later restructured to a $30 billion equity stake". CNBC (February 2026) confirmed Nvidia was discussing up to $30B in the round.

**Derived (my arithmetic)**
- Stargate: $500B ÷ 10 GW = **$50B per GW**.
- October 2025: $1.4T ÷ 30 GW = **$47B per GW**, spread over about 8 years.
- July 2026 deck: $856B over 5 years is about **$171B per year**, or **$14B per month** on average for compute and infrastructure. That compares with 2026 revenue of about $36B, or **$3B per month**.

## 2. Anthropic

| Date | Claim | Number | Source |
|---|---|---|---|
| 2025-10-23 | Google: "up to one million TPUs … worth tens of billions of dollars … well over a gigawatt of capacity online in 2026" (reported) | ≤1M TPUs, >1 GW in 2026 | https://www.anthropic.com/news/expanding-our-use-of-google-cloud-tpus-and-services |
| 2025-10-29 | AWS Project Rainier is live with "nearly half a million Trainium2 chips". Claude is expected on ">1 million Trainium2 chips" by year-end. It came online "less than one year after it was first announced" (reported) | ~500k Trn2 | https://www.aboutamazon.com/news/aws/aws-project-rainier-ai-trainium-chips-compute-cluster |
| 2025-11-04 | TechCrunch, citing The Information: up to $70B revenue and $17B cash flow in 2028. Gross margin of 50% in 2025, reaching 77% in 2028. Reuters: a 2026 ARR target of $20-26B (reported second-hand) | $70B rev 2028; cash-flow positive 2028 | https://techcrunch.com/2025/11/04/anthropic-expects-b2b-demand-to-boost-revenue-to-70b-in-2028-report/ |
| 2025-11-12 | "$50 billion investment in American computing infrastructure, building data centers with Fluidstack in Texas and New York … sites coming online throughout 2026" (reported) | $50B | https://www.anthropic.com/news/anthropic-invests-50-billion-in-american-ai-infrastructure |
| 2025-11-18 | Microsoft and Nvidia: "committed to purchase $30 billion of Azure compute capacity and to contract additional compute capacity up to one gigawatt" (reported) | $30B; ≤1 GW | https://www.anthropic.com/news/microsoft-nvidia-anthropic-announce-strategic-partnerships |
| 2026-04-06 | Google and Broadcom: "multiple gigawatts of next-generation TPU capacity … starting in 2027". Run rate ">$30 billion—up from approximately $9 billion at the end of 2025" (reported). Data Center Knowledge says a Broadcom filing puts it at about 3.5 GW (reported second-hand) | multi-GW, from 2027 | https://www.anthropic.com/news/google-broadcom-partnership-compute ; https://www.datacenterknowledge.com/data-center-chips/anthropic-secures-multi-gigawatt-tpu-deal-with-google-broadcom |
| 2026-04-20 | Amazon: "more than $100 billion over the next ten years", "up to 5GW", "nearly 1GW total of Trainium2 and Trainium3 capacity coming online by the end of 2026". Amazon invests $5B now, with up to $20B more (reported) | >$100B / 10 yrs; ≤5 GW | https://www.anthropic.com/news/anthropic-amazon-compute |
| 2026-05-05/06 | The Information, via US News: $200B committed to Google Cloud over five years ⚠️ *Snippet only; the US News page timed out and The Information is paywalled.* | $200B / 5 yrs | https://www.usnews.com/news/top-news/articles/2026-05-05/anthropic-commits-to-spending-200-billion-on-googles-cloud-and-chips-the-information-reports |
| 2026-05-06 | SpaceX Colossus 1: "more than 300 megawatts … (over 220,000 NVIDIA GPUs) within the month". The Anthropic post also restates the Google/Broadcom deal as "5 GW" (reported) | 300 MW, 220k GPUs | https://www.anthropic.com/news/higher-limits-spacex ; https://x.ai/news/anthropic-compute-partnership |
| 2026-05-20 | SpaceX S-1 (SEC): Anthropic "agreed to pay us $1.25 billion per month through May 2029", ramping at a reduced fee in May and June 2026, "terminated by either party upon 90 days' notice" (reported) ⚠️ *The S-1 is about 220,000 words; I read the compute and capex passages found by search, not the whole filing.* | $1.25B/month | https://www.sec.gov/Archives/edgar/data/1181412/000162828026036936/spaceexplorationtechnologi.htm |
| 2026-05 (Series H) | Run rate "crossed $47 billion" (Anthropic's Series H announcement, quoted by Simon Willison). The Series G on 2026-02-12 said $14B (reported) | $47B ARR | https://simonwillison.net/2026/May/29/anthropic/ |
| 2026-07-22 | AMD: 2 GW of MI450 in Helios racks, with the first GW in the first half of 2027. AMD invests up to $5B (reported) | 2 GW | https://www.cnbc.com/2026/07/22/amd-anthropic-ai-chip-investment.html |
| 2026-08-17 | Bloomberg, via TechCrunch: run rate >$65B at the end of July. The FT reports investors expect $100-120B by the end of 2026 (reported second-hand) | $65B ARR | https://techcrunch.com/2026/08/17/anthropics-annualized-revenue-surges-to-65b/ |
| 2026-08-25/26 | Nscale: about 460 MW of Vera Rubin capacity in West Virginia over six years, online in late 2027 (CNBC, DCD). The Nscale S-1 says "aggregate payments to us of up to approximately $44.6 billion", in four tranches, and that Nscale "ha[s] not obtained binding commitments for any of the financings" (reported) ⚠️ *The Nscale S-1 is about 196,000 words; I read the Anthropic, Microsoft and customer sections.* | 460 MW; $44.6B | https://www.cnbc.com/2026/08/26/anthropic-and-nscale-strike-45-billion-cloud-deal-sources-say.html ; https://www.sec.gov/Archives/edgar/data/0002110365/000119312526395475/ck0002110365-20260918.htm |
| 2026-09-06 (reported 09-13) | The Information, via 24/7 Wall St: compute deals "as much as $517 billion", mostly over the next decade, versus "$180 billion" of server leasing told to investors through 2029. About 14.8 GW secured since October 2025. Amazon plus Google account for about 11 GW and >$300B (reported second-hand) ⚠️ *The Information original is paywalled.* | $517B ≈ 14.8 GW | https://247wallst.com/investing/2026/09/13/anthropic-locks-down-517-billion-in-compute-ahead-of-ipo-and-its-still-not-enough/ |

Not verified: a January 2026 report that Anthropic forecast $55B of revenue in 2026 and about $148B in 2029, with more than $100B of training costs by 2029. ⚠️ *I saw this only as a search-result snippet of an X post by "Wall St Engine" relaying The Information. I did not open it, so do not rely on it.*

**Derived (my arithmetic)**
- SpaceX contract: $1.25B per month ÷ 0.30 GW ≈ **$4.2B per GW-month**, or about **$50B per GW-year**.
- The same contract per GPU-hour: $1.25B ÷ (220,000 GPUs × 730 hours) ≈ **$7.8 per GPU-hour**. This is a short, cancellable deal for capacity available immediately.
- Nscale contract: $44.6B ÷ 6 years ÷ 0.46 GW ≈ **$16B per GW-year**, or about **$1.35B per GW-month**. This is long-term Vera Rubin capacity starting late 2027.
- All deals: $517B ÷ 14.8 GW ≈ **$35B of commitment per GW**, spread over up to about 10 years.

## 3. xAI / SpaceXAI, Meta, hyperscalers, frontier cluster growth

### xAI / SpaceXAI (xAI was acquired by SpaceX in February 2026, per the S-1)

| Date | Claim | Number | Source |
|---|---|---|---|
| 2025-07-22/23 | Musk: "The xAI goal is 50 million in units of H100 equivalent-AI compute … online within 5 years" (reported, quoted by Tom's Hardware; the X post itself was not opened) | 50M H100e by ~2030 | https://www.tomshardware.com/tech-industry/artificial-intelligence/elon-musk-says-xai-is-targeting-50-million-h100-equivalent-ai-gpus-in-five-years-230k-gpus-including-30k-gb200s-already-reportedly-operational-for-training-grok |
| 2026-05-20 | S-1: Colossus and Colossus II give "approximately 1.0 gigawatt of compute power". Build times: 100k H100 (about 130 MW) in 122 days; 110k GB200 (about 210 MW) in 91 days; 110k GB300 (220 MW) in 64 days. "An industry benchmark to bring online a 100 megawatt greenfield data center is approximately two years". The next phase adds ≥220k GB300 and >400 MW. "Nameplate Compute Draw" is GPUs × power per GPU, excluding cooling and other overhead (reported) ⚠️ *partial read of S-1, see above* | 1.0 GW | SpaceX S-1 URL above |
| 2026-05-20 | S-1 AI-segment capex: $0.46B (2023), $5.63B (2024), $12.73B (2025), $7.72B (Q1 2026). AI revenue was $3.2B in 2025 with an operating loss of −$6.4B (reported) | see numbers | SpaceX S-1 |
| 2026-05-20 | S-1 market-sizing assumptions: GPU rental at "$3.33 per hour, according to Silicon Data … median of neocloud GPU rental rates in 2025", PUE 1.2, 1.3 kW per GPU (reported) | $3.33/GPU-hr | SpaceX S-1 |
| 2026-08-04 | Q2 capex was $18.4B, more than 80% of it AI. Other compute customers: Google up to $920M per month, Reflection up to $150M per month. The CFO claims "less than a one-year payback" on AI compute. Musk: projects totalling 20 GW by the end of 2027, "close to 15GW" likely (reported) | 15-20 GW by end-2027 | https://www.cnbc.com/2026/08/04/spacex-ai-spending-unnerves-wall-street-despite-promising-quick-payoff.html |

**Derived:** cumulative AI capex from 2023 through Q1 2026 is 0.46 + 5.63 + 12.73 + 7.72 = **$26.5B**, which built about 1.0 GW of nameplate GPU power. That is roughly **$26B per GW of IT power**. xAI claims it builds below industry cost, and this figure excludes anything leased.

### Meta

| Date | Claim | Number | Source |
|---|---|---|---|
| 2025-07-14 | Zuckerberg: "hundreds of billions of dollars into compute". Prometheus (Ohio) is "coming online in '26". Hyperion "will be able to scale up to 5GW over several years" (reported) | 1 GW+ 2026; 5 GW | https://www.datacenterdynamics.com/en/news/meta-to-invest-hundreds-of-billions-of-dollars-into-compute-to-build-superintelligence-with-several-multi-gw-data-center-clusters/ |
| 2026-01-12 | Meta Compute launched: "tens of gigawatts this decade, and hundreds of gigawatts or more over time". Hyperion (2 GW) is funded through a $27B joint venture in which Blue Owl covers 80% (reported) | tens of GW by 2030 | https://www.datacenterdynamics.com/en/news/meta-establishes-meta-compute-plans-multiple-gigawatt-plus-scale-ai-data-centers/ |
| 2026-07-09 | Reuters (internal memo): 7 GW in 2026 ("added 1 gigawatt in the first half … another 5.5 gigawatts by the end of the year"), then "a total of 14 gigawatts in 2027" (reported) | 7 GW → 14 GW | https://wtvbam.com/2026/07/09/exclusive-meta-to-put-ai-chip-into-production-in-september-as-it-looks-to-double-computing-capacity-memo-shows/ |
| 2026-07-29 | Q2 8-K: 2026 capex (including finance-lease principal) guided to "$130-145 billion". Q2 capex was $31.08B against $31.86B of operating cash flow, leaving free cash flow of $784M (reported) ⚠️ *I read the narrative and outlook; the financial tables were skimmed, not read line by line.* | $130-145B | https://www.sec.gov/Archives/edgar/data/0001326801/000162828026050596/meta-06302026xexhibit991.htm |

**Derived:** $145B of 2026 capex against about 6.5 GW added in 2026 is about **$22B per GW**. Treat this as a rough floor only: capex timing lags power-on, and leases and cloud deals sit outside capex.

### Alphabet, Microsoft, Amazon (calendar-2026 capex guidance)

| Date | Company | Number | Source |
|---|---|---|---|
| 2026-07-22 | Alphabet: raised to **$195-205B** (from $180-190B). Q2 capex was $44.9B and Q2 free cash flow was **−$5.9B** (8-K). The CFO earlier said 2027 will "significantly increase"; the FactSet consensus for 2027 is about $257B (reported) ⚠️ *I searched the CNBC live blog for relevant passages rather than reading it end to end; 8-K tables were read only for the free-cash-flow table.* | $195-205B | https://www.cnbc.com/2026/07/22/google-earnings-q2-goog-live-updates.html ; https://www.sec.gov/Archives/edgar/data/0001652044/000165204426000066/googexhibit991q22026.htm |
| 2026-07-29 | Microsoft: about **$175B** of capex plus finance leases for 2026, after an accounting change (building life extended to 25 years, more operating leases). Further growth expected in fiscal 2027. Q4 capex was $41B (reported) | ~$175B | https://www.cnbc.com/2026/07/29/microsoft-msft-q4-earnings-report-2026.html |
| 2026-07-30 | Amazon: raised to **$220B** (from $200B), citing memory prices. "We will still not have enough capacity … in 2026 … also be true in 2027". Trailing-twelve-month free cash flow was −$7.6B (reported) | $220B | https://www.cnbc.com/2026/07/30/amazon-amzn-q2-earnings-report-2026.html |
| 2026-08-26 | Nvidia: capex by the top 5 hyperscalers is expected to reach "nearly $800 billion in 2026 and $1.3 trillion in 2027" (reported, vendor claim) | $800B → $1.3T | Nvidia call transcript URL above |

### Frontier cluster growth (Epoch AI)

| Date | Claim | Number | Source |
|---|---|---|---|
| 2026-06-11 | The record for compute in a single data center "has doubled every seven months" (3.3× per year, with a simulated range of 2.3-5.1×). Colossus 2 is the leader in 2026 at about 1.1M H100e; next come Google Goodnight (about 2M, October 2027) and Meta Hyperion (about 3.7M, January 2028) (estimate) ⚠️ *I read the text and the frontier rows; the full 1,437-row data table embedded in the page was not read row by row.* | 3.3×/yr | https://epoch.ai/data-insights/largest-data-center-compute |
| 2026-09-24 | Hub of 93 sites: 14.0M H100e and 13.5 GW of IT power. Total facility power is "20-50% higher"; average draw is "60–80% of capacity". Largest by IT power: Colossus 2 at 946 MW, then Anthropic-Amazon New Carlisle at 910 MW (estimate) | 13.5 GW IT | https://epoch.ai/data/data-centers |
| 2025-11-04 | Time from construction start to 1 GW of facility power: "1 to 3.6 years". Typical cost is "$44B per gigawatt of server power … closer to $30B" per GW of facility power (estimate) | 1-3.6 yrs | https://epoch.ai/blog/introducing-the-frontier-data-centers-hub |
| 2026-06-16 | Hyperscaler cash capex growing about 70% a year versus operating cash flow growing about 23% a year; the two cross around Q3 2026 (estimate) | crossover Q3 2026 | https://epoch.ai/data-insights/hyperscaler-capex-vs-cash-flow |

---

## 4. Unit costs

| Item | Value | Type | Date | Source |
|---|---|---|---|---|
| All-in build cost per GW | "about $60 billion today", "$30 billion about 5 years ago" (Jensen Huang) | Reported, vendor claim | 2026-08-26 | Nvidia call transcript (fool.com URL above) |
| Nvidia revenue per GW | Hopper about $18B, Blackwell about $25B, Vera Rubin about $40B | Reported | 2026-08-26 | same |
| Rental value per GW | Huang: 1 GW "rents for" about $50B a year, with payback of about 1 year | Reported second-hand, vendor claim | 2026-09-24 | https://247wallst.com/investing/2026/09/24/nvidias-ceo-says-a-1-gigawatt-ai-factory-rents-for-50-billion-a-year-as-much-as-it-costs-to-build/ |
| Build cost per GW (OpenAI) | "more than $40 billion", could "halve" | Reported | 2025-10-28 | Reuters via stratnewsglobal (URL above) |
| Upfront capex, 1 GW of IT, GB200 NVL72 | **$37.9B**: servers $21.2B, facility $11.4B, network $4.9B, land and utility work $0.34B | Estimate (Epoch) | 2026-05-14 | https://epoch.ai/data-insights/ai-datacenter-cost-breakdown |
| Annual total cost of ownership, 1 GW | **$8.5B a year**: $7.6B of annualized capex plus $0.9B of opex. Energy is $0.59B of that. Equipment lives: IT 5 years, facility 14 years. With a 3-year IT life, $12-13B; with 7 years, $7B | Estimate (Epoch) | 2026-05-14 | same |
| GPU price, H100 / Blackwell | H100 $25-40k (analyst estimates); Blackwell $30-40k (Huang) | Reported | 2024-03-19 | https://www.cnbc.com/2024/03/19/nvidias-blackwell-ai-chip-will-cost-more-than-30000-ceo-says.html |
| Rack price (72-GPU racks) | GB200 NVL72 $2.8-3.4M; GB300 NVL72 $6-6.5M; Vera Rubin NVL72 $5-7M (includes about $1M of storage). "Nvidia has never confirmed" list prices | Reported, single anonymous source | 2026-03-24 | https://www.tomshardware.com/tech-industry/artificial-intelligence/price-of-nvidias-vera-rubin-nvl72-racks-skyrockets-to-as-much-as-usd8-8-million-apiece-but-server-makers-margins-will-be-tight-nvidia-is-moving-closer-to-shipping-entire-full-scale-systems |
| Rental, market index | Ornn index (executed trades): H100 **$2.85**, H200 $5.08, B200 **$8.04**, A100 $1.02 per GPU-hour | Reported | 2026-09-25 | https://data.ornn.com/preview |
| Rental, Silicon Data | March 2026: B200 mean $5.09 per hour; H100 hyperscaler about $7.4 per hour; H100 neocloud about $2.5 per hour (hyperscalers charge about 3× neoclouds) | Reported | 2026-03-30 | https://www.silicondata.com/blog/b200-rental-price-march-2026-update |
| Rental, 2025 median | $3.33 per GPU-hour (median neocloud rate in 2025, Silicon Data via SpaceX S-1) | Reported | 2026-05-20 | SpaceX S-1 |
| Rental, contract-level | SpaceX Colossus 1: **$4.2B per GW-month**. Nscale Vera Rubin: **$1.35B per GW-month** | Derived (Section 2) | 2026 | see Section 2 |
| Electricity | US industrial average **9.77¢/kWh ($97.7/MWh)**; Texas 7.07¢; Louisiana 6.08¢; Tennessee 7.13¢; Ohio 10.95¢ (July 2026) | Reported | 2026-09-24 release | https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a ⚠️ *I extracted the needed state rows from the table rather than reading every row.* |
| Power per month for 1 GW | At 100% draw: 1 GW × 730 h = 730,000 MWh. At $97.7/MWh that is **$71M per month**; at the Texas rate, $52M. Epoch assumes 71% utilization and 8.34¢, which gives $0.59B a year, or about **$49M per month** | Derived / Epoch | — | — |
| Facility power vs IT power | Facility power is about 1.3× IT power (Epoch). SB Energy: 10 GW of generation for 8 GW of IT (1.25×). xAI S-1 assumes PUE of 1.2 | Estimate / Reported | — | Epoch hub; Nvidia PORTS-Pike release |
| Build time | xAI: 130 MW in 122 days; 210 MW in 91 days; 220 MW in 64 days. Industry benchmark: about 2 years for 100 MW greenfield (S-1). Epoch: 1-3.6 years from construction start to 1 GW. Abilene: construction began Q2 2024, first racks June 2025, 1.2 GW in Q4 2026. Other Stargate sites: start Q3 2025-Q1 2026, finish Q4 2028. PORTS-Pike: announced August 2026, first 0.8 GW in 2028, 8 GW by 2032. Nscale deal: signed August 2026, online late 2027 | Reported / Estimate | — | sources above |
| Announcement to first power (chip deals) | Nvidia letter of intent September 2025 → first GW in the second half of 2026. AMD October 2025 → second half of 2026 (OpenAI); AMD July 2026 → first half of 2027 (Anthropic). Google/Broadcom April 2026 → from 2027 | Reported | — | sources above |

---

## 5. What this means for a game planner

These are suggested ratios for the planning screen. Each one is tied to the evidence above.

1. **Unit of planning: gigawatts per year, dollars per GW, and years of lead time.** Real labs announce "X GW by year Y" and then a dollar total. A good in-game goal is a row per year with a GW figure; the screen shows the implied commitment at about **$40-60B per GW** of build value. Chip counts are a secondary display: 1 GW ≈ 0.5M current-generation GPUs (derived from ">5 GW … over 2 million chips", OpenAI, July 2025). Epoch's H100-equivalent conversions are far higher per GW for newer chips.
2. **Lead time between signing and power-on.**
   - Leasing capacity someone else is already building: **12-18 months** (Nscale; AWS "all capacity before the end of 2026").
   - New chip platform deals: **about 1 year** to the first GW.
   - Greenfield campus: **2-3 years** to the first GW (Stargate sites, Epoch's 1-3.6 years).
   - Mega-campus: first phase in about 2 years, full build-out in **about 6 years** (PORTS-Pike).
   - Suggested rule: a goal set for year Y must be contracted by Y-2 for new builds, or Y-1 for leased capacity. A "rush" option (xAI-style, 3-4 months) could be offered at a premium or with a failure risk.
3. **Two ways to pay, with very different monthly shapes.**
   - **Own (capex):** about $38-60B upfront per GW, paid during construction. After that, about **$75M per month of opex** per GW (Epoch's $0.9B a year, of which about $50M a month is electricity). Monthly total cost of ownership is about **$0.7B per GW** when the upfront cost is spread over 5-year IT and 14-year facility lives.
   - **Lease or cloud:** no upfront cost. PORTS-Pike says "OpenAI will begin paying only as completed capacity becomes available". The monthly bill is about **$1.35B per GW** for a long-term contract (Nscale) and up to about **$4.2B per GW** for capacity available immediately and cancellable on short notice (SpaceX, 90-day termination).
   - The lease premium over ownership is therefore roughly 2× for long-term capacity and roughly 6× for spot capacity. The Decoder also reports OpenAI "had to buy more expensive computing capacity on short notice" in 2025 ⚠️ *that report is from a paywalled source.*
4. **Electricity is a small line.** At $70-100/MWh, 1 GW costs **$50-70M per month**, which is well under 10% of total cost of ownership. Servers are about 60%. A power-price slider should move totals only slightly, while server lifespan should move them a lot: Epoch's 1-GW annual cost ranges from $7B to $12-13B depending on whether IT equipment lasts 7 or 3 years.
5. **Compute spend against revenue.** Real frontier labs plan compute spending **roughly equal to cumulative revenue over the next 5 years**. OpenAI's plan is $856B of compute against about $840B of revenue for 2026-2030.
   - Burn follows a hump: OpenAI projects −$25B, −$57B, −$85B, −$51B, then +$39B for 2026 through 2030 ⚠️ *second-hand via The Decoder.*
   - Revenue has to grow about 10× in 4 years for the plan to work (OpenAI: about $36B to $350B).
   - A useful derived ratio for 2026: OpenAI's roughly $171B a year of planned average compute spend against about $36B of revenue is about **5× revenue** in the early years. Anthropic's $517B committed against a run rate of about $65B (July 2026) is about **8× annual revenue**, spread over about 10 years.
6. **Cash comes from outside, not from profits.** OpenAI raised $122B in March 2026, and that is projected to run out around 2028 (FT, second-hand). Partners carry the capex instead: Oracle, SB Energy, Blue Owl's 80% of Hyperion, Nvidia's credit support for 4.25 GW, and Nvidia's financing platforms targeting over $500B. Even hyperscalers now have capex roughly equal to operating cash flow (Epoch: crossover around Q3 2026; Alphabet and Amazon free cash flow negative in Q2 2026). The game's cash screen should include **funding rounds and partner financing** as the main way to close the gap between burn and revenue.
7. **Build in revision and slippage.** Every lab revised its plan within months:
   - OpenAI: $1.4T in November 2025, about $600B in February 2026, $856B in July 2026.
   - Nvidia's $100B letter of intent became a $30B equity stake.
   - Sites were cancelled or paused (Abilene expansion, UK, Norway).
   - Oracle invoked force majeure over a 2.45 GW site because of a pipeline delay.
   - Musk said "some of them won't pan out exactly on time": about 15 of 20 GW.
   - A reasonable mechanic is a per-project slip or cancellation chance of about 25% (derived from Musk's 15/20). Contracts could carry delivery-default clauses, as Nscale's contract lets Anthropic "terminate that tranche without liability".
8. **Show the plan the way the real sources do.** In what I opened, public "plan displays" take four forms:
   - (a) Round-number goals in prose: "10GW by 2029", "a gigawatt a week", "tens of GW this decade".
   - (b) Site tables of current GW, projected GW, construction start and completion quarter (the Epoch Stargate table).
   - (c) Revised-forecast tables of cash burn by year across forecast dates (The Decoder/The Information table: three forecast columns × 2024-2030).
   - (d) Log-scale trend lines of capex against cash flow, or of cluster size over time (Epoch).
   - I found no official company chart of GW against dollars; companies put this in words and deal totals. The investor decks behind the FT and The Information figures are not public.

**Captured charts (headless Chrome, checked by eye, Epoch AI, CC-BY)**
- `/private/tmp/claude-501/-Users-ardaenfiyeci-Desktop-game-night-ai-lab/c2531db4-c679-43fb-b072-1ec7fb166242/scratchpad/finance-research/shots/50-epoch-capex-vs-cashflow.png`: log-scale hyperscaler operating cash flow against cash capex, 2022-2028, with the Q3 2026 crossover marked. Source: https://epoch.ai/data-insights/hyperscaler-capex-vs-cash-flow
- `/private/tmp/claude-501/-Users-ardaenfiyeci-Desktop-game-night-ai-lab/c2531db4-c679-43fb-b072-1ec7fb166242/scratchpad/finance-research/shots/50-epoch-1gw-cost-breakdown.png`: horizontal bars of annual capex and opex for a 1 GW data center (servers $5B, facility $1.4B, network $1.2B, energy $590M, and so on). Source: https://epoch.ai/data-insights/ai-datacenter-cost-breakdown
- `/private/tmp/claude-501/-Users-ardaenfiyeci-Desktop-game-night-ai-lab/c2531db4-c679-43fb-b072-1ec7fb166242/scratchpad/finance-research/shots/50-epoch-largest-dc-compute.png`: frontier data center compute (H100e, log scale), observed versus projected, with the 3.3× per year trend. Source: https://epoch.ai/data-insights/largest-data-center-compute
- A screenshot of the Epoch Stargate page was taken and deleted, because the site table was cut off. Each screenshot shows a cookie banner in the corner; it does not cover the chart.

---

## 6. Coverage statement

Method: pages were fetched as raw HTML and converted to text locally, then read. For the two SEC filings, I converted the full filing and searched it.

**Opened and read to the end** (navigation and footer boilerplate ignored):
- OpenAI: Stargate announcement; Oracle 4.5 GW; five new sites; Nvidia; AMD; Broadcom; AWS; Microsoft restructuring; the April 2026 compute-infrastructure post; the $122B raise; PORTS-Pike. Also Altman's "Abundant Intelligence" (the post's date was not shown on the page; it is dated September 2025 from context).
- Anthropic: Google TPU (October 2025); Microsoft/Nvidia; $50B Fluidstack; Google/Broadcom (April 2026); Amazon (April 2026); SpaceX (May 2026). Also x.ai's partnership post and the AWS Project Rainier post.
- CNBC: OpenAI $600B reset; Altman $20B ARR; AMD-Anthropic; Nscale; SpaceX earnings; Microsoft Q4; Amazon Q2; Blackwell price (2024); Oracle force majeure.
- TechCrunch: SpaceX $1.25B per month; Anthropic $70B projection; Nscale deal; Anthropic $65B run rate; Oracle force majeure. Also Yahoo/TechCrunch on the $1.4T commitments.
- Other articles: TNW $856B; TechTimes $278B; Data Center Knowledge (TPU deal); DCD Nscale; DCD Meta 2025; DCD Meta Compute; Reuters Meta memo (WTVB syndication); Reuters Altman livestream (StratNews syndication); Tom's Hardware on xAI 50M and on Vera Rubin rack prices; 24/7 Wall St on Jensen's $50B and on Anthropic's $517B; Simon Willison on the $47B run rate.
- Epoch AI: Stargate sites; Frontier Data Centers Hub intro; data-centers hub page; AI data centers explainer; 1-GW cost breakdown; hyperscaler capex vs cash flow.
- Prices and markets: Ornn index; Silicon Data B200 March 2026; EIA end-use update.
- Nvidia: PORTS-Pike press release; the Q2 FY2027 earnings call transcript on fool.com. The transcript's Q&A was read in sections; the part of the final analyst answer between the question and the closing remarks appears clipped on the source page itself.

**Opened but read only in part (⚠️):**
- SpaceX S-1 (May 20, 2026, about 220,000 words): compute, capex, contract and market-sizing passages only.
- Nscale S-1 (September 18, 2026, about 196,000 words): Anthropic, Microsoft and customer sections only.
- Meta Q2 8-K and Alphabet Q2 8-K: narrative read, tables skimmed.
- CNBC Alphabet live blog: searched rather than read end to end.
- EIA Table 5.6.A: selected state rows extracted.
- Epoch "largest data center" page: 1,437-row data table not read row by row.
- The Decoder (two articles): each ends in a subscriber teaser, so the full article may be longer.

**Fetched but not read, and not cited:** Silicon Review (FT recap); Thunder Compute GPU-market post; TradingView Reuters item (paywalled stub).

**Could not reach (⚠️):**
- Financial Times, Bloomberg and The Information originals (paywalls). Every FT, Bloomberg or The Information figure in this report is second-hand, through TNW, TechTimes, TechCrunch, The Decoder, 24/7 Wall St or CNBC.
- Forbes on Nscale (HTTP 403).
- US News on Anthropic's $200B Google deal (timeout; used as a snippet only).
- X posts by Musk, Altman and Wall St Engine (quoted only via articles or snippets).
- SemiAnalysis: not opened. I relied on Epoch AI for cluster-growth estimates.
- The EIA "Electric Power Monthly" narrative beyond the table and the end-use page.

**Caveats:**
- Vendor claims (Nvidia's $60B per GW, "$50B a year" rent, payback under a year; SpaceX's payback under a year) come from sellers of the hardware or capacity.
- Epoch figures are model estimates with stated error of about 1.4-1.6× on individual sites.
- All "Derived" figures are my arithmetic and depend on contract length and utilization assumptions that the sources do not fully disclose.
