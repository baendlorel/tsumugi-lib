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
import { COMMENT_SUFFIX } from './consts.js';

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
    const kstr = JSON.stringify(k);

    const exists = this.propMap.get(kstr);
    if (exists) {
      k[k.length - 1] = exists.current + COMMENT_SUFFIX;
      ReflectDeep.set(this.data, k, comments);
    } else {
      const value = ReflectDeep.get(this.data, k);
      ReflectDeep.deleteProperty(this.data, k);

      const origin = k[k.length - 1];
      const current = uuidName(origin);

      k[k.length - 1] = current;
      ReflectDeep.set(this.data, k, value);

      k[k.length - 1] = current + COMMENT_SUFFIX;
      ReflectDeep.set(this.data, k, comments);

      this.propMap.set(kstr, { origin, current });
    }
  }

  /**
   * Get comment for a property path.
   * Return `undefined` if the property path does not exist.
   * @param propPath like `"a.b.c.0.1"`
   */
  getComments(propPath: string): string[] | undefined {
    const k = propPath.split('.');
    const kstr = JSON.stringify(k);
    const exists = this.propMap.get(kstr);
    if (!exists) {
      return undefined;
    }
    k[k.length - 1] = exists.current + COMMENT_SUFFIX;
    return ReflectDeep.get(this.data, k);
  }

  set(propPath: string, value: any) {
    const k = propPath.split('.');
    const kstr = JSON.stringify(k);
    const exists = this.propMap.get(kstr);
    if (exists) {
      k[k.length - 1] = exists.current + COMMENT_SUFFIX;
    }
    ReflectDeep.set(this.data, k, value);
  }

  // TODO 发现k、kstr、exists这三行都是重复的。
  get(propPath: string, defaultValue?: any) {
    const k = propPath.split('.');
    const kstr = JSON.stringify(k);
    const exists = this.propMap.get(kstr);
    if (exists) {
      k[k.length - 1] = exists.current + COMMENT_SUFFIX;
    }
    return ReflectDeep.get(this.data, k) ?? defaultValue;
  }

  stringify() {
    // TODO 把原本的json组合出来
  }
}
