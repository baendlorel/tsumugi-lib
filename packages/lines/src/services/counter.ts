import fs from 'node:fs';
import path from 'node:path';
import { minimatch } from 'minimatch';
import { Config } from './config.js';

export interface FileCount {
  filePath: string;
  lines: number;
}

export interface CountResult {
  [extension: string]: {
    total: number;
    files: FileCount[];
  };
}

export interface CountSummary {
  byExtension: CountResult;
  total: number;
  basePath: string;
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

        if (!result[ext]) {
          result[ext] = { total: 0, files: [] };
        }

        result[ext].total += lines;
        // Store relative path
        const relativePath = path.relative(dirPath, currentPath);
        result[ext].files.push({
          filePath: relativePath,
          lines
        });

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

  return { byExtension: result, total, basePath: dirPath };
}

export function formatOutput(summary: CountSummary, verbose: boolean = false): string {
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

  const lines: string[] = [];

  for (const [ext, data] of entries) {
    const paddedExt = ext.padEnd(maxExtLen + 2);
    lines.push(`.${ext}${paddedExt.slice(ext.length)}${data.total}`);

    // Verbose mode: show individual files
    if (verbose && data.files.length > 0) {
      // Find max line count width for alignment
      const maxLineWidth = Math.max(...data.files.map(f => String(f.lines).length));

      for (const file of data.files) {
        const lineStr = String(file.lines);
        const paddedLines = lineStr.padStart(maxLineWidth);
        lines.push(`  - ${paddedLines} ${file.filePath}`);
      }
    }
  }

  lines.push('');
  lines.push(`Sum${' '.repeat(Math.max(0, maxExtLen))}${summary.total}`);

  return lines.join('\n');
}
