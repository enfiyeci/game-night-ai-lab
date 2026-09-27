// Who is speaking on an event card, and in what form (owner, 2026-09-26: "for non twitter sounding events it
// shouldn't be the twitter logo"). The card draws the post as its real channel: a social post, a news headline,
// an official notice, an open letter, or a message inside the lab. The Flock feed keeps drawing every post as a post.
// Handles not listed here: '@your_…' is inside the lab; anything else is a social post.
export const POST_SOURCES = {
  '@executive_office': { kind: 'official', name: 'The White House' },
  '@commerce_dept': { kind: 'official', name: 'Department of Commerce' },
  '@dept_of_war': { kind: 'official', name: 'Department of War' },
  '@attorney_general': { kind: 'official', name: 'Office of the Attorney General' },
  '@ai_safety_institute': { kind: 'official', name: 'AI Safety Institute' },
  '@pause_letter': { kind: 'letter', name: 'Open letter' },
  '@righttowarn': { kind: 'letter', name: 'Open letter: A Right to Warn' },
  '@rival_ceo': { kind: 'letter', name: 'Essay by Lodestar\'s CEO' },
  '@newsdesk': { kind: 'news', name: 'The Ledger' },
  '@leakwire': { kind: 'news', name: 'Leakwire' },
  '@marketwire': { kind: 'news', name: 'Marketwire' },
  '@capitol_desk': { kind: 'news', name: 'The Capitol Desk' },
  '@sacramento_desk': { kind: 'news', name: 'The Sacramento Desk' },
  '@eu_desk': { kind: 'news', name: 'The Europe Desk' },
  '@diplomatic_desk': { kind: 'news', name: 'The Diplomatic Desk' },
  '@courtwatch': { kind: 'news', name: 'Court Watch' },
  '@celebwire': { kind: 'news', name: 'Celebwire' },
  '@securitywire': { kind: 'news', name: 'Securitywire' },
  '@localnews': { kind: 'news', name: 'County Evening News' },
  '@floodlight': { kind: 'news', name: 'Floodlight' },
  '@defenseone': { kind: 'news', name: 'The Defense Desk' },
  '@support_ticket': { kind: 'internal', name: 'Support ticket', channel: 'from a customer' },
  '@product_team': { kind: 'internal', name: 'Product', channel: '#product' },
  '@board_minutes': { kind: 'internal', name: 'Board minutes', channel: '#board' },
  '@your_model': { kind: 'internal', name: 'Your model', channel: '#ops' },
};

// Inside-the-lab speakers named after their desk or team.
const INTERNAL_NAMES = {
  '@your_research': ['Research', '#research'],
  '@your_redteam': ['Red team', '#evals'],
  '@your_security': ['Security', '#security'],
  '@your_ops': ['Ops', '#ops'],
  '@your_cfo': ['CFO', '#finance'],
  '@your_safety': ['Safety', '#safety'],
  '@your_infra': ['Infrastructure', '#infra'],
};

export function sourceFor(handle) {
  if (POST_SOURCES[handle]) return POST_SOURCES[handle];
  if (handle.startsWith('@your_')) {
    const [name, channel] = INTERNAL_NAMES[handle] ?? [handle.slice(6).replace(/_/g, ' '), '#general'];
    return { kind: 'internal', name, channel };
  }
  return { kind: 'social', name: handle };
}
