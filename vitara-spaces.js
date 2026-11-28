/**
 * vitara-spaces.js — planos, ambientes, equipamiento y visores 3D
 * Los modelos se cargan solo cuando la persona lo pide. Nada se descarga en
 * segundo plano para no consumir la red local del evento.
 */
(function () {
  'use strict';
  const V = window.Vitara;
  if (!V) return;
  const { D, esc, num, icon, source, SRC, $, toast } = V;

  const AMBIENTES = [
    { n: 'Farmacia y cadena de frío', m: '8.0 × 4.0 m', a: '32.0 m²', c: '#CDEBDA', d: 'Refrigerador +2 a +8 °C y registro diario de temperatura.' },
    { n: 'Consultorio general', m: '4.0 × 4.0 m', a: '16.0 m²', c: '#D4E4FA', d: 'Camilla, escritorio, lavamanos y punto de telesalud.' },
    { n: 'Sala de espera', m: '3.5 × 3.5 m', a: '12.25 m²', c: '#F5E2BC', d: 'Espera con circulación libre y rampa de acceso universal.' },
    { n: 'Telesalud', m: '2.5 × 3.0 m', a: '7.5 m²', c: '#C8EDE7', d: 'Cabina con privacidad acústica y conexión a la Red Nacional de Telesalud.' },
    { n: 'Sala de equipos', m: '2.5 × 3.0 m', a: '7.5 m²', c: '#E1D9F7', d: 'Carga y resguardo de equipos biomédicos portátiles.' },
    { n: 'Patio exterior', m: '6.0 × 6.0 m', a: '36.0 m²', c: '#E4EAE6', d: 'Acceso, triaje visual y circulación de ambulancia.' }
  ];

  /* ================= VISORES GLB ================= */
  const VISORES = {
    hospital: {
      canvas: 'hospital-canvas', overlay: 'hospital-overlay', load: 'load-hospital',
      key: 'hospital', url: './low_poly_hospital.glb', size: 7.4, cam: [5.2, 3.6, 8.4],
      titulo: 'Hospital de baja poligonización', mb: '395 KB'
    },
    or: {
      canvas: 'or-canvas', overlay: 'or-overlay', load: 'load-or',
      key: 'operatingRoom', url: './hospital_operating_room.glb', size: 6.2, cam: [4.93, 3.14, 8.06],
      titulo: 'Sala de operaciones', mb: '30.7 MB'
    },
    vr: {
      canvas: 'vr-canvas', overlay: 'vr-overlay', load: 'load-vr',
      key: 'hospitalRoom', url: './modelodehosipitalvisitaVR3D.glb', size: 6.2, cam: [3.6, 2.3, 5.8],
      titulo: 'Quirófano Charité · recorrido educativo', mb: '46.6 MB'
    }
  };

  document.querySelectorAll('.viewer3d').forEach(viewer => {
    const wrapper = document.createElement('div'); wrapper.className = 'scene-block';
    viewer.before(wrapper); wrapper.append(viewer);
  });

  function mensajeOverlay(overlay, html) {
    if (!overlay) return;
    overlay.hidden = false;
    overlay.innerHTML = html;
  }

  async function cargarVisor(cfg) {
    const canvas = document.getElementById(cfg.canvas);
    const overlay = document.getElementById(cfg.overlay);
    const btn = document.getElementById(cfg.load);
    if (!canvas || !overlay) return;
    if (canvas.dataset.cargado === '1') return;
    if (canvas.dataset.cargando === '1') return;
    canvas.dataset.cargando = '1';
    try {
      const manifest = await fetch('./assets-manifest.json', { cache: 'no-cache' }).then(r => r.json());
      cfg.url = manifest.models[cfg.key]?.url || cfg.url;
    } catch { /* Use the known existing model when the manifest cannot be read. */ }
    if (!cfg.url) {
      canvas.dataset.cargando = '';
      mensajeOverlay(overlay, `<h3>Modelo pendiente de incorporar</h3><p>El archivo de ${esc(cfg.titulo)} no existe en este repositorio. Añade el modelo con sus texturas a 3d-models/ y registra su ruta en assets-manifest.json. El plano y las fichas siguen disponibles.</p>`);
      return;
    }

    if (!window.THREE || !window.VitaraGLB) {
      canvas.dataset.cargando = '';
      mensajeOverlay(overlay, `<div class="empty__ico">${icon('alert', 'i--xl')}</div><h3>No se pudo iniciar el visor</h3><p>La librería 3D no está disponible en este navegador. Los datos y planos siguen funcionando.</p>`);
      return;
    }
    if (btn) { btn.disabled = true; }
    mensajeOverlay(overlay, `<div class="spinner" aria-hidden="true"></div><h3>Cargando ${esc(cfg.titulo)}</h3><p>${esc(cfg.mb)} · conservamos geometría y texturas originales.</p><span class="model-load-progress" role="status">Iniciando descarga…</span>`);

    let renderer = null;
    let annotations = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
      camera.position.set(cfg.cam[0], cfg.cam[1], cfg.cam[2]);
      camera.lookAt(0, 0.4, 0);

      scene.add(new THREE.HemisphereLight(0xffffff, 0xD9EAE1, 1.7));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(5, 9, 6);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xCFE6FF, 1.1);
      fill.position.set(-6, 3, -4);
      scene.add(fill);
      const rim = new THREE.PointLight(0x2BB7A8, 18, 30, 2);
      rim.position.set(-3, 2, 5);
      scene.add(rim);

      let result;
      try { result = await window.VitaraGLB.load(cfg.url, event => {
        const progress = overlay.querySelector('.model-load-progress');
        if (progress) { progress.textContent = event.total ? `${Math.round(event.loaded / event.total * 100)} % · ${(event.loaded / 1000000).toFixed(1)} MB` : `${(event.loaded / 1000000).toFixed(1)} MB descargados`; }
      }); }
      catch (error) {
        if (cfg.key !== 'hospital') throw error;
        result = await window.VitaraGLB.load('./scene.gltf');
      }
      const { group } = result;
      const fitted = window.VitaraGLB.fitToHeight(group, cfg.size, { orientar: false });
      scene.add(fitted);
      scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      const orbit = window.VitaraGLB.orbit(fitted, canvas, { camera, autoRotate: false });
      annotations = window.VitaraHotspots.attach({ container: canvas.parentElement, model: fitted, camera, orbit, type: cfg.canvas.split('-')[0] });
      let visible = true;
      const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
      visibility.observe(canvas);
      let dirty = true;
      orbit.controls.addEventListener('change', () => { dirty = true; });
      const cont = canvas.parentElement;
      const ajustar = () => {
        const w = cont.clientWidth, h = cont.clientHeight;
        if (!w || !h) return;
        dirty = true;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      ajustar();
      const ro = new ResizeObserver(ajustar);
      ro.observe(cont);
      let lastFrame = 0;
      const animar = (time = 0) => {
        requestAnimationFrame(animar);
        if (!visible || document.hidden || !canvas.getClientRects().length || document.body.classList.contains('access-locked') || time - lastFrame < 33) return;
        lastFrame = time;
        const moving = annotations.update();
        if (dirty || moving) { renderer.render(scene, camera); dirty = false; }
      };
      animar();

      canvas.dataset.cargando = '';
      canvas.dataset.cargado = '1';
      canvas.parentElement?.classList.add('is-listo');
      overlay.hidden = true;
      const zi = document.getElementById(cfg.canvas.replace('canvas', 'zoom-in'));
      const zo = document.getElementById(cfg.canvas.replace('canvas', 'zoom-out'));
      const rs = document.getElementById(cfg.canvas.replace('canvas', 'reset'));
      zi?.addEventListener('click', () => orbit.zoom(1.12));
      zo?.addEventListener('click', () => orbit.zoom(0.9));
      rs?.addEventListener('click', () => { annotations.close(); orbit.reencuadrar(); });
      const rotate = document.createElement('button'); rotate.type = 'button'; rotate.className = 'stage-btn';
      rotate.innerHTML = icon('rotate', 'i--sm'); rotate.setAttribute('aria-label', 'Activar rotación automática'); rotate.setAttribute('aria-pressed', 'false');
      rotate.addEventListener('click', () => { const active = rotate.getAttribute('aria-pressed') !== 'true'; rotate.setAttribute('aria-pressed', String(active)); orbit.setAutoRotate(active); });
      canvas.parentElement.querySelector('.viewer3d__tools').prepend(rotate);
      document.dispatchEvent(new CustomEvent('vitara:model-ready', { detail: { id: cfg.canvas } }));
      toast(`${cfg.titulo} cargado. Arrastra para girar y usa la rueda para acercar.`);
    } catch (err) {
      console.error('[VITARA] No se pudo cargar el modelo', cfg.url, err);
      canvas.dataset.cargando = '';
      annotations?.dispose();
      try { renderer?.dispose(); } catch (_) {}
      mensajeOverlay(overlay, `<div class="empty__ico">${icon('alert', 'i--xl')}</div>
        <h3>No se pudo cargar el modelo</h3>
        <p>El archivo ${esc(cfg.mb)} no está disponible o el navegador no pudo leerlo. No mostramos un modelo falso.</p>
        <button class="btn btn--ghost btn--sm" type="button" data-retry="${esc(cfg.canvas)}">Reintentar</button>`);
      overlay.querySelector('[data-retry]')?.addEventListener('click', () => {
        canvas.dataset.cargado = '';
        cargarVisor(cfg);
      });
      if (btn) { btn.disabled = false; btn.innerHTML = `${icon('rotate', 'i--sm')} Reintentar carga`; }
    }
  }

  function initPlanos() {
    const list = $('#amb-list');
    if (list && !list.dataset.lleno) {
      list.dataset.lleno = '1';
      list.innerHTML = AMBIENTES.map((a) => `<div class="amb-row"><span class="amb-row__sw" style="background:${a.c}"></span><span><strong>${esc(a.n)}</strong><small>${esc(a.d)}</small></span><span>${esc(a.m)}<br>${esc(a.a)}</span></div>`).join('');
    }
    Object.values(VISORES).forEach((cfg) => {
      const btn = document.getElementById(cfg.load);
      if (btn && !btn.dataset.bind) {
        btn.dataset.bind = '1';
        btn.addEventListener('click', () => cargarVisor(cfg));
      }
    });
  }

  /* ================= EQUIPAMIENTO ================= */
  const CRIT_CLASS = { ALTA: 'tag--err', MEDIA: 'tag--warn', BAJA: 'tag--grey' };

  function fichaEquipo(e) {
    V.abrirInspector('Equipo biomédico', `
      <div class="inspector-card"><h4>${esc(e.nombre)}</h4><p>${esc(e.servicio)}</p></div>
      <dl class="kv"><dt>Criticidad</dt><dd>${esc(e.criticidad)}</dd><dt>Marca común</dt><dd>${esc(e.marcaComun)}</dd><dt>Vida útil</dt><dd>${esc(e.vidaUtilAnos)} años</dd><dt>Mantenimiento</dt><dd>${esc(e.protocoloMantenimiento)}</dd><dt>Código de catálogo</dt><dd>${esc(e.codigoIETSI)}</dd></dl>
      <div class="inspector-card"><h4>Falla acreditada</h4><p>${esc(e.fallaAcreditada)}</p></div>
      <p class="source">${esc(SRC.contraloria.texto)} · ${esc(SRC.contraloria.fecha)}. El estado puede cambiar: confirma en la sede antes de desplazarte.</p>`);
  }

  function initEquipos() {
    const cont = $('#equip-grid');
    if (cont && !cont.dataset.lleno) {
      cont.dataset.lleno = '1';
      cont.innerHTML = (D.equiposBiomedicos || []).map((e, i) => `<article class="equip">
        <div class="equip__top"><h3>${esc(e.nombre)}</h3><span class="tag ${CRIT_CLASS[e.criticidad] || 'tag--grey'}">${esc(e.criticidad)}</span></div>
        <p>${esc(e.servicio)}</p>
        <p><strong>Falla documentada:</strong> ${esc(e.fallaAcreditada)}</p>
        <p class="equip__foot">Mantenimiento ${esc(e.protocoloMantenimiento)} · vida útil ${esc(e.vidaUtilAnos)} años</p>
        <button class="btn btn--ghost btn--sm" type="button" data-equipo="${i}">Ver ficha ${icon('arrow-right', 'i--sm')}</button>
      </article>`).join('');
      cont.querySelectorAll('[data-equipo]').forEach((b) => b.addEventListener('click', () => fichaEquipo(D.equiposBiomedicos[Number(b.dataset.equipo)])));
    }
    const cfg = VISORES.or;
    const btn = document.getElementById(cfg.load);
    if (btn && !btn.dataset.bind) {
      btn.dataset.bind = '1';
      btn.addEventListener('click', () => cargarVisor(cfg));
    }
  }

  V.onView('planos', initPlanos);
  V.onView('equipos', initEquipos);
})();
