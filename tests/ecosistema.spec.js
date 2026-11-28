import { test, expect } from '@playwright/test';
// Recorridos de regresión en modo expandido; la nueva navegación inicial se prueba aparte.
test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('vitara.navigation.all', 'true')); });

async function login(page, name = 'Daniela') {
  await page.goto('/');
  await page.evaluate(() => document.querySelector('#splash-skip').click());
  await page.locator('#access-name').fill(name);
  await page.locator('#access-form [type=submit]').click();
  await expect(page.locator('#access')).toBeHidden();
}

test('secuencia obligatoria, validación, perfil persistente y cierre local', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#splash')).toBeVisible();
  await expect(page.locator('#app')).toHaveAttribute('inert', '');
  await page.evaluate(() => document.querySelector('#splash-skip').click());
  await expect(page.locator('#login-card')).toBeVisible();
  await page.locator('#access-name').fill('   ');
  await page.locator('#access-form [type=submit]').click();
  await expect(page.locator('#access')).toBeVisible();
  await page.locator('#access-name').fill('Daniela');
  await page.locator('#access-form [type=submit]').click();
  await expect(page.locator('#welcome-name')).toContainText('Daniela');
  await expect(page.locator('#profile-nom')).toHaveText('Daniela');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('g3.perfil')).nombre)).toBe('Daniela');
  await page.reload();
  await page.evaluate(() => document.querySelector('#splash-skip').click());
  await expect(page.locator('#access-name')).toHaveValue('Daniela');
  await page.locator('#access-form [type=submit]').click();
  await page.locator('#btn-profile').click();
  await page.locator('[data-session-logout]').click();
  await expect(page.locator('#login-card')).toBeVisible();
  await expect(page.locator('#app')).toHaveAttribute('inert', '');
  await expect(page.locator('#ambient-audio')).toHaveJSProperty('paused', true);
});

test('todas las vistas preservadas, búsqueda, atlas, filtros y catálogo', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await login(page);
  for (const id of ['buscar','tablero','mapas','planos','equipos','solicitudes','canales','comunidad','fuentes','inicio']) {
    await page.locator(`[data-view-link="${id}"]`).click();
    await expect(page.locator(`#view-${id}`)).toBeVisible();
  }
  await page.locator('[data-view-link="buscar"]').click();
  await page.locator('#page-q').fill('paracetamol');
  await expect(page.locator('#search-results')).toContainText(/Paracetamol/i);
  await page.locator('[data-view-link="mapas"]').click();
  expect(await page.locator('#mapa-svg-wrap').evaluate(el => el.clientHeight)).toBeGreaterThanOrEqual(450);
  await page.locator('#map-btn-ll').click();
  await expect(page.locator('#mapa-svg-wrap canvas')).toHaveAttribute('data-regions','12');
  await page.locator('[data-terrain="2d"]').click();
  await expect(page.locator('#mapa-svg-wrap svg')).toBeVisible();
  await page.locator('[data-atlas="ll"]').click();
  await expect(page.locator('.atlas-image img')).toHaveAttribute('src', './MAPADELALIBERTAD3D.png');
  await page.locator('[data-zoom="in"]').click();
  await expect(page.locator('.atlas-image img')).toHaveAttribute('style', /scale\(1.2\)/);
  await page.locator('#atlas-district').selectOption('Chugay');
  await page.locator('#atlas-type').selectOption('hospital');
  await expect(page.locator('#atlas-results')).toContainText('No hay establecimientos');
  await page.locator('#atlas-type').selectOption('');
  await page.locator('.atlas-place').first().click();
  await expect(page.locator('#inspector')).toBeVisible();
  await page.evaluate(() => window.Vitara.cerrarInspector());
  await page.locator('[data-view-link="equipos"]').click();
  await expect(page.locator('#or-overlay')).toContainText('30.7 MB');
  await expect(page.locator('#load-or')).toBeEnabled();
  expect(errors).toEqual([]);
});

