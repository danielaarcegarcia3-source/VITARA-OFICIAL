/** Atlas de activos originales. No coloca coordenadas sobre imágenes sin georreferencia. */
(function () {
  'use strict';
  const V = window.Vitara;
  const root = document.getElementById('mapa-real');
  if (!V || !root) return;
  const { esc } = V;
  const places = V.D.ipress || [];
  let mode = 'peru', zoom = 1, x = 0, y = 0;
  root.innerHTML = `<div class="atlas-toolbar"><div class="seg"><button type="button" data-atlas="peru" aria-pressed="true">Perú</button><button type="button" data-atlas="ll" aria-pressed="false">La Libertad</button></div><div class="atlas-zoom"><button type="button" data-zoom="in" aria-label="Acercar mapa">+</button><button type="button" data-zoom="out" aria-label="Alejar mapa">−</button><button type="button" data-zoom="reset">Reencuadrar</button></div></div>
  <div class="atlas-layout"><div class="atlas-image" tabindex="0" role="region" aria-label="Ilustración territorial. Arrastra para inspeccionar; usa más y menos para zoom."><img src="./mapadelperu3d.png" alt="Mapa ilustrado 3D del Perú" draggable="false"><span>ILUSTRACIÓN ORIGINAL · NO GEORREFERENCIADA</span></div>
  <aside class="atlas-directory"><h3>Establecimientos en la base local</h3><label for="atlas-district">Distrito</label><select id="atlas-district"><option value="">Todos los distritos</option>${[...new Set(places.map(p => p.distrito).filter(Boolean))].sort().map(d => `<option>${esc(d)}</option>`).join('')}</select><label for="atlas-type">Tipo de establecimiento</label><select id="atlas-type"><option value="">Todos los tipos</option><option value="hospital">Hospitales</option><option value="centro">Centros de salud</option><option value="posta">Puestos de salud</option></select><p class="source">Directorio local · no equivale a cobertura completa ni stock en tiempo real.</p><div id="atlas-results" aria-live="polite"></div></aside></div>`;
  const image = root.querySelector('.atlas-image img');
  const stage = image.parentElement;
  function transform() { image.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`; }
  function scale(factor) { zoom = Math.max(1, Math.min(3, zoom * factor)); if (zoom === 1) x = y = 0; transform(); }
  root.querySelectorAll('[data-atlas]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.atlas;
    root.querySelectorAll('[data-atlas]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    image.src = mode === 'll' ? './MAPADELALIBERTAD3D.png' : './mapadelperu3d.png';
    image.alt = mode === 'll' ? 'Mapa ilustrado 3D de La Libertad' : 'Mapa ilustrado 3D del Perú';
    zoom = 1; x = y = 0; transform();
  }));
  root.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.zoom === 'reset') { zoom = 1; x = y = 0; transform(); }
    else scale(button.dataset.zoom === 'in' ? 1.2 : 1 / 1.2);
  }));
  stage.addEventListener('keydown', e => {
    if (['+', '=', '-'].includes(e.key)) { e.preventDefault(); scale(e.key === '-' ? 1 / 1.2 : 1.2); }
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      x += e.key === 'ArrowLeft' ? 20 : e.key === 'ArrowRight' ? -20 : 0;
      y += e.key === 'ArrowUp' ? 20 : e.key === 'ArrowDown' ? -20 : 0;
      transform();
    }
  });
  let drag;
  stage.addEventListener('pointerdown', e => { drag = [e.clientX - x, e.clientY - y]; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => { if (!drag) return; x = Math.max(-stage.clientWidth, Math.min(stage.clientWidth, e.clientX - drag[0])); y = Math.max(-stage.clientHeight, Math.min(stage.clientHeight, e.clientY - drag[1])); transform(); });
  stage.addEventListener('pointerup', () => { drag = null; });
  stage.addEventListener('pointercancel', () => { drag = null; });
  function directory() {
    const district = root.querySelector('#atlas-district').value;
    const type = root.querySelector('#atlas-type').value;
    const list = places.filter(p => (!district || district === p.distrito) && (!type || (type === 'hospital' ? /HOSPITAL/i.test(p.nombre) : type === 'centro' ? /^C\.S\./i.test(p.nombre) : /^P\.S\./i.test(p.nombre))));
    root.querySelector('#atlas-results').innerHTML = list.length ? list.map(p => `<button class="atlas-place" type="button" data-place="${esc(p.cod)}"><strong>${esc(p.nombre)}</strong><span>${esc(p.distrito)} · ${esc(p.categoria)} <b>↗</b></span></button>`).join('') : '<p class="empty">No hay establecimientos de este tipo en el distrito seleccionado.</p>';
    root.querySelectorAll('[data-place]').forEach(button => button.addEventListener('click', () => {
      const p = places.find(p => p.cod === button.dataset.place);
      if (!p) return;
      V.abrirInspector('Directorio territorial', `<h3>${esc(p.nombre)}</h3><dl class="kv"><dt>Distrito</dt><dd>${esc(p.distrito)}</dd><dt>Categoría</dt><dd>${esc(p.categoria)}</dd><dt>Horario registrado</dt><dd>${esc(p.horario || 'Sin información')}</dd><dt>Teléfono registrado</dt><dd>${esc(p.telefono || 'Sin información')}</dd></dl><p>Confirma en la sede antes de desplazarte.</p><p class="source">${esc(V.SRC.renipress.texto)} · ${esc(V.SRC.renipress.fecha)}</p>`);
    }));
  }
  root.querySelectorAll('select').forEach(select => select.addEventListener('change', directory));
  directory();
  V.onView('mapas', () => requestAnimationFrame(() => window.dispatchEvent(new Event('resize'))));
})();
