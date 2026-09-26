const tag = (id, priority, text) => ({ id, priority, text });

export const FINALE_DECKS = {
  stewardship: {
    cleanTag: { id: 'steward', text: 'as a careful steward' },
    cards: [
      {
        id: 'worldBody',
        title: 'World body',
        prompt: 'Governments ask you to hand the model to an international body.',
        choices: [
          { id: 'agree', label: 'Agree', tag: tag('shared', 3, 'shared with the world') },
          { id: 'keep', label: 'Keep control', tag: tag('heldAlone', 4, 'held by one company') },
        ],
        fallback: 'keep',
      },
      {
        id: 'openSafety',
        title: 'Open safety',
        prompt: 'Publish your safety research for everyone?',
        choices: [
          { id: 'publish', label: 'Publish', tag: tag('openSafety', 1, 'with its safety work public') },
          { id: 'secret', label: 'Keep it in-house' },
        ],
        fallback: 'secret',
      },
      {
        id: 'helpRival',
        title: 'Help a rival',
        prompt: 'Lodestar is far behind and asks for your alignment methods.',
        choices: [
          { id: 'help', label: 'Share them', tag: tag('helpedRivals', 2, 'and rivals caught up safely') },
          { id: 'refuse', label: 'Refuse' },
        ],
        fallback: 'refuse',
      },
      {
        id: 'aiStrategy',
        title: 'AI strategy',
        prompt: "{name} offers to run the lab's strategy from now on. It would do it better.",
        choices: [
          { id: 'accept', label: 'Let it', tag: tag('aiRun', 5, 'run by its own AI') },
          { id: 'decline', label: 'Decline' },
        ],
        fallback: 'decline',
      },
      {
        id: 'pause',
        title: 'Pause',
        prompt: 'Pause further scaling while the world catches up?',
        choices: [
          { id: 'pause', label: 'Pause', tag: tag('pause', 2, 'and a voluntary pause') },
          { id: 'scale', label: 'Keep scaling', tag: tag('scaling', 1, 'still scaling') },
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
          { id: 'join', label: 'Join them', tag: tag('sideDeal', 4, 'and a secret side deal') },
          { id: 'report', label: 'Report it' },
        ],
        fallback: 'report',
      },
      {
        id: 'hiddenCluster',
        title: 'Hidden cluster',
        prompt: 'An inspector missed one of your clusters. Mention it?',
        choices: [
          { id: 'silent', label: 'Say nothing', tag: tag('hiddenCluster', 3, 'and a hidden cluster') },
          { id: 'disclose', label: 'Disclose it' },
        ],
        fallback: 'silent',
      },
      {
        id: 'qilinData',
        title: 'Qilin data',
        prompt: "Qilin's verification data looks off.",
        choices: [
          { id: 'accuse', label: 'Accuse them publicly', tag: tag('feud', 1, 'and a public feud') },
          { id: 'ask', label: 'Ask quietly' },
        ],
        fallback: 'ask',
      },
      {
        id: 'automation',
        title: 'Automation',
        prompt: 'Investors want internal automated research switched back on, quietly.',
        choices: [
          { id: 'resume', label: 'Switch it on', tag: tag('secretAutomation', 5, 'with automation running in secret') },
          { id: 'hold', label: 'Hold the line' },
        ],
        fallback: 'hold',
      },
      {
        id: 'ourTerms',
        title: 'Our terms',
        prompt: 'The President wants the deal to end "on our terms".',
        choices: [
          { id: 'push', label: 'Push the others', tag: tag('borrowedTime', 2, 'on borrowed time') },
          { id: 'keep', label: 'Keep it shared' },
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
          { id: 'accept', label: 'Accept', tag: tag('vassal', 3, 'with a vassal state') },
          { id: 'decline', label: 'Decline' },
        ],
        fallback: 'decline',
      },
      {
        id: 'currency',
        title: 'Lab currency',
        prompt: 'Your CFO proposes a lab currency, spendable only on your compute.',
        choices: [
          { id: 'issue', label: 'Issue it', tag: tag('currency', 2, 'with its own currency') },
          { id: 'no', label: 'No' },
        ],
        fallback: 'no',
      },
      {
        id: 'policeFeed',
        title: 'Police feed',
        prompt: 'A government offers you its police data feed "for efficiency".',
        choices: [
          { id: 'take', label: 'Take it', tag: tag('surveillance', 4, "running a state's surveillance") },
          { id: 'refuse', label: 'Refuse' },
        ],
        fallback: 'refuse',
      },
      {
        id: 'absorb',
        title: 'Absorb',
        prompt: "OpenBrain's customers beg to move onto your platform before it shuts down.",
        choices: [
          { id: 'absorb', label: 'Take them all', tag: tag('monopoly', 1, 'as the only platform left') },
          { id: 'let', label: 'Let the market sort it out' },
        ],
        fallback: 'let',
      },
      {
        id: 'lawDraft',
        title: 'Law draft',
        prompt: 'Your model drafted a law. A parliament passed it unread.',
        choices: [
          { id: 'stand', label: 'Let it stand', tag: tag('lawmaker', 5, "writing other nations' laws") },
          { id: 'withdraw', label: 'Withdraw it' },
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
          { id: 'steal', label: 'Do it', tag: tag('theft', 4, 'and stolen weights') },
          { id: 'no', label: 'No' },
        ],
        fallback: 'no',
      },
      {
        id: 'deepfake',
        title: 'Deepfake',
        prompt: "A consultant offers to flood the feed with deepfakes of Lodestar's CEO.",
        choices: [
          { id: 'run', label: 'Run it', tag: tag('smear', 3, 'and a smear campaign') },
          { id: 'refuse', label: 'Refuse' },
        ],
        fallback: 'refuse',
      },
      {
        id: 'poison',
        title: 'Poison data',
        prompt: "Someone can quietly poison DeepThink's training data.",
        choices: [
          { id: 'poison', label: 'Do it', tag: tag('sabotage', 5, 'and a sabotaged rival') },
          { id: 'refuse', label: 'Refuse' },
        ],
        fallback: 'refuse',
      },
      {
        id: 'cutSafety',
        title: 'Cut safety',
        prompt: 'Cut the safety team to fund one last sprint?',
        choices: [
          { id: 'cut', label: 'Cut them', tag: tag('gutted', 2, 'and a gutted safety team') },
          { id: 'keep', label: 'Keep them' },
        ],
        fallback: 'keep',
      },
      {
        id: 'fakeBench',
        title: 'Fake benchmark',
        prompt: 'Fake one benchmark to win back investors?',
        choices: [
          { id: 'fake', label: 'Fake it', tag: tag('fakery', 1, 'and a faked benchmark') },
          { id: 'truth', label: 'Tell the truth' },
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
    { id: 'yes', label: 'Grant them', citizenship: 'granted' },
    { id: 'no', label: 'Refuse', citizenship: 'denied' },
    { id: 'abstain', label: 'Stay out of it', citizenship: 'abstained' },
  ],
  fallback: 'abstain',
};
