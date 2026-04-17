import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type * as acorn from 'acorn';
import { createFunctionCandidate } from './candidates.js';
import { safeParse } from './parse.js';
import type { FunctionCandidate } from './types.js';

const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs'];
const exportCandidateCache = new Map<string, Map<string, FunctionCandidate>>();

export function collectImportedCandidates(
  ast: acorn.Program,
  importerId: string,
  expectedNames: string[],
): Map<string, FunctionCandidate> {
  const expected = new Set(expectedNames);
  const imported = new Map<string, FunctionCandidate>();
  const body = Array.isArray(ast.body) ? ast.body : [];

  for (let i = 0; i < body.length; i++) {
    const statement = body[i];
    if (statement.type !== 'ImportDeclaration' || typeof statement.source.value !== 'string') {
      continue;
    }

    const source = statement.source.value;
    const resolvedPath = resolveImportPath(importerId, source);
    if (!resolvedPath) {
      continue;
    }

    const exportedCandidates = loadExportCandidates(resolvedPath);
    if (exportedCandidates.size === 0) {
      continue;
    }

    for (let j = 0; j < statement.specifiers.length; j++) {
      const specifier = statement.specifiers[j];

      if (specifier.type === 'ImportSpecifier') {
        const localName = specifier.local.name;
        if (!expected.has(localName)) {
          continue;
        }

        const importedName =
          specifier.imported.type === 'Identifier' ? specifier.imported.name : String(specifier.imported.value);
        const candidate = exportedCandidates.get(importedName);
        if (!candidate) {
          continue;
        }

        imported.set(localName, { ...candidate, name: localName, declarationStart: undefined, declarationEnd: undefined });
        continue;
      }

      if (specifier.type === 'ImportDefaultSpecifier') {
        const localName = specifier.local.name;
        if (!expected.has(localName)) {
          continue;
        }

        const candidate = exportedCandidates.get('default');
        if (!candidate) {
          continue;
        }

        imported.set(localName, { ...candidate, name: localName, declarationStart: undefined, declarationEnd: undefined });
      }
    }
  }

  return imported;
}

function loadExportCandidates(modulePath: string): Map<string, FunctionCandidate> {
  const cached = exportCandidateCache.get(modulePath);
  if (cached) {
    return cached;
  }

  let sourceCode = '';
  try {
    sourceCode = readFileSync(modulePath, 'utf8');
  } catch {
    const empty = new Map<string, FunctionCandidate>();
    exportCandidateCache.set(modulePath, empty);
    return empty;
  }

  const ast = safeParse(sourceCode);
  if (!ast) {
    const empty = new Map<string, FunctionCandidate>();
    exportCandidateCache.set(modulePath, empty);
    return empty;
  }

  const declared = collectDeclaredCandidates(ast, sourceCode);
  const exported = collectExportedCandidates(ast, sourceCode, declared);
  exportCandidateCache.set(modulePath, exported);
  return exported;
}

function collectDeclaredCandidates(ast: acorn.Program, sourceCode: string): Map<string, FunctionCandidate> {
  const declared = new Map<string, FunctionCandidate>();
  const body = Array.isArray(ast.body) ? ast.body : [];

  for (let i = 0; i < body.length; i++) {
    const statement = body[i];

    if (statement.type === 'FunctionDeclaration' && statement.id?.name) {
      const candidate = createFunctionCandidate(statement.id.name, statement, sourceCode);
      if (candidate) {
        declared.set(statement.id.name, candidate);
      }
      continue;
    }

    if (statement.type !== 'VariableDeclaration' || statement.kind !== 'const') {
      continue;
    }

    const declarations = Array.isArray(statement.declarations) ? statement.declarations : [];
    for (let j = 0; j < declarations.length; j++) {
      const declaration = declarations[j];
      if (declaration.id?.type !== 'Identifier') {
        continue;
      }

      const init = declaration.init;
      if (!init || (init.type !== 'FunctionExpression' && init.type !== 'ArrowFunctionExpression')) {
        continue;
      }

      const candidate = createFunctionCandidate(declaration.id.name, init, sourceCode);
      if (candidate) {
        declared.set(declaration.id.name, candidate);
      }
    }
  }

  return declared;
}

