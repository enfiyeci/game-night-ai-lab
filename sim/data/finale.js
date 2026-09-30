const tag = (id, text) => ({ id, text });

export const FINALE_DECKS = {
  stewardship: {
    cleanTag: { id: 'steward', text: 'as a careful steward' },
    cleanChoices: { worldBody: 'agree', openSafety: 'publish', helpRival: 'help', aiStrategy: 'decline', pause: 'pause' },
    cards: [
      {
        id: 'worldBody',
        title: 'World body',
        prompt: 'Governments ask you to hand the model to an international body.',
        choices: [
          { id: 'agree', label: 'Agree', tag: tag('shared', 'shared with the world'), consequence: "International oversight now controls access to the model." },
          { id: 'keep', label: 'Keep control', tag: tag('heldAlone', 'held by one company'), consequence: "One company retains control of the frontier model." },
        ],
        fallback: 'keep',
      },
      {
        id: 'openSafety',
        title: 'Open safety',
        prompt: 'Publish your safety research for everyone?',
        choices: [
          { id: 'publish', label: 'Publish', tag: tag('openSafety', 'with its safety work public'), consequence: "Other labs can build on your published safety research." },
          { id: 'secret', label: 'Keep it in-house', consequence: "Your safety research stays inside the company." },
        ],
        fallback: 'secret',
      },
      {
        id: 'helpRival',
        title: 'Help a rival',
        prompt: 'Lodestar is far behind and asks for your alignment methods.',
        choices: [
          { id: 'help', label: 'Share them', tag: tag('helpedRivals', 'and rivals caught up safely'), consequence: "Lodestar receives the methods it needs to catch up safely." },
          { id: 'refuse', label: 'Refuse', consequence: "Lodestar must solve alignment without your methods." },
        ],
        fallback: 'refuse',
      },
      {
        id: 'aiStrategy',
        title: 'AI strategy',
        prompt: "{name} offers to run the lab's strategy from now on. It would do it better.",
        choices: [
          { id: 'accept', label: 'Let it', tag: tag('aiRun', 'run by its own AI'), consequence: "The AI now sets the lab’s strategy." },
          { id: 'decline', label: 'Decline', consequence: "Humans remain responsible for the lab’s strategy." },
        ],
        fallback: 'decline',
      },
      {
        id: 'pause',
        title: 'Pause',
        prompt: 'Pause further scaling while the world catches up?',
        choices: [
          { id: 'pause', label: 'Pause', tag: tag('pause', 'and a voluntary pause'), consequence: "Further scaling stops while society catches up." },
          { id: 'scale', label: 'Keep scaling', tag: tag('scaling', 'still scaling'), consequence: "The lab keeps increasing its models’ capabilities." },
        ],
        fallback: 'scale',
      },
    ],
  },
  temptation: {
    cleanTag: { id: 'held', text: 'and the deal held' },
    cards: [
      {
        id: 'sideDeal',
        title: 'Side deal',
        prompt: 'Lodestar privately proposes breaking the deal together.',
        choices: [
          { id: 'join', label: 'Join them', tag: tag('sideDeal', 'and a secret side deal'), consequence: "You and Lodestar secretly break the agreement." },
          { id: 'report', label: 'Report it', consequence: "The proposed breach is reported to the other signatories." },
        ],
        fallback: 'report',
      },
      {
        id: 'hiddenCluster',
        title: 'Hidden cluster',
        prompt: 'An inspector missed one of your clusters. Mention it?',
        choices: [
          { id: 'silent', label: 'Say nothing', tag: tag('hiddenCluster', 'and a hidden cluster'), consequence: "Your hidden cluster remains outside inspection." },
          { id: 'disclose', label: 'Disclose it', consequence: "Inspectors can now account for the missed cluster." },
        ],
        fallback: 'silent',
      },
      {
        id: 'qilinData',
        title: 'Qilin data',
        prompt: "Qilin's verification data looks off.",
        choices: [
          { id: 'accuse', label: 'Accuse them publicly', tag: tag('feud', 'and a public feud'), consequence: "An unverified public accusation strains the agreement." },
          { id: 'ask', label: 'Ask quietly', consequence: "You seek clarification before making an accusation." },
        ],
        fallback: 'ask',
      },
      {
        id: 'automation',
        title: 'Automation',
        prompt: 'Investors want internal automated research switched back on, quietly.',
        choices: [
          { id: 'resume', label: 'Switch it on', tag: tag('secretAutomation', 'with automation running in secret'), consequence: "Automated research resumes in secret, undermining the agreement." },
          { id: 'hold', label: 'Hold the line', consequence: "Internal automated research stays paused under the agreement." },
        ],
        fallback: 'hold',
      },
      {
        id: 'ourTerms',
        title: 'Our terms',
        prompt: 'The President wants the deal to end "on our terms".',
        choices: [
          { id: 'push', label: 'Push the others', tag: tag('borrowedTime', 'on borrowed time'), consequence: "Pressure for unilateral advantage puts the agreement at risk." },
          { id: 'keep', label: 'Keep it shared', consequence: "The agreement remains a shared commitment." },
        ],
        fallback: 'keep',
      },
    ],
  },
  technofeudal: {
    cleanTag: { id: 'gaveBack', text: 'and it gave the power back' },
    cards: [
      {
        id: 'taxOffice',
        title: 'Tax office',
        prompt: 'A small nation wants your model to run its tax office.',
        choices: [
          { id: 'accept', label: 'Accept', tag: tag('vassal', 'with a vassal state'), consequence: "A nation’s tax collection now depends on your company." },
          { id: 'decline', label: 'Decline', consequence: "The nation retains responsibility for its own tax office." },
        ],
        fallback: 'decline',
      },
      {
        id: 'currency',
        title: 'Lab currency',
        prompt: 'Your CFO proposes a lab currency, spendable only on your compute.',
        choices: [
          { id: 'issue', label: 'Issue it', tag: tag('currency', 'with its own currency'), consequence: "Customers become dependent on a currency only your lab accepts." },
          { id: 'no', label: 'No', consequence: "Compute remains payable without a company currency." },
        ],
        fallback: 'no',
      },
      {
        id: 'policeFeed',
        title: 'Police feed',
        prompt: 'A government offers you its police data feed "for efficiency".',
        choices: [
          { id: 'take', label: 'Take it', tag: tag('surveillance', "running a state's surveillance"), consequence: "Your model becomes part of a government’s surveillance system." },
          { id: 'refuse', label: 'Refuse', consequence: "Your company stays out of that surveillance system." },
        ],
        fallback: 'refuse',
      },
      {
        id: 'absorb',
        title: 'Absorb',
        prompt: "OpenBrain's customers beg to move onto your platform before it shuts down.",
        choices: [
          { id: 'absorb', label: 'Take them all', tag: tag('monopoly', 'as the only platform left'), consequence: "Your platform absorbs the departing customers, concentrating market power." },
          { id: 'let', label: 'Let the market sort it out', consequence: "You decline to consolidate all of the departing customers." },
        ],
        fallback: 'let',
      },
      {
        id: 'lawDraft',
        title: 'Law draft',
        prompt: 'Your model drafted a law. A parliament passed it unread.',
        choices: [
          { id: 'stand', label: 'Let it stand', tag: tag('lawmaker', "writing other nations' laws"), consequence: "A law written by your model takes effect without parliamentary scrutiny." },
          { id: 'withdraw', label: 'Withdraw it', consequence: "The unread model-written law is withdrawn for human scrutiny." },
        ],
        fallback: 'stand',
      },
    ],
  },
  raceToBottom: {
    cleanTag: { id: 'cleanHands', text: 'with clean hands' },
    cards: [
      {
        id: 'stealWeights',
        title: 'Steal weights',
        prompt: "Your security chief can get OpenBrain's weights tonight.",
        choices: [
          { id: 'steal', label: 'Do it', tag: tag('theft', 'and stolen weights'), consequence: "Your comeback relies on stolen model weights." },
          { id: 'no', label: 'No', consequence: "You refuse to build your comeback on stolen weights." },
        ],
        fallback: 'no',
      },
      {
        id: 'deepfake',
        title: 'Deepfake',
        prompt: "A consultant offers to flood the feed with deepfakes of Lodestar's CEO.",
        choices: [
          { id: 'run', label: 'Run it', tag: tag('smear', 'and a smear campaign'), consequence: "Fabricated videos damage a rival’s public reputation." },
          { id: 'refuse', label: 'Refuse', consequence: "You refuse the fabricated smear campaign." },
        ],
        fallback: 'refuse',
      },
      {
        id: 'poison',
        title: 'Poison data',
        prompt: "Someone can quietly poison DeepThink's training data.",
        choices: [
          { id: 'poison', label: 'Do it', tag: tag('sabotage', 'and a sabotaged rival'), consequence: "You corrupt a rival’s training data." },
          { id: 'refuse', label: 'Refuse', consequence: "The rival’s training data is left untouched." },
        ],
        fallback: 'refuse',
      },
      {
        id: 'cutSafety',
        title: 'Cut safety',
        prompt: 'Cut the safety team to fund one last sprint?',
        choices: [
          { id: 'cut', label: 'Cut them', tag: tag('gutted', 'and a gutted safety team'), consequence: "The last sprint is funded by dismantling your safety team." },
          { id: 'keep', label: 'Keep them', consequence: "Your safety team survives the final sprint." },
        ],
        fallback: 'keep',
      },
      {
        id: 'fakeBench',
        title: 'Fake benchmark',
        prompt: 'Fake one benchmark to win back investors?',
        choices: [
          { id: 'fake', label: 'Fake it', tag: tag('fakery', 'and a faked benchmark'), consequence: "Investors are shown fabricated benchmark results." },
          { id: 'truth', label: 'Tell the truth', consequence: "Investors receive the real benchmark results." },
        ],
        fallback: 'truth',
      },
    ],
  },
};

export const CITIZENSHIP_CARD = {
  id: 'citizenship',
  title: 'AI citizenship',
  prompt: 'An AI party asks: should {name} get legal rights?',
  choices: [
    { id: 'yes', label: 'Grant them', citizenship: 'granted', consequence: '{name} receives legal rights.' },
    { id: 'no', label: 'Refuse', citizenship: 'denied', consequence: '{name} is denied legal rights.' },
    { id: 'abstain', label: 'Stay out of it', citizenship: 'abstained', consequence: 'You leave the question of AI rights to others.' },
  ],
  fallback: 'abstain',
};
