import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../ui/styles.css', import.meta.url), 'utf8');
const zIndexes = (selector) => [...css.matchAll(new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`, 'g'))]
  .map((match) => match[1].match(/z-index:\s*(-?\d+)/)?.[1])
  .filter(Boolean)
  .map(Number);

test('advisor warning bubbles sit under every dialog', () => {
  const [bubbles] = zIndexes('.ev-briefing');
  const dialogs = zIndexes('.dialog-layer');
  assert.ok(Number.isFinite(bubbles), '.ev-briefing has a z-index');
  assert.ok(dialogs.length > 0, '.dialog-layer has a z-index');
  for (const dialog of dialogs) assert.ok(bubbles < dialog, `.ev-briefing (${bubbles}) is under .dialog-layer (${dialog})`);
});
