/**
 * # Rules
 * 1. Only `//` comments.
 * 2. Comments should occupy the whole line.
 * 3. Only appears above property names
 * 4. One property name can have multiple comments.
 * 5. Properties in arrays cannot be commented.
 */
class JSONWithPropertyComment {
  constructor(text: string) {
    const lines = text.split(/(\r\n|\r|\n)/);
    const withoutComments = lines.map((t) => t.trim()).filter((t) => t.startsWith('//'));
    const rawJson = withoutComments.join('');
    try {
      JSON.parse(rawJson);
    } catch (e) {
      throw new Error(`Json text being parsed is invalid, ${(e as Error).message}`);
    }
  }
}
