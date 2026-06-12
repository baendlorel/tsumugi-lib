import fs from 'node:fs';
import { parentPort, workerData } from 'node:worker_threads';

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

function countLines(filePath: string): number {
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

const files = (workerData?.files ?? []) as CountTaskFile[];
const countedFiles: WorkerCountedFile[] = files.map((file) => ({
  ext: file.ext,
  relativePath: file.relativePath,
  lines: countLines(file.fullPath),
}));

parentPort?.postMessage({ files: countedFiles });
