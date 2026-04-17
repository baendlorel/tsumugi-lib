import type { Plugin, TransformPluginContext } from 'rollup';

type TransformResultLike = { code?: string | null } | null | undefined;

export const apply = (plugin: Plugin, code: string, id: string): null | string => {
  const mockContext = {} as TransformPluginContext;
  const transformHook = plugin.transform;
  if (typeof transformHook === 'function') {
    return (transformHook.call(mockContext, code, id) as TransformResultLike)?.code ?? null;
  }

  if (transformHook && typeof transformHook === 'object' && typeof transformHook.handler === 'function') {
    return (transformHook.handler.call(mockContext, code, id) as TransformResultLike)?.code ?? null;
  }

  return null;
};

const stripIndent = (str: string) => str.replace(/\n([\s]+)/g, () => '\n');

export const pr = (template: TemplateStringsArray, ...substitutions: unknown[]) => {
  const s: string[] = [stripIndent(template[0])];
  for (let i = 0; i < substitutions.length; i++) {
    s.push(stripIndent(String(substitutions[i])), stripIndent(String(template[i + 1])));
  }
  return s.join('');
};
