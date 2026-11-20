import type { ApiInterface } from './types.js';

const base = process.env.TTC_BASE_URL || `https://aigw.telecomjs.com/v1`;
export const URLS: Record<ApiInterface | 'models', string> = {
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

export const getElapsed = (start: number): number => Number((performance.now() - start).toFixed(3));

export const CLI = 'ttc';

export function errorExit(message?: string): never {
  message ??= `usage: ${CLI} models <key> 或 ${CLI} test <key> [${FLAGS_HINT}] [model_name]`;
  console.error(JSON.stringify({ error: message, version: 'v__VERSION__' }));
  process.exit(1);
}

/**
 * 把 usage 对象压平成 `key: value` 片段。
 * 嵌套对象（如 prompt_tokens_details）展开为 `key.subkey: value`，
 * 避免直接字符串化出 `[object Object]`。
 */
export function flattenUsage(usage: Record<string, unknown>, prefix = ''): string[] {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(usage)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') {
      parts.push(...flattenUsage(v as Record<string, unknown>, key));
    } else if (v !== undefined && v !== null) {
      parts.push(`${key}: ${v}`);
    }
  }
  return parts;
}
