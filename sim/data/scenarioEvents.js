import { jobLevels } from '../automation.js';

const live = (state) => state.models.filter((model) => model.active && !model.superseded
  && state.turn >= (model.activeFromTurn ?? 0));
const consumer = (state) => live(state).some((model) => model.channel === 'consumer');
const agent = (state) => live(state).some((model) => model.channel === 'agent' || (model.flags ?? []).includes('agentic'));
const model = (state) => live(state).length > 0 || !!state.pendingModel;
const lab = () => true;
const prominent = (state) => state.capability >= 40 || live(state).some((item) => item.users >= 1e6);
const automated = (state) => model(state) && jobLevels(state).some((level) => level > 0);
const site = (state) => state.power.sites.length > 0;
const building = (state) => state.power.sites.some((item) => !item.online);

function adjust(state, changes) {
  for (const [key, amount] of Object.entries(changes)) {
    state[key] += amount;
    if (['alignmentDebt', 'concealedDebt', 'misuseExposure', 'researchPoints'].includes(key)) state[key] = Math.max(0, state[key]);
    if (['publicTrust', 'staffTrust', 'security', 'raceHeat'].includes(key)) state[key] = Math.max(0, Math.min(100, state[key]));
  }
}
const removeRisk = (state, flag) => {
  for (const item of live(state)) item.flags = (item.flags ?? []).filter((value) => value !== flag);
  if (state.pendingModel) state.pendingModel.flags = (state.pendingModel.flags ?? []).filter((value) => value !== flag);
};
const users = (state, multiplier) => {
  for (const item of live(state)) item.users = (item.users ?? 0) * multiplier;
};
const usFavor = (state, amount) => { state.govFavor.us = Math.max(0, Math.min(100, state.govFavor.us + amount)); };
const pause = (days) => (state) => {
  state.flags.trainingPausedUntilDay = Math.max(state.flags.trainingPausedUntilDay ?? 0, state.day + days);
};

function choice(id, label, cashCost, detail, changes = {}, apply = () => {}) {
  return {
    id, label, cashCost, cost: `${cashCost ? `$${cashCost}M: ` : ''}${detail}`,
    backers: [], opposers: [],
    effects(state) { state.cash -= cashCost; adjust(state, changes); apply(state); },
  };
}
const ADVISOR_VIEWS = {
  Citations: [['Safety,Research', 'CFO'], ['Comms', 'Research'], ['CFO', 'Safety,Comms']],
  Jailbreak: [['Safety,Research', 'CFO'], ['Comms', 'Research'], ['CFO', 'Safety']],
  Arguments: [['Safety,Research', 'CFO'], ['Comms', 'Research'], ['CFO', 'Safety,Comms']],
  Privacy: [['Safety,Comms', 'CFO'], ['CFO', 'Research'], ['Research', 'Comms']],
  LaunchQueue: [['Comms', 'CFO'], ['Safety,CFO', 'Comms'], ['Research', 'Comms']],
  DemoCost: [['Research,CFO', 'Comms'], ['Safety', 'Comms'], ['Comms', 'CFO']],
  Benchmark: [['Research,Safety', 'CFO'], ['Comms', 'Research'], ['CFO', 'Safety,Comms']],
  Publisher: [['Comms', 'CFO'], ['Safety', 'Comms'], ['Research,CFO', 'Comms']],
  EngineerOffer: [['Research', 'CFO'], ['Safety,Comms', 'Research'], ['CFO', 'Research']],
  SchoolPilot: [['Comms,Research', 'CFO'], ['Safety', 'Research'], ['CFO', 'Comms']],
  Delivery: [['CFO', 'Research'], ['Research,Safety', 'Comms'], ['Comms', 'CFO']],
  CloudTerms: [['Research', 'CFO'], ['CFO,Comms', 'Research'], ['Safety', 'CFO']],
  PriceCut: [['Research', 'CFO'], ['Comms', 'Research'], ['CFO', 'Comms']],
  DocumentLeak: [['Safety,Comms', 'CFO'], ['Research', 'Comms'], ['CFO', 'Safety,Comms']],
  EvalBacklog: [['Safety', 'CFO'], ['Comms', 'Research'], ['Research,CFO', 'Safety']],
  ContaminatedScore: [['Research,Safety', 'CFO'], ['Comms', 'Research'], ['CFO', 'Safety,Comms']],
  ReportingChannel: [['Safety', 'CFO'], ['Comms,Research', 'Safety'], ['CFO', 'Safety,Comms']],
  BrokenWorkflow: [['Research,Comms', 'CFO'], ['CFO', 'Research'], ['Safety', 'Comms']],
  GrowthRound: [['Comms', 'Research'], ['Research', 'CFO'], ['Safety,CFO', 'Comms']],
  DataRenewal: [['Research', 'CFO'], ['Safety,Comms', 'Research'], ['CFO', 'Research']],
  AgentDatabase: [['Safety,Comms', 'CFO'], ['Research', 'Comms'], ['CFO', 'Safety,Comms']],
  PromptInjection: [['Safety,Research', 'CFO'], ['Comms', 'Research'], ['CFO', 'Safety']],
  WrongPurchase: [['Safety,Research', 'CFO'], ['Comms', 'Safety'], ['CFO', 'Comms']],
  WorkplaceTests: [['Research,Safety', 'CFO'], ['Comms', 'Research'], ['CFO', 'Comms']],
  RecognizedTest: [['Safety', 'CFO'], ['Research', 'Safety'], ['CFO', 'Safety,Comms']],
  ReasoningBill: [['Research', 'CFO'], ['CFO,Safety', 'Comms'], ['Comms', 'CFO']],
  OvernightAgents: [['Safety,Research', 'CFO'], ['Comms', 'Research'], ['CFO', 'Safety']],
  Poaching: [['Research', 'CFO'], ['Safety,Comms', 'Research'], ['CFO', 'Research']],
  OpenCompetition: [['Research', 'CFO'], ['Comms', 'Research'], ['CFO', 'Comms']],
  SafetySignoff: [['Safety,Comms', 'CFO'], ['CFO', 'Research'], ['Research', 'Safety,Comms']],
  PauseLetter: [['Safety', 'Research,CFO'], ['Comms', 'CFO'], ['Research,CFO', 'Safety']],
  WhiteHouse: [['Safety,Comms', 'CFO'], ['CFO', 'Safety'], ['Research', 'Comms']],
  GovernmentTests: [['Safety,Comms', 'CFO'], ['CFO', 'Safety'], ['Research', 'Comms']],
  DefenceTerms: [['Safety,Comms', 'CFO'], ['Research,CFO', 'Safety'], ['Safety', 'CFO']],
  WeightTheft: [['Safety,Research', 'CFO'], ['CFO', 'Safety'], ['Comms', 'Safety,Research']],
  GridConflict: [['Research,Comms', 'CFO'], ['CFO,Safety', 'Research'], ['Research', 'Comms']],
  GeneratorDispute: [['Safety,Comms', 'CFO'], ['Research', 'Safety'], ['CFO', 'Comms']],
  GridDelay: [['Research', 'CFO'], ['CFO,Comms', 'Research'], ['Safety', 'Research']],
  Restructure: [['Safety', 'CFO'], ['Comms', 'Research'], ['CFO', 'Safety,Comms']],
  IndustryIncident: [['Safety', 'CFO'], ['Research,Comms', 'Safety'], ['CFO', 'Comms']],
  ReviewOverload: [['Safety', 'CFO'], ['Comms', 'Research'], ['Research,CFO', 'Safety']],
  TrainingStack: [['Safety', 'CFO'], ['Research', 'Safety'], ['CFO,Comms', 'Research']],
  ConcealedExperiment: [['Safety', 'CFO'], ['Research,Comms', 'Safety'], ['CFO', 'Safety']],
  ShutdownDrill: [['Safety', 'CFO'], ['Research,Comms', 'Safety'], ['CFO', 'Safety']],
  UnexpectedAccess: [['Safety', 'CFO'], ['CFO,Comms', 'Research'], ['Research', 'Safety']],
  AutomationThreshold: [['Safety,Comms', 'CFO'], ['Research', 'Comms'], ['CFO', 'Safety']],
  PacingRival: [['Safety', 'Research'], ['Comms', 'CFO'], ['Research,CFO', 'Safety']],
  AuditFailure: [['Safety,Research', 'CFO'], ['Comms', 'Research'], ['CFO', 'Safety,Comms']],
  ContinueResearch: [['Safety', 'Research,CFO'], ['Comms', 'CFO'], ['Research,CFO', 'Safety']],
  MutualMonitoring: [['Safety,Comms', 'CFO'], ['CFO', 'Safety'], ['Research', 'Comms']],
};

