/** Territorios extruidos desde polígonos GeoJSON, no siluetas dibujadas a mano. */
(function () {
  'use strict';
  const V = window.Vitara;
  const root = document.getElementById('mapa-svg-wrap');
  if (!V || !root) return;
  const COLORS = ['#4eb8b0','#f0bd78','#e78e79','#73bd9d','#6398bd','#abc879'];
  const cache = new Map();
  let renderer, scene, camera, orbit, group, generation = 0, activeMode, selectedName = '', callback;
  let meshes = [], dirty = true, visible = false, frame = 0;
  const norm = text => V.norm(text).replace(/^red /, '');
  const getName = feature => feature.properties.NOMBPROV || feature.properties.NOMBDEP;
  root.innerHTML = `<div class="territory-tools"><span class="territory-mode-label">ATLAS TERRITORIAL · VOLUMEN 3D</span><div><button type="button" data-terrain="3d" aria-pressed="true">3D</button><button type="button" data-terrain="2d" aria-pressed="false">2D accesible</button><button type="button" data-terrain="zoom" aria-label="Acercar territorio">+</button><button type="button" data-terrain="out" aria-label="Alejar territorio">−</button><button type="button" data-terrain="reset">Centrar</button></div></div><div class="territory-stage"><canvas aria-label="Mapa territorial tridimensional. Usa el listado inferior para seleccionar con teclado."></canvas><div class="territory-flat" hidden></div><div class="territory-loading" role="status">Cargando límites territoriales…</div><div class="territory-tooltip" hidden></div><span class="territory-watermark">PERÚ / CONEXIONES QUE CUIDAN</span></div><div class="territory-selection" aria-live="polite"></div><div class="territory-regions" role="group" aria-label="Seleccionar territorio"></div><p class="territory-attribution">Polígonos simplificados: <a href="https://github.com/juaneladio/peru-geojson" target="_blank" rel="noopener noreferrer">peru-geojson · MPL 2.0</a>. Límites de referencia; no cartografía legal actualizada. Colores por territorio, no por stock. La altura es una extrusión visual, no relieve topográfico.</p>`;
  const canvas = root.querySelector('canvas');
  const stage = root.querySelector('.territory-stage');
  const loading = root.querySelector('.territory-loading');
  const tooltip = root.querySelector('.territory-tooltip');
  const flat = root.querySelector('.territory-flat');
  const choose = name => {
    selectedName = name;
    meshes.forEach(mesh => { const selected = norm(mesh.userData.name) === norm(name); mesh.material.emissive.set(selected ? '#234f49' : '#000000'); mesh.material.emissiveIntensity = selected ? .3 : 0; mesh.position.z = selected ? .13 : 0; });
    root.querySelectorAll('[data-region]').forEach(button => button.setAttribute('aria-pressed', String(norm(button.dataset.region) === norm(name))));
    flat.querySelectorAll('[data-region-shape]').forEach(path => path.classList.toggle('is-selected', norm(path.dataset.regionShape) === norm(name)));
    root.querySelector('.territory-selection').textContent = `${activeMode === 'peru' ? 'Departamento' : 'Provincia'} seleccionada: ${name}. ${activeMode === 'peru' && norm(name) === 'la libertad' ? 'Abre La Libertad para explorar sus provincias.' : 'Gira y acerca el mapa o selecciona otro territorio.'}`;
    callback?.(name); dirty = true;
  };
  function init() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
    camera.position.set(0, -7.2, 14);
    window.VitaraGLB.lighting(scene);
    orbit = window.VitaraGLB.orbit(null, canvas, { camera, autoRotate: false });
    orbit.controls.maxPolarAngle = Math.PI; orbit.controls.minDistance = 6;
    orbit.controls.addEventListener('change', () => { dirty = true; });
    new ResizeObserver(resize).observe(stage);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) { resize(); dirty = true; } }).observe(stage);
    function tick() { frame = requestAnimationFrame(tick); if (dirty && visible && !document.hidden && !canvas.hidden && !document.body.classList.contains('access-locked')) { renderer.render(scene, camera); dirty = false; } }
    tick();
  }
  function resize() {
    if (!renderer || !stage.clientWidth || !stage.clientHeight) return;
    renderer.setSize(stage.clientWidth, stage.clientHeight, false);
    camera.aspect = stage.clientWidth / stage.clientHeight; camera.updateProjectionMatrix(); dirty = true;
  }
  async function features(mode) {
    const url = mode === 'peru' ? './assets/geo/peru_departamental_simple.geojson' : './assets/geo/la-libertad-provincias.geojson';
    if (!cache.has(url)) cache.set(url, fetch(url).then(response => { if (!response.ok) throw new Error('GeoJSON no disponible'); return response.json(); }).catch(error => { cache.delete(url); throw error; }));
    return (await cache.get(url)).features;
  }
  function polygons(feature) { return feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [feature.geometry.coordinates]; }
  async function show(mode, selected, onSelect) {
    const id = ++generation; callback = onSelect; selectedName = selected;
    if (activeMode === mode && group) { choose(selected); resize(); return; }
    loading.hidden = false; loading.textContent = 'Cargando polígonos y construyendo volumen…';
    try {
      const list = await features(mode); if (id !== generation) return;
      activeMode = mode;
      const all = list.flatMap(feature => polygons(feature).flatMap(rings => rings.flat()));
      const minX = Math.min(...all.map(p => p[0])), maxX = Math.max(...all.map(p => p[0]));
      const minY = Math.min(...all.map(p => p[1])), maxY = Math.max(...all.map(p => p[1]));
      const cos = Math.cos((minY + maxY) / 2 * Math.PI / 180);
      const scale = 8.3 / Math.max((maxX - minX) * cos, maxY - minY);
      const project = p => [(p[0] - (minX + maxX) / 2) * cos * scale, (p[1] - (minY + maxY) / 2) * scale];
      if (group) { scene.remove(group); window.VitaraGLB.dispose(group); group = null; }
      meshes = [];
      let webgl = true;
      try { init(); } catch (error) { webgl = false; console.warn('[VITARA] Mapa 3D no disponible, usando polígonos 2D.', error); }
      if (webgl) { group = new THREE.Group(); scene.add(group); }
      const svgParts = [];
      list.forEach((feature, index) => {
        const name = getName(feature), color = COLORS[index % COLORS.length];
        for (const rings of polygons(feature)) {
          if (!rings[0]?.length) continue;
          const vertices = rings.map(ring => ring.map(project));
          const commands = vertices.map(ring => 'M' + ring.map(p => `${p[0].toFixed(4)},${(-p[1]).toFixed(4)}`).join('L') + 'Z').join('');
          svgParts.push(`<path d="${commands}" fill="${color}" data-region-shape="${V.esc(name)}" tabindex="0" role="button" aria-label="${V.esc(name)}"/>`);
          if (!webgl) continue;
          const shape = new THREE.Shape(vertices[0].map(p => new THREE.Vector2(...p)));
          vertices.slice(1).forEach(ring => shape.holes.push(new THREE.Path(ring.map(p => new THREE.Vector2(...p)))));
          const geometry = new THREE.ExtrudeGeometry(shape, { depth: mode === 'peru' ? .24 : .34, bevelEnabled: true, bevelSize: .012, bevelThickness: .025, bevelSegments: 1, curveSegments: 1 });
          const material = new THREE.MeshStandardMaterial({ color, metalness: .12, roughness: .55 });
          const mesh = new THREE.Mesh(geometry, material); mesh.userData.name = name;
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), new THREE.LineBasicMaterial({ color: '#e6f9e9', transparent: true, opacity: .55 }));
          mesh.add(edges); meshes.push(mesh); group.add(mesh);
        }
      });
      flat.innerHTML = `<svg class="map-svg" viewBox="-5.3 -5 10.6 10" role="group" aria-label="Polígonos de ${mode === 'peru' ? 'los departamentos del Perú' : 'las provincias de La Libertad'}">${svgParts.join('')}</svg>`;
      flat.querySelectorAll('[data-region-shape]').forEach(path => { const run = () => choose(path.dataset.regionShape); path.addEventListener('click', run); path.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); run(); } }); });
      root.querySelector('.territory-regions').innerHTML = list.map((feature, index) => `<button type="button" data-region="${V.esc(getName(feature))}" aria-pressed="false"><i style="background:${COLORS[index % COLORS.length]}"></i>${V.esc(getName(feature))}</button>`).join('');
      root.querySelectorAll('[data-region]').forEach(button => button.addEventListener('click', () => choose(button.dataset.region)));
      root.querySelector('.territory-mode-label').textContent = mode === 'peru' ? 'PERÚ · DEPARTAMENTOS EN 3D' : 'LA LIBERTAD · PROVINCIAS EN 3D';
      canvas.dataset.regions = String(list.length);
      if (!webgl) { canvas.hidden = true; flat.hidden = false; }
      choose(selected); resize(); loading.hidden = true;
    } catch (error) { loading.textContent = 'No se pudo cargar la cartografía. Puedes seguir consultando las tablas y el atlas de imágenes.'; console.warn(error); }
  }
  root.querySelectorAll('[data-terrain]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.terrain;
    if (action === '3d' || action === '2d') {
      canvas.hidden = action !== '3d'; flat.hidden = action !== '2d';
      root.querySelector('[data-terrain="3d"]').setAttribute('aria-pressed', String(action === '3d'));
      root.querySelector('[data-terrain="2d"]').setAttribute('aria-pressed', String(action === '2d'));
      if (action === '3d' && !renderer) { canvas.hidden = true; flat.hidden = false; loading.hidden = false; loading.textContent = 'WebGL no está disponible. Mostramos los mismos polígonos en 2D.'; }
    } else if (action === 'zoom') orbit?.zoom(1.2); else if (action === 'out') orbit?.zoom(1 / 1.2); else orbit?.reencuadrar();
    resize(); dirty = true;
  }));
  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let down = null;
  function pick(event) { if (!camera) return null; const r = canvas.getBoundingClientRect(); pointer.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(pointer, camera); return ray.intersectObjects(meshes, false)[0]?.object; }
  canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointermove', e => { const hit = pick(e); tooltip.hidden = !hit; if (hit) { tooltip.textContent = hit.userData.name; tooltip.style.left = `${Math.min(stage.clientWidth - 130, e.clientX - canvas.getBoundingClientRect().left + 12)}px`; tooltip.style.top = `${e.clientY - canvas.getBoundingClientRect().top - 30}px`; } });
  canvas.addEventListener('pointerleave', () => { tooltip.hidden = true; });
  canvas.addEventListener('pointerup', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) return; const hit = pick(e); if (hit) choose(hit.userData.name); down = null; });
  canvas.addEventListener('dblclick', e => { if (norm(pick(e)?.userData.name || '') === 'la libertad') document.getElementById('map-btn-ll')?.click(); });
  document.addEventListener('vitara:view', () => { resize(); dirty = true; });
  window.VitaraTerritory = { show };
})();
