/**
 * vitara-boards.js — Tablero SISMED y mapas
 * Los indicadores se muestran con su fuente y fecha de corte. Los mapas son
 * esquemas de referencia, no límites político-administrativos oficiales.
 */
(function () {
  'use strict';
  const V = window.Vitara;
  if (!V) return;
  const { D, esc, num, pct, icon, source, SRC, $, $$ } = V;

  const SIS = D.infoSismed || {};
  const KPIS = SIS.kpis || {};
  const REDES = SIS.redesSalud || [];
  const DEPTS = D.departamentos || [];
  const IPRESS = D.ipress || [];
  const FECHA = SIS.fechaCorte || '31/10/2026';

  /* ================= TABLERO ================= */
  function pintarKpis() {
    const cont = $('#kpis-sismed');
    if (!cont) return;
    const cards = [
      { k: 'disponibilidadGlobal', clase: 'ok', nota: 'Meta regional 91.0% · fuente InfoSismedLL' },
      { k: 'sobrestock', clase: 'blue', nota: 'Existencias > 3 meses de consumo' },
      { k: 'normostock', clase: 'ok', nota: 'Rango operativo de 1 a 3 meses' },
      { k: 'critico', clase: 'warn', nota: 'Substock + desabastecido' },
      { k: 'substock', clase: 'warn', nota: 'Menos de 1 mes de consumo' },
      { k: 'desabastecido', clase: 'rose', nota: 'Stock cero en farmacia al corte' },
      { k: 'sinRotacion', clase: 'blue', nota: 'Sin movimiento por más de 6 meses' },
      { k: 'ipressMonitoreadas', clase: 'ok', nota: 'IPRESS monitoreadas en 12 redes' }
    ];
    cont.innerHTML = cards.map((c) => {
      const raw = c.k === 'ipressMonitoreadas' ? { valor: SIS.ipressMonitoreadas, etiqueta: 'IPRESS monitoreadas' } : (KPIS[c.k] || {});
      const v = raw.valor;
      const unidad = c.k === 'ipressMonitoreadas' ? '' : '%';
      return `<article class="kpi kpi--${c.clase}">
        <p class="kpi__l">${esc(raw.etiqueta || c.k)}</p>
        <p class="kpi__v">${c.k === 'ipressMonitoreadas' ? num(v) : num(v, 2)}<small>${unidad}</small></p>
        <p class="kpi__f">${esc(raw.descripcion || c.nota)}</p>
        <p class="source" style="margin-top:5px">${esc(SRC.sismed.texto)} · ${esc(FECHA)}</p>
      </article>`;
    }).join('');
  }

  function pintarBarras() {
    const cont = $('#bars-redes');
    if (!cont) return;
    const orden = REDES.slice().sort((a, b) => b.dispo - a.dispo);
    cont.innerHTML = orden.map((r) => {
      const clase = r.dispo < 80 ? ' low' : r.dispo < 91 ? ' warn' : '';
      return `<div class="bar-row${clase}" title="${esc(r.nombre)}: ${pct(r.dispo)} de disponibilidad">
        <span class="bar-row__l">${esc(r.nombre.replace(/^RED /, ''))}</span>
        <span class="bar-row__track" role="img" aria-label="${pct(r.dispo)}"><span class="bar-row__fill" style="width:${Math.max(2, Math.min(100, r.dispo))}%"></span></span>
        <span class="bar-row__v">${pct(r.dispo)}</span>
      </div>`;
    }).join('');
  }

  function pintarLinea() {
    const svg = $('#line-historico');
    if (!svg) return;
    const hist = (SIS.historico12Meses || []).slice();
    if (!hist.length) return;
    const W = 360, H = 220, L = 30, R = 12, T = 16, B = 34;
    const min = 90, max = 95;
    const x = (i) => L + (i * (W - L - R)) / Math.max(1, hist.length - 1);
    const y = (v) => T + ((max - v) / (max - min)) * (H - T - B);
    const puntos = hist.map((h, i) => `${x(i).toFixed(1)},${y(h.dispo).toFixed(1)}`).join(' ');
    const area = `${L},${H - B} ${puntos} ${W - R},${H - B}`;
    let grid = '';
    for (let v = 90; v <= 95; v++) {
      grid += `<line class="grid" x1="${L}" y1="${y(v).toFixed(1)}" x2="${W - R}" y2="${y(v).toFixed(1)}"/>
        <text class="axis" x="2" y="${(y(v) + 3).toFixed(1)}">${v}%</text>`;
    }
    const dots = hist.map((h, i) => `<circle class="punto" cx="${x(i).toFixed(1)}" cy="${y(h.dispo).toFixed(1)}" r="2.6"><title>${esc(h.mes)}: ${pct(h.dispo)}</title></circle>`).join('');
    const labels = hist.map((h, i) => (i % 2 === 0 || i === hist.length - 1)
      ? `<text class="axis" x="${x(i).toFixed(1)}" y="${H - 14}" text-anchor="middle">${esc(h.mes.replace(' 20', ' '))}</text>` : '').join('');
    svg.innerHTML = `<defs><linearGradient id="areaVerde" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#2FA982" stop-opacity=".28"/><stop offset="100%" stop-color="#2FA982" stop-opacity="0"/>
      </linearGradient></defs>
      ${grid}<polygon class="area" points="${area}"/><polyline class="linea" points="${puntos}"/>${dots}${labels}`;
  }

  function filaIPRESS(p) {
    const nivel = p.dispo >= 95 ? 'tag--ok' : p.dispo >= 91 ? 'tag--warn' : 'tag--err';
    return `<tr data-ipress="${esc(p.cod)}" tabindex="0" role="button" aria-label="Ver detalle de ${esc(p.nombre)}" style="cursor:pointer">
      <td><strong>${esc(p.nombre)}</strong></td>
      <td>${esc(p.red.replace(/^RED /, ''))}${p.microred ? ' · ' + esc(p.microred) : ''}</td>
      <td>${esc(p.distrito)}</td>
      <td>${esc(p.categoria)}</td>
      <td class="num"><span class="mini-bar"><span style="width:${Math.min(100, p.dispo)}%"></span></span>${pct(p.dispo)}</td>
      <td><span class="tag ${nivel}">${esc(p.nivel || 'Sin dato')}</span></td>
      <td>${esc(p.fechaInfo || FECHA)}</td>
    </tr>`;
  }

  function pintarTabla(filtro = '') {
    const body = $('#tabla-ipress-body');
    if (!body) return;
    const q = V.norm(filtro);
    const lista = IPRESS.filter((p) => !q || V.norm([p.nombre, p.red, p.microred, p.distrito, p.categoria, p.cod].join(' ')).includes(q));
    body.innerHTML = lista.length ? lista.map(filaIPRESS).join('')
      : `<tr><td colspan="7" class="table-empty">Sin establecimientos que coincidan con «${esc(filtro)}».</td></tr>`;
    body.querySelectorAll('[data-ipress]').forEach((tr) => {
      const abrir = () => detalleIPRESS(tr.dataset.ipress);
      tr.addEventListener('click', abrir);
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    });
  }

  function detalleIPRESS(cod) {
    const p = IPRESS.find((x) => String(x.cod) === String(cod));
    if (!p) return;
    V.abrirInspector('IPRESS · ' + p.nombre, `
      <div class="inspector-card"><h4>${esc(p.nombre)}</h4><p>${esc(p.red)} · ${esc(p.microred)}</p><p class="source">${esc(SRC.renipress.texto)} · ${esc(SRC.renipress.fecha)}</p></div>
      <dl class="kv"><dt>Código</dt><dd>${esc(p.cod)}</dd><dt>Distrito</dt><dd>${esc(p.distrito)}</dd><dt>Categoría</dt><dd>${esc(p.categoria)}</dd><dt>Horario</dt><dd>${esc(p.horario || 'Sin dato oficial publicado')}</dd><dt>Teléfono</dt><dd>${esc(p.telefono || 'Sin dato oficial publicado')}</dd><dt>Disponibilidad</dt><dd>${pct(p.dispo)} · ${esc(p.nivel || '')}</dd><dt>Normostock</dt><dd>${pct(p.normo)}</dd><dt>Sobrestock</dt><dd>${pct(p.sobre)}</dd><dt>Substock</dt><dd>${pct(p.sub)}</dd><dt>Desabastecido</dt><dd>${pct(p.desab)}</dd></dl>
      <div class="inspector-card"><h4>Equipos declarados</h4><p>${esc((p.equipos || []).join(' · ') || 'Sin dato oficial publicado')}</p></div>
      <p class="source">${esc(SRC.sismed.texto)} · corte ${esc(p.fechaInfo || FECHA)}</p>`);
  }

  function initTablero() {
    pintarKpis();
    pintarBarras();
    pintarLinea();
    pintarTabla();
    const input = $('#tabla-ipress-q');
    if (input && !input.dataset.bind) {
      input.dataset.bind = '1';
      input.addEventListener('input', () => pintarTabla(input.value));
    }
  }

  /* ================= MAPAS ================= */
  const DEP_GEO = {
    'Tumbes': [-80.45, -3.57], 'Piura': [-80.63, -5.19], 'Lambayeque': [-79.84, -6.77],
    'La Libertad': [-79.03, -8.11], 'Áncash': [-77.53, -9.53], 'Lima Metropolitana': [-77.04, -12.05],
    'Lima Región': [-76.40, -11.20], 'Callao': [-77.15, -12.25], 'Ica': [-75.73, -14.07],
    'Arequipa': [-71.54, -16.41], 'Moquegua': [-70.93, -17.19], 'Tacna': [-70.25, -18.01],
    'Cajamarca': [-78.51, -7.16], 'Amazonas': [-77.87, -6.23], 'San Martín': [-76.97, -6.03],
    'Loreto': [-75.00, -4.00], 'Ucayali': [-73.25, -9.00], 'Huánuco': [-76.24, -9.93],
    'Pasco': [-76.26, -10.68], 'Junín': [-75.00, -11.50], 'Huancavelica': [-74.97, -12.78],
    'Ayacucho': [-74.22, -13.16], 'Apurímac': [-73.09, -14.05], 'Cusco': [-71.97, -13.53],
    'Madre de Dios': [-69.18, -12.59], 'Puno': [-70.02, -15.84]
  };
  const RED_GEO = {
    'RED CHEPEN': [-79.43, -7.22], 'RED PACASMAYO': [-79.57, -7.40], 'RED ASCOPE': [-79.10, -7.71],
    'RED TRUJILLO': [-79.03, -8.11], 'RED VIRU': [-78.75, -8.42], 'RED SANCHEZ CARRIÓN': [-78.17, -7.80],
    'RED SANTIAGO DE CHUCO': [-78.17, -8.15], 'RED OTUZCO': [-78.53, -7.90], 'RED JULCAN': [-78.45, -8.30],
    'RED GRAN CHIMU': [-78.72, -7.50], 'RED BOLIVAR': [-77.78, -7.15], 'RED PATAZ': [-77.45, -7.95]
  };
  const MAP_STATE = { modo: 'peru', dep: 'La Libertad', red: 'RED TRUJILLO' };

  function proyectar(lon, lat, bbox, w, h, pad) {
    const x = pad + ((lon - bbox[0]) / (bbox[2] - bbox[0])) * (w - pad * 2);
    const y = pad + ((bbox[3] - lat) / (bbox[3] - bbox[1])) * (h - pad * 2);
    return [x, y];
  }
  function colorDispo(v) {
    if (!Number.isFinite(Number(v))) return '#C9D6CF';
    if (v >= 95) return '#4FB58C';
    if (v >= 90) return '#8ACCAF';
    if (v >= 80) return '#E5C27C';
    if (v >= 60) return '#E0A18E';
    return '#CF7A8C';
  }
  const PERU_PATH = 'M128,66 L196,58 L268,92 L344,104 L414,148 L468,214 L520,286 L548,366 L532,446 L494,516 L462,586 L424,646 L388,690 L352,700 L330,664 L318,612 L296,552 L286,490 L268,430 L250,366 L228,300 L202,244 L166,196 L136,150 L118,104 Z';
  const LL_PATH = 'M92,88 L196,64 L300,96 L396,138 L470,196 L482,286 L452,380 L394,462 L312,516 L226,536 L152,504 L112,438 L92,352 L84,246 L82,158 Z';

  function pintarMapa() {
    const wrap = $('#mapa-svg-wrap');
    if (!wrap) return;
    const esPeru = MAP_STATE.modo === 'peru';
    const bbox = esPeru ? [-81.5, -18.7, -68.5, 0.2] : [-79.85, -8.95, -77.0, -6.85];
    const W = 620, H = 760, PAD = 54;
    const nodos = esPeru
      ? DEPTS.map((d) => {
          const g = DEP_GEO[d.dep] || [-75, -10];
          const [x, y] = proyectar(g[0], g[1], bbox, W, H, PAD);
          return { id: d.dep, nombre: d.dep, x, y, v: d.dispoSismed, dato: d };
        })
      : REDES.map((r) => {
          const g = RED_GEO[r.nombre] || [-78.5, -8];
          const [x, y] = proyectar(g[0], g[1], bbox, W, H, PAD);
          return { id: r.nombre, nombre: r.nombre.replace(/^RED /, ''), x, y, v: r.dispo, dato: r };
        });
    const activo = esPeru ? MAP_STATE.dep : MAP_STATE.red;
    wrap.innerHTML = `<svg class="map-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esPeru ? 'Mapa esquemático del Perú con 26 departamentos' : 'Mapa esquemático de las 12 redes de La Libertad'}">
      <defs><linearGradient id="mapaFondo" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F7FCF9"/><stop offset="100%" stop-color="#E7F5EE"/></linearGradient></defs>
      <path d="${esPeru ? PERU_PATH : LL_PATH}" fill="url(#mapaFondo)" stroke="#B9D9CA" stroke-width="1.5"/>
      <g opacity=".32" stroke="#CFE5DA" stroke-width=".7">
        ${Array.from({ length: 7 }, (_, i) => `<line x1="${60 + i * 80}" y1="50" x2="${60 + i * 80}" y2="${H - 50}"/>`).join('')}
        ${Array.from({ length: 9 }, (_, i) => `<line x1="50" y1="${60 + i * 80}" x2="${W - 50}" y2="${60 + i * 80}"/>`).join('')}
      </g>
      ${nodos.map((n) => {
        const sel = n.id === activo;
        const r = esPeru ? Math.max(5, Math.min(11, 4 + (n.dato.ipress || 0) / 60)) : 9;
        return `<g class="nodo-mapa" data-nodo="${esc(n.id)}" tabindex="0" role="button" aria-pressed="${sel}" aria-label="${esc(n.nombre)}: ${pct(n.v)} de disponibilidad">
          ${sel ? `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r + 7}" fill="none" stroke="#0B7A62" stroke-width="1.4" opacity=".55"/>` : ''}
          <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${r}" fill="${colorDispo(n.v)}" stroke="#fff" stroke-width="2" style="cursor:pointer"/>
          <text x="${n.x.toFixed(1)}" y="${(n.y - r - 5).toFixed(1)}" text-anchor="middle" font-size="${esPeru ? 9 : 10}" font-weight="700" fill="#2A4A3D" pointer-events="none">${esc(n.nombre)}</text>
        </g>`;
      }).join('')}
    </svg>`;
    const leyenda = $('#mapa-leyenda');
    if (leyenda) {
      leyenda.innerHTML = `<span><i style="background:#4FB58C"></i> ≥ 95%</span><span><i style="background:#8ACCAF"></i> 90–94.9%</span><span><i style="background:#E5C27C"></i> 80–89.9%</span><span><i style="background:#CF7A8C"></i> < 80%</span><span>${esPeru ? 'Tamaño = IPRESS' : '12 redes de salud'}</span>`;
    }
    wrap.querySelectorAll('[data-nodo]').forEach((g) => {
      const abrir = () => {
        if (esPeru) MAP_STATE.dep = g.dataset.nodo; else MAP_STATE.red = g.dataset.nodo;
        pintarMapa();
        pintarPanel();
      };
      g.addEventListener('click', abrir);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    });
  }

  function pintarPanel() {
    const panel = $('#mapa-panel');
    if (!panel) return;
    if (MAP_STATE.modo === 'peru') {
      const d = DEPTS.find((x) => x.dep === MAP_STATE.dep) || DEPTS[0];
      if (!d) return;
      panel.innerHTML = `<p class="eyebrow eyebrow--muted">Departamento</p><h3>${esc(d.dep)}</h3>
        <p class="map-panel__val">${pct(d.dispoSismed)} <small>disponibilidad</small></p>
        <p class="source">${esc(SRC.sismed.texto)} · referencia departamental · ${esc(FECHA)}</p>
        <dl class="kv"><dt>Población</dt><dd>${num(d.pob)}</dd><dt>Aseguramiento</dt><dd>${pct(d.sisAseg)} SIS</dd><dt>Brecha infra.</dt><dd>${pct(d.brechaInfra)}</dd><dt>IPRESS</dt><dd>${num(d.ipress)}</dd><dt>Hospitales</dt><dd>${num(d.hosp)}</dd><dt>Camas / 10k</dt><dd>${num(d.camas10k, 1)}</dd><dt>Riesgo dengue</dt><dd><span class="tag ${d.riesgoDengue === 'ALTO' ? 'tag--err' : d.riesgoDengue === 'MEDIO' ? 'tag--warn' : 'tag--grey'}">${esc(d.riesgoDengue)}</span></dd></dl>
        <p class="map-note">La disponibilidad es una referencia consolidada, no un acta por departamento. La brecha de infraestructura proviene del Informe 243 de la Defensoría. Los límites del esquema no son oficiales.</p>`;
    } else {
      const r = REDES.find((x) => x.nombre === MAP_STATE.red) || REDES[0];
      if (!r) return;
      panel.innerHTML = `<p class="eyebrow eyebrow--muted">Red de salud</p><h3>${esc(r.nombre)}</h3>
        <p class="map-panel__val">${pct(r.dispo)} <small>disponibilidad</small></p>
        <p class="source">${esc(SRC.sismed.texto)} · ${esc(FECHA)}</p>
        <dl class="kv"><dt>IPRESS</dt><dd>${num(r.ipressCount)}</dd><dt>Normostock</dt><dd>${pct(r.normo)}</dd><dt>Sobrestock</dt><dd>${pct(r.sobre)}</dd><dt>Substock</dt><dd>${pct(r.sub)}</dd><dt>Desabastecido</dt><dd>${pct(r.desab)}</dd><dt>Sin rotación</dt><dd>${num(r.sinRotacion)} productos</dd></dl>
        <div class="red-list">${REDES.slice().sort((a, b) => b.dispo - a.dispo).map((x) => `<div class="red-row"><strong>${esc(x.nombre.replace(/^RED /, ''))}</strong><span>${pct(x.dispo)}</span></div>`).join('')}</div>
        <p class="map-note">Esquema referencial de las 12 redes. La posición de los nodos es aproximada y no representa límites distritales oficiales.</p>`;
    }
  }

  function pintarTablaMapa() {
    const cont = $('#mapa-tabla-wrap');
    if (!cont) return;
    if (MAP_STATE.modo === 'peru') {
      cont.innerHTML = `<div class="table-toolbar"><div><h3>Departamentos</h3><p class="source" style="margin-top:2px">Disponibilidad de referencia y contexto INEI · sin acta departamental individual</p></div></div>
        <div class="table-scroll"><table class="table"><thead><tr><th>Departamento</th><th class="num">Disponibilidad</th><th class="num">Aseguramiento</th><th class="num">IPRESS</th><th>Riesgo dengue</th></tr></thead><tbody>
        ${DEPTS.map((d) => `<tr data-dep="${esc(d.dep)}" tabindex="0" style="cursor:pointer"><td><strong>${esc(d.dep)}</strong></td><td class="num">${pct(d.dispoSismed)}</td><td class="num">${pct(d.sisAseg)}</td><td class="num">${num(d.ipress)}</td><td><span class="tag ${d.riesgoDengue === 'ALTO' ? 'tag--err' : d.riesgoDengue === 'MEDIO' ? 'tag--warn' : 'tag--grey'}">${esc(d.riesgoDengue)}</span></td></tr>`).join('')}
        </tbody></table></div>`;
      cont.querySelectorAll('[data-dep]').forEach((tr) => {
        tr.addEventListener('click', () => { MAP_STATE.dep = tr.dataset.dep; pintarMapa(); pintarPanel(); });
        tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') { MAP_STATE.dep = tr.dataset.dep; pintarMapa(); pintarPanel(); } });
      });
    } else {
      cont.innerHTML = `<div class="table-toolbar"><div><h3>Redes de salud</h3><p class="source" style="margin-top:2px">Disponibilidad y stock por red · InfoSismedLL</p></div></div>
        <div class="table-scroll"><table class="table"><thead><tr><th>Red</th><th class="num">IPRESS</th><th class="num">Disponibilidad</th><th class="num">Substock</th><th class="num">Desabastecido</th><th>Estado</th></tr></thead><tbody>
        ${REDES.map((r) => `<tr data-red="${esc(r.nombre)}" tabindex="0" style="cursor:pointer"><td><strong>${esc(r.nombre)}</strong></td><td class="num">${num(r.ipressCount)}</td><td class="num">${pct(r.dispo)}</td><td class="num">${pct(r.sub)}</td><td class="num">${pct(r.desab)}</td><td><span class="tag ${r.dispo >= 95 ? 'tag--ok' : r.dispo >= 91 ? 'tag--warn' : 'tag--err'}">${r.dispo >= 95 ? 'Óptimo' : r.dispo >= 91 ? 'Aceptable' : 'Crítico'}</span></td></tr>`).join('')}
        </tbody></table></div>`;
      cont.querySelectorAll('[data-red]').forEach((tr) => {
        tr.addEventListener('click', () => { MAP_STATE.red = tr.dataset.red; pintarMapa(); pintarPanel(); });
      });
    }
  }

  function initMapas(opts = {}) {
    if (opts.distrito) {
      const p = IPRESS.find((x) => V.norm(x.distrito) === V.norm(opts.distrito));
      const d = p && DEPTS.find((x) => V.norm(x.dep).includes(V.norm(p.red)) || V.norm(p.red).includes(V.norm(x.dep)));
      MAP_STATE.modo = 'peru';
      if (d) MAP_STATE.dep = d.dep;
      else MAP_STATE.dep = 'La Libertad';
    }
    pintarMapa();
    pintarPanel();
    pintarTablaMapa();
    const bp = $('#map-btn-peru'), bl = $('#map-btn-ll');
    if (bp && !bp.dataset.bind) {
      bp.dataset.bind = bl.dataset.bind = '1';
      bp.addEventListener('click', () => {
        MAP_STATE.modo = 'peru'; bp.setAttribute('aria-pressed', 'true'); bl.setAttribute('aria-pressed', 'false');
        const f = $('#mapa-fuente'); if (f) f.textContent = 'Fuente: base consolidada SISMED/INEI · corte 31/10/2026';
        pintarMapa(); pintarPanel(); pintarTablaMapa();
      });
      bl.addEventListener('click', () => {
        MAP_STATE.modo = 'la-libertad'; bl.setAttribute('aria-pressed', 'true'); bp.setAttribute('aria-pressed', 'false');
        const f = $('#mapa-fuente'); if (f) f.textContent = 'Fuente: InfoSismedLL · corte 31/10/2026';
        pintarMapa(); pintarPanel(); pintarTablaMapa();
      });
    }
  }

  V.onView('tablero', initTablero);
  V.onView('mapas', initMapas);
})();
