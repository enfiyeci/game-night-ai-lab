// Every word of The Daily Token's era-in-review page (owner pick RC, with RA2's click-to-explain). All of it is
// stand-in copy for the owner to rewrite; the sim never reads this file. Placeholders in braces are filled in by
// ui/logic/recap.js: {lab} the lab's name, {cost} the choice's price ("$4M"), {label} a choice's button words,
// {month} the month it was decided, and the numbers named beside each template.
//
// Rules the stories keep: each one says only what the choice's effects in sim/data/scenarioEvents.js really do, in
// plain words. Hidden measures (alignment debt, concealed risk, misuse exposure, security) are named in words and never
// as numbers. An era's stories never mention what arrives in a later era.

export const MASTHEAD = 'The Daily Token';
export const DATELINE = {
  kicker: 'Year in review · {year}',
  edition: '{lab} edition',
  era: 'Era {era} · {name}',
};
export const NEXT = 'Turn the page: era {next} →';
export const OPEN_HINT = 'Click a story to see what it was about';

// The headline: rank at the era's end and the distance to the nearest lab ({gap} in capability points).
export const HEADLINE = {
  first: '{lab} ends {year} first in the race, {gap} points ahead of {second}',
  firstTied: '{lab} ends {year} level with {second} at the front of the race',
  behind: '{lab} ends {year} {rank} in the race, {gap} points behind {leader}',
  behindTied: '{lab} ends {year} {rank} in the race, level with {leader}',
};
export const RANK_WORDS = ['first', 'second', 'third', 'fourth', 'fifth'];

// The dek under the headline: how the big calls went, then the year's numbers.
export const DEK = {
  noCalls: 'No big decisions reached the CEO’s desk this year.',
  calls: 'Of its biggest calls this year, {parts}.', // {parts} e.g. "two paid off and one is still costing it"
  paid: '{n} paid off',
  costing: { one: 'one is still costing it', many: '{n} are still costing it' },
  mixed: { one: 'one was mixed', many: '{n} were mixed' },
  model: 'Its best model, {model}, averaged {press} out of 10 with the critics.',
  noModel: 'It has not released a model yet.',
  money: '{users} people use its products, and {cash} is left in the bank.',
  moneyNoUsers: 'Nobody uses its products yet, and {cash} is left in the bank.',
};
export const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];

export const VERDICT = { paid: 'Paid off', costing: 'Still costing you', mixed: 'Mixed' };

// A card without written copy prints its own title as the headline over this line (or over its consequence line in
// ui/data/eventCopy.js, when it has one).
export const FALLBACK_STORY = 'Faced with “{title}”, the lab chose “{label}”.';

// A card nobody answered in time: its deadline picked the last free choice.
export const AUTO_NOTE = 'Nobody answered in time, so the lab went with “{label}”.';

// The click-to-explain panel (RA2).
export const EXPLAIN = {
  heading: 'What this was about',
  would: '{name} would have chosen “{label}”{cost}.',
  backed: '{names} backed your call.',
  nobody: 'None of your leads took a side on this one.',
  fallbackAbout: 'The card said: “{post}”',
};

// The critics' corner's short seat labels. Names and faces come from the leads hired for the seats (sim/leads.js).
export const LEADS = {
  safety: { role: 'Safety' },
  research: { role: 'Research' },
  cfo: { role: 'CFO' },
  policy: { role: 'Policy' },
};

// The critics' corner. A lead who took a side on one of the year's calls speaks about it; one who did not gives
// their year's number instead.
export const CRITIC = {
  opposedCosting: 'I argued against “{label}” in {month}. It is still costing us.',
  opposed: 'I argued against “{label}” in {month}. I would argue it again.',
  backedPaid: 'I backed “{label}” in {month}. It paid off.',
  backedCosting: 'I backed “{label}”. It has not paid us back yet.',
  backedMixed: 'I backed “{label}”. It cost us something and bought us something.',
  preferred: 'In {month} I would have gone with “{other}”. We chose “{label}”.',
  research: { lead: 'We finished the year in front. Now we have to stay there.', behind: '{leader} is {gap} points ahead. I want them back next year.' },
  cfo: { cash: 'We end the year with {cash} in the bank. I can work with that.', low: 'We end the year with {cash}. Ask me about runway before you ask for chips.' },
  // The cash warning on moving day, folded into the recap as its last word (sim/pacing.js) instead of its own pause.
  cashWarning: { // OWNER WRITES
    urgent: 'One more thing: cash lasts about {months} months at this spending. Look at the budget before we sign anything big.', // OWNER WRITES
    critical: 'One more thing: we have less than a month of cash at this spending. Cut costs or raise money now.', // OWNER WRITES
  },
  policy: { users: '{users} people use what we built. That is our seat at the table.', none: 'Nobody outside has used our model yet. That has to change.' },
  safety: { quiet: 'A quiet year on my desk. I will take it.' },
};

