# Era-based scenario pools

Implemented from the September 26 playtest decision: events follow the lab's development stage, not historical anniversaries.

- Normal new games use 50 scenarios: ten per era, with four or five seeded arrival slots per era. Only eligible scenarios can be selected; a lab without the required deployments may see fewer.
- Pause proposals and White House safety programmes are Era 4 events for prominent labs. The frontier pause lasts 30 story days; a shorter review lasts seven. Both stop current training and new starts, with a HUD countdown.
- Each scenario has three implemented responses with specific spending descriptions, advisor preferences, affordability checks, and a free timeout response.
- Choices can alter the lab's risks, security, trust, users, research progress, and therefore future eligibility. Arrival days and selection use a seed-derived stream separate from simulation randomness.
- Queued scenarios are checked against current era and prerequisites each day and again before resolution. Retired deployments and era transitions cannot leave stale scenarios actionable.
- Critical automation incidents, training failures, board business, and presidential promise consequences remain separate from the discretionary scenario budget.
- Legacy historical rows remain resolvable for existing simulation fixtures and explicit debug scenarios. Normal gameplay suppresses their scheduled world/planted events. `createGame` defaults new games to scenarios; callers supplying a historical debug state can opt in with `eventMode: 'scenarios'`.
- Warning responses use incident-specific budgets shared by simulation, advisor bubbles, and Flock, instead of a generic era multiplier.

The current content is in `sim/data/scenarioEvents.js`; scheduling is in `sim/scenarios.js`. Preview the new jailbreak card with `?scenario=scenarioEvent&seed=1`.

Validation: full `npm test` passed with four pre-existing TODOs; focused catalogue/director tests cover all 150 response costs, era gates, seeded variation, invalidation, affordable fallback, and actual training holds. Browser verification confirmed the detailed card fits, advisor preferences display, and choosing the $5M patch debits cash from $1B to $995M and closes the card without console errors.
