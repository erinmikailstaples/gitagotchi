import crypto from 'node:crypto';
import { CATALOG, SIGNAL_LABELS, tierFor } from './catalog.js';
import { tallyEvents } from './classify.js';
import { face, favoriteSignal } from './creature.js';

// Folds new events into the habitat and returns what changed, with reasons.
// Pure: the caller decides whether to persist the returned state.
export function visit(prevState, events, now = new Date()) {
  const state = structuredClone(prevState);
  const { counts, lastFailed } = tallyEvents(events, state.lastFailed);
  state.lastFailed = lastFailed;
  for (const [signal, n] of Object.entries(counts)) {
    state.totals[signal] = (state.totals[signal] || 0) + n;
  }

  const news = [];
  for (const item of CATALOG) {
    const total = state.totals[item.signal] || 0;
    const tier = tierFor(item, total);
    const owned = state.items[item.id];
    const previousTier = owned ? owned.tier : 0;
    if (tier <= previousTier) continue;

    const recent = counts[item.signal] || total;
    news.push({
      kind: previousTier === 0 ? 'new' : 'upgrade',
      itemId: item.id,
      name: item.names[tier - 1],
      from: previousTier ? item.names[previousTier - 1] : null,
      glyph: item.glyph,
      why: item.why(recent),
    });
    state.items[item.id] = {
      tier,
      acquiredAt: owned ? owned.acquiredAt : now.toISOString(),
      upgradedAt: now.toISOString(),
    };
  }

  const favorite = favoriteOwned(state);
  if (favorite && favorite !== state.favorite) {
    const item = CATALOG.find((i) => i.id === favorite);
    if (state.favorite) {
      news.push({
        kind: 'moved',
        itemId: favorite,
        name: item.names[state.items[favorite].tier - 1],
        glyph: item.glyph,
        why: `You've leaned on ${SIGNAL_LABELS[item.signal]} more than anything else lately, so this is the cozy corner now.`,
      });
    }
    state.favorite = favorite;
  }

  for (const entry of news) state.journal.push({ at: now.toISOString(), ...entry });
  state.lastVisit = now.toISOString();
  return { state, news, eventCount: events.length };
}

function favoriteOwned(state) {
  const ownedTotals = {};
  for (const item of CATALOG) {
    if (state.items[item.id]) ownedTotals[item.id] = state.totals[item.signal] || 0;
  }
  return favoriteSignal(ownedTotals);
}

const article = (name) => (/^[aeiou]/i.test(name) ? 'an' : 'a');

const MARK = { new: '+', upgrade: '↑', moved: '~' };

export function renderNews(state, news, eventCount) {
  const { creature } = state;
  const lines = [];
  if (news.length === 0) {
    lines.push(`${face(creature, 'sleepy')}  Nothing new since your last visit.`);
    lines.push(eventCount
      ? `  ${creature.name} sniffed ${eventCount} new command${eventCount === 1 ? '' : 's'} but is still deciding what to build.`
      : `  ${creature.name} ${creature.quirk}. That's about it.`);
    return lines.join('\n');
  }

  lines.push('WHILE YOU WERE OUT...', '');
  for (const entry of news) {
    if (entry.kind === 'new') lines.push(`${MARK.new} ${entry.glyph} ${article(entry.name).replace(/^a/, 'A')} ${entry.name} appeared.`);
    if (entry.kind === 'upgrade') lines.push(`${MARK.upgrade} ${entry.glyph} The ${entry.from} became ${article(entry.name)} ${entry.name}.`);
    if (entry.kind === 'moved') lines.push(`${MARK.moved} ${creature.name} moved its nest next to the ${entry.name}.`);
    lines.push(`    why: ${entry.why}`, '');
  }
  return lines.join('\n').trimEnd();
}

const WIDTH = 56;
const COLUMNS = [2, 13, 24, 35, 46];
const ITEM_ROWS = 3;

function slotOrder(seed) {
  const slots = [];
  for (let r = 0; r < ITEM_ROWS; r++) for (const c of COLUMNS) slots.push([r, c]);
  return CATALOG.map((item) => item.id)
    .map((id) => [id, crypto.createHash('md5').update(seed + id).digest('hex')])
    .sort((a, b) => a[1].localeCompare(b[1]))
    .reduce((map, [id], i) => map.set(id, slots[i % slots.length]), new Map());
}

function place(row, col, text) {
  const chars = [...row];
  [...text].forEach((ch, i) => { if (col + i < chars.length) chars[col + i] = ch; });
  return chars.join('');
}

export function renderHabitat(state) {
  const { creature } = state;
  const rows = Array.from({ length: ITEM_ROWS }, () => ' '.repeat(WIDTH));
  const slots = slotOrder(creature.seed);
  for (const item of CATALOG) {
    if (!state.items[item.id] || item.id === state.favorite) continue;
    const [r, c] = slots.get(item.id);
    rows[r] = place(rows[r], c, item.glyph);
  }

  const fav = state.favorite && CATALOG.find((i) => i.id === state.favorite);
  const nest = `${fav ? `${fav.glyph} ` : ''}${face(creature)} zZ`;
  let creatureRow = ' '.repeat(WIDTH);
  creatureRow = place(creatureRow, Math.floor((WIDTH - [...nest].length) / 2), nest);

  const title = ` ${creature.name}'s habitat `;
  const top = `╭${title}${'─'.repeat(WIDTH - title.length)}╮`;
  const out = [top, ...rows.map((r) => `│${r}│`), `│${creatureRow}│`, `╰${'▔'.repeat(WIDTH)}╯`];

  const owned = CATALOG.filter((item) => state.items[item.id]);
  if (owned.length) {
    out.push('');
    for (const item of owned) {
      const tier = state.items[item.id].tier;
      const stars = '★'.repeat(tier) + '☆'.repeat(item.thresholds.length - tier);
      const label = item.id === state.favorite ? '  ← favorite spot' : '';
      out.push(`  ${item.glyph.padEnd(4)} ${item.names[tier - 1].padEnd(34)} ${stars}${label}`);
    }
  } else {
    out.push('', `  It's bare in here. Code a little and ${creature.name} will start collecting things.`);
  }
  out.push('', `  ${creature.name} has ${creature.markings} and ${creature.quirk}.`);
  return out.join('\n');
}

export function renderJournal(state) {
  if (!state.journal.length) return 'The journal is empty. Nothing has been collected yet.';
  return state.journal.map((entry) => {
    const date = entry.at.slice(0, 10);
    const verb = entry.kind === 'new' ? 'found' : entry.kind === 'upgrade' ? 'upgraded to' : 'nested by';
    return `${date}  ${entry.glyph.padEnd(4)} ${verb} ${entry.name}\n            ${entry.why}`;
  }).join('\n');
}
