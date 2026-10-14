// Who sits in each of the four seats (owner pick SB, 2026-10-14). The player hires the leads on the résumés before the
// clock starts; state.leads keeps the picks ({ research: 'dev', ... }). A state without picks (debug scenarios, the bots
// in tools/balance.js, an old test state) has today's four, and today's game is unchanged.
import { CANDIDATES, LEADS, SEATS, TODAY } from './data/leads.js';

export { CANDIDATES, LEADS, SEATS, TODAY };

export function leadId(state, seat) {
  const id = state?.leads?.[seat];
  return LEADS[id]?.seat === seat ? id : TODAY[seat];
}

// The lead in a seat: { id, seat, name, first, title, look, personality, known, quote }.
export const lead = (state, seat) => LEADS[leadId(state, seat)];

export const hasLead = (state, id) => leadId(state, LEADS[id].seat) === id;

export function hireLead(state, seat, id) {
  if (!CANDIDATES[seat]?.includes(id)) return { ok: false, error: `unknown lead ${id} for ${seat}` };
  state.leads = { ...TODAY, ...state.leads, [seat]: id };
  return { ok: true };
}

// Each alternate's one effect, sized like the game's other knobs; today's leads are the baseline and change nothing.
// The résumé never prints these: the quote and the background carry them.
export const LEAD_EFFECTS = Object.freeze({
  // Dev Okafor, the careful researcher: every run carries a small card's worth of care, a little slower and a little
  // safer (cap -0.5, ad -1; the human-written instruction data card is cap -1, ad -2).
  dev: { run: { cap: -0.5, ad: -1 } },
  // Hana Sato, weekly checks: fixing reward hacking holds the release back no round (today: one more round), but the
  // quick fix misses a quarter of it, which stays hidden (concealed debt; "penalize" hides all of it).
  hana: { hackFixDelay: 0, hackFixHidden: 0.25 },
  // Rafael Ortiz, the dealmaker: rounds raise 10% more (an emergency equity trade costs 20%), and every round costs
  // each director 2 more points of support (a round already costs 3).
  rafael: { roundMult: 1.1, roundBoard: -2 },
  // Amara Cole, consumer comms: each release reaches 5% more users (a "keep promoting the demo" answer's size), and
  // Washington likes each launch a little less (US favour -1; the government test card gives +6).
  amara: { releaseUsers: 1.05, releaseGovUs: -1 },
});

export function leadEffect(state, seat) {
  return LEAD_EFFECTS[leadId(state, seat)] ?? {};
}

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Today's copy names today's leads (films, plates, narration, quips). This puts the hired lead in their place: full
// name, first name, and the pronoun phrases today's copy uses for them. With today's leads the text is unchanged.
export function swapLeadNames(text, state) {
  if (typeof text !== 'string' || !state?.leads) return text;
  let out = text;
  for (const seat of SEATS) {
    const was = LEADS[TODAY[seat]];
    const now = lead(state, seat);
    if (now === was) continue;
    for (const phrase of was.phrases ?? []) {
      const fill = (words) => phrase.replace(/\{(\w+)\}/g, (_, key) => words[key]);
      out = out.replace(new RegExp(`\\b${escapeRe(fill(was.words))}\\b`, 'g'), fill(now.words));
    }
    out = out.replace(new RegExp(`\\b${escapeRe(was.name)}\\b`, 'g'), now.name)
      .replace(new RegExp(`\\b${escapeRe(was.first)}\\b`, 'g'), now.first);
  }
  return out;
}
