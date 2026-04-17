import { join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

import { dtsMerger } from '@/dts-merger.js';
import { RollupDtsMergerOptions } from '@/global.js';

const appendDts = (s: string) => (s.endsWith('.d.ts') ? s : `${s}.d.ts`);

/**
 * @param output output file name
 * @param dts relative to tests/mocks
 * @param options RollupDtsMergerOptions
 * @returns parsed file content and opts
 */
export function run(include: string, output: string, options: RollupDtsMergerOptions) {
  options.include = join(process.cwd(), 'tests', 'mocks', include);
  options.mergeInto = join(process.cwd(), 'tests', 'output', appendDts(output));
  const plugin = dtsMerger(options);

  if (typeof plugin.writeBundle !== 'function') {
    throw new Error('Impossible for this.plugin.writeBundle not being a function');
  }

  // clear the target file
  writeFileSync(options.mergeInto, '', 'utf-8');

  // run
  Reflect.apply(plugin.writeBundle, null, []);

  const opts = Reflect.get(plugin, '__KSKB_TMG_OPTS__') as __STRICT_OPTS__;
  const content = readFileSync(opts.mergeInto, 'utf-8');
  return { content, options: opts };
}
