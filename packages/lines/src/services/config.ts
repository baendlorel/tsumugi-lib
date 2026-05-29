import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { cctl } from '../../../_shared/utils/color.js';

export interface Config {
  suffix: string[];
  exclude: string[];
}

const DEFAULT_EXCLUDE = [
  // Version control
  '**/.git/**',
  '**/.svn/**',
  '**/.hg/**',
  '**/CVS/**',

  // Dependencies
  '**/node_modules/**',
  '**/jspm_packages/**',
  '**/vendor/**',
  '**/vendors/**',
  '**/bower_components/**',

  // Build outputs
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/output/**',
  '**/target/**',  // Java/Scala
  '**/bin/**',
  '**/obj/**',     // .NET

  // Testing & coverage
  '**/coverage/**',
  '**/.nyc_output/**',
  '**/.coverage/**',

  // Logs & temp
  '**/logs/**',
  '**/log/**',
  '**/tmp/**',
  '**/temp/**',
  '**/.tmp/**',

  // IDE/Editor configs
  '**/.vscode/**',
  '**/.idea/**',
  '**/.vs/**',
  '**/*.suo',
  '**/*.user',
  '**/*.userosscache',
  '**/*.sln.docstates',
  '**/.project',
  '**/.settings/**',
  '**/.classpath',
  '**/.factorypath',

  // OS files
  '**/.DS_Store',
  '**/Thumbs.db',
  '**/.DS_Store?',
  '**/*~',
  '**/*.swp',
  '**/*.swo',

  // Tool configs
  '**/.claude/**',
  '**/.cursor/**',
  '**/.continue/**',
  '**/.aider/**',
  '**/.copilot/**',

  // Lock files
  '**/*.lock',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
  '**/bun.lockb',
  '**/poetry.lock',
  '**/Cargo.lock',
  '**/Gemfile.lock',
  '**/composer.lock',
  '**/go.sum',
  '**/gradle.lockfile',

  // Config & data files (common exclusions)
  '**/*.toml',
  '**/*.yaml',
  '**/*.yml',
  '**/*.json',
  '**/*.xml',
  '**/*.ini',
  '**/*.cfg',
  '**/*.conf',
  '**/*.config',
  '**/*.env',
  '**/*.env.*',
  '**/!.env.example',

  // Documentation
  '**/docs/**',
  '**/*.md',
  '**/*.rst',
  '**/*.txt',
  '**/LICENSE',
  '**/LICENSE.*',
  '**/README',
  '**/README.*',
  '**/CHANGELOG*',
  '**/AUTHORS',
  '**/CONTRIBUTORS',

  // Assets & static files
  '**/assets/**',
  '**/static/**',
  '**/public/**',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.svg',
  '**/*.ico',
  '**/*.webp',
  '**/*.woff',
  '**/*.woff2',
  '**/*.ttf',
  '**/*.eot',

  // Database & cache
  '**/*.db',
  '**/*.sqlite',
  '**/*.sqlite3',
  '**/*.cache',

  // Archives
  '**/*.zip',
  '**/*.tar',
  '**/*.tar.gz',
  '**/*.tgz',
  '**/*.rar',
  '**/*.7z',
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

export function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
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
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  } catch (error) {
    console.error(cctl.red + `Failed to create config file at ${CONFIG_PATH}` + cctl.reset);
  }
}

export function getDefaultConfig(): Config {
  return { ...DEFAULT_CONFIG };
}
