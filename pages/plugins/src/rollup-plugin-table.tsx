import fs from 'node:fs';
import path from 'node:path';
import {  g, h, html, text } from './h.js';

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

export function createSvgTable(plugins = readRollupPlugins()): string {
  const len = Math.max(...plugins.map((p) => p.name.length));
  const style = <style>
    .plugin-name {
      font-size: 14px;
      font-family: Consolas, monospace;
      fill: #0366d6;
    }
    .description {
      font-size: 14px;
      font-family: Consolas, monospace;
      fill: #333;
    }</style>;


  html`<!--svg-->
    <svg width="800" height="${plugins.length * 60}" xmlns="http://www.w3.org/2000/svg">
      ${style}
      <g>
        ${plugins
          .map(
            (t, i) => `
        <a href="${t.url}" target="_blank">
          <text x="0" y="${i * 32 + 20}" class="plugin-name">
            ${t.name}
          </text>
        </a>`,
          )
          .join('')}
      </g>
      <g>${plugins.map((t, i) => `<a href="${t.url}" target="_blank">${t.name}</a>`).join('')}</g>
    </svg> `;

  return h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '800', height: plugins.length * 60 }, [
    ,
    g(
      plugins.map((t, i) =>
        h('a', { href: t.url, target: '_blank' }, [text({ x: 0, y: `${i * 16 * 2}`, class: 'plugin-name' }, t.name)]),
      ),
    ),
    g(plugins.map((t, i) => text({ x: len * 8 + 16, y: `${i * 32 + 20}`, class: 'description' }, t.summary))),
  ]).render();
}

export function saveSvgTable() {
  const svg = createSvgTable(readRollupPlugins());
  fs.mkdirSync(assetsDir, { recursive: true });
  const filePath = path.join(assetsDir, `rollup-plugins.svg`);
  fs.writeFileSync(filePath, svg, 'utf8');
  return { filePath, svg };
}

console.log(`Generated ${saveSvgTable().filePath}`);
