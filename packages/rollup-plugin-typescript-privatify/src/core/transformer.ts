import ts from 'typescript';
import type { PrivatifyMode, RollupTypescriptPrivatifyOptions } from '../types/global.js';
import { transformClassToHash } from './hash.js';
import { transformClassToWeakMap } from './weakmap.js';

/**
 * Creates a TypeScript transformer that privatizes class members by transforming them into either WeakMap-based or hash-based private members.
 * ```typescript
 *   typescript({
 *    transformers: {
 *      before: [createPrivatifyTransformer(options)],
 *    },
 *  }),
 * ```
 */
export function createPrivatifyTransformer(
  options: RollupTypescriptPrivatifyOptions = {},
): ts.TransformerFactory<ts.SourceFile> {
  const mode = normalizeMode(options.mode);

  return (context) => {
    const visitor: ts.Visitor = (node) => {
      if (ts.isClassExpression(node)) {
        return node;
      }

      if (ts.isClassDeclaration(node)) {
        if (mode === 'hash') {
          return transformClassToHash(node, context);
        }

        return transformClassToWeakMap(node, context);
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return (sourceFile) => ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
}

function normalizeMode(mode: PrivatifyMode | undefined = 'weakmap'): PrivatifyMode {
  if (mode !== 'hash' && mode !== 'weakmap') {
    throw new TypeError(`Invalid mode: "${String(mode)}". Expected "hash" or "weakmap".`);
  }
  return mode;
}
