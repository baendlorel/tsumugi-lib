import type { ApiInterface } from './types.js';

const base = `https://aigw.telecomjs.com/v1`;
// const base = `http://0.0.0.0:21110/v1`;
export const URLS = {
  chat: `${base}/chat/completions`,
  responses: `${base}/responses`,
  anthropic: `${base}/messages`,
  models: `${base}/models`,
};
export const DIVIDER = '='.repeat(50);

export const FLAGS: Record<string, ApiInterface> = {
  '--anthropic': 'anthropic',
  '--chat': 'chat',
  '--responses': 'responses',
};

export const FLAGS_HINT = Object.keys(FLAGS).join(' | ');

export const getElapsed = (start: number): string => {
  return (performance.now() - start).toFixed(3) + 'ms';
};

export const CLI = 'ttc';

export function errorExit(message?: string): never {
  message ??= `usage: ${CLI} models <key> 或 ${CLI} test <key> [${FLAGS_HINT}] [model_name]`;
  console.error(JSON.stringify({ error: message, version: 'v__VERSION__' }));
  process.exit(1);
}
