import { ReflectDeep } from 'reflect-deep';
import {
  isComment,
  aggregateComments,
  normalizeLines,
  stripTopBottom,
  convertCommentsToProperties,
  type PropMap,
  visit,
  uuidName,
} from './core.js';

export class JSONWithPropertyComment {
  private topComments: string[] = [];
  private bottomComments: string[] = [];

  private propMap: PropMap;

  private data: any;

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
    this.data = JSON.parse(named.lines.join(''));
    this.propMap = visit(this.data, named.names);
  }

  /**
   * Set comment for a property path.
   * - if the property path does not exist, it will be created as `null`.
   * @param propPath like `"a.b.c.0.1"`
   * @param comments comments array
   */
  setComments(propPath: string, comments: string[]) {
    const k = propPath.split('.');
    const parent = k.slice(0, -1);
    const kstr = JSON.stringify(k);

    const exists = this.propMap.get(kstr);
    if (exists) {
      ReflectDeep.set(this.data, parent.concat(exists.current + '_comment'), comments);
    } else {
      // TODO 这里要改为用在下方set的逻辑
      const name = uuidName(k[k.length - 1]);
      ReflectDeep.set(this.data, parent.concat(name), null);
      ReflectDeep.set(this.data, parent.concat(name + '_comment'), comments);
    }
  }

  /**
   * Get comment for a property path.
   * Return `null` if the property path does not exist.
   * @param propPath like `"a.b.c.0.1"`
   */
  getComments(propPath: string): string[] | null {
    const k = propPath.split('.');
    const kstr = JSON.stringify(k);
    const exists = this.propMap.get(kstr);
    if (!exists) {
      return null;
    }
    return ReflectDeep.get(this.data, k.slice(0, -1).concat(exists.current + '_comment')) as string[] | null;
  }

  set(propPath: string, value: any) {}
}
