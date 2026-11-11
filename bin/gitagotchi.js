#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { appendEvent, loadState, readEventsSince, saveState } from '../src/state.js';
import { renderHabitat, renderJournal, renderNews, visit } from '../src/habitat.js';
import { face } from '../src/creature.js';

const HELP = `gitagotchi — your terminal's favorite pet

Usage:
  gitagotchi                  Visit the habitat (shows what's new and why)
  gitagotchi habitat          Same as above
  gitagotchi journal          Every item ever found, with the reason
  gitagotchi name <name>      Rename your creature
  gitagotchi scan [dir]       Feed it the files from your recent commits in a repo
  gitagotchi init <zsh|bash>  Print the shell hook (add to your rc file)
  gitagotchi prompt           Tiny prompt pet (used by the shell hook)

Setup:
  echo 'eval "$(gitagotchi init zsh)"' >> ~/.zshrc
`;

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function filesFromHead(cwd) {
  try {
    return git(cwd, ['diff-tree', '--no-commit-id', '--name-only', '-r', '--root', 'HEAD'])
      .split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function record(args) {
  const sep = args.indexOf('--');
  const flags = sep === -1 ? args : args.slice(0, sep);
  const cmd = sep === -1 ? '' : args.slice(sep + 1).join(' ').trim();
  const flag = (name) => { const i = flags.indexOf(name); return i === -1 ? undefined : flags[i + 1]; };
  if (!cmd || /^\s*gitagotchi\b/.test(cmd)) return;

  const exit = Number(flag('--exit') || 0);
  const cwd = flag('--cwd') || process.cwd();
  const event = { t: new Date().toISOString(), cmd, exit };
  if (exit === 0 && /\bgit\s+commit\b/.test(cmd)) event.files = filesFromHead(cwd);
  appendEvent(event);
}

function scan(dir = process.cwd()) {
  let files;
  try {
    const email = git(dir, ['config', 'user.email']).trim();
    files = git(dir, ['log', '-n', '50', `--author=${email}`, '--name-only', '--pretty=format:'])
      .split('\n').filter(Boolean);
  } catch {
    console.error(`Couldn't read git history in ${dir}.`);
    process.exitCode = 1;
    return;
  }
  appendEvent({ t: new Date().toISOString(), cmd: '', exit: 0, files });
  console.log(`Fed ${files.length} file touches from your recent commits. Visit the habitat to see what grew.`);
}

function habitat() {
  const state = loadState();
  const firstVisit = !state.lastVisit;
  const { events, offset } = readEventsSince(state.eventsOffset);
  const result = visit(state, events);
  result.state.eventsOffset = offset;
  saveState(result.state);

  if (firstVisit) {
    const c = result.state.creature;
    console.log(`An egg cracked. Meet ${c.name}: ${face(c)}`);
    console.log(`It has ${c.markings} and ${c.quirk}. Nobody else has this exact one.\n`);
  }
  console.log(renderNews(result.state, result.news, result.eventCount));
  console.log('');
  console.log(renderHabitat(result.state));
}

function prompt() {
  try {
    const state = loadState();
    if (!state.lastVisit) return process.stdout.write('🥚');
    const { events } = readEventsSince(state.eventsOffset);
    const last = events[events.length - 1];
    const mood = last && last.exit ? 'worried' : 'idle';
    const pending = events.length && visit(state, events).news.length ? '✦' : '';
    process.stdout.write(`${face(state.creature, mood)}${pending}`);
  } catch {
    // A broken pet must never break the prompt.
  }
}

function init(shell) {
  const zsh = `
_gitagotchi_preexec() { _gitagotchi_cmd="$1"; }
_gitagotchi_precmd() {
  local ec=$?
  if [[ -n "$_gitagotchi_cmd" ]]; then
    ( gitagotchi record --exit "$ec" --cwd "$PWD" -- "$_gitagotchi_cmd" >/dev/null 2>&1 & ) 2>/dev/null
    _gitagotchi_cmd=""
  fi
}
autoload -Uz add-zsh-hook
add-zsh-hook preexec _gitagotchi_preexec
add-zsh-hook precmd _gitagotchi_precmd
setopt prompt_subst
[[ "$PROMPT" == *gitagotchi* ]] || PROMPT='$(gitagotchi prompt) '"$PROMPT"
`;
  const bash = `
_gitagotchi_last=""
_gitagotchi_precmd() {
  local ec=$?
  local cmd
  cmd=$(HISTTIMEFORMAT= history 1 | sed -E 's/^ *[0-9]+ *//')
  if [[ -n "$cmd" && "$cmd" != "$_gitagotchi_last" ]]; then
    ( gitagotchi record --exit "$ec" --cwd "$PWD" -- "$cmd" >/dev/null 2>&1 & )
    _gitagotchi_last="$cmd"
  fi
}
[[ "$PROMPT_COMMAND" == *_gitagotchi_precmd* ]] || PROMPT_COMMAND="_gitagotchi_precmd\${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
[[ "$PS1" == *gitagotchi* ]] || PS1='$(gitagotchi prompt) '"$PS1"
`;
  const scripts = { zsh, bash };
  if (!scripts[shell]) {
    console.error('Usage: gitagotchi init <zsh|bash>');
    process.exitCode = 1;
    return;
  }
  process.stdout.write(scripts[shell].trimStart());
}

const [command = 'habitat', ...rest] = process.argv.slice(2);
switch (command) {
  case 'habitat': habitat(); break;
  case 'record': record(rest); break;
  case 'prompt': prompt(); break;
  case 'journal': console.log(renderJournal(loadState())); break;
  case 'scan': scan(rest[0]); break;
  case 'init': init(rest[0]); break;
  case 'name': {
    const name = rest.join(' ').trim();
    if (!name) { console.error('Usage: gitagotchi name <name>'); process.exitCode = 1; break; }
    const state = loadState();
    state.creature.name = name;
    saveState(state);
    console.log(`${face(state.creature)} ...${name}? ${name}. Yes. It likes that.`);
    break;
  }
  case '-h': case '--help': case 'help': console.log(HELP); break;
  default: console.error(`Unknown command: ${command}\n\n${HELP}`); process.exitCode = 1;
}
