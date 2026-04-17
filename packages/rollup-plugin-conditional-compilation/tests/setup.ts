import { readFileSync } from 'node:fs';
import { join } from 'node:path';
export const loadjs = (name: `case${number}.js`) =>
  readFileSync(join(import.meta.dirname, '..', '.mock', name), 'utf-8');
export const codeOf = (result: string | { code: string } | null): string => {
  if (result === null) {
    return '';
  }

  return typeof result === 'string' ? result : result.code;
};
