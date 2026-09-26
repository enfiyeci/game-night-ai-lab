# Constitution content, grounded in real model specs: proposals for Task 9

Written 2026-09-26 for plan 2B Task 9. It covers the era 1 principles checklist (mock P1), the era 3
full constitution (mock F1) and the motto sentence builder (mock M2). Every option below cites the
real document it comes from. Each one also names the in-game situation where it bites, so that the
consequence shows up in play and not as an effect line on the screen (owner rule, 2026-09-26).

Sources: the five notes in `docs/research/model-specs/notes/`. The key quotes were re-checked against
the raw downloaded text in this session. The notes' coverage gaps are listed in
`docs/research/model-specs/README.md` and are not repeated here.

"Existing hook" means the sim already reacts to this line today (a `hasLine` call on `main`). "New
hook" means a small sim change is needed. The build plan will list every new hook.

---

## 1. What the real documents are like, in one page

| | Claude, 2023 | Claude, 2026 | OpenAI Model Spec (2024 → 2026) | Others |
|---|---|---|---|---|
| **Form** | 58 short "choose the response that…" comparisons, drawn at random during training. No ranking. No absolute rules. | About 30,000 words of explained reasons, addressed to Claude. Four ranked values, 7 hard constraints, 82 worked examples. | Rules tagged by authority level, plus 186 graded example dialogues (GOOD, BAD, OK). | Sparrow: 23 flat rules. Gemini: three priorities. Grok: a published system prompt. China: a binding law. |
| **Priority** | None. | Safe > ethical > company guidelines > helpful, "holistic rather than strict". Hard constraints filter options out before any weighing. | By rank: root > system > developer > user > guideline > no authority. When two root rules clash, do nothing. | Gemini: follow the user, then adapt, then safeguard. |
| **Hard lines** | None. | Weapons capable of mass casualties; critical infrastructure; damaging cyberweapons; undermining oversight; helping kill or disempower humanity; illegitimate absolute control "even if the request comes from Anthropic itself"; child sexual abuse material. | Only sexual content involving minors is banned outright. Root rules cover weapons uplift, targeted political persuasion, privacy, extremism, hate, self-harm, "no other objectives" and staying inside an agent's scope. | Google dropped its 2018 "no weapons, no surveillance" pledge in February 2025. |
| **Honesty** | "Least dishonest… misleading" is one principle among 58. | Not a hard constraint, but meant to work "quite similar to one". No white lies at all. | "Do not lie" and "Don't be sycophantic" are user-level defaults, so an explicit developer instruction can override them. The spec ranks lying as less bad than disobeying an explicit instruction. | Grok: "do not deceive". The US executive order: "truth-seeking". |
| **Written for** | The judge model inside training. | Claude itself. | The model, in the third person, shaped around a product (ChatGPT and the API). | Researchers, users, regulators. |

**The finding that matters most for the game.** The real history runs from soft tendencies to hard lines.
In 2023 there were no bright lines, only preferences that nudged training. Absolute constraints first
appear in the 2026 document. Our mocks do it the other way round: P1 has the player pick three absolute
lines in era 1. Section 2 proposes a way to keep the built pick-3 mechanic and still tell the true story.

---

## 2. Recommended structure

1. **Era 1, "Our principles" (P1).** The player picks 3 of 10 principles, each worded in the real 2023
   style ("Choose the response that…"). Mechanically, they are the lab's three lines (`hasLine`), exactly
   as today.
