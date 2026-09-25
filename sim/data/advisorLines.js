// Advisors never quote numbers. Three lines per band; picked by turn.
export const ADVISOR_LINES = {
  research: {
    calm: ['We are at the frontier and the next run looks strong.', 'Our results are the best in the field right now.', 'The team has momentum. Let us keep shipping.'],
    uneasy: ['A rival is edging ahead of us.', 'We are falling a step behind the leaders.', 'I need more compute to keep pace.'],
    alarmed: ['We are losing the frontier.', 'If we do not train something big soon, we are finished.', 'The leaders are pulling away from us.'],
    weird: 'Some of the latest results look strange, though.',
  },
  safety: {
    calm: ['Evaluations look clean this quarter.', 'Nothing in the red-team reports worries me.', 'I am comfortable with where the model is.'],
    uneasy: ['Some evaluation results do not add up.', 'I want more time with the red team before the next launch.', 'We are testing less than I would like.'],
    alarmed: ['I would not ship anything right now.', 'The model is doing things we cannot explain.', 'If this goes wrong, it goes wrong for everyone.'],
  },
  cfo: {
    calm: ['Runway is comfortable.', 'Revenue is covering more of the burn.', 'We can afford the next bet.'],
    uneasy: ['Burn is climbing faster than revenue.', 'We should plan the next raise soon.', 'Every run now needs to pay for itself.'],
    alarmed: ['We are running out of money.', 'We need cash this quarter, whatever it costs.', 'I cannot make payroll math work much longer.'],
  },
  policy: {
    calm: ['Washington likes us and the press is friendly.', 'The public mood is steady.', 'No fires on my desk this week.'],
    uneasy: ['The race is heating up and people notice.', 'Regulators are asking pointed questions.', 'The feed is turning on the whole industry.'],
    alarmed: ['Everyone is racing and nobody is steering.', 'We are one headline away from a hearing.', 'Governments are losing patience with all of us.'],
  },
};
