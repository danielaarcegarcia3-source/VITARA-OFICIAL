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
      url: 'assets/3d/low_poly_hospital.glb', size: 7.4, cam: [5.2, 3.6, 8.4],
      titulo: 'Hospital de baja poligonización', mb: '395 KB'
    },
    or: {
      canvas: 'or-canvas', overlay: 'or-overlay', load: 'load-or',
      url: 'assets/3d/hospital_operating_room.glb', size: 6.2, cam: [4.4, 2.8, 7.2],
      titulo: 'Sala de operaciones', mb: '30 MB'
    },
    vr: {
      canvas: 'vr-canvas', overlay: 'vr-overlay', load: 'load-vr',
      url: 'assets/3d/modelodehosipitalvisitaVR3D.glb', size: 6.2, cam: [4.4, 2.8, 7.2],
      titulo: 'Charité · sala de operaciones', mb: '46 MB'
    }
  };

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

    if (!window.THREE || !window.VitaraGLB) {
      mensajeOverlay(overlay, `<div class="empty__ico">${icon('alert', 'i--xl')}</div><h3>No se pudo iniciar el visor</h3><p>La librería 3D no está disponible en este navegador. Los datos y planos siguen funcionando.</p>`);
      return;
    }
    if (btn) { btn.disabled = true; }
    mensajeOverlay(overlay, `<div class="spinner" aria-hidden="true"></div><h3>Cargando ${esc(cfg.titulo)}</h3><p>${esc(cfg.mb)} desde el servidor local. En la red Wi-Fi del evento puede tardar unos segundos.</p>`);

    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
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

      const { group } = await window.VitaraGLB.load(cfg.url);
      // Encuadre por dimensión máxima, sin alterar el eje vertical del edificio.
      let caja = new THREE.Box3().setFromObject(group);
      const centro = caja.getCenter(new THREE.Vector3());
      group.position.sub(centro);
      caja = new THREE.Box3().setFromObject(group);
      const tam = caja.getSize(new THREE.Vector3());
      const max = Math.max(tam.x, tam.y, tam.z) || 1;
      group.scale.multiplyScalar(cfg.size / max);
      caja = new THREE.Box3().setFromObject(group);
      group.position.y -= caja.min.y;
      scene.add(group);

      // Sombra de contacto: disco suave que asienta el modelo en el suelo.
      const sombra = new THREE.Mesh(
        new THREE.CircleGeometry(cfg.size * 0.52, 48),
        new THREE.MeshBasicMaterial({ color: 0x0B7A62, transparent: true, opacity: 0.08, depthWrite: false })
      );
      sombra.rotation.x = -Math.PI / 2;
      sombra.position.y = 0.015;
      scene.add(sombra);

      const orbit = window.VitaraGLB.orbit(group, canvas, { camera, autoRotate: true, rotY: 0.35, zoom: 1 });
      const cont = canvas.parentElement;
      const ajustar = () => {
        const w = cont.clientWidth, h = cont.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      ajustar();
      const ro = new ResizeObserver(ajustar);
      ro.observe(cont);
      const objetivoEscala = cfg.size / max;
      let escalaActual = 0.86;
      const animar = () => {
        requestAnimationFrame(animar);
        const siguiente = escalaActual + (objetivoEscala - escalaActual) * 0.09;
        group.scale.setScalar(siguiente);
        renderer.render(scene, camera);
      };
      animar();

      canvas.dataset.cargado = '1';
      canvas.parentElement?.classList.add('is-listo');
      overlay.hidden = true;
      const zi = document.getElementById(cfg.canvas.replace('canvas', 'zoom-in'));
      const zo = document.getElementById(cfg.canvas.replace('canvas', 'zoom-out'));
      const rs = document.getElementById(cfg.canvas.replace('canvas', 'reset'));
      zi?.addEventListener('click', () => orbit.zoom(1.12));
      zo?.addEventListener('click', () => orbit.zoom(0.9));
      rs?.addEventListener('click', () => orbit.reencuadrar());
      toast(`${cfg.titulo} cargado. Arrastra para girar y usa la rueda para acercar.`);
    } catch (err) {
      console.error('[VITARA] No se pudo cargar el modelo', cfg.url, err);
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
