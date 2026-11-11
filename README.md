# gitagotchi
your terminal's favorite pet

An odd little dinosaur/alien hybrid that lives in your prompt and furnishes its
habitat based on how you code. Write Python and it gets a heat lamp. Stream logs
and it poops into a compost pile that eventually sprouts a blinking fern. Fix a
failing command and a crooked repair bench appears. Over time, the habitat
becomes unmistakably yours.

## Install

```sh
npm install -g gitagotchi-dev    # once published; for now: npm install -g .
echo 'eval "$(gitagotchi init zsh)"' >> ~/.zshrc   # or: init bash >> ~/.bashrc
```

The hook records each command and its exit code in the background and puts a
tiny pet in your prompt. A `✦` next to it means something new is waiting.

## Usage

```sh
gitagotchi              # visit the habitat
gitagotchi journal      # every item found, and why
gitagotchi scan [dir]   # feed it the files from your recent commits in a repo
gitagotchi name Blorp   # rename your creature
```

Every visit opens with what changed since last time and why:

```text
WHILE YOU WERE OUT...

+ .∴. A compost pile appeared.
    why: You streamed logs 2 times. It pooped the whole time. Something is growing.

↑ [≈] The snack furnace became a roaring snack furnace.
    why: You ran 20 builds. It chewed through the wait and wanted a stove.

~ Pip moved its nest next to the shield-stitched blanket.
    why: You've leaned on testing more than anything else lately, so this is the cozy corner now.
```

## What it notices

| You're doing | It collects |
|---|---|
| Python / frontend / JS-TS / Go-Rust-C / shell / SQL / docs files | heat lamp, stained glass, vine trellis, gear pile, tunnels, mushroom cabinet, bookshelf |
| Running or writing tests | shield blanket |
| Builds | snack furnace |
| Streaming logs (`tail -f`, `docker logs`, …) | compost pile |
| Re-running a failed command until it passes | repair bench |
| Debuggers, package installs, containers, commits | magnifier, pantry, crate fort, treasure chest |

File types come from the files in your commits (`git commit` via the hook, or
`gitagotchi scan`). Items upgrade through three tiers instead of piling up.
Your creature's face, markings, quirk, and room layout are hatched from a unique
seed, so no two habitats look alike.

Nothing dies or gets sad if you take a break, and failures are never rewarded,
only recoveries. All data stays local in `~/.gitagotchi` (override with
`GITAGOTCHI_HOME`).

## Development

```sh
npm test
```

## License

[PolyForm Noncommercial 1.0.0](LICENSE.md). Free to use, modify, and share for
personal and other noncommercial purposes; commercial use is not permitted.
