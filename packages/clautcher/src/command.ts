export type CliCommand = { kind: 'help' | 'list' | 'switch' | 'version'; args: string[] };

export function parseArgv(argv: string[] = process.argv.slice(2)): CliCommand {
  if (argv.length === 0) {
    return { kind: 'help', args: [] };
  }

  const [command, ...rest] = argv;

  if (command === 'help' || command === '--help' || command === '-h') {
    return { kind: 'help', args: [] };
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    return { kind: 'version', args: [] };
  }

  if (command === 'list') {
    if (rest.length > 0) {
      throw new Error('The list command does not accept extra arguments.');
    }
    return { kind: 'list', args: [] };
  }

  if (command === 'switch') {
    if (rest.length === 0) {
      throw new Error('The switch command requires a profile name.');
    }
    if (rest.length > 1) {
      throw new Error('The switch command accepts exactly one profile name.');
    }
    return { kind: 'switch', args: rest };
  }

  throw new Error(`Unknown command: ${command}`);
}

export const HELP = [
  'Usage:',
  '  clautcher list',
  '  clautcher version|-v|--version',
  '  clautcher switch <profile>',
].join('\n');
