import readline from 'node:readline';
import type { ApiInterface } from './types.js';
import { errorExit, FLAGS, FLAGS_HINT } from './common.js';

export type Command =
  | { kind: 'help' }
  | { kind: 'interactive' }
  | { kind: 'models'; key: string }
  | { kind: 'test'; key: string; api: ApiInterface; model: string }
  | { kind: 'error'; message: string }
  | { kind: 'version' };

export type CommandType<K extends Command['kind']> = Extract<Command, { kind: K }>;

// 第一个一定是key，但第二第三个顺序不一定，可以调换
function toTest(key: string, b?: string, c?: string): Command {
  if (b === undefined) {
    errorExit('test命令至少需要key和模型名称两个参数');
  }

  let flag: string = '--chat';
  let model: string = c === undefined ? b : '';
  if (FLAGS[b]) {
    flag = b;
    if (c === undefined) {
      errorExit('test命令需要提供模型名称');
    }
    model = c;
  }
  if (FLAGS[c ?? '']) {
    flag = c as string;
    model = b;
  }

  if (!model) {
    errorExit('test命令需要提供模型名称');
  }

  const api = FLAGS[flag];
  if (api) {
    return { kind: 'test', key, api, model };
  }
  errorExit(`未知的接口类型: ${flag}, 可选值为: ${FLAGS_HINT}`);
}

export function parseArgs(argv: string[]): Command {
  if (argv.length === 0) return { kind: 'interactive' };
  const first = argv[0];

  if (first === '--version' || first === '-v') {
    return { kind: 'version' };
  }

  if (first === '--help' || first === '-h' || first === 'help') {
    return { kind: 'help' };
  }
  if (first === 'models') {
    if (argv[1] === undefined) {
      errorExit();
    }
    return { kind: 'models', key: argv[1] };
  }

  if (first === 'test') {
    return toTest(argv[1], argv[2], argv[3]);
  }

  errorExit();
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
