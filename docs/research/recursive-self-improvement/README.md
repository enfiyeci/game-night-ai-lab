# Recursive self-improvement: research for a game mechanic (2026-09-26)

Asked by the owner on 2026-09-26: research how the labs describe and measure AI automating AI
research ("RSI"), including an Anthropic post the owner remembered as sorting it into five
categories of recursive loop, so the game can model it realistically. The owner's framing: labs use
AI from the start; the danger grows as the loop closes and as more of the code is written by AI.

## Reading order

1. `notes/anthropic.md`: Anthropic's own material (the RSI essay, the measurement piece, the RSP
   thresholds, the system-card trend). Subagent report; the rows marked **Verified** below were
   checked against the source by the orchestrator.
2. `notes/other-labs.md`: OpenAI, Google DeepMind, Meta, Microsoft, xAI, METR, Epoch, Forethought,
   AI 2027, GovAI. Subagent report; same rule.
3. `notes/game-patterns.md`: how other games model a self-accelerating loop and loss of control.
   Subagent report, not verified.

The notes are raw subagent output kept for provenance. Each carries its own coverage statement and
⚠️ marks for partial reads. Cite the verified rows below, not the raw notes, where they differ.

## Notable catches

- **There is no Anthropic "five loops" post.** The closest is "When AI builds itself" (Anthropic
  Institute, Marina Favaro and Jack Clark, 2026; page shows only an update dated 9/18/2026). It has
  two five-part lists: a five-stage timeline ending in "Closing the loop", and five evidence claims
  (Claude writes the code; the code is good; Claude runs experiments to a goal someone else set;
  Claude proposes experiments; Claude steers research sessions). The owner's memory most likely
  refers to one of these.
- **Share of code written by AI is not speed.** Anthropic reports more than 80% of merged code
  written by Claude (May 2026) and Google 75% of new code (April 2026), yet the best outside
  estimate of Anthropic's overall acceleration is about 1.5x (METR, September 2026). Anthropic's own
  essay says lines of code overstate the gain, and names human review as the new bottleneck
  (Amdahl's law).
- **People overestimate their own speedup.** METR's 2025 trial found experienced developers 19%
  slower with AI while believing they were 20% faster. Anthropic's staff surveys (about 4x) are
  weighted down by Anthropic itself for this reason.
- **Every lab's danger line is about the rate of progress, not the share of code.** Anthropic RSP
  v3.4: "dramatic acceleration" (roughly doubling the rate of capability progress). OpenAI
  Preparedness v2 Critical: a model generation in a fifth of the 2024 time, sustained. Google FSF
  3.1: "ML R&D acceleration" and "automation" levels. None says it has been crossed as of
  2026-09-26; Anthropic's August 2026 Risk Report says it "may cross this threshold in the coming
  year".

## Verified rows (checked by the orchestrator against the source)

| Claim | Source | How checked |
|---|---|---|
| Essay structure: five-stage timeline (Building the first Claude, Chatbots, Coding agents, Autonomous agents, Closing the loop) and the five evidence sections | anthropic.com/institute/recursive-self-improvement | ⚠️ WebFetch summary of the full page, not the raw text |
| More than 80% of merged code authored by Claude as of May 2026; low single digits before Claude Code (Feb 2025); 8x code per engineer; ~4x output (March 2026 poll of 130 staff); ~52x vs ~3x on the training-optimisation task; 97% vs ~23% weak-to-strong gap, ~$18,000, 800 hours; 51% then 64% on research steering | same | same ⚠️ |
| Three futures (trend stalls; compounding gains with humans setting direction; full RSI) and the "slow down or temporarily pause" if others verifiably do | same | same ⚠️ |
| AL0–AL5 scale; Claude "leads" 26% of Anthropic AI R&D work (Aug 2026), above 90% at "collaborates" or higher, 0% fully autonomous; ~15,000 tasks, 378 leaf nodes; ~30,000 agents at once, 100% online-monitored, 0.002% blocked (~1 in 47,000), ~50 high-priority flags a week; ~6% of AI R&D compute on safety, ~12% within AI-driven R&D | anthropic.com/institute/measuring-pace-of-ai-development | ⚠️ WebFetch summary |
| OpenAI self-improvement High ("mid-career research engineer assistant" for every researcher) and Critical (superhuman research-scientist agent, or a generation in 1/5 the 2024 wall-clock time, sustained; response: halt further development) | OpenAI Preparedness Framework v2 PDF (15 Apr 2025) | ⚠️ text extracted locally and searched for the self-improvement sections, not read end to end |
| Google: 75% of new code AI-generated and approved by engineers, up from 50% last fall and ~25% in October 2024; a migration six times faster | blog.google, Cloud Next 2026 (22 Apr 2026) | ⚠️ search results naming the blog post; the post itself not opened |

Everything else in the notes is the subagents' reading and has not been re-checked.

## Numbers a game could use (from the notes; verified ones marked V)

| Metric | Value | Measured or claimed |
|---|---|---|
| Share of Anthropic merged code by Claude | low single digits (early 2025) → >80% (May 2026) V | Lab measure |
| Share of new Google code by AI | ~25% (Oct 2024) → 50% (fall 2025) → 75% (Apr 2026) V | CEO claim |
| Share of Anthropic AI R&D work Claude "leads" | <1% (Feb 2026) → 26% (Aug 2026) (26% V) | Lab measure |
| Overall capability acceleration at Anthropic | ~1.5x, ~30% chance of 2x (Sep 2026) | External, preliminary |
| Staff self-reported uplift | ~4x (Anthropic), 1.4–2x value (METR survey) | Self-report, biased high |
| Experienced developers with AI (2025 RCT) | 19% slower, believed 20% faster | Measured |
| Agents running at once at Anthropic | ~30,000; 1 in 47,000 actions blocked; ~50 flags a week to humans V | Lab measure |
| Safety share of AI R&D compute | ~6% V | Lab measure |
| METR 50% time horizon doubling | ~7 months long-run; 89–105 days since 2024 | Measured |
| Danger lines | Anthropic: progress rate ~2x; OpenAI: generation in 1/5 the time V; Google: "substantially accelerating" | Policy definitions |
| AI 2027 scenario multipliers | 1.5x → 5x (superhuman coder) → 25x → 250x → 2,000x | Scenario, not evidence |
