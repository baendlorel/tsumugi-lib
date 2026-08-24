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

export function findPropertyNameBelow(lines: string[], commentIndex: number) {}
