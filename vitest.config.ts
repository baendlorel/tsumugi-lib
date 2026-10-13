import { defineConfig } from 'vitest/config';
import { getAliases } from './scripts/aliases';

export default defineConfig(() => {
  return {
    test: {
      setupFiles: ['./scripts/vitest.setup.ts'],
      include: ['**/*.{test,spec,e2e-spec}.?(c|m)[jt]s?(x)'],
      silent: false,
    },
    resolve: {
      alias: getAliases(),
    },
  };
});
