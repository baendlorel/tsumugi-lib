import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { cctl } from '@shared/utils/color.js';

export interface Config {
  suffix: string[];
  exclude: string[];
}

const DEFAULT_EXCLUDE = [
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'out',
  'logs',
  '.vscode',
  '.idea',
  '.DS_Store',
  '.claude',
];

const DEFAULT_SUFFIX = [
  // Programming languages
  'ts',
  'tsx',
  'js',
  'jsx',
  'mts',
  'mjs',
  'cjs',
  'py',
  'rs',
  'go',
  'java',
  'kt',
  'kts',
  'c',
  'cpp',
  'cc',
  'cxx',
  'h',
  'hpp',
  'cs',
  'php',
  'rb',
  'swift',
  'scala',
  'sc',
  'clj',
  'cljs',
  'lua',
  'dart',
  'elm',
  'ex',
  'exs',
  'erl',
  'hrl',
  'fs',
  'fsx',
  'v',
  'sv',
  'vhdl',
  'nim',
  'zig',
  'sh',
  'bash',
  'zsh',
  'fish',
  'ps1',
  // Web/frontend
  'css',
  'scss',
  'sass',
  'less',
  'html',
  'htm',
  'vue',
  'svelte',
  'jsx',
  'tsx',
  // Config/data files
  'json',
  'jsonc',
  'yaml',
  'yml',
  'toml',
  'ini',
  'cfg',
  'conf',
  'xml',
  'md',
  'markdown',
  'txt',
  'sql',
  'graphql',
  'gql',
  'dockerfile',
  'Makefile',
  'cmake',
  'tf',
  'hcl',
];

const CONFIG_PATH = path.join(os.homedir(), '.how-many-lines.json');

const DEFAULT_CONFIG: Config = {
  suffix: DEFAULT_SUFFIX,
  exclude: DEFAULT_EXCLUDE,
};

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    createDefaultConfig();
    return DEFAULT_CONFIG;
  }

  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content) as Config;

    // Ensure required fields exist
    if (!config.suffix || !Array.isArray(config.suffix)) {
      config.suffix = DEFAULT_CONFIG.suffix;
    }
    if (!config.exclude || !Array.isArray(config.exclude)) {
      config.exclude = DEFAULT_CONFIG.exclude;
    }

    return config;
  } catch (error) {
    console.error(cctl.red + `Failed to parse config file, using defaults` + cctl.reset);
    return DEFAULT_CONFIG;
  }
}

export function createDefaultConfig(): void {
  try {
    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify(DEFAULT_CONFIG, null, 2),
      'utf-8'
    );
  } catch (error) {
    console.error(cctl.red + `Failed to create config file at ${CONFIG_PATH}` + cctl.reset);
  }
}

export function getDefaultConfig(): Config {
  return { ...DEFAULT_CONFIG };
}
