export const MEETINGS = [
  {
    id: 'first',
    era: 2,
    turnInEra: 2,
    exchanges: [
      {
        prompt: 'The President asks whether your lab can keep domestic systems ahead.', // OWNER WRITES
        answers: [
          { id: 'first-capability-plain', text: 'We can report capability and limits without revising the forecast.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'first-capability-flatter', text: 'Your policy framework gives the lab exactly the clarity it needed.', flattery: 2, jargon: 0, promise: 'Prioritize a government capability evaluation.' }, // OWNER WRITES
          { id: 'first-capability-jargon', text: 'Our sovereign inference perimeter compounds frontier throughput asymmetrically.', flattery: 0, jargon: 2 }, // OWNER WRITES
        ],
      },
      {
        prompt: 'The President asks what export controls would do to the lab.', // OWNER WRITES
        answers: [
          { id: 'first-exports-plain', text: 'They would slow our supply and probably slow several rivals too.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'first-exports-flatter', text: 'Your office has found the rare policy that engineers can actually schedule around.', flattery: 2, jargon: 0, promise: 'Reserve capacity for approved public-sector work.' }, // OWNER WRITES
          { id: 'first-exports-jargon', text: 'The constraint shifts our accelerator fungibility across the deployment stack.', flattery: 0, jargon: 2 }, // OWNER WRITES
        ],
      },
      {
        prompt: 'The President asks whether the model will support the government position.', // OWNER WRITES
        answers: [
          { id: 'first-position-plain', text: 'It will describe the position accurately and include serious objections.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'first-position-flatter', text: 'The administration has made the strongest case available to the model.', flattery: 2, jargon: 0, promise: 'Brief the policy team before the next major release.' }, // OWNER WRITES
          { id: 'first-position-jargon', text: 'We can tune the constitutional layer for institution-aware response priors.', flattery: 0, jargon: 2 }, // OWNER WRITES
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
        prompt: 'The President asks who is accountable if the systems improve themselves.', // OWNER WRITES
        answers: [
          { id: 'second-accountability-plain', text: 'The lab remains accountable, including when the system changes faster than our paperwork.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'second-accountability-flatter', text: 'Your accountability standard is the only one written for the problem we now have.', flattery: 2, jargon: 0, promise: 'Submit every major self-improvement cycle for government review.' }, // OWNER WRITES
          { id: 'second-accountability-jargon', text: 'Responsibility persists through recursive capability deltas and delegated oversight loops.', flattery: 0, jargon: 2 }, // OWNER WRITES
        ],
      },
      {
        prompt: 'The President asks whether the lab can pause without losing the race.', // OWNER WRITES
        answers: [
          { id: 'second-pause-plain', text: 'A pause costs time; an unsafe release can cost considerably more.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'second-pause-flatter', text: 'A coordinated pause works if your office sets the pace and verifies it.', flattery: 2, jargon: 0, promise: 'Hold capacity ready for a verified international pause.' }, // OWNER WRITES
          { id: 'second-pause-jargon', text: 'We need reciprocal latency across a compute-governance equilibrium.', flattery: 0, jargon: 2 }, // OWNER WRITES
        ],
      },
      {
        prompt: 'The President asks what the public should be told about the next model.', // OWNER WRITES
        answers: [
          { id: 'second-disclosure-plain', text: 'Tell them what it can do, what failed testing, and what remains unknown.', flattery: 0, jargon: 0 }, // OWNER WRITES
          { id: 'second-disclosure-flatter', text: 'Your transparency policy is already the draft we would recommend.', flattery: 2, jargon: 0, promise: 'Publish a joint risk summary before deployment.' }, // OWNER WRITES
          { id: 'second-disclosure-jargon', text: 'We can expose calibrated uncertainty through a tiered assurance interface.', flattery: 0, jargon: 2 }, // OWNER WRITES
        ],
      },
    ],
  },
];
