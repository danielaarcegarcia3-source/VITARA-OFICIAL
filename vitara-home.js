/**
 * vitara-home.js — hélice de ADN 3D, dianas moleculares y panel lateral.
 * Usa el GLB local y, si no está disponible, construye una hélice ilustrativa.
 */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);

  const TARGETS = [
    {
      id: 'pbp',
      n: '01',
      label: 'PBP · pared bacteriana',
      title: 'PBP · Transpeptidasa bacteriana',
      mechanism: 'La enzima PBP entrecruza el peptidoglicano de la pared bacteriana. Los betalactámicos se unen a ella e impiden ese entrecruzamiento; la bacteria pierde resistencia osmótica y se lisa.',
      clinical: 'Diana de referencia para amoxicilina y bencilpenicilina en infecciones respiratorias y odontológicas atendidas en el primer nivel. La prescripción siempre corresponde a un profesional de salud.',
      link: 'Amoxicilina 500 mg',
      query: 'amoxicilina',
      source: 'IETSI · DIGEMID · base local',
      note: 'Diana ilustrativa. No representa un fármaco real ni una recomendación de tratamiento.'
    },
    {
      id: 'cox2',
      n: '02',
      label: 'COX-2 · fiebre y dolor',
      title: 'COX-2 · ciclooxigenasa inflamatoria',
      mechanism: 'La COX-2 convierte el ácido araquidónico en prostaglandinas que median fiebre, dolor e inflamación. Su inhibición reduce esos mediadores sin bloquear por completo la protección gástrica.',
      clinical: 'Diana asociada al paracetamol en el manejo sintomático de fiebre y dolor. En dengue, el paracetamol es el antipirético de referencia; los antiinflamatorios requieren valoración médica.',
      link: 'Paracetamol 500 mg',
      query: 'paracetamol',
      source: 'MINSA · guía dengue · base local',
      note: 'El modelo no evalúa eficacia clínica ni sustituye la consulta médica.'
    },
    {
      id: 'denv',
      n: '03',
      label: 'DENV NS1 · diagnóstico',
      title: 'DENV NS1 · antígeno viral',
      mechanism: 'La proteína no estructural NS1 circula en los primeros días de la infección por dengue. Las pruebas rápidas la detectan para orientar el diagnóstico temprano y activar la vigilancia.',
      clinical: 'Un resultado positivo no define por sí solo la gravedad. La hidratación y los signos de alarma se evalúan en la sede; el suero fisiológico y las sales de rehidratación son insumos críticos del kit dengue.',
      link: 'Kit dengue · prueba NS1',
      query: 'dengue',
      source: 'InfoSismedLL · MINSA/CDC · corte 31/10/2026',
      note: 'Ilustración del antígeno. No es un test real ni reemplaza una prueba de laboratorio.'
    },
    {
      id: 'arnm',
      n: '04',
      label: 'ARNm · cadena de frío',
      title: 'Plataforma ARNm · inmunógenos',
      mechanism: 'El ARN mensajero entrega instrucciones temporales para que la célula produzca un antígeno y active la respuesta inmune. Su estabilidad depende de una cadena de frío controlada.',
      clinical: 'La vacunación y los biológicos regulados requieren refrigeración entre +2 °C y +8 °C. La farmacia de la posta registra la temperatura y la sede confirma la disponibilidad antes de citar.',
      link: 'Cadena de frío · +2 a +8 °C',
      query: 'vacuna',
      source: 'MINSA · IETSI · base local',
      note: 'Esquema conceptual. No representa una vacuna específica ni un lote autorizado.'
    },
    {
      id: 'hmg',
      n: '05',
      label: 'HMG-CoA · colesterol',
      title: 'HMG-CoA reductasa hepática',
      mechanism: 'La HMG-CoA reductasa es el paso limitante de la síntesis de colesterol. Las estatinas la inhiben y aumentan la captación hepática de LDL.',
      clinical: 'Diana de atorvastatina para prevención cardiovascular. La comparación de precios es una referencia: el genérico puede costar una fracción del de marca, pero el mes de corte no siempre está publicado en la base local.',
      link: 'Atorvastatina 20 mg',
      query: 'atorvastatina',
      source: 'DIGEMID/OPP · estudio IDL · base local',
      note: 'Precio de referencia, no cotización. La adherencia y la dosis las define el profesional tratante.'
    }
  ];

  const state = {
    renderer: null,
    scene: null,
    camera: null,
    pivot: null,
    model: null,
    orbit: null,
    unzip: 0,
    unzipTarget: 0,
    meshes: [],
    rings: [],
    particles: null,
    fallback: false,
    ready: false,
    hover: false,
    modelEscala: 1,
    raf: 0,
    selected: null,
    resizeObserver: null
  };

  function actualizarPanel(id) {
    const panel = $('#dna-panel');
    const hero = $('#home-hero');
    if (!panel || !hero) return;
    const t = TARGETS.find((x) => x.id === id);
    if (!t) return;
    state.selected = id;
    document.querySelectorAll('.dna-target').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.target === id)));
    panel.innerHTML = `
      <div class="dna-panel__head">
        <div><p class="dna-panel__n">Diana ${t.n} · modelo ilustrativo</p><h3>${t.title}</h3></div>
        <button class="dna-panel__close" type="button" id="dna-panel-close" aria-label="Cerrar información de la diana"><svg class="i i--sm"><use href="#i-close"/></svg></button>
      </div>
      <div class="dna-panel__body">
        <div><p class="dna-panel__k">Mecanismo</p><p>${t.mechanism}</p></div>
        <div><p class="dna-panel__k">Relevancia en la posta</p><p>${t.clinical}</p></div>
        <div><p class="dna-panel__k">Recurso relacionado</p><p><strong>${t.link}</strong></p><span class="source">${t.source}</span></div>
        <div class="dna-panel__actions">
          <button class="btn btn--primary btn--sm" type="button" data-dna-go="buscar" data-dna-query="${t.query}">Buscar «${t.link}» <svg class="i i--sm"><use href="#i-arrow-right"/></svg></button>
          <button class="btn btn--ghost btn--sm" type="button" data-dna-go="solicitudes" data-dna-query="${t.link}">Solicitar verificación en una sede</button>
        </div>
        <p class="dna-panel__note">${t.note}</p>
      </div>`;
    panel.hidden = false;
    hero.classList.add('is-panel');
    $('#dna-panel-close')?.addEventListener('click', cerrarPanel);
    panel.querySelectorAll('[data-dna-go]').forEach((b) => {
      b.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('vitara:go', { detail: { view: b.dataset.dnaGo, query: b.dataset.dnaQuery } }));
      });
    });
    // En pantallas estrechas, bajamos suavemente hasta el panel.
    if (window.matchMedia('(max-width: 1180px)').matches) {
      setTimeout(() => panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
    }
  }

  function cerrarPanel() {
    const panel = $('#dna-panel');
    const hero = $('#home-hero');
    if (!panel || !hero) return;
    panel.hidden = true;
    hero.classList.remove('is-panel');
    state.selected = null;
    document.querySelectorAll('.dna-target').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  }

  function renderTargets() {
    const cont = $('#dna-targets');
    if (!cont) return;
    cont.innerHTML = TARGETS.map((t) => `
      <button class="dna-target" type="button" data-target="${t.id}" aria-pressed="false" aria-controls="dna-panel">
        <span class="dna-target__n">${t.n}</span><span>${t.label}</span><span class="dna-target__dot" aria-hidden="true"></span>
      </button>`).join('');
    cont.addEventListener('click', (e) => {
      const b = e.target.closest('[data-target]');
      if (!b) return;
      if (state.selected === b.dataset.target) cerrarPanel();
      else actualizarPanel(b.dataset.target);
    });
  }

  function materialPorNombre(nombre) {
    const n = nombre.toLowerCase();
    const base = { roughness: 0.38, metalness: 0.03, emissiveIntensity: 0.05 };
    if (n.includes('hydrogen') || n.includes('bond') || n.includes('hidr')) return new THREE.MeshStandardMaterial({ color: 0xBFD8CB, roughness: .5, metalness: 0, transparent: true, opacity: .55 });
    if (n.includes('adenine')) return new THREE.MeshStandardMaterial({ color: 0xF09A8B, emissive: 0x3A120E, ...base });
    if (n.includes('thymine')) return new THREE.MeshStandardMaterial({ color: 0xF0C46A, emissive: 0x3B2A08, ...base });
    if (n.includes('guanine')) return new THREE.MeshStandardMaterial({ color: 0x7AC9A9, emissive: 0x0C2A20, ...base });
    if (n.includes('cytosine')) return new THREE.MeshStandardMaterial({ color: 0x86B7E8, emissive: 0x0B1E33, ...base });
    if (n.includes('phosphate') || n.includes('pentose') || n.includes('sugar')) return new THREE.MeshStandardMaterial({ color: 0xE3EEE8, roughness: .55, metalness: .02 });
    return new THREE.MeshStandardMaterial({ color: 0xC9DAD2, roughness: .5, metalness: .03 });
  }

  function iluminar() {
    const scene = state.scene;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xCDE6DA, 1.35));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4.5, 8, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xBEE4FF, 0.75);
    fill.position.set(-6, -2, 5);
    scene.add(fill);
    const rim = new THREE.PointLight(0x2BB7A8, 32, 26, 2);
    rim.position.set(-3, 1.5, 5);
    scene.add(rim);
    state.rim = rim;
    const rim2 = new THREE.PointLight(0xF3B8A8, 18, 22, 2);
    rim2.position.set(3, -2, 4);
    scene.add(rim2);
  }

  function anillos(altura, radio) {
    const grupo = new THREE.Group();
    const posiciones = [-0.36, -0.18, 0, 0.18, 0.36];
    posiciones.forEach((p, i) => {
      const geo = new THREE.TorusGeometry(radio + 0.16, 0.012, 6, 64);
      const mat = new THREE.MeshBasicMaterial({ color: 0x1FAE9F, transparent: true, opacity: 0.34 });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = p * altura;
      ring.userData.fase = i * 0.7;
      grupo.add(ring);
      state.rings.push(ring);
    });
    return grupo;
  }

  function particulas(altura, radio) {
    const n = 170;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = radio * (0.9 + Math.random() * 1.15);
      pos[i * 3] = Math.cos(ang) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * altura * 1.12;
      pos[i * 3 + 2] = Math.sin(ang) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x79CBB1, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
    return new THREE.Points(geo, mat);
  }

  function prepararDesdoblamiento(modelo) {
    const caja = new THREE.Box3().setFromObject(modelo);
    const tam = caja.getSize(new THREE.Vector3());
    const alto = Math.max(tam.y, 0.001);
    state.unzipOffset = Math.max(alto * 0.055, 0.25);
    state.meshes = [];
    modelo.updateMatrixWorld(true);
    modelo.traverse((m) => {
      if (!m.isMesh) return;
      const centros = [];
      const nombres = [m.name];
      let p = m.parent;
      while (p && nombres.length < 5) { if (p.name) nombres.push(p.name); p = p.parent; }
      m.material = materialPorNombre(nombres.join(' '));
      m.geometry.computeBoundingBox();
      const c = new THREE.Vector3();
      m.geometry.boundingBox.getCenter(c);
      const mundo = m.localToWorld(c.clone());
      const enPadre = m.parent.worldToLocal(mundo.clone());
      m.geometry.translate(-c.x, -c.y, -c.z);
      m.position.copy(enPadre);
      m.userData.base = enPadre.clone();
      m.userData.sign = enPadre.x >= 0 ? 1 : -1;
      m.userData.alto = alto;
      state.meshes.push(m);
      // evita arrays no usados
      if (centros.length) centros.length = 0;
    });
  }

  function construirRespaldo() {
    const grupo = new THREE.Group();
    const alto = 8.2;
    const radio = 1.18;
    const vueltas = 3.1;
    const pasos = 120;
    const colores = [0xF09A8B, 0xF0C46A, 0x7AC9A9, 0x86B7E8];
    const esferas = [];
    for (let hebra = 0; hebra < 2; hebra++) {
      for (let i = 0; i <= pasos; i++) {
        const t = i / pasos;
        const ang = t * Math.PI * 2 * vueltas + hebra * Math.PI;
        const geo = new THREE.SphereGeometry(0.085, 10, 8);
        const mat = new THREE.MeshStandardMaterial({ color: colores[(i + hebra) % 4], roughness: .35, metalness: .04 });
        const s = new THREE.Mesh(geo, mat);
        s.position.set(Math.cos(ang) * radio, -alto / 2 + t * alto, Math.sin(ang) * radio);
        grupo.add(s);
        esferas.push(s);
      }
    }
    // puentes
    for (let i = 6; i < pasos; i += 8) {
      const t = i / pasos;
      const a1 = t * Math.PI * 2 * vueltas;
      const a2 = a1 + Math.PI;
      const p1 = new THREE.Vector3(Math.cos(a1) * radio, -alto / 2 + t * alto, Math.sin(a1) * radio);
      const p2 = new THREE.Vector3(Math.cos(a2) * radio, -alto / 2 + t * alto, Math.sin(a2) * radio);
      const dir = p2.clone().sub(p1);
      const geo = new THREE.CylinderGeometry(0.022, 0.022, dir.length(), 6);
      const mat = new THREE.MeshStandardMaterial({ color: 0xBBD7C9, roughness: .5, transparent: true, opacity: .65 });
      const c = new THREE.Mesh(geo, mat);
      c.position.copy(p1.clone().add(p2).multiplyScalar(0.5));
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      grupo.add(c);
    }
    grupo.userData.fallback = true;
    return grupo;
  }

  function iniciarEscena() {
    const canvas = $('#dna-canvas');
    const stage = $('#dna-stage');
    if (!canvas || !stage) return;
    stage?.addEventListener('pointerenter', () => { state.hover = true; });
    stage?.addEventListener('pointerleave', () => { state.hover = false; });
    if (!window.THREE) {
      $('#dna-loader')?.classList.add('is-hidden');
      $('#dna-fallback')?.removeAttribute('hidden');
      return;
    }
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      state.renderer = renderer;
      const scene = new THREE.Scene();
      state.scene = scene;
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 0, 14);
      state.camera = camera;
      iluminar();

      const pivot = new THREE.Group();
      scene.add(pivot);
      state.pivot = pivot;

      const cargar = async () => {
        let modelo;
        try {
          if (!window.VitaraGLB) throw new Error('Sin cargador GLB');
          const r = await window.VitaraGLB.load('assets/3d/adn.glb');
          modelo = r.group;
          pivot.add(modelo);
          // Encuadre
          const contenedor = window.VitaraGLB.fitToHeight(modelo, 8.4);
          pivot.remove(modelo);
          pivot.add(contenedor);
          state.model = contenedor;
          state.modelEscala = contenedor.scale.x;
          contenedor.scale.setScalar(0.9);
          prepararDesdoblamiento(contenedor);
          const caja = new THREE.Box3().setFromObject(contenedor);
          const tam = caja.getSize(new THREE.Vector3());
          const radio = Math.max(tam.x, tam.z) * 0.5 + 0.2;
          pivot.add(anillos(8.4, radio));
          state.particles = particulas(8.4, radio * 1.1);
          scene.add(state.particles);
          const base = new THREE.Mesh(
            new THREE.TorusGeometry(radio * 1.36, 0.008, 6, 90),
            new THREE.MeshBasicMaterial({ color: 0x8FCBB7, transparent: true, opacity: .28 })
          );
          base.rotation.x = Math.PI / 2;
          base.position.y = -4.38;
          scene.add(base);
          state.baseRing = base;
        } catch (err) {
          console.warn('[VITARA] GLB no disponible, usando hélice ilustrativa.', err);
          state.fallback = true;
          modelo = construirRespaldo();
          pivot.add(modelo);
          state.model = modelo;
          pivot.add(anillos(8.2, 1.35));
          state.particles = particulas(8.2, 1.5);
          scene.add(state.particles);
          const aviso = document.createElement('div');
          aviso.className = 'toast toast--warn';
          aviso.innerHTML = '<svg class="i i--sm"><use href="#i-info"/></svg><span>Modelo 3D no disponible. Se muestra una hélice ilustrativa con las mismas dianas.</span>';
          $('#toasts')?.appendChild(aviso);
          setTimeout(() => aviso.remove(), 6500);
        }
        state.ready = true;
        $('#dna-loader')?.classList.add('is-hidden');
        if (state.fallback) $('#dna-fallback')?.setAttribute('hidden', '');
        const ocultarError = $('#dna-fallback');
        if (ocultarError) ocultarError.hidden = true;
        state.orbit = window.VitaraGLB?.orbit(pivot, canvas, { camera, rotY: 0.15, zoom: 1, autoRotate: true });
      };
      cargar();

      const ajustar = () => {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      ajustar();
      state.resizeObserver = new ResizeObserver(ajustar);
      state.resizeObserver.observe(stage);
      window.addEventListener('resize', ajustar);

      let t = 0;
      const animar = () => {
        state.raf = requestAnimationFrame(animar);
        t += 0.016;
        // desdoblamiento suave
        state.unzip += (state.unzipTarget - state.unzip) * 0.08;
        if (state.meshes.length) {
          const desplazamiento = state.unzipOffset || 0.72;
          state.meshes.forEach((m) => {
            m.position.x = m.userData.base.x + m.userData.sign * state.unzip * desplazamiento;
          });
        } else if (state.fallback && state.model) {
          state.model.children.forEach((c) => {
            if (c.userData.hebra == null && c.position.x !== 0) c.userData.hebra = c.position.x >= 0 ? 1 : -1;
          });
        }
        const intensidadHover = state.hover ? 0.34 : 0;
        if (state.rim) {
          const objetivoLuz = state.hover ? 46 : 32;
          state.rim.intensity += (objetivoLuz - state.rim.intensity) * 0.06;
        }
        if (state.baseRing) {
          const objetivoBase = state.hover ? 0.52 : 0.28;
          state.baseRing.material.opacity += (objetivoBase - state.baseRing.material.opacity) * 0.06;
        }
        if (state.particles) {
          state.particles.rotation.y -= 0.0007;
          const mat = state.particles.material;
          const base = typeof mat.opacity === 'number' ? mat.opacity : 0.55;
          mat.opacity += ((base + intensidadHover) - mat.opacity) * 0.06;
        }
        if (state.rings.length) {
          state.rings.forEach((r, i) => {
            const base = state.selected === TARGETS[i]?.id ? 0.75 : 0.28 + Math.sin(t * 1.1 + r.userData.fase) * 0.07;
            const objetivo = Math.min(0.97, base + intensidadHover);
            r.material.opacity += (objetivo - r.material.opacity) * 0.08;
            r.scale.setScalar(1 + Math.sin(t * 1.1 + r.userData.fase) * 0.012);
          });
        }
        if (state.model) {
          const objetivoEscala = state.modelEscala != null ? state.modelEscala : 1;
          const escalaActual = state.model.scale.x;
          state.model.scale.setScalar(escalaActual + (objetivoEscala - escalaActual) * 0.07);
        }
        renderer.render(scene, camera);
      };
      animar();
    } catch (err) {
      console.warn('[VITARA] WebGL no disponible.', err);
      $('#dna-loader')?.classList.add('is-hidden');
      $('#dna-fallback')?.removeAttribute('hidden');
    }

    const controles = () => {
      $('#dna-unzip')?.addEventListener('click', (e) => {
        state.unzipTarget = state.unzipTarget ? 0 : 1;
        e.currentTarget.setAttribute('aria-pressed', String(!!state.unzipTarget));
        if (state.fallback && state.orbit) {
          // En la versión ilustrativa el desdoblamiento se aproxima separando el pivote.
          state.orbit.estado.zoom = state.unzipTarget ? 0.86 : 1;
        }
      });
      $('#dna-rotate')?.addEventListener('click', (e) => {
        if (!state.orbit) return;
        const activo = e.currentTarget.getAttribute('aria-pressed') === 'true';
        e.currentTarget.setAttribute('aria-pressed', String(!activo));
        state.orbit.setAutoRotate(!activo);
      });
      $('#dna-zoom-in')?.addEventListener('click', () => state.orbit?.zoom(1.1));
      $('#dna-zoom-out')?.addEventListener('click', () => state.orbit?.zoom(0.9));
      $('#dna-reset')?.addEventListener('click', () => {
        state.orbit?.reencuadrar();
        state.unzipTarget = 0;
        $('#dna-unzip')?.setAttribute('aria-pressed', 'false');
        if (state.selected) cerrarPanel();
      });
    };
    controles();
  }

  function iniciar() {
    renderTargets();
    iniciarEscena();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.selected) cerrarPanel();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
