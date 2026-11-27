/**
 * vitara-app.js — arranque de la interfaz
 * Perfil local, onboarding, paleta de comandos, notificaciones, conexión SSE
 * y navegación global. No simula datos ni estados del servidor.
 */
(function () {
  'use strict';
  const V = window.Vitara;
  if (!V) return;
  const { esc, icon, norm, store, toast, $, $$ } = V;

  const PERFIL_KEY = 'g3.perfil';
  let perfil = store.get(PERFIL_KEY, null);
  let popover = null;
  let sse = null;
  let paletteItems = [];
  let paletteIdx = 0;

  /* ---------- perfil ---------- */
  function aplicarPerfil() {
    const rol = (perfil && perfil.rol) || 'VIS';
    const info = V.ROLES[rol] || V.ROLES.VIS;
    const av = $('#profile-avatar');
    const pr = $('#profile-rol');
    const pn = $('#profile-nom');
    const btn = $('#btn-profile');
    if (av) av.textContent = info.letra;
    if (pr) pr.textContent = info.nombre.toUpperCase();
    if (pn) pn.textContent = (perfil && (perfil.nombre || perfil.distrito)) || 'Sin personalizar';
    if (btn) btn.setAttribute('aria-label', `Perfil: ${info.nombre}${perfil && perfil.distrito ? ' · ' + perfil.distrito : ''}. Abrir opciones.`);
  }

  function abrirOnboarding() {
    const ov = $('#onboarding-overlay');
    if (!ov) return;
    const rol = (perfil && perfil.rol) || 'CIU';
    $$('#onb-roles [data-rol]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rol === rol)));
    const dist = $('#onb-distrito');
    if (dist && perfil && perfil.distrito) {
      const opt = Array.from(dist.options).find((o) => o.value === perfil.distrito);
      if (opt) dist.value = opt.value;
    }
    const tx = $('#onb-texto');
    const mv = $('#onb-movimiento');
    if (tx) tx.checked = !!V.A11Y.texto;
    if (mv) mv.checked = !!V.A11Y.movimiento;
    const ce = $('#onb-correo');
    if (ce) ce.value = (perfil && perfil.contacto && perfil.contacto.correo) || '';
    ov.hidden = false;
    setTimeout(() => $('#onb-roles [aria-pressed="true"]')?.focus({ preventScroll: true }), 80);
  }

  function cerrarOnboarding() {
    const ov = $('#onboarding-overlay');
    if (ov) ov.hidden = true;
    $('#btn-profile')?.focus({ preventScroll: true });
  }

  function guardarOnboarding(saltar) {
    if (saltar) {
      perfil = perfil || { rol: 'VIS', distrito: null, creado: new Date().toISOString() };
    } else {
      const rolBtn = $('#onb-roles [aria-pressed="true"]');
      perfil = {
        ...perfil,
        nombre: perfil?.nombre || '',
        rol: (rolBtn && rolBtn.dataset.rol) || 'CIU',
        distrito: $('#onb-distrito')?.value || null,
        contacto: { correo: $('#onb-correo')?.value?.trim() || null },
        creado: (perfil && perfil.creado) || new Date().toISOString()
      };
      V.setA11y('texto', !!$('#onb-texto')?.checked);
      V.setA11y('movimiento', !!$('#onb-movimiento')?.checked);
    }
    store.set(PERFIL_KEY, perfil);
    aplicarPerfil();
    cerrarOnboarding();
    toast(saltar ? 'Puedes personalizar tu perfil cuando quieras.' : 'Perfil guardado en este dispositivo.');
  }

  function bindOnboarding() {
    const roles = $('#onb-roles');
    roles?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rol]');
      if (!b) return;
      roles.querySelectorAll('[data-rol]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    $('#onb-save')?.addEventListener('click', () => guardarOnboarding(false));
    $('#onb-skip')?.addEventListener('click', () => guardarOnboarding(true));
    $('#onb-close')?.addEventListener('click', cerrarOnboarding);
    $('#onboarding-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'onboarding-overlay') cerrarOnboarding();
    });
  }

  /* ---------- popovers ---------- */
  function cerrarPopover() {
    const restore = popover?.contains(document.activeElement);
    const trigger = popover?.dataset.tipo === 'notif' ? $('#btn-notif') : $('#btn-profile');
    popover?.remove();
    if (restore) trigger?.focus({ preventScroll: true });
    popover = null;
    $('#btn-notif')?.setAttribute('aria-expanded', 'false');
    $('#btn-profile')?.setAttribute('aria-expanded', 'false');
  }

  function colocarPopover(el, ancla) {
    const r = ancla.getBoundingClientRect();
    el.style.top = Math.round(r.bottom + 8) + 'px';
    el.style.right = Math.max(12, Math.round(window.innerWidth - r.right)) + 'px';
  }

  function abrirNotif() {
    const ancla = $('#btn-notif');
    if (!ancla) return;
    if (popover && popover.dataset.tipo === 'notif') { cerrarPopover(); return; }
    cerrarPopover();
    const list = V.notifs();
    const el = document.createElement('div');
    el.className = 'popover';
    el.dataset.tipo = 'notif';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Notificaciones del servidor local');
    el.innerHTML = `<div class="popover__head"><strong>Notificaciones</strong><button class="icon-btn" type="button" data-cerrar-pop aria-label="Cerrar" style="width:26px;height:26px">${icon('close', 'i--sm')}</button></div>
      <div class="popover__body">${list.length ? list.map((n) => `<div class="notif"><span class="notif__ico">${icon(n.tipo === 'warn' ? 'alert' : 'info', 'i--sm')}</span><div><p>${esc(n.texto)}</p><time>${esc(V.hora(n.fecha))}</time></div></div>`).join('') : `<p class="notif-empty">Sin notificaciones todavía. Los eventos del servidor local aparecerán aquí. No mostramos el contenido de solicitudes de otras personas.</p>`}</div>`;
    document.body.appendChild(el);
    colocarPopover(el, ancla);
    popover = el;
    ancla.setAttribute('aria-expanded', 'true');
    $('#notif-dot')?.setAttribute('hidden', '');
    el.querySelector('[data-cerrar-pop]')?.addEventListener('click', cerrarPopover);
  }

  function abrirPerfil() {
    const ancla = $('#btn-profile');
    if (!ancla) return;
    if (popover && popover.dataset.tipo === 'perfil') { cerrarPopover(); return; }
    cerrarPopover();
    const rol = (perfil && perfil.rol) || 'VIS';
    const info = V.ROLES[rol] || V.ROLES.VIS;
    const el = document.createElement('div');
    el.className = 'popover';
    el.dataset.tipo = 'perfil';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Tu perfil y preferencias');
    el.innerHTML = `<div class="popover__head"><strong>${esc(info.nombre)}</strong><button class="icon-btn" type="button" data-cerrar-pop aria-label="Cerrar" style="width:26px;height:26px">${icon('close', 'i--sm')}</button></div>
      <div class="popover__body" style="padding:14px">
        <dl class="kv"><dt>Nombre</dt><dd>${esc(perfil?.nombre || 'Sin definir')}</dd><dt>Perfil</dt><dd>${esc(info.nombre)}</dd><dt>Territorio</dt><dd>${esc((perfil && perfil.distrito) || 'Sin definir')}</dd><dt>Datos</dt><dd>Solo en este dispositivo</dd></dl>
        <div class="inspector-actions" style="margin-top:12px">
          <button class="btn btn--soft btn--sm" type="button" data-perfil-edit>${icon('settings', 'i--sm')} Cambiar perfil y territorio</button>
          <button class="btn btn--ghost btn--sm" type="button" data-perfil-a11y>${icon('accessibility', 'i--sm')} Accesibilidad</button>
          <button class="btn btn--ghost btn--sm" type="button" data-session-logout>Cerrar sesión local</button>
          <button class="btn btn--danger btn--sm" type="button" data-perfil-reset>${icon('close', 'i--sm')} Borrar datos locales</button>
        </div>
        <p class="source" style="margin-top:10px">No pedimos DNI, fecha de nacimiento ni diagnósticos. Puedes borrar estas preferencias en cualquier momento.</p>
      </div>`;
    document.body.appendChild(el);
    colocarPopover(el, ancla);
    popover = el;
    ancla.setAttribute('aria-expanded', 'true');
    el.querySelector('[data-cerrar-pop]')?.addEventListener('click', cerrarPopover);
    el.querySelector('[data-session-logout]')?.addEventListener('click', () => { cerrarPopover(); window.dispatchEvent(new Event('vitara:logout')); });
    el.querySelector('[data-perfil-edit]')?.addEventListener('click', () => { cerrarPopover(); abrirOnboarding(); });
    el.querySelector('[data-perfil-a11y]')?.addEventListener('click', () => {
      cerrarPopover();
      V.abrirVista('comunidad');
      setTimeout(() => $('#a11y-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    });
    el.querySelector('[data-perfil-reset]')?.addEventListener('click', () => {
      if (!window.confirm('¿Borrar los datos locales? Esto NO elimina tu perfil del servidor. Usa primero Participación si quieres eliminarlo; perder la clave local requiere ayuda del administrador.')) return;
      if (typeof V.borrarDatosLocales === 'function') V.borrarDatosLocales();
      else ['g3.perfil', 'g3.a11y', 'g3.solicitudes', 'g3.busquedas', 'g3.interacciones', 'g3.rail'].forEach((k) => store.del(k));
      cerrarPopover();
      location.reload();
    });
  }

  /* ---------- paleta de comandos ---------- */
  function abrirPalette() {
    const ov = $('#palette-overlay');
    if (!ov) return;
    ov.hidden = false;
    const input = $('#palette-q');
    if (input) { input.value = ''; input.focus({ preventScroll: true }); }
    renderPalette('');
    document.body.style.overflow = 'hidden';
  }
  function cerrarPalette() {
    const ov = $('#palette-overlay');
    if (ov) ov.hidden = true;
    document.body.style.overflow = '';
  }
  function basePalette() {
    const out = V.VIEWS.map((v) => ({
      label: v.label, hint: 'Vista', ico: v.icon, run: () => V.abrirVista(v.id)
    }));
    [
      ['Paracetamol 500 mg', 'paracetamol'], ['Amoxicilina 500 mg', 'amoxicilina'],
      ['Atorvastatina 20 mg', 'atorvastatina'], ['Posta de Moche', 'moche'],
      ['Dengue y kits', 'dengue'], ['Ecógrafo', 'ecógrafo']
    ].forEach(([label, q]) => out.push({
      label: `Buscar «${label}»`, hint: 'Buscador', ico: 'search',
      run: () => V.buscar(q)
    }));
    out.push({ label: 'Nueva solicitud anónima', hint: 'Servicio', ico: 'message', run: () => V.abrirVista('solicitudes') });
    out.push({ label: 'Ajustes de accesibilidad', hint: 'Comunidad', ico: 'accessibility', run: () => V.abrirVista('comunidad') });
    return out;
  }
  function renderPalette(q) {
    const list = $('#palette-list');
    if (!list) return;
    const n = norm(q);
    paletteItems = basePalette().filter((it) => !n || norm(it.label + ' ' + it.hint).includes(n));
    if (n && paletteItems.length) {
      paletteItems.unshift({ label: `Buscar «${q}» en toda la base`, hint: 'Enter', ico: 'search', run: () => V.buscar(q) });
    }
    paletteIdx = 0;
    list.innerHTML = paletteItems.length ? paletteItems.map((it, i) => `<button class="palette__item" type="button" role="option" id="pal-opt-${i}" aria-selected="${i === 0}" data-pal="${i}">${icon(it.ico, 'i--sm')}<span>${esc(it.label)}</span><em>${esc(it.hint)}</em></button>`).join('') : `<p class="palette__empty">Sin coincidencias. Prueba con una vista o un recurso.</p>`;
    list.querySelectorAll('[data-pal]').forEach((b) => {
      b.addEventListener('click', () => ejecutarPalette(Number(b.dataset.pal)));
      b.addEventListener('mousemove', () => marcarPalette(Number(b.dataset.pal)));
    });
  }
  function marcarPalette(i) {
    paletteIdx = Math.max(0, Math.min(paletteItems.length - 1, i));
    $('#palette-list')?.querySelectorAll('[data-pal]').forEach((b, k) => {
      b.setAttribute('aria-selected', String(k === paletteIdx));
      if (k === paletteIdx) b.scrollIntoView({ block: 'nearest' });
    });
  }
  function ejecutarPalette(i) {
    const it = paletteItems[i];
    if (!it) return;
    cerrarPalette();
    it.run();
  }

  /* ---------- conexión SSE ---------- */
  function setConn(estado, texto, titulo) {
    const el = $('#conn-status');
    if (!el) return;
    el.dataset.estado = estado;
    const l = $('#conn-label');
    if (l) l.textContent = texto;
    if (titulo) el.title = titulo;
  }

  function conectar() {
    if (!('EventSource' in window)) { setConn('off', 'Modo local', 'Este navegador no admite Server-Sent Events.'); return; }
    try {
      sse = new EventSource('/api/eventos');
    } catch (_) { setConn('off', 'Modo local', 'No se pudo abrir la conexión con el servidor local.'); return; }
    sse.onopen = () => setConn('ok', 'Servidor local', 'Conexión SSE activa con el servidor de la red local.');
    sse.onerror = () => setConn('off', 'Modo local', 'Sin conexión en tiempo real. El contenido consultado sigue disponible; el servidor local puede estar apagado.');
    sse.addEventListener('conectado', (e) => {
      try {
        const d = JSON.parse(e.data);
        setConn('ok', 'Servidor local', `SSE activo · ${d.dispositivosConectados || 1} conexión(es) ahora mismo. No es una prueba de concurrencia.`);
      } catch (_) { setConn('ok', 'Servidor local'); }
    });
    sse.addEventListener('concurrencia', (e) => {
      try {
        const d = JSON.parse(e.data);
        const el = $('#conn-status');
        if (el && d.clientesConectados) el.title = `Conexiones SSE activas ahora: ${d.clientesConectados}. Dato del servidor local, no una simulación.`;
      } catch (_) {}
    });
    sse.addEventListener('nueva_solicitud', () => {
      V.addNotif({ texto: 'Nueva solicitud anónima recibida en la red local. El portal público no muestra su contenido.', tipo: 'info', vista: 'solicitudes' });
    });
    sse.addEventListener('actualizacion_solicitud', (e) => {
      try {
        const s = JSON.parse(e.data);
        const recientes = store.get('g3.solicitudes', []);
        const mia = recientes.find((x) => x.codigo === s.codigo);
        if (mia) {
          mia.estado = s.estado;
          store.set('g3.solicitudes', recientes);
          V.addNotif({ texto: `Tu solicitud ${s.codigo} cambió a estado «${(V.estadoTag(s.estado).match(/>([^<]+)</) || [])[1] || s.estado}».`, tipo: 'ok', vista: 'solicitudes' });
        }
      } catch (_) {}
    });
    sse.addEventListener('restauracion_backup', (e) => {
      try { const d = JSON.parse(e.data); V.addNotif({ texto: `El servidor local restauró un respaldo con ${d.total || 0} solicitudes.`, tipo: 'warn' }); } catch (_) {}
    });
  }

  /* ---------- navegación ---------- */
  function vistaHash() {
    const id = (location.hash || '').replace(/^#/, '').split('?')[0];
    return V.VIEW_MAP[id] ? id : 'inicio';
  }

  function toggleRail(abrir) {
    const rail = $('#rail');
    const back = $('#rail-backdrop');
    const btn = $('#rail-open');
    const on = abrir == null ? !rail?.classList.contains('is-open') : abrir;
    rail?.classList.toggle('is-open', on);
    if (back) back.hidden = !on;
    btn?.setAttribute('aria-expanded', String(on));
    if (on) $('#rail-close')?.focus({ preventScroll: true });
    else if (rail?.contains(document.activeElement)) btn?.focus({ preventScroll: true });
  }

  function inicializar() {
    V.leerA11y();
    V.aplicarA11y();
    aplicarPerfil();
    V.renderTabs();
    V.reloj();
    setInterval(V.reloj, 30000);

    // Riel
    $$('[data-view-link]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      V.abrirVista(a.dataset.viewLink);
      toggleRail(false);
    }));
    $('#rail-open')?.addEventListener('click', () => toggleRail());
    $('#rail-close')?.addEventListener('click', () => toggleRail(false));
    $('#inspector-close')?.addEventListener('click', V.cerrarInspector);
    $('#palette-close')?.addEventListener('click', cerrarPalette);
    $('#rail-backdrop')?.addEventListener('click', () => toggleRail(false));
    $('#rail-collapse')?.addEventListener('click', () => {
      const app = $('#app');
      const on = !app.classList.contains('is-collapsed');
      app.classList.toggle('is-collapsed', on);
      store.set('g3.rail', on);
    });
    if (store.get('g3.rail', false)) $('#app')?.classList.add('is-collapsed');

    // Enlaces y botones con data-go
    document.addEventListener('click', (e) => {
      const go = e.target.closest('[data-go]');
      if (go) {
        e.preventDefault();
        V.abrirVista(go.dataset.go, go.dataset.query ? { query: go.dataset.query } : {});
      }
    });

    // Buscador global
    $('#global-search')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = $('#global-q')?.value.trim() || '';
      if (q) { V.buscar(q); $('#global-q').value = ''; }
      else $('#global-q')?.focus();
    });

    // Paleta
    $('#palette-overlay')?.addEventListener('click', (e) => { if (e.target.id === 'palette-overlay') cerrarPalette(); });
    $('#palette-q')?.addEventListener('input', (e) => renderPalette(e.target.value));
    $('#palette-q')?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); marcarPalette(paletteIdx + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcarPalette(paletteIdx - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); ejecutarPalette(paletteIdx); }
      else if (e.key === 'Escape') cerrarPalette();
    });
    document.addEventListener('vitara:palette', abrirPalette);

    // Atajos
    document.addEventListener('keydown', (e) => {
      if (document.body.classList.contains('access-locked') || document.querySelector('dialog[open]')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrirPalette(); return; }
      if (e.key === 'Escape') {
        if (!$('#palette-overlay')?.hidden) cerrarPalette();
        else if (!$('#onboarding-overlay')?.hidden) cerrarOnboarding();
        else if (popover) cerrarPopover();
        else if ($('#rail')?.classList.contains('is-open')) toggleRail(false);
        else V.cerrarInspector();
      }
    });

    // Capas superiores
    $('#btn-notif')?.addEventListener('click', abrirNotif);
    $('#btn-profile')?.addEventListener('click', abrirPerfil);
    $('#btn-a11y-top')?.addEventListener('click', () => {
      V.abrirVista('comunidad');
      setTimeout(() => $('#a11y-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 140);
    });
    document.addEventListener('click', (e) => {
      if (!popover) return;
      if (e.target.closest('.popover') || e.target.closest('#btn-notif') || e.target.closest('#btn-profile')) return;
      cerrarPopover();
    });

    bindOnboarding();
    window.addEventListener('vitara:session', () => { perfil = store.get(PERFIL_KEY, null); aplicarPerfil(); });
    conectar();

    window.addEventListener('vitara:go', (e) => {
      const d = e.detail || {};
      if (d.view) V.abrirVista(d.view, d.query ? { query: d.query } : {});
    });
    window.addEventListener('hashchange', () => {
      const id = vistaHash();
      if (id !== V.state.active) V.abrirVista(id);
    });
    V.abrirVista(vistaHash());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicializar);
  else inicializar();
})();
