import type * as acorn from 'acorn';

export interface SourceRange {
  start: number;
  end: number;
}

export interface ParameterReference extends SourceRange {
  name: string;
}

export interface FunctionCandidate {
  name: string;
  sourceCode: string;
  params: string[];
  mode: 'expression' | 'block';
  expandStart: number;
  expandEnd: number;
  parameterReferences: ParameterReference[];
  declarationStart?: number;
  declarationEnd?: number;
}

export interface CallSite {
  name: string;
  start: number;
  end: number;
  replaceStart: number;
  replaceEnd: number;
  replacementKind: 'expression' | 'statement';
  arguments: SourceRange[];
}

export interface BindingCounter {
  add(name: string): void;
  get(name: string): number;
}

export interface ExpansionRoot {
  mode: 'expression' | 'block';
  node: acorn.AnyNode;
  start: number;
  end: number;
}
