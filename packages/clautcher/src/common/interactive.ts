import { emitKeypressEvents } from 'node:readline';

import { cctl } from '../../../_shared/utils/color.js';

import { getList } from '../services/list.js';
import { use } from '../services/use.js';
import { settings } from './index.js';

interface InteractiveOption {
  name?: string;
  label: string;
}

export async function interactiveUse(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return;
  }

  const profiles = getList();
  const activeProfile = settings.getActivatedProfileName();
  const options: InteractiveOption[] = activeProfile
    ? profiles.map((profile) => ({
        name: profile.name,
        label: profile.name,
      }))
    : [
        {
          label: `${cctl.dim}None${cctl.reset}`,
        },
        ...profiles.map((profile) => ({
          name: profile.name,
          label: profile.name,
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
      `${cctl.bold}${cctl.underline}Select a profile:${cctl.reset}`,
      `${cctl.dim}Use Up/Down to choose, Enter to confirm, Esc or q to quit.${cctl.reset}`,
      ...options.map((option, index) => {
        const pointer = index === selectedIndex ? `${cctl.brightGreen}>${cctl.reset}` : ' ';
        return `${pointer} ${option.label}`;
      }),
    ];

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
    if (selected?.name) {
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
