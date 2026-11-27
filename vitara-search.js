/**
 * vitara-search.js — índice y buscador sanitario
 * Medicamentos, IPRESS, equipos, alertas, kits, canales y departamentos.
 * Cada resultado conserva su fuente, su fecha y su nivel de verificación.
 */
(function () {
  'use strict';
  const V = window.Vitara;
  if (!V) return;
  const { D, esc, norm, num, pct, icon, source, SRC, $, $$ } = V;

  const state = { q: '', filtro: 'todo', items: null };

  // Historial local de búsquedas: mínimo, depurable y sin datos sensibles.
  const HIST_KEY = 'g3.busquedas';
  const HIST_MAX = 10;
  const HIST_DIAS = 30;

  const TIPO_LABEL = {
    medicamento: 'Medicamento DIGEMID', ipress: 'IPRESS RENIPRESS', equipo: 'Equipo biomédico',
    alerta: 'Alerta sanitaria', kit: 'Kit dengue', canal: 'Canal oficial', departamento: 'Departamento'
  };
  const TIPO_ICON = {
    medicamento: 'pill', ipress: 'hospital', equipo: 'box', alerta: 'alert', kit: 'stethoscope', canal: 'phone', departamento: 'map'
  };
  const TIPO_CLASS = {
    medicamento: 'med', ipress: '', equipo: 'eq', alerta: 'alert', kit: 'kit', canal: 'canal', departamento: ''
  };

  function construirIndice() {
    const items = [];
    (D.medicamentos || []).forEach((m, i) => {
      items.push({
        id: 'med-' + i, tipo: 'medicamento',
        titulo: `${m.dci} ${m.concentracion}`,
        desc: `${m.forma} · ${m.accionTerapeutica}`,
        tags: [m.dci, m.marcaComercial, m.forma, m.concentracion, m.condicionVenta, m.esencial ? 'esencial' : ''],
        fuente: SRC.digemid, fecha: 'consulta 23/11/2026', raw: m,
        tagHTML: m.esencial ? '<span class="tag tag--ok">Esencial</span>' : '',
        metaHTML: `<span class="tag tag--blue">Genérico desde S/ ${num(m.precioGenericoMin, 2)}</span>
          <span class="tag tag--grey">Marca S/ ${num(m.precioMarcaPromedio, 2)}</span>
          <span class="tag tag--new">Ahorro ${pct(m.ahorroPorcentaje)}</span>`
      });
    });
    (D.ipress || []).forEach((p, i) => {
      items.push({
        id: 'ipr-' + i, tipo: 'ipress',
        titulo: p.nombre,
        desc: `${p.red} · ${p.microred} · ${p.distrito}`,
        tags: [p.nombre, p.red, p.microred, p.distrito, p.categoria, p.cod],
        fuente: SRC.sismed, fecha: p.fechaInfo || '31/10/2026', raw: p,
        tagHTML: `<span class="tag tag--grey">${esc(p.categoria)}</span>${p.telesalud ? '<span class="tag tag--new">Telesalud</span>' : ''}`,
        metaHTML: `<span class="tag tag--ok">${pct(p.dispo)} disponibilidad</span><span class="tag tag--grey">${esc(p.horario || 'Horario no publicado')}</span>`
      });
    });
    (D.equiposBiomedicos || []).forEach((e, i) => {
      items.push({
        id: 'eq-' + i, tipo: 'equipo',
        titulo: e.nombre,
        desc: `${e.servicio} · ${e.fallaAcreditada}`,
        tags: [e.nombre, e.servicio, e.marcaComun, e.criticidad, e.codigoIETSI],
        fuente: SRC.ietsi, fecha: 'catálogo 2026', raw: e,
        tagHTML: `<span class="tag ${e.criticidad === 'ALTA' ? 'tag--err' : 'tag--warn'}">Criticidad ${esc(e.criticidad)}</span>`,
        metaHTML: `<span class="tag tag--grey">${esc(e.codigoIETSI)}</span><span class="tag tag--grey">Vida útil ${esc(e.vidaUtilAnos)} años</span>`
      });
    });
    (D.alertasSanitarias || []).forEach((a, i) => {
      items.push({
        id: 'alr-' + i, tipo: 'alerta',
        titulo: a.producto,
        desc: `${a.num} · Lote ${a.lote} · ${a.motivo}`,
        tags: [a.producto, a.num, a.lote, a.motivo, a.accion, 'alerta', 'falsificado'],
        fuente: SRC.digemid, fecha: a.fecha, raw: a,
        tagHTML: '<span class="tag tag--err">Alerta vigente</span>',
        metaHTML: `<span class="tag tag--warn">Lote ${esc(a.lote)}</span><span class="tag tag--grey">${esc(a.fecha)}</span>`
      });
    });
    (D.kitsDengue || []).forEach((k, i) => {
      items.push({
        id: 'kit-' + i, tipo: 'kit',
        titulo: k.item,
        desc: `${k.tipo} · ${k.indicacion}`,
        tags: [k.item, k.tipo, k.indicacion, 'dengue'],
        fuente: SRC.sismed, fecha: 'corte 31/10/2026', raw: k,
        tagHTML: `<span class="tag tag--warn">${esc(k.tipo)}</span>`,
        metaHTML: `<span class="tag tag--ok">${esc(k.disponibilidadRed)}</span><span class="tag tag--grey">Stock ${esc(k.stockTotalLaLibertad)}</span>`
      });
    });
    (D.canalesAyuda || []).forEach((c, i) => {
      items.push({
        id: 'can-' + i, tipo: 'canal',
        titulo: c.nombre,
        desc: `${c.tipo} · ${c.descripcion}`,
        tags: [c.nombre, c.tipo, c.telefono, c.descripcion],
        fuente: SRC.minsa, fecha: 'consulta 23/11/2026', raw: c,
        tagHTML: '<span class="tag tag--new">Canal oficial</span>',
        metaHTML: `<span class="tag tag--blue">${esc(c.telefono)}</span><span class="tag tag--grey">${esc(c.tipo)}</span>`
      });
    });
    return items;
  }

  function puntuar(item, q) {
    if (!q) return 0;
    const t = norm(item.titulo);
    let s = 0;
    if (t === q) s += 8;
    else if (t.startsWith(q)) s += 5;
    else if (t.includes(q)) s += 3;
    if (norm(item.desc).includes(q)) s += 1.5;
    for (const tag of item.tags) {
      const n = norm(tag);
      if (!n) continue;
      if (n === q) s += 2.5;
      else if (n.includes(q)) s += 1;
    }
    return s;
  }

  function filtrar() {
    if (!state.items) state.items = construirIndice();
    const q = norm(state.q);
    let out = state.items.filter((it) => state.filtro === 'todo' || it.tipo === state.filtro);
    if (q) {
      out = out.map((it) => ({ it, s: puntuar(it, q) })).filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s || a.it.titulo.localeCompare(b.it.titulo, 'es'))
        .map((x) => x.it);
    } else {
      const orden = ['medicamento', 'ipress', 'alerta', 'equipo', 'kit', 'canal'];
      out = out.slice().sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo));
      out = out.filter((it, i) => i < 8);
    }
    return out.slice(0, 40);
  }

  function tarjeta(it) {
    return `<button class="result result--${it.tipo}" type="button" data-result="${it.id}" aria-label="Ver detalle de ${esc(it.titulo)}">
      <span class="result__ico result__ico--${TIPO_CLASS[it.tipo]}">${icon(TIPO_ICON[it.tipo])}</span>
      <span class="result__body">
        <span class="result__tit"><strong>${esc(it.titulo)}</strong><span class="tag tag--grey">${TIPO_LABEL[it.tipo]}</span>${it.tagHTML || ''}</span>
        <span class="result__desc">${esc(it.desc)}</span>
        <span class="result__meta">${it.metaHTML || ''}<span class="result__source">${esc(it.fuente.texto)} · ${esc(it.fecha || it.fuente.fecha)}</span></span>
      </span>
      <span class="result__go">${icon('chevron-right', 'i--sm')}</span>
    </button>`;
  }

  function render() {
    const cont = $('#search-results');
    const count = $('#results-count');
    const src = $('#results-source');
    if (!cont) return;
    const q = state.q.trim();
    const res = filtrar();
    if (count) {
      count.textContent = q
        ? `${res.length} resultado${res.length === 1 ? '' : 's'} para «${q}»${state.filtro !== 'todo' ? ' en ' + TIPO_LABEL[state.filtro] : ''}`
        : 'Sugerencias para empezar · escribe para buscar en toda la base';
    }
    if (src) src.textContent = 'Fuente: RENIPRESS · InfoSismedLL · DIGEMID · IETSI · MINSA · consulta 23/11/2026';
    if (!res.length) {
      cont.innerHTML = `<div class="empty"><div class="empty__ico">${icon('search', 'i--lg')}</div>
        <h3>Sin coincidencias verificables</h3>
        <p>No encontramos «${esc(q)}» en la base local. Prueba con el principio activo, el distrito o el nombre de la posta. Si el recurso no está, puedes solicitar su verificación a una sede.</p>
        <div class="quick-list" style="justify-content:center"><button class="btn btn--primary btn--sm" type="button" data-empty-go="solicitudes">Solicitar verificación ${icon('arrow-right', 'i--sm')}</button><button class="btn btn--ghost btn--sm" type="button" data-empty-reset>Limpiar búsqueda</button></div></div>`;
      cont.querySelector('[data-empty-go]')?.addEventListener('click', () => V.abrirVista('solicitudes', { item: q }));
      cont.querySelector('[data-empty-reset]')?.addEventListener('click', () => setQuery(''));
      return;
    }
    cont.innerHTML = res.map(tarjeta).join('');
  }

  function setQuery(q) {
    state.q = String(q || '');
    const page = $('#page-q');
    if (page && page.value !== state.q) page.value = state.q;
    render();
  }

  /* ---------- historial local de búsquedas ---------- */
  function leerHistorial() {
    let lista = [];
    try { lista = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
    if (!Array.isArray(lista)) return [];
    const limite = Date.now() - HIST_DIAS * 86400000;
    const limpias = lista.filter((x) => x && typeof x.q === 'string' && (!x.ts || x.ts >= limite));
    if (limpias.length !== lista.length) {
      try { localStorage.setItem(HIST_KEY, JSON.stringify(limpias)); } catch { /* sin persistencia */ }
    }
    return limpias;
  }

  function guardarBusqueda(q) {
    const texto = String(q || '').trim().slice(0, 80);
    if (texto.length < 2) return;
    const lista = leerHistorial().filter((x) => norm(x.q) !== norm(texto));
    lista.unshift({ q: texto, filtro: state.filtro, ts: Date.now() });
    try { localStorage.setItem(HIST_KEY, JSON.stringify(lista.slice(0, HIST_MAX))); } catch { /* sin persistencia */ }
    renderHistorial();
  }

  function renderHistorial() {
    const card = $('#recent-card');
    const cont = $('#recent-searches');
    if (!card || !cont) return;
    const lista = leerHistorial().slice(0, 6);
    card.hidden = !lista.length;
    if (!lista.length) { cont.innerHTML = ''; return; }
    cont.innerHTML = lista.map((x) => `<button class="filter" type="button" data-recent-query="${esc(x.q)}">${esc(x.q)}</button>`).join('');
  }

  function borrarHistorial() {
    try { localStorage.removeItem(HIST_KEY); } catch { /* sin persistencia */ }
    renderHistorial();
    V.toast('Búsquedas recientes borradas de este dispositivo.');
  }

  function porId(id) {
    if (!state.items) state.items = construirIndice();
    return state.items.find((x) => x.id === id);
  }

  function detalle(it) {
    if (!it) return;
    const r = it.raw;
    let html = '';
    if (it.tipo === 'medicamento') {
      html = `<div class="inspector-card"><h4>${esc(it.titulo)}</h4><p>${esc(r.accionTerapeutica)}</p></div>
        <dl class="kv"><dt>Forma</dt><dd>${esc(r.forma)}</dd><dt>Condición</dt><dd>${esc(r.condicionVenta)}</dd><dt>Esencial</dt><dd>${r.esencial ? 'Sí' : 'No registrado'}</dd><dt>Disponibilidad</dt><dd>${esc(r.disponibilidadRed || 'Sin dato oficial publicado')}</dd></dl>
        <div class="inspector-card"><h4>Comparación de precio</h4><dl class="kv"><dt>Genérico mín.</dt><dd>S/ ${num(r.precioGenericoMin, 2)}</dd><dt>Genérico prom.</dt><dd>S/ ${num(r.precioGenericoPromedio, 2)}</dd><dt>Marca prom.</dt><dd>S/ ${num(r.precioMarcaPromedio, 2)} · ${esc(r.marcaComercial)}</dd><dt>Ahorro</dt><dd>${pct(r.ahorroPorcentaje)}</dd></dl><p class="source source--warn" style="margin-top:8px">Precio de referencia DIGEMID/OPP. El mes de corte no está publicado en la base local: no lo presentamos como cotización vigente.</p></div>
        <p class="tiny muted">${esc(r.estudioFuente || '')}</p>`;
    } else if (it.tipo === 'ipress') {
      html = `<div class="inspector-card"><h4>${esc(r.nombre)}</h4><p>${esc(r.red)} · ${esc(r.microred)} · ${esc(r.distrito)}</p></div>
        <dl class="kv"><dt>Código</dt><dd>${esc(r.cod)}</dd><dt>Categoría</dt><dd>${esc(r.categoria)}</dd><dt>Horario</dt><dd>${esc(r.horario || 'Sin dato oficial publicado')}</dd><dt>Teléfono</dt><dd>${esc(r.telefono || 'Sin dato oficial publicado')}</dd><dt>Disponibilidad</dt><dd>${pct(r.dispo)} · ${esc(r.nivel || '')}</dd><dt>Sobrestock</dt><dd>${pct(r.sobre)}</dd><dt>Substock</dt><dd>${pct(r.sub)}</dd><dt>Desabastecido</dt><dd>${pct(r.desab)}</dd><dt>Telesalud</dt><dd>${r.telesalud ? 'Sí registrada' : 'No registrada'}</dd></dl>
        <div class="inspector-actions"><button class="btn btn--primary btn--sm" type="button" data-ipr-solicitar="${esc(r.nombre)}">Solicitar verificación</button><button class="btn btn--ghost btn--sm" type="button" data-ipr-mapa="${esc(r.distrito)}">Ver en el mapa</button></div>
        ${source(SRC.sismed, 'fecha de corte del establecimiento: ' + (r.fechaInfo || '31/10/2026'))}`;
    } else if (it.tipo === 'equipo') {
      html = `<div class="inspector-card"><h4>${esc(r.nombre)}</h4><p>${esc(r.servicio)}</p></div>
        <dl class="kv"><dt>Criticidad</dt><dd>${esc(r.criticidad)}</dd><dt>Marca común</dt><dd>${esc(r.marcaComun)}</dd><dt>Vida útil</dt><dd>${esc(r.vidaUtilAnos)} años</dd><dt>Mantenimiento</dt><dd>${esc(r.protocoloMantenimiento)}</dd><dt>Código catálogo</dt><dd>${esc(r.codigoIETSI)}</dd></dl>
        <div class="inspector-card"><h4>Falla acreditada</h4><p>${esc(r.fallaAcreditada)}</p></div>
        <p class="source">${esc(SRC.contraloria.texto)} · ${esc(SRC.contraloria.fecha)}. Un equipo operativo en la base no garantiza que lo esté hoy en la sede.</p>`;
    } else if (it.tipo === 'alerta') {
      html = `<div class="inspector-card"><h4>${esc(r.num)}</h4><p>${esc(r.motivo)}</p></div>
        <dl class="kv"><dt>Producto</dt><dd>${esc(r.producto)}</dd><dt>Lote</dt><dd>${esc(r.lote)}</dd><dt>Fecha</dt><dd>${esc(r.fecha)}</dd><dt>Riesgo</dt><dd>${esc(r.riesgo)}</dd><dt>Acción</dt><dd>${esc(r.accion)}</dd></dl>
        ${source(SRC.digemid, 'alerta ' + r.fecha)}<p class="tiny muted">No compres ni uses un producto de un lote alertado. Consulta en la farmacia de tu sede.</p>`;
    } else if (it.tipo === 'kit') {
      html = `<div class="inspector-card"><h4>${esc(r.item)}</h4><p>${esc(r.indicacion)}</p></div>
        <dl class="kv"><dt>Tipo</dt><dd>${esc(r.tipo)}</dd><dt>Stock regional</dt><dd>${esc(r.stockTotalLaLibertad)}</dd><dt>Disponibilidad</dt><dd>${esc(r.disponibilidadRed)}</dd></dl>${source(SRC.sismed)}`;
    } else if (it.tipo === 'canal') {
      html = `<div class="inspector-card"><h4>${esc(r.nombre)}</h4><p>${esc(r.descripcion)}</p></div>
        <dl class="kv"><dt>Tipo</dt><dd>${esc(r.tipo)}</dd><dt>Teléfono</dt><dd>${esc(r.telefono)}</dd></dl>
        <div class="inspector-actions"><a class="btn btn--primary btn--sm" href="${esc(r.urlDirecta)}">Abrir canal ${icon('external', 'i--sm')}</a><a class="btn btn--ghost btn--sm" href="${esc(r.urlOficial || r.urlDirecta)}" target="_blank" rel="noopener">Sitio oficial</a></div>${source(SRC.minsa)}`;
    }
    V.abrirInspector(TIPO_LABEL[it.tipo], html);
    const body = $('#inspector-body');
    body.querySelector('[data-ipr-solicitar]')?.addEventListener('click', (e) => {
      V.abrirVista('solicitudes', { item: e.currentTarget.dataset.iprSolicitar, sede: r.nombre });
    });
    body.querySelector('[data-ipr-mapa]')?.addEventListener('click', (e) => {
      V.abrirVista('mapas', { distrito: e.currentTarget.dataset.iprMapa });
    });
  }

  function bind() {
    const form = $('#page-search');
    const input = $('#page-q');
    if (form && !form.dataset.bind) {
      form.dataset.bind = '1';
      form.addEventListener('submit', (e) => { e.preventDefault(); setQuery(input.value); guardarBusqueda(input.value); });
    }
    if (input && !input.dataset.bind) {
      input.dataset.bind = '1';
      let t = 0;
      input.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => setQuery(input.value), 120);
      });
    }
    const filters = $('#search-filters');
    if (filters && !filters.dataset.bind) {
      filters.dataset.bind = '1';
      filters.addEventListener('click', (e) => {
        const b = e.target.closest('[data-filter]');
        if (!b) return;
        state.filtro = b.dataset.filter;
        filters.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        render();
      });
    }
    const quick = $('#quick-searches');
    if (quick && !quick.dataset.bind) {
      quick.dataset.bind = '1';
      quick.addEventListener('click', (e) => {
        const b = e.target.closest('[data-query]');
        if (!b) return;
        setQuery(b.dataset.query);
      });
    }
    const results = $('#search-results');
    if (results && !results.dataset.bind) {
      results.dataset.bind = '1';
      results.addEventListener('click', (e) => {
        const b = e.target.closest('[data-result]');
        if (b) { guardarBusqueda(state.q); detalle(porId(b.dataset.result)); }
      });
    }
    const recientes = $('#recent-searches');
    if (recientes && !recientes.dataset.bind) {
      recientes.dataset.bind = '1';
      recientes.addEventListener('click', (e) => {
        const b = e.target.closest('[data-recent-query]');
        if (!b) return;
        setQuery(b.dataset.recentQuery);
      });
    }
    const borrar = $('#recent-clear');
    if (borrar && !borrar.dataset.bind) {
      borrar.dataset.bind = '1';
      borrar.addEventListener('click', borrarHistorial);
    }
  }

  function inicializar(opts = {}) {
    if (!state.items) state.items = construirIndice();
    bind();
    renderHistorial();
    if (opts.query != null) {
      setQuery(opts.query);
      const input = $('#page-q');
      if (input) input.focus({ preventScroll: true });
    } else {
      render();
    }
  }

  V.onView('buscar', inicializar);
  V.buscar = function (q) {
    V.abrirVista('buscar', { query: q });
    if (!V.state.active || V.state.active !== 'buscar') {
      // abrirVista ya dispara el hook; esto cubre llamadas antes del primer render.
      inicializar({ query: q });
    }
  };
  V.searchIndex = () => (state.items || (state.items = construirIndice()));
})();
