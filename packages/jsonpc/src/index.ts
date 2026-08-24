import { isComment, compressComments, normalizeLines, stripTopBottom } from './core.js';

class JSONWithPropertyComment {
  private topComments: string[] = [];
  private bottomComments: string[] = [];

  /**
   * This is actually the parser
   * @param text json text
   */
  constructor(text: string) {
    const lines = normalizeLines(text);
    const withoutComments = lines.filter((v) => !isComment(v));
    const rawJson = withoutComments.join('');
    try {
      JSON.parse(rawJson);
    } catch (e) {
      throw new Error(`Json text being parsed is invalid, ${(e as Error).message}`);
    }

    // & Now the json is some how valid.

    // Fill the whole file level comments
    const stripIndex = stripTopBottom(lines);
    this.bottomComments = lines.splice(stripIndex.bottom); //! Must be done first, or indexes will change.
    this.topComments = lines.splice(0, stripIndex.top + 1);

    // Collect multi // comments
    const compressed = compressComments(lines);
  }
}
