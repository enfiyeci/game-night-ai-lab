import { CANDIDATES, SEATS, leadId } from '../../sim/leads.js';

// What other screens add to a seated person (ui/screens/briefing.js makeClickable); it moves with the seat.
const HANDED_OVER = ['tabindex', 'role', 'aria-label', 'style'];

// The office art draws each advisor's desk twice (tools/office/gen_office.py lead_seat): today's lead as #person-<seat>
// and the alternate as #person-<seat>-alt, hidden. This puts the hired lead under #person-<seat>, so the anchors, hit
// areas, faces, clicks and bubbles work for whoever sits there, and hides the other copy as #idle-<seat>.
// Returns true when a seat changed hands.
export function seatLeads(svg, state) {
  let changed = false;
  for (const seat of SEATS) {
    let copies = [...svg.querySelectorAll(`[data-lead-seat="${seat}"]`)];
    if (copies.length === 0) {
      const today = svg.querySelector(`#person-${seat}`);
      const alternate = svg.querySelector(`#person-${seat}-alt`);
      if (!today || !alternate) continue;
      [today, alternate].forEach((group, index) => {
        group.setAttribute('data-lead-seat', seat);
        group.setAttribute('data-lead', CANDIDATES[seat][index]);
      });
      copies = [today, alternate];
    }
    const hired = leadId(state, seat);
    const incoming = copies.find((group) => group.getAttribute('data-lead') === hired);
    const outgoing = copies.find((group) => group !== incoming);
    if (outgoing.id === `person-${seat}`) {
      for (const name of HANDED_OVER) {
        if (!outgoing.hasAttribute(name)) continue;
        incoming.setAttribute(name, outgoing.getAttribute(name));
        outgoing.removeAttribute(name);
      }
      changed = true;
    }
    outgoing.id = `idle-${seat}`;
    outgoing.setAttribute('display', 'none');
    incoming.id = `person-${seat}`;
    incoming.removeAttribute('display');
  }
  return changed;
}
