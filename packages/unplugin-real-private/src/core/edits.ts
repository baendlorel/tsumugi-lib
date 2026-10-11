import type MagicString from 'magic-string';
import ts from 'typescript';
import type { EditSink } from './hash.js';

/**
 * Bridges the rewrite pass to MagicString. Every edit is a minimal source
 * range, so the untouched parts of the module keep their original text —
 * including comments, formatting, and the parts of a class that are never
 * converted (decorators, `abstract`, computed names, ...).
 */
export function createEditSink(sourceFile: ts.SourceFile, magicString: MagicString): EditSink {
  const text = sourceFile.getFullText();

  return {
    rename(node, newText) {
      magicString.overwrite(node.getStart(sourceFile), node.getEnd(), newText);
    },

    remove(node, trailingSpace) {
      const start = node.getStart(sourceFile);
      let end = node.getEnd();

      if (trailingSpace) {
        while (end < text.length && isWhitespace(text[end])) {
          end += 1;
        }
      }

      if (end > start) {
        magicString.remove(start, end);
      }
    },

    insert(position, newText) {
      magicString.appendLeft(position, newText);
    },
  };
}

function isWhitespace(character: string): boolean {
  return character === ' ' || character === '\t' || character === '\n' || character === '\r';
}
