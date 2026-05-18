import { help } from './services/help.js';
import { list } from './services/list.js';
import { switcher } from './services/switch.js';
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
      list(state.ClaudeDir);
      return 0;
    }

    if (command === 'switch') {
      if (rest.length === 0) {
        throw new Error('The switch command requires a profile name.');
      }

      switcher(rest[0], state.ClaudeDir, state.SettingsFile);
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