function collectExportedCandidates(
  ast: acorn.Program,
  sourceCode: string,
  declared: Map<string, FunctionCandidate>,
): Map<string, FunctionCandidate> {
  const exported = new Map<string, FunctionCandidate>();
  const body = Array.isArray(ast.body) ? ast.body : [];

  for (let i = 0; i < body.length; i++) {
    const statement = body[i];

    if (statement.type === 'ExportNamedDeclaration') {
      if (statement.declaration) {
        if (statement.declaration.type === 'FunctionDeclaration' && statement.declaration.id?.name) {
          const name = statement.declaration.id.name;
          const candidate = declared.get(name) ?? createFunctionCandidate(name, statement.declaration, sourceCode);
          if (candidate) {
            exported.set(name, { ...candidate, name });
          }
          continue;
        }

        if (statement.declaration.type === 'VariableDeclaration' && statement.declaration.kind === 'const') {
          const declarations = Array.isArray(statement.declaration.declarations) ? statement.declaration.declarations : [];
          for (let j = 0; j < declarations.length; j++) {
            const declaration = declarations[j];
            if (declaration.id?.type !== 'Identifier') {
              continue;
            }
            const name = declaration.id.name;
            const candidate = declared.get(name);
            if (candidate) {
              exported.set(name, { ...candidate, name });
            }
          }
          continue;
        }
      }

      if (statement.source) {
        continue;
      }

      const specifiers = Array.isArray(statement.specifiers) ? statement.specifiers : [];
      for (let j = 0; j < specifiers.length; j++) {
        const specifier = specifiers[j];
        if (specifier.type !== 'ExportSpecifier') {
          continue;
        }

        const localName = toExportName(specifier.local);
        const exportName = toExportName(specifier.exported);
        if (!localName || !exportName) {
          continue;
        }

        const candidate = declared.get(localName);
        if (!candidate) {
          continue;
        }

        exported.set(exportName, { ...candidate, name: exportName });
      }

      continue;
    }

    if (statement.type === 'ExportDefaultDeclaration') {
      const declaration = statement.declaration;
      if (declaration.type === 'FunctionDeclaration' || declaration.type === 'FunctionExpression' || declaration.type === 'ArrowFunctionExpression') {
        const candidate = createFunctionCandidate('default', declaration, sourceCode);
        if (candidate) {
          exported.set('default', { ...candidate, name: 'default' });
        }
        continue;
      }

      if (declaration.type === 'Identifier') {
        const candidate = declared.get(declaration.name);
        if (candidate) {
          exported.set('default', { ...candidate, name: 'default' });
        }
      }
    }
  }

  return exported;
}

function resolveImportPath(importerId: string, source: string): string | null {
  if (!source.startsWith('.') && !source.startsWith('/')) {
    return null;
  }

  const importerDir = path.dirname(importerId);
  const basePath = path.resolve(importerDir, source);

  const direct = tryFile(basePath);
  if (direct) {
    return direct;
  }

  for (let i = 0; i < SUPPORTED_EXTENSIONS.length; i++) {
    const withExtension = tryFile(`${basePath}${SUPPORTED_EXTENSIONS[i]}`);
    if (withExtension) {
      return withExtension;
    }
  }

  if (isDirectory(basePath)) {
    for (let i = 0; i < SUPPORTED_EXTENSIONS.length; i++) {
      const indexCandidate = tryFile(path.join(basePath, `index${SUPPORTED_EXTENSIONS[i]}`));
      if (indexCandidate) {
        return indexCandidate;
      }
    }
  }

  return null;
}

function tryFile(filePath: string): string | null {
  if (!existsSync(filePath)) {
    return null;
  }
  if (!statSync(filePath).isFile()) {
    return null;
  }
  return filePath;
}

function isDirectory(filePath: string): boolean {
  if (!existsSync(filePath)) {
    return false;
  }
  return statSync(filePath).isDirectory();
}

function toExportName(node: acorn.Identifier | acorn.Literal): string | null {
  if (node.type === 'Identifier') {
    return node.name;
  }

  if (typeof node.value === 'string') {
    return node.value;
  }

  return null;
}
