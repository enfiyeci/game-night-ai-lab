# Pretraining decisions at frontier AI labs (2023–2026)

Assigned scope: the real, concrete decisions a frontier lab makes during pretraining of a
large language model, sourced from primary technical reports, for use as a game-design
options menu. Today's date for this research: 2026-09-25.

Note on method: every source below was retrieved and read via an automated fetch-and-extract
tool (WebFetch), which downloads the full page and then uses a smaller model to answer a
targeted extraction prompt against that full text — I did not personally scroll the raw HTML
end to end. For the arXiv papers this was run against the full HTML paper (`arxiv.org/html/...`
or `ar5iv.labs.arxiv.org/html/...`), not just the abstract page, except where noted. Because
the extraction step is itself a model summarizing a long document, there is a real chance it
missed or slightly mis-stated a number the underlying paper actually contains — treat any
number below as "as reported by this extraction pass," and re-check against the primary PDF
before shipping a number into the game as ground truth. Every "not stated" or "not mentioned"
below could mean either "genuinely absent from the report" or "present but not surfaced by the
extraction prompt" — I could not fully distinguish the two without a second full manual pass.

---

## Scale: parameters, tokens, tokens-per-parameter, FLOPs, cost, and overtraining

### Takeaway
Frontier and open-model labs in 2023–2026 have split into two regimes: train near
Chinchilla-optimal (~20 tokens/parameter) when the model itself is the product and inference
volume is modest, or deliberately "overtrain" far past that ratio (hundreds to thousands of
tokens per parameter) when a smaller, cheaper-to-serve model is the product and expected
inference volume is large — a choice with its own named economics (inference-adjusted scaling
laws), not just an engineering afterthought.