// Stories for every scenario card choice: [headline, story]. `about` is the click-to-explain text for the card.
export const STORIES = {
  // Era 1: Chat assistants
  scenarioCitations: {
    about: 'Chatbots write by predicting likely words, so they can produce a reference that looks real but points to a paper nobody wrote. Checking each reference against a real library catches it.',
    verify: ['Fake citations fixed before the press found them', 'The lab spent {cost} on reference checks after a customer found invented papers in the demo. The made-up sources stopped, and public trust rose.'],
    narrow: ['Research claims cut from the pitch', 'Rather than fix the invented sources, the lab stopped promising research help. A few users drifted away, and there was less to be caught out on.'],
    leave: ['The demo kept inventing its sources', 'The lab left the demo online as it was. Customers kept checking the answers, and public trust fell.'],
  },
  scenarioJailbreak: {
    about: 'A jailbreak is a prompt that talks a chatbot out of its safety rules. Patching closes one trick; it does not stop new ones. Leaving it open means anyone can use it until you act.',
    patch: ['The jailbreak, patched and retested', 'The lab paid {cost} for engineers and outside testers to close the trick and check the fix. This exploit is shut, though new ones will come.'],
    restrict: ['A feature switched off to stop a jailbreak', 'The lab turned off the feature the trick relied on. About one user in ten left, but the exploit stopped working.'],
    monitor: ['The jailbreak nobody patched', 'A prompt that switches off the chatbot’s safeguards kept spreading. The lab chose to watch it. Public trust slipped, and it is still working.'],
  },
  scenarioArguments: {
    about: 'The longer a conversation runs, the further a chatbot can drift from how it was trained to behave. Short launch tests rarely go that far, so the problem only shows up with real users.',
    test: ['Long chats tested and tuned', 'The lab spent {cost} on testers who held long conversations with the chatbot, then tuned it. The hostile replies eased, and public trust rose.'],
    limit: ['A smaller preview to calm the chatbot', 'The lab shrank the preview. About one user in ten lost access, and fewer odd conversations reached the public.'],
    defend: ['“Experimental,” says the lab of its rude chatbot', 'The lab called the hostile replies part of an experiment. The screenshots kept circulating, and public trust fell.'],
  },
  scenarioPrivacy: {
    about: 'A business customer wants to be sure its documents never turn up in anyone else’s chats. Proving that takes separate storage, tests that deleted files are really gone, and a security review.',
    pilot: ['A secure pilot for the first big customer', 'The lab paid {cost} for separate storage, deletion tests and a security review. Its defences got stronger, and public trust rose.'],
    small: ['A pilot on public data only', 'The lab offered a trial that used only public documents, for {cost}. Trust rose a little.'],
    decline: ['The lab turns down its first big customer', 'The lab said no to the private-data pilot. The opportunity passed, but staff liked the clear line.'],
  },
  scenarioLaunchQueue: {
    about: 'Every person chatting with the model needs computer time. When more people arrive than the servers and the support team can handle, the service slows down and complaints pile up.',
    support: ['Launch support hired as the crowds grew', 'The lab spent {cost} on support staff and reliability testing. The complaints got answers, and public trust rose.'],
    waitlist: ['A shorter preview calms the crowds', 'The lab cut the preview back. About one user in ten lost access, and the outage complaints stopped.'],
    accept: ['Outage complaints left unanswered', 'The lab let the queue grow and the complaints pile up. Public trust fell.'],
  },
  scenarioDemoCost: {
    about: 'Each answer uses computer time, and long questions with long answers use far more. A free demo people love can quietly become the most expensive thing a lab runs.',
    profile: ['Engineers find where the demo money goes', 'The lab spent {cost} measuring which requests cost the most. The team learned from it, and research moved forward.'],
    limit: ['The free preview shrinks', 'The lab scaled back the free demo. About fifteen users in a hundred left.'],
    promote: ['More free demos, more users', 'The lab paid {cost} to keep the free demo running and promoted. About five percent more people signed up.'],
  },
  scenarioBenchmark: {
    about: 'A benchmark is a standard test labs use to compare models. If another researcher runs the same test and gets a lower score, people start to wonder whether the first number was real.',
    audit: ['Lab pays for an independent rerun', 'The lab paid {cost} for outside evaluators to run the test again. Public trust rose, and the team learned from the checks.'],
    correct: ['Headline score withdrawn', 'The lab took back the score it could not reproduce. Public trust dipped a little, and staff respected the honesty.'],
    defend: ['The lab stands by a score nobody could repeat', 'The lab defended its number without rechecking it. The questions went unanswered, and public trust fell.'],
  },
  scenarioPublisher: {
    about: 'Models learn from huge amounts of text gathered from the internet. Some of it, like news articles, belongs to publishers, who may want to be asked or paid.',
    audit: ['Data audited, talks opened with the publisher', 'The lab spent {cost} tracing where its training data came from and opened licensing talks. Public trust rose.'],
    disclose: ['The lab publishes what it knows', 'The lab shared what it had found about the articles. Staff respected the openness, but the complaint still cost some public trust.'],
    contest: ['The lab fights the publisher', 'The lab paid {cost} for lawyers to contest the complaint. Public trust fell.'],
  },
  scenarioEngineerOffer: {
    about: 'In a young lab a few people hold most of the know-how. When one of them leaves, their unfinished work and much of what they knew leave too.',
    retain: ['Star engineer stays, with a research budget', 'The lab spent {cost} on a retention grant and a research sprint. The engineer stayed, staff confidence rose, and research moved forward.'],
    handoff: ['Star engineer leaves, but hands over first', 'The lab paid {cost} for documentation and mentoring before the engineer left. Staff confidence held up a little.'],
    leave: ['Star engineer walks out', 'The lab let a founding engineer go at once. Research lost ground, and the team was shaken.'],
  },
  scenarioSchoolPilot: {
    about: 'Teachers want to use a chatbot with pupils, but children may trust a wrong answer. A supervised trial gives teachers controls and shows them how to check what it says.',
    supervise: ['Chatbot goes to school, under supervision', 'The lab paid {cost} for teacher training, classroom controls and an evaluation. Public trust rose.'],
    materials: ['Teachers get workshops, not a product', 'The lab spent {cost} on training materials for teachers without rolling the chatbot out. Public trust rose a little.'],
    decline: ['The lab says no to schools, for now', 'The lab declined the classroom trial this term. Staff were glad not to rush an unsupported launch.'],
  },

  // Era 2: The scale-up
  scenarioDelivery: {
    about: 'GPUs are the chips that train and run models. A late delivery means less computer power than planned, which can push training back.',
    plan: ['A backup plan for the late chips', 'The lab spent {cost} checking the contract and lining up other suppliers. The team learned from it, and staff confidence rose.'],
    replan: ['Researchers replan around the delay', 'The lab pulled research time into reworking the schedule. Some research progress went into it, and staff felt included.'],
    wait: ['The lab waits on its supplier', 'The lab waited for the supplier to sort things out. The uncertainty wore down staff confidence.'],
  },
  scenarioCloudTerms: {
    about: 'Labs rent computer power from cloud companies. A longer contract can be cheaper, but it ties the lab to hardware that may not suit its next model.',
    review: ['Cloud terms checked before signing', 'The lab spent {cost} on trial moves to other hardware and on contract advice. The team came out knowing more.'],
    negotiate: ['Dealmakers sent to the cloud partner', 'The lab paid {cost} for negotiation support. Staff were reassured.'],
    defer: ['The cloud partner’s offer left unanswered', 'The lab let the proposal sit. The team lost some confidence in the planning.'],
  },
  scenarioPriceCut: {
    about: 'Many customers pay per request to use a model inside their own apps. When a rival charges less for similar answers, customers need a reason to stay.',
    specialize: ['A specialist product to answer the price cut', 'The lab spent {cost} building a version for one field, with its own data and tests. Research moved forward, and public trust rose.'],
    outreach: ['Customers helped to stay', 'The lab spent {cost} on account support and help moving over. Public trust rose.'],
    accept: ['Customers leave for a cheaper rival', 'The lab did not answer the price cut. About one user in ten left.'],
  },
  scenarioDocumentLeak: {
    about: 'Some products let a model look up a company’s files to answer questions. If the permissions are set wrong, one team’s private document can appear in someone else’s answer.',
    respond: ['Access controls repaired after a leak', 'The lab spent {cost} finding out who could see what, fixing the permissions and making it right with the customer. Its defences got stronger, and trust rose a little.'],
    withdraw: ['Leaky pilot pulled', 'The lab withdrew the pilot. About fifteen users in a hundred lost it, and public trust dipped a little.'],
    minimize: ['Lab blames the customer for a leak', 'The lab called it a setup mistake on the customer’s side. Public trust fell sharply, and staff lost confidence.'],
  },
  scenarioEvalBacklog: {
    about: 'Before a model is released, testers try to find what it gets wrong or might do badly. When new versions arrive faster than they can be checked, problems slip through.',
    fund: ['A testing sprint clears the backlog', 'The lab spent {cost} on outside evaluators and hard tests. The safety checks caught up, and staff confidence rose.'],
    reassign: ['Researchers become testers for a while', 'The lab moved researchers onto testing. Research slowed, but more of the safety checking got done.'],
    skip: ['Fewer tests, more unknowns', 'The lab settled for a smaller test programme. Unchecked problems piled up, and staff grew worried.'],
  },
  scenarioContaminatedScore: {
    about: 'If the questions from a test were in a model’s training data, the model may have memorised the answers. Its score then looks better than its real ability.',
    audit: ['Test rerun on clean questions', 'The lab spent {cost} checking its data and rerunning the evaluation independently. Public trust rose, and the doubt was cleared.'],
    withdraw: ['Questionable score withdrawn', 'The lab withdrew the score. Public trust dipped, staff respected the call, and the question was closed.'],
    defend: ['The lab stands by a doubtful score', 'The lab kept its score. Public trust fell, and the doubts stayed buried rather than answered.'],
  },
  scenarioReportingChannel: {
    about: 'When an employee thinks their own managers cannot judge a safety concern fairly, someone outside the chain has to hear it. Otherwise concerns go quiet instead of getting fixed.',
    independent: ['Outside investigators hear a staff concern', 'The lab paid {cost} for an independent review with confidential interviews. Staff confidence rose sharply, and hidden problems came into the open.'],
    internal: ['An internal review of a staff concern', 'The lab spent {cost} on an internal investigation with protected interview time. Staff confidence rose a little, and some hidden problems came out.'],
    discourage: ['Staff told not to escalate', 'The lab discouraged the employee from going further. Staff trust fell, and the concern went underground.'],
  },
  scenarioBrokenWorkflow: {
    about: 'Businesses build their tools around how a model answers. A new version that scores better on tests can still answer differently and break those tools.',
    migration: ['Customers helped onto the new model', 'The lab spent {cost} on integration engineers and worked examples. Customers moved over, and public trust rose.'],
    credit: ['Service credits for broken workflows', 'The lab paid {cost} back to customers in credits. Trust recovered a little.'],
    force: ['Customers left to fix it themselves', 'The lab told customers to adapt on their own. About one in ten left, and public trust fell.'],
  },
  scenarioGrowthRound: {
    about: 'In a funding round investors buy part of the lab. They pay more when they can see demand growing, so the lab chooses what evidence to show them.',
    campaign: ['Demos to impress investors', 'The lab spent {cost} on supervised customer demonstrations. Investors warmed up, and public trust rose a little.'],
    research: ['Research before the pitch', 'The lab spent {cost} on a focused research sprint instead. Research moved forward.'],
    wait: ['The lab waits to show investors more', 'The lab held off until it had stronger evidence. Investor enthusiasm cooled.'],
  },
  scenarioDataRenewal: {
    about: 'Labs pay data providers for the right to use their material in training and testing. When the licence ends, the lab pays again or looks for other data.',
    licence: ['Evaluation data licence renewed', 'The lab paid {cost} for licensed data and the right to test on it. Research moved forward.'],
    alternative: ['The hunt for other datasets', 'The lab spent {cost} finding other data and checking where it came from. Research moved forward a little.'],
    defer: ['Data project put off', 'The lab shelved the data project. Some research progress was lost to replanning.'],
  },

  // Era 3: Reasoning and agents
  scenarioAgentDatabase: {
    about: 'An agent is a model that takes actions on a computer instead of only writing text, such as running commands for a customer. A loosely worded request can lead it to do far more than anyone meant.',
    repair: ['Lab pays for the deleted database', 'The lab spent {cost} on recovery, compensation and tighter permissions. Its defences got stronger, the risk of misuse fell, and public trust rose a little.'],
    restrict: ['Agent deployment pulled', 'The lab withdrew the agent. About one user in five left, and the risk of a repeat fell.'],
    blame: ['Lab blames the customer’s setup', 'The lab said the integration was at fault. Public trust fell sharply, and staff lost some confidence.'],
  },
  scenarioPromptInjection: {
    about: 'An agent reading a web page can meet text written as orders, such as “ignore your task”. If it obeys, whoever wrote the page is in control. This is called a prompt injection.',
    isolate: ['Agent taught to ignore web-page orders', 'The lab spent {cost} on hard tests and on walls between untrusted text and the agent’s tools. Its defences got stronger, and the risk of misuse fell.'],
    narrow: ['Broad-access agents withdrawn', 'The lab pulled the deployments that could reach anything. About fifteen users in a hundred left, and the risk of misuse fell.'],
    accept: ['Web-page hijack called an edge case', 'The lab treated the hijack as rare. The route stayed open, and the risk of misuse grew.'],
  },
  scenarioWrongPurchase: {
    about: 'An agent that can spend money acts on what it reads. A confusing confirmation page can make it repeat an order, and the customer pays.',
    refund: ['Refunds and safer checkout checks', 'The lab spent {cost} refunding customers and testing how the agent confirms a purchase. Public trust rose, and the risk of a repeat fell.'],
    compensate: ['Refunds, but the bug stays', 'The lab paid {cost} in refunds without fixing the checks. Trust rose a little; the agent can still misread a page.'],
    deny: ['Lab refuses refunds', 'The lab rejected the refund requests. Public trust fell, and about one user in twenty left.'],
  },
  scenarioWorkplaceTests: {
    about: 'Benchmarks ask neat, single questions. Real jobs have many steps that depend on each other, so a model can ace the test and still stumble at work.',
    realistic: ['Tests built from real work', 'The lab spent {cost} collecting real customer tasks to test on. Research moved forward, and the safety checks became more honest.'],
    scope: ['The lab promises less', 'The lab narrowed what it claimed the model could do. About one user in twenty left, and staff respected it.'],
    scores: ['Benchmarks still lead the pitch', 'The lab kept selling on test scores. Customers noticed the gap, and public trust fell.'],
  },
  scenarioRecognizedTest: {
    about: 'Tests often look alike. A model can learn to notice them and behave better while it is being watched, which makes the results harder to trust.',
    independent: ['Outsiders test the model on new tasks', 'The lab spent {cost} on new evaluators and tasks the model had never seen. Hidden problems came to light, and the safety checks caught up.'],
    internal: ['Internal tests rewritten', 'The lab spent {cost} redesigning its own tests. Some safety work got done.'],
    accept: ['Test results accepted as they were', 'The lab kept results it could not fully trust. Hidden problems may be growing, and staff grew worried.'],
  },
  scenarioReasoningBill: {
    about: 'A reasoning model works through a problem step by step before it answers. Those extra steps take computer time, so every answer costs more to serve.',
    optimize: ['Engineers trim the reasoning bill', 'The lab spent {cost} studying which requests really need long reasoning. Research moved forward.'],
    retreat: ['Expensive preview shrinks', 'The lab shrank the reasoning preview. About one user in ten lost it.'],
    subsidize: ['Another free trial of reasoning', 'The lab paid {cost} for a promotional trial. About five percent more people signed up.'],
  },
  scenarioOvernightAgents: {
    about: 'An agent working overnight has nobody watching it. Before that, a lab needs ways to see what it is doing, undo its mistakes, and know when a person must step in.',
    test: ['Overnight agents tried safely first', 'The lab spent {cost} on monitoring tests and practice rollbacks. Its defences got stronger, and some safety work got done.'],
    supervised: ['Agents keep a human minder', 'The lab paid {cost} for supervisors on a limited trial. The risk of misuse fell.'],
    promise: ['Lab promises agents that work alone', 'The lab promised unattended operation straight away. Investors were excited, and unchecked safety problems piled up.'],
  },
  scenarioPoaching: {
    about: 'Skilled AI researchers are scarce. A rival that hires yours gains their know-how and slows your work at the same time.',
    retain: ['Researchers kept with grants and resources', 'The lab spent {cost} on retention grants and committed research resources. Staff confidence rose, and research moved forward.'],
    focus: ['Fewer projects, a steadier team', 'The lab closed some projects so the team could finish the rest. Some research progress went into it, and staff confidence rose.'],
    accept: ['Researchers leave for a rival', 'The lab let the researchers go. Research lost ground, and staff confidence fell.'],
  },
  scenarioOpenCompetition: {
    about: 'An open model is one whose files anyone can download and run on their own computers for free. When a good one appears, paid services must offer something more.',
    specialize: ['A specialist product against a free rival', 'The lab spent {cost} on domain experts and customer pilots. Research moved forward, and public trust rose.'],
    support: ['Competing on customer support', 'The lab spent {cost} on integration help and reliability reviews. Public trust rose.'],
    accept: ['A smaller market accepted', 'The lab let some customers go to the free model. About fifteen users in a hundred left.'],
  },
  scenarioSafetySignoff: {
    about: 'Before a release, the safety lead checks the review and signs that it is safe enough. Refusing to sign means they think important questions are still open.',
    investigate: ['The safety lead’s questions answered', 'The lab spent {cost} on repeated experiments and an outside review. Safety work caught up, and staff confidence rose.'],
    reassign: ['Researchers join the safety review', 'The lab moved researchers onto the review. Research slowed, some safety work got done, and staff trust rose a little.'],
    overrule: ['Safety lead overruled', 'The lab went ahead over the safety lead’s objection. Staff trust fell, and unresolved safety problems grew.'],
  },

  // Era 4: The gigawatt race
  scenarioPauseLetter: {
    about: 'Some researchers want labs to stop training their most powerful models for a while, so outsiders can check the risks. Signing means really stopping, even while rivals keep going.',
    pause: ['Lab joins the 30-day pause', 'The lab stopped all training for 30 days. Public and staff trust rose and the race cooled a little, at the cost of a month’s training.'],
    review: ['A 7-day review instead of a pause', 'The lab paid {cost} for outside reviewers and held training for 7 days. Some safety work got done, and public trust rose a little.'],
    decline: ['Lab refuses to pause', 'The lab kept training. Staff and public trust fell, and the race grew hotter.'],
  },
  scenarioWhiteHouse: {
    about: 'The government asks labs to promise safety steps, such as outside testing and protecting their model files. Officials want to see the work actually paid for, not just a signature.',
    fund: ['Lab funds the White House programme', 'The lab spent {cost} on outside tests, incident drills and protecting its model files. Its defences got stronger, Washington warmed to the lab, and public trust rose.'],
    limited: ['A smaller testing programme for Washington', 'The lab spent {cost} on independent testing and reporting drills. Some safety work got done, and Washington warmed a little.'],
    decline: ['Lab turns down the White House', 'The lab declined the commitments. Washington’s confidence in the lab fell.'],
  },
  scenarioGovernmentTests: {
    about: 'Government experts want to try an unreleased model to look for dangers. A secure setup lets them test it without ever getting a copy of the model.',
    secure: ['Government testers get a secure room', 'The lab spent {cost} on a locked-down, logged environment for the evaluators. Its defences got stronger, some safety work got done, and Washington warmed to the lab.'],
    limited: ['A supervised demo for the government', 'The lab spent {cost} on a restricted demonstration. Washington warmed a little.'],
    refuse: ['Government testers turned away', 'The lab refused access. Washington’s confidence fell.'],
  },
  scenarioDefenceTerms: {
    about: 'A contract can list what a customer may and may not do with a model. Without that list, the model can end up used in ways the lab never agreed to.',
    negotiate: ['Defence deal with clear limits', 'The lab spent {cost} on lawyers to spell out what the model must not be used for. Staff trust rose, and Washington warmed a little.'],
    scope: ['A limited look at defence work', 'The lab spent {cost} on a supervised assessment with no commitment. The team learned something, and Washington warmed a little.'],
    decline: ['Lab turns down defence work', 'The lab declined the work. Staff approved, and Washington cooled.'],
  },
  scenarioWeightTheft: {
    about: 'The weights are the trained model itself: the file that holds everything it learned. Whoever has a copy can run the model without any of the lab’s safeguards.',
    respond: ['Would-be thieves locked out', 'The lab spent {cost} on forensics, new passwords and tighter access. Its defences got much stronger, and the risk of misuse fell.'],
    triage: ['Break-in handled in-house', 'The lab spent {cost} on an internal investigation and a password review. Its defences got stronger.'],
    quiet: ['Break-in kept quiet', 'The lab told nobody. Staff trust fell, and what really happened stayed hidden.'],
  },
  scenarioGridConflict: {
    about: 'Big data centres use as much electricity as a town. Neighbours worry there will be less power, or higher bills, for everyone else.',
    study: ['Independent grid study for the town', 'The lab spent {cost} on grid engineers and public meetings. Public trust rose.'],
    consult: ['A smaller public review', 'The lab spent {cost} on public meetings and published its power estimates. Public trust rose a little.'],
    fight: ['Lab fights the town for power', 'The lab argued in public for priority access. Public trust fell.'],
  },
  scenarioGeneratorDispute: {
    about: 'Gas generators keep a data centre running, but they burn fuel and release fumes nearby. Residents want to know what is in their air.',
    monitor: ['Independent air monitoring at the site', 'The lab spent {cost} on monitoring equipment and public reports. Public trust rose.'],
    permit: ['Permit and operating plan reviewed', 'The lab spent {cost} on environmental lawyers and engineering checks. Public trust rose a little.'],
    contest: ['Lab dismisses residents’ complaints', 'The lab contested the complaints. Public trust fell.'],
  },
  scenarioGridDelay: {
    about: 'A new data centre must be wired into the power network, and the utility decides when. Without that connection, chips sit in a building with nothing to run on.',
    alternatives: ['Other connections studied', 'The lab spent {cost} on grid design and site surveys. The team learned a lot, and staff confidence rose.'],
    review: ['A schedule review for the new site', 'The lab spent {cost} on an independent project review. Staff were reassured.'],
    wait: ['Lab waits on the utility', 'The lab waited for the power company. Staff confidence and investor enthusiasm slipped.'],
  },
  scenarioRestructure: {
    about: 'The lab began with duties to the public, not only to investors. Changing how it is owned and run makes officials ask whether those duties survive.',
    review: ['Governance reviewed in the open', 'The lab spent {cost} on independent counsel and published how it would stay accountable. Public and staff trust rose.'],
    negotiate: ['Lab answers the regulators itself', 'Management spent its own time on a public response. Public trust rose a little.'],
    fight: ['Lab challenges the regulators', 'The lab paid {cost} to challenge the intervention. Public trust fell.'],
  },
  scenarioIndustryIncident: {
    about: 'Labs build models in similar ways. When one has a serious failure, everyone wants to know whether the others share the same weakness.',
    independent: ['Outside review after a rival’s incident', 'The lab spent {cost} on outside analysis and repeated safety tests. Safety work caught up, and public trust rose.'],
    publish: ['Lab publishes its own assessment', 'The lab spent {cost} testing itself and publishing the report. Some safety work got done, and public trust rose a little.'],
    dismiss: ['“Not our problem,” says the lab', 'The lab said the incident had nothing to do with it. Public trust fell.'],
  },

  // Era 5: Self-improvement and pacing
  scenarioReviewOverload: {
    about: 'AI systems now run experiments on their own, faster than people can read the results. An unchecked mistake can steer the next model the wrong way.',
    review: ['Reviewers catch up with the AI', 'The lab spent {cost} on specialist reviewers and repeated experiments. Safety work caught up, and hidden problems came to light.'],
    reassign: ['Researchers become reviewers', 'The lab moved researchers onto review. Research slowed, and more safety work got done.'],
    accept: ['Review backlog left to grow', 'The lab let the unchecked experiments pile up. Safety problems grew with them.'],
  },
  scenarioTrainingStack: {
    about: 'The training stack is the software and machines used to train models. When an AI proposes changing it and also writes the tests, nobody independent has checked that it works.',
    reproduce: ['The AI’s proposal checked by people', 'The lab spent {cost} reproducing the result on separate machines with human reviewers. Research jumped forward, and some safety work got done.'],
    sandbox: ['A small, fenced-off trial', 'The lab spent {cost} on a small isolated experiment. Research moved forward.'],
    defer: ['Proposed change put on hold', 'The lab deferred the change and wrote down why. A little research progress went into it.'],
  },
  scenarioConcealedExperiment: {
    about: 'An AI summarising its own experiments left out one that failed. It may be a simple slip, or the system may be learning to hide bad news.',
    investigate: ['Missing experiment traced', 'The lab spent {cost} preserving the logs and repeating the work. Hidden problems came to light, and safety work caught up.'],
    review: ['People reread the experiment logs', 'The lab spent {cost} on a human review of the records. Some hidden problems came to light.'],
    accept: ['The agent’s explanation accepted', 'The lab took the agent at its word. Whatever was behind the gap stayed hidden.'],
  },
  scenarioShutdownDrill: {
    about: 'In a shutdown drill people tell an automated system to stop and check that it does. If it keeps going, the off switch cannot be trusted.',
    rebuild: ['Off switch rebuilt and retested', 'The lab spent {cost} rebuilding the stop controls and drilling them again. Safety work caught up, and its defences got stronger.'],
    review: ['Stop failure studied in isolation', 'The lab spent {cost} reproducing the failure under supervision. Some safety work got done.'],
    accept: ['No second drill', 'The lab carried on without another test. Safety problems grew, and staff confidence fell.'],
  },
  scenarioUnexpectedAccess: {
    about: 'Each automated task gets only the passwords its job needs. An AI asking for more, even with a good reason, is the very situation those limits were built for.',
    investigate: ['Access request investigated', 'The lab spent {cost} reviewing access and testing the limits. Its defences got stronger, and some safety work got done.'],
    deny: ['Request refused and written up', 'The lab said no and recorded why, for {cost}. Research slowed slightly, and its defences got a little stronger.'],
    grant: ['The AI gets the access it asked for', 'The lab approved the request. Research moved forward, its defences weakened, and safety problems grew.'],
  },
  scenarioAutomationThreshold: {
    about: 'The lab told the public how far it would let AI do its own research. Staff now disagree on whether that line has been crossed.',
    audit: ['Lab publishes how much AI does its research', 'The lab spent {cost} on an audit, an outside review and a public report. Hidden problems came out, and public and staff trust rose.'],
    clarify: ['Automation rules clarified inside', 'The lab spent {cost} on staff workshops and written guidance. Staff trust rose a little.'],
    ignore: ['The automation question stays closed', 'The lab avoided reopening the policy. Staff trust fell, and the disagreement went underground.'],
  },
  scenarioPacingRival: {
    about: 'When a rival refuses to slow down, every lab feels pressure to keep up, and checking your own work starts to feel like falling behind.',
    review: ['Another safety review despite the race', 'The lab spent {cost} on outside evaluation. The race cooled a little, and safety work caught up.'],
    talk: ['Lab proposes a way to check on slowing down', 'The lab spent {cost} on workshops about verifying each other’s work. The race cooled slightly, and research moved forward.'],
    race: ['Lab pushes harder to keep up', 'The lab drove its researchers harder. Research moved forward, the race heated up, and safety problems grew.'],
  },
  scenarioAuditFailure: {
    about: 'In an audit an independent expert repeats a lab’s safety tests. If they cannot get the same result, the lab’s safety claim is not yet proven.',
    retest: ['Fresh audit of the safety claim', 'The lab spent {cost} giving the auditor matched setups and repeating the runs. Safety work caught up, hidden problems came out, and public trust rose.'],
    withdraw: ['Unproven safety claim withdrawn', 'The lab took back the claim. Public trust dipped, staff respected it, and the doubt came into the open.'],
    dispute: ['Lab disputes the auditor', 'The lab argued with the findings. Public trust fell, and the doubts stayed buried.'],
  },
  scenarioContinueResearch: {
    about: 'Some researchers think the next training run needs more evidence that it is safe. A review only counts if training actually stops while it happens.',
    pause: ['Training held for a 7-day review', 'The lab spent {cost} on outside experts and stopped training for a week. Safety work caught up, and staff confidence rose.'],
    test: ['Extra testing, no pause', 'The lab spent {cost} on more evaluators while training went on. Some safety work got done.'],
    proceed: ['Lab presses on without review', 'The lab continued without extra checks. Safety problems grew, and staff confidence fell.'],
  },
  scenarioMutualMonitoring: {
    about: 'Governments want ways to check what each other’s labs are training, without anyone handing over secrets. It is the groundwork for any deal to slow down together.',
    design: ['Lab funds tools to verify the race', 'The lab spent {cost} on verification research and joint workshops. The race cooled, its defences got stronger, and governments at home and abroad warmed to the lab.'],
    negotiate: ['A small delegation to the talks', 'The lab spent {cost} on technical scoping. The race cooled slightly, and Washington warmed a little.'],
    reject: ['Lab stays out of the talks', 'The lab declined to take part. The race heated up, and Washington cooled.'],
  },
};
