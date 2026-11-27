import { mkdir, readdir, copyFile, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist', 'frontend');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const extensions = new Set(['.html', '.css', '.js', '.jpeg', '.jpg', '.png', '.gif', '.mp4', '.glb', '.gltf', '.bin', '.geojson']);
const excluded = new Set(['playwright.config.js', 'catalog.js']);
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isFile() || excluded.has(entry.name)) continue;
  if (extensions.has(path.extname(entry.name)) || ['assets-manifest.json', 'license.txt', 'CREDITOS.txt'].includes(entry.name)) {
    await copyFile(path.join(root, entry.name), path.join(output, entry.name));
  }
}
for (const folder of ['vendor', '3d-models', 'assets']) {
  const entries = await readdir(root);
  if (entries.includes(folder)) await cp(path.join(root, folder), path.join(output, folder), { recursive: true });
}
console.log('Sitio estático: dist/frontend. No incluye solicitudes, servidor ni credenciales. Las API requieren el servidor Node.');
