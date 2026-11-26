import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const apiRoot = new URL('../api/', import.meta.url);
const allowedEntrypoints = new Set(['[...path].ts']);
const violations = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!entry.isFile()) continue;
    if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) {
      const path = relative(apiRoot.pathname, fullPath).replaceAll('\\', '/');
      if (!allowedEntrypoints.has(path)) violations.push(path);
    }
  }
}

await walk(apiRoot.pathname);

if (violations.length) {
  console.error('Vercel API route guard failed. Add handlers under api/_handlers/ and register them in api/[...path].ts.');
  for (const file of violations) console.error(' - api/' + file);
  process.exit(1);
}

console.log('Vercel API route guard passed: only api/[...path].ts is deployable.');
