interface IfNodeBase {
  /**
   * Start position of the Node
   */
  start: number;

  /**
   * End position.
   * - Same as Acorn, this is the position of the next index of the last character of the Node.
   */
  end: number;
}

export interface IfNode extends IfNodeBase {
  type: 'if';
  condition: string;
  body: IfStatement[];
  elseIfs: ElseIfNode[];
  else: ElseNode | undefined;
  endIf: EndIfNode;
}

export interface ElseIfNode extends IfNodeBase {
  type: 'elseif';
  condition: string;
  body: IfStatement[];
  belong: IfNode;
}

export interface ElseNode extends IfNodeBase {
  type: 'else';
  body: IfStatement[];
  belong: IfNode;
}

export interface EndIfNode extends IfNodeBase {
  type: 'endif';
  belong: IfNode;
}

export type IfStatement = IfNode | ElseIfNode | ElseNode | EndIfNode;
export type IfType = IfStatement['type'];