test('modelos reales, normalización, glTF externo y controles', async ({ page }) => {
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await login(page);
  await expect(page.locator('#dna-loader')).toHaveClass(/is-hidden/);
  await expect(page.locator('#dna-fallback')).toBeHidden();
  await page.locator('#dna-rotate').click();
  await page.locator('.dna-target').first().click();
  await expect(page.locator('#dna-panel')).toBeVisible();
  await page.locator('#dna-panel-close').click();
  const fit = await page.evaluate(async () => {
    const { group } = await window.VitaraGLB.load('./scene.gltf');
    const fitted = window.VitaraGLB.fitToHeight(group, 7.4, { orientar: false });
    const box = new THREE.Box3().setFromObject(fitted);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    window.VitaraGLB.dispose(fitted);
    return { max: Math.max(size.x, size.y, size.z), center: center.length() };
  });
  expect(fit.max).toBeCloseTo(7.4, 2);
  expect(fit.center).toBeLessThan(0.01);
  await page.locator('[data-view-link="planos"]').click();
  await page.locator('#load-hospital').click();
  await expect(page.locator('#hospital-canvas')).toHaveAttribute('data-cargado', '1', { timeout: 30000 });
  await page.locator('#viewer-hospital .scene-pin').first().click();
  await expect(page.locator('#viewer-hospital .hotspot-story')).toContainText('Entrada y vestíbulo');
  expect(errors).toEqual([]);
});

test('móvil sin desbordamientos y navegación accesible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'María');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.locator('#home-hero').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  await page.locator('#rail-open').click();
  await page.locator('[data-view-link="mapas"]').click();
  await expect(page.locator('#view-mapas')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('recursos públicos válidos y datos privados no servidos como estáticos', async ({ request }) => {
  for (const url of ['/','/ecosistema.css','/ecosistema.js','/vendor/vitara-three.js','/vendor/draco/draco_decoder.wasm','/adn.glb','/scene.gltf','/scene.bin','/logo%20VITARA.jpeg','/MUSICADEFONDO.mp4']) {
    const response = await request.get(url);
    expect(response.status(), url).toBe(200);
  }
  for (const url of ['/server.mjs','/solicitudes.json','/.git/HEAD','/node_modules/firebase/package.json']) {
    expect([403, 404], url).toContain((await request.get(url)).status());
  }
  const response = await request.get('/');
  expect(response.headers()['content-security-policy']).toContain("connect-src 'self' blob:");
});

test('fallo del ADN no crea un sustituto y el contenido sigue utilizable', async ({ page }) => {
  await page.route('**/adn.glb', route => route.abort());
  await login(page);
  await expect(page.locator('#dna-fallback')).toBeVisible();
  await expect(page.locator('#dna-fallback')).toContainText('No se pudo cargar');
  await page.locator('[data-view-link="buscar"]').click();
  await expect(page.locator('#page-search')).toBeVisible();
});

test('audio bajo demanda, DOM único y preferencias de movimiento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page);
  await expect(page.locator('#ambient-audio')).toHaveJSProperty('paused', true);
  const duplicates = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  expect(duplicates).toEqual([]);
  await page.locator('#ambient-volume').fill('0.5');
  await expect(page.locator('#ambient-audio')).toHaveJSProperty('volume', 0.5);
  await expect(page.locator('#ambient-toggle')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => document.querySelector('#access-video').autoplay)).toBe(false);
});

