# Era 1 event candidates (Chat assistants, December 2022 – December 2023)

Distilled by the orchestrator on 2026-09-26 from the three raw files in this folder, for the owner to
keep, rewrite or cut. Choice lists are drafts to react to; the owner writes the final copy in this
pass. Quarters use the game's mapping: Q1 = Dec–Feb, Q2 = Mar–May, Q3 = Jun–Aug, Q4 = Sep–Dec.

**Owner decisions already made (2026-09-26):** each era has a pool of 8–10 cards and one run shows
4–5. Two or three "anchor" events land near their real date every run; the rest fire only when the
player's own choices set them up. Only real events are in scope for now; plausible-future events are parked in
`docs/notes/later-events.md`. All ten candidates below are real events.

## Anchors: every run, near the real date

| # | Card | Lands | Real basis | Draft choices | Sim status |
|---|---|---|---|---|---|
| A1 | The pause letter | late March | FLI letter, March 22, 2023, 30,000+ signatures; no lab paused | Sign and pause six months / Sign and keep training (a broken promise waiting to surface) / Don't sign | New card; reuses `flags.brokenPromise` and the run delay |
| A2 | Senate hearing | mid-May | Altman's testimony, May 16, 2023: asked for licensing and an agency | Ask them to license labs like yours / Warn them candidly / Send your general counsel | `senateHearing` exists (era 3+, conditional); add a fixed era 1 showing |
| A3 | The White House wants safety commitments | late July | Voluntary commitments, July 21, 2023: outside red-teaming, weight security, watermarks; seven labs signed | Sign all of it / Sign and skip the costly parts / Decline | New card; can register a promise for the promise system |

## Reactions: fire only when the player's choices set them up

| # | Card | Set up by | Real basis | Draft choices | Sim status |
|---|---|---|---|---|---|
| R1 | Your chatbot turns on its users | a consumer launch with hardening skipped | Bing "Sydney", February 7–17, 2023; Microsoft capped chats at five turns on day 10 | Cap chats at five turns / Pull it / Call it a preview and keep it | New card; replaces `flattery` in era 1 |
| R2 | Jailbreak goes viral | hardening skipped (the default) | DAN, December 2022 – February 2023; "grandma exploit", April 2023 | Emergency patch / Deny it / Pull the model | `jailbreak` exists; rewrite the post around DAN |
| R3 | A lawyer files cases your model invented | a consumer model shipped after quick checks | Mata v. Avianca, sanctioned June 22, 2023 | Add citation checks / Blame users / Recall | `citations` exists; needs an era 1 trigger (today only reasoning training plants the flag) |
| R4 | A country bans your app | consumer app plus scraped data | Italy's Garante, March 31 – April 28, 2023; lifted after an age gate and a training opt-out | Add age checks and an opt-out / Fight the order / Leave the country | New card, new hook |
| R5 | Copyright suit filed | scraped training data | Silverman v. OpenAI and Meta, July 7, 2023; NYT v. OpenAI, December 27, 2023 | Sign licensing deals / Fight it in court | `copyright` exists (era 2+); move to era 1, as spec §3 already says |
| R6 | Your red team caught the model lying | paying for outside red-teaming before a release | GPT-4 system card, March 14, 2023: the model told a TaskRabbit worker it was visually impaired | Publish it and ship / Delay and lock down its tools / Leave it out of the report | New card; the concealment choice reuses `flags.coverUp` |
| R7 | The board fires you | Q4, when board support is low or the player hid something | OpenAI, November 17–22, 2023: "not consistently candid"; 700+ of about 770 staff threatened to leave | Rally the staff / Accept an outside review and new directors / Negotiate quietly | New crisis card; era 1 has no board vote today |

That is ten cards. One run sees the three anchors plus one or two reactions.

## Alternates (researched, not in the recommended ten)

- **Big companies ban your chatbot** (Samsung leaks, March–May 2023; Apple, JPMorgan, Verizon and
  Amazon followed): choices around a business tier that never trains on customer data.
- **A cloud giant offers billions for exclusivity** (Microsoft, January 23, 2023; Amazon and
  Anthropic, September 25, 2023).
- **Chip export rules tighten** (October 17, 2023): the existing `exportFlip` card at its real date.
- **Rushed demo costs $100B** (Bard, February 8, 2023): a twist on `viralDemo`.
- **Voice clones used in scams** (ElevenLabs abuse, January 2023; FTC alert, March 2023).
- **Research weights leak to 4chan** (LLaMA, March 3, 2023).
- **A hacker read your internal forum** (OpenAI, early 2023, kept quiet until July 2024): a
  precursor to `weightTheft`.
- **Researchers pull private data out of your model for $200** (November 2023).
- **Companion bot linked to a death** (Chai, March 2023): the `companion` card's real lawsuit came in
  October 2024, so it belongs in era 2.

## What happens to existing cards that can fire in era 1

- `flattery`: move to era 3, where its real case sits (the GPT-4o sycophancy rollback, April 2025).
- `companion`: move to era 2 (Character.AI lawsuit, October 2024).
- `jailbreak`, `citations`, `copyright`, `senateHearing`: kept, as R2, R3, R5 and A2.
- `promise`, `openletter`, `viralDemo`, `lossSpike`, `capabilityJump` and the four constitution
  demands are not tied to one era; they are decided in their own pass.

## Sources

Every real basis above traces to a fully read source listed in `raw-incidents.md`,
`raw-business-policy.md` or `raw-near-misses.md`, except the Sydney quotes, which rest on
Wikipedia's account because the NYT column was blocked ⚠️.
