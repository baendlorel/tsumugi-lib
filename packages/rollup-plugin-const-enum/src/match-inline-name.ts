export function shouldInlineEnumName(enumNames: string[], inlineNames: Array<string | RegExp> | undefined): boolean {
  if (!inlineNames || inlineNames.length === 0) {
    return true;
  }

  for (let i = 0; i < enumNames.length; i++) {
    const enumName = enumNames[i];
    for (let j = 0; j < inlineNames.length; j++) {
      const matcher = inlineNames[j];
      if (typeof matcher === 'string') {
        if (matcher === enumName) {
          return true;
        }
        continue;
      }

      matcher.lastIndex = 0;
      if (matcher.test(enumName)) {
        return true;
      }
    }
  }

  return false;
}
