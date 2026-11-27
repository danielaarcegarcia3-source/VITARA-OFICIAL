/**
 * shell.js — R-02 · Shell HANDOFF 09
 * Riel izquierdo colapsable de secciones, barra de pestañas de vistas
 * abiertas, inspector derecho (cerrado con Esc, navegable por teclado).
 */
(function () {
  'use strict';
  const $ = (sel, raiz = document) => raiz.querySelector(sel);

  const RAIL = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'buscar', label: 'Buscar' },
    { id: 'mapas', label: 'Mapas' },
    { id: 'solicitudes', label: 'Solicitudes' },
    { id: 'canales', label: 'Canales' },
    { id: 'tablero', label: 'Tablero' },
    { id: 'publicos', label: 'Salud para todos' },
    { id: 'admin', label: 'Admin' },
    { id: 'planos', label: 'Planos' },
    { id: 'equipamiento', label: 'Equipamiento' }
  ];

  let tabs = [];

  function cerrarInspector() {
    const ins = $('#app-inspector');
    if (ins) { ins.hidden = true; ins.setAttribute('aria-expanded', 'false'); }
  }

  function initRail() {
    const rail = $('#app-rail');
    if (!rail) return;
    rail.hidden = false;
    rail.innerHTML = `
      <div class="app-rail__logo" role="link" tabindex="0">VITARA</div>
      <nav aria-label="Secciones">
        ${RAIL.map((r) => `<a class="app-rail-link" href="#" data-dest="${r.id}" title="${r.label}">${r.label}</a>`).join('')}
      </nav>
      <button type="button" class="app-rail-toggle" id="app-rail-toggle" aria-label="Expandir/colapsar riel">⇢</button>`;
    rail.addEventListener('click', (e) => {
      const t = e.target.closest('[data-dest]');
      if (!t) return;
      cerrarInspector();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const sec = $('#' + t.dataset.dest);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#app-rail-toggle')?.addEventListener('click', () => {
      rail.classList.toggle('app-rail--colapsado');
      const t = $('#app-rail-toggle');
      if (t) t.textContent = rail.classList.contains('app-rail--colapsado') ? '⇤' : '⇢';
    });
  }

  function initTabs() {
    const bar = $('#tabs-bar');
    if (!bar) return;
    const render = () => {
      bar.innerHTML = '';
      tabs.forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'app-tab' + (t.pin ? ' app-tab--fijado' : '');
        b.textContent = t.label;
        b.title = t.id;
        b.addEventListener('click', () => {
          const sec = $('#' + t.id);
          if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          bar.querySelectorAll('.app-tab').forEach((x) => x.classList.toggle('app-tab--activo', x === b));
        });
        const pinBtn = document.createElement('button');
        pinBtn.type = 'button';
        pinBtn.className = 'app-tab-pin';
        pinBtn.textContent = '★';
        pinBtn.title = t.pin ? 'Quitar fijar' : 'Fijar vista';
        pinBtn.addEventListener('click', (e) => { e.stopPropagation(); t.pin = !t.pin; guardar(); render(); });
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'app-tab-close';
        closeBtn.textContent = '×';
        closeBtn.title = 'Cerrar vista';
        closeBtn.addEventListener('click', (e) => { e.stopPropagation(); tabs = tabs.filter((x) => x.id !== t.id); guardar(); render(); });
        const wrap = document.createElement('span');
        wrap.className = 'app-tab-wrap';
        wrap.append(b, pinBtn, closeBtn);
        bar.appendChild(wrap);
      });
    };
    const guardar = () => { try { localStorage.setItem('g3-pestanas', JSON.stringify(tabs)); } catch {} };
    window.addEventListener('hashchange', () => {
      const h = location.hash.replace(/^#+/, '');
      if (h && !tabs.some((t) => t.id === h)) tabs.unshift({ id: h, label: h.replace(/^dpto-/, 'Departamento: '), pin: false });
      guardar();
      render();
    });
    const prev = tabs.length ? null : null;
    (function leer() { try { tabs = JSON.parse(localStorage.getItem('g3-pestanas') || '[]'); } catch {} })();
    render();
  }

  function iniciarSplit() {
    const split = $('#app-split');
    if (!split) return;
    const save = () => { try { localStorage.setItem('g3-split', document.body.classList.contains('app-split-on') ? 'on' : 'off'); } catch {} };
    const render = () => {
      const on = window.innerWidth >= 1280 && document.body.classList.contains('app-split-on');
      split.classList.toggle('app-split--on', on);
      split.setAttribute('aria-expanded', String(on));
      const inp = $('#campo-busqueda');
      if (on && inp) {
        // Al dividir, navegación completa en dos paneles: leer y comparar
        window.scrollTo({ top: 0 });
      }
    };
    window.addEventListener('resize', render);
    if (localStorage.getItem('g3-split') !== 'off') document.body.classList.add('app-split-on');
    render();
  }

  function initInspector() {
    const ins = $('#app-inspector');
    if (!ins) return;
    ins.setAttribute('aria-expanded', 'false');
    document.addEventListener('g3:abrir-inspector', () => {
      ins.hidden = false;
      ins.setAttribute('aria-expanded', 'true');
      if (!ins.dataset.loaded) {
        ins.dataset.loaded = '1';
        ins.innerHTML = `
          <h3 class="app-inspector__tit">Inspector del ecosistema</h3>
          <p class="app-inspector__sub">Aquí aparecen los datos detallados de lo que has abierto en la otra columna.</p>
          <button type="button" class="app-inspector-btn" id="insp-mapas">Abrir mapa real</button>
          <button type="button" class="app-inspector-btn" id="insp-canales">Abrir canales reales</button>
          <button type="button" class="app-inspector-btn" id="insp-dossier">Abrir dossier estadístico</button>`;
        $('#insp-mapas')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }) || document.querySelector('#mapa-real')?.scrollIntoView({ block: 'start' }));
        $('#insp-canales')?.addEventListener('click', () => document.querySelector('#canales-vista')?.scrollIntoView({ block: 'start' }));
        $('#insp-dossier')?.addEventListener('click', () => document.querySelector('#mapa-real')?.scrollIntoView({ block: 'start' }));
      }
    });
    document.addEventListener('g3:cerrar-inspector', () => cerrarInspector());
    // Teclado: F11 equivale al split, Esc cierra el inspector
    document.addEventListener('keydown', (e) => {
      if (e.key === 'f11') { e.preventDefault(); document.body.classList.toggle('app-split-on'); }
    });
  }

  function initCtrlK() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); $('#campo-busqueda')?.focus(); }
    });
  }

  function initEsc() {
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarInspector(); });
  }

  function iniciar() {
    initRail();
    initTabs();
    initCtrlK();
    initEsc();
    iniciarSplit();
    initInspector();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
