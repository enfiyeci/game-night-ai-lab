export const ADVISORS = [
  { id: 'research', name: 'Head of Research' },
  { id: 'safety', name: 'Head of Safety' },
  { id: 'cfo', name: 'CFO' },
  { id: 'policy', name: 'Policy and Comms' },
];

export function teamPanel(state, { opinions = null, lines = false } = {}) {
  const root = document.createElement('div');
  root.className = 'budget-team';
  if (opinions) {
    for (const opinion of opinions) {
      const row = document.createElement('div');
      row.className = 'compute-opinion';
      const heading = document.createElement('div');
      heading.className = 'compute-opinion-heading';
      const name = document.createElement('span');
      name.textContent = opinion.name ?? ADVISORS.find((advisor) => advisor.id === opinion.id)?.name ?? opinion.id;
      const mood = document.createElement('span');
      mood.className = `compute-mood ${opinion.mood}`;
      mood.textContent = opinion.mood;
      const quote = document.createElement('q');
      quote.textContent = opinion.text;
      heading.append(name, mood);
      row.append(heading, quote);
      root.append(row);
    }
    return root;
  }
  const readings = new Map((state.lastBriefing ?? []).map((reading) => [reading.id, reading]));
  for (const advisor of ADVISORS) {
    const row = document.createElement('div');
    row.className = 'budget-team-row';
    const name = document.createElement('div');
    name.className = 'budget-team-name';
    name.textContent = advisor.name;
    const mood = document.createElement('div');
    mood.className = 'budget-team-mood';
    const reading = readings.get(advisor.id);
    const band = reading?.band;
    mood.textContent = band ? band[0].toUpperCase() + band.slice(1) : 'No briefing yet';
    row.append(name, mood);
    if (lines && reading?.line) {
      const line = document.createElement('div');
      line.className = 'budget-team-line';
      line.textContent = reading.line;
      row.append(line);
    }
    root.append(row);
  }
  return root;
}
