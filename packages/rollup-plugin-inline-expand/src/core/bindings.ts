import { fullAncestor } from 'acorn-walk';
import type * as acorn from 'acorn';
import type { BindingCounter } from './types.js';

export function collectBindings(ast: acorn.Program): BindingCounter {
  const counters = new Map<string, number>();

  const add = (name: string) => {
    counters.set(name, (counters.get(name) ?? 0) + 1);
  };

  fullAncestor(ast, (node: acorn.Node) => {
    const current = node as acorn.AnyNode;

    if (current.type === 'FunctionDeclaration') {
      if (current.id?.name) {
        add(current.id.name);
      }
      addParams(current.params, add);
      return;
    }

    if (current.type === 'FunctionExpression' || current.type === 'ArrowFunctionExpression') {
      if (current.id?.name) {
        add(current.id.name);
      }
      addParams(current.params, add);
      return;
    }

    if (current.type === 'VariableDeclarator') {
      addPattern(current.id, add);
      return;
    }

    if ((current.type === 'ClassDeclaration' || current.type === 'ClassExpression') && current.id?.name) {
      add(current.id.name);
      return;
    }

    if (
      current.type === 'ImportSpecifier' ||
      current.type === 'ImportDefaultSpecifier' ||
      current.type === 'ImportNamespaceSpecifier'
    ) {
      if (current.local?.name) {
        add(current.local.name);
      }
      return;
    }

    if (current.type === 'CatchClause' && current.param) {
      addPattern(current.param, add);
    }
  });

  return {
    add,
    get(name: string) {
      return counters.get(name) ?? 0;
    },
  };
}

export function collectMutatedBindings(ast: acorn.Program): Set<string> {
  const mutated = new Set<string>();
  const markPattern = (pattern: acorn.Pattern) => {
    addPattern(pattern, (name) => mutated.add(name));
  };

  fullAncestor(ast, (node: acorn.Node) => {
    const current = node as acorn.AnyNode;

    if (current.type === 'AssignmentExpression') {
      markPattern(current.left);
      return;
    }

    if (current.type === 'UpdateExpression' && current.argument.type === 'Identifier') {
      mutated.add(current.argument.name);
      return;
    }

    if ((current.type === 'ForInStatement' || current.type === 'ForOfStatement') && current.left.type === 'Identifier') {
      mutated.add(current.left.name);
    }
  });

  return mutated;
}

function addParams(params: acorn.Pattern[], add: (name: string) => void) {
  if (!Array.isArray(params)) {
    return;
  }
  for (let i = 0; i < params.length; i++) {
    addPattern(params[i], add);
  }
}

function addPattern(pattern: acorn.Pattern | null | undefined, add: (name: string) => void) {
  if (!pattern) {
    return;
  }

  if (pattern.type === 'Identifier') {
    add(pattern.name);
    return;
  }

  if (pattern.type === 'AssignmentPattern') {
    addPattern(pattern.left, add);
    return;
  }

  if (pattern.type === 'RestElement') {
    addPattern(pattern.argument, add);
    return;
  }

  if (pattern.type === 'ArrayPattern') {
    for (let i = 0; i < pattern.elements.length; i++) {
      addPattern(pattern.elements[i], add);
    }
    return;
  }

  if (pattern.type === 'ObjectPattern') {
    for (let i = 0; i < pattern.properties.length; i++) {
      const property = pattern.properties[i];
      if (property.type === 'Property') {
        addPattern(property.value, add);
      } else if (property.type === 'RestElement') {
        addPattern(property.argument, add);
      }
    }
  }
}
