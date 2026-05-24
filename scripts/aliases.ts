import { readdirSync } from 'node:fs';
import path from 'node:path';

const packagesDir = path.join(import.meta.dirname, '..', 'packages');

export const getAliases = () => {
  const packageDirs = readdirSync(packagesDir);
  const alias: Record<string, string> = {};
  for (const dir of packageDirs) {
    alias[dir] = path.join(packagesDir, dir, 'src');
  }
  alias[`@shared`] = path.join(packagesDir, '_shared');

  return Object.entries(alias)
    .sort(([a], [b]) => b.length - a.length)
    .map(([find, replacement]) => ({ find, replacement }));
};
