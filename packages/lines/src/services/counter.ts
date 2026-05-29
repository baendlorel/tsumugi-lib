import fs from 'node:fs';
import path from 'node:path';
import { minimatch } from 'minimatch';
import { Config } from './config.js';

export interface CountResult {
  [extension: string]: number;
}

export interface CountSummary {
  byExtension: CountResult;
  total: number;
}

export function getExtension(filePath: string): string | null {
  const ext = path.extname(filePath).slice(1);
  if (!ext) return null;

  // Handle special cases like Makefile, Dockerfile, etc.
  const basename = path.basename(filePath, path.extname(filePath));
  if (basename === 'Makefile' || basename === 'Dockerfile' || basename === 'CMakeLists') {
    return basename.toLowerCase();
  }

  // Handle .d.ts, .d.tsx, etc.
  if (ext === 'ts' && basename.endsWith('.d')) {
    return 'd.ts';
  }

  return ext.toLowerCase();
}

export function countLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

export function countLinesInDirectory(dirPath: string, config: Config): CountSummary {
  const result: CountResult = {};
  let total = 0;

  function walk(currentPath: string): void {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const stat = fs.statSync(currentPath);
    // Normalize path for glob matching:
    // - Remove leading ./ for relative paths
    // - Remove leading / for absolute paths (minimatch ** doesn't cross root boundary)
    let normalizedPath = currentPath;
    if (normalizedPath.startsWith('./')) {
      normalizedPath = normalizedPath.slice(2);
    } else if (path.isAbsolute(normalizedPath)) {
      normalizedPath = normalizedPath.slice(1); // Remove leading /
    }

    // Check if path matches any exclude pattern (with dot option to match hidden dirs)
    if (config.exclude.some((pattern) => minimatch(normalizedPath, pattern, { dot: true }))) {
      return;
    }

    if (stat.isFile()) {
      const ext = getExtension(currentPath);

      if (ext && config.suffix.includes(ext)) {
        const lines = countLines(currentPath);
        result[ext] = (result[ext] || 0) + lines;
        total += lines;
      }
    } else if (stat.isDirectory()) {
      const entries = fs.readdirSync(currentPath);

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry);
        walk(fullPath);
      }
    }
  }

  walk(dirPath);

  return { byExtension: result, total };
}

export function formatOutput(summary: CountSummary): string {
  const entries = Object.entries(summary.byExtension);

  // Sort by extension length first, then alphabetically
  entries.sort((a, b) => {
    const lenDiff = b[0].length - a[0].length;
    if (lenDiff !== 0) return lenDiff;
    return a[0].localeCompare(b[0]);
  });

  if (entries.length === 0) {
    return 'No files found matching the configured extensions.';
  }

  // Find the maximum extension length for alignment
  const maxExtLen = Math.max(...entries.map(([ext]) => ext.length));

  const lines = entries
    .map(([ext, count]) => {
      const paddedExt = ext.padEnd(maxExtLen + 2);
      return `.${ext}${paddedExt.slice(ext.length)}${count}`;
    })
    .sort();

  lines.push('');
  lines.push(`Sum${' '.repeat(Math.max(0, maxExtLen))}${summary.total}`);

  return lines.join('\n');
}
