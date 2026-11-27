/**
 * inicio-ecosistema.js — T-02 / T-03 / T-04
 *
 * · Carrusel de experiencias de la pantalla de inicio (patrón de Referencia A)
 * · Franja de pulso en vivo (localStorage, sin inventar datos)
 * · Panel "Continuar donde quedaste"
 * · Tabs de vistas abiertas en la sesión
 * · Onboarding de 3 pasos (g3.perfil — departamento y rol; sin DNI)
 * · Omnibox con Ctrl+K
 *
 * localStorage usados: g3-continuar, g3-tabs-vistas, g3-perfil, g3-onboarding
 */
(function () {
  'use strict';

  const $ = (sel, raiz = document) => raiz.querySelector(sel);

  const DESTINOS = [
    { id: 'buscar', label: 'Buscar', href: '#buscador',
      blurb: 'Motor de búsqueda universal: medicamentos, sedes, equipos y Kits Dengue en un solo lugar' },
    { id: 'mapas', label: 'Mapas', href: '#seccion-mapas',
      blurb: 'Disponibilidad SISMED y brecha hospitalaria por departamento' },
    { id: 'solicitudes', label: 'Solicitudes', href: '#buscador',
      blurb: 'Genera códigos G3-XXXXXX privados y consulta su estado sin registrarte' },
    { id: 'canales', label: 'Canales', href: '#canales-ayuda',
      blurb: 'Línea 113, Teleatiendo, SAMU y vías oficiales reales de ayuda' },
    { id: 'tablero', label: 'Tablero', href: '#tablero-regional-sismed',
      blurb: 'Tablero regional de La Libertad: stock real al 31/10/2026' },
    { id: 'publicos', label: 'Públicos', href: '#modulos',
      blurb: 'Módulos multi-público, juegos con consecuencia y personal menores' },
    { id: 'admin', label: 'Admin', href: 'admin.html',
      blurb: 'Panel de supervisión, respuestas y monitor de red local' }
  ];

  const DEPARTAMENTOS = [
    'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca',
    'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín',
    'La Libertad', 'Lambayeque', 'Lima Metropolitana', 'Lima Región',
    'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno',
    'San Martín', 'Tacna', 'Tumbes', 'Ucayali'
  ];

  const ROOLES_USO = [
    { valor: 'ciudadano', texto: 'Ciudadano (uso general)' },
    { valor: 'personal-salud', texto: 'Personal de salud (SUSALUD / postas)' },
    { valor: 'gestion', texto: 'Gestión y administración' },
    { valor: 'estudiante', texto: 'Estudiante' }
  ];

  function antiguedadSesion() {
    try {
      const t = Number(localStorage.getItem('g3-sesion-inicio') || 0);
      if (!t) { localStorage.setItem('g3-sesion-inicio', String(Date.now())); return 0; }
      const ahora = Date.now() - t;
      if (ahora > 24 * 60 * 60 * 1000) localStorage.setItem('g3-sesion-inicio', String(Date.now()));
      return Math.floor(ahora / 86400000);
    } catch { return 0; }
  }

  /* =====================================================================
     T-02 · CARRUSEL DE EXPERIENCES
     ===================================================================== */
  function initCarrusel() {
    const slidesRoot = $('#carousel-slides');
    const indicadores = $('#carousel-indicadores');
    const prev = $('#carousel-prev');
    const next = $('#carousel-next');
    const leyenda = $('#carousel-leyenda');
    if (!slidesRoot) return;

    let indice = 0;
    const total = DESTINOS.length;

    function slideHtml(dest) {
      return `<div class="carousel__slide" data-id="${dest.id}">
                <span class="carousel__slide-ico">
                  <svg viewBox="0 0 24 24" width="22" aria-hidden="true">${dest.svg}</svg>
                </span>
                <h3>${dest.label}</h3>
                <p>${dest.blurb}</p>
              </div>`;
    }

    slidesRoot.innerHTML = DESTINOS.map(slideHtml).join('');
    slidesRoot.querySelectorAll('.carousel__slide').forEach((slide, i) => {
      slide.addEventListener('click', () => {
        indice = i;
        mostrar();
        const dest = DESTINOS[i];
        window.scrollTo({ top: document.querySelector(`a[href="${dest.href}"]`)?.offsetTop || 0, behavior: 'smooth' });
      });
    });

    function pintarIndicadores() {
      if (!indicadores) return;
      indicadores.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = `carousel__indicador${i === indice ? ' carousel__indicador--activo' : ''}`;
        d.setAttribute('aria-label', `Ir al destino ${i + 1}`);
        d.setAttribute('role', 'tab');
        d.addEventListener('click', () => { indice = i; mostrar(); });
        indicadores.appendChild(d);
      }
    }

    function mostrar() {
      slidesRoot.querySelectorAll('.carousel__slide').forEach((s, i) => {
        s.classList.toggle('carousel__slide--activo', i === indice);
        s.setAttribute('aria-selected', String(i === indice));
      });
      pintarIndicadores();
      if (leyenda) {
        leyenda.textContent = `Destino ${indice + 1} de ${total}: ${DESTINOS[indice].label} · pulsa o desliza para continuar`;
      }
    }

    prev?.addEventListener('click', () => { indice = (indice - 1 + total) % total; mostrar(); });
    next?.addEventListener('click', () => { indice = (indice + 1) % total; mostrar(); });

    // Deslizamiento táctil
    let startX = 0;
    document.addEventListener('touchstart', (e) => { startX = e.changedTouches[0]?.clientX || 0; }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const dx = (e.changedTouches[0]?.clientX || 0) - startX;
      if (Math.abs(dx) > 70) (dx < 0 ? next : prev)?.click();
    });

    mostrar();
  }

  /* =====================================================================
     T-02 · FRANJA DE PULSO EN VIVO (alimentada por datos locales; nunca
     inventa cifras: si no hay registro se muestra "Sin registros")
     ===================================================================== */
  function initPulso() {
    const lista = $('#franja-pulso');
    if (!lista) return;

    const ventana = 24 * 60 * 60 * 1000;
    const codigosRecientes = new Set();
    try {
      const solicitudes = JSON.parse(localStorage.getItem('g3-solicitudes') || '[]');
      const ahora = Date.now();
      for (const s of solicitudes) {
        const t = new Date((s && (s.fecha || s.ts)) || 0).getTime();
        if (Number.isFinite(t) && ahora - t <= ventana) {
          codigosRecientes.add((s && (s.codigo || s.id)) || '?');
        }
      }
    } catch { /* no hay datos — continuamos */ }

    const items = [
      { label: 'Solicitudes recibidas hoy', valor: codigosRecientes.size ? String(codigosRecientes.size) : 'Sin registros' },
      { label: 'Establecimientos con disponibilidad confirmada hoy', valor: 'Sin registros' },
      { label: 'Incidencias abiertas', valor: 'Sin registros' }
    ];

    lista.innerHTML = '';
    for (const item of items) {
      const li = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'pulso-dot';
      li.appendChild(dot);
      li.appendChild(document.createTextNode(`${item.label}: ${item.valor}`));
      lista.appendChild(li);
    }
  }

  /* =====================================================================
     T-02 · PANEL: CONTINUAR DONDE QUEDASTE (localStorage)
     ===================================================================== */
  const CLAVE_CONTINUAR = 'g3-continuar';

  function registrarContinuar(href) {
    const dest = DESTINOS.find((d) => d.href === href);
    if (!dest) return;
    try {
      const lista = JSON.parse(localStorage.getItem(CLAVE_CONTINUAR) || '[]');
      lista.unshift({ href, label: dest.label, blurb: dest.blurb, ts: Date.now() });
      localStorage.setItem(CLAVE_CONTINUAR, JSON.stringify(lista.slice(0, 8)));
    } catch { /* sin persistencia */ }
  }

  function initContinuar() {
    const panel = $('#panel-continuar');
    const lista = $('#panel-continuar__lista');
    const boton = $('#panel-continuar__boton');
    if (!panel || !lista) return;

    const actualizar = () => {
      try {
        const items = JSON.parse(localStorage.getItem(CLAVE_CONTINUAR) || '[]').slice(0, 4);
        panel.hidden = items.length === 0;
        lista.innerHTML = '';
        for (const item of items) {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.className = 'panel-continuar__item';
          a.href = item.href;
          a.textContent = item.label;
          li.appendChild(a);
        }
      } catch { panel.hidden = true; }
    };

    window.addEventListener('hashchange', () => {
      const href = `#${location.hash.replace(/^#+/, '') ? location.hash : ''}`;
      if (href && href !== '#') registrarContinuar(href);
      actualizar();
    });
    boton?.addEventListener('click', () => actualizar());
    actualizar();
  }

  /* =====================================================================
     T-04 · TABS DE VISTAS ABORTIDAS (localStorage: g3-tabs-vistas)
     ===================================================================== */
  const CLAVE_TABS = 'g3-tabs-vistas';

  function initTabsVistas() {
    const contenedor = $('#tabs-vistas');
    if (!contenedor) return;

    let tabs = [];
    try { tabs = JSON.parse(localStorage.getItem(CLAVE_TABS) || '[]'); } catch {}

    const actualizar = () => {
      const validos = tabs.filter((t) => DESTINOS.some((d) => d.href === t.href));
      tabs = validos;
      localStorage.setItem(CLAVE_TABS, JSON.stringify(tabs.slice(0, 8)));
      contenedor.hidden = tabs.length === 0;
      contenedor.innerHTML = '';
      for (const t of tabs) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tabs-vistas__tab';
        b.textContent = t.label;
        b.title = `Vista: ${t.href.slice(1)}`;
        b.addEventListener('click', () => { location.hash = t.href; });
        contenedor.appendChild(b);
      }
    };

    window.addEventListener('hashchange', () => {
      const href = location.hash || '';
      if (href && !tabs.some((t) => t.href === href)) tabs.push({ href, label: href.slice(1), ts: Date.now() });
      actualizar();
    });
    actualizar();
  }

  /* =====================================================================
     T-03 · ONBOARDING DE PRIMER ARRANQUE (3 pasos, saltable)
     localStorage: g3.perfil = { departamento, rol, preferencias }
     Prohibido: DNI, nombre completo, teléfono o dirección.
     ===================================================================== */
  const CLAVE_PERFIL = 'g3.perfil';
  const CLAVE_ONBOARDING = 'g3-onboarding';

  function initOnboarding() {
    const modal = $('#onboarding-modal');
    if (!modal || localStorage.getItem(CLAVE_ONBOARDING) === '1') return;

    const antiguedad = antiguedadSesion();
    const departamentos = window.DatosSaludPeru?.departamentos?.map((d) => d.dep) || DEPARTAMENTOS;
    const cerrado = $('#onboarding-cerrar');

    modal.innerHTML = `
      <div class="onboarding-modal__cuerpo" role="dialog" aria-modal="true" aria-label="Bienvenido — tu departamento, tu rol">
        <h3>¡Te damos la bienvenida al Ecosistema Digital de Salud!</h3>
        <p>¿De qué depende? ¡Te pediremos solo lo básico, nunca tu DNI.</p>

        <label class="onboarding-step" for="onboarding-departamento">
          <strong>1. ¿Tu departamento?</strong>
          <select id="onboarding-departamento">
            <option value="">Selecciona…</option>
            ${departamentos.map((d) => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </label>

        <label class="onboarding-step" for="onboarding-rol">
          <strong>2. ¿En qué te apoyas?</strong>
          <select id="onboarding-rol">
            ${ROOLES_USO.map((r) => `<option value="${r.valor}">${r.texto}</option>`).join('')}
          </select>
        </label>

        <label class="onboarding-step">
          <strong>3. Preferencias</strong>
          <div class="onboarding-prefs">
            <label><input type="checkbox" id="onboarding-mov-reducido"> Trastornos de movimiento o atención</label>
            <label><input type="checkbox" id="onboarding-contraste"> Contraste alto</label>
          </div>
        </label>

        <div class="onboarding-footer">
          <button type="button" id="onboarding-saltar" class="btn-ghost">Saltar (todo genera resultados en el buscador sin departamento)</button>
          <button type="button" id="onboarding-continuar" class="btn-primario">Continuar →</button>
        </div>
      </div>
    `;

    modal.hidden = false;
    const cuerpo = modal.querySelector('.onboarding-modal__cuerpo');
    const dep = $('#onboarding-departamento');
    const rol = $('#onboarding-rol');
    const movReducido = $('#onboarding-mov-reducido');
    const contraste = $('#onboarding-contraste');
    const saltar = $('#onboarding-saltar');
    const continuar = $('#onboarding-continuar');

    const guardar = () => {
      const perfil = {
        departamento: dep?.value || null,
        rol: rol?.value || null,
        preferencias: {
          movimientoReducido: !!movReducido?.checked,
          altoContraste: !!contraste?.checked
        },
        creado: new Date().toISOString()
      };
      try {
        localStorage.setItem(CLAVE_PERFIL, JSON.stringify(perfil));
        localStorage.setItem(CLAVE_ONBOARDING, '1');
      } catch { /* sin persistencia */ }
    };

    saltar?.addEventListener('click', () => { modal.hidden = true; guardar(); });
    continuar?.addEventListener('click', () => {
      if (dep?.value && rol?.value) {
        modal.hidden = true;
        guardar();
        document.documentElement.dataset.onboarding = 'completado';
      } else {
        alert('Por favor elige un departamento y un rol de uso para continuar.');
      }
    });

    if (antiguedad > 0) {
      modal.hidden = true;
      try { localStorage.setItem(CLAVE_ONBOARDING, '1'); } catch {}
    }
    void cerrado;
  }

  /* =====================================================================
     T-04 · OMNIBOX: Ctrl+K abre el buscador desde cualquier lugar
     ===================================================================== */
  function initOmnibox() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        $('#campo-busqueda')?.focus();
      }
    });
  }

  /* =====================================================================
     ARRANQUE
     ===================================================================== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  function iniciar() {
    initCarrusel();
    initPulso();
    initContinuar();
    initTabsVistas();
    initOnboarding();
    initOmnibox();
  }
})();
