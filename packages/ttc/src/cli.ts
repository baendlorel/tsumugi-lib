import readline from 'node:readline';

interface CliArgs {
  key: string | null;
  help: boolean;
}

export let verbose: boolean = false;

export function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { key: null, help: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--key' || arg === '-k') {
      if (i + 1 < args.length) {
        result.key = args[++i];
      }
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }

  verbose = args.includes('--verbose') || args.includes('-v');

  return result;
}

// ============ 交互式输入 ============
export function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function promptUser(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}
