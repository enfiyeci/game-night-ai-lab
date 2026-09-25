# The AI Compute Race as a Multi-Actor System (through 2026-09-24)

## Supply chain actors and chokepoints: where are the real bottlenecks and lead times?

### Takeaway
As of mid-2026 the binding constraint has shifted from advanced packaging (CoWoS) to TSMC's leading-edge logic wafer capacity and high-bandwidth memory (HBM), with lithography tools (ASML) and DRAM/HBM makers (SK Hynix, Samsung, Micron) sold out through 2026; lead times across the chain run from roughly 12 months (EUV tools) to over a year (CoWoS-packaged GPUs).

### Cited Findings
- TSMC's CoWoS advanced-packaging capacity is projected to reach 120,000–130,000 wafer starts per month (wpm) by end of 2026, up from ~13,000 wpm at end of 2023 — a roughly 10x expansion — driven by NVIDIA B200/GB200 and AMD MI300X/MI400 demand — [SemiAnalysis via search summary / SiliconAnalysts](https://siliconanalysts.com/analysis/foundry-allocation-status-q1-2026)
- As of mid-2026, CoWoS-S and CoWoS-L are fully booked; NVIDIA holds ~60% of CoWoS capacity; lead times for CoWoS-packaged parts run 52–78 weeks — [ClusterBid](https://clusterbid.com/blog/gpu-supply-chain-2026-tsmc-cowos-nvidia-allocation-lead-times)
- TSMC plans to outsource 240,000–270,000 wafers/year of CoWoS work in 2026 to OSAT partners, mainly Amkor (~180,000–190,000 wafers) and SPIL (~60,000–80,000 wafers) — [search-result synthesis, SemiAnalysis-adjacent sources]
- Per SemiAnalysis's "The Great AI Silicon Shortage" (read via fetch): the *dominant* 2026 bottleneck is now TSMC N3 logic wafer capacity, not CoWoS — AI accelerators will consume ~60% of N3 output in 2026, rising to ~86% in 2027, with effective utilization exceeding 100% in H2 2026; TSMC "has been caught flat-footed" on wafer expansion — [SemiAnalysis, "The Great AI Silicon Shortage"](https://newsletter.semianalysis.com/p/the-great-ai-silicon-shortage)
- CoWoS packaging itself is now described as "tight but easing" as the bottleneck moves upstream to front-end logic, with outsourcing options via ASE/SPIL, Amkor, and Intel's EMIB — [SemiAnalysis, same source]
- HBM consumes ~3x more wafer capacity than commodity DRAM per bit, a ratio that could widen to ~4x with the HBM4 transition; NVIDIA's Rubin Ultra is expected to drive ~4x higher HBM capacity per device than the prior generation — [SemiAnalysis, same source]
- HBM capacity is sold out through 2026 across SK Hynix, Micron, and Samsung. SK Hynix's CFO said the company has "already sold out our entire 2026 HBM supply"; Micron confirmed 2025–2026 HBM capacity is fully booked — [Astute Group / Introl summary](https://www.astutegroup.com/news/general/sk-hynix-holds-62-of-hbm-micron-overtakes-samsung-2026-battle-pivots-to-hbm4/)
- SK Hynix holds ~62% HBM market share; Micron has overtaken Samsung for #2; the 2026 competitive battle is pivoting to HBM4 — [Astute Group](https://www.astutegroup.com/news/general/sk-hynix-holds-62-of-hbm-micron-overtakes-samsung-2026-battle-pivots-to-hbm4/)
- Samsung and SK Hynix pushed HBM4 production schedules to February 2026; Samsung expects HBM4 to be >60% of its total HBM sales in H2 2026, with Samsung's HBM share potentially reaching ~40% in Q4 2026 (up from 33% in Q2) — [DataCenterDynamics / Introl summary](https://introl.com/blog/ai-memory-supercycle-hbm-2026)
- Micron plans to add up to 60,000 HBM wafer starts per month by end-2026, bringing total monthly capacity to ~100,000 wafers, and has begun shipping HBM4 samples rated up to 11 Gbps — [Sammy Fans / Ersa Electronics summary](https://www.ersaelectronics.com/blog/skhynix-samsung)
- ASML's EUV lithography lead times run 12–18 months from order to delivery — [SiliconAnalysts / windowsforum summary](https://siliconanalysts.com/analysis/asml-euv-shipments-60-units-2026-memory-demand)
- ASML closed 2025 with a record backlog of €38.8 billion (Q4 2025 bookings hit €13.2B, including €7.4B EUV orders); the backlog persisted into early 2026 alongside 16% 2025 revenue growth and 11% YoY Q1 2026 growth. ASML expects to ship ~65 Low-NA EUV systems in 2026, with 30% more Low-NA EUV/DUV immersion capacity planned for 2027 — [MobileWorldLive / SiliconAnalysts summary](https://www.mobileworldlive.com/ai-cloud/feature-can-asml-catch-up-with-a-record-e39b-backlog/)
- TSMC postponed the rollout of ASML's next-generation High-NA EUV tools to 2029 — [Tom's Hardware / MSN summary](https://www.msn.com/en-us/news/other/tsmc-to-postpone-asmls-high-na-euv-rollout-until-2029/gm-GMLC021B00)
- Custom hyperscaler silicon (Google TPU v7 "Ironwood," Microsoft Maia 200, Amazon Trainium 3, Meta MTIA) all ramped to volume production in 2025–2026; combined 2026 deployment is estimated at ~1.9 million accelerators (~900k Google TPU, ~600k AWS Trainium, ~250k Microsoft Maia, ~180k Meta MTIA); every major custom chip now fabs on TSMC 3nm, which is at 100% utilization with demand ~3x supply — [Hashrate Index / Spheron Blog summary](https://www.spheron.network/blog/hyperscaler-custom-ai-chips-2026-trainium-tpu-maia-mtia-vs-nvidia-gpu/)
- Meta announced four new MTIA chips (300, 400, 450, 500) in March 2026; MTIA 300 entered production mid-2026 with a roughly six-month cadence through 2027 — [Tom's Hardware summary](https://www.tomshardware.com/tech-industry/semiconductors/custom-ai-asics-examined-from-broadcom-to-mtia)
- OpenAI unveiled its first custom inference chip, "Jalapeño," co-designed with Broadcom (announced ~June 2026); Broadcom's CEO Hock Tan disclosed a fourth major AI-chip customer that committed to a $10 billion order (widely reported as OpenAI) — [TechCrunch](https://techcrunch.com/2026/06/24/openai-unveils-its-first-custom-chip-built-by-broadcom/)
- Analysts project NVIDIA's inference-market share could fall from 90%+ today to 20–30% by 2028 as custom ASICs scale — [Spheron Blog summary](https://www.spheron.network/blog/hyperscaler-custom-ai-chips-2026-trainium-tpu-maia-mtia-vs-nvidia-gpu/) (labeled explicitly as a projection, not a confirmed fact)
- Huawei illegally procured roughly 2.9 million TSMC 7nm logic dies via Sophgo (a Cayman-Islands-registered front company) for Ascend 910B/910C chips; TSMC was fined $1 billion for the sanctions-evasion violation — [Tom's Hardware / SemiconductorX summary](https://semiconductorx.com/spotlight-huawei-hisilicon.html)
- China's CXMT is estimated able to produce ~2 million HBM stacks in 2026, sufficient for only 250,000–300,000 Ascend 910C units, making HBM (not logic) the binding constraint on Huawei's AI chip output — [SemiAnalysis, "Huawei Ascend Production Ramp"](https://newsletter.semianalysis.com/p/huawei-ascend-production-ramp)

### Inferences
- The chokepoint has moved twice within roughly two years: from GPU logic chips (2023) → CoWoS packaging (2024–25) → TSMC N3 wafer capacity and HBM (2026). A game modeling this race should let the "current bottleneck" shift over time rather than being a fixed resource.
- Memory (HBM) is now arguably a tighter chokepoint than logic itself, and it is controlled by a much narrower oligopoly (three firms) than logic fabrication (TSMC plus outsourced OSATs). This makes HBM allocation a strong candidate for a scarce, tradeable resource in a game.
- Custom silicon (TPU/Trainium/Maia/MTIA/Jalapeño) does not escape the underlying chokepoint — it competes for the *same* TSMC advanced-node wafer capacity as NVIDIA's GPUs — so "build your own chip" is a strategy to escape price/margin dependence on NVIDIA, not to escape the physical scarcity.

### Gaps
- Exact current lead times for finished NVIDIA GB200/GB300 racks (order-to-delivery, as distinct from CoWoS wafer lead time) were not directly found in this pass.
- Precise 2026 ASML High-NA (EXE:5000/5200) order book and pricing were not fully explored (only the 2029 TSMC-rollout-delay data point was captured).

---

## Who sells compute to labs, and how are deals structured?

### Takeaway
Labs buy compute three ways — direct hyperscaler cloud contracts, "neocloud" (GPU-specialist) multi-year take-or-pay deals, and equity-linked/circular arrangements where chipmakers or cloud providers invest in the lab that then spends the money back on their own hardware/cloud — and by 2026 all three forms coexist at massive scale, with neoclouds' backlogs and hyperscaler capex running far ahead of current AI revenue.

### Cited Findings
- The neocloud model: multi-year take-or-pay contracts for GPU capacity (customers commit to fixed capacity/rates for 2–5 years and pay regardless of usage); neoclouds then borrow against those contracts to finance buildout — [Solvimon Blog summary](https://www.solvimon.com/blog/neoclouds-owe-customers-years-of-compute)
- CoreWeave draws 96% of revenue from long-term take-or-pay contracts; contracted backlog reached $99.4 billion as of March 31, 2026 (up from $66.8 billion at year-end 2025); Q1 2026 revenue was $2.078 billion, +112% YoY — [MarkTechPost / Luminix summary](https://www.marktechpost.com/2026/08/23/best-gpu-neoclouds-2026/)
- CoreWeave is targeting 1.7 GW of active power by end of 2026 — [same summary]
- Nebius signed a $17.4–19.4 billion contract with Microsoft and a ~$3 billion deal with Meta; targeting $7–9 billion ARR by end-2026; Q1 2026 revenue grew 684% YoY; capacity is "sold out" with 4+ customers competing per GPU tranche; Nebius aims for up to 1 GW connected capacity against more than 4 GW of contracted power — [Trending Topics / Luminix summary](https://lumienai.com/news/best-gpu-neoclouds-2026-coreweave-nebius-lambda-crusoe-groq-ranked)
- "Circular financing": chipmakers/clouds invest equity into AI labs, which then spend that money buying the investor's own chips or cloud capacity, prompting bubble concerns — [Bloomberg, "AI Circular Deals: How Microsoft, OpenAI and Nvidia Keep Paying Each Other"](https://www.bloomberg.com/graphics/2026-ai-circular-deals/) ⚠️ read only via search-engine summary/snippet, not the full interactive graphic — paywalled/interactive content likely not fully captured
- In September 2025 NVIDIA agreed to invest up to $100 billion in OpenAI to fund ~10 GW of new data-center capacity, with OpenAI committing to fill that capacity with NVIDIA chips; however, the actual NVIDIA investment finalized as part of OpenAI's ~$110 billion funding round came in at $30 billion, well short of the original $100 billion pledge — [TechCrunch / GuruFocus summary](https://techcrunch.com/2026/03/04/jensen-huang-says-nvidia-is-pulling-back-from-openai-and-anthropic-but-his-explanation-raises-more-questions-than-it-answers/)
- MIT Sloan professor Michael Cusumano called the NVIDIA–OpenAI arrangement "kind of a wash": "Nvidia is investing $100 billion in OpenAI stock, and OpenAI is saying they are going to buy $100 billion or more of Nvidia chips" — [Financial Times, via TechCrunch summary](https://techcrunch.com/2026/03/04/jensen-huang-says-nvidia-is-pulling-back-from-openai-and-anthropic-but-his-explanation-raises-more-questions-than-it-answers/)
- Microsoft and NVIDIA together said they would invest up to a combined $15 billion in Anthropic — [same TechCrunch article]
- On 2026-03-04, at the Morgan Stanley TMT conference, NVIDIA CEO Jensen Huang said both the OpenAI and Anthropic investments were likely to be NVIDIA's last major equity checks into either company, because both labs are expected to go public later in 2026 and the private-investment window closes once that happens — [TechCrunch, same article](https://techcrunch.com/2026/03/04/jensen-huang-says-nvidia-is-pulling-back-from-openai-and-anthropic-but-his-explanation-raises-more-questions-than-it-answers/)
- Google agreed to invest up to $40 billion in Anthropic in cash and compute (announced 2026-04-24), the largest single financial commitment to an AI startup outside Microsoft–OpenAI — [TechCrunch](https://techcrunch.com/2026/04/24/google-to-invest-up-to-40b-in-anthropic/)
- Anthropic's original Google Cloud TPU deal (announced 2025-10-23) gives Anthropic access to up to 1 million Google TPUs, worth "tens of billions of dollars," expected to bring "well over a gigawatt" of compute online in 2026 — [CNBC](https://www.cnbc.com/2025/10/23/anthropic-google-cloud-deal-tpu.html)
- In April 2026, Anthropic expanded its Google/Broadcom compute commitment with an additional multi-gigawatt deal for up to 5 GW of next-generation TPU capacity starting in 2027 — [TechCrunch](https://techcrunch.com/2026/04/07/anthropic-compute-deal-google-broadcom-tpus/)
- NVIDIA's stated public allocation policy is "first-come, first-served," not highest-bidder — per Jensen Huang, April 2026 interview — [Digitimes](https://www.digitimes.com/news/a20260428PD221/nvidia-jensen-huang-gpu-demand-2026.html)
- In practice, "Multi-Year Purchase Agreements" (MYPAs) with NVIDIA guarantee allocation 15–25% above standard tier quotas in exchange for 2–3 year volume commitments plus 10–15% prepayments; hyperscalers (Microsoft, Google, Meta, Amazon) placed multi-billion-dollar forward Blackwell orders in 2025 that consumed most of NVIDIA's allocation through 2026 into 2027; short-term/spot contracts became secondary or pre-emptable relative to prepaid, long-term commitments — [search-result synthesis, ClusterBid/Spheron-family sources](https://www.spheron.network/blog/gpu-shortage-2026/)
- NVIDIA's own scale and willingness to prepay for fab/packaging capacity (CoWoS, 3D-IC) lets it secure a larger share of TSMC capacity, accelerating NVIDIA's own product cadence while leaving less manufacturing headroom for competitors — [same synthesis]
- Hyperscalers will deploy roughly $660–690 billion in aggregate 2026 capex, against direct AI revenue of roughly $51 billion — a cited ~10:1 capex-to-AI-revenue ratio — [Medium/Deep Quarry-family summary](https://medium.com/@svnkrmkr/ai-bubble-2026-is-it-real-capex-fed-warnings-gpu-lifespans-b5db2178d350) ⚠️ figure traced only to an aggregator/blog summary of the underlying analysis, not to a primary earnings source in this pass

### Inferences
- Deal structure has become as important a competitive lever as raw chip count: prepayment and multi-year exclusivity buy priority access, meaning smaller/newer labs without balance-sheet strength are structurally squeezed out of the best allocation tiers even at the same nominal price.
- The equity-for-compute / circular-financing pattern (NVIDIA↔OpenAI, Google↔Anthropic, Microsoft↔OpenAI) means the "compute seller" and "compute buyer" are frequently also part-owners of each other, which is a distinctive and gameable mechanic: an investor-actor can extract equity or exclusivity as the "price" of compute, not just cash.
- NVIDIA visibly began pulling back on new equity checks into OpenAI/Anthropic in March 2026 as IPOs approached — suggesting these equity-for-compute deals are a phase-specific tool (used while labs are private) rather than a permanent feature.

### Gaps
- Full, primary-source terms of the Microsoft–OpenAI cloud/equity restructuring (the exact revenue-share and IP terms as of 2026) were not directly retrieved in this pass — only referenced tangentially.
- Detailed Oracle contract terms (OpenAI's ~$300B multi-year Oracle cloud commitment reported in 2025) were not re-verified with a 2026 primary source in this pass.

---

## Mega-projects: Stargate, xAI Colossus, Meta Hyperion/Prometheus, Anthropic–Google — dollar amounts and timelines

### Takeaway
Every major lab now has a named gigawatt-or-larger flagship campus with public dollar figures and 2026–2030 timelines, and nearly all of them are running behind their original schedules; xAI's Colossus is the furthest along toward a full gigawatt of *operating* IT load, while OpenAI's Stargate is the largest in aggregate planned scale (33 GW total ambition, ~7 GW "planned active" as of May 2026) but shows the most schedule slippage.

### Cited Findings
- Stargate overall: a $500 billion, four-year initiative targeting 10 GW of U.S. AI compute, funded by OpenAI, SoftBank, Oracle, and Abu Dhabi's MGX — [IntuitionLabs / TechCrunch summary](https://intuitionlabs.ai/articles/openai-stargate-datacenter-details)
- As of May 2026, OpenAI's planned active Stargate capacity was approximately 7 GW with $400 billion+ in commitments; separately, OpenAI's total "Stargate" ambition is cited at 33 GW — [Presenc AI tracker / TechCrunch summary](https://presenc.ai/research/openai-compute-commitments-tracker-2026); ⚠️ the 33 GW figure appears only in a search-engine synthesis of a TechCrunch article on the Google–Anthropic deal, not independently confirmed against an OpenAI primary source in this pass
- Per Epoch AI's site-by-site Stargate tracker (fetched, dated ~April 2026):
  - **Abilene, TX**: 0.3 GW operational, 1.2 GW projected; construction began Q2 2024, completion targeted Q4 2026; built by Crusoe, powered by on-site gas plus grid/wind; four of eight buildings operational with NVIDIA Blackwell chips; OpenAI cancelled a planned 2.1 GW expansion in March 2026.
  - **Shackelford County, TX**: 2 GW projected; construction began Q3 2025, completion targeted Q4 2028; developer Vantage; onsite natural-gas microgrid; first-building delivery targeted late 2026.
  - **Doña Ana County, NM** ("Project Jupiter"): 2.2 GW projected; construction began Q4 2025, completion targeted Q4 2028; developer STACK Infrastructure; foundation work underway.
  - **Milam County, TX**: 1.2 GW projected; construction began Q3 2025, completion Q4 2028; SoftBank subsidiary SB Energy; first building delivery targeted October 2026 ("fast-build").
  - **Port Washington, WI** ("Lighthouse"): 1.3 GW projected; construction began Q1 2026, completion Q4 2028; developer Vantage; 70% renewable energy planned.
  - **Saline Township, MI** ("The Barn"): 1.4 GW projected; construction began Q4 2025, completion Q4 2028; developer Related Digital; power from DTE Energy; documented local opposition.
  - **Lordstown, OH**: <0.3 GW projected, completion date unknown; SoftBank–Foxconn JV; primarily a server-manufacturing facility; local ban on future data centers.
  — [Epoch AI, "OpenAI Stargate: where the US sites stand"](https://epoch.ai/publications/openai-stargate-where-the-us-sites-stand)
- A typical "powered shell" (empty data-center building without chips) costs $9–11 billion per gigawatt; the Abilene flagship specifically could reach nearly 1 GW of power by mid-2026 at a cost on the order of $3–4 billion — [Distilled Earth / IntuitionLabs summary](https://www.distilled.earth/p/openais-stargate-data-centers-are)
- **xAI Colossus** (Memphis, TN): as of mid-September 2026, Colossus carries about 1.29 GW of IT load with roughly 670,000 physical accelerators and $48.7 billion of modeled capital; total planned capacity is nearly 2 GW with 555,000 NVIDIA GPUs; a new building is nicknamed "MACROHARDRR"; the remaining 900 MW is owned by a joint venture 50.1% Solaris / 49.9% xAI; Solaris expects to have over 1.1 GW of fully operating gas turbines for xAI by Q2 2027; Colossus is powered largely by on-site gas turbines (including a permanent 1.2 GW gas plant in Southaven, MS) rather than the utility grid — [SemiAnalysis / Introl / Techzine summary](https://newsletter.semianalysis.com/p/xais-colossus-2-first-gigawatt-datacenter)
- **Meta Prometheus** (New Albany, OH): Meta's first multi-gigawatt supercluster, scheduled to come online before end of 2026; Meta has discussed powering it partly with nuclear energy — [gHacks / Data Center Frontier summary](https://www.ghacks.net/2026/07/16/meta-announces-first-ai-data-center-prometheus-coming-online-in-2026-with-more-superclusters-planned/)
- **Meta Hyperion** (Louisiana): announced June 2025; planned to scale up to 5 GW over several years; first phase (~2 GW) targeted for completion by 2030; described as "nearly the size of Manhattan"; Meta is also using tents to keep pace with expansion, per Zuckerberg — [Tom's Hardware summary](https://www.tomshardware.com/tech-industry/artificial-intelligence/meta-plans-multi-gw-data-center-thats-nearly-the-size-of-manhattan-zuckerberg-promises-enormous-ai-splash-as-company-uses-tents-to-try-and-keep-up-with-rate-of-expansion)
- Meta has said it will invest "hundreds of billions of dollars" into compute for "superintelligence," with "several multi-GW clusters" planned beyond Hyperion/Prometheus — [DataCenterDynamics summary](https://www.datacenterdynamics.com/en/news/meta-to-invest-hundreds-of-billions-of-dollars-into-compute-to-build-superintelligence-with-several-multi-gw-data-center-clusters/)
- Anthropic–Google/Broadcom: see prior section — up to 1 million TPUs (announced Oct 2025, "well over a gigawatt" online in 2026) plus an additional up-to-5 GW TPU commitment from 2027 (announced April 2026) — [CNBC](https://www.cnbc.com/2025/10/23/anthropic-google-cloud-deal-tpu.html), [TechCrunch](https://techcrunch.com/2026/04/07/anthropic-compute-deal-google-broadcom-tpus/)
- Stargate UAE: announced 2025-05-14, targeting 1 GW total with the first 200 MW online in 2026, operated by G42 with consortium partners OpenAI, Oracle, NVIDIA, Cisco, and SoftBank — [SemiAnalysis / explainx.ai summary](https://newsletter.semianalysis.com/p/ai-arrives-in-the-middle-east-us-strikes-a-deal-with-uae-and-ksa)

### Inferences
- Nearly every flagship mega-project (Stargate's Abilene expansion, Meta's timeline) shows some form of 2026 schedule slippage or scope-cut relative to original announcements, suggesting that in a game, "announced GW" and "operating GW" should be modeled as two different numbers with a lag and attrition rate between them.
- On-site gas generation (xAI Colossus, several Stargate sites) is emerging as the default workaround for grid interconnection delays — power sourcing method (grid vs. on-site gas vs. nuclear) is itself a strategic choice with different speed/cost/political tradeoffs, not just a cost line.

### Gaps
- Comprehensive, single-source confirmation of "33 GW" total Stargate ambition was not found beyond an aggregator's characterization of a TechCrunch piece; treat as approximate/unverified pending a primary OpenAI/Stargate statement.
- Total combined dollar commitment across all Stargate sites individually (beyond the aggregate $500B/$400B+ figures) was not itemized per-site in the sources retrieved.

---

## Power and physical constraints: electricity, interconnection queues, gas, nuclear, water, permitting, opposition

### Takeaway
Power, not chips, is increasingly the hard ceiling on how fast compute can be turned on: U.S. interconnection queues are measured in hundreds of gigawatts against single-digit-gigawatt actual buildout, pushing developers toward on-site gas and (more slowly) nuclear, while a rapidly growing, geographically broad wave of local political opposition — now over $60 billion in blocked/delayed U.S. projects — has become a second, independent constraint alongside physical grid capacity.

### Cited Findings
- As of March 2026, ERCOT (Texas grid) had received approximately 356 GW of data-center interconnection requests; ERCOT's large-load queue (majority data centers) is roughly 238 GW, with a request-to-actually-operating conversion rate in the "low single digits" percent — [ATK Energy / EnkiAI summary](https://enkiai.com/data-center/ai-data-center-energy-2026-2600-gw-queue-pjm-plan/)
- U.S. interconnection queues broadly are clogged with over 2.6 TW (terawatts) of backlogged requests; the median time to bring a new grid-connected project online has doubled over the last decade to more than five years — [Energy Institute Blog / ATK Energy summary](https://atkenergygroup.com/blog/grid-interconnection-data-centers/)
- Data-center developers have announced approximately 101 GW of on-site natural-gas generation specifically to bypass interconnection bottlenecks; U.S. data-center natural-gas demand may reach 6.1 Bcf/day by 2030 (~20% increase to recent annual average gas power-burn); in Q1 2026 alone, 16 GW was added to the gas project pipeline, bringing the total planned gas pipeline to 64 GW by 2030 — [RBC Capital Markets / Enverus summary](https://www.rbccm.com/en/insights/2026/05/natural-gas-powers-the-data-center-boom)
- U.S. faces a structural data-center power shortfall of 9.3 GW in 2026, forecast to widen to 45 GW by 2028 — [Goldman Sachs Research, via search synthesis](https://presenc.ai/research/ai-data-center-energy-consumption-2026) ⚠️ traced to an aggregator citing Goldman Sachs, not the primary Goldman report itself
- IEA's "Electricity 2026" report: global data-center electricity demand reached ~485 TWh in 2025 (+17% YoY), with AI-specific data-center demand growing even faster at +50% in 2025; the IEA base case projects global data-center electricity consumption could reach 945 TWh by 2030 and 1,200 TWh by 2035 — [IEA, "Electricity 2026"](https://www.iea.org/reports/electricity-2026) ⚠️ accessed via search-engine synthesis of the IEA report landing pages, not a full read of the IEA's own PDF/report text
- Meta plans to power its Prometheus (Ohio) data center partly with nuclear energy, targeted online before end of 2026 — [gHacks summary](https://www.ghacks.net/2026/07/16/meta-announces-first-ai-data-center-prometheus-coming-online-in-2026-with-more-superclusters-planned/)
- $64 billion of U.S. data-center projects have been blocked or delayed amid local opposition (cumulative tracker figure); more recent data shows the pace accelerating — nearly four dozen projects worth an estimated $68 billion were blocked or delayed in the U.S. in Q2 2026 alone; there are now 843 identified opposition groups across the U.S., and 49 states are scrutinizing data-center development — [Data Center Watch](https://www.datacenterwatch.org/report)
- A June 2026 poll found "strongly oppose" sentiment toward local data-center construction roughly doubled from 24% (Aug 2025) to 55% (May 2026); a separate March 2026 Gallup poll found ~70% of Americans oppose local data centers — [Network World / Food & Water Watch summary](https://www.networkworld.com/article/4224586/communities-are-blocking-data-centers-before-theyre-even-proposed.html)
- Water-usage disclosure/management legislation is gaining momentum in 2026; multiple states are following Minnesota's 2025 precedent of a separate water-permitting requirement for data centers; electricity prices and water availability are cited as the two hot-button local opposition issues — [Public Power Association / MultiState summary](https://www.multistate.us/resources/state-data-center-policy-101)
- Moratorium bills were introduced in 11 U.S. states in 2026 (facing resistance), while dozens of municipalities enacted local construction pauses; New York's state legislature passed a one-year freeze on new data-center construction in June 2026 — [Data Center Watch / MultiState summary](https://www.datacenterwatch.org/report)
- Local opposition specifically blocked/slowed Stargate's Saline Township, Michigan site (documented opposition) and led to a local ban on future data centers at the Lordstown, Ohio Stargate site — [Epoch AI](https://epoch.ai/publications/openai-stargate-where-the-us-sites-stand)

### Inferences
- Power sourcing is bifurcating into "fast but politically/emissions-costly" (on-site gas turbines) versus "slow but cleaner" (grid interconnection, nuclear) — actors that can tolerate schedule risk (nuclear-committed) trade speed for durability, while actors racing on schedule (xAI, several Stargate sites) default to gas.
- Local political opposition has grown from a marginal factor into a resource-denial mechanic comparable in scale to a chip shortage (tens of billions of dollars of projects blocked), which argues for treating "community/political capital" as its own scarce resource in a game, separate from money and hardware.

### Gaps
- Full text of the IEA "Electricity 2026" and "Energy and AI" reports was not read end-to-end in this session — findings above rely on search-result summaries of the report's landing/executive-summary pages, not the full PDF.
- Specific nuclear-deal details (e.g., named reactor restarts/SMR contracts tied to specific labs beyond Meta's Prometheus mention) were not investigated in depth in this pass.

---

## Governments and geopolitics: export controls, China's domestic chips, sovereign AI deals, tariffs

### Takeaway
U.S. China-chip export policy reversed twice in roughly a year — a 2025 tightening followed by a mid-2025 quiet reversal on H20 and a formal December 2025/January 2026 rule allowing case-by-case H200 exports with a 25% tariff — while China's Huawei Ascend line has grown to 50–60% of the domestic Chinese AI-chip market despite (and partly via evasion of) controls, and Gulf states (UAE's G42/Stargate UAE, Saudi Arabia's HUMAIN) have become major sovereign buyers with U.S.-brokered access to advanced chips.

### Cited Findings
- The Biden-era "AI diffusion rule," which would have taken effect in May 2025, was rescinded by the Trump administration before taking effect — [IISS summary](https://www.iiss.org/publications/strategic-comments/2025/12/the-us-pivot-on-regulating-ai-diffusion/)
- After halting AI-chip exports to China in April 2025, the Trump administration quietly reversed policy in July 2025, allowing NVIDIA to resume H20 shipments to China — [Built In summary](https://builtin.com/articles/trump-lifts-ai-chip-ban-china-nvidia)
- On 2025-12-08, Trump announced a one-year waiver of export restrictions on NVIDIA's H200 chips for AI data-center use; on 2026-01-13, the Department of Commerce codified this into a formal rule with conditions attached — [Introl Blog summary](https://introl.com/blog/bis-h200-china-export-policy-ai-overwatch-act-2026)
- Under the current framework, BIS reviews export-license applications for NVIDIA H200, AMD MI325X, and similar chips case-by-case, contingent on security requirements; the White House simultaneously imposed a 25% tariff on chips meeting the same performance thresholds — [BIS press release / NeuralWired summary](https://www.bis.gov/press-release/department-commerce-revises-license-review-policy-semiconductors-exported-china)
- As of the sources reviewed, State Department review has stalled actual shipments even after Commerce completed its analysis — implementation gap between rule and practice — [search synthesis]
- As of February 2026, NVIDIA reportedly still had not sold its U.S.-approved China AI chips, and is concerned domestic Chinese rivals (i.e., Huawei) could capture the market NVIDIA is licensed to but slow to serve — [CNBC](https://www.cnbc.com/2026/02/26/nvidia-china-chip-sales-export-controls-ai-competition.html)
- Huawei illegally procured ~2.9 million TSMC 7nm dies via the Cayman-Islands-based Sophgo as a sanctions-evasion scheme; TSMC was fined $1 billion — [SemiconductorX / Tom's Hardware summary](https://semiconductorx.com/spotlight-huawei-hisilicon.html)
- Huawei's Ascend chip line grew to roughly 50–60% of China's AI-chip market by 2026, worth ~$12.1 billion in annual sales; in September 2026 Huawei's rotating chairman said domestic AI-computing-hardware demand is so oversubscribed that a broad international launch of Ascend chips "isn't on the table" — [Value Add VC / shattered.io summary](https://valueaddvc.com/blog/how-export-controls-on-ai-chips-are-reshaping-global-tech-competition)
- China's domestic HBM producer CXMT is capacity-limited to ~2 million HBM stacks in 2026 — enough for only 250,000–300,000 Ascend 910C units — making HBM the binding constraint on China's AI-chip self-sufficiency even as logic-die smuggling/production continues — [SemiAnalysis, "Huawei Ascend Production Ramp"](https://newsletter.semianalysis.com/p/huawei-ascend-production-ramp)
- Huawei's newly announced Ascend 950PR (2026) remains on SMIC's domestic 7nm process but claims 2.8x the H20's FP4 performance — an architecture-level gain compensating for a process-node disadvantage — [shattered.io summary](https://shattered.io/huawei-curbs-ai-chip-exports-atlas-120-exaflops-2026/)
- Stargate UAE (announced 2025-05-14) targets 1 GW total, with the first 200 MW online in 2026; operated by G42 with consortium partners OpenAI, Oracle, NVIDIA, Cisco, and SoftBank; G42's Core42 unit runs a 10 MW Fort Worth, TX data center and a 70 MW upstate-NY campus (built by TeraWulf) that could exceed 200 MW in 2026 — [SemiAnalysis, "AI Arrives in the Middle East"](https://newsletter.semianalysis.com/p/ai-arrives-in-the-middle-east-us-strikes-a-deal-with-uae-and-ksa)
- Saudi Arabia's HUMAIN (announced 2025-05-13 by the Public Investment Fund as the kingdom's national AI champion) has committed roughly $100 billion across 11 data centers totaling 2.2 GW with hundreds of thousands of NVIDIA GPUs over a multi-year build-out; Google Cloud and PIF advanced a $10 billion partnership to build a global AI hub in Saudi Arabia with HUMAIN (originally discussed in autumn 2024) — [SemiAnalysis / explainx.ai summary](https://www.explainx.ai/blog/uae-saudi-arabia-ai-landscape-g42-humain-2026)
- HUMAIN's operational maturity trails G42's; HUMAIN's exact role (cloud provider vs. LLM/agent developer) remains unsettled as of the sources reviewed — [same source]
- The Middle East war in 2026 has been reported as testing/complicating the Gulf states' AI-hub ambitions — [CNBC](https://www.cnbc.com/2026/05/24/middle-east-war-testing-gulfs-ambitions-to-become-ai-hub.html) ⚠️ seen only as a search-result headline/snippet; the article itself was not fetched, so the specific mechanism of disruption is not confirmed here

### Inferences
- U.S. export policy toward China has oscillated at roughly 6–12 month intervals (tighten → quiet reversal → formal codified relaxation with tariff), suggesting that in a game, "export control regime" should be modeled as a periodically-flipping random/political event rather than a fixed rule.
- China's AI-chip strategy shows a two-track pattern: illicit acquisition of foreign-made logic dies (Sophgo/TSMC smuggling) running in parallel with a genuine, HBM-constrained domestic buildout (Huawei/SMIC/CXMT) — both tracks are memory-bottlenecked, mirroring the Western supply chain's own HBM chokepoint.
- Sovereign wealth-backed buyers (UAE, Saudi Arabia) function as both customers and geopolitical bargaining chips: their access to top-tier U.S. chips is explicitly gated by U.S. government approval (the "AI diffusion"-adjacent bilateral deals), making them a distinct actor type whose "compute access" lever is political, not just financial.

### Gaps
- Full assessment of "chip smuggling" beyond the Huawei/Sophgo/TSMC case (e.g., informal Southeast Asian transshipment routes for H100s) was not investigated in this pass.
- CHIPS Act 2026 status/updates and any new U.S. tariff actions beyond the 25% China-chip tariff were not separately researched.
- No information gathered in this pass on China's own countermeasures (e.g., rare-earth export controls, China's restrictions on domestic use of foreign chips) as a mirror-image lever.

---

## Market dynamics: rental prices, depreciation, "AI bubble," and how efficiency-focused labs compete on less compute

### Takeaway
GPU rental prices have fallen sharply since 2024 as B-series Blackwell supply arrived and H100s became commoditized, even as absolute demand keeps growing; a live and unresolved public debate (Michael Burry vs. NVIDIA/hyperscalers) centers on whether GPUs are being depreciated over unrealistically long schedules relative to actual 2–3 year replacement cycles, while open-weight Chinese labs (DeepSeek, Qwen) demonstrate that architecture (mixture-of-experts, sparse activation) can cut training and inference compute costs by an order of magnitude versus dense Western frontier models.

### Cited Findings
- H100 on-demand median rental price in September 2026 is $3.25/GPU-hour, with a range of $1.49–$6.98/hour depending on provider: Vast.ai marketplace from $1.49, RunPod from $1.99, Lambda at $3.99, CoreWeave at $4.25, hyperscalers up to $6.98 — [Shattered.io / IntuitionLabs summary](https://shattered.io/h100-h200-b200-cloud-gpu-pricing-2026/)
- H100 cloud rental prices fell from $8–10/hour in 2024 to $1.80–3.50/hour by Q2 2026; AWS cut H100 on-demand pricing 44% in June 2025 (up to 45% across NVIDIA GPU instances), and the broader market followed AWS's lead — [ValueAddVC summary](https://valueaddvc.com/blog/is-the-ai-chip-shortage-over-in-2026-gpu-pricing-and-what-comes-next)
- B200 on-demand pricing runs $2.12/hour (spot) to $4.99–$6.04/hour at specialist providers; 36-month reserved contracts as low as $2.25/hour; AWS's Blackwell instance list rate reaches roughly $14.24/GPU-hour — [Shattered.io / IntuitionLabs summary](https://intuitionlabs.ai/articles/data-center-gpu-pricing-2026)
- Michael Burry publicly argued hyperscalers depreciate NVIDIA GPUs over 4–6 years when real replacement cycles run closer to 2–3 years, estimating this understates industry depreciation by ~$176 billion from 2026–2028; he estimated Oracle's earnings could be overstated by ~27% and Meta's by ~21% by 2028 — [Seeking Alpha / Forbes summary](https://seekingalpha.com/article/4934814-burry-vs-jensen-the-number-that-breaks-the-ai-boom)
- Countervailing view: rising GPU rental rates for older chips and continued institutional credit support for GPU-backed debt suggest genuine ongoing economic value for older GPUs, favoring NVIDIA's longer-useful-life argument over Burry's — [same summary]
- One commentary frames the risk sharply: "an AI infrastructure company with a bad business model has perhaps 36 months before its GPU fleet is both competitively obsolete and financially problematic simultaneously," and argues any AI-infrastructure bubble would deflate unusually fast because the underlying assets depreciate quickly — [Medium/TechConstant-family summary](https://medium.com/@svnkrmkr/ai-bubble-2026-is-it-real-capex-fed-warnings-gpu-lifespans-b5db2178d350) ⚠️ opinion/commentary source, presented here as an argument in the debate, not a verified fact
- Hyperscalers are estimated to deploy ~$660–690 billion in aggregate 2026 capex against ~$51 billion of direct AI revenue (a cited ~10:1 ratio) — [same summary] ⚠️ traced only to a blog aggregator, not to primary earnings-call figures in this pass
- DeepSeek reportedly trained V3 for ~$5.6 million on ~2,000 H800-equivalent GPUs, and trained R1 for only ~$294,000 using additional efficiency optimizations — [AICost / search synthesis](https://aicost.org/blog/chinese-ai-models-cost-advantage-2026) ⚠️ these DeepSeek cost figures originated in DeepSeek's own 2025 paper/media claims and are widely repeated by aggregators; independent verification was not performed in this pass — flag as a claimed, not independently confirmed, figure
- DeepSeek-V3 (671B total parameters, only 37B active per token — a mixture-of-experts design) cuts inference compute by 80%+ relative to dense models; Qwen3.5 uses a similar 235B-A22B MoE design; Qwen3.5-397B-A17B activates only 17B of 397B parameters (4.3% activation ratio) versus DeepSeek-R1's 37B of ~671–685B (5.4% ratio) — [search synthesis](https://www.spheron.network/blog/llm-api-pricing-comparison-gpt-claude-gemini-deepseek-2026/)
- As of August 2026, DeepSeek V4-Flash API pricing was cited at $0.14/M input tokens and $0.28/M output tokens — among the cheapest listed frontier-adjacent APIs; a typical 3:1 input:output workload costs ~$0.35 blended for DeepSeek versus $5–7 for Western flagship models — [AICost summary](https://aicost.org/blog/chinese-ai-models-cost-advantage-2026)
- Quantized 4-bit versions of Qwen/DeepSeek models can run on a single consumer RTX 4090 GPU at under $0.01 per million tokens in electricity cost, illustrating the open-weight/self-hosting path to bypassing the compute-rental market entirely — [search synthesis]

### Inferences
- The price collapse in H100 rentals (roughly 3–5x lower per-hour cost since 2024) combined with continued high demand for the newest chips (B200/Blackwell, HBM4-equipped parts) suggests a two-tier compute market forming: a commoditizing "workhorse" tier (H100-class) and a scarce "frontier" tier (Blackwell/Rubin-class) — a useful structure for tiered pricing in a game.
- The Burry vs. NVIDIA depreciation dispute is unresolved and consequential (potentially tens of billions of dollars in restated earnings), making it a good candidate for a random "event card" in a game that retroactively changes an actor's effective balance sheet.
- Efficiency-focused labs (DeepSeek, Qwen) demonstrate a genuinely different strategic path — competing on architecture/algorithmic efficiency rather than raw compute volume — which could let a game include a "low-compute, high-efficiency" playable strategy distinct from the compute-maximalist strategy of Western frontier labs.

### Gaps
- Independent verification (outside DeepSeek's own claimed figures, as reported by aggregators) of the $5.6M/$294K DeepSeek training-cost numbers was not performed; treat as a disputed/self-reported figure.
- No primary earnings-call source was fetched in this pass for the $660–690B 2026 hyperscaler capex or $51B AI-revenue figures; these should be checked against actual Q2/Q3 2026 earnings calls (Microsoft, Google, Amazon, Meta) before being treated as firm.
- GPU utilization rates (as opposed to price and depreciation) were not separately investigated.

---

## How do competing labs race for the same scarce supply — allocation, prepayment, favoritism, poaching?

### Takeaway
NVIDIA publicly maintains a "first-come, first-served" allocation policy, but in practice long-term prepaid volume commitments (Multi-Year Purchase Agreements offering 15–25% above-standard allocation in exchange for 2–3 year commitments and 10–15% upfront prepayment) let large, cash-rich hyperscalers lock up most forward Blackwell supply through 2026–2027, effectively squeezing shorter-term and smaller buyers into a secondary, pre-emptable tier; labs increasingly hedge this by diversifying to custom silicon (TPU, Trainium, Maia, MTIA, Jalapeño) rather than relying solely on NVIDIA allocation.

### Cited Findings
- NVIDIA CEO Jensen Huang stated in an April 2026 interview that GPU allocation follows a first-come, first-served principle, not a highest-bidder-wins model — [Digitimes](https://www.digitimes.com/news/a20260428PD221/nvidia-jensen-huang-gpu-demand-2026.html)
- In practice, Multi-Year Purchase Agreements (MYPAs) with NVIDIA guarantee allocation 15–25% above standard tier quotas in exchange for 2–3 year volume commitments and 10–15% prepayments — [search synthesis, ClusterBid/Spheron-family](https://www.spheron.network/blog/gpu-shortage-2026/)
- Microsoft, Google, Meta, and Amazon placed multi-billion-dollar forward orders for Blackwell GPUs in 2025 that consumed most of NVIDIA's available allocation capacity through the end of 2026 and into 2027 — [same synthesis]
- Short-term/spot contracts became secondary to, and even pre-emptable by, prepaid long-term commitments; access to capacity increasingly required upfront financial commitment rather than being purely price-driven — [same synthesis]
- NVIDIA's own scale and prepayment for TSMC fab/packaging capacity (CoWoS, 3D-IC) lets it secure a larger share of available capacity, accelerating its own roadmap while leaving less headroom for competing chip designers — [same synthesis]
- OpenAI turned to Broadcom for a custom "Jalapeño" inference chip explicitly because "when every AI lab, cloud provider, and government wants the same Blackwell-class GPUs at the same time, allocation becomes as important as price"; the move was framed as a hedge against GPU supply concerns and a way to reduce dependence on NVIDIA's margins — [SDxCentral / TechCrunch summary](https://www.sdxcentral.com/analysis/openais-broadcom-deal-signals-the-end-of-nvidias-ai-chip-monopoly/)
- Nebius describes its 2026 capacity as "sold out," with more than 4 customers competing per available GPU tranche — a direct data point on demand exceeding neocloud supply at the point of sale — [Trending Topics / Luminix summary](https://lumienai.com/news/best-gpu-neoclouds-2026-coreweave-nebius-lambda-crusoe-groq-ranked)

### Inferences
- The "first-come, first-served" public framing versus the prepayment/MYPA reality is a good illustration of a two-layer allocation mechanic for a game: a visible nominal rule, and a hidden/structural rule (who can afford to prepay years in advance) that actually determines outcomes — well-capitalized incumbents (hyperscalers) get priority regardless of formal policy.
- Diversification into custom silicon and neocloud relationships functions as a hedge against being poached or deprioritized in NVIDIA's allocation queue — a lab with only one compute supplier is structurally more exposed to allocation risk than one with several.

### Gaps
- No direct, named example was found in this pass of one lab explicitly "poaching" another lab's already-contracted capacity (e.g., a neocloud reneging on a smaller customer to serve a larger one); the dynamic is described generically ("short-term contracts pre-emptable") rather than with a specific documented incident.
- No data found on whether NVIDIA has ever formally deprioritized a specific named customer for political or competitive reasons (beyond the general dynamic of prepayment favoring hyperscalers).

---

## Transfer notes: designing a multi-actor compute market for a 10–20 minute AI-lab game

**Actor roster (5 fictionalized actor types, each modeled on a real-world role found above):**

1. **The Chip Titan** (stand-in for NVIDIA/AMD). Sells the fastest compute but allocates it by prepayment tier, not cash price alone — modeled on the real MYPA system (15–25% extra allocation for 2–3 year commitment + 10–15% upfront). Demands: multi-year exclusivity or minimum-spend commitments; may offer equity-swap deals (give the Chip Titan a stake in your lab in exchange for guaranteed allocation — modeled on NVIDIA↔OpenAI/Anthropic), which raises your compute access but caps your future valuation/independence (a real 2026 dynamic: NVIDIA pulled back equity investment as OpenAI/Anthropic neared IPO). Lever: can throttle a player's allocation tier if a rival prepays more.

2. **The Hyperscaler Landlord** (Microsoft/Google/Amazon/Oracle stand-in). Sells reserved cloud capacity via long take-or-pay contracts (modeled on CoreWeave's 96%-contracted, $99.4B-backlog model, and Nebius's $17–19B Microsoft deal). Demands: multi-year lock-in, sometimes with a strings-attached investment/partnership clause (modeled on Google's $40B Anthropic stake and Microsoft-OpenAI's structure) that gives it a claim on the lab's future revenue or governance. Offers the *fastest path to guaranteed capacity* but the *least flexibility* if the player's strategy changes.

3. **The Neocloud Hustler** (CoreWeave/Nebius/Lambda/Crusoe stand-in). Sells GPU capacity faster and cheaper than hyperscalers but is itself thinly capitalized and dependent on its own take-or-pay contracts with the Chip Titan — a fragile middleman. Offers flexible, shorter commitments and can undercut on price, but its supply can evaporate suddenly (modeled on real "sold out, 4+ customers per tranche" scarcity at Nebius) or the Hustler itself can go under if it overextended its own leverage (a realistic shock, since neoclouds borrow against contracted backlog).

4. **The Sovereign Financier** (UAE G42/Saudi HUMAIN stand-in). Offers enormous capital and willingness to fund gigawatt-scale build-outs, but attaches political strings — the deal requires government export-license approval, can be revoked or delayed by geopolitics (modeled on the real Stargate UAE/HUMAIN dependency on U.S. bilateral chip-export approval), and buys the Sovereign Financier long-term influence over where the player's next data center gets built.

5. **The Efficiency Upstart** (DeepSeek/Qwen/Mistral stand-in) — not a compute seller but a *rival playstyle*: an opponent lab (or a path the player can choose) that competes on architecture (mixture-of-experts, sparse activation) to achieve competitive model performance at a fraction of the compute spend, which the game can model as a distinct victory condition (highest capability-per-dollar rather than highest total compute).

6. *(Optional 6th/7th actor for a richer game)* **The Power Broker** (utility/grid operator or gas-turbine supplier stand-in) — sells electricity access; grid interconnection is slow and rationed (modeled on ERCOT's 238 GW queue vs. single-digit-percent conversion), while on-site gas turbines are fast but incur a political-opposition penalty (modeled on the real $64–68B in blocked/delayed U.S. projects and the doubling of "strongly oppose" sentiment in 2025–26); and **The Regulator** (a periodic, non-tradeable actor representing export-control/tariff policy, which can flip a rival's chip source on or off, modeled on the real 2025–26 H20/H200 policy whiplash).

**What each actor offers/demands (summary table for game design):**
- Money: all actors accept it, but the Chip Titan and Hyperscaler Landlord require large multi-year minimums, not spot purchases.
- Equity/exclusivity: Chip Titan and Hyperscaler Landlord may demand a stake in the player's lab or exclusive-supplier status in exchange for priority allocation — this is the real "circular financing" mechanic and should visibly reduce the player's autonomy/valuation score.
- Political strings: Sovereign Financier and Power Broker require the player to accept siting, export-compliance, or emissions constraints; violating them can trigger a shock (loss of allocation, fine, forced shutdown of a site — modeled on the real TSMC $1B smuggling fine and the New York one-year construction freeze).
- Delays: every actor can impose a delay as a cost of a cheaper/looser deal — modeled on Stargate's real site-by-site slippage (built vs. projected GW gaps at nearly every site) and ASML's 12–18 month EUV lead times.

**Random shocks the game should include (all modeled on real 2025–26 events found above):**
- Export-control flip: a sudden tightening or loosening of chip exports to a region (modeled on the 2025 H20 halt → reversal → 2026 H200 case-by-case-with-tariff cycle), which can suddenly open or close a supply route or a customer market.
- Fab/packaging disruption: a HBM or CoWoS capacity shock (modeled on the real HBM sell-out through 2026 and the CoWoS-to-N3-wafer bottleneck shift) that raises the price or lead time of the player's next compute purchase.
- Local political revolt: a data-center site gets blocked or frozen by local opposition (modeled on the real Saline Township opposition, the Lordstown data-center ban, and New York's 2026 one-year freeze), forcing a costly relocation or delay.
- Power shortage/grid denial: an interconnection request is rejected or queued for years (modeled on ERCOT's low single-digit conversion rate), forcing a costlier on-site-gas workaround.
- Depreciation shock: an accounting/market event (modeled on the Burry depreciation dispute) that suddenly writes down the value of a player's existing GPU fleet, simulating obsolescence risk.
- Smuggling exposure: a player (or rival) caught circumventing export controls faces a fine and reputational/allocation penalty (modeled on the real Huawei/Sophgo/TSMC $1B fine).
- Circular-financing unwind: an investor-actor (Chip Titan or Hyperscaler Landlord) pulls back a promised equity investment as the player's lab approaches a liquidity event (modeled on NVIDIA's real March 2026 pullback from OpenAI/Anthropic ahead of expected IPOs), suddenly reducing available capital.

**What an infrastructure advisor character should warn about (grounded in the findings above):**
- "Don't over-commit to a single chip supplier or single site — allocation and export rules can flip in months, and a data center with only one power source (grid-only or gas-only) is exposed to a different failure mode than one with backup." (Modeled on the real oscillation in China export rules and on-site-gas-vs-grid tradeoffs.)
- "A cheap short-term GPU contract can be pre-empted by a rival's prepaid multi-year deal — locking in capacity early, even at a premium, is often safer than staying flexible." (Modeled on the real MYPA/prepayment dynamic.)
- "Equity-for-compute deals buy you capacity now but cost you independence later — and your compute partner may pull the offer once you're about to go public or no longer need the favor." (Modeled on NVIDIA's real pullback from OpenAI/Anthropic equity as IPOs approached.)
- "Local opposition can kill a project faster than any supply shortage — budget for community/political capital, not just steel and chips." (Modeled on the real $64–68B in blocked U.S. projects and the 2025–26 doubling of opposition sentiment.)
- "Depreciation assumptions are a bet, not a fact — if your fleet's useful life is shorter than you assumed, your whole financial model can retroactively look insolvent." (Modeled on the real, unresolved Burry vs. NVIDIA/hyperscaler dispute.)
- "You don't have to out-spend a rival on compute if you can out-engineer them on efficiency — but that path has its own ceiling once your rivals catch up architecturally." (Modeled on DeepSeek/Qwen's real efficiency gains, which Western labs are now also adopting.)

---

## Coverage statement

**Sources opened and read via fetch (fuller content beyond search snippets):**
- SemiAnalysis, "The Great AI Silicon Shortage" — https://newsletter.semianalysis.com/p/the-great-ai-silicon-shortage (fetched and read as rendered/summarized content; not the raw original markup, so treat as a faithful but tool-mediated read, not a manual page-by-page read)
- Epoch AI, "OpenAI Stargate: where the US sites stand" — https://epoch.ai/publications/openai-stargate-where-the-us-sites-stand (fetched and read; per-site data captured in full for all seven listed sites)

**Sources consulted only via search-engine result synthesis (snippet/aggregator level, not fetched in full) — flagged inline with ⚠️ where the underlying claim is load-bearing:**
- Bloomberg's "AI Circular Deals" interactive graphic (paywalled/interactive; only a search synthesis was available)
- IEA "Electricity 2026" and "Energy and AI" reports (only landing-page/executive-summary-level synthesis; full PDF not read)
- Multiple industry-blog/aggregator pieces (SiliconAnalysts, ClusterBid, Spheron Blog, Introl Blog, Presenc AI, tech-insider.org, Astute Group, Data Center Watch, and others cited inline above) — these were the only accessible sources for many 2026 figures (HBM capacity, CoWoS wafer counts, GPU rental price tables, capex-vs-revenue ratios) and were not cross-verified against primary company filings or earnings-call transcripts in this research pass. Treat quantitative figures from these sources as directionally reliable but not independently confirmed against SEC filings or earnings calls.
- CNBC's "Middle East war testing Gulf's AI-hub ambitions" article was seen only as a headline/snippet, not fetched — the specific disruption mechanism is unconfirmed.

**Unreachable / not investigated in this pass:**
- Primary NVIDIA, TSMC, Microsoft, and CoreWeave earnings-call transcripts or SEC filings were not directly fetched despite being suggested sources; all financial figures above trace back to secondary/aggregator summaries of such filings, not the filings themselves.
- Full Michael Cusumano/Financial Times original commentary on the NVIDIA-OpenAI "circular" deal was not fetched directly; the quote is sourced via a TechCrunch article's citation.
- DeepSeek's own technical report/paper for its claimed $5.6M/$294K training costs was not independently retrieved or verified; these numbers are widely repeated by aggregators but originate from the lab's own claims.

No claim above is presented as more certain than its source allows; where only a search-engine synthesis (rather than a full document read) was available, this is noted either inline (⚠️) or in this coverage statement.
