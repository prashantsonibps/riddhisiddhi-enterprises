import { verifySite } from './verify.mjs';
import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'core.mjs', 'products.mjs', 'policies.mjs', 'catalogue.mjs', 'robots.txt']) await copyFile(file, `dist/${file}`);
await cp('assets', 'dist/assets', { recursive: true });
await verifySite('dist');
console.log('Built Riddhi Siddhi Enterprises → dist/');
