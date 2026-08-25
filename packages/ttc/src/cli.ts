import readline from 'node:readline';
import type { ApiInterface } from './types.js';

export type Command =
  | { kind: 'help' }
  | { kind: 'interactive' }
  | { kind: 'models'; key: string }
  | { kind: 'test'; key: string; api: ApiInterface; model: string | null }
  | { kind: 'error'; message: string };

const FLAGS: Record<string, ApiInterface> = {
  '--anthropic': 'anthropic',
  '--chat': 'chat',
  '--response': 'responses',
};

const FLAGS_HINT = Object.keys(FLAGS).join(' | ');

function usageError(): never {
  console.error(`{"usage":"ttc models <key> 或 ttc test <key> [${FLAGS_HINT}] [model_name]"}`);
  process.exit(1);
}

function toTest(key: string, flag: string, model?: string): Command {
  const api = FLAGS[flag];
  if (api) return { kind: 'test', key, api, model: model ?? null };
  if (flag.startsWith('-')) return { kind: 'error', message: `应该使用 ${FLAGS_HINT}` };
  return { kind: 'test', key, api: 'chat', model: flag || null };
}

export function parseArgs(argv: string[]): Command {
  if (argv.length === 0) return { kind: 'interactive' };
  const first = argv[0];

  if (first === '--help' || first === '-h' || first === 'help') return { kind: 'help' };

  if (first === 'models') {
    if (!argv[1]) usageError();
    return { kind: 'models', key: argv[1] };
  }

  if (first === 'test') {
    if (!argv[1]) usageError();
    return toTest(argv[1], argv[2] ?? '', argv[3]);
  }

  usageError();
}

export function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function promptUser(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}
