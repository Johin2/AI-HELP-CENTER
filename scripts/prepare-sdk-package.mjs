#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const rootPackagePath = resolve(rootDir, 'package.json');
const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));

const packageJson = {
  name: 'ai-help-center-sdk',
  version: rootPackage.version ?? '1.0.0',
  description: 'JavaScript client for the AI Help Center API',
  main: './index.cjs',
  module: './index.mjs',
  exports: {
    '.': {
      import: './index.mjs',
      require: './index.cjs',
      default: './index.mjs'
    },
    './package.json': './package.json'
  },
  sideEffects: false,
  keywords: ['ai', 'help-center', 'sdk', 'gemini', 'rag'],
  author: 'AI Help Center Team',
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'https://github.com/example/AI-HELP-CENTER'
  },
  homepage: 'https://github.com/example/AI-HELP-CENTER#readme'
};

writeFileSync(resolve(distDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);

const sdkReadmePath = resolve(rootDir, 'lib', 'sdk', 'README.md');
if (existsSync(sdkReadmePath)) {
  copyFileSync(sdkReadmePath, resolve(distDir, 'README.md'));
}

const licensePath = resolve(rootDir, 'LICENSE');
if (existsSync(licensePath)) {
  copyFileSync(licensePath, resolve(distDir, 'LICENSE'));
}
