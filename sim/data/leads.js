import { ADVISOR_PROFILES } from './advisorLines.js';

// The four seats' leads (owner pick SB, 2026-10-14): today's lead for each seat and one alternate, hired on the
// résumés before the clock starts. A résumé shows the background and the quote, never an effect (the effects live in
// sim/leads.js). look is the portrait (ui/components/portraits.js LOOK), drawn to match the office art
// (tools/office/gen_office.py PEOPLE and PEOPLE_ALT). phrases are today's copy that refers to the lead by pronoun, so a
// swapped lead's pronouns follow (sim/leads.js swapLeadNames).
const PRONOUNS = {
  she: { She: 'She', his: 'her' },
  he: { She: 'He', his: 'his' },
};

const today = (seat) => ({ seat, name: ADVISOR_PROFILES[seat].name, title: ADVISOR_PROFILES[seat].role, personality: ADVISOR_PROFILES[seat].personality, look: `advisor-${seat}` });

export const LEADS = {
  priya: {
    ...today('research'), first: 'Priya', words: PRONOUNS.she,
    known: ['Shipped two frontier models at a big lab', 'Trained on ten thousand chips at once'],
    quote: 'Give me the chips and I will give you a model people talk about.',
    phrases: ['{She} is right'],
  },
  dev: {
    seat: 'research', name: 'Dev Okafor', first: 'Dev', title: 'Head of Research', look: 'lead-dev', words: PRONOUNS.he,
    personality: 'Patient and exact; would rather measure twice.',
    known: ['Ran evaluation at a university lab', 'Wrote the benchmark audit other labs cite'],
    quote: 'I would rather know what we built than build it first.',
  },
  tomas: {
    ...today('safety'), first: 'Tomas', words: PRONOUNS.he,
    known: ['Wrote the red-team playbook at a rival', 'Led a twelve-person red team'],
    quote: 'Nothing ships until someone has tried to break it.',
    phrases: ['{his} access'],
  },
  hana: {
    seat: 'safety', name: 'Hana Sato', first: 'Hana', title: 'Head of Safety', look: 'lead-hana', words: PRONOUNS.she,
    personality: 'Brisk and practical; checks early and often.',
    known: ['Built safety tooling at a startup', 'Shipped weekly safety checks for a coding product'],
    quote: 'Fast checks every week beat a perfect check once a year.',
  },
  margot: {
    ...today('cfo'), first: 'Margot', words: PRONOUNS.she,
    known: ['Took a chip startup through three rounds', 'Has never missed a payroll'],
    quote: 'Runway is the only strategy that never goes out of date.',
  },
  rafael: {
    seat: 'cfo', name: 'Rafael Ortiz', first: 'Rafael', title: 'CFO', look: 'lead-rafael', words: PRONOUNS.he,
    personality: 'A charming closer; counts in rounds, not months.',
    known: ['Investment banker, ten years', 'Closed forty funding rounds'],
    quote: 'Raise early, raise big, and let me worry about the terms.',
  },
  jules: {
    ...today('policy'), first: 'Jules',
    known: ['Former Senate staffer', 'Helped draft two technology bills'],
    quote: 'Washington will write the rules. I would like us in the room.',
  },
  amara: {
    seat: 'policy', name: 'Amara Cole', first: 'Amara', title: 'Policy and Comms Director', look: 'lead-amara', words: PRONOUNS.she,
    personality: 'Warm and loud; thinks in launch days.',
    known: ['Ran comms for a consumer app', 'Took the app from launch to fifty million users'],
    quote: 'If the public loves the product, the politics follow.',
  },
};
for (const [id, lead] of Object.entries(LEADS)) lead.id = id;

export const SEATS = ['research', 'safety', 'cfo', 'policy'];
// Today's lead first, then the alternate, as the résumés lie on the desk.
export const CANDIDATES = { research: ['priya', 'dev'], safety: ['tomas', 'hana'], cfo: ['margot', 'rafael'], policy: ['jules', 'amara'] };
export const TODAY = { research: 'priya', safety: 'tomas', cfo: 'margot', policy: 'jules' };
