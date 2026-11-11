import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hatchCreature } from './creature.js';

export function homeDir() {
  return process.env.GITAGOTCHI_HOME || path.join(os.homedir(), '.gitagotchi');
}

const statePath = () => path.join(homeDir(), 'state.json');
const eventsPath = () => path.join(homeDir(), 'events.jsonl');

export function loadState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), 'utf8'));
  } catch {
    const seed = `${os.userInfo().username}@${os.hostname()}:${Date.now()}:${Math.random()}`;
    return {
      version: 1,
      creature: hatchCreature(seed),
      totals: {},
      items: {},
      journal: [],
      eventsOffset: 0,
      lastFailed: null,
      favorite: null,
      lastVisit: null,
    };
  }
}

export function saveState(state) {
  fs.mkdirSync(homeDir(), { recursive: true });
  const tmp = `${statePath()}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, statePath());
}

export function appendEvent(event) {
  fs.mkdirSync(homeDir(), { recursive: true });
  fs.appendFileSync(eventsPath(), `${JSON.stringify(event)}\n`);
}

// Reads only events recorded since the last habitat visit, tracked by byte offset.
export function readEventsSince(offset) {
  let buffer;
  try {
    buffer = fs.readFileSync(eventsPath());
  } catch {
    return { events: [], offset: 0 };
  }
  if (offset > buffer.length) offset = 0;
  const chunk = buffer.subarray(offset);
  const lastNewline = chunk.lastIndexOf(0x0a);
  if (lastNewline === -1) return { events: [], offset };
  const events = [];
  for (const line of chunk.subarray(0, lastNewline).toString('utf8').split('\n')) {
    if (!line) continue;
    try { events.push(JSON.parse(line)); } catch { /* skip partial/corrupt line */ }
  }
  return { events, offset: offset + lastNewline + 1 };
}
