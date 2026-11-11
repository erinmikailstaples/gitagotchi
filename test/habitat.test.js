import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { tallyEvents } from '../src/classify.js';
import { visit, renderNews } from '../src/habitat.js';
import { hatchCreature } from '../src/creature.js';

const freshState = () => ({
  creature: hatchCreature('test-seed'),
  totals: {}, items: {}, journal: [], eventsOffset: 0, lastFailed: null, favorite: null, lastVisit: null,
});

test('code types and terminal activity map to different signals', () => {
  const { counts } = tallyEvents([
    { cmd: 'git commit -m x', exit: 0, files: ['app.py', 'ui/Button.tsx', 'tests/test_app.py', 'README.md'] },
    { cmd: 'tail -f server.log', exit: 0 },
    { cmd: 'pytest -q', exit: 0 },
  ]);
  assert.deepEqual(counts, { commits: 1, python: 2, frontend: 1, tests: 2, docs: 1, logs: 1 });
});

test('a fix is counted only when a failed command later succeeds, even across visits', () => {
  const first = tallyEvents([{ cmd: 'npm  run lint', exit: 1 }, { cmd: 'ls', exit: 0 }]);
  assert.equal(first.counts.fixes, undefined);
  const second = tallyEvents([{ cmd: 'npm run lint', exit: 0 }], first.lastFailed);
  assert.equal(second.counts.fixes, 1);
});

test('visit reports new items with reasons, then upgrades existing ones instead of duplicating', () => {
  const logs = (n) => Array.from({ length: n }, () => ({ cmd: 'tail -f a.log', exit: 0 }));

  const first = visit(freshState(), logs(2));
  assert.deepEqual(first.news.map((n) => [n.kind, n.name]), [['new', 'compost pile']]);
  assert.match(first.news[0].why, /streamed logs 2 times/);

  const quiet = visit(first.state, []);
  assert.equal(quiet.news.length, 0);
  assert.match(renderNews(quiet.state, quiet.news, 0), /Nothing new/);

  const second = visit(quiet.state, logs(8));
  assert.deepEqual(second.news.map((n) => [n.kind, n.from, n.name]),
    [['upgrade', 'compost pile', 'compost with a blinking fern']]);
  assert.match(second.news[0].why, /8 times/);
  assert.equal(second.state.journal.length, 2);
});

test('the creature moves its nest when a different habit takes over', () => {
  const builds = Array.from({ length: 3 }, () => ({ cmd: 'npm run build', exit: 0 }));
  const tests = Array.from({ length: 5 }, () => ({ cmd: 'npm test', exit: 0 }));
  const a = visit(freshState(), builds);
  assert.equal(a.state.favorite, 'snack-furnace');
  const b = visit(a.state, tests);
  const moved = b.news.find((n) => n.kind === 'moved');
  assert.equal(moved.itemId, 'shield-blanket');
  assert.match(renderNews(b.state, b.news, 5), /moved its nest next to the blanket with one shield/);
});

test('events are read incrementally and partial trailing lines are left for later', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'gg-'));
  process.env.GITAGOTCHI_HOME = home;
  const { appendEvent, readEventsSince } = await import('../src/state.js');
  appendEvent({ cmd: 'a' });
  const first = readEventsSince(0);
  assert.deepEqual(first.events.map((e) => e.cmd), ['a']);
  fs.appendFileSync(path.join(home, 'events.jsonl'), '{"cmd":"b"}\n{"cmd":');
  const second = readEventsSince(first.offset);
  assert.deepEqual(second.events.map((e) => e.cmd), ['b']);
  fs.rmSync(home, { recursive: true });
});
