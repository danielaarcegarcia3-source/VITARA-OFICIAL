/**
 * adn-interactivo.js — T-07 · ADN 3D interactivo con canales de ayuda
 * Hélice doble procedural, bases nitrogenadas (A/T/C/G), rotación en reposo
 * (respeta prefers-reduced-motion), hotspots pulsantes (uno por canal real)
 * que abren la tarjeta del canal en #canales-vista. Rótulo permanente:
 * modelo ilustrativo.
 */
(async function () {
  'use strict';
  const $ = (sel, raiz = document) => raiz.querySelector(sel);

  const raiz = $('#adn-real');
  const canvas = $('#adn-real__canvas');
  if (!raiz || !canvas) return;

  /* Puntos de referencia: equipos médicos (T-07: botones que abren fichas) */
  const panelEquipos = $('#adn-equipos');
  if (panelEquipos) {
    const equipos = window.DatosSaludPeru?.equiposMedicos || [];
    panelEquipos.innerHTML = `
      <h3 class="adn-equipos__titulo">Equipos Médicos · Punto de Referencia</h3>
      <p class="adn-equipos__fe">Verificados por NTS N° 110-MINSA · ${equipos.length} equipos representativos</p>
      <ul class="adn-equipos__lista">
        ${equipos.map((e) => `
        <li>
          <strong>${e.nombre}</strong>
          <span class="adn-equipos__cat">${e.categoria}</span>
          <span class="adn-equipos__est">${e.estado}</span>
          ${e.falla ? `<span class="adn-equipos__fb">${e.falla}</span>` : ''}
          <button class="adn-equipos__boton" data-equipo="${e.id}" type="button">Detalle & Ficha</button>
        </li>`).join('')}
      </ul>`;
    panelEquipos.querySelectorAll('.adn-equipos__boton').forEach((b) => b.addEventListener('click', () => {
      b.dispatchEvent(new CustomEvent('g3:open-equipo', { detail: b.dataset.equipo, bubbles: true }));
    }));
  }
  if (typeof THREE === 'undefined') return;

  const canales = (window.DatosSaludPeru?.canalesAyuda || []).slice(0, 9);
  const hotspots = [
    ...canales.map((c) => ({ id: `hotspot:canal:${c.id}`, nombre: c.nombre })),
    { id: 'hotspot:canal:telemetria', nombre: 'Pulso en vivo · disponibilidad' },
    { id: 'hotspot:canal:sesion-g3', nombre: 'Solicitudes con código G3-XXXXXX' }
  ];

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x050a11);

  const scene = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(50, 1.4, 0.1, 30);
  camara.position.set(0, 2.5, 12);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const luzP = new THREE.DirectionalLight(0x9fe2ff, 1.2);
  luzP.position.set(5, 8, 4);
  scene.add(luzP);

  // Plataforma reflectante
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(9.2, 9.2, 0.3, 16),
    new THREE.MeshPhongMaterial({ color: 0x0f1b2e, emissive: 0x050a11 })
  );
  platform.rotation.x = -Math.PI / 2;
  scene.add(platform);

  // Carga del modelo GLB del equipo de Blender (si está disponible)
  try {
    const GltfLoader = THREE.GLTFLoader;
    if (GltfLoader && canvas.dataset.gltf) {
      const loader = new GltfLoader();
      const gltf = await loader.loadAsync(canvas.dataset.gltf);
      if (gltf.scene) {
        gltf.scene.traverse((o) => {
          if (o.isMesh || o.isSprite) {
            o.material = new THREE.MeshPhongMaterial({ color: 0xe8386d, transparent: true, opacity: 0.95 });
            o.visible = true;
          }
        });
        scene.add(gltf.scene);
      }
    }
  } catch (e) {
    /* fallback procedural sin interrupción */
  }

  // Hélice doble: bases A/T/C/G en pares, strand +/−
  const BASES = ['A', 'T', 'C', 'G'];
  const OFFSET = { A: 0.35, T: -0.35, C: 0.9, G: -0.9 };
  const COLORES = { A: 0xe11d48, T: 0xdb2777, C: 0x7c3aed, G: 0x0891b2 };
  const N = 34; // pares de bases

  function crearStrand(signo) {
    const grupo = new THREE.Group();
    for (let i = 0; i < N; i++) {
      const ang = signo * (i / N) * Math.PI * 2 * 1.05;
      const y = (i / N) * 2 - 6;
      for (const base of BASES) {
        const esf = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 8),
          new THREE.MeshPhongMaterial({ color: COLORES[base], transparent: true, opacity: 0.95 })
        );
        esf.position.set(
          Math.cos(ang) * 2.6 + Math.cos(ang) * OFFSET[base] * 0.8,
          y + 0.02,
          Math.sin(ang) * 2.6 + Math.sin(ang) * OFFSET[base] * 0.8
        );
        scene.add(esf);
      }
    }
    scene.add(grupo);
    return grupo;
  }
  crearStrand(1);
  crearStrand(-1);

  // Hotspots pulsantes (uno por canal real + 2 extras)
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const objetos = [];
  hotspots.forEach((h, i) => {
    const ang = ((i % 12) / 12) * Math.PI * 2 * 1.5;
    const esf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), new THREE.MeshPhongMaterial({ color: 0x38bdf8, emissive: 0x082f4c }));
    esf.position.set(Math.cos(ang) * 6, Math.sin(ang) * 5, ((i * 2) % 7) - 3);
    esf.userData = { id: h.id, nombre: h.nombre };
    scene.add(esf);
    objetos.push(esf);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x38bdf8 }));
    sprite.scale.set(7, 2, 1);
    sprite.position.set(esf.position.x, esf.position.y + 0.7, esf.position.z);
    sprite.visible = false;
    esf.userData.sprite = sprite;
    scene.add(sprite);
  });

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function transformar(evento) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((evento.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evento.clientY - rect.top) / rect.height) * 2 + 1;
  }

  canvas.addEventListener('pointermove', (e) => {
    transformar(e);
    raycaster.setFromCamera(mouse, camara);
    const hits = raycaster.intersectObjects(objetos);
    objetos.forEach((o) => { if (o.userData.sprite) o.userData.sprite.visible = false; });
    for (const h of hits) h.object.userData.sprite.visible = true;
  });
  canvas.addEventListener('pointerleave', () => objetos.forEach((o) => { if (o.userData.sprite) o.userData.sprite.visible = false; }));

  canvas.addEventListener('click', (e) => {
    transformar(e);
    raycaster.setFromCamera(mouse, camara);
    const esf = raycaster.intersectObjects(objetos)[0]?.object;
    if (!esf?.userData?.nombre) return;
    const link = $('#canales-vista');
    if (link) { link.scrollIntoView({ behavior: 'smooth', block: 'start' }); link.setAttribute('data-hot', esf.userData.id); }
  });

  const t0 = performance.now();
  function animar() {
    requestAnimationFrame(animar);
    if (!reduce) {
      const t = (performance.now() - t0) * 0.0004;
      scene.children.forEach((c) => {
        if (c.isGroup) c.children.forEach((esf) => { esf.rotateZ(0.012); });
      });
      objetos.forEach((o) => { o.position.y += Math.sin(t * 3 + o.userData.id.length) * 0.06; });
    }
    renderer.render(scene, camara);
  }
  animar();
})();
