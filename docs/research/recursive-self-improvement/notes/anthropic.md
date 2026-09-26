# Anthropic on recursive self-improvement (subagent report, 2026-09-26)

Output of an Opus research subagent, condensed by the orchestrator (wording tightened, no facts added), kept for provenance. Not re-checked except the rows marked
Verified in `../README.md`. The ⚠️ marks and the coverage statement are the subagent's own.

## Bottom line

No Anthropic post sorts RSI into five categories of "recursive loop". The closest match is the
Anthropic Institute essay "When AI builds itself: Our progress toward recursive self-improvement,
and its implications" by Marina Favaro and Jack Clark (https://www.anthropic.com/institute/recursive-self-improvement).
It has two five-part structures: a five-stage timeline ending in "Closing the loop" (an outside
survey, arXiv 2607.07663, calls it "Anthropic's five-stage spectrum"), and five bolded evidence
claims, one per part of the AI-development loop being automated. A search-engine summary described
the argument as "several distinct loops" (coding, code review, experiment execution, research
navigation, outcome-gradable research); the page that wording came from was not found.

## A. "When AI builds itself"

⚠️ Publication date not on the page (only "Update 9/18/2026"); search snippets and an X post say
June 4, 2026; MindStudio discussed it June 7, 2026; arXiv 2607.07663 says May 2026. Text read in
full; charts seen only as alt text.

Framing: AI development is engineering plus research. Claude now supplies the "method"; humans
still supply the "goal". The remaining gap is "judgement in choosing goals".

Five-stage timeline:
1. 2021–2023 "Building the first Claude": people writing code and docs.
2. 2023–2025 "Chatbots": short snippets copied into editors.
3. 2025–2026 "Coding agents": agents write and edit whole files.
4. Today "Autonomous agents": agents run code and hand hours of work to other agents.
5. "20XX?" "Closing the loop": agents build and train models; Claude improves Claude.
Anthropic places itself at stage 4: "We are not there yet", and full RSI is not inevitable.

Five evidence claims:
1. "Claude writes a significant proportion of Anthropic's code." More than 80% of merged code
   written by Claude as of May 2026, from low single digits before Claude Code's February 2025
   preview. Lines merged per engineer per day flat 2021–2024, rising 2025, steeper 2026; 8x in
   Q2 2026 versus 2024 (the introduction says versus 2021–2025). Lines of code overstate real
   gains. March 2026 poll of 130 research staff: median about 4x output with Mythos Preview.
   April 2026: over 800 fixes cutting a class of API errors 1000x, estimated four years of human work.
2. "The code that Claude writes is 'good' and improving." Staff correct or take over less often.
   Open-ended session success 76% in May 2026, up 50 points in six months (Claude-judged). Quality
   worse than human in late 2025, "roughly at parity" now, better "within the year". An automated
   Claude reviewer would have caught about a third of the bugs behind past incidents.
3. "Claude is good at running experiments to hit a goal that someone else has set." Small-LLM
   training-optimisation speedup ~3x (Opus 4, May 2025) → ~52x (Mythos Preview, April 2026); a
   skilled human gets ~4x in 4–8 hours. "super helpful to superhuman in under a year."
4. "Claude is getting better at proposing its own experiments." April 2026 automated weak-to-strong
   research: humans recovered ~23% of the gap in a week, agents 97% over 800 cumulative hours for
   ~$18,000 compute. Caveats: did not transfer to production scale; humans chose the problem and rubric.
5. "Claude is getting better at steering research sessions towards research findings." 129 detour
   moments (Jan–Mar 2026); Claude-judged better than the human's next step 51% (Opus 4.5, Nov 2025)
   and 64% (Mythos Preview, Apr 2026). Control: on 127 strong-human moments, models won ~20%.

Rest of the essay: human advantage is "research taste and judgment"; Amdahl's law already bites
(human code review is a bottleneck). Three futures: trend stalls (not likely); compounding
efficiency with humans setting direction ("likely heading into this"); full RSI. Policy: Anthropic
"would slow down or temporarily pause" if other frontier developers verifiably did the same.

Companion piece: "Measurements for understanding the pace of AI development inside frontier labs"
(https://www.anthropic.com/institute/measuring-pace-of-ai-development; Favaro and Phillie Wright;
⚠️ date Sept 17, 2026 from secondary coverage). Three measurements:
1. Anthropic R&D Automation Index on Epoch's AL0–AL5 scale. August 2026: no area fully autonomous;
   Claude "leads" (AL4) 26% of AI R&D work (alt text: up from under 1% in February 2026); >90% at
   AL3 or above. ~15,000 tasks from July 2026, 378 leaf categories; Claude judge agreed with humans
   59%, humans with each other 35%.
2. Oversight: ~30,000 agents at once; 100% of actions pass the online monitor; 0.002% of over a
   billion decisions blocked (~1 in 47,000); ~50 flags a week escalated to humans.
3. Compute (one week, July 2026): ~6% of AI R&D compute on safety; ~12% of AI-driven AI R&D compute.

Related, not official: Import AI 455 (Jack Clark, May 4, 2026): ~60% chance of "no-human-involved
AI R&D" by end of 2028, 30% by 2027. Other five-level taxonomies: arXiv 2609.11873 "The Last AI
Built by Humans" (⚠️ abstract only); Epoch's AL0–AL5 has six levels. Claude blog "Loop
engineering" (June 30, 2026) is product guidance, not RSI.

## B. RSP thresholds

