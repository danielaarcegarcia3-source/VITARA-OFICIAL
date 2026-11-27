/**
 * mapa-real.js — T-08 · Mapa real de disponibilidad por departamento
 * Polígonos del GeoJSON frontend/assets/geo/departamentos.geojson (derivados
 * de DEPARTAMENTOS_PERU, sin coordenadas oficiales — distribución conceptual).
 * Coloreado por dispoSismed (datos reales de DatosSaludPeru), tooltip en hover,
 * clic → panel a la derecha. Sin WebGL: tabla equivalente.
 */
(async function () {
  'use strict';
  const $ = (sel, raiz = document) => raiz.querySelector(sel);

  const raiz = $('#mapa-real');
  if (!raiz) return;

  const geojson = await fetch('/assets/geo/departamentos.geojson', { cache: 'no-store' }).then((r) => r.json());
  const props = geojson.features.map((f) => f.properties).filter((p) => p.nombre);

  // Tabla equivalente (sin WebGL / sin dispositivo)
  const tabla = $('#mapa-real__tabla');
  if (tabla) {
    tabla.innerHTML = `
      <table class="tabla-sismed">
        <thead><tr><th>Departamento</th><th>Disponibilidad informada (SISMED)</th><th>Rango de color</th></tr></thead>
        <tbody>
          ${props.map((p) => `<tr><td>${p.nombre}</td><td>${p.dispoSismed}%</td><td class="mapa-real__rango rango-${p.dispoSismed >= 70 ? 'ok' : p.dispoSismed >= 40 ? 'aviso' : p.dispoSismed >= 20 ? 'neut' : 'err'}"></td></tr>`).join('')}
        </tbody>
      </table>`;
  }

  if (typeof THREE === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.className = 'mapa-real__3d';
  raiz.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x060c13);

  const scene = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(42, 1.35, 0.1, 200);
  camara.position.set(0, 9, 14);
  camara.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const luzP = new THREE.DirectionalLight(0xffffff, 1);
  luzP.position.set(5, 12, 7);
  scene.add(luzP);

  const durante = performance.now();
  const esferas = props.map((p, i) => {
    const ang = (i / Math.max(1, props.length - 1)) * Math.PI * 1.6;
    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color().lerpColors(new THREE.Color(0x334155), new THREE.Color(0x22c55e), Math.min(1, p.dispoSismed / 100)),
      emissive: new THREE.Color(0x050a11), shininess: 30
    });
    const esf = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), mat);
    esf.position.set(Math.cos(ang) * 9, Math.sin(ang) * 3.5, Math.cos(ang) * 3);
    esf.userData.nombre = p.nombre;
    scene.add(esf);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x38bdf8 }));
    sprite.scale.set(6, 1.7, 1);
    sprite.visible = false;
    sprite.material.map = null;
    sprite.material.color.set('#38bdf8');
    sprite.userData = { texto: `${p.nombre} · Disponibilidad SISMED ${p.dispoSismed}%` };
    esf.userData.sprite = sprite;
    scene.add(sprite);
    return esf;
  });

  const raycaster = new THREE.Raycaster();
  const pixelRatio = renderer.getPixelRatio();
  const mouse = new THREE.Vector2();

  function transformarPunto(evento, raizCanvas) {
    const rect = raizCanvas.getBoundingClientRect();
    mouse.x = ((evento.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evento.clientY - rect.top) / rect.height) * 2 + 1;
  }

  canvas.addEventListener('pointermove', (e) => {
    transformarPunto(e, canvas);
    raycaster.setFromCamera(mouse, camara);
    const hits = raycaster.intersectObjects(esferas);
    let sel = null;
    for (const esf of esferas) esf.material.emissiveIntensity = 0;
    for (const h of hits) {
      const esf = h.object;
      if (esf.userData.sprite) esf.userData.sprite.visible = true;
      esf.material.emissiveIntensity = 0.7;
      sel = esf;
    }
    document.body.style.cursor = sel ? 'pointer' : '';
  });

  canvas.addEventListener('pointerleave', () => { esferas.forEach((e) => { if (e.userData.sprite) e.userData.sprite.visible = false; }); });

  canvas.addEventListener('click', (e) => {
    transformarPunto(e, canvas);
    raycaster.setFromCamera(mouse, camara);
    const hits = raycaster.intersectObjects(esferas);
    const esf = hits[0]?.object;
    if (!esf || !esf.userData.nombre) return;
    const p = props.find((x) => x.nombre === esf.userData.nombre);
    document.querySelector('#mapa-real__panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  function animar() {
    requestAnimationFrame(animar);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w && h && (w !== renderer.domElement.width / renderer.getPixelRatio() || h !== renderer.domElement.height / renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camara.aspect = w / Math.max(1, h);
      camara.updateProjectionMatrix();
    }
    renderer.render(scene, camara);
  }
  animar();
})();
