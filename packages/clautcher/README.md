# clautcher

Switch Claude settings profiles by copying a named profile file onto `.claude/settings.json`.

## Commands

```sh
clautcher list
clautcher switch work
```

## Profile Layout

By default, `clautcher` reads from your home directory:

```text
~/.claude/
  settings.json
  .clautcher.json
  profiles/
    default.json
    work.json
    side-project.json
```

- `list` reads `~/.claude/profiles/*.json`
- `switch <name>` copies `~/.claude/profiles/<name>.json` to `~/.claude/settings.json`
- `.clautcher.json` stores the most recent active profile marker

Set `CLAUTCHER_CLAUDE_DIR` if you want to work against a different `.claude` directory.

## Install

```sh
pnpm add -g clautcher
```

## Development

```sh
pnpm --filter clautcher build
pnpm --filter clautcher test
```