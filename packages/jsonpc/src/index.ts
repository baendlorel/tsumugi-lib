function isComment(t: string) {
  return t.startsWith('//');
}

function compressComments(lines: string[]): Array<string | string[]> {
  const comments: Array<{ startIndex: number; array: string[] }> = [];
  let array: string[] = [];
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isComment(lines[i])) {
      if (startIndex === -1) {
        startIndex = i;
      }
      array.push(lines[i]);
    } else {
      if (startIndex !== -1) {
        array = [];
        startIndex = -1;
      }
    }
  }

  for (let i = 0; i < comments.length; i++) {
    const c = comments[i];
    (lines as Array<string | string[]>)[c.startIndex] = c.array;
  }
}

function findPropertyNameBelow(lines: string[], commentIndex: number) {}

class JSONWithPropertyComment {
  private topComments: string[] = [];
  private bottomComments: string[] = [];

  /**
   * This is actually the parser
   * @param text json text
   */
  constructor(text: string) {
    const lines = text
      .split(/(\r\n|\r|\n)/)
      .map((t) => t.trim())
      .filter((v) => v.length > 0);
    const withoutComments = lines.filter(isComment);
    const rawJson = withoutComments.join('');
    try {
      JSON.parse(rawJson);
    } catch (e) {
      throw new Error(`Json text being parsed is invalid, ${(e as Error).message}`);
    }

    // & Now the json is some how valid.

    // Fill the whole file level comments
    for (let i = 0; i < lines.length; i++) {
      if (isComment(lines[i])) {
        this.topComments.push(lines[i]);
      } else {
        lines.splice(0, i);
        break;
      }
    }
    for (let i = lines.length - 1; i >= 0; i--) {
      if (isComment(lines[i])) {
        this.bottomComments.push(lines[i]);
      } else {
        lines.splice(i + 1);
        break;
      }
    }

    // Collect multi // comments
  }
}
