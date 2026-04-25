/// <reference types="node" />

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

type RenderedRow = PluginMeta & {
  index: number;
  descriptionLines: string[];
  rowHeight: number;
};

const currentFilePath = import.meta.filename;
const scriptDir = path.dirname(currentFilePath);
const workspaceRoot = path.resolve(scriptDir, '../..');
const packagesDir = path.join(workspaceRoot, 'packages');
const assetsDir = path.join(workspaceRoot, 'assets');

const svgWidth = 1280;
const outerPadding = 36;
const tableX = outerPadding;
const tableY = 156;
const tableWidth = svgWidth - outerPadding * 2;
const indexColumnWidth = 76;
const nameColumnWidth = 348;
const descriptionColumnWidth = tableWidth - indexColumnWidth - nameColumnWidth;
const rowHeaderHeight = 54;
const bodyFontSize = 16;
const rowGap = 12;
const descriptionTextWidth = descriptionColumnWidth - 48;

const pad = (value: number) => String(value).padStart(2, '0');

const formatFileTimestamp = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}.${month}.${day}-${hour}.${minute}.${second}`;
};

const measureTextWidth = (text: string, fontSize: number) => {
  let units = 0;
  for (const char of text) {
    if (char === ' ') {
      units += 0.32;
      continue;
    }
    if (/[-_/.:]/.test(char)) {
      units += 0.42;
      continue;
    }
    if (/[A-Z0-9]/.test(char)) {
      units += 0.66;
      continue;
    }
    if (/[a-z]/.test(char)) {
      units += 0.58;
      continue;
    }
    if (/[,;!?()]/.test(char)) {
      units += 0.38;
      continue;
    }
    units += 1;
  }
  return units * fontSize;
};

const wrapText = (text: string, maxWidth: number, fontSize: number) => {
  const lines: string[] = [];
  let currentLine = '';

  for (const char of text.trim()) {
    const nextLine = `${currentLine}${char}`;
    if (char !== '\n' && measureTextWidth(nextLine, fontSize) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    currentLine = char === '\n' ? '' : char.trimStart();
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.length > 0 ? lines : [''];
};

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
  const rows: RenderedRow[] = plugins.map((plugin, index) => {
    const descriptionLines = wrapText(plugin.summary, descriptionTextWidth, bodyFontSize);
    const rowHeight = Math.max(84, 28 + descriptionLines.length * 24);
    return { ...plugin, index: index + 1, descriptionLines, rowHeight };
  });

  const tableHeight = rowHeaderHeight + rows.reduce((sum, row) => sum + row.rowHeight + rowGap, 0) + 24;
  const svgHeight = tableY + tableHeight + 42;
  const generatedLabel = formatFileTimestamp(generatedAt);

  let cursorY = tableY + rowHeaderHeight + 18;
  const rowMarkup = rows
    .map((row, index) => {
      const rowY = cursorY;
      cursorY += row.rowHeight + rowGap;
      const rowFill = index % 2 === 0 ? 'rgba(15, 23, 42, 0.78)' : 'rgba(12, 19, 33, 0.86)';
      const descriptionMarkup = row.descriptionLines
        .map(
          (line, lineIndex) =>
            `<text class="desc" x="${tableX + indexColumnWidth + nameColumnWidth + 28}" y="${rowY + 34 + lineIndex * 24}">${line}</text>`,
        )
        .join('');

      return `
        <g>
          <rect x="${tableX + 12}" y="${rowY}" width="${tableWidth - 24}" height="${row.rowHeight}" rx="22" fill="${rowFill}" stroke="rgba(125, 211, 252, 0.08)" />
          <circle cx="${tableX + 46}" cy="${rowY + row.rowHeight / 2}" r="20" fill="rgba(8, 47, 73, 0.9)" stroke="rgba(103, 232, 249, 0.45)" />
          <text class="meta" x="${tableX + 46}" y="${rowY + row.rowHeight / 2 + 4}" text-anchor="middle">${row.index}</text>
          <a href="${row.url}" target="_blank" rel="noopener noreferrer">
            <text class="name" x="${tableX + indexColumnWidth + 20}" y="${rowY + 34}">${row.name}</text>
          </a>
          ${descriptionMarkup}
        </g>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="82" y1="32" x2="1188" y2="596" gradientUnits="userSpaceOnUse">
      <stop stop-color="#07111F" />
      <stop offset="0.52" stop-color="#0F2741" />
      <stop offset="1" stop-color="#0A182C" />
    </linearGradient>
    <radialGradient id="glow-1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1120 112) rotate(180) scale(320 220)">
      <stop stop-color="#67E8F9" stop-opacity="0.24" />
      <stop offset="1" stop-color="#67E8F9" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow-2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(196 560) scale(360 240)">
      <stop stop-color="#38BDF8" stop-opacity="0.18" />
      <stop offset="1" stop-color="#38BDF8" stop-opacity="0" />
    </radialGradient>
    <filter id="panel-shadow" x="0" y="0" width="${svgWidth}" height="${svgHeight}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#020617" flood-opacity="0.42" />
    </filter>
  </defs>
  <style>
    .eyebrow { font: 700 13px 'IBM Plex Mono', 'Consolas', monospace; letter-spacing: 0.28em; fill: #67E8F9; }
    .title { font: 700 38px 'IBM Plex Sans', 'Segoe UI', 'Noto Sans SC', sans-serif; fill: #F8FAFC; }
    .subtitle { font: 500 16px 'IBM Plex Sans', 'Segoe UI', 'Noto Sans SC', sans-serif; fill: #C7D2FE; }
    .caption { font: 600 12px 'IBM Plex Mono', 'Consolas', monospace; letter-spacing: 0.12em; fill: #7DD3FC; }
    .table-head { font: 700 13px 'IBM Plex Mono', 'Consolas', monospace; letter-spacing: 0.16em; fill: #94A3B8; }
    .meta { font: 700 13px 'IBM Plex Mono', 'Consolas', monospace; letter-spacing: 0.04em; fill: #A5F3FC; }
    .name { font: 600 18px 'IBM Plex Mono', 'Consolas', monospace; fill: #F8FAFC; text-decoration: underline; }
    .desc { font: 500 16px 'IBM Plex Sans', 'Segoe UI', 'Noto Sans SC', sans-serif; fill: #DBEAFE; }
    a:hover .name { fill: #67E8F9; }
  </style>
  <rect width="${svgWidth}" height="${svgHeight}" rx="28" fill="url(#bg-gradient)" />
  <rect width="${svgWidth}" height="${svgHeight}" rx="28" fill="url(#glow-1)" />
  <rect width="${svgWidth}" height="${svgHeight}" rx="28" fill="url(#glow-2)" />
  <g filter="url(#panel-shadow)">
    <rect x="${outerPadding}" y="${outerPadding}" width="${tableWidth}" height="${svgHeight - outerPadding * 2}" rx="30" fill="rgba(3, 7, 18, 0.58)" stroke="rgba(148, 163, 184, 0.16)" />
  </g>
  <rect x="${outerPadding + 26}" y="${outerPadding + 22}" width="166" height="34" rx="17" fill="rgba(8, 47, 73, 0.74)" stroke="rgba(103, 232, 249, 0.22)" />
  <text class="eyebrow" x="${outerPadding + 50}" y="${outerPadding + 44}">ROLLUP</text>
  <text class="title" x="${outerPadding + 26}" y="${outerPadding + 94}">Plugin Catalog</text>
  <text class="subtitle" x="${outerPadding + 26}" y="${outerPadding + 122}">Generated from packages/rollup-plugin-* metadata</text>
  <text class="caption" x="${svgWidth - outerPadding - 226}" y="${outerPadding + 44}">TOTAL ${String(plugins.length).padStart(2, '0')}</text>
  <text class="caption" x="${svgWidth - outerPadding - 226}" y="${outerPadding + 72}">UPDATED ${generatedLabel}</text>

  <g>
    <rect x="${tableX + 12}" y="${tableY}" width="${tableWidth - 24}" height="${tableHeight}" rx="26" fill="rgba(2, 6, 23, 0.54)" stroke="rgba(148, 163, 184, 0.12)" />
    <line x1="${tableX + indexColumnWidth}" y1="${tableY + 12}" x2="${tableX + indexColumnWidth}" y2="${tableY + tableHeight - 12}" stroke="rgba(148, 163, 184, 0.1)" />
    <line x1="${tableX + indexColumnWidth + nameColumnWidth}" y1="${tableY + 12}" x2="${tableX + indexColumnWidth + nameColumnWidth}" y2="${tableY + tableHeight - 12}" stroke="rgba(148, 163, 184, 0.1)" />
    <text class="table-head" x="${tableX + 32}" y="${tableY + 33}">NO.</text>
    <text class="table-head" x="${tableX + indexColumnWidth + 20}" y="${tableY + 33}">PACKAGE</text>
    <text class="table-head" x="${tableX + indexColumnWidth + nameColumnWidth + 28}" y="${tableY + 33}">SUMMARY</text>
    ${rowMarkup}
  </g>
</svg>`;
}

export function saveSvgTable(generatedAt = new Date()) {
  const svg = createSvgTable(readRollupPlugins(), generatedAt);
  fs.mkdirSync(assetsDir, { recursive: true });
  const filename = `plugins-${formatFileTimestamp(generatedAt)}.svg`;
  const filePath = path.join(assetsDir, filename);
  fs.writeFileSync(filePath, svg, 'utf8');
  return { filePath, svg };
}

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  const { filePath } = saveSvgTable();
  console.log(`Generated ${filePath}`);
}
