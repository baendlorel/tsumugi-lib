import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
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
  elapsedMs: number;
}

export interface CountOptions {
  threads?: number;
  verbose?: boolean;
}

interface PendingFile {
  fullPath: string;
  relativePath: string;
  ext: string;
}

interface CountTaskFile {
  ext: string;
  relativePath: string;
  fullPath: string;
}

interface WorkerCountedFile {
  ext: string;
  relativePath: string;
  lines: number;
}

interface WorkerCountResult {
  files: WorkerCountedFile[];
}

const workerFilePath = fileURLToPath(
  new URL(import.meta.url.endsWith('.ts') ? './counter-worker.ts' : './counter-worker.mjs', import.meta.url),
);

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
    const content = fs.readFileSync(filePath);
    if (content.length === 0) {
      return 1;
    }

    let lines = 1;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === 10) {
        lines++;
      }
    }

    return lines;
  } catch (error) {
    return 0;
  }
}

function normalizeForMatch(currentPath: string): string {
  if (currentPath.startsWith('./')) {
    return currentPath.slice(2);
  }

  if (path.isAbsolute(currentPath)) {
    return currentPath.slice(1);
  }

  return currentPath;
}

function createExcludeMatcher(config: Config): (targetPath: string) => boolean {
  const matchers = config.exclude.map(
    (pattern) => (targetPath: string) => minimatch(targetPath, pattern, { dot: true }),
  );
  return (targetPath: string) => matchers.some((matcher) => matcher(targetPath));
}

function collectFiles(dirPath: string, config: Config): PendingFile[] {
  const suffixSet = new Set(config.suffix.map((suffix) => suffix.toLowerCase()));
  const isExcluded = createExcludeMatcher(config);
  const files: PendingFile[] = [];

  function walk(currentPath: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (error) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const normalizedPath = normalizeForMatch(fullPath);

      if (isExcluded(normalizedPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const ext = getExtension(fullPath);
      if (!ext || !suffixSet.has(ext)) {
        continue;
      }

      files.push({
        fullPath,
        relativePath: path.relative(dirPath, fullPath),
        ext,
      });
    }
  }

  walk(dirPath);
  return files;
}

function appendFileCount(
  result: CountResult,
  file: WorkerCountedFile,
  totalState: { total: number },
  verbose: boolean,
): void {
  if (!result[file.ext]) {
    result[file.ext] = { total: 0, files: [] };
  }

  result[file.ext].total += file.lines;
  if (verbose) {
    result[file.ext].files.push({
      filePath: file.relativePath,
      lines: file.lines,
    });
  }
  totalState.total += file.lines;
}

function countLinesSequential(files: PendingFile[], verbose: boolean): Pick<CountSummary, 'byExtension' | 'total'> {
  const result: CountResult = {};
  const totalState = { total: 0 };

  for (const file of files) {
    appendFileCount(
      result,
      {
        ext: file.ext,
        relativePath: file.relativePath,
        lines: countLines(file.fullPath),
      },
      totalState,
      verbose,
    );
  }

  return { byExtension: result, total: totalState.total };
}

function chunkFiles(files: PendingFile[], threadCount: number): CountTaskFile[][] {
  const chunkSize = Math.max(64, Math.ceil(files.length / threadCount));
  const chunks: CountTaskFile[][] = [];

  for (let i = 0; i < files.length; i += chunkSize) {
    chunks.push(
      files.slice(i, i + chunkSize).map((file) => ({
        ext: file.ext,
        relativePath: file.relativePath,
        fullPath: file.fullPath,
      })),
    );
  }

  return chunks;
}

function countChunkInWorker(files: CountTaskFile[]): Promise<WorkerCountResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFilePath, {
      workerData: { files },
      execArgv: workerFilePath.endsWith('.ts') ? ['--import', 'tsx'] : [],
    });

    worker.once('message', (message: WorkerCountResult) => {
      resolve(message);
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

async function countLinesParallel(
  files: PendingFile[],
  threads: number,
  verbose: boolean,
): Promise<Pick<CountSummary, 'byExtension' | 'total'>> {
  const result: CountResult = {};
  const totalState = { total: 0 };
  const workerCount = Math.min(threads, files.length);
  const chunks = chunkFiles(files, workerCount);
  const workerResults = await Promise.all(chunks.map((chunk) => countChunkInWorker(chunk)));

  for (const workerResult of workerResults) {
    for (const file of workerResult.files) {
      appendFileCount(result, file, totalState, verbose);
    }
  }

  return { byExtension: result, total: totalState.total };
}

export async function countLinesInDirectory(
  dirPath: string,
  config: Config,
  options: CountOptions = {},
): Promise<CountSummary> {
  const startedAt = performance.now();
  const verbose = options.verbose ?? false;
  const requestedThreads = options.threads ?? 1;
  const threads = Math.max(1, Math.min(requestedThreads, os.availableParallelism?.() ?? os.cpus().length));
  const files = collectFiles(dirPath, config);
  const counted =
    threads > 1 && files.length > 1
      ? await countLinesParallel(files, threads, verbose)
      : countLinesSequential(files, verbose);

  return {
    byExtension: counted.byExtension,
    total: counted.total,
    basePath: dirPath,
    elapsedMs: performance.now() - startedAt,
  };
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
      const maxLineWidth = Math.max(...data.files.map((f) => String(f.lines).length));

      for (const file of data.files) {
        const lineStr = String(file.lines);
        const paddedLines = lineStr.padStart(maxLineWidth);
        lines.push(`  - ${paddedLines} ${file.filePath}`);
      }
    }
  }

  lines.push('');
  lines.push(`Sum${' '.repeat(Math.max(0, maxExtLen))}${summary.total} (${summary.elapsedMs.toFixed(2)} ms)`);

  return lines.join('\n');
}
