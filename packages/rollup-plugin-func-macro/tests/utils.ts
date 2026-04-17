export const apply = (plugin: any, code: string, id: string): null | string => {
  const transformHook = plugin.transform;
  if (typeof transformHook === 'function') {
    return transformHook.call({}, code, id)?.code || null;
  } else if (transformHook && typeof transformHook.handler === 'function') {
    return transformHook.handler.call({}, code, id)?.code || null;
  }
  return null;
};

const stripIndent = (str: string) => str.replace(/\n([\s]+)/g, () => '\n');

export const pr = (template: TemplateStringsArray, ...substitutions: any[]) => {
  const s: string[] = [stripIndent(template[0])];
  for (let i = 0; i < substitutions.length; i++) {
    s.push(stripIndent(substitutions[i]), stripIndent(String(template[i + 1])));
  }
  return s.join('');
};
