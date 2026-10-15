import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const rootHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const appJs = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');

test('GitHub Pages root serves the app and assets under the repository subpath', () => {
  assert.match(rootHtml, /href="\.\/public\/brand\.svg"/);
  assert.match(rootHtml, /href="\.\/public\/styles\.css"/);
  assert.match(rootHtml, /src="\.\/public\/app\.js"/);
  assert.match(rootHtml, /id="workspace"/);
  assert.doesNotMatch(rootHtml, /(?:href|src)="\/(?:brand\.svg|styles\.css|app\.js)"/);
});

test('notification icon path is relative to the loaded app module', () => {
  assert.match(appJs, /new URL\('\.\/brand\.svg', import\.meta\.url\)/);
});
