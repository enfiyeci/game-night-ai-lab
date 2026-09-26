# Real Compute Deal Structures Between Frontier AI Labs and Compute Suppliers (2019–September 2026)

Note on scope: this file goes deeper on deal STRUCTURE and verifies load-bearing numbers against primary/high-quality sources, per the assignment. It complements, and in places corrects or sharpens, the earlier pass at `docs/research/ai-lab-mechanics/notes/compute_race.md` (already read in full before this research began). Facts are marked pre-2025 vs 2025–2026 where the date matters for realism (deal terms shifted markedly after the 2025 compute crunch).

## What deal types exist, and what are their real terms?

### Takeaway
Frontier labs buy compute through at least seven distinct real-world deal structures — on-demand/spot cloud rental, multi-year "neocloud" take-or-pay contracts, GPU purchase-with-prepayment-for-allocation (NVIDIA MYPAs), hyperscaler cloud-credit/equity-hybrid deals (Microsoft–OpenAI, Amazon–Anthropic, Google–Anthropic), chipmaker equity/warrant-for-exclusivity deals (NVIDIA–OpenAI, AMD–OpenAI, Broadcom–OpenAI custom silicon), off-balance-sheet SPV project financing (Meta–Blue Owl, xAI), and GPU-collateralized debt (CoreWeave's DDTL facilities) — and by 2026 the largest labs use several of these simultaneously, stacked on top of each other for the same compute buildout.

### Cited Findings — On-demand / reserved / spot cloud pricing
- H100 on-demand median rental price in September 2026 was $3.25/GPU-hour, range $1.49–$6.98/hour: Vast.ai marketplace from $1.49, RunPod from $1.99, Lambda at $3.99, CoreWeave at $4.25, hyperscalers up to $6.98 — [Shattered.io / IntuitionLabs summary, carried over from prior research pass](https://shattered.io/h100-h200-b200-cloud-gpu-pricing-2026/) ⚠️ not independently re-verified in this pass; carried forward from the earlier notes file, itself only search-snippet sourced
- H100 cloud rental prices fell from $8–10/hour in 2024 to $1.80–3.50/hour by Q2 2026, driven by AWS cutting H100 on-demand pricing 44% in June 2025 — [ValueAddVC summary, carried over](https://valueaddvc.com/blog/is-the-ai-chip-shortage-over-in-2026-gpu-pricing-and-what-comes-next) ⚠️ aggregator-level source, not re-verified against AWS's own pricing page in this pass
- B200 on-demand pricing runs $2.12/hour (spot) to $4.99–$6.04/hour at specialist providers; 36-month reserved contracts as low as $2.25/hour; AWS's Blackwell instance list rate reaches roughly $14.24/GPU-hour — [Shattered.io / IntuitionLabs summary, carried over](https://intuitionlabs.ai/articles/data-center-gpu-pricing-2026) ⚠️ same caveat
- Crusoe's published pricing structure spans on-demand, spot, and multi-year reserved (discounted) tiers, typically $2–3/GPU-hour, with a self-serve calculator for multi-year commitments — [search-result synthesis](https://congmigos.com/best-gpu-neoclouds-2026-coreweave-nebius-lambda-crusoe-and-groq-ranked-by-published-pricing-and-contracted-power/)
- In the broader cloud GPU procurement market, one year is described as the "floor" commitment length worth a discount, and 2–3 year reserved terms typically require roughly 20% of total contract value as upfront prepayment — [search synthesis, Spheron/ClusterBid-family](https://www.spheron.network/blog/gpu-cluster-reservation-contract-negotiation-2026/) ⚠️ aggregator-level, generic guidance rather than a single documented contract

### Cited Findings — NVIDIA GPU purchase deals: prepayment and allocation priority
- NVIDIA's stated public allocation policy is "first-come, first-served," not highest-bidder, per CEO Jensen Huang in an April 2026 interview — [Digitimes](https://www.digitimes.com/news/a20260428PD221/nvidia-jensen-huang-gpu-demand-2026.html)
- In practice, "Multi-Year Purchase Agreements" (MYPAs) with NVIDIA guarantee allocation 15–25% above standard tier quotas in exchange for 2–3 year volume commitments plus 10–15% upfront prepayments; CoreWeave, Lambda, and Crusoe have collectively committed over $18 billion in MYPAs with NVIDIA through 2028 — [search synthesis, ClusterBid/Spheron-family](https://www.spheron.network/blog/gpu-shortage-2026/) ⚠️ this MYPA structural description (the 15–25%/10–15% figures specifically) traces only to industry-blog aggregators in every search pass run in this research effort (both the original and this deeper pass); no primary NVIDIA contract or 10-K/10-Q language describing "MYPA" terms by that name was located or fetched. Treat the specific percentages as unconfirmed against a primary source.
- NVIDIA's "use it or lose it" allocation policy is reported to inflate short-term GPU demand by an estimated 8–12% above efficient-market levels, as customers over-order to protect future quotas — [same synthesis] ⚠️ same sourcing caveat as above
- For investment-grade customers making large data-center purchases, NVIDIA has provided extended payment terms ranging from 90 days up to one year — [search-result synthesis of NVIDIA 10-K/10-Q-adjacent reporting](https://introl.com/blog/gpu-procurement-strategies-leasing-buying-reserved-capacity-2025) ⚠️ not verified against the primary NVIDIA 10-K text directly in this pass (NVIDIA's own 10-K/10-Q filings appeared in search results but were not fetched and read)
- Separately, NVIDIA reportedly began demanding full upfront payment for H200 GPU orders specifically from China-based customers, amid uncertainty over Beijing's stance on the chips — [Tom's Hardware, via search synthesis](https://www.tomshardware.com/pc-components/gpus/nvidia-to-demand-full-upfront-payment-for-h200-gpus-from-china-customers-report-claims-more-than-two-million-chips-may-have-been-ordered-despite-uncertain-beijing-stance) ⚠️ snippet-level only, not fetched in full

### Cited Findings — Multi-year neocloud take-or-pay contracts
- The neocloud model: customers commit to fixed GPU capacity at fixed rates for 2–5 years and pay regardless of usage ("take-or-pay"); neoclouds then borrow against these contracted revenue streams to finance GPU buildout — [Solvimon Blog, carried over from prior pass](https://www.solvimon.com/blog/neoclouds-owe-customers-years-of-compute) ⚠️ industry-blog level, not a specific contract
- CoreWeave draws 96% of revenue from long-term take-or-pay contracts; contracted backlog reached $99.4 billion as of March 31, 2026, up from $66.8 billion at year-end 2025; Q1 2026 revenue was $2.078 billion, +112% YoY — [MarkTechPost/Luminix summary, carried over](https://www.marktechpost.com/2026/08/23/best-gpu-neoclouds-2026/) ⚠️ this is an aggregator's restatement of figures that ultimately originate in CoreWeave's own quarterly filings/earnings releases; those filings were not directly fetched in this pass despite being a suggested primary source (see Gaps and Coverage statement)
- Nebius signed a $17.4–19.4 billion, five-year contract with Microsoft (through 2031); this is confirmed via multiple independent outlets including Bloomberg — see the dedicated Microsoft–Nebius section below for full structural detail (fetched from search synthesis, not the underlying SEC/press filing directly)
- Lambda has a multibillion-dollar, multi-year agreement with Microsoft covering tens of thousands of NVIDIA GPUs including GB300 NVL72 systems; Lambda closed a Series E of more than $1.5 billion led by TWG Global in November 2025 and a $1 billion senior secured credit facility in May 2026 — [search synthesis](https://www.useluminix.com/reports/industry-analysis/deep-dive-on-the-neocloud-gpu-rental-industry-coreweave-lambda-crusoe) ⚠️ aggregator-level; exact Lambda–Microsoft dollar figure and GPU count were not found in this pass — flagged as a Gap below
- Crusoe differentiates through vertical integration of power generation (on-site gas, "Spark" modular deployments), claiming 30–50% lower energy costs versus traditional providers — [search synthesis](https://congmigos.com/best-gpu-neoclouds-2026-coreweave-nebius-lambda-crusoe-and-groq-ranked-by-published-pricing-and-contracted-power/) ⚠️ same caveat

### Cited Findings — Chip-maker equity/warrant-for-exclusivity deals
See the dedicated NVIDIA–OpenAI and AMD–OpenAI sections below for full detail on the two best-documented examples of this deal type (both fetched from primary/quasi-primary sources in this pass).

### Cited Findings — Off-balance-sheet SPV project financing
See the dedicated Meta–Blue Owl (Hyperion) and xAI financing sections below.

### Cited Findings — GPU-collateralized debt
See the dedicated CoreWeave debt-facility section below.

### Inferences
- The same lab increasingly stacks multiple deal types onto the same GW of capacity: e.g., OpenAI simultaneously has (a) a hyperscaler credit/equity relationship with Microsoft, (b) neocloud take-or-pay contracts with CoreWeave, (c) a huge direct cloud-services contract with Oracle, (d) chipmaker equity/warrant deals with NVIDIA and AMD, and (e) a custom-silicon co-development deal with Broadcom — all for compute that ultimately serves the same training/inference workload. A game should let the player combine deal types rather than choosing one "supplier type" exclusively.
- The "prepayment buys allocation priority" mechanic is real and structurally identical across GPU purchase agreements (NVIDIA MYPAs), cloud contracts (Nebius's ~$6.96B of aggregate upfront payments on its Microsoft deal — see below), and construction financing (Meta's Blue Owl SPV, xAI's lease-to-own SPV) — prepayment/upfront capital is the single most consistent lever for jumping the compute queue across every deal type examined.
- Several of the highest-profile numbers used in general reporting (NVIDIA's "up to $100B" OpenAI investment, the specific NVIDIA MYPA percentage terms) are letters of intent or unconfirmed-by-primary-source figures, not signed, binding, itemized contracts — a game modeling "headline number vs. actual executed number" as two different values would be realistic (see the NVIDIA–OpenAI section: the LOI was $100B, but the investment actually finalized as part of OpenAI's ~$110B round was reported at $30B).

### Gaps
- Exact primary-source language for NVIDIA's MYPA program (the 15–25% allocation bonus / 10–15% prepayment figures) was not locatable in a primary NVIDIA filing, contract, or press release in either this pass or the prior one; every source is an industry blog/aggregator repeating the same figures. Treat as directionally plausible but unconfirmed.
- Lambda's exact Microsoft contract dollar value and GPU count were not found.
- CoreWeave's, Oracle's, and NVIDIA's own SEC filings (10-Q, 8-K, S-1) were identified via search but not directly fetched and read end-to-end in this pass, except for the specific AMD warrant exhibit (see below). All CoreWeave/Oracle financial figures above trace to secondary reporting of those filings, not the filings themselves — see the Coverage statement for the full list of what was and wasn't fetched.

---

## Microsoft–OpenAI: the compute-for-equity relationship, 2019–2025, and the 2025 restructuring

### Takeaway
Microsoft's relationship with OpenAI evolved from a 2019 cash-and-compute investment with IP licensing and (from 2023) a formal "right of first refusal" on OpenAI's cloud compute, into a fully restructured 2025 deal in which Microsoft holds roughly 27% of the now-for-profit OpenAI (valued at ~$135 billion) and OpenAI commits to buy an incremental $250 billion of Azure services — but Microsoft explicitly gave up its right of first refusal as part of that restructuring, meaning OpenAI can now buy compute from anyone.

### Cited Findings
- (Pre-2025 context, carried from general knowledge/earlier reporting, not re-verified with a primary 2019/2023 filing in this pass) Microsoft's original 2019 and expanded 2023 investments in OpenAI reportedly totaled on the order of $1 billion (2019) growing to a cumulative ~$13 billion by January 2023, paired with exclusive Azure cloud provider status and a right of first refusal on OpenAI's compute needs. ⚠️ This specific historical figure was not independently re-verified against a primary Microsoft source in this research pass; it is carried forward as widely-reported background rather than freshly confirmed.
- On 2025-10-28, OpenAI completed its for-profit restructuring; Microsoft's stake is "valued at approximately $135 billion, representing roughly 27 percent on an as-converted diluted basis" — down from the roughly 32.5% Microsoft held before OpenAI's most recent funding rounds diluted it — [Microsoft's own blog post, fetched and read directly](https://blogs.microsoft.com/blog/2025/10/28/the-next-chapter-of-the-microsoft-openai-partnership/)
- OpenAI agreed to "purchase an incremental $250 billion of Azure services" as part of the restructuring — [same primary source, Microsoft blog](https://blogs.microsoft.com/blog/2025/10/28/the-next-chapter-of-the-microsoft-openai-partnership/)
- In exchange, Microsoft gave up its right of first refusal to be OpenAI's exclusive cloud compute provider — [same primary source]
- Microsoft's IP protections over OpenAI's models and technology now extend "through 2032," and now include post-AGI models "with appropriate safety guardrails"; research IP protections specifically remain in force "until either the expert panel verifies AGI or through 2030, whichever is first" — [same primary source]
- Once OpenAI declares AGI has been reached, that declaration must now be verified by an independent expert panel (previously it was reportedly OpenAI's own board's determination) — [same primary source]
- Despite losing the cloud right of first refusal, Microsoft retains exclusive rights to OpenAI's API products on Azure — OpenAI may jointly develop some products with third parties, but API products remain Azure-exclusive — [same primary source]
- OpenAI gained new latitude under the restructured deal: it can release open-weight models meeting certain capability criteria, and can provide API access to U.S. government national-security customers regardless of cloud provider — [same primary source]
- The pre-existing Microsoft–OpenAI revenue-sharing arrangement (Microsoft receiving a share of OpenAI revenue) persists until AGI is verified, on an elongated payment timeline — [same primary source] — the exact revenue-share percentage was not disclosed in the blog post and was not found elsewhere in this pass

### Inferences
- The 2025 restructuring is best modeled in a game as a renegotiation event that trades exclusivity (which favors the incumbent supplier) for scale-of-spend commitment (which favors the buyer's flexibility) — Microsoft lost its guaranteed-first-look position but locked in $250B of guaranteed future revenue, a real "give up control, gain certainty" trade a supplier-actor in a game could face.
- The "verified by an independent expert panel" AGI clause is a good example of a real contractual mechanism a game could model as a victory-condition trigger with a built-in dispute/verification step, rather than a self-declared win state.

### Gaps
- The exact 2019/2023 dollar figures and original right-of-first-refusal contract language were not verified against a primary Microsoft or OpenAI source in this pass (only carried forward as general background).
- The specific Microsoft revenue-share percentage from OpenAI was not found in either pass.

---

## NVIDIA–OpenAI: the $100B LOI, and what actually got signed

### Takeaway
NVIDIA and OpenAI announced a non-binding letter of intent in September 2025 for NVIDIA to invest up to $100 billion in OpenAI progressively as OpenAI deploys 10 gigawatts of NVIDIA systems (starting with Vera Rubin-platform hardware in H2 2026) — but by March 2026, NVIDIA's actual finalized investment as part of OpenAI's ~$110 billion funding round was reported at only $30 billion, well short of the headline $100 billion figure, and NVIDIA's CEO signaled this would likely be NVIDIA's last major equity check into OpenAI given OpenAI's expected IPO.

### Cited Findings
- The deal was announced as a non-binding letter of intent (LOI), not a signed, binding agreement, with the press release stating details would be "finalized in coming weeks" — [NVIDIA's own newsroom post, fetched and read directly](https://nvidianews.nvidia.com/news/openai-and-nvidia-announce-strategic-partnership-to-deploy-10gw-of-nvidia-systems)
- NVIDIA "intends to invest up to $100 billion in OpenAI progressively as each gigawatt is deployed" — [same primary source]
- The partnership covers "at least 10 gigawatts of NVIDIA systems," representing millions of GPUs — [same primary source]
- The first gigawatt is targeted for deployment in the second half of 2026, on the NVIDIA Vera Rubin platform — [same primary source]
- NVIDIA's own press release contains no mention of equity percentage, warrant structure, or specific capitalization terms — the "$100B investment" language is high-level only in the primary source — [same primary source, confirmed by direct read]
- The actual NVIDIA investment finalized as part of OpenAI's ~$110 billion funding round came in at $30 billion — well short of the original $100 billion pledge — [TechCrunch, via search synthesis, carried over from prior pass](https://techcrunch.com/2026/03/04/jensen-huang-says-nvidia-is-pulling-back-from-openai-and-anthropic-but-his-explanation-raises-more-questions-than-it-answers/) ⚠️ not independently re-verified against a primary NVIDIA filing in this pass; carried from the earlier notes file, itself sourced to a TechCrunch summary of a Financial Times report
- MIT Sloan's Michael Cusumano characterized the arrangement as "kind of a wash": NVIDIA investing $100 billion in OpenAI stock while OpenAI commits to buy roughly the same amount of NVIDIA chips — [Financial Times, via TechCrunch summary, carried over]
- On 2026-03-04, NVIDIA CEO Jensen Huang said both the OpenAI and Anthropic investments were likely NVIDIA's last major equity checks into either company, as both labs are expected to go public later in 2026 and the private-investment window closes once that happens — [TechCrunch, carried over]

### Inferences
- This is the clearest real-world example of "headline commitment ≠ actual executed dollar figure" — a $100B LOI became a $30B actual investment within six months. A game mechanic where a "deal announcement" and a "deal execution" are separate events, with the executed value potentially far below the announced value, is directly grounded in this case.
- The circular structure (chipmaker invests in lab, lab spends on chipmaker's product) draws explicit "wash" commentary from an MIT business-school source — this is a legitimately controversial, not merely cynical, characterization, and can be modeled as a mechanic where equity-for-compute deals show a "true net value" that's lower than face value.

### Gaps
- Whether and how the $100B LOI was formally amended, cancelled, or superseded by the $30B figure (i.e., the exact legal relationship between the LOI and the later $30B investment) was not found in either research pass.

---

## AMD–OpenAI: the 6 GW deal and the 160-million-share warrant (verified from AMD's own SEC exhibit)

### Takeaway
AMD issued OpenAI a warrant to purchase up to 160 million shares of AMD common stock at $0.01/share — worth roughly 10% of AMD if fully exercised — as "a material inducement" for OpenAI's commitment to deploy AMD Instinct GPUs at scale (starting with 1 GW of MI450-series chips, scaling to 6 GW); the warrant expires October 5, 2030, but the specific vesting milestones and share-price triggers are redacted in the public SEC exhibit.

### Cited Findings
- The warrant document itself — SEC Exhibit 4.1, filed with AMD's 8-K on October 6, 2025 — was fetched and read directly. It confirms: OpenAI OpCo, LLC may purchase up to 160,000,000 shares of AMD common stock at an exercise price of $0.01 per share — [AMD 8-K Exhibit 4.1, primary source, fetched and read directly](https://ir.amd.com/financial-information/sec-filings/content/0001193125-25-230895/d28189dex41.htm)
- The warrant expires October 5, 2030 (five years from issuance) — [same primary source]
- The document explicitly states the warrant is issued as "a material inducement" for OpenAI entering the underlying product/GPU supply agreement — [same primary source]
- **Critical sourcing note**: the actual vesting schedule and exercise conditions are contained in Exhibits E and F of the warrant agreement, which are REDACTED (shown as "[****]" placeholders) in the publicly filed version fetched in this pass. The specific gigawatt-deployment milestones are therefore not independently confirmed from the primary filing — they are known only from AMD's and OpenAI's press statements (secondary to the legal text) — [same primary source, confirming the redaction directly] ⚠️ This is a case where reading "the whole document" still leaves a load-bearing gap, because the company itself redacted the material terms from the public filing — flagged explicitly per the sourcing rule.
- Per AMD's and OpenAI's press statements (not the redacted legal exhibit): the warrant vests in tranches tied to purchases of AMD Instinct GPU products, with the first tranche vesting after delivery of the initial 1 GW of AMD Instinct MI450-series GPUs, and full vesting for all 160 million shares contingent on OpenAI reaching 6 GW of cumulative AMD Instinct GPU purchases; vesting is also gated on AMD achieving certain share-price targets — [CNBC and other press-summary sources, via search synthesis](https://www.cnbc.com/2025/10/06/openai-amd-chip-deal-ai.html) ⚠️ these milestone details come from press reporting/company statements about the deal, not from the redacted legal exhibit itself
- If OpenAI exercises the full warrant, it could acquire approximately 10% ownership of AMD based on shares outstanding at announcement — [search synthesis, consistent across multiple outlets]
- Other structural features confirmed directly from the primary exhibit: automatic cashless exercise at expiration if not previously exercised; standard anti-dilution adjustment provisions for stock splits/dividends/reorganizations; transfer restrictions to a redacted list of "Restricted Persons" (Exhibit D, also redacted); warrant shares become freely tradeable under Rule 144 after a one-year holding period — [AMD 8-K Exhibit 4.1, primary source]
- The AMD deal is separately reported to target "tens of billions" in AI revenue for AMD from the relationship (not independently verified with a specific dollar figure in this pass)

### Inferences
- This is a rare case where the primary legal document is directly accessible but still deliberately incomplete — a realistic detail for a game: real compute deals often have their most consequential terms (the actual vesting triggers) kept confidential even in an SEC filing, with only the "headline" terms (share count, price, expiration) made public. A game could model "hidden clauses" that are only revealed as milestones are hit.
- The AMD deal and the NVIDIA deal are structurally similar (chipmaker warrant/equity tied to gigawatt-deployment milestones) but AMD's is more precisely documented in public two ways: the exact share count and strike price are known (NVIDIA's investment structure was never itemized this precisely in its own press release).

### Gaps
- The exact vesting percentages per gigawatt tranche, and the specific AMD share-price targets required for vesting, remain undisclosed in the public record as accessed in this pass.

---

## Broadcom–OpenAI: custom "Jalapeño" chips, 10 GW

### Takeaway
OpenAI and Broadcom announced a strategic collaboration in October 2025 to co-develop and deploy 10 GW of OpenAI-designed custom AI accelerators (branded "Jalapeño") plus Broadcom Ethernet networking, with deployment starting in H2 2026 and running through 2029; unlike the NVIDIA and AMD deals, this is a chip co-design/manufacturing deal, not an equity/warrant deal — financial terms were not disclosed by the companies, though Broadcom's CEO separately confirmed a fourth major AI-chip customer (widely reported as OpenAI) had committed to $10 billion in orders.

### Cited Findings
- OpenAI designs the accelerators and systems; Broadcom co-develops and deploys them, including AI accelerators and Ethernet networking solutions — [OpenAI's own announcement / Broadcom investor release, via search synthesis](https://openai.com/index/openai-and-broadcom-announce-strategic-collaboration/)
- Deployment is targeted to start in the second half of 2026, with full rollout of the 10 GW of capacity by end of 2029 — [same synthesis]
- Financial terms were not disclosed by the companies; the Wall Street Journal reported the deal is worth "multiple billions of dollars" — [search synthesis, WSJ referenced secondhand] ⚠️ WSJ article not fetched directly
- Separately, in early September 2025 (before the formal announcement), Broadcom CEO Hock Tan told analysts the company had secured a fourth AI-chip customer that had committed to $10 billion in orders — widely reported in the press as referring to OpenAI, though Broadcom did not name the customer in that specific earnings-call statement — [TechCrunch, carried over from prior pass](https://techcrunch.com/2026/06/24/openai-unveils-its-first-custom-chip-built-by-broadcom/)
- This custom-chip relationship is a hedge against NVIDIA/AMD allocation risk: reporting frames the move as reducing OpenAI's dependence on NVIDIA's margins and on being caught in a shared allocation queue with every other lab wanting the same Blackwell-class GPUs at once — [SDxCentral/TechCrunch summary, carried over](https://www.sdxcentral.com/analysis/openais-broadcom-deal-signals-the-end-of-nvidias-ai-chip-monopoly/)

### Inferences
- Broadcom is structurally different from NVIDIA/AMD in this catalogue: it does not sell OpenAI a finished chip product, it co-designs OpenAI's own custom chip and manufactures/deploys it — this is a "build your own supplier relationship" deal type distinct from "buy from an existing chipmaker," useful as a distinct game mechanic (a "custom silicon" tech-tree branch that trades years of lead time for eventual independence from the GPU allocation queue).

### Gaps
- No itemized total dollar value for the Broadcom–OpenAI deal was found in either research pass; only the secondhand "$10 billion in orders" and "multiple billions" descriptions exist.

---

## Oracle–OpenAI: the ~$300 billion Stargate cloud contract, and its Abilene expansion cancellation

### Takeaway
Oracle's cloud-infrastructure contract with OpenAI is reported at roughly $300 billion (a figure embedded in Oracle's rapidly growing "remaining performance obligations" — RPO — which reached $664 billion by August 2026), but the relationship also produced the clearest documented cancellation in this catalogue: in March 2026, Oracle and OpenAI scrapped a planned 600 MW expansion of their flagship Abilene, Texas Stargate site (from 1.2 GW toward ~2.0 GW) after a financing dispute and what reporting describes as OpenAI's "often-changing demand forecasting," even as the existing 1.2 GW Abilene campus continued operating unaffected and the broader ~4.5 GW Stargate agreement stayed on track.

### Cited Findings
- Oracle's total remaining performance obligations (RPO) reached $664 billion as of August 31, 2026, of which ~13% is expected to be recognized as revenue in the next 12 months, 37% in months 13–36, 34% in months 37–60, and the remainder thereafter — [Oracle 10-Q for the quarter ended August 31, 2026, identified via SEC EDGAR search but the RPO percentage breakdown itself was captured via a search-result synthesis of the filing's contents, not by directly fetching and reading the filing text in this pass](https://www.sec.gov/Archives/edgar/data/0001341439/000119312526389274/orcl-20260831.htm) ⚠️ the 10-Q itself was located on SEC EDGAR but not fetched and read directly in this pass — the RPO figures above come from a search-engine synthesis describing the filing's contents, not from opening the document
- Oracle's RPO grew from $455 billion (Q1 FY2026) to $523 billion (Q3 FY2026), a reported 438% year-over-year increase, attributed to new long-term contracts including OpenAI's — [search synthesis of Oracle earnings reporting, not the primary filing itself] ⚠️ same caveat
- The ~$300 billion OpenAI–Oracle contract was reported as being "activated" as of April 2026 — [IntuitionLabs summary, via search synthesis](https://intuitionlabs.ai/articles/oracle-openai-300b-deal-analysis) ⚠️ aggregator-level source, not a primary Oracle/OpenAI disclosure of the $300B figure itself
- In March 2026, Oracle and OpenAI abandoned plans to expand the Abilene, TX Stargate campus from 1.2 GW to approximately 2.0 GW (a 600 MW expansion) after negotiations collapsed over financing terms and what reporting describes as OpenAI's "often-changing demand forecasting" — [Bloomberg, via Tom's Hardware and DataCenterDynamics summaries](https://www.bloomberg.com/news/articles/2026-03-06/oracle-and-openai-end-plans-to-expand-flagship-data-center) ⚠️ Bloomberg's own article was not fetched directly; summary sourced via Tom's Hardware/DCD's reporting on it
- The existing 1.2 GW, eight-building, 1,000-acre Abilene campus was unaffected and continued operating; only the incremental 600 MW expansion was cancelled — [Tom's Hardware, via search synthesis](https://www.tomshardware.com/tech-industry/oracle-and-openai-scrap-planned-600mw-abilene-expansion)
- NVIDIA provided Crusoe (the site's builder/operator) a $150 million deposit and reportedly helped attempt to attract Meta as a replacement tenant for the freed-up capacity — [DataCenterDynamics, via search synthesis](https://www.datacenterdynamics.com/en/news/oracleopenai-drop-plans-to-expand-flagship-abilene-stargate-site-meta-in-talks-to-pick-up-crusoe-capacity-with-nvidias-help/)
- The broader ~4.5 GW Stargate agreement (beyond the cancelled 600 MW increment) was reported to remain on track despite the Abilene expansion cancellation — [Tom's Hardware, via search synthesis]

### Inferences
- This is the single clearest documented real-world "deal renegotiation/partial cancellation" event in the whole catalogue, and it happened at the flagship site of the largest publicly announced AI infrastructure initiative — strong evidence that even headline mega-deals experience partial walk-backs over financing terms and shifting demand forecasts, not just smaller/riskier deals. A game's "renegotiation" or "scope-cut" event should be able to hit even a player's best/flagship site, not just marginal ones.
- Oracle's RPO figure ($664B) vastly exceeds its current revenue base, mirroring the CoreWeave pattern (96% of revenue from long-term contracts) — RPO-heavy revenue models are now the norm among compute suppliers to frontier labs, which is a distinct financial-health indicator a game could track for supplier NPCs (visible backlog vs. actual delivered/recognized revenue, with a lag).

### Gaps
- The exact contractual structure of the $300B Oracle–OpenAI agreement (term length, prepayment %, penalty clauses) was not found in either research pass — only the aggregate RPO-linked figure. The 10-Q's more granular contract-level disclosure, if any, was not read directly.

---

## Amazon–Anthropic: $8B total investment, Project Rainier on Trainium

### Takeaway
Amazon has invested a cumulative $8 billion in Anthropic since the start of 2024 (in $4B tranches, per AWS's own past announcements), paired with Project Rainier — a dedicated AWS data-center campus for Anthropic built on nearly 500,000 (en route to over 1 million) custom Trainium2 chips, which Amazon describes as the largest known non-NVIDIA compute deployment in the world; this is a co-design relationship, not just a capacity lease — Anthropic gave direct technical input into the Trainium2 chip design.

### Cited Findings
- Amazon has invested $8 billion in Anthropic since the start of 2024 — [AWS/Amazon-adjacent reporting, via search synthesis](https://www.aboutamazon.com/news/company-news/amazon-invests-additional-5-billion-anthropic-ai) — Amazon's own press release title references a "$5 billion... up to $20 billion more" structure, suggesting a staged commitment ceiling beyond the $8B already deployed ⚠️ the exact relationship between the "$8B invested" figure and the "$5B + up to $20B more" headline was not fully reconciled in this pass — flagged as an inconsistency between sources rather than silently resolved
- Project Rainier is an AWS data-center campus in Indiana, opened at a reported cost of roughly $11 billion — [CNBC, via search synthesis](https://www.cnbc.com/2025/10/29/amazon-opens-11-billion-ai-data-center-project-rainier-in-indiana.html)
- Project Rainier represents a 70% increase in AWS's total AI computing infrastructure compared to previous deployments, and provides Anthropic more than five times the compute power used to train its earlier models — [Amazon's own "About Amazon" release, via search synthesis](https://www.aboutamazon.com/news/company-news/amazon-invests-additional-5-billion-anthropic-ai)
- The campus currently hosts seven buildings containing nearly 500,000 AWS Trainium2 chips, with that number expected to exceed 1 million chips by end of year (2026, per the article's publication context) — [Data Centre Magazine / DataCenterDynamics, via search synthesis](https://datacentremagazine.com/news/aws-how-500-000-trainium2-chips-power-project-rainier)
- Trainium2 was co-designed by AWS's Annapurna Labs custom-silicon division with direct input from Anthropic on infrastructure design, aimed at speeding training, cutting latency, and improving energy efficiency — [Anthropic's own announcement, via search synthesis](https://www.anthropic.com/news/anthropic-amazon-trainium)
- Amazon describes Project Rainier as the largest known deployment of non-NVIDIA compute anywhere in the world — [same source]

### Inferences
- This deal type (hyperscaler co-designs custom silicon specifically informed by one anchor lab customer's workload characteristics, in exchange for equity/investment) is structurally distinct from a pure cloud-capacity lease — the lab gets hardware tuned to its own models, and the hyperscaler gets a flagship reference deployment to prove out its custom chip to other future customers. A game could model this as a "co-design" option that costs more lab engineering time upfront but yields better price/performance later, versus buying off-the-shelf NVIDIA capacity.

### Gaps
- The precise cadence and dollar amounts of each Amazon-to-Anthropic investment tranche (versus the aggregate $8B figure) were not fully reconciled from the sources found in this pass.

---

## Google–Anthropic: TPUs, and the deal's rapid escalation across 2025–2026

### Takeaway
Google's compute relationship with Anthropic escalated dramatically within about seven months: an October 2025 deal for up to 1 million TPUs worth "tens of billions of dollars" (bringing "well over a gigawatt" online in 2026) was followed by an April 2026 expansion adding up to 5 GW of next-generation TPU capacity from 2027, and by May 2026 the cumulative compute commitment on the Anthropic side was reported at $200 billion over five years — alongside a separate up-to-$40 billion direct Google equity investment in Anthropic announced in April 2026.

### Cited Findings
- Anthropic's original TPU deal with Google Cloud (announced 2025-10-23) gives access to up to 1 million TPUs, described as worth "tens of billions of dollars," expected to bring "well over a gigawatt" of compute online in 2026 — [CNBC, carried over from prior pass, itself a fetched/read primary-adjacent report](https://www.cnbc.com/2025/10/23/anthropic-google-cloud-deal-tpu.html)
- Industry cost estimates cited alongside this deal put the cost of building 1 GW of data-center capacity at around $50 billion, with roughly $35 billion of that typically allocated to chips — [search synthesis, cross-referenced against the separate cost-per-GW findings below](https://www.cnbc.com/2025/10/23/anthropic-google-cloud-deal-tpu.html) ⚠️ this specific $50B/$35B split appears in a CNBC-adjacent summary; treat as an industry rule-of-thumb rather than a deal-specific disclosed figure
- In April 2026, Anthropic expanded its Google/Broadcom compute commitment with an additional multi-gigawatt deal for up to 5 GW of next-generation TPU capacity starting in 2027 — [TechCrunch, carried over from prior pass](https://techcrunch.com/2026/04/07/anthropic-compute-deal-google-broadcom-tpus/)
- By 2026-05-05, the compute side of the Anthropic–Google relationship totaled $200 billion over five years, beginning the following year — [Let's Data Science, via search synthesis](https://letsdatascience.com/blog/anthropic-200-billion-google-cloud-five-year-commitment-may-5) ⚠️ aggregator-level source; the headline framing ("Anthropic just promised Google $200 billion, five times what Google is paying Anthropic") was not cross-checked against a primary Google/Anthropic statement in this pass
- Separately, Google agreed to invest up to $40 billion in Anthropic in cash and compute (announced 2026-04-24) — the largest single financial commitment to an AI startup outside Microsoft–OpenAI — [TechCrunch, carried over from prior pass](https://techcrunch.com/2026/04/24/google-to-invest-up-to-40b-in-anthropic/)

### Inferences
- The Google–Anthropic relationship shows the fastest escalation curve in the whole catalogue: from "tens of billions" to a $200B five-year compute commitment plus a separate $40B equity investment within about seven months (October 2025 to May 2026). A game modeling "deal size can rapidly balloon as a lab's model capability/revenue grows" would be grounded in this specific case more than any other in this research.
- The compute commitment ($200B) and the equity investment ($40B) are reported as two distinct, separately-announced transactions rather than one bundled deal — useful precedent for a game to model "buy compute" and "take investment" as separable actions with separate negotiated terms, even between the same two counterparties.

### Gaps
- The exact structure of the $200B, five-year figure (is it a binding take-or-pay commitment, a ceiling, or a projection?) was not clarified beyond the "Anthropic just promised Google" framing in one secondary source.

---

## Meta's compute sourcing: Google Cloud $10B deal, and the Hyperion/Blue Owl SPV

### Takeaway
Meta buys compute two structurally different ways: a conventional six-year, $10B+ cloud-services contract with Google Cloud (announced August 2025, covering servers/storage/networking), and — for its own flagship Hyperion data center in Louisiana — a $27 billion off-balance-sheet special-purpose-vehicle (SPV) joint venture with Blue Owl Capital, described as the largest private-credit transaction ever executed, which lets Meta build a 2+ GW campus without adding the debt to its own balance sheet.

### Cited Findings — Google Cloud deal
- Google won a six-year, $10 billion+ cloud contract from Meta (announced August 21, 2025), Meta's first cloud-services arrangement with Google — [CNBC, via search synthesis](https://www.cnbc.com/2025/08/21/google-scores-six-year-meta-cloud-deal-worth-over-10-billion.html)
- The agreement covers servers, storage, networking, and other services, aimed at AI infrastructure — [same synthesis]
- Meta separately guided to $66–72 billion of 2025 capex, with total 2025 expenses projected at $114–118 billion, and warned AI-driven costs would rise further into 2026 — [same synthesis, likely sourced to a Meta earnings call, not independently re-verified against the primary transcript in this pass] ⚠️

### Cited Findings — Hyperion / Blue Owl SPV
- Meta formed a $27 billion joint-venture agreement with Blue Owl Capital to fund and develop the Hyperion data center in Richland Parish, Louisiana — described as the largest private-credit transaction ever executed — [CNBC / Bisnow, via search synthesis](https://www.cnbc.com/2025/10/21/meta-blue-owl-capital-partner-on-27-billion-ai-data-center-project-.html)
- Structure: Blue Owl owns 80% of the joint venture; Meta retains 20% and handles construction/property management. The financing package comprises $27 billion in debt and $2.5 billion in equity, arranged by Morgan Stanley through an SPV — a structure increasingly used by hyperscalers specifically to keep large project debt off their own balance sheets — [Bisnow, via search synthesis](https://www.bisnow.com/national/news/data-center-capital-markets/meta-pushes-its-largest-data-center-project-off-its-books-with-27b-joint-venture-131490)
- Hyperion is projected to deliver more than 2 GW of compute capacity, spans roughly 4 million square feet, and is scheduled to go live by 2030 — [same synthesis]
- PIMCO is the anchor lender; the debt matures in 2049, is fully amortizing, and is rated A+ by S&P — [Private Equity Insights, via search synthesis](https://pe-insights.com/blue-owl-and-meta-close-record-30bn-financing-for-ai-data-centre-expansion-in-louisiana/)
- Blue Owl contributed roughly $7 billion in cash to the joint venture, with Meta receiving a one-time payout of about $3 billion from the transaction — [same synthesis]
- Separately, Meta's Hyperion (Louisiana) project — announced June 2025, before the Blue Owl SPV structure was finalized — was originally described as scaling up to 5 GW over several years, with a first phase (~2 GW) targeted for completion by 2030, and Meta has used tents on-site to keep pace with expansion per Zuckerberg — [Tom's Hardware, carried over from prior pass](https://www.tomshardware.com/tech-industry/artificial-intelligence/meta-plans-multi-gw-data-center-thats-nearly-the-size-of-manhattan-zuckerberg-promises-enormous-ai-splash-as-company-uses-tents-to-try-and-keep-up-with-rate-of-expansion)

### Inferences
- The Blue Owl SPV structure is the clearest documented example of "off-balance-sheet financing" as a distinct deal type in this whole catalogue, with concrete, well-sourced numbers (debt/equity split, ownership split, lender identity, maturity, rating) — this is a strong template for a game mechanic where a player can trade partial ownership/control of a data-center site to a financial-partner actor in exchange for that partner bearing the debt risk, at the cost of an ownership stake and a large one-time or ongoing return to the financier.
- Meta's pattern (build the biggest site via SPV, but buy everyday cloud capacity via a conventional multi-year contract) shows that even a company with Meta's own balance-sheet strength prefers to structurally separate "flagship megaproject risk" from "routine capacity" — useful for a game to model as two different mechanics with different risk/control tradeoffs, not a single generic "buy compute" action.

### Gaps
- Confirmation of whether the $10B Google Cloud deal is take-or-pay, reserved-capacity, or another structure was not found — the sources describe scope and value but not payment/commitment mechanics.

---

## xAI: GPU-backed debt, SPV lease-to-own structure

### Takeaway
xAI is financing its Colossus 2 Memphis buildout partly through a reported $20 billion "lease-to-own" SPV structure — roughly $7.5 billion equity and $12.5 billion debt — in which the SPV itself owns the NVIDIA GPUs and leases them to xAI over five years, with NVIDIA itself contributing up to $2 billion of the equity tranche alongside Apollo Global Management and Diameter Capital Partners; the debt is directly secured by the GPUs themselves.

### Cited Findings
- xAI is negotiating a roughly $20 billion lease-to-own financing arrangement to acquire NVIDIA GPUs via an SPV, split into approximately $7.5 billion equity and $12.5 billion debt — [Bloomberg / DataCenterDynamics / Tom's Hardware, via search synthesis](https://www.datacenterdynamics.com/en/news/xai-seeks-12bn-in-debt-to-fund-colossus-2-data-center-with-first-chips-online-in-a-few-weeks/)
- The SPV owns and leases the GPUs to xAI over a five-year period; this keeps the debt off xAI's own corporate balance sheet while still giving xAI priority access to the hardware — [same synthesis]
- NVIDIA itself is reported to be investing up to $2 billion into the equity portion of the SPV, alongside Apollo Global Management and Diameter Capital Partners as other equity backers — [same synthesis]
- The debt financing is directly secured by the NVIDIA GPUs themselves — a structure described as "increasingly common among venture-backed AI companies building large-scale infrastructure" — [same synthesis]
- As of July 2026 (per the source's own dateline), the first batch of 550,000 GB200 and GB300 chips at Colossus 2 was reported to be "going online in a few weeks," for training workloads — [same synthesis]

### Inferences
- xAI's structure is the most explicit "GPU-as-collateral, chipmaker-as-equity-investor-in-its-own-customer's-financing-vehicle" example in the catalogue — NVIDIA is simultaneously the GPU seller, an equity investor in the SPV that owns those same GPUs, and (per the general circular-financing pattern) benefits from xAI's continued chip purchases. A game could model a "GPU-backed leasing" financing option distinct from outright purchase or cloud rental — faster access to hardware, but the lender/lessor can repossess the collateral if the lab defaults, and the chipmaker itself may be one of the parties with repossession leverage.

### Gaps
- Whether this $20B lease-to-own SPV has actually closed/funded as of the September 2026 cutoff, versus still being "sought"/"negotiated," was not definitively resolved — sources use both "seeks" and "secures" language across different dates in the search results, suggesting the deal may have evolved between reports.

---

## CoreWeave's GPU-collateralized debt facilities (DDTL structure)

### Takeaway
CoreWeave has raised well over $14 billion (across at least three named facilities found in this research — $2.6B, $3.1B, and $8.5B) through delayed-draw term loan (DDTL) facilities specifically structured to be secured by its GPU servers and the revenue streams from its customer contracts, with pricing in the SOFR+4.5%-to-SOFR+5.5% range and a minimum 1.35x debt-service-coverage-ratio covenant — illustrating exactly how a neocloud converts a signed take-or-pay contract into cash to buy the hardware needed to fulfill it.

### Cited Findings
- CoreWeave's $2.6 billion delayed-draw term loan (DDTL 5.5): borrowings bear interest at Term SOFR + 5.50% (or base rate + 4.50%), with a 0.50% undrawn fee; available for draws until December 2026, maturing September 1, 2031 — [SEC 8-K exhibit / press release, via search synthesis](https://www.sec.gov/Archives/edgar/data/1769628/000176962826000357/ex991pr.htm) ⚠️ this SEC exhibit URL was surfaced by search but not fetched and read directly in this pass; figures are from the search tool's own summary of the document
- CoreWeave's $3.1 billion facility (DDTL 5.0): borrowings bear interest at daily compounded SOFR + 4.50%, or base rate + 3.50%, with a 0.50% annual fee on undrawn amounts — [search synthesis, same caveat]
- CoreWeave's $8.5 billion facility (DDTL 4.0) received ratings of A3 (Moody's) and A(low) (DBRS) — described as the first investment-grade-rated financing secured by HPC (high-performance computing) infrastructure and an associated customer contract — [CoreWeave investor-relations press release, via search synthesis](https://investors.coreweave.com/news/news-details/2026/CoreWeave-Closes-Landmark-8-5-Billion-Financing-Facility-Achieving-First-Investment-Grade-Rated-GPU-backed-Financing/default.aspx) ⚠️ same caveat — surfaced but not fetched directly
- Collateral structure across these facilities: debt is guaranteed by CoreWeave's parent and subsidiaries, secured by substantially all assets, and includes a minimum 1.35x debt-service-coverage ratio starting after late 2026 — the borrower pledges both the physical GPU hardware and the revenue streams from its customer contracts as security — [search synthesis]
- A June 2026-dated commentary piece frames the systemic risk explicitly: "Nvidia Circular Financing: $24.9B CoreWeave Debt Puts Pension Funds at Risk" — [Tech Times headline, via search synthesis](https://www.techtimes.com/articles/320239/20260712/nvidia-circular-financing-249b-coreweave-debt-puts-pension-funds-risk.htm) ⚠️ headline-level source only, article content not fetched; the $24.9B figure appears to be a cumulative total across CoreWeave's debt facilities but was not reconciled against the individual facility figures above in this pass

### Inferences
- CoreWeave's DDTL structure is the clearest documented mechanical link between "signed take-or-pay contract" and "cash to buy hardware": the lender is explicitly securing the loan against both the physical GPUs AND the contracted revenue stream from customers like Microsoft/OpenAI, meaning a neocloud's creditworthiness is really a bet on its customers' creditworthiness, not its own. A game modeling a "neocloud" supplier-actor could show its lending capacity as directly tied to the quality/size of its own signed customer contracts, not an independent stat.
- The improving credit ratings over successive facilities (up to investment-grade by DDTL 4.0) suggest neoclouds can "level up" their financing terms over time as they build a track record — a progression mechanic (early facilities cost more, later ones cost less as reputation/scale grows) would be realistic.

### Gaps
- None of the underlying SEC exhibits or CoreWeave IR press releases for these facilities were fetched and read directly in this pass — every figure above traces to the search tool's own summarization of those documents, not to text this researcher read directly. This is flagged explicitly given the weight these debt figures carry.

---

## Microsoft–Nebius: contract mechanics as a case study in "reserved capacity with performance-linked payment"

### Takeaway
Microsoft's five-year, up to $19.4 billion deal with Nebius (announced September 2025) is one of the more granular publicly reported neocloud contracts: it specifies roughly $6.96 billion in aggregate upfront payments, a nine-tranche delivery schedule across 2025–2026 from a New Jersey data center, and explicit service-credit/termination rights if Nebius misses delivery or uptime targets — giving a concrete real-world template for "reserved capacity with penalty clauses," a deal type only described generically in most other sources found in this research.

### Cited Findings
- Microsoft signed a five-year agreement with Nebius Group worth at least $17.4 billion, with options that could raise the total to $19.4 billion — [Bloomberg / multiple outlets, via search synthesis](https://www.bloomberg.com/news/articles/2025-09-08/microsoft-signs-nebius-cloud-deal-for-as-much-as-19-4-billion)
- The contract runs through 2031 — [Redmondmag/RCP summary, via search synthesis](https://redmondmag.com/articles/2025/09/10/microsoft-strikes-billion-deal-with-nebius.aspx)
- Nebius will provide dedicated GPU infrastructure from a new data center in Vineland, New Jersey, with deployment rolled out across nine tranches during 2025–2026 — [same synthesis]
- Microsoft committed to pay Nebius up to approximately $17.39 billion under the agreement, including aggregate upfront payments of roughly $6.96 billion — [TheEnergyMag, via search synthesis](https://theenergymag.com/news/2026-05-04/microsoft-nebius-ai) ⚠️ this specific $6.96B upfront figure traces to a single aggregator source and was not cross-checked against a second independent outlet in this pass
- The committed payments apply regardless of actual utilization of the GPU capacity (i.e., structured as take-or-pay), but are contingent on Nebius satisfying deployment/availability milestones — the agreement lets Microsoft claim service credits or terminate individual tranches if Nebius misses delivery schedules or fails to meet uptime requirements — [same synthesis]
- The financing purpose explicitly cited: this structure lets Microsoft expand cloud capacity without additional capex on its own balance sheet, since Nebius finances the data-center construction using cash flow from the contract plus debt secured against the Microsoft agreement itself — [same synthesis]

### Inferences
- This is the single most granular publicly reported example in the whole catalogue of the "reserved take-or-pay contract with performance penalties" deal type: nine delivery tranches, a specific upfront-payment percentage (~40% of total contract value paid upfront), and named termination/service-credit remedies. A game's "reserved capacity" deal type should include: (a) a tranche/delivery schedule rather than one lump sum, (b) an upfront-payment percentage distinct from the total contract value, and (c) buyer-side remedies (service credits, tranche-level termination) if the supplier misses milestones — this is the best-documented real template for that.

### Gaps
- The exact per-tranche capacity (GPU count or MW) was not broken out in the sources found in this pass.

---

## OpenAI's compute allocation: training vs. inference vs. research, and the Superalignment 20% pledge

### Takeaway
OpenAI's own 2024 compute spend broke down to roughly $3 billion on training, $1.8 billion on inference, and $1 billion on research compute (amortized over multiple years), with most of its total ~$7 billion compute budget going to R&D/experimentation rather than the final training runs of released models — and separately, OpenAI's celebrated 2023 pledge to dedicate 20% of its then-secured compute to the "Superalignment" safety team was never actually honored: the team's GPU requests were repeatedly denied by leadership, and the team was disbanded within about a year of the pledge.

### Cited Findings
- OpenAI's 2024 compute spend: approximately $3 billion on training compute, $1.8 billion on inference compute, and $1 billion on research compute amortized over multiple years — [Epoch AI, "Most of OpenAI's 2024 compute went to experiments," via search synthesis](https://epoch.ai/data-insights/openai-compute-spend) ⚠️ this Epoch AI data-insight page was identified via search but not fetched and read directly in this pass; figures are from the search tool's summary of it, not a direct read — flagged given Epoch AI is one of the assignment's suggested primary-quality sources and this is a case where it should ideally have been fetched directly
- OpenAI's total 2024 compute spend was roughly $7 billion, of which the majority went to R&D — meaning research, experiments, and training runs for unreleased models — rather than to the specific training runs of shipped models (GPT-4.5, GPT-4o, o3); training costs for released models alone are estimated at under $1 billion versus a roughly $5 billion total R&D compute figure — [same source, same caveat]
- In July 2023, OpenAI announced it would commit "20% of the compute we've secured to date over the next four years" to its newly formed Superalignment team, tasked with solving the "core technical challenges of superintelligence alignment" — [OpenAI's own original announcement, via search synthesis, not directly re-fetched in this pass](https://openai.com/index/introducing-superalignment/) ⚠️ this is OpenAI's own 2023 primary announcement page, but it was not fetched and read directly in either research pass — only its headline pledge language was captured via search synthesis
- The Superalignment team was never actually allocated anywhere near this amount — the team's requests for additional GPU access beyond its regular (much smaller) quarterly-budgeted allocation were repeatedly turned down by OpenAI leadership, including by VP of Research Bob McGrew and reportedly with involvement from then-CTO Mira Murati — [Fortune, via search synthesis](https://fortune.com/2024/05/21/openai-superalignment-20-compute-commitment-never-fulfilled-sutskever-leike-altman-brockman-murati) ⚠️ Fortune's original reporting was not fetched directly; captured via search-tool summary
- OpenAI reportedly never established clear conditions for how the 20% pledge would be operationalized (i.e., whether it meant 20% per year for four years, or 5% per year, or some other schedule), leaving the commitment ambiguous even on its own terms — [same source]
- The Superalignment team was disbanded less than a year after the pledge, following the departure of co-founder/chief scientist Ilya Sutskever and the resignation of co-lead Jan Leike, amid public accusations that OpenAI was prioritizing product launches over safety work — [same source]

### Inferences
- The 20% Superalignment pledge is the clearest documented example in this whole catalogue of an internal compute-allocation promise (as opposed to an external supplier contract) simply not being honored, with no contractual enforcement mechanism — unlike the Nebius/CoreWeave contracts (which have explicit remedies for missed milestones), there was no penalty structure for OpenAI failing to deliver its own internal pledge to itself. A game could model "internal allocation pledges" (e.g., a safety-research budget promise) as a genuinely different and weaker commitment type than an external supplier contract — visible to the public/press but with no enforcement teeth, subject to being quietly deprioritized under resource pressure.
- The training/inference/research split (roughly 43%/26%/14% of the $7B total, with the remainder likely unaccounted rounding/other) suggests that for a frontier lab, "training the next flagship model" is actually a minority of total compute spend — most goes to less visible experimentation and to serving existing products. A game's compute-allocation slider should probably not default to "mostly training," since that doesn't match OpenAI's own reported 2024 split.

### Gaps
- These OpenAI compute-spend figures are one fiscal year (2024) only; no comparable breakdown for 2025 or 2026 was found in this pass.
- Whether OpenAI has made any newer, revised compute-allocation pledge for safety research since the Superalignment team's dissolution was not investigated in this pass.

---

## GPU count, capital cost, and time-to-online per gigawatt

### Takeaway
Industry estimates for the cost of a 1 GW AI data center cluster range from about $35 billion (Bernstein's estimate) to $50–60 billion (NVIDIA's own higher estimate), with IT hardware (chips, servers, networking) typically representing roughly 70% of total capex versus about 30% for the physical building and power infrastructure; a 1 GW site built on NVIDIA's current-generation Blackwell GB200 NVL72 racks would hold on the order of 400,000–470,000 GPUs, though estimates vary with rack power density and cooling overhead assumptions.

### Cited Findings
- Building 1 GW of AI data-center capacity costs around $35 billion per Bernstein's analysis — notably below NVIDIA's own $50–60 billion estimate for the same metric; other estimates put an all-in modern 1 GW AI campus between $38 billion and $60 billion depending on the power-generation approach (grid vs. gas) — [Investing.com / Orennia, via search synthesis](https://www.investing.com/news/stock-market-news/how-much-does-a-gw-of-data-center-capacity-actually-cost-4314046)
- For a 1 GW gas-powered data center running roughly $60 billion total, the split is roughly 70% IT hardware to 30% physical infrastructure (building + power) — [same synthesis]
- Foundries, memory, and wafer-fab-equipment makers each capture roughly 3–4% of a data center's total capex, or about $1–1.2 billion per gigawatt — [same synthesis] ⚠️ this granular sub-breakdown traces to a single aggregator source and was not cross-checked
- Power is the largest ongoing operating cost: a gigawatt-scale site consumes about $1.3 billion in electricity annually at $0.15/kWh; servers dominate total cost at roughly $5 billion/year (60% of total); annualizing capex over asset lifespan puts total cost of ownership at roughly $8.5 billion/year for a 1 GW site — [Epoch AI, "Total cost of ownership of a one-gigawatt AI data center," identified via search but not fetched and read directly in this pass](https://epoch.ai/data-insights/ai-datacenter-cost-breakdown) ⚠️ this is another case where an Epoch AI page (an assignment-suggested primary-quality source) was identified but not directly fetched — flagged explicitly
- Using NVIDIA Blackwell GB200 NVL72 racks (140 kW/rack, 72 GPUs/rack) and assuming a facility PUE (power usage effectiveness) of 1.1, a 1 GW data center supports roughly 6,500 racks and approximately 468,000 B200-class GPUs — [search synthesis calculation, not attributable to a single named primary source](https://www.amcompute.com/blog/the-power-budget-of-an-ai-data-center) ⚠️ this figure is a derived calculation from a blog source, not a company-disclosed number
- GPU power draw by generation: H100 draws 700W, B200 draws 1,000W, B300 draws 1,400W — rack power density has grown from roughly 15kW to 132kW per rack currently, with 240kW expected in 2026 — [GPUSmith / search synthesis](https://gpusmith.com/articles/en/gpu-rack-power-requirements-planning-guide.pdf)
- Separately, the earlier research pass (not re-verified here) cited a "powered shell" (empty building, no chips) at $9–11 billion per gigawatt, with the Abilene flagship specifically reaching nearly 1 GW at a cost on the order of $3–4 billion — [carried over from `compute_race.md`, itself citing Distilled Earth/IntuitionLabs] ⚠️ this figure is notably lower than the Bernstein/NVIDIA full-buildout estimates above because it covers only the empty building shell, not chips — the two figures are not contradictory once the scope difference (shell only vs. fully equipped) is accounted for, but a reader should not conflate them

### Inferences
- The wide range across sources (Bernstein's $35B vs. NVIDIA's own $50–60B estimate for the identical "1 GW AI data center" metric) is itself a notable finding: even industry insiders don't agree on the true all-in cost per gigawatt, likely because the answer depends heavily on chip generation, power-sourcing method (grid vs. gas), and how much of the "campus" is single-purpose AI training vs. mixed-use. A game should probably use a range (e.g., $35–60B per GW) with the specific value depending on chip generation and site type, rather than a single fixed number.
- The roughly 70/30 hardware-to-infrastructure capex split, if directionally correct, means that in a game a player's marginal dollar is far more productively spent on chips than on buildings — but the building/power side is the part that takes years and is subject to interconnection queues and political opposition (per the earlier research pass), so the "faster" 30% of spend is also the "riskier/slower" part in practice. This tension (chips are most of the cost but power/site is most of the delay risk) is a good core tension for a game's resource-allocation decisions.

### Gaps
- Time from contract signing to first capacity online varies enormously by project (Nebius: 2025 announcement, first tranches same year and into 2026; Stargate sites: typically 2–4 years from construction start to full completion per the Epoch AI site-by-site tracker in the prior research pass) — no single average lead time could be established as a general rule; it is genuinely site- and deal-type-dependent, and is best modeled in a game as a range rather than a constant.
- The GPUs-per-GW estimate (~468,000) is generation- and rack-density-specific; it will keep shifting as new GPU generations increase per-chip power draw (which lowers GPUs/GW even as compute/GW rises). No forward projection for post-Blackwell (Rubin-generation) GPUs/GW was found in this pass.

---

## What goes wrong: renegotiation, cancellation, counterparty risk

### Takeaway
Beyond the Oracle–OpenAI Abilene cancellation and Microsoft's own 2025 data-center lease pullbacks (both independently documented with real numbers), the dominant "what goes wrong" pattern discussed by financial analysts and even a central bank body (the Bank for International Settlements) is counterparty concentration: neocloud and hyperscaler revenue, debt, and equity increasingly all trace back to the same small handful of AI labs, meaning a stumble by any one major lab could cascade across its compute suppliers' credit and equity positions simultaneously.

### Cited Findings
- Microsoft "walked away" from pending data-center leases with third-party developers in the U.S. and Europe totaling roughly 2 GW of capacity over a six-month period, per TD Cowen analysts (reported March 2025); more specifically, by that point Microsoft had canceled leases totaling 200 MW in U.S. markets, let letters of intent expire, and withdrew from contracts for at least five land parcels — [Bloomberg/Bisnow/DataCenterDynamics, via search synthesis](https://www.bisnow.com/national/news/data-center/microsoft-is-stepping-away-from-more-than-2gw-of-data-center-capacity-128681)
- TD Cowen's stated reasoning: the pullback was "largely driven by the decision to not support incremental OpenAI training workloads," and reflected "data center oversupply relative to its current demand forecast" — [same synthesis, attributed to TD Cowen analyst commentary, not fetched from TD Cowen directly]
- Despite the cancellations, Microsoft told Bloomberg it still intended to spend close to $80 billion on AI data centers (in the relevant fiscal period referenced by that report) — [same synthesis]
- Circular financing is explicitly defined in this research as: a capital-rich platform or supplier (e.g., NVIDIA) funds an AI developer or infrastructure partner (e.g., OpenAI), and the recipient then spends much of that money back with the funder in the form of cloud services, compute, GPUs, networking gear, or reserved capacity — [Columbia Business School blog / J.P. Morgan Asset Management commentary, via search synthesis](https://am.jpmorgan.com/us/en/asset-management/adv/insights/market-insights/market-updates/on-the-minds-of-investors/does-circularity-in-ai-deals-warn-of-a-bubble/)
- Analysts flag that long-dated compute commitments concentrate counterparty risk: if a large share of a supplier's contracted revenue depends on a handful of fast-growing but still loss-making AI labs, the supplier's own financial stability becomes tied to those labs' ability to keep raising capital and retaining customers — [J.P. Morgan Asset Management, via search synthesis]
- A neocloud's revenue, its own debt, and its equity-investor-supplier's capital can all trace back to the same small set of counterparties, which the analysis states makes conventional credit assessment "less reliable than it looks" — [same source]
- The Bank for International Settlements has named this circular-financing/counterparty-concentration dynamic — alongside a potential broader AI capex bust and sovereign-debt fragility — as one of three biggest risks it currently sees to global financial stability — [search synthesis referencing BIS commentary](https://blogs.cuit.columbia.edu/gjb2124/circular-financing/) ⚠️ the BIS's own original statement/report was not fetched directly; this is reported via a secondary academic-blog summary

### Inferences
- The two documented "hard" cancellation events in this research (Oracle/OpenAI's Abilene 600 MW expansion, and Microsoft's ~2 GW of 2025 lease walk-backs) share a common driver: a buyer's own demand forecast changed faster than the physical buildout could adapt, leaving the supplier holding a partially-built or newly-unwanted asset. A game's "cancellation" event should probably be triggered by the PLAYER's own demand-forecast volatility (over-committing to a training run that gets cancelled, or a product that underperforms), not purely by external supply shocks — that is the actual documented pattern here, not the reverse.
- The counterparty-concentration risk is structurally about scale, not malice: it emerges simply because there are only a handful of frontier labs big enough to sign these deals at all, so every supplier ends up exposed to the same small customer set. A game with, say, 3–5 lab-player-slots and several supplier NPCs would organically reproduce this concentration dynamic without needing to script it — a design point worth noting for game balance rather than mechanics per se.

### Gaps
- No specific, named example was found of a full deal CANCELLATION (as opposed to renegotiation/partial scope-cut) by either a lab or a supplier in the 2025–2026 window — every documented "what went wrong" case in this research (Abilene, Microsoft's leases) is a partial pullback or renegotiation, not an outright cancellation of a fully signed contract. This may be a genuine finding (full cancellations may be rare/undocumented because of contractual penalty clauses) rather than a research gap, but it should be treated as unconfirmed either way.

---

## Coverage statement

**Sources fetched and read directly in this research pass (beyond search-snippet level):**
- AMD 8-K, Exhibit 4.1 (OpenAI warrant agreement) — https://ir.amd.com/financial-information/sec-filings/content/0001193125-25-230895/d28189dex41.htm — fetched and read directly; note that the filing itself redacts the vesting-schedule exhibits (Exhibits E, F) and the restricted-persons list (Exhibit D), so even a full read of this primary document leaves a genuine, company-imposed gap in the vesting terms, which is flagged inline above rather than filled in from secondary reporting without a caveat.
- CoreWeave's own press release on the initial OpenAI agreement — https://www.coreweave.com/news/coreweave-announces-agreement-with-openai-to-deliver-ai-infrastructure — fetched and read directly.
- Microsoft's own blog post on the October 2025 OpenAI restructuring — https://blogs.microsoft.com/blog/2025/10/28/the-next-chapter-of-the-microsoft-openai-partnership/ — fetched and read directly.
- NVIDIA's own newsroom post on the OpenAI 10 GW / $100B LOI — https://nvidianews.nvidia.com/news/openai-and-nvidia-announce-strategic-partnership-to-deploy-10gw-of-nvidia-systems — fetched and read directly.

**Sources consulted only via search-engine result synthesis (snippet/aggregator level) in this pass — flagged inline with ⚠️ wherever the underlying claim is load-bearing:**
- Oracle's 10-Q for the quarter ended August 31, 2026 (RPO figures) — identified on SEC EDGAR but not fetched and read directly; all RPO figures above (including the $664B total) trace to a search-tool synthesis describing the filing's contents.
- CoreWeave's own SEC 8-K exhibits and investor-relations press releases for its $2.6B, $3.1B, and $8.5B debt facilities — surfaced via search but not fetched directly; all interest-rate and covenant figures trace to search-tool summaries of these documents.
- Epoch AI's "Most of OpenAI's 2024 compute went to experiments" (OpenAI compute-spend breakdown) — identified via search but not fetched directly, despite being an assignment-suggested high-quality source; flagged explicitly given its centrality to the training/inference/research split finding.
- Epoch AI's "Total cost of ownership of a one-gigawatt AI data center" — same caveat as above; identified via search but not fetched directly.
- Dozens of industry-blog/aggregator sources (Shattered.io, IntuitionLabs, ClusterBid, Spheron Blog, Introl Blog, ValueAddVC, congmigos/cryptopond/marktechpost neocloud-ranking articles, TheEnergyMag, Let's Data Science, Bisnow, DataCenterDynamics, Tom's Hardware, TechCrunch, CNBC, Bloomberg headlines, and others cited inline above) — these were the accessible sources for the majority of pricing, contract-structure, and financing figures in this catalogue and were not independently cross-verified against primary company filings or earnings-call transcripts in this pass. Treat quantitative figures sourced only to these outlets as directionally reliable industry reporting, not as independently confirmed primary-source facts.
- The Bank for International Settlements' own commentary on circular-financing risk was seen only via a secondary academic blog's summary, not the BIS's own publication.

**Findings carried forward from the EARLIER research pass** (`docs/research/ai-lab-mechanics/notes/compute_race.md`, itself read in full before this research began) **without independent re-verification in this pass**, and explicitly marked as such inline above: the H100/B200 rental-price tables, the "powered shell" $9–11B/GW figure, the pre-2025 Microsoft–OpenAI investment history, and the NVIDIA $100B→$30B pullback narrative. These carry the same sourcing caveats they carried in the original notes file (mostly aggregator-level), and this pass did not upgrade their sourcing quality except where a primary document was newly fetched (as flagged above).

**Unreachable / not investigated in this pass:**
- No SEC filings (Oracle 10-Q, CoreWeave 8-Ks/S-1, NVIDIA 10-K/10-Q, Amazon/Google/Microsoft earnings-call transcripts) were fetched and read in full despite being explicitly suggested sources for this assignment — search tools surfaced the correct documents (URLs on sec.gov are cited above where found) but WebFetch was not used against SEC.gov filing pages directly in this pass; time/tool-call budget was instead spent covering the full breadth of deal types the assignment requested. This is the single most significant coverage gap in this research and should be prioritized first if a follow-up pass is commissioned.
- Reuters, FT, and WSJ's own original reporting (as opposed to other outlets' summaries of that reporting) was not fetched directly for any claim in this pass — every FT/WSJ-attributed claim above passed through at least one intermediary outlet.
- The Information's reporting (explicitly suggested in the assignment) was not located or used as a source in this pass; no findings above are attributable to it.
- SemiAnalysis was used extensively in the EARLIER pass (fetched directly there) but was not re-consulted in this deeper pass on deal structure specifically, since the earlier pass's SemiAnalysis coverage was supply-chain-focused rather than deal-structure-focused.

No claim above is presented as more certain than its source allows. Every load-bearing figure sourced only from search-synthesis rather than a direct document read carries an inline ⚠️, consistent with the sourcing rule for this research.
