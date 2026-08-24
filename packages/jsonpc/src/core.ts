import { randomUUID } from 'node:crypto';

export function isComment(t: string) {
  return t.startsWith('//');
}

export function normalizeLines(text: string) {
  return text
    .split(/(\r\n|\r|\n)/)
    .map((t) => t.trim())
    .filter((v) => v.length > 0);
}

export function stripTopBottom(lines: string[]) {
  let top = 0;
  for (let i = 0; i < lines.length; i++) {
    if (isComment(lines[i])) {
      top = i;
    } else {
      break;
    }
  }

  let bottom = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (isComment(lines[i])) {
      bottom = i;
    } else {
      break;
    }
  }

  return { top, bottom };
}

export function compressComments(lines: string[]): Array<string | string[]> {
  const modified: Array<string | string[]> = [];
  let array: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isComment(lines[i])) {
      if (array.length === 0) {
        modified.push(array);
      }
      array.push(lines[i]);
    } else {
      array = [];
      modified.push(lines[i]);
    }
  }

  return modified;
}

export function interpretName(line: string) {
  if (line[0] !== '"') {
    throw new Error(`Comments not above property names are not supported yet`);
  }
  if (line.startsWith('""')) {
    return '';
  }
  if (line.length <= 3) {
    throw new Error(`Invalid line: ${line}`);
  }

  const chars: string[] = [];
  let escaping = false;
  let finish = false;
  for (let i = 1; i < line.length; i++) {
    const c = line[i];
    if (escaping) {
      escaping = false;
      continue;
    }
    if (c === '\\') {
      escaping = true;
    } else if (c === '"') {
      finish = true;
      break;
    } else {
      chars.push(c);
    }
  }

  if (!finish) {
    throw new Error(`Cannot find 2nd '"': ${line}`);
  }

  return chars.join('');
}

export function convertCommentsToProperties(compressed: Array<string | string[]>) {
  const names: string[] = [];
  const lines = compressed.map((v, i) => {
    if (typeof v === 'string') {
      return v;
    }
    const name = interpretName(compressed[i + 1] as string) + '_' + randomUUID();
    names.push(name);
    return `"${name}":"${JSON.stringify(v)}",`;
  });

  return { lines, names };
}
