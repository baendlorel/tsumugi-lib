import { isComment, aggregateComments, normalizeLines, stripTopBottom, convertCommentsToProperties } from './core.js';

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
    if (!isNaN(stripIndex.bottom)) {
      this.bottomComments = lines.splice(stripIndex.bottom); //! Must be done first, or indexes will change.
    }
    if (!isNaN(stripIndex.top)) {
      this.topComments = lines.splice(0, stripIndex.top + 1);
    }

    const aggregated = aggregateComments(lines);

    const named = convertCommentsToProperties(aggregated);
  }
}
