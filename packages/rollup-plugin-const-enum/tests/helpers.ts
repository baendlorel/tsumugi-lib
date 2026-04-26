import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'rollup';

export interface SimulatedTransformResult {
  code: string;
  map: unknown;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Create a temporary test directory with test files
 */
export function createTestEnvironment(testName: string) {
  const testDir = path.join(__dirname, '.temp', testName);

  // Cleanup if exists
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }

  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(
    path.join(testDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          target: 'ESNext',
        },
      },
      null,
      2,
    ),
    'utf8',
  );

  return {
    dir: testDir,
    /**
     * Write a file in the test directory
     */
    writeFile(relativePath: string, content: string) {
      const fullPath = path.join(testDir, relativePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, 'utf8');
      return fullPath;
    },
    /**
     * Cleanup the test directory
     */
    cleanup() {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    },
  };
}

/**
 * Simulate plugin transform by applying the plugin's transform function
 */
export function simulateTransform(plugin: Plugin, code: string, id: string = 'test.ts'): string | null {
  const result = simulateTransformResult(plugin, code, id);
  return result?.code ?? null;
}

export function simulateTransformResult(
  plugin: Plugin,
  code: string,
  id: string = 'test.ts',
): SimulatedTransformResult | null {
  if (!plugin.transform || typeof plugin.transform !== 'function') {
    throw new Error('Plugin does not have a transform function');
  }

  // Call transform with minimal context
  const result = (plugin.transform as any)(code, id);

  if (result === null || result === undefined) {
    return null;
  }

  if (typeof result === 'string') {
    return { code: result, map: null };
  }

  if (typeof result === 'object' && 'code' in result) {
    return {
      code: result.code ?? '',
      map: 'map' in result ? result.map : null,
    };
  }

  return null;
}
