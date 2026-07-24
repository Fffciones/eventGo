#!/usr/bin/env node
// Falha se algum arquivo em src/apps/<app>/ importar de outro app.
// Uso compartilhado deve passar por src/shared/.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const APPS_DIR = 'src/apps';
const apps = readdirSync(APPS_DIR).filter(name =>
  statSync(join(APPS_DIR, name)).isDirectory()
);

const IMPORT_RE = /(?:from\s+['"]|import\s*\(\s*['"]|require\(\s*['"])([^'"]+)['"]/g;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const violations = [];

for (const app of apps) {
  const otherApps = apps.filter(a => a !== app);
  const appDir = join(APPS_DIR, app);
  for (const file of walk(appDir)) {
    const src = readFileSync(file, 'utf8');
    for (const match of src.matchAll(IMPORT_RE)) {
      const importPath = match[1];
      for (const other of otherApps) {
        if (importPath.includes(`/${other}/`) || importPath.includes(`apps/${other}`)) {
          violations.push(
            `${relative('.', file)}: imports "${importPath}" (cruza fronteira com "${other}")`
          );
        }
      }
    }
  }
}

if (violations.length) {
  console.error('Violação de fronteira entre apps encontrada:\n');
  for (const v of violations) console.error('  ' + v);
  console.error(`\n${violations.length} violação(ões). Apps não podem importar um do outro — use src/shared/.`);
  process.exit(1);
}

console.log('Nenhuma violação de fronteira entre apps.');
