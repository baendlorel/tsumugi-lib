import {
  parse,
  Node as AcornNode,
  Identifier as AcornIdentifier,
  Literal,
  PrivateIdentifier,
  TemplateLiteral,
} from 'acorn';
import { simple } from 'acorn-walk';
import type { NameGetter } from '../types/private.js';

interface Replacement {
  start: number;
  end: number;
  replacement: string;
}

interface IdentifierTarget {
  identifier: string;
  nameGetter: NameGetter;
}

interface ReplaceBatchOptions {
  code: string;
  targets: IdentifierTarget[];
  fallback: string;
  stringReplace: boolean;
}

/**
 * Replace identifiers in the code with function names
 */
export function replaceIdentifiers(opts: {
  code: string;
  identifier: string;
  nameGetter: NameGetter;
  fallback: string;
  stringReplace: boolean;
}): string | null {
  return replaceIdentifiersBatch({
    code: opts.code,
    targets: [{ identifier: opts.identifier, nameGetter: opts.nameGetter }],
    fallback: opts.fallback,
    stringReplace: opts.stringReplace,
  });
}

export function replaceIdentifiersBatch(opts: ReplaceBatchOptions): string | null {
  const targets = normalizeTargets(opts.targets);
  if (targets.length === 0) {
    return null;
  }

  const ast = silentParse(opts.code);
  if (!ast) {
    return opts.code;
  }

  const replacements = walk(ast, {
    code: opts.code,
    targets,
    fallback: opts.fallback,
    stringReplace: opts.stringReplace,
  });

  if (replacements.length === 0) {
    return null;
  }

  return applyReplacements(opts.code, replacements);
}

function silentParse(code: string): AcornNode | null {
  try {
    return parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    });
  } catch (error) {
    console.warn('__NAME__:', error);
    return null;
  }
}

function normalizeTargets(targets: IdentifierTarget[]): IdentifierTarget[] {
  const seen = new Set<string>();
  const normalized: IdentifierTarget[] = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    if (!target.identifier || seen.has(target.identifier)) {
      continue;
    }
    seen.add(target.identifier);
    normalized.push(target);
  }
  return normalized;
}

function applyReplacements(code: string, replacements: Replacement[]): string {
  const sorted = [...replacements].sort((a, b) => a.start - b.start);
  const chunks: string[] = [];
  let cursor = 0;

  for (let i = 0; i < sorted.length; i++) {
    const replacement = sorted[i];
    if (replacement.start < cursor) {
      continue;
    }
    chunks.push(code.slice(cursor, replacement.start), replacement.replacement);
    cursor = replacement.end;
  }

  chunks.push(code.slice(cursor));
  return chunks.join('');
}

function walk(
  ast: AcornNode,
  opts: {
    code: string;
    targets: IdentifierTarget[];
    fallback: string;
    stringReplace: boolean;
  },
) {
  const { code, targets, fallback, stringReplace } = opts;

  const replacements: Replacement[] = [];
  const replacementKeys = new Set<string>();
  const targetMap = new Map<string, IdentifierTarget>(targets.map((target) => [target.identifier, target]));
  const nameCache = new Map<string, string>();

  /**
   * Push a new replacement if it doesn't already exist
   */
  const add = (o: { start: number; end: number; replacement: string }) => {
    const { start, end, replacement } = o;
    const key = `${start}:${end}:${replacement}`;
    if (replacementKeys.has(key)) {
      return;
    }
    replacementKeys.add(key);
    replacements.push({ start, end, replacement });
  };

  const getName = (target: IdentifierTarget, position: number) => {
    const key = `${target.identifier}:${position}`;
    const cached = nameCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const name = target.nameGetter(code, ast, position, fallback);
    nameCache.set(key, name);
    return name;
  };

  const replaceValue = (value: string, position: number): string | null => {
    let output = value;
    let changed = false;
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!output.includes(target.identifier)) {
        continue;
      }
      output = output.replaceAll(target.identifier, getName(target, position));
      changed = true;
    }
    return changed ? output : null;
  };

  const isInTemplateLiteralExpression = (node: PrivateIdentifier | AcornIdentifier) => {
    return code[node.start - 2] === '$' && code[node.start - 1] === '{' && code[node.end] === '}';
  };

  // Find all identifier nodes that match our target
  simple(ast, {
    Identifier(node: PrivateIdentifier | AcornIdentifier) {
      const target = targetMap.get(node.name);
      if (!target) {
        return;
      }

      const functionName = getName(target, node.start);

      // & AcornIdentifier might be in a template literal expression
      if (isInTemplateLiteralExpression(node)) {
        add({
          start: node.start - 2, // Account for ${
          end: node.end + 1, // Account for }
          replacement: functionName,
        });
      } else {
        add({
          start: node.start,
          end: node.end,
          replacement: JSON.stringify(functionName),
        });
      }
    },

    // Handle string literals if stringReplace is enabled
    Literal(node: Literal) {
      if (!stringReplace || typeof node.value !== 'string') {
        return;
      }

      const newValue = replaceValue(node.value, node.start);
      if (newValue === null) {
        return;
      }

      add({
        start: node.start,
        end: node.end,
        replacement: JSON.stringify(newValue),
      });
    },

    // Handle template literals if stringReplace is enabled
    TemplateLiteral(node: TemplateLiteral) {
      if (!stringReplace) {
        return;
      }

      for (let i = 0; i < node.quasis.length; i++) {
        const quasi = node.quasis[i];
        const newRawValue = replaceValue(quasi.value.raw, quasi.start);
        if (newRawValue === null) {
          continue;
        }
        add({
          start: quasi.start,
          end: quasi.end,
          replacement: newRawValue,
        });
      }
    },
  });

  return replacements;
}
