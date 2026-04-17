String.prototype.replaceAll =
  String.prototype.replaceAll ||
  function (this: string, search: string, replacement: string) {
    return this.split(search).join(replacement);
  };

export function stringify(key: string, value: any): string {
  if (value === null) {
    return 'null';
  }
  switch (typeof value) {
    case 'string':
      return value;
    case 'function':
      return stringify(key, value(key));
    case 'bigint':
    case 'number':
    case 'boolean':
    case 'undefined':
      return String(value);
    case 'object':
    case 'symbol':
    default:
      throw new TypeError(`Unsupported replacement type for key "${key}": ${typeof value}`);
  }
}

export function replace(replaceList: string[], str: string): string {
  for (let i = 0; i < replaceList.length; i += 2) {
    str = str.replaceAll(replaceList[i], replaceList[i + 1]);
  }
  return str;
}
