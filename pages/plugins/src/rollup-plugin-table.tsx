import fs from 'node:fs';
import path from 'node:path';

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
  plugins = plugins.filter(
    (p) => !p.name.includes('privatify') && !p.name.includes('analyze') && !p.name.includes('inline'),
  );

  const styleText = fs.readFileSync(path.join(import.meta.dirname, 'styles.css'), 'utf8');

  const LineHeight = 48;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height={plugins.length * 60}>
      <style>{styleText}</style>
      {plugins.map((plugin, index) => (
        <a href={plugin.url} target="_blank">
          <text x={0} y={index * LineHeight + 20} className="plugin-name">
            {plugin.name}
          </text>
          <text x={0} y={index * LineHeight + 42} className="description">
            {plugin.summary}
          </text>
        </a>
      ))}
    </svg>
  );
}

export function saveSvgTable() {
  const svg = createSvgTable(readRollupPlugins());
  fs.mkdirSync(assetsDir, { recursive: true });
  const filePath = path.join(assetsDir, `rollup-plugins.svg`);
  fs.writeFileSync(filePath, svg, 'utf8');
  return { filePath, svg };
}

console.log(`Generated ${saveSvgTable().filePath}`);
