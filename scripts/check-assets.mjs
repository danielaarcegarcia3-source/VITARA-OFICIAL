import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'assets-manifest.json'), 'utf8'));
const hash = data => createHash('sha256').update(data).digest('hex');
const checked = new Set();
async function exists(url) {
  if (!url || checked.has(url)) return;
  const file = await stat(path.join(root, url));
  assert(file.isFile() && file.size > 0, `Activo vacío o inválido: ${url}`);
  checked.add(url);
}
for (const url of Object.values(manifest.identity)) await exists(url);
for (const value of Object.values(manifest.illustrations)) for (const url of Array.isArray(value) ? value : [value]) await exists(url);
for (const [key, url] of Object.entries(manifest.media)) if (!key.endsWith('Expected')) await exists(url);
for (const territory of Object.values(manifest.territories || {})) {
  await exists(territory.url);
  const data = await readFile(path.join(root, territory.url));
  assert.equal(hash(data), territory.sha256, `Geometría modificada: ${territory.url}`);
  const geo = JSON.parse(data);
  assert.equal(geo.features.length, territory.features);
  for (const feature of geo.features) {
    assert(feature.properties[territory.nameProperty]);
    assert(['Polygon', 'MultiPolygon'].includes(feature.geometry.type));
    assert(feature.geometry.coordinates.length);
  }
}
await exists('assets/geo/LICENSE-MPL-2.0.txt');
await exists('assets/geo/README.md');
await exists('bienvenida-holografica.js');
await exists('CREDITOS.txt');
await exists('vendor/THREE-LICENSE.txt');
await exists('vendor/draco/LICENSE-DRACO.txt');
let matchedTextures = 0;
for (const [key, model] of Object.entries(manifest.models)) {
  await exists(model.url);
  if (model.bytes) assert.equal((await stat(path.join(root, model.url))).size, model.bytes, `Tamaño inesperado: ${key}`);
  for (const url of model.dependencies || []) await exists(url);
  if (!model.url?.endsWith('.glb')) continue;
  const file = await readFile(path.join(root, model.url));
  assert.equal(file.readUInt32LE(0), 0x46546c67, `GLB inválido: ${key}`);
  const length = file.readUInt32LE(12);
  const gltf = JSON.parse(file.subarray(20, 20 + length).toString());
  const binary = file.subarray(28 + length);
  const embedded = new Set((gltf.images || []).filter(image => image.bufferView != null).map(image => {
    const view = gltf.bufferViews[image.bufferView];
    return hash(binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength));
  }));
  for (const texture of model.embeddedTextures || []) {
    await exists(texture);
    assert(embedded.has(hash(await readFile(path.join(root, texture)))), `La textura ${texture} no coincide con ${model.url}`);
    matchedTextures++;
  }
}
for (const name of ['hospital', 'quirofano', 'charite']) await exists(`assets/previews/${name}.png`);
assert.deepEqual(manifest.unassignedTextures, []);
console.log(`Inventario válido: ${checked.size} archivos, ${matchedTextures} texturas con coincidencia SHA-256 dentro de sus GLB.`);
