import { statSync, readdirSync } from 'node:fs';
import { join, parse } from 'node:path';
import { createFilter, FilterPattern } from '@rollup/pluginutils';

type Filter = (s: string) => boolean;

export function getFiles(include: FilterPattern, exclude: FilterPattern) {
  const filters = createFilters(include, exclude);
  const dtsFiles: string[] = [];
  recursion(filters.excludes, process.cwd(), dtsFiles);
  return dtsFiles.filter(filters.includes);
}

export function createFilters(include: FilterPattern, exclude: FilterPattern) {
  const includes = createFilter(include, null);

  // & Because createFilter always creates an `include` function, so exclude must be its opposite.
  const reversedExcludes = createFilter(null, exclude);
  const excludes = (id: string) => !reversedExcludes(id);

  return {
    includes,
    excludes,
  };
}

/**
 * Load all .d.ts files recursively from a given path
 * @param excludes
 * @param nextPath full path of the item
 * @param list valid file paths
 * @param nonexist nonexist file paths
 * @returns
 */
function recursion(excludes: Filter, nextPath: string, list: string[]) {
  if (excludes(nextPath)) {
    return;
  }
  const s = statSync(nextPath);
  if (s.isDirectory()) {
    if (parse(nextPath).base === 'node_modules') {
      return;
    }

    const items = readdirSync(nextPath);
    for (let i = 0; i < items.length; i++) {
      const fullPath = join(nextPath, items[i]);
      recursion(excludes, fullPath, list);
    }
    return;
  }
  if (s.isFile() && nextPath.endsWith('.d.ts')) {
    list.push(nextPath);
    return;
  }
}
