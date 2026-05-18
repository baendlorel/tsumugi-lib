export type CliCommand = { kind: 'help' } | { kind: 'list' } | { kind: 'switch'; profile: string };

export function parseArgv(argv: string[] = process.argv.slice(2)): CliCommand {
  if (argv.length === 0) {
    return { kind: 'help' };
  }

  const [command, ...rest] = argv;

  if (command === 'help' || command === '--help' || command === '-h') {
    return { kind: 'help' };
  }

  if (command === 'list') {
    if (rest.length > 0) {
      throw new Error('The list command does not accept extra arguments.');
    }
    return { kind: 'list' };
  }

  if (command === 'switch') {
    if (rest.length === 0) {
      throw new Error('The switch command requires a profile name.');
    }
    if (rest.length > 1) {
      throw new Error('The switch command accepts exactly one profile name.');
    }
    return { kind: 'switch', profile: rest[0] };
  }

  throw new Error(`Unknown command: ${command}`);
}

export function getHelpText(): string {
  return [
    'Usage:',
    '  clautcher list',
    '  clautcher switch <profile>',
    '',
    'Environment:',
    '  CLAUTCHER_CLAUDE_DIR   Override the target .claude directory',
  ].join('\n');
}
