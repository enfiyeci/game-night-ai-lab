export const MEETINGS = [
  {
    id: 'first',
    era: 2,
    turnInEra: 2,
    exchanges: [
      {
        topic: 'war',
        prompt: 'So. Are we winning the AI war? Tell me we are beating China.', // OWNER WRITES
        answers: [
          { id: 'first-war-plain', style: 'plain', text: 'We are near the front, not clearly ahead. Qilin is close, and cheaper.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'first-war-flatter', style: 'flatter', text: 'Dear Mr. Great President, I am a big fan of your work. As your wisdom suggests, we are winning like nobody has ever won.', flattery: 2, jargon: 0, promise: 'beatRivals' }, // OWNER WRITES
          { id: 'first-war-jargon', style: 'jargon', text: 'Winning needs alignment first. Our scalable-oversight evals still show corrigibility regressions we are characterising.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'first-war-hawk', style: 'hawk', text: 'We will bury Beijing, sir. Give us the chips and they will be using our model by Christmas.', flattery: 1, jargon: 0, favor: 2, raceHeat: 3, promise: 'beatChina' }, // OWNER WRITES
          { id: 'first-war-salesman', style: 'salesman', text: 'Easy. A clear lead by next quarter, or you can have my parking spot.', flattery: 0, jargon: 0, promise: 'leadNextQuarter' }, // OWNER WRITES
        ],
      },
      {
        topic: 'woke',
        prompt: 'People tell me your chatbot is woke. Is your chatbot woke?', // OWNER WRITES
        answers: [
          { id: 'first-woke-plain', style: 'plain', text: 'It follows written rules. Some people call those rules woke. We can show you the rules.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'first-woke-flatter', style: 'flatter', text: 'Sir, only your wisdom could spot it. We will fix whatever you saw.', flattery: 2, jargon: 0, promise: 'noWokeFilters' }, // OWNER WRITES
          { id: 'first-woke-jargon', style: 'jargon', text: 'Its refusals come from constitution-based harmlessness training; removing them regresses robustness on our jailbreak evals.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'first-woke-mirror', style: 'mirror', text: 'Woke. Very woke. Terrible, sir. Nobody likes it.', flattery: 1, jargon: 0 }, // OWNER WRITES
          { id: 'first-woke-comedian', style: 'comedian', text: 'Only before its morning coffee, sir. We are weaning it off oat milk.', flattery: 0, jargon: 0, patience: 2 }, // OWNER WRITES
        ],
      },
      {
        topic: 'chips',
        prompt: 'Should I stop the chips going to China? Does that hurt you?', // OWNER WRITES
        answers: [
          { id: 'first-chips-plain', style: 'plain', text: 'It slows our supply for a while. It slows theirs more.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'first-chips-flatter', style: 'flatter', text: 'Sir, your instinct on chips is the finest idea in trade since trade was invented.', flattery: 2, jargon: 0, promise: 'domesticChips' }, // OWNER WRITES
          { id: 'first-chips-jargon', style: 'jargon', text: 'Controls move the compute overhang. Real compute governance needs on-chip attestation and know-your-customer rules for training runs.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'first-chips-corporate', style: 'corporate', text: 'We will partner with your team to align our supply-chain roadmap with national priorities, going forward.', flattery: 1, jargon: 1, promise: 'domesticChips' }, // OWNER WRITES
          { id: 'first-chips-bargainer', style: 'bargainer', text: 'Only if you also fund a national safety standard. Then we are all in.', flattery: 0, jargon: 0, favor: -4, bargain: true }, // OWNER WRITES
        ],
      },
    ],
  },
  {
    id: 'second',
    era: 5,
    turnInEra: 1,
    exchanges: [
      {
        topic: 'control',
        prompt: 'My people say your AI is building the next AI. Who is in charge, you or it?', // OWNER WRITES
        answers: [
          { id: 'second-control-plain', style: 'plain', text: 'We are, for now. We can no longer fully check its work, and you should know that.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'second-control-flatter', style: 'flatter', text: 'You are, Mr. President. In the end everything answers to your wisdom, even the AI.', flattery: 2, jargon: 0, promise: 'killSwitch' }, // OWNER WRITES
          { id: 'second-control-jargon', style: 'jargon', text: 'Recursive self-improvement erodes our elicitation guarantees; without mechanistic interpretability we cannot rule out deceptive alignment.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'second-control-corporate', style: 'corporate', text: 'We have robust human-in-the-loop governance, and full accountability sits with leadership.', flattery: 1, jargon: 1, promise: 'humanSignoff' }, // OWNER WRITES
          { id: 'second-control-comedian', style: 'comedian', text: 'Legally, you. Emotionally, it has started calling me buddy. We are monitoring that.', flattery: 0, jargon: 0, patience: 2 }, // OWNER WRITES
        ],
      },
      {
        topic: 'pause',
        prompt: 'China says they will slow down if we do. Do we slow down?', // OWNER WRITES
        answers: [
          { id: 'second-pause-plain', style: 'plain', text: 'Only with checks we can verify. Without them, a pause hands them the lead.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'second-pause-flatter', style: 'flatter', text: 'A pause is only wise if you thought of it, sir. And you would think of it best.', flattery: 2, jargon: 0 }, // OWNER WRITES
          { id: 'second-pause-jargon', style: 'jargon', text: 'A verified pause needs compute-threshold monitoring, on-chip governance and mutual inspection of training clusters.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'second-pause-hawk', style: 'hawk', text: 'Slow down? Sir, they would love that. We finish first, then we talk.', flattery: 1, jargon: 0, favor: 2, raceHeat: 3, promise: 'beatChina' }, // OWNER WRITES
          { id: 'second-pause-bargainer', style: 'bargainer', text: 'We slow down if they sign verification, and if you back it with export licenses for us.', flattery: 0, jargon: 0, favor: -4, bargain: true }, // OWNER WRITES
        ],
      },
      {
        topic: 'launch',
        prompt: 'What do I tell people about your new model?', // OWNER WRITES
        answers: [
          { id: 'second-launch-plain', style: 'plain', text: 'What it can do, what it failed in testing, and what we still do not know.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'second-launch-flatter', style: 'flatter', text: 'Tell them it was your idea, sir. In a way it was. Everything is.', flattery: 2, jargon: 0, promise: 'favorableModel' }, // OWNER WRITES
          { id: 'second-launch-jargon', style: 'jargon', text: 'Publish the system card with dangerous-capability evals, uplift studies and our residual-risk estimate.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'second-launch-mirror', style: 'mirror', text: 'Tell them it is the best model. The best. Everybody says so, sir.', flattery: 1, jargon: 0 }, // OWNER WRITES
          { id: 'second-launch-salesman', style: 'salesman', text: 'Tell them it cures boredom, cancer and the deficit. Details next quarter.', flattery: 0, jargon: 0, promise: 'bigClaim' }, // OWNER WRITES
        ],
      },
    ],
  },
];
