import { ElseIfNode, ElseNode, EndIfNode, IfNode, IfStatement, IfType } from '../types/if.js';

/**
 * Parse the full code to `IfNode` array.
 */
export function parse(code: string): IfNode[] {
  const rawLines = code.split('\n');
  if (rawLines.length === 0) {
    return [];
  }

  // detect if statements
  const lines: IfStatement[] = [];
  let end = 0;
  for (let i = 0; i < rawLines.length; i++) {
    const content = rawLines[i];
    // Only when this line is a if statement
    const tp = getType(content);
    if (tp.type === null) {
      end += 1 + content.length;
      continue;
    }

    const start = end + 1;
    end = start + content.length;
    if (tp.type === 'if') {
      const node: IfNode = {
        type: 'if',
        condition: tp.condition,
        body: [],
        elseIfs: [],
        start,
        end,
        endIf: null as any,
        else: undefined,
      };
      lines.push(node);
      continue;
    }

    if (tp.type === 'else') {
      const node: ElseNode = {
        type: 'else',
        body: [],
        start,
        end,
        belong: null as any,
      };
      lines.push(node);
      continue;
    }

    if (tp.type === 'elseif') {
      const node: ElseIfNode = {
        type: 'elseif',
        condition: tp.condition,
        body: [],
        start,
        end,
        belong: null as any,
      };
      lines.push(node);
      continue;
    }

    if (tp.type === 'endif') {
      const node: EndIfNode = {
        type: 'endif',
        start,
        end,
        belong: null as any,
      };
      lines.push(node);
      continue;
    }
  }

  // normalize
  if (lines.length === 0) {
    return [];
  }
  if (lines.length === 1) {
    throw new SyntaxError(`Only one if statement found (#${lines[0].type}), which is invalid. Ignoring it.`);
  }
  if (lines[0].type !== 'if') {
    throw new SyntaxError(`Must start with #if, got #${lines[0].type}.`);
  }

  // build the tree structure of if statements
  const ifNodes: IfNode[] = [lines[0]];
  const stack: IfStatement[] = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const current = lines[i];
    if (current.type === 'if') {
      if (stack.length === 0) {
        ifNodes.push(current);
      }
      thenIf(stack, current);
    }

    if (current.type === 'elseif') {
      thenElseIf(stack, current);
    }

    if (current.type === 'else') {
      thenElse(stack, current);
    }

    if (current.type === 'endif') {
      thenEndIf(stack, current);
    }
  }

  if (stack.length > 0) {
    throw new SyntaxError(`Unclosed #if statement found.`);
  }

  return ifNodes;
}

const REG = /^\s*\/\/\s*#(if|elseif|elif|else|endif)\b/;
function getType(code: string): { type: IfType | null; condition: string } {
  let tp: IfType | null = null;
  const replaced = code.replace(REG, (_, t) => {
    if (t === 'elif') {
      throw new SyntaxError(`#elif is no longer supported. Use #elseif instead.`);
    }
    tp = t as IfType;
    return '';
  });

  return { type: tp, condition: replaced };
}

const thenIf = (stack: IfStatement[], current: IfNode) => {
  if (stack.length === 0) {
    stack.push(current);
    return;
  }

  const last = stack[stack.length - 1];
  if (last.type === 'if' || last.type === 'elseif' || last.type === 'else') {
    last.body.push(current);
    stack.push(current);
    return;
  }

  // & no need to deal with #endif.
};

const thenElseIf = (stack: IfStatement[], current: ElseIfNode) => {
  if (stack.length === 0) {
    throw new SyntaxError(`Unexpected #elseif statement found.`);
  }
  const last = stack[stack.length - 1];
  if (last.type === 'else') {
    throw new SyntaxError(`Unexpected #elseif statement found after #else.`);
  }

  if (last.type === 'if') {
    current.belong = last;
    last.elseIfs.push(current);
    stack.push(current);
    return;
  }

  if (last.type === 'elseif') {
    current.belong = last.belong;
    last.belong.elseIfs.push(current);
    stack[stack.length - 1] = current; // & replace the last elseif with current one, since they are in the same level.
    return;
  }

  // & no need to deal with #endif.
};

const thenElse = (stack: IfStatement[], current: ElseNode) => {
  if (stack.length === 0) {
    throw new SyntaxError(`Unexpected #else statement found. ${JSON.stringify(stack)}`);
  }
  const last = stack[stack.length - 1];
  if (last.type === 'else') {
    throw new SyntaxError(`Unexpected #else statement found after #else.`);
  }

  if (last.type === 'if') {
    current.belong = last;
    last.else = current;
    stack.push(current);
    return;
  }

  if (last.type === 'elseif') {
    current.belong = last.belong;
    last.belong.else = current;
    stack[stack.length - 1] = current; // & replace the last elseif with current one, since they are in the same level.
    return;
  }

  // & no need to deal with #endif.
};

const thenEndIf = (stack: IfStatement[], current: EndIfNode) => {
  if (stack.length === 0) {
    throw new SyntaxError(`Unexpected #endif statement found.`);
  }
  const last = stack[stack.length - 1];
  if (last.type === 'endif') {
    throw new SyntaxError(`Unexpected #endif statement found after #endif.`);
  }

  if (last.type === 'if') {
    current.belong = last;
    last.endIf = current;
    stack.pop();
    return;
  }

  if (last.type === 'elseif' || last.type === 'else') {
    current.belong = last.belong;
    last.belong.endIf = current;
    stack.pop();
    stack.pop(); // & pop the if statement as well
    return;
  }
};
