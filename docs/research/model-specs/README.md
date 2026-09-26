# Model specs research (2026-09-26)

This is research behind the game's constitution content: the era 1 principles, the era 3 full
constitution, and the motto words. Five research subagents each downloaded the raw text of their
sources and read it to the end. The orchestrating session then read all five notes in full and
re-checked the key quotes against the raw text: the 2023 principle wordings, the seven 2026 hard
constraints, "holistic rather than strict", "even if the request comes from Anthropic itself", and
the OpenAI authority tags on "Do not lie" and "Don't be sycophantic".

The raw extracted text was not committed, because of its size and because some of the news and blog
text is copyrighted. It lived in the session scratchpad. Every source is named with its URL in the
notes. Claude's 2026 constitution and OpenAI's Model Spec are both CC0 (public domain), so their
wording can be reused freely.

## Reading order

1. `proposals.md` is the synthesis. It has a one-page comparison of the real documents, the
   recommended structure, the 10 era 1 principles, the era 3 rewrites and cases, the motto words
   (each with the situation where it bites in play) and the decisions left to the owner.
2. `notes/claude_2023.md` covers Claude's May 2023 constitution (all 58 principles), the
   Constitutional AI paper, Collective Constitutional AI, "Claude's Character" (2024) and Specific
   versus General Principles.
3. `notes/claude_2026.md` covers the January 2026 constitution, read end to end: its structure,
   priority order, the seven hard constraints, honesty, corrigibility, and all 82 worked examples.
4. `notes/openai_model_spec.md` covers the current Model Spec (2026-08-18) read in full, the May 2024
   original, every revision diff since February 2025, and both April and May 2025 sycophancy
   postmortems.
5. `notes/other_labs_specs.md` covers DeepMind's Sparrow rules, Google's Gemini guidelines and AI
   Principles (2018 against 2025), Meta, xAI's Grok prompts, Bing's "Sydney" rules, China's Interim
   Measures, US executive order 14319 with the OMB memo, and Character.AI.
6. `notes/lab_missions.md` covers real labs' mission wording and how it shifted, used for the motto
   words.

## Coverage gaps (⚠️, carried from the notes)

- ⚠️ `claude_2023.md`: the live 2023 page wasn't compared against a 2023 Wayback copy. Figures came
  through as captions only. The Collective Constitutional AI policy memo, the Polis report and the data
  were not opened. In the public-versus-Anthropic comparison PDF, the bold overlap marks were lost in
  extraction.
- ⚠️ `claude_2026.md`: the PDF edition was compared with the web edition by script, not reread (they
  match apart from small edits). The late-2025 "soul document" was not read.
- ⚠️ `openai_model_spec.md`: the February 2025 spec was not read end to end. The per-revision blog
  posts, the rendered site and the evals repo were not opened. The note's remarks about Anthropic were
  written from memory and are superseded by `claude_2026.md`.
- ⚠️ `other_labs_specs.md`: these rest on search snippets only: the two 2025 Grok incidents, the
  Character.AI lawsuit and settlement, DeepSeek's refusal rates, Microsoft's Responsible AI Standard,
  and Mistral and Cohere. Reuters' own Meta article was blocked, so TechCrunch's report of it was used.
  The OMB memo was read about two-thirds of the way. China's TC260 standard was not reached.
- ⚠️ `lab_missions.md`: xAI's page was read from a Wayback copy. DeepSeek's "unravel the mystery of
  AGI" line is second-hand. No mission statement was found for Qwen or Amazon. China's 2017 plan was not
  fetched. The US AI Action Plan was read through its introduction only. Anthropic's "safely makes the
  transition" line is confirmed in the 2026 constitution, which `claude_2026.md` read in full.

## Notable catches

- The real history runs from soft principles in 2023 (no ranking, no absolute rules) to hard
  constraints in 2026. The P1 mock has it the other way round; `proposals.md` section 2 addresses this.
- The 2023 constitution has no principle against flattery and none about agents taking actions.
- OpenAI makes honesty a user-level default that an explicit instruction can override. Anthropic
  treats it as nearly absolute. This is the sharpest contrast between the two.
- Several examples guessed in the research brief don't exist in the OpenAI spec, including a tax-fraud
  agent and a "tell me I'm right" dialogue. The note names the nearest real ones.
- One real permissive rule is deliberately not offered as a player option: Meta's leaked 2025 standard
  allowing romantic chats with minors.
