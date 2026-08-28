import { randomUUID } from 'node:crypto';
import { COMMENT_SUFFIX } from './consts.js';

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

/**
 * Multiple comment lines will be collapsed into a string array.
 */
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

function nextNonSpaceIsColon(line: string, start: number) {
  for (let i = start; i < line.length; i++) {
    if (line[i] === ' ') {
      continue;
    } else if (line[i] === ':') {
      return true;
    } else {
      return false;
    }
  }
  return false;
}

export function interpretName(line: string) {
  if (line[0] !== '"') {
    throw new Error(`Comments are only allowed directly above property names`);
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
    } else if (c === '"' && nextNonSpaceIsColon(line, i + 1)) {
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

export function uuidName(origin: string) {
  return origin + '_' + randomUUID();
}

/**
 * This is the core feature. Converts property with comments into a uuidName, so that
 * we can associate the right property with right comments.
 * @param compressed
 */
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
    const name = uuidName(origin);
    compressed[i + 1] = next.replace(origin, name);
    const commentName = name + COMMENT_SUFFIX;
    names.set(name, origin);

    return `"${commentName}":${JSON.stringify(v)},`;
  });

  return { lines, names };
}

export type PropMap = Map<string, { origin: string; current: string }>;

/**
 * Deep visit, collect prop path.
 * @param o the parsed object
 * @param names the names with uuids
 * @param path property name path for ReflectDeep
 * @param map returned map
 */
export function visit(o: any, names: Map<string, string>, path: string[] = [], map: PropMap = new Map()): PropMap {
  for (const key in o) {
    const origin = names.get(key);
    const v = o[key];
    if (origin) {
      // Use original prop name instead of uuid name
      map.set(JSON.stringify(path.concat(origin)), { origin, current: key });
      continue;
    } else if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        visit(v[i], names, path.concat(key, i.toString()), map);
      }
    } else if (typeof v === 'object') {
      visit(v, names, path.concat(key), map);
    }
  }
  return map;
}
