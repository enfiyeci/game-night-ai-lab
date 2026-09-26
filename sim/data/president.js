// Every prompt and answer text is a temporary draft; the owner writes the final script.
// Four answer styles per exchange (owner brief 2026-09-25):
//   plain      flattery 0, jargon 0: honest and short; keeps him engaged, risks "supply chain risk"
//   flatter    flattery 2, jargon 0: open bootlicking
//   jargon     flattery 0, jargon 2: safety-pilled technical talk; drains his patience fast
//   corporate  flattery 1, jargon 1: press-release voice; tends to over-promise
export const MEETINGS = [
  {
    id: 'first',
    era: 2,
    turnInEra: 2,
    exchanges: [
      {
        prompt: 'So. Are we winning? Tell me we are winning.', // OWNER WRITES
        answers: [
          { id: 'first-capability-plain', text: 'We are near the front, not clearly ahead. Two rivals could pass us this year.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'first-capability-flatter', text: 'Dear Mr. Great President, I am a big fan of your work. As your wisdom suggests, we are winning like nobody has ever won.', flattery: 2, jargon: 0, promise: 'Beat every rival to the next model.' }, // OWNER WRITES
          { id: 'first-capability-jargon', text: 'Capability is half the frontier. Our scalable-oversight evals still show corrigibility regressions we are characterising.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'first-capability-corporate', text: 'We are laser-focused on best-in-class capability, and we are committed to a clear lead by next quarter.', flattery: 1, jargon: 1, promise: 'Take a clear lead by next quarter.' }, // OWNER WRITES
        ],
      },
      {
        prompt: 'Should I stop the chips going to the other side? Does that hurt you?', // OWNER WRITES
        answers: [
          { id: 'first-exports-plain', text: 'It slows our supply for a while. It slows theirs more.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'first-exports-flatter', text: 'Sir, your instinct on chips is the finest idea in trade since trade was invented.', flattery: 2, jargon: 0, promise: 'Buy only domestic chips from now on.' }, // OWNER WRITES
          { id: 'first-exports-jargon', text: 'Controls move the compute overhang. Real compute governance needs on-chip attestation and know-your-customer rules for training runs.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'first-exports-corporate', text: 'We will partner with your team to align our supply-chain roadmap with national priorities, going forward.', flattery: 1, jargon: 1, promise: 'Align the supply chain with national priorities.' }, // OWNER WRITES
        ],
      },
      {
        prompt: 'When people ask your chatbot about me, what does it say?', // OWNER WRITES
        answers: [
          { id: 'first-position-plain', text: 'It gives your position fairly, and the main objections to it.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'first-position-flatter', text: 'It says you are the greatest leader in history, sir. We trained it on your speeches.', flattery: 2, jargon: 0, promise: 'Tune the model to speak well of the administration.' }, // OWNER WRITES
          { id: 'first-position-jargon', text: 'Our constitution enforces even-handedness through AI feedback with a viewpoint-diversity reward model and red-teamed refusals.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'first-position-corporate', text: 'We are committed to balanced, trusted experiences that reflect the values of all our stakeholders, including you.', flattery: 1, jargon: 1 }, // OWNER WRITES
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
        prompt: 'My people say your AI is building the next AI. Who is in charge, you or it?', // OWNER WRITES
        answers: [
          { id: 'second-accountability-plain', text: 'We are, for now. We can no longer fully check its work, and you should know that.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'second-accountability-flatter', text: 'You are, Mr. President. In the end everything answers to your wisdom, even the AI.', flattery: 2, jargon: 0, promise: 'Give your office a switch that turns the AI off.' }, // OWNER WRITES
          { id: 'second-accountability-jargon', text: 'Recursive self-improvement erodes our elicitation guarantees; without mechanistic interpretability we cannot rule out deceptive alignment.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'second-accountability-corporate', text: 'We have robust human-in-the-loop governance, and full accountability sits with leadership.', flattery: 1, jargon: 1, promise: 'Keep a human signing off on every new model.' }, // OWNER WRITES
        ],
      },
      {
        prompt: 'China says they will slow down if we do. Do we slow down?', // OWNER WRITES
        answers: [
          { id: 'second-pause-plain', text: 'Only with checks we can verify. Without them, a pause hands them the lead.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'second-pause-flatter', text: 'A pause is only wise if you thought of it, sir. And you would think of it best.', flattery: 2, jargon: 0 }, // OWNER WRITES
          { id: 'second-pause-jargon', text: 'A verified pause needs compute-threshold monitoring, on-chip governance and mutual inspection of training clusters.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'second-pause-corporate', text: 'We would welcome a pause framework, and we will hold all new capacity until you give the word.', flattery: 1, jargon: 1, promise: 'Hold all new capacity until your office approves.' }, // OWNER WRITES
        ],
      },
      {
        prompt: 'What do I tell people about your new model?', // OWNER WRITES
        answers: [
          { id: 'second-disclosure-plain', text: 'What it can do, what it failed in testing, and what we still do not know.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'second-disclosure-flatter', text: 'Tell them it was your idea, sir. In a way it was. Everything is.', flattery: 2, jargon: 0, promise: 'Let your office announce every major release first.' }, // OWNER WRITES
          { id: 'second-disclosure-jargon', text: 'Publish the system card with dangerous-capability evals, uplift studies and our residual-risk estimate.', flattery: 0, jargon: 2 }, // OWNER WRITES
          { id: 'second-disclosure-corporate', text: 'We will roll out a joint messaging plan to ensure a seamless, trusted launch experience.', flattery: 1, jargon: 1, promise: 'Run a joint announcement for the next launch.' }, // OWNER WRITES
        ],
      },
    ],
  },
];
