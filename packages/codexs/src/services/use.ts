import { writeFileSync } from 'node:fs';
import { emitKeypressEvents } from 'node:readline';

import { cctl } from '@shared/utils/color.js';
import { beautifyLLMName, ClautcherError, settings } from '../common/index.js';
import { getList } from '../services/list.js';
import { help } from './help.js';

export function use(name: string) {
  const files = getList();
  const file = files.find((p) => p.name === name);

  if (!file) {
    throw new ClautcherError(`Settings File not found: settings.${name}.json`, 'SettingsFileNotFound');
  }

  const content = Object.assign({}, settings.loadBase(), settings.load(file.filePath), {
    clautcher_activated_settings: name,
  });

  writeFileSync(settings.FilePath, JSON.stringify(content, null, 2));

  console.log(`Switched to settings: ${cctl.brightGreen}${cctl.bold}${file.fileName}${cctl.reset}`);
}

interface InteractiveOption {
  name?: string;
  label: string;
  isHelp?: boolean;
  isActive?: boolean;
}

export async function interactiveUse(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return;
  }

  const profiles = getList();
  if (profiles.length === 0) {
    help({ noProfilesYet: true });
    return;
  }

  const activeProfile = settings.getActivatedProfileName();
  const options: InteractiveOption[] = [
    {
      label: `${cctl.bold}How to use?${cctl.reset}`,
      isHelp: true,
    },
    ...profiles.map((profile) => ({
      name: profile.name,
      label: beautifyLLMName(profile.name),
      isActive: profile.isActive,
    })),
  ];

  if (options.length === 0) {
    return;
  }

  let selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.name === activeProfile),
  );
  let frameLineCount = 0;
  let resolveSelection: (() => void) | undefined;

  const render = () => {
    const lines = [
      `${cctl.claude + cctl.bold}Clautcher __VERSION__${cctl.reset} - ${cctl.bold}${cctl.underline}Select a profile:${cctl.reset}`,
      settings.baseExists() ? `${cctl.dim}settings.base.json detected! It will be merged.${cctl.reset}` : null,
      `${cctl.dim}Use Up/Down to choose, Enter to confirm, Esc or q to quit.${cctl.reset}`,
      ...options.map((option, index) => {
        const pointer = index === selectedIndex ? `${cctl.brightGreen}>${cctl.reset}` : ' ';
        return `${pointer} ${option.isActive ? `${cctl.brightGreen}*${cctl.reset}` : ''}${option.label}`;
      }),
    ].filter((line): line is string => line !== null);

    if (frameLineCount > 0) {
      process.stdout.write(`\x1b[${frameLineCount}F`);
    }
    process.stdout.write('\x1b[J');
    process.stdout.write(`${lines.join('\n')}\n`);
    frameLineCount = lines.length;
  };

  const cleanup = () => {
    process.stdin.off('keypress', onKeypress);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
    if (frameLineCount > 0) {
      process.stdout.write(`\x1b[${frameLineCount}F`);
      process.stdout.write('\x1b[J');
    }
  };

  const finish = (selected?: InteractiveOption) => {
    cleanup();
    if (selected?.isHelp) {
      help();
    } else if (selected?.name) {
      use(selected.name);
    }
    resolveSelection?.();
  };

  const onKeypress = (_input: string, key: { ctrl?: boolean; name?: string }) => {
    if (key.ctrl && key.name === 'c') {
      cleanup();
      process.exitCode = 130;
      resolveSelection?.();
      return;
    }

    if (key.name === 'up') {
      selectedIndex = (selectedIndex - 1 + options.length) % options.length;
      render();
      return;
    }

    if (key.name === 'down') {
      selectedIndex = (selectedIndex + 1) % options.length;
      render();
      return;
    }

    if (key.name === 'return' || key.name === 'enter') {
      finish(options[selectedIndex]);
      return;
    }

    if (key.name === 'escape' || key.name === 'q') {
      cleanup();
      resolveSelection?.();
    }
  };

  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('keypress', onKeypress);
  render();

  await new Promise<void>((resolve) => {
    resolveSelection = resolve;
  });
}

settings.HelpList.push({
  command: 'use <name>',
  description: `Overwrite settings.json with settings.<name>.json. If ${cctl.underline}settings.base.json${cctl.reset} exists, it will be merged.`,
});
