# How a US IPO actually works, with real AI-era cases

Research note for Game Night AI Lab. Compiled 2026-10-27. Research only; the game-design section at the end is clearly marked as inference.

**How to read the flags.** ⚠️ marks a claim that rests on a source I could read only in part (a long prospectus read in targeted excerpts, a search snippet, or an abstract). "News-only" marks a claim with no primary filing behind it. Most web pages were read through a fetch tool that returns a model-written digest of the page rather than the raw text, so "read in full" for those pages means the tool reported covering the whole page. Raw text was read directly for EDGAR filing lists, the SEC IPO investor bulletin, the CoreWeave comment letter, the Ritter tables, and the excerpts of the Anthropic, SpaceX and Figma prospectuses. The coverage statement at the end says which source was read which way.

---

## Summary (most game-relevant findings)

1. **Anthropic publicly filed its S-1 on 2026-10-26, and OpenAI has said it filed confidentially.** Anthropic's S-1 (the registration statement, the SEC filing that describes the company and the offer) followed five months of confidential review: a confidential draft on 2026-06-01, then five confidential amendments. The ticker will be "ANT" on Nasdaq, and the price range is still blank ([EDGAR filing list](https://efts.sec.gov/LATEST/search-index?q=&ciks=0002130357), [S-1](https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm), [Anthropic announcement](https://www.anthropic.com/news/s1-sec)). OpenAI said on 2026-06-08 that it had submitted a confidential S-1 and had "not decided on timing." No OpenAI filing is visible on EDGAR, which is expected while a filing is still confidential. xAI is no longer an independent lab: SpaceX acquired it effective 2026-02-02, and SpaceX itself went public on 2026-06-12.
2. **The real timeline runs about 2.5 to 5 months from the first confidential filing to the first trade, and it can stretch to years.** Measured from EDGAR: SpaceX took 74 days, CoreWeave 102 days, Figma 107 days, Arm about 4.5 months, Reddit about 27 months, and Cerebras about 23 months (with a withdrawal and a refiling). The SEC's first comment letter arrived 24 to 30 days after each first draft, and later rounds took about 2 weeks.
3. **The public phase is short and tightly scripted.** The draft must become public at least 15 days before the roadshow (the investor marketing tour). The roadshow runs about 1 to 2 weeks. Pricing happens the evening before trading, and the first trade often prints hours after the opening bell.
4. **Price ranges move in both directions, and the market judges the deal on day one.** CoreWeave cut its deal from a $47–55 range to $40 and closed its first day flat. Cerebras raised its range and then priced $25 above it, and Figma priced $1 above a raised range. Their first-day gains were +68% and +250%. Across 9,345 IPOs from 1980 to 2025, the average first-day return was 19.0%, and 16.5% of IPOs closed day one below the offer price (Ritter).
5. **Recent mega-IPOs stage their lockups.** A lockup is a contract barring insiders from selling for a set period. Anthropic lets some insiders sell 10% on the first trading day and another 35% after the 2026 annual results. Its founders and large holders are locked for up to 365 days. Over 60% of SpaceX's shares, including all of Elon Musk's, are locked for more than a year. CoreWeave shows the classic overhang (the mass of insider shares waiting to unlock): the stock rose from $40 to above $183 by late June 2025, then fell after the August lockup expiry as insiders sold.
6. **Governance is part of the story.** Every AI-era case is controlled by insiders through multi-class stock. Musk holds 82.4% of SpaceX's votes. At Anthropic, a founder entity holds 50.1% of the votes and a Long-Term Benefit Trust elects a board majority. In 2025, 41% of all US IPOs had dual-class shares (Ritter).
7. **Mega deals pay far lower bank fees.** On mid-size IPOs ($30–160 million) the bank fee is almost always exactly 7% of the money raised; 93.3% of such deals paid exactly 7%. SpaceX paid 0.67% ($0.90 per share on $135), Cerebras about 2.35%, and CoreWeave 2.8%.

---

## Part 1: the US IPO process and its timeline

### Timeline table

