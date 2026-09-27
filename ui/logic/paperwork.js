// Owner pick 5C: the words on the raise, research and emergency paperwork, taken from the sim's own strings.

// EMERGENCY_OPTIONS read "Option name: what it does." The note already carries the name, so it prints the rest.
export function noteText(consequence) {
  const rest = consequence.includes(': ') ? consequence.slice(consequence.indexOf(': ') + 2) : consequence;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

export function pointsBar(points, cost) {
  // Points are fractional and events can push them below zero: compare the raw values, round down for display.
  return {
    fill: Math.min(1, Math.max(0, points / cost)),
    label: `${Math.floor(points)} of ${cost} research points`,
    rest: points >= cost ? `${Math.floor(points - cost)} left after this` : `Needs ${Math.ceil(cost - points)} more`,
  };
}

export const usedLabel = (used, total) => `Last resorts · ${used} of ${total} used`;
