import { ancestor } from 'acorn-walk';
import type * as acorn from 'acorn';
import type { NormalizedRollupInlineFunctionOptions } from '../types/common.js';
import { isReferenceIdentifier } from './identifier.js';
import type { BindingCounter, ExpansionRoot, FunctionCandidate, ParameterReference } from './types.js';

export function collectCandidates(
  ast: acorn.Program,
  opts: NormalizedRollupInlineFunctionOptions,
  bindings: BindingCounter,
  mutatedBindings: Set<string>,
  sourceCode: string,
): Map<string, FunctionCandidate> {
  const expected = new Set(opts.names);
  const result = new Map<string, FunctionCandidate>();
  const body = Array.isArray(ast.body) ? ast.body : [];

  for (let i = 0; i < body.length; i++) {
    const statement = body[i];

    if (statement.type === 'FunctionDeclaration' && statement.id?.name && expected.has(statement.id.name)) {
      const name = statement.id.name as string;
      if (bindings.get(name) !== 1 || mutatedBindings.has(name)) {
        continue;
      }

      const candidate = createFunctionCandidate(name, statement, sourceCode, statement.start, statement.end);
      if (candidate) {
        result.set(name, candidate);
      }
      continue;
    }

    if (statement.type !== 'VariableDeclaration' || statement.kind !== 'const') {
      continue;
    }

    const declarations = Array.isArray(statement.declarations) ? statement.declarations : [];
    const declarationRange = declarations.length === 1 ? { start: statement.start, end: statement.end } : null;

    for (let j = 0; j < declarations.length; j++) {
      const declaration = declarations[j];
      if (declaration.id?.type !== 'Identifier' || !expected.has(declaration.id.name)) {
        continue;
      }

      const init = declaration.init;
      if (!init || (init.type !== 'FunctionExpression' && init.type !== 'ArrowFunctionExpression')) {
        continue;
      }

      const name = declaration.id.name as string;
      if (bindings.get(name) !== 1 || mutatedBindings.has(name)) {
        continue;
      }

      const candidate = createFunctionCandidate(name, init, sourceCode, declarationRange?.start, declarationRange?.end);
      if (candidate) {
        result.set(name, candidate);
      }
    }
  }

  return result;
}

export function createFunctionCandidate(
  name: string,
  functionNode: acorn.Function,
  sourceCode: string,
  declarationStart?: number,
  declarationEnd?: number,
): FunctionCandidate | null {
  if (functionNode.async || functionNode.generator) {
    return null;
  }

  const params = extractParameters(functionNode);
  if (!params) {
    return null;
  }

  const root = resolveExpansionRoot(functionNode);
  if (!root) {
    return null;
  }

  const parameterReferences = collectParameterReferences(root.node, new Set(params));

  return {
    name,
    sourceCode,
    params,
    mode: root.mode,
    expandStart: root.start,
    expandEnd: root.end,
    parameterReferences,
    declarationStart,
    declarationEnd,
  };
}

function extractParameters(functionNode: acorn.Function): string[] | null {
  const params = Array.isArray(functionNode.params) ? functionNode.params : [];
  const names: string[] = [];

  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    if (param.type !== 'Identifier') {
      return null;
    }
    if (names.includes(param.name)) {
      return null;
    }
    names.push(param.name as string);
  }

  return names;
}

function resolveExpansionRoot(functionNode: acorn.Function): ExpansionRoot | null {
  if (functionNode.body?.type !== 'BlockStatement') {
    return {
      mode: 'expression',
      node: functionNode.body,
      start: functionNode.body.start,
      end: functionNode.body.end,
    };
  }

  const body = functionNode.body;
  const statements = Array.isArray(body.body) ? body.body : [];
  if (statements.length === 1 && statements[0].type === 'ReturnStatement' && statements[0].argument) {
    const expr = statements[0].argument;
    return {
      mode: 'expression',
      node: expr,
      start: expr.start,
      end: expr.end,
    };
  }

  return {
    mode: 'block',
    node: body,
    start: body.start + 1,
    end: body.end - 1,
  };
}

function collectParameterReferences(root: acorn.AnyNode, params: Set<string>): ParameterReference[] {
  const refs: ParameterReference[] = [];

  ancestor(root, {
    Identifier(node: acorn.Identifier, _state: unknown, ancestors: acorn.Node[]) {
      if (!params.has(node.name)) {
        return;
      }

      const parent = ancestors[ancestors.length - 2] as acorn.AnyNode | undefined;
      if (!isReferenceIdentifier(node, parent)) {
        return;
      }

      refs.push({
        name: node.name as string,
        start: node.start,
        end: node.end,
      });
    },
  });

  refs.sort((a, b) => a.start - b.start);
  return refs;
}
