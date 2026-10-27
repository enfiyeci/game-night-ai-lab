# Compute deals: research and options

Lane `gn-compute-deals`, 2026-10-26. Asked by Arda: "i want the compute deal to work well, so i want a handoff session
to do deep research on how that can be gamified." Research and design only; no game code was changed.

Builds on `docs/research/compute-mechanics/` (September 2026), which designed today's deal system. Read that first if
you have not.

## Reading order

1. **Raw** (unverified; kept for provenance, cite the report instead):
   `research_notes/Compute deals as gameplay/`, five notes written by research subagents.
   - `real_contracts_allocation_financing.md`: contracts, chip allocation, letters of intent, neoclouds, financing
     strings, compute futures.
   - `real_power_sovereign_controls.md`: power, sites, Gulf and sovereign deals, export controls.
   - `games_auctions_drafting.md`: auctions and drafting from a shared market (Power Grid read from its rulebook).
   - `games_contracts_debt_shocks.md`: timing bets, negotiation against AI, debt and strings, telegraphed shocks.
   - `videogames_realtime_markets_allocation.md`: real-time markets (Offworld Trading Company), timed offers, and
     allocation screens that confuse or work.

   Two cautions apply to all five. The fetch tool returned a model-written extraction of each page, not raw text, so
   "read in full" means the tool reported the whole page. Some board-game rule text comes from RulesPal, an
   AI-generated rules site. Each note flags its partial reads with ⚠️ on the claim.
2. **Distilled:** `reports/Compute deals as gameplay.md`, the synthesis of the five notes plus the earlier research.
   Flags carry over on the claims.
3. **Measured:** `diagnosis.md`, what the player decides about compute today, measured with the bots and one
   play-through. Evidence in `evidence/` (screenshots) and `tools-probes/` (the read-only probe scripts and their
   output; run them with `node tools-probes/<file>.mjs <worktree path> <seeds>`).
4. **Options:** `options.md`, seven mechanic options (O1 to O7) from safe to experimental, with the recommended
   combination (O1, O4, O2). The picker page is `picker.html`, published at
   https://claude.ai/artifact/L5gX3dw7AZQ4gAGe9jPeoL.
5. **Build plan:** `build-plan.md`, a draft for the recommended picks, rewritten once Arda's picks are saved.

The diagnosis and options were reviewed by a fresh Opus subagent (verdict REVISE; all 21 findings fixed). The
reviewer's probes are kept as `tools-probes/review-*.mjs`.

## Notable catches

- **Era 2 stall, silent.** For the balanced bot, no training run fits on 7,132 of 7,280 era 2 days (20 seeds): users
  take about 84% of online compute. A one-round card that would end it was often on the board; the bots miss it because of
  their own rules, and the game never points at it.
- **Era 3 cliff.** The balanced and careful bots have 0 compute online in the first era 3 round on 50 of 50 seeds,
  because their early contracts all end at once.
- **One quiet lever.** Without the era 2 grid reservation, the balanced bot is overtaken 69 times in 200 runs
  instead of 5. (The careful bot's 200 of 200 is confounded by its bot rules; see the diagnosis.)
- **Corrections to the September research.** GPU contract prices rose about 40% from October 2025 to March 2026
  (they were reported as falling); the ERCOT large-load queue is now 474 GW (was 238 GW); the Data Center Watch
  "$64B + $68B" figure joined two different reports; Suburbia's row rule was misdescribed.
