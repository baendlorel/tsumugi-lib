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
  let top = NaN;
  for (let i = 0; i < lines.length; i++) {
    if (isComment(lines[i])) {
      top = i;
    } else {
      break;
    }
  }

  let bottom = NaN;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (isComment(lines[i])) {
      bottom = i;
    } else {
      break;
    }
  }

  return { top, bottom };
}

export function aggregateComments(lines: string[]): Array<string | string[]> {
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
  // Maps uuid name to the original name
  const names = new Map<string, string>();
  const lines = compressed.map((v, i) => {
    if (typeof v === 'string') {
      return v;
    }

    // // prop的注释
    // "prop":"value" -> "prop_2e09b0fc-b188-4d50-b97e-e21dc0694c1c_comment":"// prop的注释","prop_2e09b0fc-b188-4d50-b97e-e21dc0694c1c":"value"
    const next = compressed[i + 1] as string;
    const origin = interpretName(next);
    const name = origin + '_' + randomUUID();
    compressed[i + 1] = next.replace(origin, name);
    const commentName = name + '_comment';
    names.set(name, origin);

    return `"${commentName}":${JSON.stringify(v)},`;
  });

  return { lines, names };
}

type KeyPropNameMap = Map<string[], { origin: string; current: string }>;

/**
 * @param o the parsed object
 * @param names the names with uuids
 */
export function visit(
  o: any,
  names: Map<string, string>,
  keyStack: string[] = [],
  map: KeyPropNameMap = new Map(),
): KeyPropNameMap {
  for (const key in o) {
    const origin = names.get(key);
    const v = o[key];
    if (origin) {
      // Use original prop name instead of uuid name
      map.set(keyStack.concat(origin), { origin, current: key });
      continue;
    } else if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        visit(v[i], names, keyStack.concat(key, i.toString()), map);
      }
    } else if (typeof v === 'object') {
      visit(v, names, keyStack.concat(key), map);
    }
  }
  return map;
}
