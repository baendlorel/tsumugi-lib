# Clautcher 1.0.x Release! 🎉🎉

[![npm version](https://img.shields.io/npm/v/clautcher.svg)](https://www.npmjs.com/package/clautcher) [![npm downloads](http://img.shields.io/npm/dm/clautcher.svg)](https://npmcharts.com/compare/clautcher,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/clautcher?utm_source=github.com&utm_medium=referral&utm_content=Borewit/clautcher&utm_campaign=Badge_Grade)

Switch Claude settings profiles by copying a named `settings.<name>.json` onto `settings.json`.

## Install

```sh
npm i -g clautcher
```

## Steps ✨

1. Enter .claude directory and create a settings file named `settings.<name>.json` for each profile you want to have. For example:

```sh
cd ~/.claude
cp settings.json settings.deepseek.json
cp settings.json settings.claude.json
```

2. Just run `clautcher` to enter the interactive settings file picker.
```sh
clautcher
```
Then you will see this:

```sh
Select a profile:
Use Up/Down to choose, Enter to confirm, Esc or q to quit.
  deepseek
> claude
  other
```
## Need Common Settings?

You can create `settings.base.json` as a common base profile. It will be merged with the selected profile before copying to `settings.json`. This is useful when you want to share some common settings across different profiles.

## Trivia

- The name "Clautcher" is a portmanteau of "Claude" and "Switcher", indicating its purpose as a tool for switching between different Claude settings profiles. Since "claude-switcher", "claude-code-switcher", "claude-switch" ... are all taken, I had to come up with a more creative name.
- It is designed to be simple.
- Some names have their own color in the interactive menu.

## License
MIT License