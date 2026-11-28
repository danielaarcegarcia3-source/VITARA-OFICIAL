/**
 * vitara-requests.js — solicitudes anónimas, canales de ayuda y comunidad
 */
(function () {
  'use strict';
  const V = window.Vitara;
  if (!V) return;
  const { D, esc, icon, source, SRC, $, $$, store, toast } = V;

  /* ================= SOLICITUDES ================= */
  const RECENT_KEY = 'g3.solicitudes';
  let formBind = false;
  let pendingRequest = null;

  function sedes() {
    return (D.ipress || []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  function llenarSedes() {
    const sel = $('#sol-sede');
    if (!sel || sel.dataset.lleno) return;
    sel.dataset.lleno = '1';
    const porRed = {};
    sedes().forEach((p) => {
      const red = p.red || 'Otras sedes';
      (porRed[red] = porRed[red] || []).push(p);
    });
    sel.innerHTML = Object.keys(porRed).map((red) =>
      `<optgroup label="${esc(red)}">${porRed[red].map((p) => `<option value="${esc(p.nombre)}">${esc(p.nombre)} · ${esc(p.distrito)}</option>`).join('')}</optgroup>`
    ).join('');
    const moche = sedes().find((p) => /MOCHE/i.test(p.nombre));
    if (moche) sel.value = moche.nombre;
  }

  function leerRecientes() { return store.get(RECENT_KEY, []); }
  function guardarReciente(s) {
    const list = leerRecientes().filter((x) => x.codigo !== s.codigo);
    list.unshift({ codigo: s.codigo, item: s.item, estado: s.estado, fecha: s.fecha, sede: s.sede });
    store.set(RECENT_KEY, list.slice(0, 8));
  }

  function renderRecientes() {
    const cont = $('#recent-requests');
    if (!cont) return;
    const list = leerRecientes();
    if (!list.length) { cont.innerHTML = ''; return; }
    cont.innerHTML = `<h3>Tus códigos en este dispositivo</h3>` + list.map((s) => `
      <button class="recent__item" type="button" data-recent="${esc(s.codigo)}">
        <code>${esc(s.codigo)}</code>
        <span>${esc(s.item)}</span>
        ${V.estadoTag(s.estado)}
      </button>`).join('') + `<p class="source" style="margin-top:8px">Guardado solo en este navegador. Puedes borrarlo cuando quieras.</p>`;
    cont.querySelectorAll('[data-recent]').forEach((b) => b.addEventListener('click', () => {
      const input = $('#tracker-code');
      if (input) { input.value = b.dataset.recent; consultar(b.dataset.recent); }
    }));
  }

  function codeBox(s) {
    const cont = $('#solicitud-resultado');
    if (!cont) return;
    cont.innerHTML = `<div class="code-box" style="text-align:left">
      <p class="code-box__l">Tu código privado de seguimiento</p>
      <p class="code-box__v">${esc(s.codigo)}</p>
      <p class="tiny muted" style="margin-bottom:8px">Guárdalo. No pedimos DNI ni correo; sin este código no podemos identificar tu solicitud.</p>
      <div class="code-box__actions">
        <button class="btn btn--primary btn--sm" type="button" data-copy-code>${icon('copy', 'i--sm')} Copiar código</button>
        <button class="btn btn--ghost btn--sm" type="button" data-track-code>Consultar estado</button>
      </div>
    </div>`;
    cont.querySelector('[data-copy-code]')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(s.codigo); toast('Código copiado al portapapeles.'); }
      catch (_) { toast('No se pudo copiar automáticamente. Anota el código: ' + s.codigo, 'warn', 8000); }
    });
    cont.querySelector('[data-track-code]')?.addEventListener('click', () => {
      const input = $('#tracker-code');
      if (input) { input.value = s.codigo; consultar(s.codigo); }
      $('#tracker-code')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  async function enviar(e) {
    e.preventDefault();
    const btn = $('#sol-submit');
    const item = $('#sol-item')?.value.trim() || '';
    const categoria = $('#sol-cat')?.value || 'medicamento';
    const sede = $('#sol-sede')?.value || '';
    const alias = $('#sol-alias')?.value.trim() || '';
    const esAcompanamiento = !!$('#sol-acomp')?.checked;
    if (!item) { toast('Escribe el recurso que quieres verificar.', 'warn'); return; }
    if (/\b\d{8}\b/.test([item, alias].join(' '))) {
      toast('El filtro de privacidad bloquea números de 8 dígitos. Quita cualquier documento del texto.', 'warn', 7000);
      return;
    }
    const cantidad=$('#sol-cantidad').value===''?null:Number($('#sol-cantidad').value);const unidad=$('#sol-unidad').value;const pregunta=$('#sol-pregunta').value;
    if(cantidad!=null && (!Number.isInteger(cantidad)||cantidad<1||cantidad>10000)){toast('Usa una cantidad entera entre 1 y 10000, no una dosis.','warn');return;}
    const fields = { item, categoria, sede, alias, esAcompanamiento, cantidad, unidad, pregunta, imagenRecurso:$('#sol-imagen').value || null };
    const signature = JSON.stringify(fields);
    if (!pendingRequest || pendingRequest.signature !== signature) {
      const bytes = new Uint8Array(16); crypto.getRandomValues(bytes);
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      pendingRequest = { signature, key: `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}` };
    }
    const payload = { ...fields, idempotencyKey: pendingRequest.key };
    if (btn) { btn.disabled = true; btn.dataset.txt = btn.innerHTML; btn.innerHTML = 'Enviando…'; }
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'El servidor rechazó la solicitud.');
      const s = data.solicitud;
      pendingRequest = null;
      codeBox(s);
      guardarReciente(s);
      renderRecientes();
      V.addNotif(`Solicitud ${s.codigo} recibida. La sede puede responderla desde el panel institucional.`);
      toast(data.duplicadoPrevenido ? 'Esa solicitud ya existía. Recuperamos el mismo código.' : 'Solicitud registrada. Guarda tu código.');
      $('#sol-item').value = '';
      $('#sol-alias').value = '';$('#sol-cantidad').value='';
    } catch (err) {
      const cont = $('#solicitud-resultado');
      if (cont) cont.innerHTML = `<div class="privacy-inline" style="background:var(--v-rose-soft);border-color:#F5D2DA"><svg class="i i--sm" style="color:var(--v-rose)" aria-hidden="true"><use href="#i-alert"/></svg><p style="color:#7C2B3D"><strong>No se pudo registrar la solicitud.</strong> ${esc(err.message)} Verifica que el servidor local esté activo (<span class="mono">npm start</span>) e inténtalo otra vez. No mostramos un código falso.</p></div>`;
      toast('Solicitud no registrada. No se generó ningún código.', 'warn', 7000);
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.txt || 'Enviar solicitud anónima'; }
    }
  }

  function pasos(s) {
    const estados = ['recibida', 'en_revision', 'respondido'];
    const idx = s.estado === 'respondido' || s.estado === 'no_disponible' ? 2 : estados.indexOf(s.estado);
    const defs = [
      ['Solicitud recibida', 'El código quedó registrado en el servidor local.'],
      ['Verificación en sede', 'El personal revisa stock, equipo o cadena de frío.'],
      ['Respuesta publicada', 'La sede indica si está disponible, restringido o no disponible.']
    ];
    return `<div class="timeline">${defs.map((d, i) => `<div class="tl-step ${i < idx ? 'is-done' : i === idx ? 'is-current' : ''}">
      <span class="tl-dot">${i < idx ? icon('check', 'i--sm') : ''}</span>
      <div><strong>${d[0]}</strong><p>${d[1]}</p></div>
    </div>`).join('')}</div>`;
  }

  function respuestaTexto(s) {
    const r = s.respuesta;
    if (!r) return '';
    if (typeof r === 'string') return r;
    if (typeof r === 'object') return r.nota || r.mensaje || r.texto || '';
    return String(r);
  }

  function pintarTicket(s) {
    const cont = $('#tracker-resultado');
    if (!cont) return;
    const rr = respuestaTexto(s);
    cont.innerHTML = `<article class="ticket">
      <div class="ticket__top">
        <div><p class="ticket__code">${esc(s.codigo)}</p><p class="ticket__item">${esc(s.item)}</p><p>${s.cantidad!=null?esc(s.cantidad)+' '+esc(s.unidad):'Cantidad no especificada'} · ${esc(s.pregunta || 'disponibilidad')}</p>
          <p class="ticket__meta">${esc(s.sede || 'Sede no indicada')} · ${esc(V.fecha(s.fecha))} ${esc(V.hora(s.fecha))}</p></div>
        ${V.estadoTag(s.estado)}
      </div>
      ${pasos(s)}
      ${rr ? `<div class="ticket__answer"><p class="ticket__meta" style="margin-top:0;margin-bottom:3px">Respuesta de la sede</p><p>${esc(rr)}</p></div>` : `<p class="source" style="margin-top:10px">La sede todavía no publicó una respuesta. Vuelve a consultar con el mismo código.</p>`}
      <p class="source" style="margin-top:10px">Código válido 30 días · sin datos personales · ${esc(SRC.sismed.texto)}</p>
    </article>`;
    guardarReciente(s);
    renderRecientes();
  }

  async function consultar(codigoDirecto) {
    const input = $('#tracker-code');
    const codigo = String(codigoDirecto || input?.value || '').trim().toUpperCase();
    const cont = $('#tracker-resultado');
    if (!cont) return;
    if (!/^G3-[A-Z0-9]{6}$/.test(codigo)) {
      cont.innerHTML = `<div class="privacy-inline" style="background:var(--v-amber-soft);border-color:#F3DFB8"><svg class="i i--sm" style="color:var(--v-amber)" aria-hidden="true"><use href="#i-info"/></svg><p style="color:#6D4A0B">El formato debe ser <span class="mono">G3-XXXXXX</span> (dos letras y seis caracteres). Revisa tu código.</p></div>`;
      return;
    }
    cont.innerHTML = `<div class="result-skeleton" style="height:120px"></div>`;
    try {
      const res = await fetch('/api/solicitudes?codigo=' + encodeURIComponent(codigo));
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'No encontramos ese código.');
      pintarTicket(data.solicitud);
    } catch (err) {
      cont.innerHTML = `<div class="empty" style="padding:24px 16px"><div class="empty__ico">${icon('search', 'i--lg')}</div><h3>Sin resultados</h3><p>${esc(err.message)} El código puede haber caducado (30 días) o no haberse registrado en este servidor. No inventamos una respuesta.</p></div>`;
    }
  }

  function initSolicitudes(opts = {}) {
    llenarSedes();
    renderRecientes();
    if (!formBind) {
      formBind = true;
      $('#form-solicitud')?.addEventListener('submit', enviar);
      $('#form-tracker')?.addEventListener('submit', (e) => { e.preventDefault(); consultar(); });
      const c = $('#tracker-code');
      if (c) c.addEventListener('input', () => { c.value = c.value.toUpperCase(); });
    }
    if (opts.item) {
      const i = $('#sol-item');
      if (i) { i.value = opts.item; i.focus({ preventScroll: true }); }
    }
    if (opts.sede) {
      const s = $('#sol-sede');
      if (s) {
        const opt = Array.from(s.options).find((o) => V.norm(o.value) === V.norm(opts.sede) || V.norm(o.textContent).includes(V.norm(opts.sede)));
        if (opt) s.value = opt.value;
      }
    }
  }

  /* ================= CANALES ================= */
  const CANAL_ICON = {
    'linea-113': 'phone', teleatiendo: 'stethoscope', 'sis-afiliacion': 'shield',
    'samu-106': 'alert', 'whatsapp-minsa': 'message', 'diresa-lalibertad': 'hospital',
    'observatorio-digemid': 'pill'
  };

  function tarjetaCanal(c, i) {
    const icono = CANAL_ICON[c.id] || 'phone';
    const esTel = String(c.urlDirecta || '').startsWith('tel:');
    const opciones = (c.opciones || []).map((o) => `<span class="opc" title="${esc(o.detalle || '')}">${esc(o.op)} · ${esc(o.nombre)}</span>`).join('');
    return `<article class="channel${i === 0 ? ' channel--feature' : ''}">
      <div class="channel__top">
        <span class="channel__ico">${icon(icono, 'i--lg')}</span>
        <div><h3 class="channel__title">${esc(c.nombre)}</h3><p class="channel__type">${esc(c.tipo)}</p></div>
      </div>
      <p>${esc(c.descripcion)}</p>
      ${opciones ? `<div class="channel__opts">${opciones}</div>` : ''}
      <div class="channel__actions">
        ${esTel ? `<a class="btn btn--primary btn--sm" href="${esc(c.urlDirecta)}">${icon('phone', 'i--sm')} Llamar ${esc(c.telefono || '')}</a>` : `<a class="btn btn--primary btn--sm" href="${esc(c.urlDirecta)}" target="_blank" rel="noopener">Abrir canal ${icon('external', 'i--sm')}</a>`}
        ${c.telefono && !esTel ? `<span class="tag tag--grey">${esc(c.telefono)}</span>` : ''}
      </div>
      <p class="channel__src">${esc(SRC.minsa.texto)} · ${esc(SRC.minsa.fecha)}</p>
    </article>`;
  }

  function initCanales() {
    const cont = $('#channel-grid');
    if (!cont || cont.dataset.lleno) return;
    cont.dataset.lleno = '1';
    cont.innerHTML = (D.canalesAyuda || []).map(tarjetaCanal).join('');
  }

  /* ================= COMUNIDAD ================= */
  const AUDIENCIAS = {
    ninos: {
      titulo: 'Para niñas y niños',
      intro: 'La posta es el lugar donde te cuidan cuando estás enfermo. Estas son cosas que puedes entender y decir en voz alta.',
      cards: [
        ['¿Qué hace una posta?', 'Ahí revisan cómo estás, te pesan, te escuchan y te dicen si necesitas medicina. Si algo te preocupa, pídele a un adulto que te acompañe.', null],
        ['¿Cuándo pedir ayuda?', 'Si tienes fiebre alta, te duele mucho la barriga, te cuesta respirar o estás muy cansado, avisa a un adulto de inmediato.', null],
        ['El zancudo del dengue', 'El zancudo que transmite el dengue se cría en agua estancada. Ayuda a tapar baldes y botellas, y a limpiar los floreros.', null],
        ['Vacunas seguras', 'Las vacunas viajan en frío controlado. Si ves un refrigerador con temperatura entre +2 °C y +8 °C, está cuidando las vacunas.', null]
      ]
    },
    jovenes: {
      titulo: 'Para jóvenes',
      intro: 'Información directa para decidir sin mitos y sin exponer tus datos personales en línea.',
      cards: [
        ['Salud mental', 'La Línea 113, opción 5, brinda orientación en salud mental y psicología. Es gratuita y confidencial.', ['canales', 'Abrir canales']],
        ['Derecho a genéricos', 'La Ley 32033 refuerza la entrega de medicamentos genéricos. Puedes preguntar por el precio del genérico en la farmacia.', ['buscar', 'Comparar precios', 'atorvastatina']],
        ['Teleconsulta', 'Teleatiendo permite solicitar una consulta remota con un profesional del MINSA. No reemplaza una emergencia.', ['canales', 'Ver Teleatiendo']],
        ['Emergencias', 'Si hay riesgo de vida, llama al SAMU 106. No esperes a que la aplicación responda.', ['canales', 'Llamar al 106']]
      ]
    },
    mayores: {
      titulo: 'Para adultos mayores',
      intro: 'Lectura amplia, botones grandes y llamadas directas. Puedes activar el texto grande desde esta misma tarjeta.',
      cards: [
        ['Llamadas directas', 'Línea 113 para orientación gratuita y SAMU 106 para emergencias. Ambos funcionan desde teléfono fijo o celular.', ['canales', 'Ver teléfonos']],
        ['Acompañamiento', 'Si necesitas ayuda para una consulta, pide acompañamiento en la solicitud anónima. No pedimos tu DNI.', ['solicitudes', 'Solicitar acompañamiento']],
        ['Medicamentos', 'Pregunta siempre por el genérico y revisa la fecha de vencimiento del empaque antes de usarlo.', ['buscar', 'Buscar medicamento', 'paracetamol']],
        ['Textos legibles', 'Activa el texto grande o el alto contraste. La preferencia queda guardada en este dispositivo.', ['a11y', 'Ajustar lectura']]
      ]
    }
  };

  function initComunidad() {
    const panel = $('#audience-panel');
    if (!panel) return;
    const seg = $('#audience-seg');
    const pintar = (key) => {
      const a = AUDIENCIAS[key] || AUDIENCIAS.ninos;
      panel.innerHTML = `<h3>${esc(a.titulo)}</h3><p>${esc(a.intro)}</p>
        <div class="audience-grid">${a.cards.map(([t, d, accion]) => `<div class="mini-card">
          <h4>${icon(key === 'ninos' ? 'people' : key === 'jovenes' ? 'play' : 'accessibility', 'i--sm')} ${esc(t)}</h4>
          <p>${esc(d)}</p>
          ${accion ? `<a href="#" data-aud-go="${accion[0]}"${accion[2] ? ` data-aud-q="${esc(accion[2])}"` : ''}>${esc(accion[1])} ${icon('arrow-right', 'i--sm')}</a>` : ''}
        </div>`).join('')}</div>
        <p class="source" style="margin-top:12px">Orientación general. No diagnostica ni prescribe. Fuente: MINSA · DIGEMID · IESSI · INEI.</p>`;
      panel.querySelectorAll('[data-aud-go]').forEach((a) => a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = a.dataset.audGo;
        if (target === 'a11y') { $('#a11y-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        V.abrirVista(target, a.dataset.audQ ? { query: a.dataset.audQ } : {});
      }));
    };
    pintar('ninos');
    if (seg && !seg.dataset.bind) {
      seg.dataset.bind = '1';
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('[data-aud]');
        if (!b) return;
        seg.querySelectorAll('[data-aud]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        pintar(b.dataset.aud);
      });
    }
  }

  function initA11y() {
    const map = { 'a11y-texto': 'texto', 'a11y-contraste': 'contraste', 'a11y-movimiento': 'movimiento', 'a11y-lectura': 'lectura' };
    Object.keys(map).forEach((id) => {
      const b = document.getElementById(id);
      if (!b) return;
      b.dataset.a11y = map[id];
      b.setAttribute('aria-pressed', String(!!V.A11Y[map[id]]));
      if (!b.dataset.bind) {
        b.dataset.bind = '1';
        b.addEventListener('click', () => V.setA11y(map[id], !V.A11Y[map[id]]));
      }
    });
    const reset = $('#a11y-reset');
    if (reset && !reset.dataset.bind) {
      reset.dataset.bind = '1';
      reset.addEventListener('click', () => {
        Object.keys(V.A11Y).forEach((k) => { V.A11Y[k] = false; });
        V.aplicarA11y();
        toast('Preferencias de accesibilidad restablecidas.');
      });
    }
  }

  V.onView('solicitudes', initSolicitudes);
  V.onView('canales', initCanales);
  V.onView('comunidad', initComunidad);
  V.onView('comunidad', initA11y);
  V.consultarSolicitud = consultar;
})();
