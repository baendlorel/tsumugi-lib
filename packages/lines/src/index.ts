#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import { cctl } from '@shared/utils/color.js';
import { loadConfig, getConfigPath } from './services/config.js';
import { countLinesInDirectory, formatOutput } from './services/counter.js';
import { help, version } from './services/help.js';

async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  try {
    const [arg1, arg2] = argv;

    // Handle -v flag (version)
    if (arg1 === '-v') {
      version();
      return 0;
    }

    // Handle -h flag (help)
    if (arg1 === '-h') {
      help();
      return 0;
    }

    // Handle -p flag (path)
    if (arg1 === '-p') {
      if (!arg2) {
        console.error(cctl.red + 'Error: Path required after -p' + cctl.reset);
        console.log('Use "lines -h" for help');
        return 1;
      }

      const targetPath = path.resolve(arg2);

      if (!fs.existsSync(targetPath)) {
        console.error(cctl.red + `Error: Path does not exist: ${targetPath}` + cctl.reset);
        return 1;
      }

      const config = loadConfig();
      const summary = countLinesInDirectory(targetPath, config);
      console.log(formatOutput(summary));
      return 0;
    }

    // Handle "lines ." command (current directory) - highest priority
    if (arg1 === '.') {
      const currentDir = process.cwd();
      const config = loadConfig();
      const summary = countLinesInDirectory(currentDir, config);
      console.log(formatOutput(summary));
      return 0;
    }

    // If no argument or unrecognized argument
    if (!arg1 || arg1.startsWith('-')) {
      console.error(cctl.red + 'Error: Invalid or missing argument' + cctl.reset);
      console.log('Use "lines -h" for help');
      return 1;
    }

    // Try to treat the argument as a path
    const targetPath = path.resolve(arg1);

    if (fs.existsSync(targetPath)) {
      const config = loadConfig();
      const summary = countLinesInDirectory(targetPath, config);
      console.log(formatOutput(summary));
      return 0;
    } else {
      console.error(cctl.red + `Error: Path does not exist: ${targetPath}` + cctl.reset);
      return 1;
    }
  } catch (error) {
    console.error(cctl.red + `Error: ${error instanceof Error ? error.message : String(error)}` + cctl.reset);
    return 1;
  }
}

main();
