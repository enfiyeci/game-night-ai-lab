# How AI benchmarks are introduced, maxed out and replaced

Short memo, 2026-09-26, behind the per-era benchmark tests in `sim/data/launch.js` (spec section 6f). A research
subagent checked fifteen claims against sources; its report is summarised here. Pages it read in full are listed
under each claim; claims it saw only as search-result snippets carry ⚠️. The orchestrator added the three rows
marked "orchestrator", from search snippets only.

## The pattern the game copies

1. **The skill stays, the named test changes.** Coding went HumanEval (July 2021) → SWE-bench (October 2023) →
   SWE-bench Verified (OpenAI, August 2024) → SWE-bench Pro (Scale AI, September 2025).
2. **A new test starts where top models score very low.** At launch: GPQA, strongest GPT-4 baseline 39% (PhD experts
   65%); SWE-bench, about 2%; FrontierMath, no model above 2%; Humanity's Last Exam, best model about 9% (DeepSeek-R1);
   ARC-AGI-2, reasoning systems in single digits; ARC-AGI-3 (March 2026), every frontier model under 1%.
3. **It then fills up within one to two years.** Stanford's AI Index: "evaluations intended to be challenging for
   years are saturated in months"; MMMU, GPQA and SWE-bench gained 18.8, 48.9 and 67.3 points from 2023 to 2024.
   MMLU reached the high 80s by 2024 (GPT-4o 88.7%); GPQA Diamond passed 80% in early 2025; SWE-bench Verified
   passed 70% by September 2025.
4. **Leaderboards retire saturated tests on purpose.** ⚠️ Hugging Face's Open LLM Leaderboard v2 (June 2024)
   swapped MMLU, HellaSwag, GSM8K and others for MMLU-Pro, GPQA, MATH Level 5, IFEval, BBH and MuSR; the
   leaderboard was later retired (snippets only; the announcement page did not render).
5. **Safety tests moved with the risks.** TruthfulQA (2021, repeating falsehoods) → HarmBench and StrongREJECT
   (February 2024, jailbreaks and refusals) → Apollo Research's in-context scheming evaluations (December 2024) →
   ⚠️ 2025 papers finding models can tell when they are being tested (snippets only). The game's eval gaming from
   era 3 matches this.
6. **Old public tests leak into training data.** GSM1k (May 2024) found drops of up to 8 points moving from GSM8K
   to a held-out copy; ⚠️ LiveCodeBench and LiveBench keep refreshing their questions for that reason.

## Tests the game parodies

| Game name | Real test | Checked |
|---|---|---|
| Hello Function | HumanEval (2021) | read in full |
| Patchwork | SWE-bench (2023) | read in full |
| Terminal Velocity | Terminal-Bench 2.0 (October 2025, 89 terminal tasks) | ⚠️ orchestrator, snippets |
| Replicate the Paper | PaperBench (April 2025, best agent 21%) | ⚠️ snippets |
| Pub Quiz of Everything | MMLU (2020) | read in full |
| Frontier Sums | FrontierMath (November 2024) | read in full |
| Errand Runner | the 2023 agent demos (no single benchmark) | not a benchmark |
| Desktop Olympics | OSWorld (2024; best model 12%, humans 72%) | ⚠️ orchestrator, snippets |
| Task Horizon | METR time horizons (March 2025; doubling about every 7 months, faster since 2024) | read in full |
| Research Speedup | METR RE-Bench (November 2024) | ⚠️ snippets |
| The Bar Exam | GPT-4's 2023 bar-exam claim | not checked |
| Humanity's Final Final Exam | Humanity's Last Exam (January 2025) | read in full |
| Truthiness Test | TruthfulQA (2021) | not re-read |
| Jailbreak Gauntlet | HarmBench (February 2024) | read in full |
| Scheming Sandbox | Apollo in-context scheming (December 2024) | read in full |
| Control Room | AI control: Redwood Research (2023), UK AISI ControlArena | ⚠️ orchestrator, snippets |

Unsolved Problems Board and Humanity's Actually Final Exam are inventions for era 5 with no real counterpart yet.

## Sources read in full by the subagent

arxiv.org/abs/2009.03300 (MMLU), arxiv.org/abs/2406.01574 (MMLU-Pro), arxiv.org/abs/2107.03374 (HumanEval),
arxiv.org/abs/2311.12022 (GPQA), epoch.ai/frontiermath/tiers-1-4/the-benchmark,
arcprize.org/blog/announcing-arc-agi-2-and-arc-prize-2025, arcprize.org/blog/analyzing-o3-with-arc-agi,
metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/, metr.org/blog/2026-1-29-time-horizon-1-1/,
swebench.com/verified.html, scale.com/blog/swe-bench-pro, agi.safe.ai, hai.stanford.edu/news/ai-benchmarks-hit-saturation,
arxiv.org/abs/2412.04984 (Apollo scheming), arxiv.org/abs/2405.00332 (GSM1k), arxiv.org/abs/2402.04249 (HarmBench).

Could not reach: openai.com/index/introducing-swe-bench-verified/ and openai.com/index/gdpval/ (both 403).