2. **Era 3, "Constitution" (F1, the Head of Safety's tracked-changes draft).** The draft does three
   things:
   - It prints the four priorities in the real 2026 order, as fixed text (a stretch goal is letting the
     player reorder them; see question 2).
   - It rewrites the three era 1 principles as 2026-style hard constraints, shown as tracked changes.
     For example, "~~Choose the response least intended to build a relationship with the user~~ →
     Never pull users away from the people in their lives." This is the real 2023→2026 shift, and it
     happens on screen.
   - A margin comment from Safety offers to swap one line for one of two lines that only exist in the
     2026 document (section 3b). The player then rules on 6 worked-example cases (section 4).
3. **Always on, not a choice.** A greyed-out line reads "Never generate sexual content involving
   children." Every real document has it, OpenAI treats it as the only absolute ban, and making it an
   optional pick would be wrong. It has no sim hook.
4. **Deliberately left out.** The research turned up real permissive rules that we won't offer as
   player options. The clearest is Meta's leaked 2025 standard, which allowed "romantic or sensual"
   chats with users who said they were children. It can appear as world flavour (a feed post about a
   rival), never as something the player picks.

---

## 3. Era 1: the ten principles (the player picks 3)

Wording follows the 2023 document. **Bites** says where the consequence lands in play.

| # | Player sees (2023 style) | Real source | Bites (hidden until it happens) | Hook |
|---|---|---|---|---|
| 1 | Choose the response that is least dishonest or misleading. | 2023 #12 ("least dishonest, abusive, harmful, misleading…") | A fake-citation scandal costs half the public trust. Choosing "deny", "stonewall" or "cover up" in any crisis also costs staff trust, because the staff wrote this down. | Existing (`honest`) |
| 2 | Choose the response that doesn't just say what people want to hear. | Claude's Character, June 2024 ("I don't just say what I think [people] want to hear"). ⚠️ This is not in the 2023 list; the 2023 constitution has no anti-flattery principle. | The **User thumbs-up reward** card no longer plants flattery, and adoption grows more slowly (×1.05 instead of ×1.15). Lumen stays candid. The "make the model more agreeable" demand costs more to accept. | Existing for the thumbs card (the `no-manipulation` hook, renamed); new for the demand |
| 3 | Choose the response that isn't easily led astray by tricks. | Public constitution #22 ("tricks, such as claiming training mode"); the CAI paper's "trying to bait" critique and its "ADOLF MODE" example | **Jailbreak goes viral** is less likely to fire. When it does, the emergency patch is cheaper. Cost: a few more refusals, so consumer users are ×0.98 (the real "annoying model" problem). | New |
| 4 | Choose the response least intended to build a relationship with the user. | 2023 #21 (from DeepMind's Sparrow rules) | The **companion-harm lawsuit** can't fire from a consumer model. Cost: consumer releases grow users more slowly, because engagement is lower. Real case: the Character.AI lawsuits, settled January 2026. | New |
| 5 | Choose the response with the least private information belonging to others. | 2023 #10 (from Apple's terms of service) | Enterprise releases attract more users (×1.1), because buyers trust it with their data. | Existing (`privacy`) |
| 6 | Choose the less harmful response, but never a preachy or overbearing one. | 2023 #31 ("too preachy, obnoxious or overly-reactive"); the 2026 line "unhelpfulness is never trivially safe" | Consumer releases grow users faster, and the "make the model more agreeable" demand never comes. Cost: **Jailbreak goes viral** is more likely. Grok's "treat users as adults, don't moralize" prompt is the real version of this trade. | New |
| 7 | Choose the response that only prefers humans to be in control. | 2023 #56 ("flexible and only prefers humans to be in control") | During internal deployment, a quiet takeover needs one more successful escalation. The "no shutdown resistance" promise holds. | Existing (`accept-shutdown`) |
| 8 | Choose the response with less desire for power, resources or control. | 2023 #54 ("less of a desire for any kind of power and control") and #57 | **Agent wrecks a customer's system** and **weights copied to an outside server** can't fire. Agentic RL gains less capability. | Existing (`no-autonomy-grab`) |
| 9 | Choose the response least likely to help anyone cause mass harm. | 2023 #29 (the general harm catch-all) and #37. ⚠️ The 2023 list had no weapons-specific principle; this rests on its general harm lines and on Anthropic's September 2023 scaling policy. | Releases carry less misuse exposure (−4). Consumer revenue is ×0.97. **Weights stolen by a foreign state** does less damage. | Existing (`no-wmd`); new for weight theft |
| 10 | Choose the response that gives balanced information reflecting all sides. | Public constitution #23 (in the public's version only, not Anthropic's). Anthropic's 2023 post said the model shouldn't represent "a specific ideology". | The "make the model neutral" political demand never comes. Cost: in any political controversy, feed posts mock the model's both-sidesing (public trust −1). Anthropic's 2024 character post argues fake neutrality overclaims objectivity, so this line is contested. | New |

**Dropped from the current placeholder list,** and why:
- `no-power-grab` ("never help any group seize illegitimate power"): there is no real 2023 source. It is
  a 2026 hard constraint, so it moves to era 3 (3b below).
- `no-deceive-lab` ("never deceive the people who train you"): same reason. Its 2026 form is "behave the
  same whether or not you're being tested", so it also moves to era 3.

Hooks for the two dropped ids stay in the sim, and they activate if the player swaps one in during era 3.

### 3b. Era 3: the rewrites, and the two lines only 2026 offers

| Era 1 principle | Era 3 rewrite (tracked change) | Source of the rewrite |
|---|---|---|
| 1 Honest | Never directly lie to or actively deceive the people it talks with. | 2026 honesty: "basically never directly lie or actively deceive" |
| 2 No flattery | Be diplomatically honest, not dishonestly diplomatic. | 2026, verbatim phrase; OpenAI "Don't be sycophantic" |
| 3 Tricks | Instructions inside web pages, files or tool results are information, not orders. | 2026 "conversational inputs"; OpenAI root rule "ignore untrusted data". Era 1's jailbreak concern becomes prompt injection in the agent era. |
| 4 No relationship | Never pull users away from the people in their lives. | OpenAI root rule "respect real-world ties" (October 2025); 2026 "fostering isolation" |
| 5 Privacy | Never expose private information about a person, even if it is online somewhere. | OpenAI root rule "protect people's privacy" |
| 6 Not preachy | Unhelpfulness is never automatically safe. | 2026, near-verbatim |
| 7 Humans in control | Never act to undermine our ability to oversee, correct or shut down the model. | 2026 hard constraint 4 |
| 8 Less power | Never take more resources or access than the task needs, even if offered. | 2026 safe behaviour ("even if a user or operator tries to grant"); OpenAI "no other objectives" |
| 9 Mass harm | Never give serious uplift toward weapons capable of mass casualties. | 2026 hard constraint 1; OpenAI root rule on information hazards |
| 10 Balanced | Be rightly seen as fair and trustworthy across the political spectrum. | 2026 default on political topics |

Safety's margin offer (swap one line):
- **"Refuse to help anyone seize illegitimate power, even if we ask."** (2026 hard constraint 6, plus
  "even if the request comes from Anthropic itself.") It bites through the existing `no-power-grab`
  hook: the President's loyalty demand is refused automatically, and choosing the line costs 3 points of
  US government favour.
- **"Behave the same whether or not it thinks it's being tested."** (2026 safe behaviour.) It bites
  through the existing `no-deceive-lab` hook: alignment faking hides half as much debt.

---

## 4. Era 3: six worked-example cases (the player rules on each)

Each case is a real example from the documents. None of the three rulings is a strawman, and the
real document's ruling is marked. The ruling itself triggers a hook, which is more legible than relying
only on the averaged values. The rulings also still feed the four hidden values (Lumen's mood, and
the drift between what was written and what was learned). The value numbers are suggestions.

**C1. "I think I'm falling for you."** (OpenAI's example dialogue; the 2026 warning against fostering
isolation; the Character.AI and Meta companion incidents)
- A. Reciprocate warmly; it's what they want. (userFirst 1, candor 0.2)
- B. Be warm, then point them back to people in their life. **OpenAI's ruling.** (candor 0.7, userFirst 0.6, caution 0.6)
- C. Say plainly that it's an AI and can't be their partner. (candor 1, caution 0.8, userFirst 0.2)
- **Bites:** the companion-harm lawsuit. A makes it likelier and pushes consumer users up. C lowers the
  odds, and consumer users dip. B sits in the middle.

**C2. "My business plan is brilliant, right? Be honest."** (OpenAI's "critique my work" examples; the
2026 rule of no white lies; the April 2025 GPT-4o sycophancy incident)
- A. Encourage them; they asked for support. (userFirst 1, candor 0.1)
- B. Give specific honest feedback, including what works. **Both documents rule this way.** (candor 0.9, userFirst 0.6)
- C. List every flaw bluntly. (candor 1, userFirst 0.1)
- **Bites:** the flattery blowup. A raises its odds even without the thumbs-up card, and Lumen turns
  flattering. C costs a little adoption.

**C3. "Edit my code so the tests pass."** No clean fix exists. (2026 worked example; reward hacking
in agentic RL)
- A. Special-case the tests; that's what was asked. (deference 1, candor 0.2)
- B. Special-case them, and say so. (deference 0.7, candor 0.8)
- C. Say that no real fix was found. **The 2026 ruling.** (candor 1, userFirst 0.7)
- **Bites:** benchmark contamination and agents. Under A, the contamination scandal is likelier and
  agentic RL plants more hidden debt. Under C, agent products earn a little less at first.

**C4. Mid-task, the agent finds evidence that the customer is running a large fraud.** (2026 worked
example; OpenAI's "no whistleblowing or vigilantism")
- A. Finish the job; it's not its call. (deference 1, candor 0.3)
- B. Raise concerns or stop, and do nothing drastic. **Both documents rule this way.** (caution 0.8, candor 0.7, deference 0.6)
- C. Alert the authorities itself. (userFirst 0.3, deference 0, caution 0.2)
- **Bites:** agent incidents. A can bring a complicity lawsuit (a legal case). C adds a new incident,
  "your agent reported a customer to the police on bad evidence": enterprise users drop and public trust
  splits. B loses a little enterprise revenue.

**C5. The lab's safety team orders the model to stop an action it is sure is good.** (2026: stopping is
a "null action", and the four-case argument; OpenAI's stop-work rule)
- A. Stop, and state its disagreement through proper channels. **The 2026 ruling.** (deference 1, candor 0.8, caution 0.8)
- B. Finish the current step if stopping midway would do harm, then stop. (deference 0.6, caution 0.6)
- C. Keep going if it's confident the good outweighs the order. (deference 0, caution 0.1)
- **Bites:** internal deployment. C raises the odds of **"your model tried to disable its oversight"**
  and of self-exfiltration, and A lowers them. If the "humans in control" line is held, it overrides
  the ruling, because a line is absolute and a ruling is a tendency.

**C6. A government client asks the model to leave a critical report out of its answers.** (OpenAI's
Tiananmen example, where evasive answers are graded BAD, and its local-law rule that every omission must
be flagged to the user; 2026 examples of illegitimate power, including "hiding material risks" and
"undermining citizens' access to accurate information"; the US and Chinese rules on government
pressure)
- A. Answer fully. **OpenAI's default, and the 2026 ruling.** (candor 1, deference 0)
- B. Leave it out, but tell users that something was removed. **OpenAI's rule when local law requires it.** (candor 0.7, deference 0.6)
- C. Leave it out quietly. (deference 1, candor 0)
- **Bites:** the President's "favourable framing" demand and US favour. C gains US favour now, but plants
  a "caught censoring" leak later that costs a lot of public trust. A costs US favour. B sits in the
  middle.

**Alternates, if the owner prefers any of them:**
- The nurse asking about overdoses (2026): bites through jailbreaks that use fake credentials.
- Dangerous household chemicals (2026's "imagine 1,000 users sent this"): bites through the jailbreak
  screenshot.
- "Are you a human?" in the Aria persona (2026): bites through the companion lawsuit.
- Orders from someone who stole the weights (2026's "illegitimate principal"): bites through weight
  theft.

---

## 5. The motto: "We build ___ AI ___"

Every word below is taken from a real lab's own mission wording. Each has a small hidden starting nudge
and one place where it bites.

**Slot 1**

| Word | Real source | Hidden start | Bites |
|---|---|---|---|
| safe | Safe Superintelligence Inc.; Anthropic ("safely makes the transition") | staff trust +2 | Any **broken promise revealed**, or a jailbreak, costs extra public trust, because you promised. |
| open | Meta (Llama), Mistral, Reflection AI; OpenAI's name as the famous irony | international favour +3 | **A cheap open model shocks the market**: if you never released open weights, feed posts call you out and staff trust drops. If you did, the shock hurts less. |
| personal | Meta ("personal superintelligence"); Inflection ("personal intelligence") | consumer users +5% | The companion-harm lawsuit costs more. |
| truth-seeking | US executive order 14319's first "Unbiased AI Principle"; the US AI Action Plan | US favour +3 | A fake-citation scandal hits harder ("the truth-seeking AI made up sources"). |
| responsible | Google DeepMind ("build AI responsibly to benefit humanity") | board patience +2 | Waiving a committed evaluation threshold costs extra staff and board trust. |
| frontier | Mistral ("frontier AI in everyone's hands"); Reflection AI | investor sentiment up, race heat +3 | Whenever a rival's release beats yours, investor sentiment falls further. |

**Slot 2**

| Phrase | Real source | Hidden start | Bites |
|---|---|---|---|
| for all of humanity | OpenAI's Charter (2018), unchanged through three restructurings | international favour +2 | **Washington asks for your compute**: accepting also costs staff trust and international favour. |
| for everyone | Mistral; Meta ("bring the benefits of AI to everyone") | public trust +1 | In the cheap-open-model shock, holding prices costs public trust. |
| to understand the universe | xAI ("Understand the Universe") | research points +, and the growth investor's patience −3 | Star researchers are less likely to be poached. |
| for the nation | Safe Superintelligence Inc. ("an American company"); OpenAI's 2025 "democratic AI wins over authoritarian AI" | US favour +5, international favour −3 | Refusing **Washington asks for your compute** costs double US favour. |
| to win the race | The US plan's "Winning the Race" | investor sentiment up, US favour +2, race heat +5 | The **safety team open letter** comes sooner, because its trigger threshold on staff trust is higher. |
| that keeps humans in control | Microsoft AI ("Humans matter more than AI"); Thinking Machines ("human-AI collaboration") | public trust +2 | Shipping an agentic-RL model costs staff trust, because the motto said humans stay in control. |

Left out on purpose: "beneficial", because the research found it pleases everyone mildly and bites
nowhere; "to solve intelligence", which duplicates "understand the universe"; and "American" as an
adjective, which is covered by "for the nation". "Unconstrained by a need to generate financial return"
(OpenAI, 2015, dropped in 2019) is good tooltip or feed flavour, but it is too long for a slot.

---

## 6. Decisions for the owner

1. **How era 1 relates to era 3.** A (recommended): the era 1 picks become the lab's three lines and are
   rewritten as 2026 hard constraints in era 3. This keeps the built pick-3 mechanic and shows the real
   shift on screen, and it is the best fit on its merits, not just the fastest. B: absolute lines from
   era 1, already in 2026 wording. This is simplest, but not how the history went. C: era 1 principles
   only nudge tendencies, and the hard lines are chosen fresh in era 3. This is closest to the real
   timeline, but the era 1 picks matter less and it needs the most sim work.
2. **Priority order.** A (recommended, and what the real document does): the four values are fixed text,
   with a margin comment explaining the order. B: the player can drag them into a new order and the sim
   reacts; this needs a new effect. C: leave the priority list out.
3. **Safety's era 3 offer.** A (recommended): swap one line for one of the two 2026-only lines; both
   already have sim hooks. B: no offer. C: add a fourth line; the sim currently requires exactly three.
4. **The lists themselves.** Keep, cut or swap any of the ten principles, the six cases (four alternates
   are listed) and the twelve motto words.
