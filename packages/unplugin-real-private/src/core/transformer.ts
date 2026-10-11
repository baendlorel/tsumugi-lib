import type MagicString from 'magic-string';
import ts from 'typescript';
import { findHashCollisions } from './collision.js';
import type { ClassLikeNode } from './class-utils.js';
import { createEditSink } from './edits.js';
import { rewriteClassToHash } from './hash.js';
import type { ResolvedRealPrivateOptions } from '../types.js';

export interface TransformDiagnostic {
  category: ts.DiagnosticCategory;
  message: string;
  start: number;
  line: number;
  column: number;
}

export interface TransformResult {
  code: string;
  map: ReturnType<MagicString['generateMap']>;
  diagnostics: TransformDiagnostic[];
}

/**
 * Converts every `private` member of the module into an ECMAScript private
 * member, as a set of minimal text edits.
 *
 * Classes are visited pre-order, so an outer class is rewritten with its own
 * private names while a nested class keeps its independent scope.
 */
export function transformModule(
  sourceFile: ts.SourceFile,
  options: ResolvedRealPrivateOptions,
  magicString: MagicString,
): TransformResult {
  const diagnostics: TransformDiagnostic[] = [];
  const sink = createEditSink(sourceFile, magicString);

  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      rewriteClassToHash(node, {
        sink,
        onCollision(collisions, classNode) {
          for (let i = 0; i < collisions.length; i++) {
            diagnostics.push(createCollisionDiagnostic(sourceFile, collisions[i], classNode, options.silent));
          }
        },
      });

      // Nested classes keep their own scope and are rewritten on their own
      // visit, which never overlaps the outer class' edits.
      ts.forEachChild(node, visit);
      return;
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return {
    code: magicString.toString(),
    map: magicString.generateMap({ source: sourceFile.fileName, hires: true }),
    diagnostics,
  };
}

function createCollisionDiagnostic(
  sourceFile: ts.SourceFile,
  collision: { name: string; start: number },
  classNode: ClassLikeNode,
  silent: boolean,
): TransformDiagnostic {
  const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, collision.start);
  const className = describeClass(classNode);

  return {
    category: silent ? ts.DiagnosticCategory.Warning : ts.DiagnosticCategory.Error,
    start: collision.start,
    line: line + 1,
    column: character + 1,
    message: [
      `Cannot convert "private ${collision.name}" to "#${collision.name}": the class already declares a "#${collision.name}" member.`,
      `A class can only declare one "#${collision.name}" private name, and the converted member would also override what "#${collision.name}" holds today.`,
      `Rename one of them, or exclude this module. (class ${className})`,
    ].join('\n'),
  };
}

function describeClass(node: ClassLikeNode): string {
  return node.name?.text ?? '<anonymous class>';
}

export { findHashCollisions };
