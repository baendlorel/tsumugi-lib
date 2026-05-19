# clautcher

Switch Claude settings profiles by copying a named profile file onto `.claude/settings.json`.

## Commands

```sh
clautcher
clautcher list
clautcher use work
```

Running `clautcher` without a subcommand opens an interactive picker. Use the Up/Down keys to choose a profile and press Enter to switch to it.
## Install

```sh
pnpm add -g clautcher
```

## Development

```sh
pnpm --filter clautcher build
pnpm --filter clautcher test
```