| # | Stage | Typical length (with evidence) | Who acts | What can go wrong | Sources |
|---|---|---|---|---|---|
| 0 | Readiness: audited financials, internal controls, auditor, board | Often a year or more. Anthropic switched auditors (Grant Thornton to Ernst & Young) on 2025-10-30, seven months before its first confidential filing. | Company, auditor (PCAOB-registered), lawyers | The SEC flags "material weaknesses" in internal controls (CoreWeave comment #10). An auditor change must be disclosed. | [Anthropic S-1, "Change in Independent Accountant"](https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm) ⚠️; [CoreWeave comment letter 2025-01-13](https://www.sec.gov/Archives/edgar/data/1769628/000000000025000329/filename1.pdf) |
| 1 | Pick the banks | Not measured in this research | Company, bookrunners (lead banks) | Banks are named in later drafts; initial confidential drafts may omit them | [SEC DRS procedures](https://www.sec.gov/corpfin/announcement/draft-registration-statement-processing-procedures-expanded) |
| 2 | Confidential draft (DRS) submitted | One filing event | Company, counsel | — | Same |
| 3 | SEC review, round 1 | First comment letter 24–30 days after the draft: SpaceX 25, CoreWeave 28, Figma 24, Arm 27, Reddit 28, Snap 30. The SEC staff's stated goal (1996) is "within 30 days". | SEC Division of Corporation Finance | Many comments: CoreWeave's first letter had 30 | EDGAR filing lists (below); [Carnall 1996 speech](https://www.sec.gov/newsroom/speeches-statements/spch081-developments-division-corporation-finance) |
| 4 | Further rounds (amended drafts and letters) | Each round about 2 weeks (CoreWeave 14 and 13 days; Figma 13). Total rounds: 2–3 for fast deals, 5 for Anthropic, about 8 letters for Reddit. | Company responds; SEC re-reviews | The review drags on, or an outside review blocks it (Cerebras: national-security review by CFIUS) | EDGAR filing lists |
| 5 | Public flip (S-1 filed publicly) | At least 15 days before the roadshow | Company | Leaks, "gun-jumping" (illegal early promotion) | [SEC DRS procedures](https://www.sec.gov/corpfin/announcement/draft-registration-statement-processing-procedures-expanded) |
| 6 | Price range filed, roadshow, book-building | About 1–2 weeks: CoreWeave range filed 03-20, priced 03-27; SpaceX investor FWPs 06-04 to 06-09, priced 06-11 | Management, banks, institutional investors | Weak demand forces a downsized deal (CoreWeave); hot demand pushes the range up (Cerebras, Figma) | Filings below |
| 7 | Effectiveness and pricing | The SEC declares the filing "effective" on pricing day or the day before; the price is set that evening | SEC, company, banks | The SEC will not declare effectiveness while disclosure looks materially incomplete | [SEC IPO bulletin](https://www.sec.gov/files/ipo-investorbulletin.pdf) |
| 8 | First trade | Next morning, but the opening auction often finishes hours later: Facebook 11:30, SpaceX just before noon, Cerebras 12:59 p.m. | Exchange, designated market maker | Exchange glitch (Facebook/Nasdaq); trading halt on volatility | [SEC 2013-95](https://www.sec.gov/news/press-release/2013-2013-95htm); IPOScoop (news) |
| 9 | Closing and greenshoe | Closing about T+2 (SpaceX traded 06-12, closed 06-15); greenshoe option open for 30 days | Banks | Banks stabilize (buy to support) a sagging price; once support ends, the price can fall | [SpaceX 8-K 2026-06-15](https://www.sec.gov/Archives/edgar/data/1181412/000162828026043288/spaceexplorationtechnologi.htm); [SEC bulletin](https://www.sec.gov/files/ipo-investorbulletin.pdf) |
| 10 | Research quiet period | At least 10 days after the IPO for participating banks (none for emerging growth companies) | Bank analysts | — | [FINRA Rule 2241](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2241) |
| 11 | First quarterly report (10-Q) and earnings | About 40–55 days after the IPO (Cerebras IPO 05-14, 10-Q 06-24; SpaceX IPO 06-12, 10-Q 08-04; CoreWeave IPO 03-28, earnings 8-K 05-14) | Company | A miss right before the lockup expiry (CoreWeave, August 2025) | EDGAR filing lists |
| 12 | Lockup expiry | Typically 180 days, now often tied to earnings releases and staged | Insiders | Price drop and volume spike | [Field & Hanka 2001](https://ideas.repec.org/a/bla/jfinan/v56y2001i2p471-500.html) ⚠️ abstract only |
| 13 | Life as a public company | 10-Q due 40–45 days after each quarter, 10-K due 60–90 days after year end, 8-K within 4 business days of a major event | Company | Late filings, surprise events | SEC Forms [10-Q](https://www.sec.gov/files/form10-q.pdf), [10-K](https://www.sec.gov/files/form10-k.pdf), [8-K](https://www.sec.gov/files/form8-k.pdf) ⚠️ general instructions only |

### Real filing-by-filing timelines (from EDGAR)

These dates come from EDGAR's full-text search index, which lists each filing with its date and form type. In the lists below, "letter" means an SEC comment letter (posted on EDGAR as "UPLOAD") and "reply" means the company's response (posted as "CORRESP"). The arrows only order events in time.

- **SpaceX** ([list](https://efts.sec.gov/LATEST/search-index?q=&ciks=0001181412)). Draft 2026-03-30, letter 04-24, amended draft 05-07, letter 05-19, public S-1 05-20, reply and S-1/A 06-01, S-1/A 06-03 (fixed $135 price), investor documents filed 06-04 to 06-09, exchange registration (8-A) 06-10, effective 06-11, final prospectus (424B4) and first trade 06-12, closing 06-15. **Draft to first trade: 74 days.**
- **CoreWeave** ([list](https://efts.sec.gov/LATEST/search-index?q=&ciks=0001769628)). Draft 2024-12-16, letter 2025-01-13, amended draft 01-22, letter 02-05, amended draft 02-11, letter 02-24, public S-1 03-03, staff letter 03-11, S-1/A 03-12, S-1/A 03-20 (range $47–55), effective 03-27, first trade 03-28. **102 days.**
- **Figma** ([list](https://efts.sec.gov/LATEST/search-index?q=&ciks=0001579878)). Draft 2025-04-15, letter 05-09, amended draft 05-27, letter 06-09, public S-1 07-01, letter 07-15, S-1/A 07-21, S-1/A 07-28, effective 07-30, first trade 07-31. **107 days.**
- **Arm.** Draft 2023-04-28, letter 05-25, letter 06-15, draft 08-07, public F-1 (the foreign-issuer version of the S-1) 08-21, effective 09-13, first trade 09-14.
- **Reddit.** Draft 2021-12-16, then letters on 2022-01-13, 02-22, 03-24, 04-22, 09-08, 11-28, 2023-03-10 and 2024-02-16. Public S-1 2024-02-22, effective 03-20, first trade 03-21. **About 27 months**, spanning the 2022–2023 IPO drought (Ritter counts 38 US IPOs in 2022 and 54 in 2023).
- **Snap.** Draft 2016-10-31, letters 11-30, 12-23 and 2017-01-19, public S-1 02-02, effective 03-01, 424B4 03-03.
- **Cerebras** ([list](https://efts.sec.gov/LATEST/search-index?q=&ciks=0002021728)). Draft 2024-06-17, public S-1 2024-09-30, stuck during the CFIUS review, withdrawal request 2025-10-03. New draft 2025-12-22, public S-1 2026-04-17, effective 2026-05-13, first trade 2026-05-14.
- **Anthropic** ([list](https://efts.sec.gov/LATEST/search-index?q=&ciks=0002130357)). Draft 2026-06-01, amended drafts 07-13, 08-10, 09-04, 10-01 and 10-09, public S-1 10-26. Under the 15-day rule, the roadshow can start no earlier than about 2026-11-10 (my arithmetic).

### Stage notes

**0. Readiness: audit, controls, board.**
- An S-1 must include audited financial statements. A company qualifying as an "emerging growth company" (EGC, a JOBS Act category for companies with under $1.235 billion in annual revenue) includes 2 years of audited statements; other companies include 3 ([SEC IPO bulletin, Pub. No. 133, 2/13](https://www.sec.gov/files/ipo-investorbulletin.pdf); [SEC EGC page](https://www.sec.gov/resources-small-businesses/going-public/emerging-growth-companies)).
- Anthropic, which is not an EGC, presents audited 2023, 2024 and 2025 statements plus unaudited first-half 2026 figures ⚠️ ([S-1 excerpt](https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm)).
- Internal controls: EGCs are exempt from the auditor attestation of internal controls under SOX 404(b). Other new public companies have up to two years after the IPO before that attestation is required ([SEC bulletin](https://www.sec.gov/files/ipo-investorbulletin.pdf)).
- The SEC staff pushes on control weaknesses. CoreWeave's first letter asked which remediation steps were done, how long the rest would take, and what they would cost ([letter](https://www.sec.gov/Archives/edgar/data/1769628/000000000025000329/filename1.pdf)).
- *Not verified from a primary source in this research:* exchange rules on independent directors and audit committees, and the bank "bake-off" (the beauty contest in which banks pitch to lead the deal). Controlled companies can skip some board-independence rules; SpaceX, Arm and Anthropic each say they are or will be a "controlled company" under Nasdaq rules (see the case studies).

**1. Bank fees (the "gross spread").**
- **Mid-size deals: 7%.** From 2001 to 2025, 93.3% of IPOs raising $30–160 million (2025 dollars) paid exactly 7%. Above $160 million, only 45.1% paid exactly 7% and 54.4% paid less ([Ritter, Table 10](https://site.warrington.ufl.edu/ritter/files/IPO-Statistics.pdf) ⚠️ selected tables). The origin is Chen and Ritter, "The Seven Percent Solution," *Journal of Finance*, June 2000 (cited by Ritter; not opened).
- **Big deals: under 5%.** Deals of $1 billion or more had a median spread of 4.75%. Earlier mega-deals: Visa 2.8% (2008), General Motors 0.75% (2010), Facebook 1.1% (2012), Uber 1.3% (2019) ([Ritter, Table 11](https://site.warrington.ufl.edu/ritter/files/IPO-Statistics.pdf) ⚠️).
- **This dataset's cover pages (my arithmetic):** SpaceX $0.90 on $135 (0.67%, $500 million total, and no discount at all on greenshoe shares); Cerebras $4.3475 on $185 (2.35%); CoreWeave $1.12 on $40 (2.8%); Arm $1.02 on $51 (2.0%); Snap $0.425 on $17 (2.5%); Figma $1.485 on $33 (4.5%); Reddit $1.70 on $34 (5.0%).
- **Number of banks:** SpaceX listed 22 banks on its cover and Anthropic 22 (my count from the covers).

**2. The confidential draft (DRS).**
- The JOBS Act (2012) let EGCs submit drafts privately. On 2017-08-17 the SEC extended confidential review to every company's IPO draft, and on 2025-03-03 it widened this further (later offerings, Exchange Act registrations, de-SPACs) ([SEC announcement](https://www.sec.gov/corpfin/announcement/draft-registration-statement-processing-procedures-expanded)).
- **The key timing rule:** the company must publicly file the registration statement and all earlier drafts at least 15 days before any roadshow (or before the requested effective date if there is no roadshow). Initial drafts may omit the banks' names.
- This is why OpenAI's filing is invisible on EDGAR, and why Anthropic's six drafts all became visible at once on 2026-10-26.

**3. What the S-1 contains.** The prospectus (the offering document inside the S-1) contains a summary, risk factors, use of proceeds, dividend policy, capitalization, dilution, MD&A (management's discussion and analysis of results), business, management, executive pay, related-party transactions, principal and selling stockholders, a description of the share classes, shares eligible for future sale (the overhang), underwriting, and the financial statements ([SEC bulletin](https://www.sec.gov/files/ipo-investorbulletin.pdf)). Anthropic's table of contents follows exactly this order and puts the risk factors on pages 26–120, about 95 pages ⚠️.

**4. SEC review and comment letters.**
- **How the review works:** the Division of Corporation Finance reviews selectively. Reviews can be full, financial-only, or targeted; a second reviewer checks the examiner's comments. Comments can ask for supplemental information or for revised disclosure, and "the comment-and-response cycle continues until the issues are resolved" ([SEC filing review process](https://www.sec.gov/files/divisions/corpfin/cffilingreview.htm), last modified 2013).
- **When letters become public:** the SEC releases the correspondence "no earlier than 20 business days" after the review is complete (same page; the [SEC bulletin](https://www.sec.gov/files/ipo-investorbulletin.pdf) says 20 business days after effectiveness). On EDGAR, SEC letters appear as "UPLOAD" and company responses as "CORRESP".
- **Timing goal:** in 1996 the SEC staff said it was "committed to issuing initial comments on registration statements within 30 days" ([Carnall speech, 1996-02-16](https://www.sec.gov/newsroom/speeches-statements/spch081-developments-division-corporation-finance)). The 24–30 day gaps measured above fit that goal.
- **What a real letter looks like** (CoreWeave, 2025-01-13, 30 comments, [read in full](https://www.sec.gov/Archives/edgar/data/1769628/000000000025000329/filename1.pdf)):
  - Customer concentration: name the top three customers, file the largest customer's contract, and give each significant customer's share of revenue.
  - Marketing claims: substantiate "AI Hyperscaler driving the AI revolution."
  - Related-party contracts: file the NVIDIA and Magnetar-linked agreements.
  - Debt: quantify debt service as a share of cash flow.
  - Key metrics and non-GAAP measures: give GAAP results equal prominence.
  - Lockup: disclose the lockup exceptions.
  - Stock-option valuations: explain how the board valued its shares.
  - Testing-the-waters materials: hand over copies.
- **Effectiveness:** the SEC "will issue an order declaring the registration statement effective" once comments are resolved. That order is not an approval of the investment ([SEC bulletin](https://www.sec.gov/files/ipo-investorbulletin.pdf)). On EDGAR it appears as an "EFFECT" notice, for example SpaceX on 2026-06-11.

**5. Quiet period and gun-jumping.**
- **Section 5** of the Securities Act bars offers before a registration statement is filed (5(c)) and sales before it is effective (5(a)). Section 5(d) lets EGCs "test the waters" with large institutions ([15 U.S.C. 77e](https://www.law.cornell.edu/uscode/text/15/77e)).
- **Rule 163B** (adopted 2019-09-26) extends testing the waters to all issuers, but only with qualified institutional buyers and institutional accredited investors ([SEC 2019-188](https://www.sec.gov/news/press-release/2019-188)).
- **Rule 163A** is a safe harbor for issuer communications made more than 30 days before filing that do not mention the offering, provided the issuer takes reasonable steps to stop further distribution in the 30 days before filing ([17 CFR 230.163A](https://www.law.cornell.edu/cfr/text/17/230.163A)).
- **Rule 169** protects regularly released factual business information aimed at customers and suppliers rather than investors ([17 CFR 230.169](https://www.law.cornell.edu/cfr/text/17/230.169)).
- **"Quiet period" has no legal definition.** The SEC describes it as lasting at least from filing to effectiveness ([SEC glossary via search snippet](https://www.investor.gov/additional-resources/general-resources/glossary/quiet-period) ⚠️ page blocked to my fetcher, snippet only).
- **Google 2004.** The final S-1/A contains "Appendix B—September 2004 Magazine Article." It also carries a risk factor saying that if Google's involvement in the *Playboy* article were held to violate the Securities Act, Google "could be required to repurchase" IPO shares for one year. Google stated it did not believe this was a violation and corrected three facts from the article ([S-1/A 2004-08-13](https://www.sec.gov/Archives/edgar/data/1288776/000119312504139655/ds1a.htm) ⚠️ first 200k of 336k characters).
- **Groupon 2011.** The SEC questioned a leaked CEO memo to employees, and Groupon's October 2011 amendment included the full memo (news-only: search summaries of Fortune and TechCrunch coverage ⚠️ not opened).
- **Modern practice.** SpaceX filed CEO and CFO video interviews posted on X as free writing prospectuses (offering material filed with the SEC under Rule 433) on 2026-06-09 ([FWP](https://www.sec.gov/Archives/edgar/data/1181412/000162828026041761/fwp_cfointerview.htm)).

**6. Roadshow, book-building, pricing, allocation, greenshoe.**
- **Book-building:** the banks gather "indications of interest" (non-binding orders) into an "order book" listing how many shares each investor wants and at what price. The banks recommend a price, and the issuer decides ([SEC bulletin](https://www.sec.gov/files/ipo-investorbulletin.pdf)).
- **Built-in tension:** the issuer wants a high price; the banks also want buyers to be happy, and underpricing "creates a discount for the initial investors" (same source).
- **Allocation:** most shares go to institutions and wealthy clients; flipping (selling IPO shares at once) is discouraged through future allocations (same source).
- **Where the final price lands relative to the range** (1980–2025, [Ritter, Table 7](https://site.warrington.ufl.edu/ritter/files/IPO-Statistics.pdf) ⚠️):
  - Below the range: 28% of IPOs, with an average first-day return of 3%.
  - Within the range: 49%, average first-day return 12%.
  - Above the range: 23%, average first-day return 50%.
- **Greenshoe** (an option letting the banks buy 15% more shares, used to cover over-allotment and support the price):
  - 15% exactly at CoreWeave (5.625M on 37.5M), Cerebras (4.5M on 30M), SpaceX (83.33M on 555.56M, exercised in full), Reddit (3.3M on 22M), Snap (30M on 200M) and Figma (5.54M on 36.94M).
  - Arm's was smaller: 7M on 95.5M, about 7.3% (my arithmetic from the covers).
- **Stabilization:** banks can buy shares in the first days to keep the price from falling far below the offer (SEC bulletin). Facebook is the textbook case: underwriters' buy orders held the stock at $38 on day one ([CS Monitor](https://www.csmonitor.com/Business/2012/0526/Facebook-IPO-Six-key-dates-in-its-debacle/Facebook-IPO-fizzles-May-18-2012) ⚠️ one slide of a 6-part slideshow, paywalled).
- **Directed share programs** (shares reserved for people the company chooses):
  - SpaceX: up to 5% for employees and invitees.
  - Snap: up to 7%.
  - CoreWeave: 5%.
  - Cerebras: 1.5M shares.
  - Reddit: 8%, for users and moderators, ranked in six tiers by karma and moderator activity.
  - Sources: the cover pages and summaries of each 424B4 ⚠️ first 100k characters each.
- **Auction alternative:** Google ran an auction with a $108–135 range (S-1/A 2004-08-13). It priced at $85 after cutting the range to $85–95 and closed day one around $100.30 (news-only search snippets ⚠️).

**7. First-day trading.**
- **Average first-day return ("underpricing"):** 19.0% equal-weighted across 9,345 IPOs from 1980 to 2025 (median 7.0%). By year: 71.2% in 1999, 11.9% in 2023, 29.3% in 2025. The 2025 "money left on the table" (first-day gain times shares sold) was $13.11 billion on $38.97 billion raised ([Ritter, Table 1](https://site.warrington.ufl.edu/ritter/files/IPO-Statistics.pdf) ⚠️).
- **Broken IPOs** (first close below the offer price): 16.5% of IPOs overall; 53.7% in 2023, 34.7% in 2024, 24.4% in 2025 ([Ritter, Table 1a](https://site.warrington.ufl.edu/ritter/files/IPO-Statistics.pdf) ⚠️).
- **Opening delays: Facebook 2012.** Nasdaq's IPO cross (the opening auction that sets the first price) "fell 19 minutes behind." About 30,000 orders were stuck for over two hours, and Nasdaq paid a then-record $10 million penalty ([SEC press release 2013-95](https://www.sec.gov/news/press-release/2013-2013-95htm)). Facebook closed day one at $38.23, then fell below $38 on day two (news: CS Monitor slide plus search snippets ⚠️).

**8. Lockups.**
- **Typical length** is 180 days. Expiry can push the price down "significantly if a large number of shares become available for sale all at once." The size of the overhang is disclosed under "Shares Eligible for Future Sale" ([SEC bulletin](https://www.sec.gov/files/ipo-investorbulletin.pdf)).
- **Research:** Field and Hanka (2001) studied 1,948 lockups. At expiry they found a permanent rise in trading volume of about 40% and a three-day abnormal return (the price move beyond what the market did) of about −1.5%. Both effects were larger for venture-backed firms, where VCs sell hardest ([abstract](https://ideas.repec.org/a/bla/jfinan/v56y2001i2p471-500.html) ⚠️ abstract only).
- **Modern lockups are earnings-linked and staged:**
  - Figma: until the earlier of the second trading day after its second quarterly earnings release or 180 days ([424B4](https://www.sec.gov/Archives/edgar/data/1579878/000162828025037014/figma424b4.htm) ⚠️ excerpt).
  - Anthropic: tiered, see the case study.
  - SpaceX: more than a year for about 60% of shares, with "timed automatic releases" for others ([424B4](https://www.sec.gov/Archives/edgar/data/1181412/000162828026042639/spaceexplorationtechnologi.htm) ⚠️ excerpt).
- **The research quiet period around lockups is gone.** FINRA eliminated it when it adopted Rule 2241 ([FINRA Notice 15-30](https://www.finra.org/rules-guidance/notices/15-30)).

**9. Analyst research quiet period.**
- **Current rule:** FINRA Rule 2241(b)(2)(I) requires a quiet period of at least 10 days after an IPO for any member firm that was an underwriter or dealer, and 3 days after a secondary offering for managers and co-managers. It does not apply to EGCs ([FINRA Rule 2241](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2241)).
- **History:** the rule took effect 2015-09-25 and reduced "the current 40-day and 25-day IPO quiet periods" under the old NASD Rule 2711 ([FINRA Notice 15-30](https://www.finra.org/rules-guidance/notices/15-30)). I did not verify which roles the old 40-day and 25-day periods applied to.
- **Practical effect (inference):** coverage initiations from the deal banks cluster just after day 10, or around day 25 by convention. That convention is not verified here.

**10. Life as a reporting company.**
- **10-K (annual report) deadlines:** 60 days after fiscal year end for large accelerated filers, 75 for accelerated filers, 90 for everyone else ([Form 10-K, General Instruction A](https://www.sec.gov/files/form10-k.pdf) ⚠️ instructions only).
- **10-Q (quarterly report) deadlines:** 40 days after quarter end for large and accelerated filers, 45 for others ([Form 10-Q](https://www.sec.gov/files/form10-q.pdf) ⚠️).
- **8-K (current report):** generally "within four business days" of the triggering event ([Form 8-K](https://www.sec.gov/files/form8-k.pdf) ⚠️).
- **Filer status at the IPO:** both Anthropic and SpaceX checked "non-accelerated filer" and are not EGCs (S-1 covers).
- **Disclosure channels under Regulation FD** (the fair-disclosure rule against tipping some investors early): SpaceX's first 8-K says it will disclose material information through its investor-relations site and its X account (@SpaceX) "not wire services" ([8-K 2026-06-15](https://www.sec.gov/Archives/edgar/data/1181412/000162828026043288/spaceexplorationtechnologi.htm)).
- **EGC relief:** two years of audits, scaled pay disclosure, no auditor attestation of internal controls, deferred new accounting standards, and testing the waters. EGC status lasts up to five fiscal years and ends at $1.235 billion revenue, more than $1 billion of non-convertible debt issued in three years, or large-accelerated-filer status ([SEC EGC page](https://www.sec.gov/resources-small-businesses/going-public/emerging-growth-companies)).
- *Not researched:* guidance practices and the text of Regulation FD itself.

**11. Alternatives: direct listings and SPACs.**
- **Direct listing** (shares start trading without a bank-underwritten offering):
  - In a direct listing, "no shares trade hands at the reference price"; there is typically a large block trade at the open.
  - First-day returns, measured from open to close: Spotify (2018-04-03) −10.2%, Slack (2019-06-20) +0.3%, Coinbase (2021-04-14) −13.8% (open $381 against a $250 reference price).
  - Since 2022 the companies doing direct listings have "generally been microcap stocks" ([Ritter, Table 13a](https://site.warrington.ufl.edu/ritter/files/IPO-Statistics.pdf) ⚠️).
- **NYSE "Primary Direct Floor Listing"** (a direct listing where the company also sells new shares), approved by the SEC on 2020-12-22 ([Release 34-90768](https://www.sec.gov/files/rules/other/2020/34-90768.pdf) ⚠️ read about pp. 1–11 of 40):
  - The company sells new shares in the opening auction through a single "Issuer Direct Offering Order" priced at the low end of its range.
  - The company must sell at least $100 million in the auction, or reach $250 million when combined with the existing public float.
  - The auction cannot run if the price would fall outside the range or buy interest is too thin, so the listing is cancelled. There is no greenshoe and no firm commitment from banks.
- **SPACs** (shell companies that IPO first, then merge with a private company):
  - SPAC IPOs peaked at 613 in 2021 ($144.5 billion) and numbered 144 in 2025.
  - Merged companies' average one-year return was −49.7% for deals from 2012 to 2023, against +7.0% for the market ([Ritter, Tables 15b–15c](https://site.warrington.ufl.edu/ritter/files/IPO-Statistics.pdf) ⚠️).
- **Why AI-era giants chose traditional IPOs (inference, not sourced):**
  - They need very large amounts of new money. SpaceX lists "AI compute infrastructure" first in its use of proceeds, and Anthropic discloses about $265.6 billion of compute commitments.
  - A direct listing raises little or no new cash and gives no stabilization.
  - The post-merger record of SPACs is poor, and their reputation suffered after 2021.
  - Book-building also lets the company hand-pick anchor investors (Arm's chip-industry backers, Nvidia's order in CoreWeave).

---

## Part 2: case studies

### Compact table

| Company | Confidential draft | Public S-1/F-1 | Range → final price | Raised (base deal) | Day 1 open → close | Control | Source notes |
|---|---|---|---|---|---|---|---|
| **Anthropic** (filed, not priced) | 2026-06-01 (+5 amended drafts) | 2026-10-26 | Range blank; $1B placeholder for the fee calculation | — | — | Public benefit corporation; Founder LLC holds 50.1% of votes through a single Class F share; Long-Term Benefit Trust elects a board majority; controlled company | S-1 ⚠️ excerpts |
| **SpaceX** (incl. xAI) | 2026-03-30 | 2026-05-20 | No range; fixed $135 in the 06-03 S-1/A, priced $135 | $75.0B (≈$86.25B with greenshoe) | $150 → $160.95 (+19.2%) | Musk 82.4% of votes; Class B 10 votes per share; controlled company | 424B4 ⚠️; 8-K; trading data news-only |
| **Cerebras** | 2024-06-17; withdrawn 2025-10-03; refiled 2025-12-22 | 2024-09-30; 2026-04-17 | Raised to $150–160 (news), priced $185 | $5.55B | $350 → $311.07 (+68.2%) | Class B 20 votes per share, about 99.2% of votes | 424B4 ⚠️; day-1 data news-only |
| **CoreWeave** | 2024-12-16 | 2025-03-03 | $47–55 → $40 (downsized) | $1.5B | $39 → $40 (flat) | 3 founders ≈79.9% of votes; Class B 10 votes | 424B4 ⚠️, S-1/A; day-1 data news-only |
| **Arm** | 2023-04-28 | 2023-08-21 (F-1) | $47–51 → $51 | $4.87B (all sold by SoftBank) | $56.10 → $63.59 (+24.7%) | SoftBank ≈90.6%; controlled company | 424B4 ⚠️; day-1 data news-only |
| **Reddit** | 2021-12-16 | 2024-02-22 | $31–34 → $34 | $748M | $47 → $50.44 (+48.4%) | Class B 10 votes, ≈97.1% of votes | 424B4 ⚠️; day-1 data news-only |
| **Figma** | 2025-04-15 | 2025-07-01 | Raised range (top $32) → $33 | $1.22B (two-thirds sold by existing holders) | $85 → $115.50 (+250%) | Dylan Field ≈73.6% of votes; Class B 15 votes; EGC | 424B4 excerpt ⚠️; day-1 data news-only |
| Google 2004 (anchor) | (before confidential drafts existed) | 2004-04-29 (not verified) | $108–135 → cut to $85–95 → $85 | — | close ≈$100.30 ⚠️ snippet | Class B 10 votes | S-1/A ⚠️ |
| Facebook 2012 (anchor) | — | 2012-02-01 | → $38 | ≈$16B (Ritter) | close $38.23, below $38 by day 2 | — | SEC 2013-95; news |
| Snap 2017 (anchor) | 2016-10-31 | 2017-02-02 | → $17 | $3.4B | not verified | Class A non-voting; founders ≈88.5% via Class C | 424B4 ⚠️ |

### Anthropic, PBC (CIK 2130357): filed 2026-10-26, not yet priced

Source: the [S-1](https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm) ⚠️, read as targeted excerpts of about 1.56 million characters (cover, summary financials, lockup, customer concentration, commitments, auditor change); the [fee exhibit](https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/exfilingfees-s1.htm); and [Anthropic's announcement](https://www.anthropic.com/news/s1-sec).

**Offering**
- Class A shares on the Nasdaq Global Select Market as "ANT."
- Share count and price range are blank. The $1,000,000,000 maximum is a placeholder used only to compute the $87,000 SEC fee.
- 22 banks, led by Goldman Sachs and Morgan Stanley.
- Not an emerging growth company; a non-accelerated filer.

**Governance**
- Delaware public benefit corporation, legally required to balance stockholder returns against its stated public purpose.
- Class T stock lets the Long-Term Benefit Trust elect and remove the Class T directors, "who together will constitute a majority" of the board.
- One Class F share, held by an LLC of the seven co-founders, carries 50.1% of the general voting power.
- Class E (employees) votes only on limited matters.
- Class A has one vote per share. Class N has no votes and is held mainly by strategic partners; for example, Amazon's convertible notes convert into Class N.
- The company will be a "controlled company" under Nasdaq rules.
- A 5% stake (846,840,960 Class N shares) went to a wholly owned Anthropic Public Benefit Fund.
- The co-founders have each made a voluntary, revocable pledge to give 80% of their equity to philanthropy.

**Financials** (US$ millions)

| Period | Revenue | Operating loss | Net loss |
|---|---|---|---|
| 2023 | 41 | — | (1,531) |
| 2024 | 386 | — | (8,309) |
| 2025 | 4,585 | (8,060) | (41,965) |
| H1 2025 | 1,163 | — | (12,969) |
| H1 2026 | 16,286 | (693) | (80,748) |

- The H1 2026 net loss is driven by a $(72,388) million "change in fair value of convertible notes, derivative liabilities, and SAFEs." That is a mark-to-market charge on financing instruments, not cash burn.
- 2025 operating expenses include a $1,500 million "Bartz settlement."

**Risks the S-1 discloses**
- **Customers:** "No single customer represented more than 10%" of revenue for the nine months to 2026-09-30. About 79% of Q3 2026 revenue came from customers outside the top five, up from about 64% in Q1 2026. Risk factors still flag dependence on the largest customers.
- **Compute:** non-cancelable purchase commitments of $54.6 billion as of 2025-12-31. As of 2026-06-30, expected fixed or minimum commitments of about $265.6 billion over 1–20 years, plus about $21 billion in short-term contracts.
- **Compute supply:** cloud providers have in the past given less compute than Anthropic sought.
- **Broadcom financing:** an "Infrastructure Partner 2026" agreement allows up to $42.0 billion of notes to fund lease rent. The notes convert into Class N stock at 90% of the 30-day average trading price (85% if revenue conditions are missed).
- **Readiness:** Ernst & Young replaced Grant Thornton as auditor on 2025-10-30.

**Lockups** (three tiers)
- Co-founders and holders of more than 0.5%: locked until the earlier of the second trading day after the Q3 2027 earnings release or day 365.
- Other holders: the earlier of the Q1 2027 earnings release or day 180.
- Non-founder directors, officers and certain employees: may sell up to 10% from the first trading day and another 35% after the FY2026 annual results.
- Demand registration rights (investors' right to force a registered sale) begin six months after effectiveness.

**Unverified** (news-only, not in the excerpts I read): a mid-November 2026 listing date and a $1.5–2 trillion valuation (search summaries of Yahoo and CNBC coverage; the CNBC page returned 403).

### SpaceX (CIK 1181412), including xAI: IPO 2026-06-11/12

Sources: [424B4](https://www.sec.gov/Archives/edgar/data/1181412/000162828026042639/spaceexplorationtechnologi.htm) ⚠️ cover, definitions and lockup excerpt; [S-1/A 06-03](https://www.sec.gov/Archives/edgar/data/1181412/000162828026040364/spaceexplorationtechnologib.htm) ⚠️ cover; [8-K closing](https://www.sec.gov/Archives/edgar/data/1181412/000162828026043288/spaceexplorationtechnologi.htm).

- **Structure:** SpaceX acquired X.AI Holdings "effective February 2, 2026" (the "xAI Merger"). xAI had acquired X Holdings effective 2025-03-28. The AI segment "includes our AI compute, Grok, and X."
- **Pricing:** it set a fixed $135 price in its preliminary prospectus instead of a range. Reuters called that "highly unusual," per news summaries ⚠️ not opened.
- **Size:** 555,555,555 shares for $75.0 billion, at a $0.90 per-share fee. The 83,333,333-share greenshoe was fully exercised, so 638,888,888 shares were sold at closing on 2026-06-15.
- **Listing:** Nasdaq and Nasdaq Texas. A global offering covering Australia, Canada, the EEA, Japan, Switzerland and the UK.
- **Control:** Class B carries 10 votes per share and elects a board majority. Musk holds about 82.4% of the votes; controlled company.
- **Lockup:** 7.8 billion shares (about 60%) are locked for over a year, including 100% of Musk's shares with no early release.
- **Day one** (news-only, IPOScoop): open $150 just before noon, close $160.95 (+19.2%), more than 503 million shares traded. The 06-16 close of $201.80 is from a search snippet ⚠️.
- **After the IPO** (filing list only; contents not read): 10-Qs on 2026-08-04 and 2026-10-22, plus 8-Ks.

### Cerebras Systems (CIK 2021728): a two-attempt IPO

- **First attempt:** the 2024 [S-1](https://www.sec.gov/Archives/edgar/data/2021728/000162828024041596/cerebras-sx1.htm) ⚠️ (first 100k of 388k characters) showed that G42, an Abu Dhabi tech group, provided 83% of 2023 revenue and 87% of first-half 2024 revenue. That is extreme customer concentration.
- **The stall:** CFIUS (the US national-security review of foreign investments) reviewed G42's $335 million investment for months. Cerebras and G42 restructured the stake as non-voting shares ([Reuters via BNN, 2025-03-25](https://www.bnnbloomberg.ca/business/technology/2025/03/25/cerebras-ipo-further-delayed-as-us-national-security-review-drags-on/), news).
- **Withdrawal:** on 2025-10-03 Cerebras asked to withdraw the S-1, saying it "does not intend to conduct the proposed offering... at this time" ([RW letter](https://www.sec.gov/Archives/edgar/data/2021728/000119312525230382/d886849drw.htm)). Reuters reports the company said it had obtained CFIUS clearance that year, raised over $1 billion privately, and that G42 no longer appeared among investors in the new draft ([Reuters, 2025-12-19](https://finance.yahoo.com/news/exclusive-ai-chip-firm-cerebras-181107401.html), news).
- **Second attempt:** priced at $185 on 2026-05-13 for 30M shares ($5.55 billion) ([424B4](https://www.sec.gov/Archives/edgar/data/2021728/000162828026035214/cerebras-424b4.htm) ⚠️ first 100k characters).
  - Class B carries 20 votes per share, about 99.2% of the votes.
  - Significant customers now named: OpenAI, G42, MBZUAI and AWS, with no percentages in the part read.
  - OpenAI holds a warrant for 33,445,026 non-voting shares tied to a deal "valued at more than $20 billion."
- **Day one** (news-only, [IPOScoop](https://www.iposcoop.com/the-ipo-buzz-cerebras-cbrs-prices-ipo-at-185-25-above-range-2/)): opened $350 at 12:59 p.m., closed $311.07 (+68.15%). The order book was reportedly more than 20 times oversubscribed (Bloomberg via IPOScoop).
- **After the IPO:** first 10-Q filed 2026-06-24; heavy insider Form 4 and Form 144 selling in August–October 2026 (filing list only, contents not read).

### CoreWeave (CIK 1769628): the downsized deal

- **Downsizing:** the range was $47–55 for 49M shares ([S-1/A 2025-03-20](https://www.sec.gov/Archives/edgar/data/1769628/000119312525058309/d899798ds1a.htm) ⚠️ cover only). The deal priced at $40 for 37.5M shares, $1.5 billion ([424B4](https://www.sec.gov/Archives/edgar/data/1769628/000119312525067651/d899798d424b4.htm) ⚠️ first 100k characters).
- **Concentration and losses:** Microsoft was 62% of 2024 revenue (35% in 2023). The 2024 net loss was $863 million on $1.92 billion of revenue, and remaining performance obligations (contracted future revenue) were $15.1 billion.
- **Anchor order:** Nvidia's $250 million order at $40 was reported by CNBC and is not in the prospectus portion I read ([CNBC via NBC Connecticut](https://nbcconnecticut.com/news/business/money-report/coreweave-set-to-begin-trading/3530499), news). The CEO said, "we definitely had to scale or rightsize the transaction for where the buying interest was."
- **Day one** (same source): opened $39, closed $40, on a day the Nasdaq fell almost 3%.
- **After the IPO:** the stock passed $183 in late June 2025. After the lockup ended in August, insiders including the CEO and Magnetar sold over 7 million shares, and the stock closed just above $93 on 2025-09-02 ([Yahoo Finance](https://finance.yahoo.com/news/coreweave-stock-sinks-as-insiders-sell-shares-at-very-rapid-pace-163455020.html), news).
- **Why it teaches:** a weak book becomes a smaller deal at a lower price, a strategic anchor props it up, a huge rally follows, and the lockup expiry pulls it back.

### Arm Holdings (CIK 1973239): a parent selling down

- **The deal:** priced 2023-09-13 at $51, the top of the $47–51 range. 95.5M ADSs (US-traded receipts for foreign shares) for $4.87 billion, all sold by SoftBank; Arm received none of the money ([424B4](https://www.sec.gov/Archives/edgar/data/1973239/000119312523235320/d550931d424b4.htm) ⚠️ first 100k characters).
- **Control:** SoftBank kept about 90.6%; controlled company.
- **Cornerstone investors:** AMD, Apple, Cadence, Google, Intel, MediaTek, NVIDIA, Samsung, Synopsys and TSMC indicated interest in up to $735 million, non-binding.
- **Day one** (news-only, [IPOScoop](https://www.iposcoop.com/the-ipo-buzz-arm-holdings-arm-prices-ipo-at-51-high-end/)): close $63.59 (+24.7%).

### Reddit (CIK 1713445): the long confidential road and a user share program

- **The deal:** $34, the top of the $31–34 range, for 22M shares ($748 million) on the NYSE ([424B4](https://www.sec.gov/Archives/edgar/data/1713445/000162828024012380/reddit-final424b4.htm) ⚠️ first 100k characters).
- **User share program:** 8% reserved for users and moderators, ranked in six tiers by karma and moderator activity, with no lockup on those shares.
- **Control:** Class B holders have about 97.1% of the votes.
- **Day one** (news-only, [IPOScoop](https://www.iposcoop.com/the-ipo-buzz-reddit-rddt-prices-ipo-at-34-00-high-end)): opened $47 after 1 p.m., closed $50.44 (+48.35%).
- **Why it teaches:** the confidential process lasted about 27 months through a closed IPO market.

### Figma (CIK 1579878): the 2025 "hot deal"

- **The deal:** $33, above a raised range, for 36.9M shares, two-thirds sold by existing holders, at a 4.5% fee ([424B4](https://www.sec.gov/Archives/edgar/data/1579878/000162828025037014/figma424b4.htm) ⚠️ cover and lockup excerpt).
- **Control:** Class B carries 15 votes; Dylan Field controls about 73.6% of the votes; EGC.
- **Lockup:** tied to the second earnings release or 180 days.
- **Day one** (news-only, [IPOScoop](https://www.iposcoop.com/the-ipo-buzz-figma-fig-opens-at-85-up-158-percent-tops-100-in-nyse-debut/)): opened $85, closed $115.50 (+250%).
- **Why it teaches:** it is the purest example of "money left on the table." Existing holders sold at $33 shares that the market valued at $115 the same day.

### Historical anchors

- **Google 2004.** An auction IPO with a $108–135 range, 10-vote Class B shares, and the *Playboy* gun-jumping risk factor ([S-1/A](https://www.sec.gov/Archives/edgar/data/1288776/000119312504139655/ds1a.htm) ⚠️). The range was cut to $85–95, the deal priced at $85, and the stock closed day one around $100 (news snippets only ⚠️). The founders' letter was not verified here.
- **Facebook 2012.** Nasdaq's opening cross failed and paid a $10 million penalty ([SEC 2013-95](https://www.sec.gov/news/press-release/2013-2013-95htm)). Underwriters held the price at $38 on day one, and it broke below $38 on day two (news ⚠️). The 1.1% fee on a $16 billion raise comes from Ritter.
- **Snap 2017.** It sold only non-voting Class A shares at $17 ($3.4 billion). The founders hold about 88.5% of the votes through 10-vote Class C shares, yet Snap said it would not use the controlled-company exemption ([424B4](https://www.sec.gov/Archives/edgar/data/1564408/000119312517068848/d270216d424b4.htm) ⚠️ first 100k characters).

### AI labs: what is and is not verified (as of 2026-10-27)

| Lab | Status | Verification |
|---|---|---|
| **Anthropic** | Public S-1 filed 2026-10-26; confidential draft 2026-06-01 | **Verified on EDGAR** (CIK 2130357) and in its press release |
| **OpenAI** | Says it "recently submitted a confidential S-1" (post dated 2026-06-08); timing "not decided" | **Company statement, read via news reproductions** ([IPOScoop](https://www.iposcoop.com/?p=38607), [StorageNewsletter](https://www.storagenewsletter.com/2026/06/16/openai-has-confidentially-submitted-a-draft-s-1-to-the-sec/)) ⚠️ the openai.com original was not opened. **No OpenAI registration filing on EDGAR**; full-text search for "OpenAI Group PBC" returns only other filers (fund holdings reports, Anthropic, SB Energy). The submission date (reported as about 2026-05-22), the banks, and the $1 trillion target are unverified. |
| **xAI** | Merged into SpaceX effective 2026-02-02; public through SpaceX since 2026-06-12 | **Verified** in the SpaceX 424B4 |
| **Zhipu (Knowledge Atlas)** | Hong Kong debut 2026-01-08, closed about 13% up | News ([China Daily HK](https://www.chinadailyhk.com/article/626743)). EDGAR shows US depositary-receipt registrations (F-6EF) from 2026-02 (CIK 2109545), i.e. US over-the-counter ADRs |
| **MiniMax** | Hong Kong debut 2026-01-09, offer HK$165, raised about $619 million, retail tranche over 1,830 times subscribed, intraday up to +91%; Euronews says it "more than doubled" on day one | News (China Daily HK, [Euronews](https://www.euronews.com/2026/10/06/moonshot-ai-eyes-hong-kong-ipo-after-50-billion-valuation-as-deepseek-raises-capital)). EDGAR F-6EF ADR filings (CIK 2109556) |
| **Moonshot (Kimi)** | Reportedly targeting a Hong Kong IPO in Q1 2027, up to $5 billion, after a round at about $50 billion | News-only (Bloomberg via Euronews). A DealStreetAsia headline says "files confidentially" ⚠️ snippet only |
| **DeepSeek** | Reportedly hired CITIC Securities for a possible STAR Market listing; timing undecided | News-only (Euronews, unnamed source) |
| **Moore Threads** (GPU maker, not a lab) | STAR Market debut 2025-12-05, about +425% on day one | ⚠️ search snippets only |
| **Mistral, Cohere, Safe Superintelligence, Perplexity, Databricks** | No IPO registration found. EDGAR shows only Form D private-placement notices (Cohere to 2023, Databricks to 2026-08, Perplexity 2023) | EDGAR filing lists |
| **Nscale** (UK AI infrastructure) | Public S-1 2026-09-18 after drafts from 2026-02-17 | EDGAR filing list only; contents not read |
| **Nvidia's "last checks"** | On 2026-03-04, at a Morgan Stanley conference, Jensen Huang indicated Nvidia's investments in OpenAI ($30 billion) and Anthropic may be its last as both head toward IPOs | News-only, paraphrased ([Notebookcheck](https://www.notebookcheck.net/Nvidia-CEO-Jensen-Huang-says-it-may-not-invest-further-in-OpenAI-Anthropic-due-to-upcoming-IPOs.1242682.0.html)); the article quotes no exact Huang wording on this point, and the Anthropic amount is not stated there |

---

## What this suggests for a game (inference)

Everything in this section is design inference, not research.

1. **Break the IPO into five or six visible phases with real-scale durations.** Readiness → confidential draft → SEC rounds → public flip → roadshow → pricing night → day one → quiet period → first earnings → lockup expiry. Scaled to game time, SEC rounds take about a month for the first and about 2 weeks for later ones, the gap between the public flip and the roadshow is at least 15 days, and the roadshow lasts about 1–2 weeks.
2. **Turn SEC comment letters into event cards.** The real CoreWeave letter offers ready-made card types: name your biggest customer, back up a marketing claim, disclose a material weakness, file a related-party contract, quantify debt service, and explain your option valuations. Each card costs time or forces an embarrassing disclosure that later moves demand.
3. **Model customer concentration and outside reviews as the big delay risks.** Cerebras shows that a single foreign customer or investor can freeze an IPO for a year and force a withdrawal and refiling.
4. **Make the book a hidden demand number that the price range reveals.** Weak demand forces a downsize, a price below the range, or a strategic anchor (CoreWeave and Nvidia). Hot demand lets the player raise the range, but every dollar of day-one pop is "money left on the table." A base rate of about 19% average pop and about 1 in 6 broken deals fits the historical data.
5. **Give governance real trade-offs.** Multi-class stock, a founder share holding 50.1% of the votes, or a benefit trust electing the board each lets the player keep control. Each costs something in demand or adds risk-factor text.
6. **Put the lockup cliff on the calendar.** A staged release (10% on day one, 35% after annual results, the rest at 180 or 365 days) creates scheduled sell pressure. Field and Hanka's −1.5% average and CoreWeave's slide show how big the effect can be.
7. **After listing, put the clock on quarterly reporting.** 10-Q every 40–45 days after quarter end, 10-K within 60–90 days, 8-K within 4 business days of a major event. Missing guidance just before a lockup expiry is the worst combination.
8. **Make fees scale with deal size.** About 7% for small deals, under 1% for a $75 billion mega-deal. That rewards a big lab for going public with one huge offering.

---

## Coverage statement

**Read to the end** (via the fetch tool's digest unless "raw" is noted):
- Primary sources: SEC [DRS procedures](https://www.sec.gov/corpfin/announcement/draft-registration-statement-processing-procedures-expanded); SEC [IPO investor bulletin PDF](https://www.sec.gov/files/ipo-investorbulletin.pdf) (raw, full); SEC [filing review process](https://www.sec.gov/files/divisions/corpfin/cffilingreview.htm); SEC press releases [2019-188](https://www.sec.gov/news/press-release/2019-188) and [2013-95](https://www.sec.gov/news/press-release/2013-2013-95htm); [Carnall 1996 speech](https://www.sec.gov/newsroom/speeches-statements/spch081-developments-division-corporation-finance); SEC [EGC page](https://www.sec.gov/resources-small-businesses/going-public/emerging-growth-companies).
- Rules and law: [FINRA Rule 2241](https://www.finra.org/rules-guidance/rulebooks/finra-rules/2241); [FINRA Notice 15-30](https://www.finra.org/rules-guidance/notices/15-30); [17 CFR 230.163A](https://www.law.cornell.edu/cfr/text/17/230.163A); [230.169](https://www.law.cornell.edu/cfr/text/17/230.169); [15 U.S.C. 77e](https://www.law.cornell.edu/uscode/text/15/77e).
- Filings and letters: CoreWeave SEC comment letter 2025-01-13 (raw, full); Cerebras withdrawal letter; SpaceX closing 8-K; SpaceX CFO-interview FWP; Anthropic [press release](https://www.anthropic.com/news/s1-sec) and fee exhibit; EDGAR filing lists and entity searches (raw JSON) for Anthropic, SpaceX, Cerebras, CoreWeave, Figma, Arm, Reddit, Snap, Google (2004), Facebook (2012), Nscale, Cohere, Databricks, Perplexity, Crusoe, Lambda, Knowledge Atlas ADR and MiniMax ADR.
- News: IPOScoop articles on Cerebras, SpaceX, OpenAI, Figma, Arm and Reddit; StorageNewsletter (OpenAI); China Daily HK (Zhipu and MiniMax); Euronews (Moonshot and DeepSeek); Notebookcheck (Huang); Reuters via BNN Bloomberg (Cerebras, 2025-03-25); Reuters via Yahoo (Cerebras, 2025-12-19); CNBC via NBC Connecticut (CoreWeave); Yahoo Finance (CoreWeave lockup); IDEAS/RePEc abstract page for Field and Hanka.
- Note: several news pages contained internal inconsistencies, which I flagged or avoided. One example is IPOScoop's SpaceX "$26.11" gain against the $25.95 implied by $135 and $160.95.

**Read only in part** (each flagged ⚠️ inline):
- Anthropic S-1: targeted excerpts of about 1.56 million characters (raw).
- SpaceX 424B4: cover, definitions and lockup excerpt (raw). SpaceX S-1/A of 06-03: cover only (raw).
- Figma 424B4: cover and lockup excerpt (raw).
- First 100,000 characters only: Cerebras 424B4 (of 128,833 characters reported by the fetcher); Cerebras 2024 S-1 (of 387,513); CoreWeave 424B4 (of 461,310); Snap, Arm and Reddit 424Bs.
- CoreWeave S-1/A of 2025-03-20: cover only. Google S-1/A of 2004-08-13: characters 0–200,000 of 335,688.
- Ritter "IPO Statistics" (dated 2026-10-05): Tables 1, 1a, 7, 10, 11, 13a, 15b, 15c and 23 (raw); the rest of the roughly 90-page file was not read.
- SEC Release 34-90768: about pages 1–11 of 40 (raw).
- Forms 10-K, 10-Q and 8-K: general filing-deadline instructions only (raw).
- Field and Hanka (2001): abstract only, not the paper.
- CS Monitor Facebook piece: one slide of six, behind a paywall.

**Search snippets only** (⚠️, not opened): Google 2004 revised range, price and first-day close; Groupon memo coverage; investor.gov quiet-period glossary; Moore Threads; SpaceX 06-16 close; the Reuters "highly unusual" quote about the fixed price; DealStreetAsia Moonshot confidential filing.

**Could not reach:**
- Blocked: investor.gov (403 to my fetcher); [CNBC Anthropic live page](https://www.cnbc.com/2026/10/26/anthropic-ipo-live-updates-ai-s-1-filing.html) (403); WSGR direct-listing memo (403); CNN Money 2004 Google article (503).
- Too large for the fetcher (over 10 MB), read instead through a browser tab in excerpts: the full Anthropic S-1, SpaceX 424B4 and Figma 424B4.
- Not attempted: OpenAI's original blog post on openai.com; Chen and Ritter's "Seven Percent Solution" paper; the Brav and Gompers lockup paper; Nasdaq and NYSE corporate-governance rule text (independent directors, audit committees); Regulation FD and Regulation M text.
- Covered only in passing or not at all: bake-off practice, guidance practices, Klarna, Circle, Rubrik and Astera Labs. I chose the six most instructive cases, and these four add little beyond them.

**SEC access note:** www.sec.gov blocks scripted requests that lack a contact email in the user-agent header, and I did not supply one, per instructions. EDGAR's full-text search (efts.sec.gov) worked without one. Documents were read through the fetch tool and a browser tab instead.
