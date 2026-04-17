import { parse } from 'acorn';
import type * as acorn from 'acorn';

export function safeParse(code: string): acorn.Program | null {
  try {
    return parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch {
    return null;
  }
}