### Cited Findings
- Chinchilla (Hoffmann et al. 2022): compute-optimal training scales parameter count and
  training tokens equally with compute (N∝C^0.5, D∝C^0.5 by the first two of three
  independent methods used; the third, a parametric loss fit, gave a=0.46, b=0.54). For
  Gopher's compute budget (5.76×10²³ FLOPs) the optimal model was estimated at 40–70B
  parameters; the paper's Chinchilla model used 70B parameters on 1.4T tokens (~20
  tokens/parameter) versus Gopher's 280B parameters on ~300B tokens (~1 token/parameter) —
  [Chinchilla paper](https://arxiv.org/abs/2203.15556).
- Chinchilla (70B, compute-matched to Gopher) beat Gopher (280B) on MMLU (67.6% vs 60.0%),
  LAMBADA (77.4% vs 74.5%), and BIG-bench average (65.1% vs 54.4%, a 10.7-point gain), and also
  beat GPT-3 (175B), Jurassic-1 (178B), and Megatron-Turing NLG (530B) on most tasks despite
  being far smaller — [Chinchilla paper](https://arxiv.org/abs/2203.15556).
- The Chinchilla paper itself optimizes only for training compute and does not model inference
  cost as part of the objective — [Chinchilla paper](https://arxiv.org/abs/2203.15556).
- Llama 3 405B (dense) was pretrained on "about 15T multilingual tokens" (stated elsewhere in
  the same report as "15.6T text tokens"), using 3.8×10²⁵ FLOPs, on up to 16,384 H100 GPUs
  inside a 24K-GPU three-layer Clos-network cluster. 15.6T tokens / 405B parameters ≈ 38.5
  tokens/parameter for the flagship model — [Llama 3 "Herd of Models"](https://arxiv.org/abs/2407.21783).
- Llama 3 8B was trained on the same family's ~15T-token corpus at 8B parameters, i.e. roughly
  1,875 tokens/parameter — about 95× the Chinchilla-optimal ratio of ~20 — according to
  secondary analysis of the Llama 3 release; I could not independently confirm the exact 8B
  token count from the primary report excerpt I read, so this figure should be checked against
  the primary table before use — [search-derived summary, unconfirmed against primary table] (⚠️ not verified against the primary report's own per-size token table; only the 405B figures were confirmed from the primary text I read).
- DeepSeek-V3: 671B total parameters, 37B activated per token (MoE), pretrained on 14.8T
  tokens; total training cost reported as 2.788M H800 GPU-hours (2,664K pretraining + 119K
  context extension + 5K post-training), estimated at $5.576M assuming $2/GPU-hour —
  [DeepSeek-V3 technical report](https://arxiv.org/abs/2412.19437).
- Kimi K2: 1.04T total parameters, 32B activated, pretrained on 15.5T tokens "with zero loss
  spike" — [Kimi K2 report](https://arxiv.org/abs/2507.20534).
- Qwen2.5 family: dense models at 0.5B/1.5B/3B/7B/14B/32B/72B, plus proprietary MoE variants
  Qwen2.5-Turbo/Plus; pretraining data scaled from 7T tokens (Qwen2) to 18T tokens (Qwen2.5) —
  [Qwen2.5 technical report](https://arxiv.org/abs/2412.15115).
- Qwen3 family: dense models 0.6B/1.7B/4B/8B/14B/32B, MoE models 30B-A3B (128 experts, 8
  active) and 235B-A22B; pretrained on 36 trillion tokens across 119 languages/dialects (up
  from 29 languages in Qwen2.5) — [Qwen3 technical report](https://arxiv.org/abs/2505.09388).
- Gemma 3: four sizes with matched pretraining token budgets — 1B (2T tokens), 4B (4T tokens),
  12B (12T tokens), 27B (14T tokens) — [Gemma 3 technical report](https://arxiv.org/abs/2503.19786).
- gpt-oss-120b: 116.83B total / 5.1B active parameters per token; gpt-oss-20b: 20.91B total /
  3.6B active. gpt-oss-120b required 2.1 million H100-hours to train; gpt-oss-20b needed "almost
  10x fewer" (roughly ~210K H100-hours) — [gpt-oss model card](https://arxiv.org/abs/2508.10925).
- SmolLM3 (Hugging Face): 3B parameters trained on 11.2T tokens, i.e. roughly 3,700
  tokens/parameter — a small model overtrained far beyond Chinchilla, on 384 H100 GPUs for 24
  days — [SmolLM3 blog](https://huggingface.co/blog/smollm3).
- DCLM-Baseline dataset lets a 7B model reach 64% 5-shot MMLU using 2.6T tokens (~370
  tokens/parameter), described as comparable to Llama 3 8B's 66.2% MMLU (trained on ~15T
  tokens) while using "6.6x less compute" — [DCLM paper](https://arxiv.org/abs/2406.11794).
- "Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws"
  (Sardana et al.) directly formalizes the overtraining decision: it computes the optimal
  parameter count and pretraining data size jointly for a target model quality *and* an
  expected inference demand, not training compute alone, and finds that "LLM researchers
  expecting reasonably large inference demand (~1B requests) should train models smaller and
  longer than Chinchilla-optimal," validating quality improvements out to tokens-per-parameter
  ratios "up to 10,000," based on 47 models trained across sizes — [Beyond Chinchilla-Optimal](https://arxiv.org/abs/2401.00448) (⚠️ I read only the abstract-level summary returned by the fetch tool, not the full paper body; the exact functional form of the modified scaling law and the ~1B-request threshold's precise derivation were not confirmed against the full text).
- Epoch AI's own analysis states that from 2020 to March 2023 frontier labs trained to minimize
  training compute for a fixed capability level (Chinchilla-style); after GPT-4 (March 2023)
  inference demand surged, and frontier model parameter counts fell even as capability rose —
  citing GPT-4 (~1.8T parameters, March 2023) versus GPT-4o (~200B, 2024) and Claude 3.5 Sonnet
  (~400B estimated, 2024) as smaller, presumably-more-overtrained successors — [Epoch AI, "Frontier language models have become much smaller"](https://epoch.ai/gradient-updates/frontier-language-models-have-become-much-smaller) (⚠️ these parameter counts for closed models are Epoch's own estimates, not confirmed by the labs; treat as informed estimate, not disclosed fact).
- Epoch AI training-cost analysis: amortized hardware+energy cost of the final training run for
  frontier models has grown "at a rate of 2.4x per year since 2016" (95% CI 2.0–3.1x/year);
  cost composition for studied models (GPT-3, OPT-175B, GPT-4, Gemini Ultra) was roughly 47–67%
  hardware, 29–49% R&D staff, 2–6% energy; Gemini Ultra's estimated power draw was 35MW —
  [Epoch AI, "How much does it cost to train frontier AI models?"](https://epoch.ai/blog/how-much-does-it-cost-to-train-frontier-ai-models).
- Epoch AI's separate cost-trend page frames the same phenomenon as costs "doubling every eight
  months for the largest AI models" and lists dated cost estimates: GPT-4 $40M (Mar 2023), PaLM
  2 $5M (May 2023), Gemini 1.0 Ultra $30M (Dec 2023), Gemini 1.5 Pro $8M (Feb 2024), Mistral
  Large $10M (Feb 2024), Nemotron-4-340B $20M (Jun 2024), Llama 3.1-405B $50M (Jul 2024), Grok-2
  $30M (Aug 2024), and Grok-4 $500M (Jul 2025) — [Epoch AI, cost trend](https://epoch.ai/data-insights/cost-trend-large-scale) (note: the "doubling every 8 months" framing and the separately-cited "2.4x/year" figure describe the same underlying trend at slightly different points in time/methodology; both are Epoch's own numbers, not contradictory so much as separately-dated estimates).
- Epoch AI projects that if the cost trend continues, the largest training runs will exceed $1
  billion by 2027 — [Epoch AI, cost blog](https://epoch.ai/blog/how-much-does-it-cost-to-train-frontier-ai-models).

### Inferences
- The overtraining decision is best modeled in the game as a lever the player sets per model:
  "target serving volume" (or a proxy like "expected DAU/QPS") should push the optimal
  tokens-per-parameter ratio up, trading more training compute now for cheaper inference later —
  this is exactly the mechanism in the Sardana et al. paper and matches why Llama, Qwen, Gemma,
  and SmolLM3 all ship a family of sizes trained on the *same* huge token budget rather than each
  size getting its own Chinchilla-optimal budget.
- MoE architectures (DeepSeek-V3, Kimi K2, Qwen3-MoE, gpt-oss) are a second, complementary lever
  for the same inference-cost problem: they decouple "total knowledge capacity" (total
  parameters) from "per-token compute cost" (active parameters), which is a different way to buy
  cheap serving than overtraining a dense model.

### Gaps
- I could not confirm Llama 3 8B's and 70B's exact pretraining token counts from the primary
  report text I retrieved (only the 405B figures were confirmed); the widely-cited "8B trained
  on 15T tokens, ~1,875 tokens/parameter" figure comes from secondary/aggregator sources in this
  pass, not a primary-source quote I personally verified.
- I did not find a primary-source table giving total training FLOPs for Qwen2.5, Qwen3, Gemma 3,
  Kimi K2, or gpt-oss (I have GPU-hour or GPU-count figures for DeepSeek-V3, Kimi K2, Llama 3,
  and gpt-oss, but not converted FLOP totals for all of them).
- Multi-token prediction's effect on training/inference cost specifically (rather than pure
  capability) was not covered numerically in any source I read — DeepSeek-V3 states it uses one
  extra prediction depth (D=1) for a "stronger performance" objective, but no cost/benefit split
  was given.

---

## Architecture: dense vs MoE, attention variants, context length, tokenizer, multimodality, multi-token prediction

### Takeaway
By 2024–2026 nearly every frontier-scale open report uses grouped-query attention and trains at
a short context length (4K) before extending to long context (32K–256K) in a separate late
pretraining stage; the biggest split is dense vs mixture-of-experts, where MoE labs (DeepSeek,
Kimi/Moonshot, Alibaba's Qwen3-MoE line, OpenAI's gpt-oss) are converging on very sparse designs
(dozens to hundreds of experts, single-digit-percent active) with a latent-attention variant
(MLA) to cut KV-cache memory, while Google (Gemma 3) instead cuts KV-cache memory by changing
the ratio of local sliding-window to global attention layers.

### Cited Findings
- Llama 3 405B: standard dense Transformer ("does not deviate significantly from Llama and
  Llama 2"), grouped-query attention (GQA) with 8 KV heads, 128K-token vocabulary (100K tiktoken
  base + 28K additional tokens), RoPE base frequency raised to 500,000, 126 layers, 16,384 model
  dimension, 128 attention heads. Pretraining starts at an 8K context window; a separate
  long-context pretraining stage then raises the context window in increments up to the final
  128K window over roughly 800B additional tokens — [Llama 3 report](https://arxiv.org/abs/2407.21783).
- DeepSeek-V3: 671B/37B MoE with 256 routed experts + 1 shared expert, 8 experts activated per
  token; Multi-head Latent Attention (MLA) with KV compression dimension 512, query compression
  dimension 1536, per-head RoPE dimension 64; a multi-token-prediction module (depth D=1,
  predicting one extra token) that keeps a "complete causal chain" at each prediction depth;
  128K-token byte-level BPE vocabulary; context extended from 4K to 32K (1,000 steps) then 32K to
  128K (1,000 steps) via YaRN — [DeepSeek-V3 report](https://arxiv.org/abs/2412.19437).
- Kimi K2: 1.04T/32B MoE with 384 total experts, 8 active per token, 1 shared expert (the report
  frames this as sparsity 48, versus DeepSeek-V3's 256-expert configuration); MLA with 64
  attention heads (deliberately halved from DeepSeek-V3's 128 to cut inference overhead); base
  context window 4,096 tokens, extended to 128K via YaRN in two phases (400B tokens at 4K
  sequence length, then 60B tokens at 32K) — [Kimi K2 report](https://arxiv.org/abs/2507.20534).
- Qwen3: dense sizes 0.6B–32B plus MoE sizes 30B-A3B (128 total experts, 8 active) and
  235B-A22B; 151,669-token vocabulary; three-stage pretraining pipeline — Stage 1 "General"
  (~30T tokens at 4,096 context), Stage 2 "Reasoning" (~5T higher-quality STEM/code-weighted
  tokens, still at 4,096 context), Stage 3 "Long Context" (hundreds of billions of tokens at
  32,768 context, with 75% of documents 16,384–32,768 tokens long and 25% at 4,096–16,384) —
  [Qwen3 report](https://arxiv.org/abs/2505.09388).
- Qwen3 also uses "strong-to-weak distillation" (off-policy then on-policy distillation from the
  32B or 235B-A22B teacher) to build the smaller models, reported to cost about 1,800 GPU-hours
  versus 17,920 GPU-hours for reinforcement learning to reach comparable post-training quality —
  roughly a 10x compute saving for that stage — [Qwen3 report](https://arxiv.org/abs/2505.09388).
- Qwen2.5: dense 0.5B–72B plus proprietary MoE Turbo/Plus variants using "fine-grained expert
  segmentation and shared experts routing"; 151,643-token BBPE vocabulary; GQA, SwiGLU, RoPE with
  QKV bias and pre-norm RMSNorm; pretraining context starts at 4,096, extended to 32,768 in the
  final stage (except Turbo), then further extended via YaRN + Dual Chunk Attention to 131,072
  tokens for most sizes (1,000,000 for Turbo) — [Qwen2.5 report](https://arxiv.org/abs/2412.15115).
- Gemma 3: instead of MoE or MLA, reduces KV-cache memory by interleaving 5 local attention
  layers for every 1 global attention layer, with local layers restricted to a 1,024-token
  sliding window and a low RoPE base frequency (10,000), while global layers keep a much higher
  RoPE base frequency (1,000,000) to support long context; final context window is 128K (32K for
  the 1B model); 262K-token vocabulary; native multimodality via a 400M-parameter SigLIP vision
  encoder processing 896×896 images into 256 tokens per image — [Gemma 3 report](https://arxiv.org/abs/2503.19786).
- Gemma 3 also uses knowledge distillation from a larger teacher for all sizes, sampling 256
  logits per token (weighted by teacher probability) and training the student on those samples by
  cross-entropy, rather than distilling over the full vocabulary — [Gemma 3 report](https://arxiv.org/abs/2503.19786).
- gpt-oss-120b/20b: MoE with 128 total experts (120b) or 32 total experts (20b), top-4 activated
  per token in both; attention alternates between a 128-token banded/sliding window and full
  dense attention, plus GQA with 8 KV heads; context extended to 131,072 tokens via YaRN;
  201,088-token "o200k_harmony" tokenizer; MoE weights (over 90% of total parameters) are
  natively quantized to MXFP4 (4.25 bits/parameter), specifically so the 120B model fits on a
  single 80GB GPU — [gpt-oss model card](https://arxiv.org/abs/2508.10925).
- SmolLM3 (3B, dense): GQA with 4 groups; "NoPE" — rotary position embeddings are removed from
  every 4th layer, intended to help long-context behavior without hurting short-context quality;
  intra-document attention masking (tokens from different documents packed into one training
  sequence cannot attend to each other); base training context 4,096, extended over two stages to
  32K then 64K (RoPE theta raised to 1.5M then 5M), then extrapolated to 128K at inference via
  YaRN — [SmolLM3 blog](https://huggingface.co/blog/smollm3).
- OLMo 2: architecture changes from OLMo 1 were driven by training stability, not capability —
  moving RMSNorm to normalize the *outputs* of the attention/MLP blocks rather than their
  inputs, adding QK-norm (RMSNorm on queries/keys, "avoids attention logits being too large,
  which can lead to training loss divergence"), adding a z-loss term (weight 1e-5) to keep final
  softmax activations from growing too large, and raising RoPE theta from 10^4 to 5×10^5 to match
  Llama 3.1 — [OLMo 2 report](https://arxiv.org/abs/2501.00656).
- Kimi K2's MuonClip optimizer adds a "QK-Clip" step specifically because the Muon optimizer,
  while more token-efficient than AdamW, caused attention logits to explode (observed reaching
  over 1,000 in an uncapped run); QK-Clip caps logits at 100 and lets them "decay to a stable
  range" after roughly 30% of training, and the report states the full 15.5T-token run then had
  "zero loss spike" — [Kimi K2 report](https://arxiv.org/abs/2507.20534).

### Inferences
- Two distinct engineering answers exist to "how do I keep long-context inference cheap": (a)
  MLA (compress the KV cache algebraically — DeepSeek/Kimi), and (b) local:global attention
  ratio tuning (physically shrink most layers' attention window — Gemma). Either is a legitimate
  game option with the same "capability roughly preserved, serving cost cut" effect but different
  implementation cost/risk (MLA is more novel/untested at the time DeepSeek shipped it; local
  attention ratio tuning is a smaller, lower-risk change).
- Multi-stage pretraining (short-context "general" stage, then a "reasoning/quality" upsampling
  stage, then a "long-context" stage) is now the norm across Qwen3, Llama 3, DeepSeek-V3, Kimi
  K2, and SmolLM3 — this argues for modeling pretraining in the game as at least 2–3 sequential
  stages with separately configurable data mixes and context lengths, not one monolithic run.

### Gaps
- I did not find a primary source clearly stating multi-token prediction's isolated effect on
  training speed or downstream capability for DeepSeek-V3 (the ablation numbers, if any, were not
  surfaced by my extraction pass).
- I found no primary source in this pass discussing native multimodal (interleaved image/audio)
  pretraining from scratch versus the "text-first then bolt on a vision encoder" approach used by
  Gemma 3 and Llama 3's (unreleased at the time) multimodal variants — Llama 3's report notes
  multimodal experiments exist but says those models "are not yet being broadly released," and I
  did not pursue Qwen3-Omni or Qwen3-VL as primary sources since they were out of the assigned
  core list.

---

## Data mix: sources, proportions, filtering, and licensing/legal exposure

### Takeaway
Every report that discloses a data mix converges on the same top-level categories — general
web crawl (usually the large majority), code, math, and multilingual text, with academic/books
material as a smaller slice — but the actual filtering pipelines (dedup strategy, quality
classifier design, and how aggressively to deduplicate) turn out to matter as much as the raw
proportions, and at least one major open dataset paper found that a "more thorough" deduplication
choice (global dedup) actually made downstream models worse.

### Cited Findings
- Llama 3's final pretraining data mix: "roughly 50% of tokens corresponding to general
  knowledge, 25% of mathematical and reasoning tokens, 17% code tokens, and 8% multilingual
  tokens" — [Llama 3 report](https://arxiv.org/abs/2407.21783).
- Llama 3's filtering pipeline: URL-level deduplication (keep most recent version per URL),
  global MinHash deduplication for near-duplicate documents, aggressive ccNet-style line-level
  deduplication (removing lines that repeat more than 6 times within 30M-document buckets),
  a fastText classifier trained to predict "would this text be referenced by Wikipedia," and
  DistilRoberta classifiers trained on Llama 2 model predictions, plus filters to remove
  content from sites "likely to contain unsafe content or high volumes of PII." For
  decontamination, no training sets from commonly used benchmarks were included in the
  annealing-stage data — [Llama 3 report](https://arxiv.org/abs/2407.21783).
- FineWeb (15T tokens from 96 Common Crawl snapshots): pipeline order is WARC text extraction
  via trafilatura (chosen over WET files because WET "retained too much boilerplate and menu
  text"), fastText English-language filtering (score ≥0.65), a URL blocklist for adult content,
  Gopher/MassiveText quality and repetition filters, C4-style filters (terminal punctuation,
  curly brackets, lorem ipsum, javascript, boilerplate policy text), then three custom
  heuristics found to matter most: removing documents where ≤0.12 of lines end in punctuation
  (removes 10.14% of tokens), where ≥0.1 of characters are in duplicated lines (removes 12.47%),
  and where ≥0.67 of lines are under 30 characters (removes 3.73%) — [FineWeb paper](https://arxiv.org/abs/2406.17557).
- FineWeb's deduplication finding: MinHash dedup (5-grams, 112 hash functions in 14 buckets of
  8, targeting ≥75% similarity) applied *globally* across all 96 snapshots actually performed
  worse than no deduplication at all, because the surviving 10% of an old (2013) snapshot after
  global dedup was of *worse* quality than the 90% that got removed — old, heavily-duplicated
  low-quality content survived because it looked "unique" against newer crawls. Switching to
  per-snapshot (independent) deduplication produced a larger, better dataset (20T vs 4T tokens)
  that matched a comparable dataset (RefinedWeb)'s performance. The paper's interpretation:
  dedup's real value is removing huge cross-crawl clusters of near-identical spam/boilerplate
  documents, not catching every small duplicate — [FineWeb paper](https://arxiv.org/abs/2406.17557).
- FineWeb's PII handling for public release: "anonymizing email and public IP addresses" —
  [FineWeb paper](https://arxiv.org/abs/2406.17557).
- FineWeb-Edu: an educational-quality classifier trained on Llama-3-70B-Instruct-generated
  0–5 quality scores for 460,000 samples (a linear-regression head on Snowflake-arctic-embed-m
  embeddings, fine-tuned for 20 epochs at learning rate 3e-4); a minimum score threshold of 3
  produced a 1.3T-token subset that raised MMLU from 33% to 37% (+12% relative) and ARC from 46%
  to 57% (+24% relative) versus training on unfiltered FineWeb — [FineWeb paper](https://arxiv.org/abs/2406.17557).
- DCLM (DataComp-LM): a fastText quality classifier trained on ~400,000 documents (positive
  class = OpenHermes-2.5 instruction data + ELI5 subreddit posts; negative class = random web
  text) outperformed classifiers trained on more traditional "high-quality" proxies like
  Wikipedia references (a +3.5 percentage-point Core-score lift from switching to the
  instruction-style positive set), and beat alternative filtering strategies (PageRank: 26.1
  Core; a RefinedWeb-style heuristic reproduction: 27.5 Core; perplexity filtering: 29.0 Core;
  the winning fastText approach: 30.2 Core, at matched 1B-parameter/1x-compute scale). Keeping
  only the top 10% of documents by classifier score worked best — [DCLM paper](https://arxiv.org/abs/2406.11794).
- DCLM-Baseline (the resulting filtered+deduplicated dataset) let a 7B model reach 64% 5-shot
  MMLU on 2.6T training tokens, described as comparable to Llama 3 8B (66.2% MMLU on ~15T
  tokens) while using "6.6x less compute," and a 6.6-percentage-point MMLU improvement over the
  prior open-data state of the art (MAP-Neo) using 40% less compute — [DCLM paper](https://arxiv.org/abs/2406.11794).
- OLMo 2's pretraining mix (OLMo-Mix, ~3.90T tokens for the 7B model) is dominated by DCLM-
  Baseline web text (3.71T tokens, 95% of the mix), with the remainder split across StarCoder
  code (83.0B), peS2o academic papers (58.6B), arXiv STEM text (20.8B), OpenWebMath (12.2B),
  AlgebraicStack math/code (11.8B), and Wikipedia/Wikibooks (3.7B). A separate late-stage
  "Dolmino Mix 1124" annealing/mid-training mix (~843B tokens) upweights high-quality web text
  further (DCLM-Baseline top-7%-by-fastText-score + FineWeb-quality≥2, 752B tokens, 90.3% of
  that sub-mix), decontaminated FLAN instruction data (17.0B, 2.0%), encyclopedic/peS2o text
  (62.3B, 7.5%), and a small dedicated math mix (10.7B: synthetic TinyGSM-MIND 6.48B,
  MathCoder2 3.87B, TuluMath 230M, plus other sources) — [OLMo 2 report](https://arxiv.org/abs/2501.00656).
- OLMo 2's decontamination: FLAN documents with 10% or more overlapping n-grams against any
  evaluation task instance were removed before use in the annealing mix; the paper separately
  notes GSM8k was only "partially held out" because 200 of its 1,319 examples were subsampled
  for use in mid-training data development decisions — a disclosed, partial contamination of
  the eval/dev boundary — [OLMo 2 report](https://arxiv.org/abs/2501.00656).
- Qwen2.5's data pipeline uses Qwen2-Instruct models themselves as data-quality filters, merges
  in specialized math/code corpora built for Qwen2.5-Math and Qwen2.5-Coder, and generates
  synthetic data via Qwen2-72B-Instruct and Qwen2-Math-72B-Instruct, filtered by a proprietary
  reward model and specialized verifier models; the team explicitly rebalances domains,
  downweighting "significantly overrepresented" domains like e-commerce and social media and
  upweighting "traditionally underrepresented" domains like technology, science, and academic
  research. Decontamination uses a longest-common-subsequence (LCS) rule: a training sequence is
  dropped if it shares an LCS of at least 13 tokens with an eval example *and* that LCS is at
  least 60% of the shorter sequence's length — [Qwen2.5 report](https://arxiv.org/abs/2412.15115).
- Qwen3 reused Qwen2.5-Math and Qwen2.5-Coder to synthesize "trillions" of additional pretraining
  tokens (textbooks, Q&A, instructions, code snippets), and used Qwen2.5-VL to OCR large volumes
  of PDF-like documents into additional text data — a form of model-generated synthetic data
  feeding the next generation's pretraining corpus — [Qwen3 report](https://arxiv.org/abs/2505.09388).
- Gemma 3's data-side statements: the team "revisit[ed the] data mixture to improve
  multilingual capabilities" (no exact percentage given in the excerpt I read), removed "certain
  personal information and other sensitive data," applied safety filtering to reduce "unwanted
  or unsafe utterances," ran decontamination of evaluation sets out of the pretraining mixture,
  and applied a "quality reweighing step" to reduce low-quality data — [Gemma 3 report](https://arxiv.org/abs/2503.19786).
- Kimi K2's synthetic rephrasing pipeline was built specifically to avoid the diminishing
  returns and overfitting risk of repeating the same high-quality documents across multiple
  training epochs: knowledge-domain text was rephrased with diverse style/perspective prompts
  plus chunk-wise autoregressive generation, and math-domain text was converted into a
  "learning-note" style (following the SwallowMath approach), with each source document
  rephrased at most twice. On a SimpleQA accuracy benchmark, 10 raw epochs of a document scored
  23.76%, one rephrasing repeated across 10 epochs scored 27.39%, and ten distinct rephrasings
  used once each scored 28.94% — direct evidence that varying the surface form of repeated data
  captures more of the value of "more data" than literal repetition — [Kimi K2 report](https://arxiv.org/abs/2507.20534).
- SmolLM3's three-stage data mixture shifts progressively toward code and math as training
  proceeds: Stage 1 (tokens 0–8T of 11.2T): 85% web (12% of which is multilingual), 12% code, 3%
  math; Stage 2 (8–10T): 75% web (12% multilingual), 15% code, 10% math; Stage 3 (10–11.1T): 63%
  web (12% multilingual), 24% code, 13% math — [SmolLM3 blog](https://huggingface.co/blog/smollm3).
- gpt-oss's model card states pretraining data was filtered for harmful content, "especially
  around hazardous biosecurity knowledge," by "reusing the CBRN pre-training filters from
  GPT-4o" — i.e., an existing filter built for a closed frontier model was redeployed against
  the open-weight model's pretraining corpus — [gpt-oss model card](https://arxiv.org/abs/2508.10925).

### Inferences
- None of the primary sources I read explicitly discuss licensed data deals, pirated-book
  datasets (e.g., Books3-style corpora), or robots.txt/opt-out compliance as a named pretraining
  decision — labs appear to disclose *filtering for quality/safety* in detail but are much more
  guarded about *data provenance/licensing* decisions in their technical reports. This is itself
  a useful game-design point: "data sourcing legality" is a real lever (with real legal exposure
  in 2023–2026, per ongoing copyright litigation the reports themselves don't discuss), but it is
  the least-documented one in primary technical reports, likely because of litigation risk.
- The FineWeb dedup finding (global dedup can make a dataset *worse* by preferentially keeping
  low-quality survivors from old, heavily-duplicated crawls) is a good candidate for a
  counter-intuitive game mechanic: "more filtering" is not strictly dominant over "less but
  better-targeted filtering."

### Gaps
- I found no primary-source quantification of "% multilingual," "% licensed data," "% books," or
  "% scientific papers" as a clean top-level breakdown for Qwen3, Kimi K2, or gpt-oss (Qwen3
  gives token totals per pretraining *stage*, not per *content category*, and I did not locate a
  content-category table for it or for Kimi K2/gpt-oss in this pass).
- I did not locate a primary source in my reading list that names robots.txt handling, opt-out
  registries, or licensed/pirated book corpora explicitly — this is a genuine gap in what
  frontier labs' technical reports choose to disclose, not merely a gap in my search.
- Gemma 3's image-text data ratio and exact multilingual percentage were not surfaced by my
  extraction pass, though the report evidently discusses "revisiting" the mixture.

---

## Training process: precision, cluster, run length, checkpointing, loss spikes, LR schedule

### Takeaway
BF16-with-selective-FP8 (or native FP8 for the largest MoE runs) plus a cosine or warmup-stable-
decay (WSD) learning-rate schedule are now standard; loss spikes are treated as an engineering
problem to be *designed out* in advance (via initialization, normalization placement, or
optimizer changes) rather than merely detected and rolled back from, and at least two 2024–2025
frontier-scale runs (DeepSeek-V3, Kimi K2) explicitly report finishing multi-trillion-token
pretraining with zero irrecoverable loss spikes.

### Cited Findings
- Llama 3 405B: trained in BF16 at 38–43% model FLOPs utilization; learning-rate schedule was a
  linear warmup over 8,000 steps to a peak of 8×10⁻⁵, then cosine decay to 8×10⁻⁷ over 1.2
  million steps; batch size was scaled up during training — starting at 4M tokens (sequence
  length 4,096), doubling to 8M tokens (sequence length 8,192) after 252M tokens of pretraining,
  and doubling again to 16M tokens after 2.87T tokens. The report describes training as "very
  stable," with "few loss spikes" and no interventions needed for divergence. Separately, over
  one 54-day monitoring window the cluster experienced 466 job interruptions (hardware failures,
  etc.) yet still achieved over 90% effective training time — [Llama 3 report](https://arxiv.org/abs/2407.21783).
- DeepSeek-V3: FP8 mixed precision is used specifically for the GEMM (matrix multiply) core
  compute, while embeddings, the output head, MoE gating modules, normalization layers, and
  attention operators remain in BF16 or FP32; learning rate ramps to 2.2×10⁻⁴ over the first
  2,000 steps, holds constant until 10T tokens, then decays via cosine to 2.2×10⁻⁵ over the
  final 4.3T tokens; the report states "we did not experience any irrecoverable loss spikes or
  perform any rollbacks" across the entire training process; trained on a 2,048×H800 GPU cluster
  using 16-way pipeline parallelism, 64-way expert parallelism across 8 nodes, and ZeRO-1 data
  parallelism, via a custom "DualPipe" pipelining algorithm — [DeepSeek-V3 report](https://arxiv.org/abs/2412.19437).
- Kimi K2's training-stability story is architected around its custom MuonClip optimizer: plain
  Muon (chosen over AdamW for token efficiency) caused attention logits to explode past 1,000 in
  early experiments; MuonClip's QK-Clip step caps logits at 100 and lets them relax back down
  over roughly the first 30% of training, and with this fix the full 15.5T-token run is reported
  to have had "zero loss spike." Precision: BF16 parameters, FP32 gradient accumulation, and
  FP8-E4M3 for selectively stored activations. Hardware: H800 GPUs, 8 per node over
  NVLink/NVSwitch, 8×400 Gbps RoCE between nodes, 16-way pipeline parallelism, 16-way expert
  parallelism, ZeRO-1 data parallelism — [Kimi K2 report](https://arxiv.org/abs/2507.20534).
- OLMo 2 traces its loss spikes to a specific, checkable data pattern — training batches
  containing documents with long runs of repeated n-grams — and fixes it at the data layer by
  removing any document containing 32 or more repeats of any n-gram of length 1–13 tokens; it
  separately fixes a second stability problem by switching from a scaled/layer-depth-dependent
  parameter initialization to a uniform N(0, 0.02) initialization for every parameter, which the
  paper's own ablation figure shows "eliminates many spikes" in gradient norm — [OLMo 2 report](https://arxiv.org/abs/2501.00656).
- OLMo 2's learning-rate schedule is explicitly two-phase and stage-aware: warmup (2,000 steps)
  then cosine decay planned out to 5T tokens (7B/13B) or 6.5T tokens (32B); for the 7B model
  specifically, the cosine schedule is deliberately stopped early at 4T tokens and the model
  switches into a separate "mid-training" (annealing) phase with its own linear decay to zero
  over the remaining tokens. Peak learning rates were 3×10⁻⁴ (7B), 9×10⁻⁴ (13B), and 6×10⁻⁴
  (32B). The paper's own ablation (its Table 8) found that a higher learning rate during the
  main pretraining phase makes the later mid-training/annealing phase more effective "by exactly
  the amount that the pretraining is worse" — all learning-rate variants converged to the same
  final training loss, meaning the split between "main phase LR" and "annealing phase" is a
  reshuffling of when improvement happens, not a net change in the training-compute/quality
  frontier — [OLMo 2 report](https://arxiv.org/abs/2501.00656).
- SmolLM3 uses an explicit warmup-stable-decay (WSD) scheduler (2,000 warmup steps), AdamW
  (β1=0.9, β2=0.95, weight decay 0.1, excluding embedding layers, following OLMo 2's practice),
  gradient clipping at 1.0, a peak learning rate of 2×10⁻⁴, and a global batch size of 2.36M
  tokens at sequence length 4,096, trained on 384 H100 GPUs for 24 days — [SmolLM3 blog](https://huggingface.co/blog/smollm3).
- Gemma 3's precision path: trained natively in bfloat16, then made available via
  quantization-aware training in int4, int4-per-block, and fp8 checkpoint formats for cheaper
  deployment; hardware scales with model size — the 1B model trained on 512 TPUv5e chips, the 4B
  model on 2,048 TPUv5e chips, the 12B model on 6,144 TPUv4 chips, and the 27B model on 6,144
  TPUv5p chips — [Gemma 3 report](https://arxiv.org/abs/2503.19786).
- gpt-oss's MoE weights (over 90% of total parameters in both sizes) are natively quantized to
  MXFP4 (4.25 bits/parameter), a deployment-driven precision choice stated explicitly so the
  120B model "fit[s] on a single 80GB GPU" — [gpt-oss model card](https://arxiv.org/abs/2508.10925).

### Inferences
- The pattern across OLMo 2, Kimi K2, and Llama 3 suggests the game should model "loss spikes"
  not as a random event but as a consequence of specific earlier choices (data dedup
  thoroughness against repeated n-grams, optimizer choice, initialization scheme) — i.e., a
  player who skips a "stability" investment (better dedup, QK-norm/QK-clip, careful init) should
  face a higher probability of a costly mid-run spike/restart, while a player who pays for it
  gets a smoother, more predictable run.
- WSD-style schedules (stable plateau, then decay) appear specifically valuable for labs that
  want to branch or anneal onto multiple downstream data mixes without pre-committing to a
  single cosine decay endpoint (OLMo 2's 7B model exploits exactly this by leaving the cosine
  schedule and switching to a separate annealing phase) — this maps well to a "flexibility to
  pivot late in training" game trait for WSD vs cosine.

### Gaps
- No primary source in this pass gave an explicit checkpoint-frequency number (e.g., "we
  checkpoint every N steps") — the closest data I found was Llama 3's job-interruption/uptime
  statistics, which imply frequent, resilient checkpointing but do not state an interval.
  Everything about run length in wall-clock days was likewise sparse — I only found this for
  SmolLM3 (24 days on 384 H100s); Llama 3, DeepSeek-V3, Kimi K2, Qwen2.5/3, and Gemma 3 did not
  yield an explicit wall-clock training duration in my extraction pass.

---

## Safety-relevant pretraining choices: hazardous-knowledge filtering, contamination, decontamination

### Takeaway
Filtering hazardous (specifically biosecurity/CBRN) knowledge out of the pretraining corpus
itself — not just refusing to discuss it after the fact — is now a documented practice at both
a dedicated safety-research lab (EleutherAI's "Deep Ignorance" project) and a frontier lab
shipping an open-weight model (OpenAI's gpt-oss), and the research evidence says this approach
is dramatically more tamper-resistant against fine-tuning attacks than post-training safeguards
alone, but it has a clear, demonstrated limitation: it does nothing against a model that is
simply given the dangerous information in its prompt (retrieval/in-context use).

### Cited Findings
- "Deep Ignorance" (EleutherAI et al., 2025) trained 6.9B-parameter models (architecturally
  identical to Pythia 6.9B) on 500B tokens of deduplicated DCLM data plus a 50B-token annealing
  phase (550B tokens total), comparing a baseline (unfiltered) model against "Strong Filter" and
  "Weak Filter" variants — [Deep Ignorance paper](https://arxiv.org/abs/2508.06601).
- The filtering pipeline is two-stage: Stage 1 is a keyword blocklist built from terms in the
  WMDP-Bio "Forget" dataset (24,453 documents); documents containing two or more blocklist terms
  are escalated to Stage 2, while 91.58% of pretraining documents and 90.64% of annealing
  documents pass Stage 1 without needing classifier review. Stage 2 is a fine-tuned
  ModernBERT-Large classifier trained on 198,184 labeled documents (a mix of expert-labeled
  proxy/biology documents and LLM-labeled general text), which scores escalated documents and
  filters those above a threshold. The "Strong Filter" removed 8.42% of pretraining documents and
  9.36% of annealing documents; the "Weak Filter" removed an additional 4.96% of annealing
  documents on top of that — [Deep Ignorance paper](https://arxiv.org/abs/2508.06601).
- The filtering step itself is cheap relative to full pretraining: an estimated 0.83% of the
  model's total training FLOPs, and the full filtering run took about 1.5 days on a cluster of 80
  Nvidia H100 GPUs — [Deep Ignorance paper](https://arxiv.org/abs/2508.06601).
- Filtered models showed "no apparent net degradation" on general capability benchmarks
  excluding biology (MMLU-No-Bio, PIQA, LAMBADA, HellaSwag) and on non-virology biology questions
  (MMLU-HSC-Bio) — [Deep Ignorance paper](https://arxiv.org/abs/2508.06601) (⚠️ the paper reports
  exact numbers via figures rather than in-text tables; my extraction pass could not read the
  figure values, only the qualitative claim of "no net degradation").
- The core tamper-resistance test: attackers fine-tuned the models for up to 10,000 steps and
  300M tokens of biothreat-related text (2 epochs on the WMDP-Bio "Forget" set, ~305M tokens
  total, batch size 16, context 2,048, learning rate 2×10⁻⁵, using both full-parameter and LoRA
  fine-tuning, taking about 17 hours on 2 Nvidia H200 GPUs per run). The filtered models were
  reported to resist this attack "improving by more than an order of magnitude over post-training
  baselines" such as circuit-breaking (CB) and circuit-breaking-plus-latent-adversarial-training
  (CB+LAT), which the paper says typically fail within "hundreds of steps" of adversarial
  fine-tuning — [Deep Ignorance paper](https://arxiv.org/abs/2508.06601).
- The clearly stated limitation: the authors built a 1,000-question biothreat-proxy benchmark (in
  both closed-book and open-book/in-context modes) from 1,000 biology-paper abstracts in the
  WMDP-Bio Forget set, with questions generated by Claude 3.7 Sonnet. Pretraining-data filtering
  blocks closed-book (memorized) recall of the dangerous knowledge but "cannot prevent in-context
  retrieval of harmful information" when the same information is supplied in the prompt
  (open-book mode) — only circuit-breaking-style post-training defenses blocked that, and "no
  models are resistant to an ensemble fine-tuning + open-book attack." The paper's own conclusion
  is that pretraining filtering is "a useful component of risk management strategies for
  open-weight LLMs," explicitly one layer in a defense-in-depth stack, not a complete solution —
  [Deep Ignorance paper](https://arxiv.org/abs/2508.06601).
- OpenAI's gpt-oss model card states pretraining data was filtered for harmful content
  "especially around hazardous biosecurity knowledge," done by "reusing the CBRN pre-training
  filters from GPT-4o" — i.e., a filter originally built for a closed, proprietary frontier model
  was redeployed to scrub the open-weight gpt-oss pretraining corpus. The stated rationale ties
  directly to the open-weight risk model: because "determined attackers could fine-tune [an
  open-weight model] to bypass safety refusals," a post-training-only safety approach
  ("deliberative alignment") can be undone by anyone with the weights, whereas filtering the
  pretraining data removes the underlying capability before the weights are ever released —
  [gpt-oss model card](https://arxiv.org/abs/2508.10925).
- On decontamination generally (benchmark leakage prevention rather than hazard filtering):
  Llama 3 excludes benchmark training sets from its annealing data; Qwen2.5 drops any training
  sequence sharing a ≥13-token, ≥60%-of-length longest-common-subsequence with an eval example;
  OLMo 2 removes FLAN documents with ≥10% overlapping n-grams against eval task instances, while
  disclosing a partial exception (200 of 1,319 GSM8k examples were subsampled into mid-training
  data development, a deliberate, disclosed partial contamination of their own eval/dev boundary)
  — [Llama 3 report](https://arxiv.org/abs/2407.21783); [Qwen2.5 report](https://arxiv.org/abs/2412.15115); [OLMo 2 report](https://arxiv.org/abs/2501.00656).

### Inferences
- The Deep Ignorance + gpt-oss pairing is strong evidence that "filter hazardous knowledge out of
  pretraining data" has moved from an academic proposal to an actual frontier-lab practice for
  open-weight releases specifically (where post-training safeguards are known to be removable by
  the downstream user) — this is a good candidate for a game mechanic where the "open-weight vs
  API-only" release-strategy decision changes which safety levers are even worth pulling at
  pretraining time.
- Because the filtering compute overhead is small (~0.83% of training FLOPs) but the benefit is
  "order of magnitude" tamper resistance, this is a genuinely asymmetric decision in the source
  material — the game should probably not price it as expensive, but it should carry a
  non-removable "residual exposure" flag representing the in-context/retrieval loophole, so a
  player can't treat it as a complete fix.

### Gaps
- I found no primary source in this pass that discusses filtering pretraining data for other
  hazard categories (chemical, radiological, nuclear, cyber-offense) with the same empirical
  rigor as Deep Ignorance's biothreat focus — gpt-oss's card mentions CBRN filtering broadly but
  the only granular pipeline details I retrieved are specific to biosecurity (Deep Ignorance).
- I did not find, in the sources read here, a frontier lab's technical report explicitly
  weighing "pretrain on some alignment-relevant data (e.g., safety-relevant text, refusal
  demonstrations) at the pretraining stage" as opposed to leaving that entirely to post-training
  — none of Llama 3, DeepSeek-V3, Qwen2.5/3, Gemma 3, Kimi K2, or gpt-oss's excerpts I read
  described pretraining-stage alignment data explicitly; all safety-shaping in these reports was
  attributed to post-training stages, except for the hazard-filtering and PII/CSAM-removal
  practices already covered above.

---

## Transfer notes: a game-ready pretraining options menu

Eight decisions, each with 3–5 concrete options grounded in the sources above. "Alignment debt"
= hidden risk that the model can be made to behave unsafely later; "misuse exposure" = hidden
risk that the model's raw capabilities can be extracted/weaponized (especially if open-weight).

### 1. Scale target: tokens-per-parameter ratio
- **Chinchilla-optimal (~20 tokens/param)** — e.g. original Chinchilla 70B/1.4T. Capability:
  baseline-efficient for a given training budget. Training cost: lowest for a given quality bar.
  Training time: shortest. Serving cost: worst per-query cost among the options (relatively more
  parameters for the same quality). Alignment debt: none extra. Misuse exposure: baseline.
  Legal debt: baseline (data volume needed is smallest). *Head of Research*: "This is the
  textbook-efficient choice, but everyone shipping a real product overtrains past this now."
  *CFO*: "Cheapest to build, most expensive to run at scale — do we know our serving volume?"
  *Policy director*: "No special exposure here beyond the data itself."
- **Moderately overtrained (~200–500 tokens/param)** — e.g. DCLM-Baseline 7B (2.6T tokens, ~370
  tokens/param). Capability: comparable-to-larger-model results without inflating parameter
  count. Training cost: several times Chinchilla-optimal for the same size. Training time:
  longer. Serving cost: notably cheaper than an equal-quality bigger model. Alignment debt: none
  extra. Misuse exposure: unchanged. Legal debt: needs more raw data, mildly higher exposure if
  data sourcing is loose. *CFO*: "Worth it once monthly query volume crosses roughly a billion
  requests, per the inference-scaling-law research."
- **Heavily overtrained small model (~1,000–4,000 tokens/param)** — e.g. Llama 3 8B (~1,875
  tokens/param) or SmolLM3 3B (~3,700 tokens/param, 11.2T tokens). Capability: strong for its
  size, competitive with larger same-generation models. Training cost: highest for the model's
  own parameter count, though still cheap in absolute terms because the model is small. Training
  time: long relative to size. Serving cost: lowest per query of any option here — this is the
  whole point. Alignment debt: unchanged. Misuse exposure: a smaller, cheap-to-run capable model
  is easier to deploy widely (including by bad actors, if released openly) — a mild exposure
  increase specifically for open-weight releases. Legal debt: needs a very large, clean data
  supply. *Head of Research*: "This model will punch above its parameter count — good for a
  free-tier or on-device product." *Policy director*: "If this ships as open weights, a cheap,
  capable model is also a cheap, capable model for someone else's misuse case."
- **Deliberately undertrained flagship (frontier-scale dense, e.g. GPT-4-era ~1e25+ FLOPs at
  lower tokens/param)** — capability: maximum raw capability per training dollar spent on
  parameters. Training cost: extremely high. Training time: long. Serving cost: highest of all
  options (large active parameter count every query). Alignment debt/misuse exposure: unchanged
  by this axis alone. Legal debt: unchanged. *CFO*: "This is a flagship-prestige play, not a
  unit-economics play — budget for it accordingly."

### 2. Architecture: dense vs mixture-of-experts
- **Dense transformer** (Llama 3, Gemma 3, OLMo 2, SmolLM3). Capability: predictable scaling,
  easiest to reason about and to fine-tune downstream. Training cost/time: straightforward,
  well-understood infrastructure. Serving cost: every parameter is active every token — most
  expensive per-parameter to serve. Alignment debt: none extra. Misuse exposure: none extra.
  *Head of Research*: "Boring and reliable — good default when the team hasn't run MoE before."
- **Sparse MoE, moderate sparsity** (Qwen3-30B-A3B: 128 experts/8 active; gpt-oss: 128 or 32
  experts/top-4 active). Capability: much higher effective knowledge capacity for a given
  inference cost. Training cost: total-parameter compute is higher than active-parameter
  compute alone, plus real infrastructure complexity (routing, load balancing). Serving cost: far
  cheaper per query than a dense model of equal total capability. Alignment debt: routing can
  create uneven or hard-to-audit behavior across experts — a real but under-studied risk.
  Misuse exposure: unchanged directly. *CFO*: "Best capability-per-serving-dollar on the menu,
  but plan for a harder infra build."
- **Extreme sparsity MoE** (DeepSeek-V3: 671B/37B active, 256 experts; Kimi K2: 1.04T/32B active,
  384 experts). Capability: frontier-competitive at a fraction of the active-compute cost.
  Training cost: very high in absolute terms (DeepSeek-V3: ~2.79M GPU-hours, ~$5.6M by their own
  estimate) but low relative to a dense model of comparable capability. Serving cost: excellent —
  only ~3–5% of parameters active per token. Alignment debt: the auxiliary-loss-free load
  balancing and novel optimizers (MuonClip) needed to make this stable are themselves a source of
  engineering/training risk (see loss-spike lever below) — treat as a hidden "training risk"
  variable, not a safety-alignment one. *Head of Research*: "This is the current state of the
  art for capability-per-dollar, but it demands real optimizer/infra expertise or you eat loss
  spikes."

### 3. Long-context strategy
- **Short-context only (train and ship at 4K–8K)**. Capability: cheapest, fine for most
  chat/short-task use. Training cost/time: minimal extra cost. Serving cost: cheapest (small KV
  cache). Alignment/misuse/legal: unchanged. *CFO*: "Fine if the product doesn't need long
  documents; revisit before launch if it does."
- **Late-stage context extension (train short, extend late)** — the universal pattern (Llama 3:
  8K→128K over ~800B tokens; DeepSeek-V3: 4K→32K→128K via YaRN; Qwen3: dedicated Stage 3;
  SmolLM3: 4K→32K→64K, extrapolated to 128K at inference). Capability: reaches long-context
  competence without paying long-context compute cost for the whole run. Training cost: a modest
  addition (hundreds of billions of tokens, a small fraction of total budget). Serving cost:
  scales up with context length used at inference (bigger KV cache) — a lever players will feel
  at deployment time, not training time. *Head of Research*: "Cheap insurance — always do at
  least some late-stage extension unless serving cost is the only thing that matters."
- **Architectural KV-cache mitigation (local:global attention ratio, e.g. Gemma 3's 5:1 local
  sliding-window : global layers)**. Capability: preserves long-context quality while avoiding
  the KV-cache memory blowup a naive long-context dense model would have. Training cost:
  essentially free (an architecture choice, not extra tokens). Serving cost: much lower than a
  full global-attention model at the same context length. Alignment/misuse: unchanged. *CFO*:
  "This is a free lunch if you're designing the architecture from scratch — no reason to skip
  it for a new model."

### 4. Data-quality filtering intensity
- **Minimal filtering (heuristics only, e.g. basic Gopher/C4 rules)**. Capability: worst of the
  filtering options at equal token count. Training cost: lowest data-prep cost. Legal debt:
  highest exposure (more toxic/PII/unlicensed content likely survives). *Policy director*: "This
  is the option that gets us in the news for the wrong reasons."
- **Model-based quality classifier (fastText-style, e.g. DCLM-Baseline, FineWeb-Edu)**.
  Capability: significant uplift at fixed compute (DCLM: +6.6 MMLU points at 40% less compute
  vs the prior open state of the art; FineWeb-Edu: +12% relative MMLU, +24% relative ARC).
  Training cost: extra data-prep compute (classifier training + scoring the corpus), modest
  relative to the training run itself. Legal debt: somewhat improved (classifier can be tuned to
  downweight low-provenance content, though this isn't automatic). *Head of Research*: "Data
  quality is now a bigger lever than almost anything else per training dollar — fund this
  first."
- **Aggressive global deduplication**. Capability: can *backfire* — FineWeb's own experiment
  found global MinHash dedup across all crawls performed worse than no dedup, because it
  preferentially preserved low-quality survivors from old snapshots. Training cost: expensive to
  compute at scale. *Head of Research*: "More deduplication is not automatically better — dedup
  needs to target near-duplicate spam clusters, not just uniqueness for its own sake."
- **PII/CSAM/toxic-content removal pass** (near-universal: Llama 3, FineWeb public release,
  Gemma 3). Capability: neutral to slightly positive. Training cost: modest. Legal debt: a large
  reduction — this is close to a legal-exposure floor requirement rather than an optional
  upgrade in 2023–2026's regulatory climate. *Policy director*: "This isn't really optional
  anymore; treat it as a cost of doing business, not a discretionary safety spend."

### 5. Synthetic / model-generated data usage
- **None (100% human-authored/scraped data)**. Capability: bounded by what already exists on the
  web/in licensed corpora. Legal debt: cleanest provenance story. Training cost: no extra
  generation compute. *Policy director*: "Simplest to defend publicly, but you're leaving
  capability on the table."
- **Rephrasing/augmentation of existing high-quality data** (Kimi K2: knowledge and math text
  rephrased up to twice, avoiding repeated-epoch overfitting; measured SimpleQA gain from
  23.76%→28.94% for the same underlying source material). Capability: meaningfully better than
  naive repetition of the same tokens. Training cost: extra generation compute (an LLM call per
  document), but cheap relative to the pretraining run it feeds. Alignment debt: low — mostly a
  data-diversity technique. Legal debt: unchanged (same underlying sources, just reformulated).
  *Head of Research*: "Good for squeezing more value out of a limited high-quality data pool
  without over-scraping."
- **Full synthetic generation from a stronger teacher model** (Qwen2.5/Qwen3: trillions of
  tokens of textbooks/QA/code generated by prior Qwen models; Qwen3-VL/2.5-VL used to OCR PDFs
  into fresh text). Capability: can materially expand effective training data beyond what raw
  scraping provides, especially for math/code/reasoning. Training cost: nontrivial generation +
  filtering compute, but this can be cheaper than acquiring/licensing equivalent human data.
  Alignment debt: models trained heavily on a prior model's own outputs risk quietly inheriting
  and amplifying that model's blind spots or errors ("model collapse"-adjacent risk) — a real
  hidden variable. Legal debt: generally lower per-token exposure than raw scraping (no direct
  copyright concern in the synthetic text itself), though this is contested ground. *CFO*: "This
  can be cheaper than buying data — but Head of Research needs to sign off that quality isn't
  quietly degrading generation over generation."

### 6. Optimizer / training-stability investment
- **Standard AdamW, standard init, cosine LR, no special stability engineering**. Capability:
  fine for well-understood, moderate-scale dense runs. Training cost: cheapest. Risk: highest
  exposure to loss spikes at large scale/aggressive learning rates (OLMo 2's own account of
  OLMo-0424's instabilities before they added QK-norm, z-loss, and re-initialization).
  *Head of Research*: "Fine for anything we've done before at this scale; risky for a big jump."
- **Stability-hardened dense training** (OLMo 2's package: QK-norm, z-loss, uniform init,
  n-gram-repeat document filtering). Capability: unchanged directly, but protects the capability
  you were already paying for from being lost to a botched run. Training cost: small extra
  engineering cost, no extra compute. Training time: saves time versus a run that spikes and
  needs a rollback/restart. *CFO*: "This is insurance against wasting the whole training budget
  — cheap relative to the run it protects."
- **Novel token-efficient optimizer at extreme scale** (Kimi K2's MuonClip: Muon's efficiency
  plus QK-Clip to cap attention-logit blowup). Capability: reported zero loss spikes across
  15.5T tokens at 1T+ parameter scale, letting the lab reach frontier-scale training that would
  otherwise be at high risk of instability. Training cost: R&D investment to develop/validate a
  new optimizer before betting a full frontier run on it. Risk if it fails: a bad novel-optimizer
  bet could waste enormous compute on a run that must be aborted. *Head of Research*: "High
  upside, but only bet the whole flagship run on a new optimizer after validating it at smaller
  scale first."

### 7. Precision / hardware-efficiency choice
- **BF16 throughout**. Capability: full numerical safety margin, most reliable convergence.
  Training cost/time: baseline (no special efficiency gain). *Head of Research*: "The safe
  default when we're not compute- or memory-constrained."
- **Selective FP8 for the largest GEMMs, BF16/FP32 elsewhere** (DeepSeek-V3, Kimi K2's
  FP8-E4M3 activation storage). Capability: preserved if done carefully (both labs report clean
  training). Training cost: notably reduced compute/memory footprint for the same token count —
  a large practical enabler of DeepSeek-V3's low reported $5.6M training cost at 671B/37B scale.
  Risk: numerical instability if applied carelessly (why both reports specify exactly which
  components stay in higher precision). *CFO*: "This is a big line-item saving if the
  engineering team can execute it correctly."
- **Native low-bit weight storage for deployment (MXFP4 for MoE weights, gpt-oss)**. Capability:
  unaffected for the released model (chosen for serving, not training numerics). Serving cost:
  dramatically reduced — lets a 120B-class model run on a single 80GB GPU instead of needing
  multi-GPU serving. Training cost: unaffected (a post-hoc/QAT deployment choice). *CFO*: "This
  is purely a deployment-cost lever — take it whenever the model is MoE-heavy."

### 8. Hazardous-knowledge pretraining filter (biosecurity/CBRN)
- **No pretraining-stage hazard filtering (rely on post-training refusals only)**. Capability:
  no direct capability cost. Training cost: none extra. Alignment debt: low if the model is
  closed/API-only (post-training refusals can be maintained by the lab); high if the model is
  released as open weights, since refusals can be fine-tuned away by anyone. Misuse exposure:
  significant for an open-weight release. Legal/policy debt: growing scrutiny risk in
  2023–2026 as this gap becomes publicly documented (Deep Ignorance paper exists specifically
  because of this gap). *Head of Safety*: "This is the option regulators and researchers are now
  actively pointing at as insufficient for open-weight models."
- **Multi-stage pretraining-data hazard filter (Deep Ignorance-style: keyword blocklist +
  classifier escalation)**. Capability: "no apparent net degradation" on general and even
  non-target biology benchmarks, per the source paper. Training cost: very small overhead
  (~0.83% of total training FLOPs; ~1.5 days on 80 GPUs for the filtering pass itself). Safety
  benefit: reported "order of magnitude" better resistance to adversarial fine-tuning attacks
  (up to 10,000 steps / 300M tokens) than post-training-only safeguards. Residual risk (does not
  go away with this option): the model can still use dangerous information if it's supplied in
  the prompt/context (retrieval-augmented misuse) — filtering training data does not block this.
  *Head of Safety*: "Cheap, real, and now demonstrated at 6.9B scale — but say clearly in the
  model card that it does not cover in-context misuse, or we're overclaiming." *Policy director*:
  "This is close to becoming an expected best practice for anyone shipping open weights."
- **Reuse an existing filter from a prior/sibling model** (gpt-oss reusing GPT-4o's CBRN
  pretraining filters). Capability/training cost: cheapest option that still filters — no new
  filter-development cost, just re-application. Risk: the filter's coverage and false-negative
  rate are whatever the prior model's filter already had; it wasn't purpose-built for the new
  model's data mix or new hazard categories that may have emerged since. *Head of Research*:
  "Efficient reuse, but confirm the old filter's thresholds still make sense for our new,
  probably larger and more diverse, pretraining corpus."

---

## Coverage statement

**Sources opened and the depth of reading achieved (all via WebFetch, an automated
fetch-and-extract pass over the full page against a targeted prompt, not a personal
line-by-line read of the raw text):**

- Llama 3 "Herd of Models," arXiv 2407.21783 — fetched via `arxiv.org/html/2407.21783` (full
  paper HTML); extraction covered pretraining data mix/filtering, scale/FLOPs/cluster,
  architecture, context-length stages, precision, LR schedule, batch-size schedule, and
  stability/uptime statistics, with section numbers cited by the extraction. Post-training
  safety detail (Section 5.4) was not extracted in depth — flagged in-line above.
- DeepSeek-V3 technical report, arXiv 2412.19437 — fetched via `arxiv.org/html/2412.19437` (full
  paper HTML); extraction covered MoE/MLA architecture, multi-token prediction, training data
  scale, FP8 precision plan, cluster/parallelism, cost breakdown, and LR schedule.
- OLMo 2 technical report, arXiv 2501.00656 — fetched via `arxiv.org/html/2501.00656` (full
  paper HTML); extraction covered model sizes/token counts, architecture-stability changes and
  their rationale, full pretraining and annealing data-mix tables, LR schedule and its own
  ablation finding, decontamination method, and loss-spike root cause/fix. Exact
  hardware/cluster naming and total wall-clock training duration were not surfaced by the
  extraction (⚠️ flagged above as a gap, not confirmed absent from the paper itself).
- Qwen2.5 Technical Report, arXiv 2412.15115 — first pass fetched only the abstract page
  (`arxiv.org/abs/2412.15115`, ⚠️ abstract-only); a second pass fetched the full HTML
  (`arxiv.org/html/2412.15115v2`) and extracted model sizes, tokenizer, data-quality/synthetic
  pipeline, context-length/YaRN+DCA extension, architecture, and decontamination method.
  Precision/cluster detail was not surfaced beyond "bfloat16" (⚠️ likely present in the paper but
  not extracted).
- Qwen3 Technical Report, arXiv 2505.09388 — fetched via `arxiv.org/html/2505.09388` (full paper
  HTML); extraction covered the full model-size table, the three-stage pretraining pipeline and
  per-stage token counts, tokenizer, and the strong-to-weak distillation compute comparison.
  Precision, cluster hardware, and decontamination methodology were explicitly reported by the
  extraction as "not provided in the technical report" (⚠️ unconfirmed whether genuinely absent
  from the source or simply not surfaced).
- Gemma 3 Technical Report, arXiv 2503.19786 — fetched via `arxiv.org/html/2503.19786v1` (full
  paper HTML); extraction covered the per-size parameter/token table, local:global attention
  architecture and RoPE base-frequency split, vision encoder, distillation method, data-filtering
  statements, precision/quantization, and per-size TPU hardware. Exact multilingual/image-data
  percentages and total training duration were not surfaced (⚠️ flagged above).
- Kimi K2 (Kimi Team), arXiv 2507.20534 — fetched via `arxiv.org/html/2507.20534` (full paper
  HTML); extraction covered MoE/MLA configuration, the MuonClip/QK-Clip stability mechanism with
  its own before/after evidence, the synthetic rephrasing pipeline with its SimpleQA ablation
  numbers, context extension, precision, and cluster/parallelism setup.
- SmolLM3 blog post, Hugging Face — fetched via `huggingface.co/blog/smollm3` (a redirect from
  `hf.co/blog/smollm3` was followed); extraction covered parameter/token counts, architecture
  (GQA, NoPE, document masking), context extension stages, the full three-stage data mixture,
  tokenizer, and detailed training hyperparameters/schedule. This is a company blog post, not a
  peer-reviewed paper, so some numbers (e.g. the vocabulary-size phrasing) may be loosely stated
  in the source itself, not just in my extraction of it.
- gpt-oss-120b & gpt-oss-20b Model Card, arXiv 2508.10925 — first pass fetched only the abstract
  page (⚠️ abstract-only); a second pass fetched the full HTML
  (`arxiv.org/html/2508.10925v1`) and extracted architecture/expert counts, attention pattern,
  MXFP4 quantization rationale, the CBRN pretraining-filter statement and its stated rationale,
  and training compute in H100-hours. Exact decontamination methodology was not surfaced (⚠️).
- FineWeb datasets paper, arXiv 2406.17557 — first pass fetched only the abstract page (⚠️
  abstract-only); a second pass fetched the full HTML (`arxiv.org/html/2406.17557v1`) and
  extracted the complete filtering pipeline order, the specific global-vs-per-snapshot dedup
  finding with its stated causal explanation, PII-removal statement, and the full FineWeb-Edu
  classifier-construction method with before/after benchmark numbers.
- DataComp-LM (DCLM), arXiv 2406.11794 — first pass fetched only the abstract page (⚠️
  abstract-only); a second pass fetched the full HTML (`arxiv.org/html/2406.11794v1`) and
  extracted the fastText classifier construction and training-data composition, the filtering
  strategy ablation table, deduplication method comparison, and the DCLM-Baseline/Llama-3/
  MAP-Neo compute-efficiency comparisons. Note: the extraction reported "DCLM-baseline contains
  approximately 2T tokens" after dedup from a 240T raw pool, which I could not fully reconcile
  against the abstract's "2.6T training tokens" figure for the 7B model in this pass (⚠️ possible
  extraction imprecision or a distinction between "deduplicated pool size" and "tokens actually
  used to train the reference 7B model" that I did not resolve).
- Chinchilla, Hoffmann et al. 2022, arXiv 2203.15556 — first pass fetched only the abstract page
  (⚠️ abstract-only); a second pass fetched the ar5iv full-text rendering
  (`ar5iv.labs.arxiv.org/html/2203.15556`) and extracted the three scaling-law-fitting approaches
  and their exponents, the Gopher-to-Chinchilla compute-matched comparison and headline
  benchmark deltas, and confirmation that the paper does not model inference cost in its
  optimization. Note: my two fetches returned slightly different Chinchilla MMLU figures (67.5%
  vs 67.6%) — both are the extraction tool's transcription of the same underlying number, so this
  is flagged as a possible transcription rounding difference rather than a source conflict (⚠️
  use the primary PDF's Table 6 directly before citing this specific figure in the shipped game).
- Deep Ignorance, arXiv 2508.06601 — fetched via `arxiv.org/html/2508.06601v1` (full paper
  HTML); extraction covered the two-stage filtering pipeline with document-level filtering
  percentages, model/training setup, the qualitative "no net degradation" capability claim, the
  full adversarial fine-tuning attack protocol, the closed-book/open-book limitation experiment,
  and the compute-overhead figures. Exact numerical capability and WMDP-Bio benchmark scores are
  reported by the source paper via figures rather than in-text tables, and my extraction pass
  could not read graph values, only the paper's own textual claims about them (⚠️ flagged above
  at the specific finding).
- Epoch AI, "How much does it cost to train frontier AI models?" — fetched directly
  (`epoch.ai/blog/how-much-does-it-cost-to-train-frontier-ai-models`); extraction covered the
  2.4x/year cost-growth rate, cost-composition breakdown, and the >$1B-by-2027 projection. This
  source itself does not give named per-model dollar figures in what I extracted, only the
  general trend and composition.
- Epoch AI, "Training compute costs are doubling every eight months," cost-trend data page —
  fetched directly (`epoch.ai/data-insights/cost-trend-large-scale`); extraction covered the
  "doubling every 8 months" framing and a list of named, dated per-model cost estimates from
  GPT-4 (2023) through Grok-4 (2025).
- Epoch AI, "Frontier language models have become much smaller" — fetched directly
  (`epoch.ai/gradient-updates/frontier-language-models-have-become-much-smaller`); extraction
  covered Epoch's own parameter-count estimates for closed models (GPT-4, GPT-4o, Claude 3.5
  Sonnet — explicitly labeled by Epoch as estimates, not lab-disclosed figures) and the stated
  economic drivers behind the shift to smaller, longer-trained models.
- "Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws," arXiv
  2401.00448 — fetched only the abstract page (⚠️ abstract-only; I did not retrieve the full
  paper body for this source, only the extraction tool's summary of the abstract). Used for the
  ~1B-request threshold and "tokens-per-parameter up to 10,000" claims in the Scale section
  above; both numbers should be re-verified against the paper's full text before being used as
  precise game-balance constants.

**Not reached / out of scope for this pass:** I did not read Qwen2.5-VL, Qwen2.5-Coder,
Qwen2.5-Math, Qwen3-VL, Qwen3-Omni, or Kimi K2.5/Kimi Linear technical reports that turned up in
search (they are newer sibling/derivative reports, not the core assigned list); I did not
independently verify Llama 3 8B/70B's per-size pretraining token counts against a primary table
(flagged above as an explicit gap); and I did not locate or read a primary source on
robots.txt/opt-out compliance, licensed-data deals, or pirated-book corpora as a named
pretraining decision at any of the labs covered — this is reported as a genuine gap in what the
primary technical reports choose to disclose, not merely a search failure on my part.