test('los dos nuevos modelos cargan y sus puntos educativos permiten recorrer capítulos', async ({ page }) => {
  test.setTimeout(150000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await login(page);
  for (const [id, view] of [['or', 'equipos'], ['vr', 'planos']]) {
    await page.locator(`[data-view-link="${view}"]`).click();
    await page.locator(`#load-${id}`).scrollIntoViewIfNeeded();
    await page.locator(`#load-${id}`).click();
    await expect(page.locator(`#${id}-canvas`)).toHaveAttribute('data-cargado', '1', { timeout: 60000 });
    await page.locator(`#viewer-${id} .scene-pin`).first().click();
    const story = page.locator(`#viewer-${id} .hotspot-story`);
    await expect(story).toBeVisible();
    await expect(story).toContainText(id === 'or' ? 'Mesa de operaciones' : 'Zona de mesa y trabajo');
    await expect(story).not.toContainText('Información y privacidad');
    await expect(story.locator('.hotspot-story__top')).toContainText('01 / 06');
    await story.locator('[data-story-next]').click();
    await expect(story.locator('.hotspot-story__top')).toContainText('02 / 06');
    await expect(story.locator('.hotspot-story__nav')).toContainText('2 de 6 explorados');
    await story.locator('[data-story-prev]').click();
    await expect(story.locator('.hotspot-story__top')).toContainText('01 / 06');
    await story.locator('[data-story-close]').click();
    await expect(story).toBeHidden();
    await page.locator(`#viewer-${id} + .model-chapters [data-chapter="2"]`).click();
    await expect(story.locator('.hotspot-story__top')).toContainText('03 / 06');
    await page.keyboard.press('Escape');
    await expect(story).toBeHidden();
    await expect(page.locator(`#viewer-${id} + .model-chapters [data-chapter]`)).toHaveCount(6);
    await page.locator(`#viewer-${id} + .model-chapters [data-chapter="5"]`).click();
    await expect(story.locator('.hotspot-story__top')).toContainText('06 / 06');
    await story.locator('[data-story-close]').click();
    await expect(story).toBeHidden();
  }
  expect(errors).toEqual([]);
});

test('rutas editoriales, selector por teclado, galería y bienvenida repetible', async ({ page }) => {
  await login(page);
  await page.locator('#journey-tab-care').scrollIntoViewIfNeeded();
  await page.locator('#journey-tab-care').click();
  await expect(page.locator('#journey-panel')).toContainText('No tienes que');
  await page.locator('#journey-tab-care').press('ArrowRight');
  await expect(page.locator('#journey-tab-map')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#journey-panel img')).toHaveAttribute('src', './MAPADELALIBERTAD3D.png');
  await page.locator('[data-open-scene="or"]').click();
  await expect(page.locator('#view-equipos')).toBeVisible();
  await expect(page.locator('#or-canvas')).not.toHaveAttribute('data-cargado', '1');
  await expect(page.locator('#equip-grid')).toHaveAttribute('data-layout', 'index');
  await page.locator('.equipment-disclosure summary').first().click();
  await expect(page.locator('.equipment-disclosure').first()).toHaveAttribute('open', '');
  await page.locator('[data-equipment-layout="mosaic"]').click();
  await expect(page.locator('#equip-grid')).toHaveAttribute('data-layout', 'mosaic');
  await page.locator('#btn-profile').click();
  await page.locator('[data-session-logout]').click();
  await page.locator('.welcome-replay').click();
  await expect(page.locator('#splash')).toBeVisible();
  await expect(page.locator('#login-card')).toBeHidden();
  await page.evaluate(() => document.querySelector('#splash-skip').click());
  await expect(page.locator('#login-card')).toBeVisible();
});

test('inventario completo, miniaturas reales y streaming parcial del video', async ({ request }) => {
  const manifest = await (await request.get('/assets-manifest.json')).json();
  expect(manifest.media.loginVideo).toBe('VIDEOBANNER.mp4');
  expect(manifest.unassignedTextures).toEqual([]);
  for (const key of ['operatingRoom', 'hospitalRoom']) {
    const response = await request.head('/' + manifest.models[key].url);
    expect(response.status()).toBe(200);
    expect(Number(response.headers()['content-length'])).toBe(manifest.models[key].bytes);
  }
  for (const name of ['hospital', 'quirofano', 'charite']) {
    expect((await request.get(`/assets/previews/${name}.png`)).status()).toBe(200);
  }
  const partial = await request.get('/VIDEOBANNER.mp4', { headers: { Range: 'bytes=0-1023' } });
  expect(partial.status()).toBe(206);
  expect((await partial.body()).length).toBe(1024);
  expect(partial.headers()['content-range']).toBe('bytes 0-1023/34526219');
  expect((await request.get('/VIDEOBANNER.mp4', { headers: { Range: 'bytes=999999999-' } })).status()).toBe(416);
});
