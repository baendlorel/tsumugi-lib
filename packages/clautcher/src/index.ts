import { help } from './services/help.js';
import { list } from './services/list.js';
import { switchSettings } from './services/switch.js';
import { version } from './services/version.js';
import { state } from './state.js';

function main(argv: string[] = process.argv): number {
  try {
    if (argv.length === 0) {
      help();
      return 0;
    }

    const [command, ...rest] = argv;

    if (command === 'help' || command === '--help' || command === '-h') {
      help();
      return 0;
    }

    if (command === 'version' || command === '--version' || command === '-v') {
      version();
      return 0;
    }

    if (command === 'list') {
      list(state.claudeDir);
      return 0;
    }

    if (command === 'switch') {
      if (rest.length === 0) {
        throw new Error('The switch command requires a profile name.');
      }

      switchSettings(rest[0], state.claudeDir, state.settingsFile);
      return 0;
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('');
    help();
    return 1;
  }
}

process.exitCode = main();
