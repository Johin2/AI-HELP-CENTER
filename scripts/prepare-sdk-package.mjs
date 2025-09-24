#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const sdkDir = resolve(rootDir, 'lib', 'sdk');
const distDir = resolve(sdkDir, 'dist');

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const rootPackagePath = resolve(rootDir, 'package.json');
const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
const sdkPackagePath = resolve(sdkDir, 'package.json');
const sdkPackage = JSON.parse(readFileSync(sdkPackagePath, 'utf8'));

const targetVersion = rootPackage.version ?? '1.0.0';
let hasChanges = false;

if (sdkPackage.version !== targetVersion) {
  sdkPackage.version = targetVersion;
  hasChanges = true;
}

const requiredFiles = ['dist', 'README.md'];
if (!Array.isArray(sdkPackage.files)) {
  sdkPackage.files = requiredFiles;
  hasChanges = true;
} else {
  for (const file of requiredFiles) {
    if (!sdkPackage.files.includes(file)) {
      sdkPackage.files.push(file);
      hasChanges = true;
    }
  }
}

if (hasChanges) {
  writeFileSync(sdkPackagePath, `${JSON.stringify(sdkPackage, null, 2)}\n`);
}

const licensePath = resolve(rootDir, 'LICENSE');
if (existsSync(licensePath)) {
  copyFileSync(licensePath, resolve(sdkDir, 'LICENSE'));
}
