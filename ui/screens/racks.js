const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

// The panel re-renders every story day; the rack's position only changes with the era. A failed load is logged
// once and remembered as null (the panel then stays hidden), so it does not raise an error on every daily update.
const anchorsByEra = new Map();
const anchorsFor = (era) => {
  if (!anchorsByEra.has(era)) {
    anchorsByEra.set(era, fetch(`ui/assets/anchors-era${era}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`could not load anchors for era ${era}`);
        return response.json();
      })
      .catch((error) => {
        console.error(error);
        return null;
      }));
  }
  return anchorsByEra.get(era);
};

// Shows the AI's queued moves at the racks. Each answer applies at once and uses none of the two actions;
// the panel is not modal, so the clock keeps running. Like the board's bubbles, it steps aside for a card, a dialog,
// the screen wall, and the board's "going quiet" panel, which sits over the racks in the top-right column.
export async function mountRacks(game, overlayRoot) {
  const root = element('aside', 'racks-panel');
  root.setAttribute('aria-label', 'Your AI wants to');
  root.hidden = true;
  // Head of Safety's line about the risky move, said from her desk in the game's advisor bubble (mockup q-b).
  const safety = element('div', 'ev-bubble racks-safety');
  safety.setAttribute('role', 'note');
  safety.append(element('b', '', 'Head of Safety'), element('div', 'ev-say', 'It is asking to watch itself less. Read that one again.'), element('span', 'ev-pick', '✓ Cancel it'));
  safety.hidden = true;
  overlayRoot.append(root, safety);
  const stage = overlayRoot.parentElement;
  const busy = () => Boolean(overlayRoot.querySelector('.event-layer, .dialog-layer, .screenwall-layer')
    || stage?.querySelector('.bd-quiet-slot:not([hidden]) .bd-quiet'));
  const idle = () => {
    const { proposals, autoApprove } = game.state.automation;
    return (proposals.length === 0 && !autoApprove) || busy();
  };
  let drawn = null; // what is on screen, so the daily notifications do not rebuild buttons under the pointer
  const hide = () => {
    root.hidden = true;
    safety.hidden = true;
    drawn = null;
  };
  const render = async () => {
    if (idle()) return hide();
    const anchors = await anchorsFor(game.state.era);
    if (!anchors || idle()) return hide();
    const { proposals, autoApprove } = game.state.automation;
    const key = JSON.stringify([game.state.era, proposals, autoApprove]);
    if (key === drawn) return;
    drawn = key;
    // The tail sits 300 px in and the panel grows upwards from just above the racks, clear of the clock chip.
    root.style.left = `${anchors.rack[0] - 300}px`;
    root.style.bottom = `${900 - anchors.rack[1] + 14}px`;
    const heading = element('h2', '', proposals.length ? 'Your AI wants to' : 'Nothing waiting for you');
    heading.tabIndex = -1; // focus lands here once the last row is answered
    root.replaceChildren(element('small', 'racks-kicker', 'From the racks'), heading);
    for (const proposal of proposals) {
      const item = element('div', `racks-item${proposal.risky ? ' risky' : ''}`);
      item.append(element('p', '', proposal.label));
      const row = element('div', 'racks-actions');
      for (const [label, value] of [['Approve', true], ['Cancel', false]]) {
        const button = element('button', value ? 'approve' : '', label);
        button.type = 'button';
        button.addEventListener('click', async () => {
          game.setField('aiApprovals', { [proposal.id]: value });
          await render();
          // The answered row is gone: focus the next row's Cancel, never an Approve (it may be the risky move).
          const next = root.querySelector('.racks-actions button:not(.approve)') ?? root.querySelector('h2');
          if (!root.hidden) next?.focus();
        });
        row.append(button);
      }
      item.append(row);
      root.append(item);
    }
    const [headX, headY] = anchors.heads.safety;
    safety.style.left = `${headX - 40}px`;
    safety.style.bottom = `${900 - headY + 40}px`;
    const auto = element('button', `compute-toggle${autoApprove ? ' enabled' : ''}`);
    auto.type = 'button';
    auto.setAttribute('role', 'switch');
    auto.setAttribute('aria-checked', `${autoApprove}`);
    const copy = element('span');
    copy.append(element('b', '', 'Let it go ahead without asking'), element('small', '', 'Faster. You will see what it did afterwards.'));
    auto.append(copy, element('i', autoApprove ? 'on' : ''));
    auto.addEventListener('click', async () => {
      game.setField('aiAutoApprove', !autoApprove);
      await render();
      root.querySelector('.compute-toggle')?.focus();
    });
    root.append(auto);
    root.hidden = false;
    safety.hidden = !proposals.some((proposal) => proposal.risky);
  };
  await render();
  new MutationObserver(() => { render(); }).observe(overlayRoot, { childList: true });
  // The board mounts its going-quiet slot on the stage after this panel, so watch the stage's subtree for it.
  if (stage) new MutationObserver(() => { render(); }).observe(stage, { childList: true, subtree: true });
  return game.subscribe(() => { render(); });
}
