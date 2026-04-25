/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';
import { dtm, h, measureTextWidth } from './h.js';
import { col } from './table.js';

interface PluginPackageJson {
  name?: string;
  description?: string;
  description_zh?: string;
  homepage?: string;
  repository?: {
    url?: string;
    directory?: string;
  };
}

interface PluginMeta {
  name: string;
  summary: string;
  url: string;
}

const workspaceRoot = path.join(import.meta.filename, '..', '..', '..', '..');
const packagesDir = path.join(workspaceRoot, 'packages');
const assetsDir = path.join(workspaceRoot, 'assets');

export function readRollupPlugins(): PluginMeta[] {
  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('rollup-plugin-'))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => {
      const p = path.join(packagesDir, entry.name, 'package.json');
      const json = JSON.parse(fs.readFileSync(p, 'utf8')) as PluginPackageJson;
      const name = json.name ?? entry.name;
      const summary = json.description?.trim() || json.description_zh?.trim() || '-';
      const url = `https://www.npmjs.com/package/${name}`;
      return { name, summary, url };
    });
}

export function createSvgTable(plugins = readRollupPlugins(), generatedAt = new Date()): string {
  const maxWidth = Math.max.apply(
    null,
    plugins.map((p) => measureTextWidth(p.summary, 16)),
  );

  return h('svg', { width: '380', height: String(plugins.length * 40 + 40) }, [
    col(
      { width: maxWidth, color: '#007ACC' },
      plugins.map((p) => p.name),
    ),
    col(
      { x: maxWidth + 30 },
      plugins.map((p) => p.summary),
    ),
  ]).render();
}

export function saveSvgTable(generatedAt = new Date()) {
  const svg = createSvgTable(readRollupPlugins(), generatedAt);
  fs.mkdirSync(assetsDir, { recursive: true });
  const filename = `plugins-${dtm(generatedAt)}.svg`;
  const filePath = path.join(assetsDir, filename);
  fs.writeFileSync(filePath, svg, 'utf8');
  return { filePath, svg };
}

console.log(`Generated ${saveSvgTable().filePath}`);
