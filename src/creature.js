import crypto from 'node:crypto';

const EYES = ['°', '•', 'ō', '◉', '˘', '⊙'];
const LEFT_HORNS = ['ᘛ', '⸌', '≺', 'ψ', '⌐'];
const RIGHT_HORNS = ['ᘚ', '⸍', '≻', 'ϟ', '¬'];
const MOUTHS = ['ᴥ', 'ω', '▿', 'ㅅ', 'ε'];
const SPOTS = ['freckles', 'stripes', 'one glowing spot', 'speckled scales', 'tiny star marks'];
const QUIRKS = [
  'hums when the fan spins up',
  'collects semicolons and hides them',
  'sleeps with one eye on the cursor',
  'licks warm laptops',
  'is suspicious of tabs (the whitespace kind)',
  'sneezes at merge conflicts',
];
const NAMES = ['Pip', 'Blorp', 'Zix', 'Mudge', 'Quill', 'Nub', 'Fennick', 'Glim'];

export function hatchCreature(seedInput) {
  const hash = crypto.createHash('sha256').update(seedInput).digest();
  const pick = (list, byte) => list[hash[byte] % list.length];
  return {
    seed: hash.toString('hex').slice(0, 16),
    name: pick(NAMES, 0),
    eyes: pick(EYES, 1),
    hornLeft: pick(LEFT_HORNS, 2),
    hornRight: pick(RIGHT_HORNS, 3),
    mouth: pick(MOUTHS, 4),
    markings: pick(SPOTS, 5),
    quirk: pick(QUIRKS, 6),
    hatchedAt: new Date().toISOString(),
  };
}

export function face(creature, mood = 'idle') {
  const eyes = mood === 'sleepy' ? '-' : mood === 'worried' ? 'ò' : creature.eyes;
  const eyeRight = mood === 'worried' ? 'ó' : eyes;
  return `${creature.hornLeft}(${eyes}${creature.mouth}${eyeRight})${creature.hornRight}`;
}

// The creature's favorite corner tracks whichever habit you lean on most.
export function favoriteSignal(totals) {
  let best = null;
  for (const [signal, count] of Object.entries(totals)) {
    if (!best || count > totals[best]) best = signal;
  }
  return best;
}
