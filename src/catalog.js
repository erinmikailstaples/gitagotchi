// Each item grows through tiers as its signal accumulates over your lifetime.
// `why` explains the addition using what happened since your last visit.
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const CATALOG = [
  {
    id: 'heat-lamp', signal: 'python', thresholds: [3, 15, 50], glyph: '~☼~',
    names: ['heat lamp', 'heat lamp with a coiled snake', 'snake sunroom'],
    why: (n) => `You touched ${plural(n, 'Python file')}. It wanted somewhere warm to digest.`,
  },
  {
    id: 'stained-glass', signal: 'frontend', thresholds: [3, 15, 50], glyph: '[▦]',
    names: ['stained-glass window', 'mismatched stained-glass wall', 'tiny greenhouse of buttons'],
    why: (n) => `You worked on ${plural(n, 'frontend file')}. It likes looking at colors through things.`,
  },
  {
    id: 'vine-trellis', signal: 'javascript', thresholds: [3, 15, 50], glyph: '}{}',
    names: ['curly vine', 'vine trellis full of braces', 'callback jungle'],
    why: (n) => `You edited ${plural(n, 'JS/TS file')}. The vines keep nesting.`,
  },
  {
    id: 'gear-pile', signal: 'systems', thresholds: [3, 15, 50], glyph: '¤¤',
    names: ['pile of gears', 'humming gear tower', 'memory-safe burrow'],
    why: (n) => `You touched ${plural(n, 'systems file')} (Go/Rust/C). It hoards anything that clicks.`,
  },
  {
    id: 'tunnels', signal: 'shell', thresholds: [2, 10, 30], glyph: '(◯)',
    names: ['little tunnel', 'tunnel network', 'piped tunnel labyrinth'],
    why: (n) => `You wrote ${plural(n, 'shell script')}. It started digging to see where things go.`,
  },
  {
    id: 'mushroom-cabinet', signal: 'data', thresholds: [2, 10, 30], glyph: '⌂≡',
    names: ['mushroom-shaped filing cabinet', 'indexed mushroom cabinet', 'mycelial archive'],
    why: (n) => `You worked with ${plural(n, 'data/SQL file')}. It started sorting pebbles into drawers.`,
  },
  {
    id: 'bookshelf', signal: 'docs', thresholds: [2, 10, 30], glyph: '|||',
    names: ['wobbly bookshelf', 'bookshelf it pretends to read', 'reading nook'],
    why: (n) => `You updated ${plural(n, 'doc')}. It cannot read, but it is very supportive.`,
  },
  {
    id: 'shield-blanket', signal: 'tests', thresholds: [3, 20, 75], glyph: '◈◈',
    names: ['blanket with one shield', 'shield-stitched blanket', 'fortress quilt'],
    why: (n) => `${plural(n, 'test run or test file', 'test runs and test files')}. It feels safer now.`,
  },
  {
    id: 'snack-furnace', signal: 'builds', thresholds: [3, 20, 75], glyph: '[≈]',
    names: ['snack furnace', 'roaring snack furnace', 'build forge'],
    why: (n) => `You ran ${plural(n, 'build')}. It chewed through the wait and wanted a stove.`,
  },
  {
    id: 'compost', signal: 'logs', thresholds: [2, 10, 30], glyph: '.∴.',
    names: ['compost pile', 'compost with a blinking fern', 'bioluminescent log garden'],
    why: (n) => `You streamed logs ${plural(n, 'time')}. It pooped the whole time. Something is growing.`,
  },
  {
    id: 'repair-bench', signal: 'fixes', thresholds: [1, 8, 25], glyph: '╤╤',
    names: ['crooked repair bench', 'repair bench with tooth marks', 'mad-science workshop'],
    why: (n) => `A failing command passed again after you fixed it (${plural(n, 'time')}). It watched closely.`,
  },
  {
    id: 'magnifier', signal: 'debugging', thresholds: [1, 6, 20], glyph: 'o-',
    names: ['cracked magnifying glass', 'polished magnifier', 'bug observatory'],
    why: (n) => `You opened a debugger ${plural(n, 'time')}. It wants to see the bugs too.`,
  },
  {
    id: 'pantry', signal: 'installs', thresholds: [2, 12, 40], glyph: '▤▤',
    names: ['snack pantry', 'overstuffed pantry', 'dependency silo'],
    why: (n) => `You installed packages ${plural(n, 'time')}. It assumes these are groceries.`,
  },
  {
    id: 'crate-fort', signal: 'containers', thresholds: [2, 12, 40], glyph: '▣▣',
    names: ['shipping crate', 'crate fort', 'orchestrated crate city'],
    why: (n) => `You ran ${plural(n, 'container command')}. It likes boxes inside boxes.`,
  },
  {
    id: 'treasure-chest', signal: 'commits', thresholds: [3, 25, 100], glyph: '[$]',
    names: ['pebble stash', 'treasure chest', 'glittering hoard'],
    why: (n) => `You made ${plural(n, 'commit')}. Every one is a shiny pebble to it.`,
  },
];

export const SIGNAL_LABELS = {
  python: 'Python', frontend: 'frontend', javascript: 'JS/TS', systems: 'systems code',
  shell: 'shell scripts', data: 'data/SQL', docs: 'docs', tests: 'testing', builds: 'builds',
  logs: 'log watching', fixes: 'fixing things', debugging: 'debugging', installs: 'installing',
  containers: 'containers', commits: 'committing',
};

export function tierFor(item, total) {
  let tier = 0;
  for (const threshold of item.thresholds) if (total >= threshold) tier += 1;
  return tier;
}