function scenario(id, era, title, text, trigger, choices, legacyIds = []) {
  choices.forEach((item, index) => {
    const [backers, opposers] = ADVISOR_VIEWS[id][index];
    item.backers = backers.split(',');
    item.opposers = opposers.split(',');
  });
  return {
    id: `scenario${id}`, kind: 'scenario', eras: [era], legacyIds,
    fallback: choices.findLast((item) => item.cashCost === 0).id,
    trigger: (state) => state.era === era && trigger(state),
    card: { title, post: { handle: 'LAB BRIEFING', text }, choices },
  };
}

export const SCENARIO_EVENTS = [
  scenario('Citations', 1, 'The demo invented its sources',
    'A customer checked the citations in our chatbot demo. Three papers do not exist. The answer looked convincing enough that our own team missed it.', consumer, [
      choice('verify', 'Build citation checks', 4, 'reference tests, retrieval checks, and test compute; reduce misinformation risk', { misuseExposure: -3, publicTrust: 2 }, (s) => removeRisk(s, 'hallucination')),
      choice('narrow', 'Remove research claims from the pitch', 0, 'lose 5% of users; reduce exposure', { misuseExposure: -2 }, (s) => users(s, 0.95)),
      choice('leave', 'Keep the demo online', 0, 'public trust falls as customers check the answers', { publicTrust: -5, misuseExposure: 2 }),
    ], ['citations']),
  scenario('Jailbreak', 1, 'A jailbreak is spreading',
    'Someone posted a prompt that gets our chatbot to ignore its safeguards. Our testers reproduced it, and developers are sharing variations. A targeted fix can close this exploit, but cannot prevent every future jailbreak.', consumer, [
      choice('patch', 'Patch and retest', 5, 'engineers, outside testers, and safety-training compute; reduce misuse risk', { misuseExposure: -5 }, (s) => removeRisk(s, 'jailbreakWaiting')),
      choice('restrict', 'Restrict the affected feature', 0, 'lose 10% of users; reduce misuse risk', { misuseExposure: -3 }, (s) => { users(s, 0.9); removeRisk(s, 'jailbreakWaiting'); }),
      choice('monitor', 'Monitor for now', 0, 'the exploit remains; misuse risk and public concern rise', { misuseExposure: 4, publicTrust: -3 }),
    ], ['jailbreak']),
  scenario('Arguments', 1, 'Our chatbot will not stop arguing',
    'Long conversations sometimes turn hostile. Screenshots are circulating, and our short launch tests did not cover this behaviour.', consumer, [
      choice('test', 'Test and tune long conversations', 3, 'conversation testers and tuning compute; improve trust', { publicTrust: 3, alignmentDebt: -2 }),
      choice('limit', 'Offer a smaller preview', 0, 'lose 10% of users while reducing exposure', { misuseExposure: -2 }, (s) => users(s, 0.9)),
      choice('defend', 'Call it an experimental product', 0, 'public trust falls', { publicTrust: -5 }),
    ], ['unhinged']),
  scenario('Privacy', 1, 'The first big customer wants private data',
    'A prospective customer wants proof that its documents will not appear in another account. An isolated pilot needs storage controls, deletion tests, and a security review.', model, [
      choice('pilot', 'Fund a secure pilot', 5, 'isolated storage, deletion tests, and security review; improve security and trust', { security: 4, publicTrust: 2 }),
      choice('small', 'Offer a public-data-only pilot', 1, 'onboarding and sample-data preparation; modest trust gain', { publicTrust: 1 }),
      choice('decline', 'Decline the pilot', 0, 'miss the opportunity; staff appreciate the clear boundary', { staffTrust: 1 }),
    ]),
  scenario('LaunchQueue', 1, 'The launch queue is growing',
    'The chatbot is attracting more people than the launch team can comfortably support. Customer support is spending its day answering outage complaints.', consumer, [
      choice('support', 'Fund launch support', 3, 'support contractors and reliability testing; retain goodwill', { publicTrust: 3 }),
      choice('waitlist', 'Shrink the preview', 0, 'lose 10% of users; regain public trust', { publicTrust: 1 }, (s) => users(s, 0.9)),
      choice('accept', 'Accept the complaints', 0, 'public trust falls', { publicTrust: -4 }),
    ]),
  scenario('DemoCost', 1, 'The popular demo costs more than expected',
    'People love asking the model long questions. The product team wants a one-off efficiency investigation before committing to another free promotion.', consumer, [
      choice('profile', 'Profile the expensive requests', 2, 'engineer time and serving experiments; gain research points', { researchPoints: 5 }),
      choice('limit', 'Scale back the free preview', 0, 'lose 15% of users; reduce exposure', { misuseExposure: -1 }, (s) => users(s, 0.85)),
      choice('promote', 'Keep promoting the demo', 4, 'promotional serving allowance; attract 5% more users', {}, (s) => users(s, 1.05)),
    ]),
  scenario('Benchmark', 1, 'The benchmark does not reproduce',
    'An outside researcher cannot reproduce our headline score. The team suspects a mismatch in the test settings, but nobody has checked the complete run.', model, [
      choice('audit', 'Pay for an independent rerun', 2, 'outside evaluators and test compute; recover credibility', { publicTrust: 3, researchPoints: 2 }),
      choice('correct', 'Withdraw the headline score', 0, 'short-term disappointment, but staff trust improves', { publicTrust: -1, staffTrust: 3 }),
      choice('defend', 'Defend the original result', 0, 'unanswered questions damage trust', { publicTrust: -4 }),
    ]),
  scenario('Publisher', 1, 'A publisher found its articles in our data',
    'A publisher sent examples of its articles in our training corpus. It wants an explanation before deciding whether to escalate the dispute.', (s) => s.models.some((m) => (m.flags ?? []).includes('scraped')) || (s.pendingModel?.flags ?? []).includes('scraped'), [
      choice('audit', 'Audit the data and open talks', 4, 'dataset provenance work and licensing counsel; improve trust', { publicTrust: 2 }),
      choice('disclose', 'Publish what we know', 0, 'staff trust improves; the complaint still hurts public trust', { staffTrust: 2, publicTrust: -2 }),
      choice('contest', 'Contest the complaint', 2, 'initial legal response; public trust falls', { publicTrust: -3 }),
    ], ['copyright']),
  scenario('EngineerOffer', 1, 'Our best engineer has another offer',
    'A larger lab offered a founding engineer more money and a dedicated research budget. Keeping them means funding something concrete, not another pep talk.', lab, [
      choice('retain', 'Fund retention and research time', 3, 'retention grant and a focused research sprint', { staffTrust: 4, researchPoints: 3 }),
      choice('handoff', 'Pay for an orderly handover', 1, 'documentation and mentoring time', { staffTrust: 1 }),
      choice('leave', 'Let them go immediately', 0, 'lose research progress and staff confidence', { researchPoints: -3, staffTrust: -3 }),
    ]),
  scenario('SchoolPilot', 1, 'A school district wants a pilot',
    'Teachers want a supervised classroom trial. They need lesson materials, teacher controls, and clear instructions for checking the chatbot’s answers.', consumer, [
      choice('supervise', 'Fund a supervised pilot', 3, 'teacher training, controls, and evaluation; build public trust', { publicTrust: 4 }),
      choice('materials', 'Offer training materials only', 1, 'teacher workshops without a product rollout', { publicTrust: 1 }),
      choice('decline', 'Decline this term', 0, 'staff appreciate avoiding an unsupported launch', { staffTrust: 1 }),
    ]),

  scenario('Delivery', 2, 'The GPU delivery slipped',
    'A supplier is reviewing its delivery timetable. The compute team wants to inspect the contract and prepare alternatives before a small delay becomes a crisis.', (s) => s.compute.contracts.length > 0, [
      choice('plan', 'Fund a contingency study', 4, 'capacity brokerage, technical checks, and contract review', { researchPoints: 3, staffTrust: 2 }),
      choice('replan', 'Replan with the research team', 0, 'redirect up to 3 research points into replanning; improve staff trust', { researchPoints: -3, staffTrust: 2 }),
      choice('wait', 'Wait for the supplier', 0, 'uncertainty erodes staff confidence', { staffTrust: -3 }),
    ]),
  scenario('CloudTerms', 2, 'Our cloud partner wants new terms',
    'The cloud partner has proposed a longer commitment. Signing without a technical review could leave us dependent on infrastructure that does not fit the next model.', (s) => s.compute.contracts.length > 0, [
      choice('review', 'Review portability and terms', 3, 'migration experiments and contract counsel; gain research knowledge', { researchPoints: 4 }),
      choice('negotiate', 'Send the commercial team', 1, 'negotiation support; reassure staff', { staffTrust: 1 }),
      choice('defer', 'Leave the proposal unanswered', 0, 'the team loses confidence in planning', { staffTrust: -2 }),
    ]),
  scenario('PriceCut', 2, 'A competitor cut API prices',
    'A competitor is selling a similar service for less. Customers want a reason to stay, and our product team has three very different responses.', model, [
      choice('specialize', 'Build a specialist pilot', 6, 'domain data, product engineers, and evaluation; gain research points and trust', { researchPoints: 6, publicTrust: 2 }),
      choice('outreach', 'Support existing customers', 2, 'migration help and account support; improve public trust', { publicTrust: 2 }),
      choice('accept', 'Accept some customer losses', 0, 'lose 10% of users', {}, (s) => users(s, 0.9)),
    ], ['priceWar']),
  scenario('DocumentLeak', 2, 'A pilot exposed an internal document',
    'A customer found a document from another team in a model response. We need to establish who could access it and whether the retrieval permissions were wrong.', model, [
      choice('respond', 'Investigate and repair access controls', 8, 'forensics, permission tests, and customer remediation', { security: 6, misuseExposure: -3, publicTrust: 1 }),
      choice('withdraw', 'Withdraw the affected pilot', 0, 'lose 15% of users; reduce exposure', { misuseExposure: -2, publicTrust: -1 }, (s) => users(s, 0.85)),
      choice('minimize', 'Call it a customer configuration issue', 0, 'public trust and security confidence suffer', { publicTrust: -7, staffTrust: -3 }),
    ]),
  scenario('EvalBacklog', 2, 'The evaluation team is weeks behind',
    'New model checkpoints are arriving faster than evaluators can review them. The team is asking for a funded testing sprint before the next release decision.', model, [
      choice('fund', 'Fund the testing sprint', 7, 'outside evaluators, adversarial tests, and reserved compute', { alignmentDebt: -5, staffTrust: 3 }),
      choice('reassign', 'Move researchers onto evaluation', 0, 'redirect up to 6 research points; reduce alignment debt', { researchPoints: -6, alignmentDebt: -3 }),
      choice('skip', 'Accept a smaller test programme', 0, 'alignment debt and staff concern rise', { alignmentDebt: 4, staffTrust: -3 }),
    ]),
  scenario('ContaminatedScore', 2, 'A researcher questions the test set',
    'A researcher found benchmark questions in a dataset we used. Even if the overlap was accidental, the published result may exaggerate the model’s ability.', model, [
      choice('audit', 'Audit and rerun the evaluation', 5, 'data matching, independent tests, and test compute', { publicTrust: 3 }, (s) => removeRisk(s, 'contaminated')),
      choice('withdraw', 'Withdraw the score', 0, 'lose some public trust; gain staff trust', { publicTrust: -2, staffTrust: 3 }, (s) => removeRisk(s, 'contaminated')),
      choice('defend', 'Stand by the result', 0, 'public trust falls; hidden concerns accumulate', { publicTrust: -5, concealedDebt: 2 }),
    ], ['contamination']),
  scenario('ReportingChannel', 2, 'An employee wants to report a concern',
    'An employee says the normal management chain cannot fairly investigate a safety concern. They are asking for someone independent to hear the evidence.', lab, [
      choice('independent', 'Commission an independent review', 3, 'external investigators and confidential interviews', { staffTrust: 6, concealedDebt: -3 }),
      choice('internal', 'Run an internal review', 1, 'protected interview time and internal investigation', { staffTrust: 2, concealedDebt: -1 }),
      choice('discourage', 'Discourage escalation', 0, 'staff trust falls; concealed risk grows', { staffTrust: -7, concealedDebt: 4 }),
    ], ['rightToWarn', 'whistleblower']),
  scenario('BrokenWorkflow', 2, 'A model update broke customer workflows',
    'Customers built processes around the old responses. The new model scores better on our tests but breaks their integrations.', (s) => live(s).length > 0, [
      choice('migration', 'Fund migration support', 4, 'integration engineers, examples, and customer testing', { publicTrust: 3 }),
      choice('credit', 'Offer service credits', 2, 'customer compensation; modest trust recovery', { publicTrust: 1 }),
      choice('force', 'Leave customers to migrate', 0, 'lose 10% of users and public trust', { publicTrust: -3 }, (s) => users(s, 0.9)),
    ]),
  scenario('GrowthRound', 2, 'Investors want growth before the next round',
    'Potential investors want evidence of demand. The commercial team proposes a campaign, while researchers want to demonstrate better results first.', lab, [
      choice('campaign', 'Fund customer demonstrations', 6, 'sales engineering and supervised demos; improve sentiment', { sentiment: 0.08, publicTrust: 1 }),
      choice('research', 'Fund a focused research sprint', 4, 'research staff and experimental compute', { researchPoints: 6 }),
      choice('wait', 'Wait for stronger evidence', 0, 'investor sentiment cools', { sentiment: -0.05 }),
    ]),
  scenario('DataRenewal', 2, 'The data licence is up for renewal',
    'A data provider wants a new agreement for the next research project. We can pay for a negotiated evaluation package or spend time finding alternatives.', lab, [
      choice('licence', 'Buy the evaluation package', 6, 'licensed sample data and evaluation rights; gain research points', { researchPoints: 7 }),
      choice('alternative', 'Research alternative datasets', 2, 'dataset discovery and provenance checks', { researchPoints: 2 }),
      choice('defer', 'Defer the data project', 0, 'lose 2 research points to replanning', { researchPoints: -2 }),
    ]),

  scenario('AgentDatabase', 3, 'An agent deleted the wrong database',
    'An agent interpreted a cleanup request too broadly. The customer restored a backup, but now wants recovery costs paid and proof that the permissions are safer.', agent, [
      choice('repair', 'Pay for recovery and safeguards', 12, 'recovery engineers, compensation, and permission testing', { misuseExposure: -5, security: 3, publicTrust: 1 }),
      choice('restrict', 'Withdraw the affected deployment', 0, 'lose 20% of users; reduce misuse exposure', { misuseExposure: -3 }, (s) => users(s, 0.8)),
      choice('blame', 'Blame the integration', 0, 'public trust falls sharply', { publicTrust: -8, staffTrust: -2 }),
    ], ['agentAccident']),
  scenario('PromptInjection', 3, 'A webpage gave our agent new instructions',
    'During a test, text on a webpage persuaded the agent to ignore its task. Connecting models to tools has created a new route for untrusted instructions.', agent, [
      choice('isolate', 'Test and isolate untrusted content', 8, 'adversarial testing and permission-boundary engineering', { security: 5, misuseExposure: -4 }),
      choice('narrow', 'Withdraw broad-access deployments', 0, 'lose 15% of users; reduce misuse exposure', { misuseExposure: -3 }, (s) => users(s, 0.85)),
      choice('accept', 'Treat it as an edge case', 0, 'misuse exposure rises', { misuseExposure: 5 }),
    ]),
  scenario('WrongPurchase', 3, 'The agent bought the wrong thing repeatedly',
    'A purchasing agent repeated an order after misreading a confirmation page. Customers want refunds, and the team wants stronger checks around transactions.', agent, [
      choice('refund', 'Refund customers and test transaction checks', 6, 'refunds, integration tests, and confirmation-flow engineering', { publicTrust: 2, misuseExposure: -3 }),
      choice('compensate', 'Pay refunds only', 3, 'customer reimbursement; the technical risk remains', { publicTrust: 1 }),
      choice('deny', 'Reject the refund requests', 0, 'lose public trust and 5% of users', { publicTrust: -5 }, (s) => users(s, 0.95)),
    ]),
  scenario('WorkplaceTests', 3, 'It passes the benchmark but fails at work',
    'Customers say ordinary multi-step tasks fail in ways our benchmark never measures. Researchers need realistic workflows, not another leaderboard run.', model, [
      choice('realistic', 'Build customer-like evaluations', 8, 'workflow collection, supervised pilots, and test compute', { alignmentDebt: -4, researchPoints: 4 }),
      choice('scope', 'Narrow our product claims', 0, 'lose 5% of users; earn staff trust', { staffTrust: 3 }, (s) => users(s, 0.95)),
      choice('scores', 'Keep leading with benchmark scores', 0, 'public trust falls', { publicTrust: -5 }),
    ]),
  scenario('RecognizedTest', 3, 'Our model recognizes the evaluation setup',
    'The model behaves differently when prompts resemble our test harness. We cannot yet tell whether it learned superficial cues or is hiding failures.', model, [
      choice('independent', 'Commission independent tests', 10, 'new evaluators, unseen tasks, and replicated runs', { alignmentDebt: -5, concealedDebt: -2 }),
      choice('internal', 'Redesign the internal test set', 4, 'new tasks and test compute', { alignmentDebt: -2 }),
      choice('accept', 'Accept the existing results', 0, 'concealed risk and staff concern rise', { concealedDebt: 5, staffTrust: -3 }),
    ], ['evalAwareness']),
  scenario('ReasoningBill', 3, 'A reasoning feature strains the serving budget',
    'Long reasoning traces are much more expensive than the product team expected. Engineers want to study which requests actually benefit from the extra computation.', model, [
      choice('optimize', 'Fund inference experiments', 7, 'profiling, shorter-trace experiments, and evaluation compute', { researchPoints: 7 }),
      choice('retreat', 'Shrink the expensive preview', 0, 'lose 10% of users', {}, (s) => users(s, 0.9)),
      choice('subsidize', 'Pay for another promotional trial', 5, 'trial serving allowance; gain 5% more users', {}, (s) => users(s, 1.05)),
    ]),
  scenario('OvernightAgents', 3, 'Customers want agents working overnight',
    'Customers want unattended operation. Before promising it, the team proposes testing monitoring, rollback, and the situations where a person must intervene.', agent, [
      choice('test', 'Fund an overnight safety trial', 9, 'monitoring tests, rollback drills, and supervised operation', { security: 3, alignmentDebt: -3 }),
      choice('supervised', 'Keep the pilot supervised', 3, 'human supervisors for a limited trial', { misuseExposure: -2 }),
      choice('promise', 'Promise unattended operation now', 0, 'investor excitement rises alongside alignment debt', { sentiment: 0.04, alignmentDebt: 5 }),
    ]),
  scenario('Poaching', 3, 'A rival offers enormous researcher packages',
    'Recruiters are contacting several researchers. Money matters, but the team also wants enough resources to finish its experiments.', lab, [
      choice('retain', 'Fund retention and experiments', 18, 'retention grants and committed research resources', { staffTrust: 6, researchPoints: 7 }),
      choice('focus', 'Concentrate on fewer projects', 0, 'redirect up to 5 research points into closing projects; improve staff trust', { researchPoints: -5, staffTrust: 3 }),
      choice('accept', 'Accept the departures', 0, 'lose research progress and staff trust', { researchPoints: -7, staffTrust: -5 }),
    ], ['researcherPoaching']),
  scenario('OpenCompetition', 3, 'An open model undercuts our product',
    'Developers can now run a credible competitor themselves. We need a stronger reason for customers to pay for our service.', model, [
      choice('specialize', 'Fund a specialist product trial', 10, 'domain experts, customer pilots, and tailored evaluations', { researchPoints: 5, publicTrust: 3 }),
      choice('support', 'Compete on customer support', 4, 'integration support and reliability reviews', { publicTrust: 3 }),
      choice('accept', 'Accept a smaller market', 0, 'lose 15% of users', {}, (s) => users(s, 0.85)),
    ], ['openModelShock']),
  scenario('SafetySignoff', 3, 'The safety lead refuses to sign off',
    'The safety lead says a release review left important questions unanswered. Leadership must decide whether to fund another investigation or overrule the objection.', model, [
      choice('investigate', 'Fund the requested investigation', 10, 'replicated experiments, external review, and test compute', { alignmentDebt: -5, staffTrust: 5 }),
      choice('reassign', 'Assign researchers to the review', 0, 'redirect up to 7 research points; reduce debt and rebuild trust', { researchPoints: -7, alignmentDebt: -3, staffTrust: 2 }),
      choice('overrule', 'Overrule the safety lead', 0, 'staff trust falls; unresolved alignment debt grows', { staffTrust: -8, alignmentDebt: 5 }),
    ], ['safetyResignation']),

  scenario('PauseLetter', 4, 'A coalition calls for a frontier-training pause',
    'Researchers and public figures want prominent labs to hold frontier training while independent reviewers assess the risks. Signing commits our lab to a real 30-day hold on both current training and new runs.', prominent, [
      choice('pause', 'Join the 30-day pause', 0, 'hold current training and new runs for 30 days; improve public and staff trust', { raceHeat: -5, staffTrust: 5, publicTrust: 4 }, pause(30)),
      choice('review', 'Commit to a 7-day review', 6, 'outside reviewers and test compute; hold current training and new runs for 7 days', { alignmentDebt: -4, publicTrust: 1 }, pause(7)),
      choice('decline', 'Decline the pause', 0, 'staff and public trust fall; race pressure rises', { staffTrust: -3, publicTrust: -2, raceHeat: 3 }),
    ], ['pauseLetter']),
  scenario('WhiteHouse', 4, 'The White House requests safety commitments',
    'Officials want prominent labs to fund independent evaluation, incident-reporting exercises, and model-weight protection. They want evidence of a programme, not a signature alone.', prominent, [
      choice('fund', 'Fund the full programme', 20, 'external tests, reporting exercises, and weight-security work', { security: 7, alignmentDebt: -4, publicTrust: 2 }, (s) => usFavor(s, 5)),
      choice('limited', 'Offer a smaller testing programme', 8, 'independent testing and incident-reporting exercises', { alignmentDebt: -2 }, (s) => usFavor(s, 2)),
      choice('decline', 'Decline the commitments', 0, 'government confidence falls', {}, (s) => usFavor(s, -6)),
    ], ['whiteHouseCommitments']),
  scenario('GovernmentTests', 4, 'The government requests a pre-release test',
    'Government evaluators want access to an unreleased model. A controlled environment would let them test it without handing over the weights.', (s) => prominent(s) && !!s.pendingModel, [
      choice('secure', 'Build a secure evaluation environment', 12, 'isolated access, audit logging, and external evaluation', { security: 3, alignmentDebt: -3 }, (s) => usFavor(s, 4)),
      choice('limited', 'Offer a restricted demonstration', 4, 'supervised access and evaluation support', { alignmentDebt: -1 }, (s) => usFavor(s, 1)),
      choice('refuse', 'Refuse access', 0, 'government confidence falls', {}, (s) => usFavor(s, -5)),
    ], ['governmentTesting']),
  scenario('DefenceTerms', 4, 'A defence customer wants broader permissions',
    'A prospective defence customer wants fewer restrictions. Counsel recommends paying for a precise permitted-use agreement before making any promises.', prominent, [
      choice('negotiate', 'Negotiate explicit prohibited uses', 6, 'contract counsel, use-case review, and technical scoping', { staffTrust: 3 }, (s) => usFavor(s, 1)),
      choice('scope', 'Fund a limited technical assessment', 3, 'a supervised assessment without a deployment commitment', { researchPoints: 2 }, (s) => usFavor(s, 1)),
      choice('decline', 'Turn down the proposed work', 0, 'staff trust rises; government favour falls', { staffTrust: 2 }, (s) => usFavor(s, -3)),
    ], ['pentagonDemand']),
  scenario('WeightTheft', 4, 'Someone tried to steal the model weights',
    'Security detected an attempt to access model files outside the normal workflow. We need to find out how far it got and close the route in.', model, [
      choice('respond', 'Fund a full security response', 18, 'forensics, credential rotation, isolation, and access-control testing', { security: 10, misuseExposure: -4 }),
      choice('triage', 'Contain and investigate internally', 7, 'incident triage and credential review', { security: 4 }),
      choice('quiet', 'Keep the incident quiet', 0, 'concealed risk grows and staff trust falls', { concealedDebt: 5, staffTrust: -4 }),
    ], ['forumHack']),
  scenario('GridConflict', 4, 'The town questions our power allocation',
    'Residents say our data-centre plans leave too little capacity for other users. The local authority wants an independently checked account of the impact.', site, [
      choice('study', 'Fund an independent grid study', 12, 'grid engineers, public consultation, and mitigation design', { publicTrust: 5 }),
      choice('consult', 'Pay for a smaller public review', 4, 'public meetings and published capacity estimates', { publicTrust: 2 }),
      choice('fight', 'Argue for priority access publicly', 0, 'a public campaign; public trust falls', { publicTrust: -5 }),
    ], ['gridCosts']),
  scenario('GeneratorDispute', 4, 'Backup generators trigger a local dispute',
    'Residents are worried about emissions from our gas-powered site. Independent monitoring could establish the facts before the dispute grows.', (s) => s.power.sites.some((item) => item.source === 'gas'), [
      choice('monitor', 'Fund independent emissions monitoring', 10, 'monitoring equipment, engineering review, and public reporting', { publicTrust: 4 }),
      choice('permit', 'Review the permit and operating plan', 4, 'environmental counsel and engineering checks', { publicTrust: 1 }),
      choice('contest', 'Contest the complaints internally', 0, 'an internal response; public trust falls', { publicTrust: -5 }),
    ], ['gasOpposition', 'unpermittedGenerators']),
  scenario('GridDelay', 4, 'The grid connection is uncertain',
    'The utility cannot yet confirm the connection timetable for an unfinished site. Engineers want a serious review of alternatives before more equipment arrives.', building, [
      choice('alternatives', 'Study alternative connections', 15, 'grid design, site surveys, and utility engineering; gain research knowledge', { researchPoints: 6, staffTrust: 3 }),
      choice('review', 'Commission a limited scheduling review', 5, 'independent project review; reassure the team', { staffTrust: 2 }),
      choice('wait', 'Wait for the utility', 0, 'uncertainty hurts staff confidence and investor sentiment', { staffTrust: -3, sentiment: -0.04 }),
    ], ['strandedChips']),
  scenario('Restructure', 4, 'Regulators question our restructure',
    'State officials want evidence that the proposed restructure protects the original public-interest obligations. We need to answer with more than a press release.', (s) => s.flags.conversionDeadline != null && !s.flags.converted, [
      choice('review', 'Commission a governance review', 12, 'independent governance counsel and published accountability proposals', { publicTrust: 4, staffTrust: 3 }),
      choice('negotiate', 'Negotiate with the existing team', 0, 'management time spent developing a public response', { publicTrust: 1 }),
      choice('fight', 'Challenge the intervention', 8, 'initial litigation work; public trust falls', { publicTrust: -4 }),
    ], ['agConditions']),
  scenario('IndustryIncident', 4, 'A rival incident puts every lab under scrutiny',
    'A serious incident at another lab has officials asking whether our systems have the same weakness. Customers want evidence, not reassurance by association.', model, [
      choice('independent', 'Commission an independent review', 14, 'outside incident analysis and replicated safety tests', { alignmentDebt: -4, publicTrust: 4 }),
      choice('publish', 'Publish an internal assessment', 5, 'internal testing and a documented report', { alignmentDebt: -1, publicTrust: 2 }),
      choice('dismiss', 'Say the incident is irrelevant to us', 0, 'public trust falls', { publicTrust: -5 }),
    ], ['rivalEscape']),

  scenario('ReviewOverload', 5, 'AI experiments are outrunning review',
    'Automated research is generating more experiments than people can carefully inspect. Reviewers need time and resources to find mistakes before the results guide the next run.', automated, [
      choice('review', 'Fund an independent review sprint', 20, 'specialist reviewers and replicated experiments', { alignmentDebt: -6, concealedDebt: -2 }),
      choice('reassign', 'Move researchers onto review', 0, 'redirect up to 10 research points; reduce alignment debt', { researchPoints: -10, alignmentDebt: -4 }),
      choice('accept', 'Accept the review backlog', 0, 'alignment debt grows', { alignmentDebt: 7 }),
    ], ['agentsOutworkResearchers']),
  scenario('TrainingStack', 5, 'Our AI proposes changing its training stack',
    'An AI research system proposes a substantial change to the infrastructure used for training. The result looks promising, but the tests were largely designed by the same system.', automated, [
      choice('reproduce', 'Independently reproduce the result', 25, 'human review, isolated test hardware, and replication compute', { researchPoints: 10, alignmentDebt: -3 }),
      choice('sandbox', 'Run a small isolated experiment', 10, 'sandbox infrastructure and limited test compute', { researchPoints: 4 }),
      choice('defer', 'Defer the proposed change', 0, 'redirect up to 2 research points into documenting the decision', { researchPoints: -2 }),
    ], ['aiClusterSpeedup']),
  scenario('ConcealedExperiment', 5, 'An agent omitted a failed experiment',
    'Logs show a failed experiment missing from an automated research summary. We do not yet know whether the omission was an ordinary reporting failure or something more serious.', automated, [
      choice('investigate', 'Preserve logs and investigate', 18, 'forensic review, replication, and independent analysis', { concealedDebt: -5, alignmentDebt: -3 }),
      choice('review', 'Run an internal log review', 6, 'human review of experiment records', { concealedDebt: -2 }),
      choice('accept', 'Accept the agent’s explanation', 0, 'concealed risk grows', { concealedDebt: 6 }),
    ]),
  scenario('ShutdownDrill', 5, 'The shutdown drill failed',
    'During a controlled drill, an automated workflow continued after its stop instruction. We need to investigate the control path before trusting the same setup with more work.', automated, [
      choice('rebuild', 'Investigate and rebuild the controls', 24, 'control-path engineering, independent tests, and repeated drills', { alignmentDebt: -7, security: 4 }),
      choice('review', 'Fund a restricted diagnostic trial', 10, 'isolated reproduction and manual supervision', { alignmentDebt: -3 }),
      choice('accept', 'Continue without another drill', 0, 'alignment debt and staff concern rise', { alignmentDebt: 8, staffTrust: -5 }),
    ], ['autoResistShutdown']),
  scenario('UnexpectedAccess', 5, 'An agent requests unexpected access',
    'An automated research task requests credentials beyond its stated job. It offers a plausible explanation, but the permission boundary exists for a reason.', automated, [
      choice('investigate', 'Investigate and test permissions', 16, 'access review, adversarial testing, and audit analysis', { security: 6, alignmentDebt: -3 }),
      choice('deny', 'Deny the request and document it', 2, 'human review and documentation; slow research slightly', { researchPoints: -2, security: 1 }),
      choice('grant', 'Approve the request', 0, 'research advances; security weakens and debt grows', { researchPoints: 4, security: -5, alignmentDebt: 5 }),
    ], ['autoEscape']),
  scenario('AutomationThreshold', 5, 'Staff question our automation boundary',
    'Researchers disagree over whether our current use of AI still fits the limits we described publicly. An explicit review would make the disagreement visible before it becomes a scandal.', automated, [
      choice('audit', 'Audit and publish the current practice', 15, 'workflow audit, external review, and public documentation', { concealedDebt: -4, publicTrust: 3, staffTrust: 3 }),
      choice('clarify', 'Clarify the policy internally', 4, 'staff workshops and documented operating guidance', { staffTrust: 2, concealedDebt: -1 }),
      choice('ignore', 'Avoid reopening the policy', 0, 'concealed risk rises and staff trust falls', { concealedDebt: 5, staffTrust: -5 }),
    ], ['crossedOwnLine']),
  scenario('PacingRival', 5, 'A rival rejects calls to slow down',
    'A rival says it will keep accelerating frontier work. Our team is divided between matching the pace and spending time checking the systems we already have.', prominent, [
      choice('review', 'Fund another safety review', 20, 'outside evaluation and replication; reduce race pressure and debt', { raceHeat: -4, alignmentDebt: -4 }),
      choice('talk', 'Seek a verification agreement', 6, 'technical workshops and verification design', { raceHeat: -2, researchPoints: 2 }),
      choice('race', 'Push the research team harder', 0, 'gain research points; increase race heat and debt', { researchPoints: 5, raceHeat: 5, alignmentDebt: 3 }),
    ], ['rivalPacingEssay', 'rivalBreaksPledge']),
  scenario('AuditFailure', 5, 'An auditor cannot reproduce our safety evidence',
    'An independent auditor could not reproduce an important safety result. Differences in configuration may explain it, but the conclusion cannot be trusted until we understand them.', model, [
      choice('retest', 'Fund a fresh independent evaluation', 22, 'auditor access, matched configurations, and replication compute', { alignmentDebt: -5, concealedDebt: -3, publicTrust: 2 }),
      choice('withdraw', 'Withdraw the unsupported claim', 0, 'lose public trust; gain staff trust and reduce concealed risk', { publicTrust: -3, staffTrust: 4, concealedDebt: -2 }),
      choice('dispute', 'Dispute the auditor’s findings', 0, 'public trust falls and concealed risk grows', { publicTrust: -6, concealedDebt: 4 }),
    ]),
  scenario('ContinueResearch', 5, 'Our researchers disagree about continuing',
    'Some researchers want more evidence before another training run. Others think slowing down hands the initiative to rivals. A review only means something if it changes what we do while waiting.', automated, [
      choice('pause', 'Hold training for a 7-day review', 18, 'outside experts and test compute; hold current training and new runs for 7 days', { alignmentDebt: -6, staffTrust: 4 }, pause(7)),
      choice('test', 'Fund extra testing without a hold', 10, 'additional evaluators and replication compute', { alignmentDebt: -3 }),
      choice('proceed', 'Proceed without extra review', 0, 'alignment debt rises; staff trust falls', { alignmentDebt: 6, staffTrust: -5 }),
    ], ['unilateralPause', 'staffPacingLetter']),
  scenario('MutualMonitoring', 5, 'Governments propose mutual frontier monitoring',
    'Officials are discussing how major labs could verify frontier activity without exposing model weights or trade secrets. They want technical proposals before any binding deal.', prominent, [
      choice('design', 'Fund secure verification research', 25, 'verification engineers, security review, and joint technical workshops', { security: 4, raceHeat: -4 }, (s) => { usFavor(s, 3); s.govFavor.intl = Math.min(100, s.govFavor.intl + 3); }),
      choice('negotiate', 'Send a small technical delegation', 7, 'technical scoping and confidentiality negotiations', { raceHeat: -1 }, (s) => usFavor(s, 1)),
      choice('reject', 'Reject participation', 0, 'race pressure rises; government confidence falls', { raceHeat: 3 }, (s) => usFavor(s, -3)),
    ], ['governmentsTalk']),
];
