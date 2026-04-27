import { RemovalRange, Result } from './types.js';

export function isDeclarationFile(fileName: string): boolean {
  return fileName.endsWith('.d.ts') || fileName.endsWith('.d.mts') || fileName.endsWith('.d.cts');
}

export function stripQuery(id: string): string {
  const queryIndex = id.indexOf('?');
  const hashIndex = id.indexOf('#');
  const end = [queryIndex, hashIndex].filter((value) => value >= 0).sort((a, b) => a - b)[0];
  return end === undefined ? id : id.slice(0, end);
}

export function toRollupResult(result: Result) {
  if (!result.changed || !result.map) {
    return null;
  }

  return {
    code: result.code,
    map: result.map,
  };
}

export function mergeRanges(ranges: RemovalRange[]): RemovalRange[] {
  if (ranges.length <= 1) {
    return ranges;
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: RemovalRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = merged[merged.length - 1];
    if (current.start <= previous.end) {
      previous.end = Math.max(previous.end, current.end);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}
