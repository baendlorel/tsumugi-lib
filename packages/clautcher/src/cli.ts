#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { HELP, parseArgv } from './command.js';
import { listProfiles, resolveClaudePaths, switchProfile } from './service.js';

export function runCli(argv: string[] = process.argv.slice(2)): number {
  try {
    const command = parseArgv(argv);

    if (command.kind === 'help') {
      console.log(HELP);
      return 0;
    }

    if (command.kind === 'list') {
      const paths = resolveClaudePaths();
      const profiles = listProfiles(paths.claudeDir);

      if (profiles.length === 0) {
        console.log(`No settings.<profileName>.json found in ${paths.claudeDir}`);
        return 0;
      }

      for (const profile of profiles) {
        console.log(`${profile.isActive ? '*' : ' '} ${profile.name}`);
      }

      return 0;
    }

    const settingsFile = switchProfile(command.args[0]);
    console.log(`Switched Claude settings to ${settingsFile.name}`);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('');
    console.error(HELP);
    return 1;
  }
}

process.exitCode = runCli();
