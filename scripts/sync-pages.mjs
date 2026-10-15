import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectRoot, 'public/index.html');
const outputPath = resolve(projectRoot, 'index.html');
let html = readFileSync(sourcePath, 'utf8');

const replacements = [
  ['href="./brand.svg"', 'href="./public/brand.svg"'],
  ['href="./styles.css"', 'href="./public/styles.css"'],
  ['src="./app.js"', 'src="./public/app.js"'],
];

for (const [from, to] of replacements) {
  const occurrences = html.split(from).length - 1;
  if (occurrences !== 1) {
    throw new Error(`Expected exactly one ${JSON.stringify(from)} in ${sourcePath}; found ${occurrences}.`);
  }
  html = html.replace(from, to);
}

const doctype = '<!doctype html>';
if (!html.startsWith(doctype)) {
  throw new Error(`Expected ${sourcePath} to begin with ${doctype}.`);
}
html = html.replace(doctype, `${doctype}\n<!-- Generated from public/index.html by npm run pages:sync. -->`);
writeFileSync(outputPath, html, 'utf8');
console.log('Generated index.html for the GitHub Pages /crypto/ subpath.');
