import type { Plugin } from 'rollup';
import ts from 'typescript';
import type { RollupDtsHidePrivateOptions } from './types/global.js';

export function hidePrivateDeclarationsForDts(options: RollupDtsHidePrivateOptions = {}): Plugin {
  const include = options.include ?? isDeclarationFile;

  return {
    name: 'rollup-plugin-typescript-privatify:dts-hide-private',
    transform(code, id) {
      if (!include(id)) {
        return null;
      }

      return {
        code: stripPrivateDeclarationsFromDts(code, id),
        map: null,
      };
    },
    renderChunk(code, chunk) {
      if (!include(chunk.fileName)) {
        return null;
      }

      return {
        code: stripPrivateDeclarationsFromDts(code, chunk.fileName),
        map: null,
      };
    },
  };
}

export function stripPrivateDeclarationsFromDts(code: string, fileName = 'index.d.ts'): string {
  const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const transformed = ts.transform(sourceFile, [createDeclarationPrivateStripTransformer()]);
  const nextSourceFile = transformed.transformed[0] as ts.SourceFile;
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const output = printer.printFile(nextSourceFile);
  transformed.dispose();
  return output;
}

function createDeclarationPrivateStripTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visitor: ts.Visitor = (node) => {
      if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
        const members = node.members.filter((member) => !isPrivateDeclarationMember(member));
        if (ts.isClassDeclaration(node)) {
          return context.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            members
          );
        }

        return context.factory.updateClassExpression(
          node,
          node.modifiers,
          node.name,
          node.typeParameters,
          node.heritageClauses,
          members
        );
      }

      return ts.visitEachChild(node, visitor, context);
    };

    return (sourceFile) => ts.visitNode(sourceFile, visitor) as ts.SourceFile;
  };
}

function isPrivateDeclarationMember(member: ts.ClassElement): boolean {
  if (hasPrivateModifier(member)) {
    return true;
  }

  if ('name' in member) {
    const nameNode = member.name;
    if (nameNode && ts.isPrivateIdentifier(nameNode)) {
      return true;
    }
  }

  return false;
}

function hasPrivateModifier(node: ts.Node): boolean {
  const modifiers = (node as ts.Node & { modifiers?: ts.NodeArray<ts.ModifierLike> }).modifiers;
  return Boolean(modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword));
}

function isDeclarationFile(id: string): boolean {
  return id.endsWith('.d.ts') || id.endsWith('.d.mts') || id.endsWith('.d.cts');
}
