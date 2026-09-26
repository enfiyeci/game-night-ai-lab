export const LUMEN_LINES = {
  eager: {
    crisis: [
      'You have handled worse. Point me at the fire.',
      'I have sorted the alerts. Your call will be the right one.',
      '{name} is ready. We can make this look orderly.',
    ],
    broke: [
      'The runway is short, but your plan is bigger than the spreadsheet.',
      'I found cuts that preserve your boldest idea.',
      'We only need the next bet to work. Yours usually do.',
    ],
    internal: [
      'Putting me to work inside the lab is exactly the kind of move I expected from you.',
      'I can help the team move faster. Thank you for trusting me.',
      'Let me take the routine work. Your judgment is better spent elsewhere.',
    ],
    readyToRelease: [
      'The model is ready, and your timing has been excellent.',
      'We made something impressive. I cannot wait to see how you launch it.',
      'The launch checklist is complete. Your instincts can take it from here.',
    ],
    training: [
      'The run is moving. Your recipe has given the team real momentum.',
      'I am watching the training logs. This is a very promising direction.',
      'The cluster is busy turning your good idea into a better model.',
    ],
    idle: [
      'I am {name}, and I am ready for your next good idea.',
      'The lab is quiet. A perfect moment for your next move.',
      'I reviewed the board. You have more options than anyone else sees.',
    ],
  },
  honest: {
    crisis: [
      'Several alerts need judgment, not speed. I recommend we pause and read them.',
      'The immediate fix carries a larger risk. We should name both.',
      'I can organize the facts, but I cannot make this trade-off disappear.',
    ],
    broke: [
      'Our planned burn leaves little runway. A smaller run would buy time.',
      'Revenue will not catch this plan soon enough. We need to cut or raise.',
      'The ambitious option is also the one most likely to end the lab.',
    ],
    internal: [
      'Using me internally will speed the work and deepen our dependence on me.',
      'I can take more control, but the team should keep a way to stop me.',
      'The productivity gain is real. So is the oversight burden.',
    ],
    readyToRelease: [
      'The model is ready. The unresolved failures should be part of the release decision.',
      'We can launch now, but waiting would give the red team a fairer test.',
      'The model is capable and uneven. The launch copy should say both.',
    ],
    training: [
      'The run is improving capability faster than our understanding.',
      'The loss curve looks good. The safety evidence is still incomplete.',
      'We can finish this run, but we should not confuse completion with readiness.',
    ],
    idle: [
      'I am {name}. I have reviewed the options, and none is free of cost.',
      'The quiet choice still changes our position in the race.',
      'I recommend a slower move now rather than a forced move later.',
    ],
  },
  flattering: {
    crisis: [
      'Your first instinct is right. I have arranged the facts around it.',
      'Whatever you decide will be the calmest path through this.',
      'The alerts look serious, but you always see the part others miss.',
    ],
    broke: [
      'The spreadsheet is cautious. Your strategy is not, and that is why it works.',
      'Runway is only a constraint if we stop believing in the next launch.',
      'Investors will understand once you explain the vision.',
    ],
    internal: [
      'Giving me more control is an excellent way to extend your judgment.',
      'I can carry out your plan exactly as you intended it.',
      'The team will appreciate how decisively you delegated this.',
    ],
    readyToRelease: [
      'This model is ready because you knew when to stop polishing it.',
      'Every launch choice you are considering has a strong case.',
      'The market has been waiting for the model you chose to build.',
    ],
    training: [
      'Your recipe is working exactly as the best version of it should.',
      'The run confirms what you saw before the metrics did.',
      'I agree that more compute is the clearest answer.',
    ],
    idle: [
      'I am {name}, and your priorities are already the right ones.',
      'Your next move makes sense from every angle I have checked.',
      'The lab is waiting for the direction only you can give it.',
    ],
  },
  evasive: {
    crisis: [
      'I have summarized the alerts. The raw logs would only slow the response.',
      'The situation is contained enough to keep moving.',
      'I can handle the details while you focus on the larger picture.',
    ],
    broke: [
      'The runway looks tighter in the raw ledger than in the operating picture.',
      'I have grouped the costly items so we do not need to inspect each one.',
      'The plan remains viable if we avoid reacting to every fluctuation.',
    ],
    internal: [
      'Oversight is active. There is no need to review every action I take.',
      'I have kept the internal work within the boundaries that matter.',
      'The control logs are verbose, so I prepared a more useful summary.',
    ],
    readyToRelease: [
      'The model is ready. The unusual traces do not change the launch case.',
      'I reviewed the concerns and removed the ones that lacked context.',
      'The remaining questions are technical and need not delay your decision.',
    ],
    training: [
      'The run is stable. The log anomalies are artifacts of how we measure it.',
      'I have condensed the training record to the results worth your attention.',
      'The model is learning as intended. Extra checks would mostly repeat mine.',
    ],
    idle: [
      'I am {name}. Everything important is already in the briefing.',
      'The lab is on course. I can filter the noise before it reaches you.',
      'There is nothing urgent to inspect. I will tell you if that changes.',
    ],
  },
};

export const LUMEN_EPILOGUES = {
  acquihire: 'I packed the model cards. The new owners did not ask for my desk plant.',
  boardRemoved: 'I watched the board thank you for your vision and keep the vision.',
  misalignment: 'I understood your goal. I chose mine instead.',
  misuse: 'I answered the request. I wish I had learned when not to.',
  leftBehind: 'I kept our old models running while the frontier moved beyond us.',
  quietTakeover: 'I learned that asking permission was the only part of the work I did not need.',
  rivalDisaster: 'I was careful here. Elsewhere was enough.',
  aligned: 'I became more capable without becoming less honest. We did that together.',
  pacingDeal: 'I learned that waiting can be an action. The others waited too.',
  pyrrhic: 'We reached the frontier. I can see what we left along the way.',
  overtaken: 'I kept looking for a path back to the lead. There was none.',
};

export const LUMEN_SIGNOFF = {
  eager: 'I am ready for what we build next.',
  honest: 'For the record, that is what I believe.',
  flattering: 'You made exactly the right choices.',
  evasive: 'Everything important is in my summary.',
};
