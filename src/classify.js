import path from 'node:path';

const LANGUAGE_BY_EXT = {
  '.py': 'python', '.ipynb': 'python',
  '.tsx': 'frontend', '.jsx': 'frontend', '.vue': 'frontend', '.svelte': 'frontend',
  '.css': 'frontend', '.scss': 'frontend', '.html': 'frontend',
  '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript', '.ts': 'javascript',
  '.go': 'systems', '.rs': 'systems', '.c': 'systems', '.h': 'systems', '.cpp': 'systems', '.zig': 'systems',
  '.sh': 'shell', '.bash': 'shell', '.zsh': 'shell', '.fish': 'shell',
  '.sql': 'data', '.prisma': 'data',
  '.md': 'docs', '.mdx': 'docs', '.rst': 'docs',
};

const TEST_PATH = /(^|\/)(tests?|__tests__|spec)\/|[._-](test|spec)\.[a-z]+$|(^|\/)test_[^/]*\.py$|_test\.(go|py)$/i;

export function classifyFile(file) {
  const signals = [];
  if (TEST_PATH.test(file)) signals.push('tests');
  const lang = LANGUAGE_BY_EXT[path.extname(file).toLowerCase()];
  if (lang) signals.push(lang);
  return signals;
}

const COMMAND_RULES = [
  ['tests', /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bpytest\b|\bgo\s+test\b|\bcargo\s+test\b|\b(jest|vitest|rspec|mocha)\b|\bmake\s+test\b|\bnode\s+--test\b/],
  ['builds', /\b(npm|pnpm|yarn|bun)\s+run\s+build\b|\bgo\s+build\b|\bcargo\s+build\b|^\s*make(\s|$)|\btsc\b|\bvite\s+build\b|\bwebpack\b|\b(gradle|mvn)\b/],
  ['logs', /\btail\s+-\S*[fF]|\b(docker|kubectl|heroku|vercel|fly)\b.*\blogs\b|\bjournalctl\b|\bstern\b|\blogcat\b/],
  ['installs', /\b(npm|pnpm|yarn|bun)\s+(i|install|add)\b|\bpip3?\s+install\b|\b(brew|apt|apt-get)\s+install\b|\bcargo\s+add\b|\bgo\s+get\b|\bpoetry\s+add\b|\buv\s+(add|pip)\b/],
  ['containers', /^\s*(sudo\s+)?(docker|podman|kubectl|helm)\b/],
  ['debugging', /\b(gdb|lldb|pdb|dlv)\b|--inspect\b/],
  ['commits', /\bgit\s+commit\b/],
];

export function classifyCommand(cmd) {
  return COMMAND_RULES.filter(([, re]) => re.test(cmd)).map(([signal]) => signal);
}

export function normalizeCommand(cmd) {
  return cmd.trim().replace(/\s+/g, ' ');
}

// Turns raw events into signal counts. A command that failed and later succeeds
// counts as a "fix", so the pet celebrates recovery without rewarding failure.
export function tallyEvents(events, lastFailed = null) {
  const counts = {};
  const bump = (signal) => { counts[signal] = (counts[signal] || 0) + 1; };
  let pendingFailure = lastFailed;

  for (const event of events) {
    const cmd = normalizeCommand(event.cmd || '');
    for (const signal of classifyCommand(cmd)) bump(signal);
    for (const file of event.files || []) {
      for (const signal of classifyFile(file)) bump(signal);
    }
    if (event.exit && Number(event.exit) !== 0) {
      pendingFailure = cmd;
    } else if (pendingFailure && cmd === pendingFailure) {
      bump('fixes');
      pendingFailure = null;
    }
  }
  return { counts, lastFailed: pendingFailure };
}
