#!/usr/bin/env node

import { cctl } from '@shared/utils/color.js';

import { help } from './services/help.js';
import { interactiveUse } from './services/use.js';
import { version } from './services/version.js';

import { ClautcherError } from './common/index.js';
import { syncWin } from './services/sync.js';

async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  try {
    if (argv.length === 0) {
      await interactiveUse();
      return 0;
    }

    const [command] = argv;

    if (command === 'help' || command === '--help' || command === '-h') {
      help();
      return 0;
    }

    if (command === 'version' || command === '--version' || command === '-v') {
      version();
      return 0;
    }

    if (command === 'syncwin') {
      syncWin();
      return 0;
    }

    await interactiveUse();
    return 0;
  } catch (error) {
    if (error instanceof ClautcherError) {
      console.error(cctl.red + error.message + cctl.reset);
      if (error.type === 'UnknownCommand' || error.type === 'NotEnoughArguments') {
        help();
      }
    } else {
      console.error(error);
    }
    return 1;
  }
}

main();
