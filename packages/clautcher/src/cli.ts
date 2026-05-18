#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import { getHelpText, parseArgv } from './command.js';
import { listProfiles, resolveClaudePaths, switchProfile } from './service.js';

export function runCli(argv: string[] = process.argv.slice(2)): number {
  try {
    const command = parseArgv(argv);

    if (command.kind === 'help') {
      console.log(getHelpText());
      return 0;
    }

    if (command.kind === 'list') {
      const paths = resolveClaudePaths();
      const profiles = listProfiles(paths.claudeDir);

      if (profiles.length === 0) {
        console.log(`No profiles found in ${paths.profilesDir}`);
        return 0;
      }

      for (const profile of profiles) {
        console.log(`${profile.isActive ? '*' : ' '} ${profile.name}`);
      }

      return 0;
    }

    const settingsFile = switchProfile(command.profile);
    console.log(`Switched Claude settings to profile: ${command.profile}`);
    console.log(`Updated file: ${settingsFile}`);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('');
    console.error(getHelpText());
    return 1;
  }
}

const isDirectExecution = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  process.exitCode = runCli();
}
