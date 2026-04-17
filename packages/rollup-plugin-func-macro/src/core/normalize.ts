import type { FuncMacroOptions } from '../types/global.js';

export function normalize(options: Partial<FuncMacroOptions> | undefined): FuncMacroOptions {
  const raw = Object(options) as Partial<FuncMacroOptions>;
  const identifier = raw.identifier === undefined ? '__func__' : raw.identifier;
  const fileIdentifier = raw.fileIdentifier === undefined ? '__file__' : raw.fileIdentifier;
  const include = raw.include === undefined ? ['**/*.js', '**/*.ts'] : normalizePatterns(raw.include, 'include');
  const exclude = raw.exclude === undefined ? ['node_modules/**'] : normalizePatterns(raw.exclude, 'exclude');
  const fallback = raw.fallback === undefined ? (identifier ?? '__func__') : raw.fallback;
  const stringReplace = raw.stringReplace === undefined ? true : raw.stringReplace;

  // [FATAL]

  if (identifier !== null && (typeof identifier !== 'string' || !identifier)) {
    throw new TypeError('__NAME__: identifier must be a non-empty string or null');
  }

  if (fileIdentifier !== null && (typeof fileIdentifier !== 'string' || !fileIdentifier)) {
    throw new TypeError('__NAME__: fileIdentifier must be a non-empty string or null');
  }

  if (typeof fallback !== 'string') {
    throw new TypeError('__NAME__: fallback must be a string');
  }

  if (typeof stringReplace !== 'boolean') {
    throw new TypeError('__NAME__: stringReplace must be a boolean');
  }

  // [WARN]

  if (typeof identifier === 'string' && identifier.length < 4) {
    console.warn(
      `__NAME__: Warning: using a very short identifier('${identifier}') may lead to unexpected replacements.`,
    );
  }

  if (typeof fileIdentifier === 'string' && fileIdentifier.length < 4) {
    console.warn(
      `__NAME__: Warning: using a very short fileIdentifier('${fileIdentifier}') may lead to unexpected replacements.`,
    );
  }

  return {
    identifier,
    fileIdentifier,
    include,
    exclude,
    fallback,
    stringReplace,
  };
}

function normalizePatterns(input: string | string[], name: 'include' | 'exclude'): string[] {
  if (typeof input === 'string') {
    return [input];
  }

  if (!Array.isArray(input) || input.some((v) => typeof v !== 'string')) {
    throw new TypeError(`__NAME__: ${name} must be a string or string[]`);
  }

  return input;
}
