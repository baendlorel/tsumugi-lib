import {
  AnonymousFunctionDeclaration,
  FunctionDeclaration,
  FunctionExpression,
  MethodDefinition,
  Node as AcornNode,
} from 'acorn';

export type FunctionNode = FunctionDeclaration | AnonymousFunctionDeclaration | FunctionExpression | MethodDefinition;

export interface FunctionContext {
  name: string;
  start: number;
  end: number;
}

export type NameGetter = (code: string, ast: AcornNode, position: number, fallback: string) => string;
