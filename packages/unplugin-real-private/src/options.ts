import type { RealPrivateFilter, RealPrivateMode, RealPrivateOptions, ResolvedRealPrivateOptions } from './types.js';

export const DEFAULT_MODE: RealPrivateMode = 'hash';

export function resolveOptions(options: RealPrivateOptions = {}): ResolvedRealPrivateOptions {
  const mode = options.mode ?? DEFAULT_MODE;
  if (mode !== 'hash') {
    throw new TypeError(`[unplugin-real-private] Invalid mode "${String(mode)}". Only "hash" is supported.`);
  }

  return {
    mode,
    filter: { include: options.include, exclude: options.exclude },
    silent: options.silent === true,
  };
}

/**
 * Minimal node-style matcher so the plugin does not depend on `@rollup/pluginutils`.
 *
 * Glob patterns (`src/**`, `*.ts`) keep their meaning, while a bare path segment
 * such as `src/utils` matches whenever it appears in the id.
 */
export function matchesFilter(id: string, pattern: RealPrivateFilter['include']): boolean {
  if (!pattern) {
    return false;
  }

  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  for (let i = 0; i < patterns.length; i++) {
    if (matchesPattern(id, patterns[i])) {
      return true;
    }
  }

  return false;
}

function matchesPattern(id: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) {
    pattern.lastIndex = 0;
    return pattern.test(id);
  }

  if (pattern === '') {
    return true;
  }

  if (pattern.startsWith('*') || pattern.includes('*')) {
    return toRegExp(pattern).test(id);
  }

  // A plain string without wildcards is treated as a path segment.
  return id.includes(pattern);
}

function toRegExp(glob: string): RegExp {
  const source = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // `**/` also matches zero directories, so `src/**/*.ts` covers `src/a.ts`.
    .replace(/\*\*\//g, '(?:[^/]*/)*')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*');

  return new RegExp(source);
}
