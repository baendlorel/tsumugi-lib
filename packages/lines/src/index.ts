#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import { cctl } from '../../_shared/utils/color.js';
import { loadConfig } from './services/config.js';
import { countLinesInDirectory, formatOutput } from './services/counter.js';
import { help, version } from './services/help.js';

function parseThreadCount(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  try {
    let verbose = false;
    let threads = 1;
    const args: string[] = [];

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];

      if (arg === '-v') {
        verbose = true;
        continue;
      }

      if (arg === '--threads') {
        const parsed = parseThreadCount(argv[i + 1]);
        if (parsed === null) {
          console.error(cctl.red + 'Error: --threads requires a positive integer' + cctl.reset);
          return 1;
        }
        threads = parsed;
        i++;
        continue;
      }

      args.push(arg);
    }

    const pathIndex = 0;

    // Check for -V flag (version)
    if (args[pathIndex] === '-V') {
      version();
      return 0;
    }

    // Handle -h flag (help)
    if (args[pathIndex] === '-h') {
      help();
      return 0;
    }

    // Handle "lines config suffix" command
    if (args[pathIndex] === 'config') {
      const arg2 = args[pathIndex + 1];
      if (arg2 === 'suffix') {
        const config = loadConfig();
        console.log(config.suffix.join(', '));
        return 0;
      }

      // Handle "lines config exclude" command
      if (arg2 === 'exclude') {
        const config = loadConfig();
        console.log(config.exclude.join('\n'));
        return 0;
      }

      console.log(
        [
          `You can use 'config suffix/exclude' to show config`,
          `${cctl.bold}Configuration:${cctl.reset}`,
          `  Config file: ~/.total-lines.json`,
          `  Config Format:`,
          `    {`,
          `      "suffix": [".ts", ".js", ...],`,
          `      "exclude": ["**/node_modules", ".git", ...]`,
          `    }`,
        ].join('\n'),
      );
      return 0;
    }

    // Handle -p flag (path)
    if (args[pathIndex] === '-p') {
      const arg2 = args[pathIndex + 1];
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
      const summary = await countLinesInDirectory(targetPath, config, { verbose, threads });
      console.log(formatOutput(summary, verbose));
      return 0;
    }

    // Handle "lines ." command (current directory) - highest priority
    if (args[pathIndex] === '.') {
      const currentDir = process.cwd();
      const config = loadConfig();
      const summary = await countLinesInDirectory(currentDir, config, { verbose, threads });
      console.log(formatOutput(summary, verbose));
      return 0;
    }

    // If no argument or unrecognized argument
    if (!args[pathIndex] || args[pathIndex].startsWith('-')) {
      console.error(cctl.red + 'Error: Invalid or missing argument' + cctl.reset);
      console.log('Use "lines -h" for help');
      return 1;
    }

    // Try to treat the argument as a path
    const targetPath = path.resolve(args[pathIndex]);

    if (fs.existsSync(targetPath)) {
      const config = loadConfig();
      const summary = await countLinesInDirectory(targetPath, config, { verbose, threads });
      console.log(formatOutput(summary, verbose));
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