Versions: v2.0 (Oct 15, 2024) added AI R&D; v2.1 (Mar 31, 2025) split it in two; v2.2 (May 14,
2025); v3.0 (Feb 24, 2026) rewrite; v3.1–v3.3 (Apr–May 2026); v3.4 current (effective July 8, 2026).

RSP v2.2 (⚠️ threshold sections only): AI R&D-4 "fully automate the work of an entry-level,
remote-only Researcher at Anthropic" → ASL-3 security plus an affirmative misalignment case.
AI R&D-5 "dramatic acceleration in the rate of effective scaling" (a year's scaleup equal to two
years at the 2018–2024 average) → at least ASL-4 security. Earlier checkpoint: 2–8 hour software tasks.

RSP v3.4 (read in full): threshold "Automated R&D in key domains", met if Claude could "fully
substitute for our entire set of Research Scientists and Research Engineers" at within 5x cost, or
"dramatic acceleration" (double the rate of aggregate capability progress versus both the expected
rate and the fastest sustained rate over three generations, attributable to automated R&D). Worked
example: 9x effective scaleup a year becoming ~81x. Changelog: "intended to capture the onset of
dramatic recursive self-improvement." Mitigations: security moonshots, an "eyes on everything"
state (all critical AI-development activity logged and analysed by AI), interpretability and
red-teaming alignment assessments, Risk Reports with external review. Crossing makes a model
"highly capable": mandatory external review and the competitor-contingent commitments (e.g. delay
if clearly in the lead). Sabotage Risk Report for Opus 4.6 published Feb 10, 2026.

August 2026 Risk Report (⚠️ sections 1–1.4, 3, 5.1, 6.6 of 186 pages): automated-R&D risk "Low";
internal R&D "significantly faster ... but not yet by a factor of 2"; task evals "saturated"; the
threat could be "a major concern in the next 6–12 months"; Anthropic "may cross this threshold in
the coming year"; "eyes on everything" target January 1, 2027, not yet met; new CoBench (449 real
root-cause problems), 85% taken as the bar for substituting for staff.

## C. System-card trend (⚠️ AI R&D sections only for each card)

| Model (card date) | Key AI R&D evidence | Staff survey | Conclusion |
|---|---|---|---|
| Opus 4 (May 2025) | LLM training 2.99x (threshold 4x); kernel 72.65x | 0/4 say it automates a junior researcher | Below |
| Sonnet 4.5 (Sep 2025) | LLM training 5.5x, first above 4x | 0/7 | Below AI R&D-4; checkpoint "arguably" reached |
| Opus 4.5 (Nov 2025) | Kernel 252x, LLM training 16.5x; Suite 2 0.604 | Median uplift 100% | Ruling out "increasingly difficult" |
| Opus 4.6 (Feb 2026) | Evals saturated; LLM training 34x | Median 100% | "Gray zone"; sabotage report |
| Mythos Preview (Apr 2026) | LLM training 51.9x; trend slope 1.86–4.3x | 1/18 say already a drop-in replacement; ~4x | Least confidence yet |
| Opus 4.7 (Apr 2026) | +1.0 above trend (Mythos Preview +5.8) | 130-person poll ~4x | Does not cross |
| Fable 5 / Mythos 5 (Jun 2026) | Capability index 161.29, no further acceleration | Gains "concentrated in engineering execution rather than research judgment" | Does not cross |
| Fable 5.1 / Mythos 5.1 (Sep 2026) | CoBench below 85%; Mythos Preview jump "a one-time event"; METR suspects 4x overestimated | — | Does not cross |
| Opus 5.5 (Sep 22, 2026) | CoBench 2.1 55.8%; one-time jump fits better than a trend break in 99/100 resamples; METR cites ~1.5x overall, ~30% chance of 2x | — | Does not cross |

## D. Share of code

1. Mar 10, 2025, Dario Amodei at CFR: AI "writing 90 percent of the code" in 3–6 months (general
   forecast). ⚠️ code passages only.
2. Apr 28, 2025, Economic Index: 79% of Claude Code conversations "automation" vs 49% on Claude.ai.
3. ⚠️ Oct 2025, Amodei reportedly "70, 80, 90% of code" touched by AI at Anthropic (Fortune, secondary).
4. Dec 2, 2025, "How AI is transforming work at Anthropic": Claude's share of daily work 28% → 59%;
   self-reported productivity +20% → +50%; merged PRs per engineer per day +67%; 27% of
   Claude-assisted work "wouldn't have been done otherwise"; most staff "fully delegate" 0–20%.
5. 2026 essay: >80% of merged code (conservative; leadership publicly says "90% or more" counting scripts).
6. Aug 14, 2026 Risk Report: Claude "authors a large majority of the code merged into our production codebases."
7. Sep 2026: Claude "leads" 26% of model R&D tasks.

## E. Coverage (subagent's statement, condensed)

Read to the end: the RSI essay (charts as alt text), the measurement piece, the Institute index and
agenda, the RSP page and v3.4 PDF, Import AI 455, MindStudio, the loops blog, the two Anthropic
research posts, and the AI R&D sections of the Opus 5, Fable 5.1/Mythos 5.1 and Opus 5.5 cards.
Partial ⚠️: August 2026 Risk Report; RSP v2.2; the earlier system cards (AI R&D sections only);
arXiv 2607.07663 and 2609.11873; the CFR transcript; Fortune; the-decoder via summariser. Not
opened: February 2026 Risk Report, Opus 4.6 sabotage report, METR's review, Sonnet 4.6/5 cards,
Frontier Safety Roadmap, the weak-to-strong alignment-blog post, press coverage. Not found: any
five-loop taxonomy from or attributed to Anthropic.
