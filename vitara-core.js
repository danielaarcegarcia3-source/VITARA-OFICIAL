/**
 * vitara-core.js — núcleo compartido de VITARA
 * Navegación por vistas y pestañas, inspector lateral, avisos, preferencias
 * y utilidades de formato. Sin dependencias externas.
 */
(function () {
  'use strict';

  const D = window.DatosSaludPeru || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const VIEWS = [
    { id: 'inicio', label: 'Inicio', icon: 'i-home', pin: true },
    { id: 'buscar', label: 'Buscar', icon: 'i-search' },
    { id: 'tablero', label: 'Tablero SISMED', icon: 'i-chart' },
    { id: 'mapas', label: 'Mapas', icon: 'i-map' },
    { id: 'planos', label: 'Planos y medidas', icon: 'i-layers' },
    { id: 'equipos', label: 'Equipamiento', icon: 'i-box' },
    { id: 'tecnologia', label: 'Dispositivos y proveedores', icon: 'i-pulse' },
    { id: 'solicitudes', label: 'Solicitudes', icon: 'i-message' },
    { id: 'canales', label: 'Canales de ayuda', icon: 'i-phone' },
    { id: 'comunidad', label: 'Salud para todos', icon: 'i-people' },
    { id: 'fuentes', label: 'Fuentes y método', icon: 'i-book' }
  ];
  const VIEW_MAP = Object.fromEntries(VIEWS.map((v) => [v.id, v]));

  // Interacciones de navegación: solo nombres de vista y fecha, nunca contenido.
  const INTER_KEY = 'g3.interacciones';
  const INTER_DIAS = 30;
  function registrarInteraccion(id) {
    try {
      const ahora = Date.now();
      let lista = JSON.parse(localStorage.getItem(INTER_KEY) || '[]');
      if (!Array.isArray(lista)) lista = [];
      lista = lista.filter((x) => x && typeof x.vista === 'string' && Number(x.ts) >= ahora - INTER_DIAS * 86400000);
      lista.unshift({ vista: id, ts: ahora });
      localStorage.setItem(INTER_KEY, JSON.stringify(lista.slice(0, 40)));
    } catch { /* almacenamiento no disponible */ }
  }

  const SRC = {
    sismed: { texto: 'InfoSismedLL · DIRESA La Libertad', fecha: 'corte 31/10/2026' },
    renipress: { texto: 'RENIPRESS · SUSALUD', fecha: 'base local 2026' },
    digemid: { texto: 'DIGEMID · OPP', fecha: 'consulta 23/11/2026' },
    ietsi: { texto: 'IETSI · EsSalud', fecha: 'catálogo 2026' },
    contraloria: { texto: 'Contraloría General de la República', fecha: 'informes 2025–2026' },
    inei: { texto: 'INEI · ENAHO', fecha: 'T1-2025' },
    minsa: { texto: 'MINSA · DIGTEL', fecha: 'consulta 23/11/2026' },
    defensoria: { texto: 'Defensoría del Pueblo', fecha: 'Informe 243' },
    base: { texto: 'Base local consolidada', fecha: 'consulta 23/11/2026' }
  };

  const ROLES = {
    VIS: { nombre: 'Visitante', letra: 'V' },
    CIU: { nombre: 'Ciudadanía', letra: 'C' },
    AGC: { nombre: 'Gestión', letra: 'A' },
    POSTA: { nombre: 'Personal de posta o salud', letra: 'P' },
    ADM: { nombre: 'Administrador', letra: 'A' }
  };

  const state = {
    tabs: [{ id: 'inicio', pinned: true }],
    active: null,
    split: false,
    hooks: Object.create(null),
    notifs: []
  };
  /* ---------- utilidades ---------- */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function norm(v) {
    return String(v == null ? '' : v).normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  function num(v, dec = 0) {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function pct(v, dec = 1) {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + '%';
  }
  function fecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function hora(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }
  function icon(name, cls = '') {
    return `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  }
  function source(src, extra = '') {
    if (!src) return '';
    const t = typeof src === 'string' ? { texto: src, fecha: extra } : src;
    return `<p class="source">${esc(t.texto)}${t.fecha ? ' · ' + esc(t.fecha) : ''}${extra && typeof src !== 'string' ? ' · ' + esc(extra) : ''}</p>`;
  }

  /* ---------- almacenamiento seguro ---------- */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
    },
    del(key) { try { localStorage.removeItem(key); } catch (_) {} }
  };

  /* ---------- pestañas y navegación ---------- */
  function renderTabs() {
    const cont = $('#tabs');
    if (!cont) return;
    const html = state.tabs.map((t) => {
      const v = VIEW_MAP[t.id];
      if (!v) return '';
      const active = state.active === t.id;
      return `<div class="tab${t.pinned ? ' tab--pinned' : ''}" role="tab" tabindex="${active ? 0 : -1}" aria-selected="${active}" data-tab="${v.id}" title="${esc(v.label)}">
        ${icon(v.icon, 'i--sm tab__ico')}
        <span class="tab__label">${esc(v.label)}</span>
        <button class="tab__pin" type="button" data-pin="${v.id}" aria-label="${t.pinned ? 'Desfijar' : 'Fijar'} ${esc(v.label)}" aria-pressed="${t.pinned}">${icon('pushpin', 'i--sm')}</button>
        ${t.pinned ? '' : `<button class="tab__x" type="button" data-close="${v.id}" aria-label="Cerrar ${esc(v.label)}">${icon('close', 'i--sm')}</button>`}
      </div>`;
    }).join('');
    cont.innerHTML = html + `<button class="tabs__add" type="button" id="tabs-add" aria-label="Abrir una vista" title="Abrir vista">${icon('plus', 'i--sm')}</button>
      <button class="tabs__split" type="button" id="tabs-split" aria-label="Mostrar u ocultar inspector" aria-pressed="${state.split}" title="Inspector lateral">${icon('columns', 'i--sm')}</button>`;
    bindTabs();
  }

  function bindTabs() {
    const cont = $('#tabs');
    if (!cont) return;
    cont.querySelectorAll('[data-tab]').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        abrirVista(tab.dataset.tab);
      });
      tab.addEventListener('keydown', (e) => {
        if (e.target.closest('button')) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirVista(tab.dataset.tab); }
      });
    });
    cont.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      cerrarPestana(b.dataset.close);
    }));
    cont.querySelectorAll('[data-pin]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const t = state.tabs.find((x) => x.id === b.dataset.pin);
      if (!t) return;
      if (t.id === 'inicio') return;
      t.pinned = !t.pinned;
      renderTabs();
    }));
    $('#tabs-add')?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('vitara:palette')));
    $('#tabs-split')?.addEventListener('click', () => {
      if (state.split) cerrarInspector();
      else abrirInspector('Inspector', `<div class="inspector-empty">${icon('columns', 'i--xl')}<p>Selecciona un resultado, una red o un departamento para ver su detalle aquí, sin tapar la vista principal.</p></div>`);
    });
  }

  function cerrarPestana(id) {
    const i = state.tabs.findIndex((t) => t.id === id);
    if (i < 0 || state.tabs[i].pinned) return;
    state.tabs.splice(i, 1);
    if (state.active === id) {
      const next = state.tabs[Math.max(0, i - 1)] || state.tabs[0];
      abrirVista(next.id, { silencioso: true });
    } else {
      renderTabs();
    }
  }

  function abrirVista(id, opts = {}) {
    const v = VIEW_MAP[id];
    if (!v) return;
    if (!state.tabs.some((t) => t.id === id)) {
      state.tabs.push({ id, pinned: false });
      while (state.tabs.length > 7) {
        const idx = state.tabs.findIndex((t) => !t.pinned && t.id !== id);
        if (idx < 0) break;
        state.tabs.splice(idx, 1);
      }
    }
    state.active = id;
    $$('.view').forEach((view) => {
      const on = view.dataset.view === id;
      view.classList.toggle('is-active', on);
      if (on) view.removeAttribute('hidden');
      else view.setAttribute('hidden', '');
    });
    $$('[data-view-link]').forEach((a) => {
      if (a.dataset.viewLink === id) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    renderTabs();
    const vp = $('#viewport');
    if (vp) vp.scrollTop = 0;
    try { if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id); } catch (_) {}
    const hooks = state.hooks[id] || [];
    hooks.forEach((fn) => { try { fn(opts); } catch (err) { console.error('[VITARA] Error al pintar', id, err); } });
    registrarInteraccion(id);
    document.dispatchEvent(new CustomEvent('vitara:view', { detail: { id, opts } }));
  }

  function onView(id, fn) {
    if (!state.hooks[id]) state.hooks[id] = [];
    state.hooks[id].push(fn);
  }

  /* ---------- inspector ---------- */
  let inspectorTrigger = null;
  function abrirInspector(titulo, html) {
    const panel = $('#inspector');
    const ws = $('#workspace');
    const body = $('#inspector-body');
    if (!panel || !ws || !body) return;
    if (panel.hidden) inspectorTrigger = document.activeElement;
    body.innerHTML = html;
    panel.querySelector('.inspector__head strong').textContent = titulo || 'Inspector';
    panel.hidden = false;
    ws.classList.add('is-split');
    state.split = true;
    $('#tabs-split')?.setAttribute('aria-pressed', 'true');
    if (window.matchMedia('(max-width: 1024px)').matches) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
    } else {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }
    panel.querySelector('#inspector-close')?.focus({ preventScroll: true });
  }
  function cerrarInspector() {
    const panel = $('#inspector');
    const ws = $('#workspace');
    if (!panel || !ws) return;
    const restore = panel.contains(document.activeElement);
    ws.classList.remove('is-split');
    panel.hidden = true;
    panel.removeAttribute('aria-modal');
    panel.removeAttribute('role');
    if (restore) (inspectorTrigger?.isConnected ? inspectorTrigger : $('#tabs-split'))?.focus({ preventScroll: true });
    state.split = false;
    $('#tabs-split')?.setAttribute('aria-pressed', 'false');
  }

  /* ---------- avisos ---------- */
  function toast(texto, tipo = 'ok', ms = 5200) {
    const cont = $('#toasts');
    if (!cont) return;
    const el = document.createElement('div');
    el.className = 'toast' + (tipo === 'warn' ? ' toast--warn' : '');
    el.setAttribute('role', 'status');
    el.innerHTML = `${icon(tipo === 'warn' ? 'alert' : 'check', 'i--sm')}<span>${esc(texto)}</span>`;
    cont.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, ms);
  }

  function addNotif(n) {
    const item = { texto: n.texto, tipo: n.tipo || 'info', fecha: new Date().toISOString(), vista: n.vista || null };
    state.notifs.unshift(item);
    state.notifs = state.notifs.slice(0, 30);
    const dot = $('#notif-dot');
    if (dot) dot.hidden = false;
    const badge = $('#btn-notif');
    if (badge) badge.setAttribute('aria-label', `Notificaciones (${state.notifs.length} sin revisar)`);
    return item;
  }

  /* ---------- preferencias ---------- */
  const A11Y = { texto: false, contraste: false, movimiento: false, lectura: false };
  function leerA11y() {
    const saved = store.get('g3.a11y', {});
    Object.keys(A11Y).forEach((k) => { if (typeof saved[k] === 'boolean') A11Y[k] = saved[k]; });
    return A11Y;
  }
  function aplicarA11y() {
    const root = document.documentElement;
    root.dataset.texto = A11Y.texto ? 'grande' : '';
    root.dataset.contraste = A11Y.contraste ? 'alto' : '';
    root.dataset.movimiento = A11Y.movimiento ? 'reducido' : '';
    root.dataset.lectura = A11Y.lectura ? 'si' : '';
    store.set('g3.a11y', A11Y);
    $$('.switch[data-a11y]').forEach((b) => b.setAttribute('aria-pressed', String(!!A11Y[b.dataset.a11y])));
    $$('input[data-a11y-check]').forEach((c) => { c.checked = !!A11Y[c.dataset.a11yCheck]; });
  }
  function setA11y(k, v) {
    if (!(k in A11Y)) return;
    A11Y[k] = !!v;
    aplicarA11y();
  }

  /* ---------- reloj del dispositivo ---------- */
  function reloj() {
    const el = $('#device-clock');
    if (!el) return;
    const d = new Date();
    el.textContent = 'Hora del dispositivo · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    el.title = 'Hora local del dispositivo (' + (Intl.DateTimeFormat().resolvedOptions().timeZone || 'zona local') + '). No es una fuente oficial.';
  }

  function estadoTag(estado) {
    const map = {
      recibida: ['Recibida', 'tag--grey'], en_revision: ['En revisión', 'tag--warn'],
      respondido: ['Respondida', 'tag--ok'], no_disponible: ['No disponible', 'tag--err'],
      cerrada: ['Cerrada', 'tag--grey']
    };
    const e = map[estado] || map.recibida;
    return `<span class="tag ${e[1]}">${e[0]}</span>`;
  }

  window.Vitara = {
    D, VIEWS, VIEW_MAP, SRC, ROLES, state,
    $, $$, esc, norm, num, pct, fecha, hora, icon, source, store,
    abrirVista, onView, cerrarPestana, renderTabs,
    abrirInspector, cerrarInspector,
    toast, addNotif, notifs: () => state.notifs.slice(),
    A11Y, leerA11y, aplicarA11y, setA11y, reloj, estadoTag
  };
})();
