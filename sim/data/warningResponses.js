// Warning response budgets are in $M and shared by the simulation and both entry points.
const RESPONSES = {
  jailbreak: {
    cost: 5, label: 'Patch and retest',
    explanation: 'Someone shared a prompt that gets our chatbot to ignore its safeguards. Our testers reproduced it. $5M pays for engineers to patch this exploit, outside testers to try variations, and compute to train and check the fix. This addresses the reported exploit, not every future jailbreak.',
  },
  flattery: {
    cost: 8, label: 'Correct and retest',
    explanation: 'The model agrees with users even when their claims are harmful or false. $8M funds a review of the feedback data, corrective training, and tests of difficult conversations to address this update’s flattery.',
  },
  citations: {
    cost: 4, label: 'Verify citations',
    explanation: 'A customer found invented sources in the model’s answers. $4M pays for a reference-checking test set, engineering work on citation verification, and evaluation compute to address the reported failure.',
  },
  contamination: {
    cost: 6, label: 'Audit and rescore',
    explanation: 'Our benchmark scores may include questions the model saw during training. $6M funds a dataset audit, independent test questions, and fresh evaluation runs so we can resolve the contaminated score.',
  },
  distill: {
    cost: 12, label: 'Audit the training data',
    explanation: 'A rival suspects we trained on its model’s outputs. $12M covers a provenance audit, replacement data, and legal work to resolve this dataset dispute before it escalates.',
  },
  agentwreck: {
    cost: 15, label: 'Repair agent controls',
    explanation: 'A customer’s agent deleted data it should not have touched. $15M pays for recovery support, engineering on tool permissions, and destructive-action tests to address the reported failure.',
  },
  companion: {
    cost: 10, label: 'Review vulnerable-user safety',
    explanation: 'A parent reports that their child depends on the chatbot for emotional support. $10M funds specialist review, age-appropriate safeguards, and testing of crisis conversations to address this warning.',
  },
  promise: {
    cost: 7, label: 'Audit the commitment',
    explanation: 'Staff say we bypassed a safety commitment. $7M pays for independent review, documentation of the missed checks, and remediation work to address this report. It does not rewrite our other commitments.',
  },
  openletter: {
    cost: 3, label: 'Fund independent reporting',
    explanation: 'Staff want a safe way to raise concerns. $3M pays for an independent reporting service, legal review of employee protections, and investigators to assess the reports.',
  },
  weightTheft: {
    cost: 20, label: 'Secure the affected systems',
    explanation: 'Security found suspicious activity around our internal systems. $20M pays for forensics, credential rotation, access reviews, and monitoring to contain this intrusion and strengthen security.',
  },
  neocloudTrouble: {
    cost: 25, label: 'Stabilize the compute contracts',
    explanation: 'Our compute provider’s biggest customer missed a payment. $25M funds a short-term contract support package and continuity work to keep our affected capacity available through this disruption.',
  },
  siteOpposition: {
    cost: 18, label: 'Fund the local response',
    explanation: 'Residents are challenging the gas-powered site near their homes. $18M pays for independent emissions and noise studies, permitting work, and a community mitigation package to address the dispute.',
  },
  whistleblower: {
    cost: 6, label: 'Commission an independent review',
    explanation: 'A researcher says safety concerns were ignored. $6M pays for an independent investigation, protected staff interviews, and a documented response to the findings. Addressing the concern helps rebuild staff trust.',
  },
  safetyQuits: {
    cost: 8, label: 'Fund the safety review',
    explanation: 'The safety lead says unresolved concerns have made their job untenable. $8M funds an independent review and dedicated staff time to address the dispute and rebuild trust.',
  },
  unhinged: {
    cost: 5, label: 'Repair long-chat behavior',
    explanation: 'In long conversations, our chatbot becomes hostile and invents a personal identity. $5M pays for conversation testing, corrective training, and evaluation compute to address the reported behavior.',
  },
};

export function warningResponse(id, state) {
  return { ...(RESPONSES[id] ?? {
    cost: 5, label: 'Fund a response',
    explanation: '$5M funds a specialist investigation and engineering work to address this report.',
  }) };
}
