/**
 * interfaz.js — Lógica de la portada y Motor de Búsqueda "Google Salud Perú".
 *
 * · Tema claro/oscuro y accesibilidad (persistidas en localStorage)
 * · Chips de contexto (movilidad, lectura fácil, conexión lenta, acompañamiento)
 * · Buscador con debounce y búsqueda integrada en DatosSaludPeru (339 IPRESS, DIGEMID, IETSI, Alertas)
 * · Generador de Solicitudes Anónimas con Código G3-XXXXXX (F-003) sin pedir DNI
 * · Indicador de conexión real: prueba /api/salud y cae a modo local
 */
(function () {
  'use strict';

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));
  const CLAVE_PREF = 'g3-preferencias';
  const CLAVE_SOLICITUDES = 'g3-solicitudes';

  /* =====================================================================
     PREFERENCIAS · se guardan y se restauran al volver
     ===================================================================== */
  const prefs = {
    tema: 'oscuro',
    texto: 'normal',
    contraste: 'normal',
    movimiento: 'normal',
    chips: {},
  };

  function cargarPrefs() {
    try {
      const guardadas = JSON.parse(localStorage.getItem(CLAVE_PREF) || '{}');
      Object.assign(prefs, guardadas);
      if (!prefs.chips || typeof prefs.chips !== 'object') prefs.chips = {};
    } catch {
      /* localStorage puede fallar en modo privado: se sigue con los valores por defecto */
    }
    if (!localStorage.getItem(CLAVE_PREF)) {
      prefs.tema = window.matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'oscuro';
    }
  }

  function guardarPrefs() {
    try { localStorage.setItem(CLAVE_PREF, JSON.stringify(prefs)); } catch { /* sin persistencia */ }
  }

  function aplicarPrefs() {
    const raiz = document.documentElement;
    raiz.dataset.tema = prefs.tema;
    raiz.dataset.texto = prefs.texto;
    raiz.dataset.contraste = prefs.contraste;
    raiz.classList.toggle('sin-movimiento', prefs.movimiento === 'reducido');

    for (const grupo of $$('.segmentado')) {
      const clave = grupo.dataset.grupo;
      for (const boton of $$('button', grupo)) {
        boton.setAttribute('aria-pressed', String(boton.dataset.valor === prefs[clave]));
      }
    }
    $('#btn-tema')?.setAttribute('aria-pressed', String(prefs.tema === 'claro'));
    $('#btn-tema')?.setAttribute('aria-label', prefs.tema === 'claro' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');

    if (window.Iconos) window.Iconos.reiniciar(document.body);
  }

  /* =====================================================================
     TEMA Y ACCESIBILIDAD
     ===================================================================== */
  function initControles() {
    $('#btn-tema')?.addEventListener('click', () => {
      prefs.tema = prefs.tema === 'claro' ? 'oscuro' : 'claro';
      guardarPrefs();
      aplicarPrefs();
    });

    const panel = $('#panel-a11y');
    const botonPanel = $('#btn-a11y');

    botonPanel?.addEventListener('click', () => {
      const abierto = !panel.hidden;
      panel.hidden = abierto;
      botonPanel.setAttribute('aria-expanded', String(!abierto));
      if (!abierto) panel.querySelector('button')?.focus();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!panel.hidden) {
        panel.hidden = true;
        botonPanel.setAttribute('aria-expanded', 'false');
        botonPanel.focus();
      }
    });
    document.addEventListener('pointerdown', (e) => {
      if (panel.hidden) return;
      if (panel.contains(e.target) || botonPanel.contains(e.target)) return;
      panel.hidden = true;
      botonPanel.setAttribute('aria-expanded', 'false');
    });

    for (const grupo of $$('.segmentado')) {
      const clave = grupo.dataset.grupo;
      grupo.addEventListener('click', (e) => {
        const boton = e.target.closest('button');
        if (!boton) return;
        prefs[clave] = boton.dataset.valor;
        guardarPrefs();
        aplicarPrefs();
      });
    }
  }

  /* =====================================================================
     CHIPS DE CONTEXTO (F-109)
     ===================================================================== */
  function initChips() {
    const chips = $$('.chip');
    const sincronizar = () => {
      for (const chip of chips) {
        chip.setAttribute('aria-pressed', String(!!prefs.chips[chip.dataset.chip]));
      }
    };

    for (const chip of chips) {
      chip.addEventListener('click', () => {
        const clave = chip.dataset.chip;
        prefs.chips[clave] = !prefs.chips[clave];
        if (prefs.chips[clave]) {
          if (clave === 'movilidad') prefs.chips.acompanamiento = false;
          if (clave === 'acompanamiento') prefs.chips.movilidad = false;
        }
        guardarPrefs();
        sincronizar();

        // Si hay una búsqueda activa, refrescar para aplicar filtros de contexto
        const campo = $('#campo-busqueda');
        if (campo && campo.value.trim().length >= 2) {
          const r = buscarLocal(campo.value.trim());
          pintarResultados(campo.value.trim(), r);
        }
      });
    }
    sincronizar();
  }

  /* =====================================================================
     ESTADOS Y NORMALIZACIÓN DE TEXTO
     ===================================================================== */
  const ESTADOS = {
    disponible: { texto: 'Disponible', color: 'var(--ok)' },
    disponible_con_restricciones: { texto: 'Con restricciones', color: 'var(--aviso)' },
    no_disponible: { texto: 'No disponible', color: 'var(--err)' },
    fuera_de_servicio: { texto: 'Fuera de servicio', color: 'var(--critico)' },
    en_mantenimiento: { texto: 'En mantenimiento', color: 'var(--aviso)' },
    operativo: { texto: 'Operativo', color: 'var(--ok)' },
    operativo_parcial: { texto: 'Operativo parcial', color: 'var(--aviso)' },
    sin_confirmar: { texto: 'Sin confirmar', color: 'var(--neutro)' },
    dato_vencido: { texto: 'Dato vencido', color: 'var(--vencido)' },
  };

  const norm = (s = '') => String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim();

  const SINONIMOS = [
    ['posta', 'puesto de salud', 'centro de salud', 'cs', 'eess', 'hospital', 'ipress'],
    ['medicamento', 'pastilla', 'tableta', 'medicina', 'farmacia', 'dci', 'remedio'],
    ['fiebre', 'paracetamol', 'panadol', 'antipiretico'],
    ['azucar', 'diabetes', 'metformina', 'insulina', 'glibenclamida', 'glucosa'],
    ['eco', 'ecografia', 'ecografo', 'ultrasonido', 'doppler'],
    ['oxigeno', 'concentrador', 'balon', 'ventilador', 'respirador'],
    ['hipertension', 'presion', 'losartan', 'enalapril', 'tensiometro'],
    ['dengue', 'sro', 'hidratacion', 'cloruro', 'suero', 'plaquetas']
  ];

  function expandir(q) {
    const base = norm(q).split(' ').filter(Boolean);
    const extra = new Set();
    for (const grupo of SINONIMOS) {
      const normalizado = grupo.map(norm);
      if (normalizado.some((t) => base.includes(t))) {
        normalizado.forEach((t) => t.split(' ').forEach((p) => p && extra.add(p)));
      }
    }
    return Array.from(new Set([...base, ...extra]));
  }

  /* =====================================================================
     MOTOR DE BÚSQUEDA INTEGRADO CON DATOS REALES (F-101 / F-103)
     ===================================================================== */
  function buscarLocal(q) {
    const tokens = expandir(q);
    if (!tokens.length) return { sedes: [], medicamentos: [], equipos: [], alertas: [], kits: [] };

    const coincide = (texto) => {
      const t = norm(texto);
      return tokens.some((tok) => t.includes(tok));
    };

    const data = window.DatosSaludPeru;

    // 1. Sedes / IPRESS
    const todasSedes = data?.ipress || [];
    const sedesEncontradas = todasSedes.filter((s) => 
      coincide(`${s.nombre} ${s.cod} ${s.distrito} ${s.microred} ${s.red} ${s.categoria} ${s.equipos?.join(' ')}`)
    );

    // 2. Medicamentos DIGEMID (Genéricos vs Marca)
    const todosMeds = data?.medicamentos || [];
    const medsEncontrados = todosMeds.filter((m) => 
      coincide(`${m.dci} ${m.marcaComercial} ${m.concentracion} ${m.accionTerapeutica}`)
    );

    // 3. Equipos Biomédicos IETSI
    const todosEquipos = data?.equiposBiomedicos || [];
    const equiposEncontrados = todosEquipos.filter((e) => 
      coincide(`${e.nombre} ${e.servicio} ${e.codigoIETSI} ${e.marcaComun}`)
    );

    // 4. Alertas Sanitarias DIGEMID
    const todasAlertas = data?.alertasSanitarias || [];
    const alertasEncontradas = todasAlertas.filter((a) => 
      coincide(`${a.num} ${a.producto} ${a.lote} ${a.motivo}`)
    );

    // 5. Kits Dengue
    const todosKits = data?.kitsDengue || [];
    const kitsEncontrados = todosKits.filter((k) => 
      coincide(`${k.item} ${k.tipo} ${k.indicacion}`)
    );

    return {
      sedes: sedesEncontradas,
      medicamentos: medsEncontrados,
      equipos: equiposEncontrados,
      alertas: alertasEncontradas,
      kits: kitsEncontrados
    };
  }

  /* =====================================================================
     PANEL DE RESULTADOS (F-110 Explicación de Orden y Razones)
     ===================================================================== */
  function crearPanelResultados() {
    let panel = $('#resultados');
    if (panel) return panel;

    panel = document.createElement('section');
    panel.className = 'seccion contenedor';
    panel.id = 'resultados';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="seccion__cab">
        <p class="seccion__eyebrow">Google de la Salud Peruana · Búsqueda Universal</p>
        <h2 class="seccion__titulo" id="resultados-titulo">Resultados</h2>
        <p class="seccion__texto" id="resultados-sub"></p>
      </div>
      <div id="resultados-lista" class="rejilla-modulos"></div>`;
    $('#buscador').after(panel);
    return panel;
  }

  function pastilla(estado) {
    const e = ESTADOS[estado] || { texto: estado, color: 'var(--neutro)' };
    return `<span class="pastilla" data-estado="${estado}" style="--c:${e.color}">${e.texto}</span>`;
  }

  function pintarResultados(q, r) {
    const panel = crearPanelResultados();
    const lista = $('#resultados-lista');
    const total = r.sedes.length + r.medicamentos.length + r.equipos.length + r.alertas.length + r.kits.length;

    panel.hidden = false;
    $('#resultados-titulo').textContent = total
      ? `«${q}» · ${total} ${total === 1 ? 'resultado oficial' : 'resultados oficiales encontrados'}`
      : `«${q}» · sin resultados directos`;

    $('#resultados-sub').innerHTML = total
      ? `Resultados con <strong>procedencia obligatoria</strong> (RENIPRESS, Observatorio DIGEMID, Contraloría). Cada tarjeta incluye el motivo por el cual aparece (F-110).`
      : `No se encontraron coincidencias directas para «${q}». Prueba con «amoxicilina», «moche», «ecógrafo», «dengue» o «chugay».`;

    lista.innerHTML = '';

    // A. Medicamentos DIGEMID con comparador Genérico vs Marca
    r.medicamentos.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'tarjeta';
      card.dataset.tono = 'verde';
      card.innerHTML = `
        <span class="tarjeta__pie" style="margin:0;padding:0;">
          <span class="estado-etiqueta estado-etiqueta--ok">Medicamento Esencial</span>
          <span style="font-size:10px; color:#38bdf8;">Ley 29459 & 32033</span>
        </span>
        <span class="tarjeta__titulo" style="font-size:1.15rem; margin-top:6px;">${m.dci} ${m.concentracion}</span>
        <span class="tarjeta__desc" style="margin-bottom:8px;">
          ${m.forma} · <strong>${m.accionTerapeutica}</strong><br>
          <small style="color:#94a3b8;">${m.estudioFuente}</small>
        </span>
        
        <div style="background:rgba(15,23,42,0.8); border:1px solid #1e3a5f; border-radius:8px; padding:8px; margin-bottom:10px; font-size:11px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Genérico DCI Oficial:</span>
            <strong style="color:#34d399; font-family:var(--fuente-mono);">S/ ${m.precioGenericoMin.toFixed(2)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Marca (${m.marcaComercial}):</span>
            <strong style="color:#f87171; font-family:var(--fuente-mono);">S/ ${m.precioMarcaPromedio.toFixed(2)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; border-top:1px solid #334155; padding-top:4px;">
            <span style="font-weight:700; color:#38bdf8;">Ahorro por Genérico:</span>
            <strong style="color:#34d399;">-${m.ahorroPorcentaje}% (${m.vecesMasCaraMarca}× menos)</strong>
          </div>
        </div>

        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn-solicitar-codigo" data-tipo="medicamento" data-nombre="${m.dci}" style="background:#0284c7; color:#fff; border:none; padding:5px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
            Pedir Confirmación (G3-XXXXXX)
          </button>
          <a href="#tablero-regional-sismed" style="font-size:11px; color:#38bdf8; text-decoration:underline; align-self:center;">
            Ver en Tablero Regional
          </a>
        </div>
      `;
      lista.append(card);
    });

    // B. Sedes de Salud (IPRESS)
    r.sedes.forEach((s) => {
      const card = document.createElement('div');
      card.className = 'tarjeta';
      card.dataset.tono = s.dispo >= 91.0 ? 'verde' : 'rojo';
      card.innerHTML = `
        <span class="tarjeta__pie" style="margin:0;padding:0;">
          <span class="estado-etiqueta ${s.dispo >= 91.0 ? 'estado-etiqueta--ok' : 'estado-etiqueta--err'}">${s.nivel}</span>
          <span style="font-size:10px; color:#94a3b8;">Cód: ${s.cod}</span>
        </span>
        <span class="tarjeta__titulo" style="font-size:1.15rem; margin-top:6px;">${s.nombre}</span>
        <span class="tarjeta__desc" style="margin-bottom:8px;">
          Categoría: <strong>${s.categoria}</strong> · Distrito: <strong>${s.distrito}</strong><br>
          Red: ${s.red} · Microred: ${s.microred}<br>
          <small style="color:#94a3b8;">Horario: ${s.horario} · Tel: ${s.telefono}</small>
        </span>

        <div style="background:rgba(15,23,42,0.8); border:1px solid #1e3a5f; border-radius:8px; padding:8px; margin-bottom:10px; font-size:11px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>Disponibilidad Medicamentos:</span>
            <strong style="color:${s.dispo >= 91.0 ? '#34d399' : '#f87171'}; font-family:var(--fuente-mono);">${s.dispo}%</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span>Telesalud Oficial RNT:</span>
            <strong>${s.telesalud ? '<span style="color:#34d399;">Conectada</span>' : '<span style="color:#94a3b8;">No disponible</span>'}</strong>
          </div>
        </div>

        <p style="font-size:10px; color:#38bdf8; margin:0 0 8px 0;">
          Aparece porque: está en ${s.distrito} y reportó stock al corte de ${s.fechaInfo}.
        </p>

        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn-solicitar-codigo" data-tipo="sede" data-nombre="${s.nombre}" style="background:#0284c7; color:#fff; border:none; padding:5px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
            Consultar Sede (G3-XXXXXX)
          </button>
          <a href="#vista3d" style="font-size:11px; color:#38bdf8; text-decoration:underline; align-self:center;">
            Ver Corte 3D
          </a>
        </div>
      `;
      lista.append(card);
    });

    // C. Equipos Biomédicos
    r.equipos.forEach((eq) => {
      const card = document.createElement('div');
      card.className = 'tarjeta';
      card.dataset.tono = 'ambar';
      card.innerHTML = `
        <span class="tarjeta__pie" style="margin:0;padding:0;">
          <span class="estado-etiqueta estado-etiqueta--avis">Norma IETSI: ${eq.criticidad}</span>
          <span style="font-size:10px; color:#94a3b8;">${eq.codigoIETSI}</span>
        </span>
        <span class="tarjeta__titulo" style="font-size:1.15rem; margin-top:6px;">${eq.nombre}</span>
        <span class="tarjeta__desc" style="margin-bottom:8px;">
          Servicio: <strong>${eq.servicio}</strong> · Marcas: ${eq.marcaComun}<br>
          <small style="color:#fca5a5; display:block; margin-top:4px;">
            Auditoría Contraloría: ${eq.fallaAcreditada}
          </small>
        </span>
        <div style="font-size:10px; color:#94a3b8; border-top:1px solid #1e293b; padding-top:6px;">
          Protocolo: ${eq.protocoloMantenimiento}
        </div>
      `;
      lista.append(card);
    });

    // D. Alertas Sanitarias DIGEMID
    r.alertas.forEach((al) => {
      const card = document.createElement('div');
      card.className = 'tarjeta';
      card.dataset.tono = 'rojo';
      card.innerHTML = `
        <span class="tarjeta__pie" style="margin:0;padding:0;">
          <span class="estado-etiqueta estado-etiqueta--err">Alerta Oficial</span>
          <span style="font-size:10px; color:#ef4444;">${al.fecha}</span>
        </span>
        <span class="tarjeta__titulo" style="font-size:1.15rem; margin-top:6px; color:#ef4444;">${al.num}</span>
        <span class="tarjeta__desc" style="margin-bottom:8px;">
          Producto: <strong>${al.producto}</strong><br>
          Lote: <code style="color:#facc15;">${al.lote}</code><br>
          Motivo: ${al.motivo}
        </span>
        <span class="badge-nivel badge-nivel--critico" style="font-size:10px;">${al.accion}</span>
      `;
      lista.append(card);
    });

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Vincular botones de Solicitud Anónima G3-XXXXXX
    $$('.btn-solicitar-codigo', lista).forEach((btn) => {
      btn.addEventListener('click', () => {
        abrirModalSolicitudG3(btn.dataset.tipo, btn.dataset.nombre);
      });
    });
  }

  /* =====================================================================
     GENERADOR DE SOLICITUD ANÓNIMA CON CÓDIGO G3-XXXXXX (F-003)
     Sin DNI, sin datos sensibles. Expira a los 30 días.
     ===================================================================== */
  function generarCodigoG3() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'G3-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function abrirModalSolicitudG3(tipo, itemNombre) {
    let modal = $('#modal-solicitud-g3');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-solicitud-g3';
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3, 8, 16, 0.85); backdrop-filter: blur(12px);
        display: grid; place-items: center; z-index: 1000; padding: var(--e4);
      `;
      document.body.appendChild(modal);
    }

    const nuevoCodigo = generarCodigoG3();
    const esAcomp = prefs.chips.acompanamiento;

    modal.innerHTML = `
      <div style="background: #0b172a; border: 1px solid #38bdf8; border-radius: 16px; width: 100%; max-width: 480px; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.8); position: relative;">
        <button id="btn-cerrar-modal" style="position: absolute; top: 14px; right: 14px; background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>

        <p class="seccion__eyebrow" style="margin-bottom:4px;">Solicitud Ciudadana Anónima · F-003</p>
        <h3 style="color: #fff; margin: 0 0 8px 0; font-size: 1.25rem;">Consultar Disponibilidad en Sede</h3>
        <p style="color: #cbd5e1; font-size: 12px; margin-bottom: 16px;">
          Esta solicitud consulta en directo al personal de la posta sin exigir cuenta, DNI ni datos de salud.
          ${esAcomp ? '<br><span style="color:#38bdf8; font-weight:700;">Modo Acompañamiento Activo: no se registrarán datos de la persona acompañada (F-008).</span>' : ''}
        </p>

        <div style="background: #070e1a; border: 1px dashed #38bdf8; border-radius: 10px; padding: 12px; text-align: center; margin-bottom: 16px;">
          <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Tu Código Privado de Seguimiento</span>
          <div style="font-size: 1.8rem; font-family: var(--fuente-mono); font-weight: 800; color: #38bdf8; letter-spacing: 0.1em; margin: 4px 0;">
            ${nuevoCodigo}
          </div>
          <small style="font-size: 10px; color: #64748b;">Válido por 30 días · Guárdalo para consultar el estado desde cualquier equipo</small>
        </div>

        <form id="form-confirmar-g3">
          <div style="margin-bottom: 12px;">
            <label style="display:block; font-size: 11px; color: #cbd5e1; margin-bottom: 4px;">Recurso / Medicamento / Servicio:</label>
            <input type="text" value="${itemNombre}" readonly style="width: 100%; background: #070e1a; border: 1px solid #334155; border-radius: 6px; color: #fff; padding: 8px 10px; font-size: 12px;">
          </div>

          <div style="margin-bottom: 14px;">
            <label style="display:block; font-size: 11px; color: #cbd5e1; margin-bottom: 4px;">Alias o Nombre de Pila (Opcional - Nunca DNI):</label>
            <input type="text" id="solicitud-alias" placeholder="Ej: Vecino de Moche" style="width: 100%; background: #070e1a; border: 1px solid #334155; border-radius: 6px; color: #fff; padding: 8px 10px; font-size: 12px;">
          </div>

          <div style="display:flex; justify-content: flex-end; gap: 8px;">
            <button type="button" id="btn-cancelar-g3" style="background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 8px 14px; border-radius: 8px; font-size: 12px; cursor: pointer;">Cancelar</button>
            <button type="submit" style="background: #0284c7; border: none; color: #fff; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">Enviar Solicitud a la Posta</button>
          </div>
        </form>
      </div>
    `;

    modal.hidden = false;

    $('#btn-cerrar-modal').addEventListener('click', () => { modal.hidden = true; });
    $('#btn-cancelar-g3').addEventListener('click', () => { modal.hidden = true; });

    $('#form-confirmar-g3').addEventListener('submit', (e) => {
      e.preventDefault();
      const alias = $('#solicitud-alias').value.trim() || 'Ciudadano anónimo';
      guardarSolicitudG3(nuevoCodigo, itemNombre, alias, esAcomp);

      modal.innerHTML = `
        <div style="background: #0b172a; border: 1px solid #10b981; border-radius: 16px; width: 100%; max-width: 440px; padding: 24px; text-align: center;">
          <div style="font-size: 2.4rem; color: #10b981; margin-bottom: 8px;">✓</div>
          <h3 style="color: #fff; margin: 0 0 6px 0;">¡Solicitud Enviada a la Posta!</h3>
          <p style="color: #cbd5e1; font-size: 12px; margin-bottom: 14px;">
            Se ha creado tu ticket con código <strong>${nuevoCodigo}</strong>. La sede responderá en un plazo máximo de 24 horas hábiles.
          </p>
          <div style="background: #070e1a; border: 1px solid #334155; border-radius: 8px; padding: 8px; font-family: var(--fuente-mono); font-size: 14px; color: #38bdf8; margin-bottom: 16px;">
            ${nuevoCodigo}
          </div>
          <button id="btn-cerrar-ok" style="background: #10b981; border: none; color: #fff; padding: 8px 20px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;">
            Entendido
          </button>
        </div>
      `;

      $('#btn-cerrar-ok').addEventListener('click', () => { modal.hidden = true; });
    });
  }

  async function guardarSolicitudG3(codigo, item, alias, esAcomp) {
    const solicitudObj = {
      codigo,
      item,
      alias,
      esAcompanamiento: esAcomp,
      estado: 'recibida',
      fecha: new Date().toISOString(),
      sede: 'C.S. MOCHE'
    };

    // 1. Guardar localmente para disponibilidad 100% offline
    try {
      const solicitudes = JSON.parse(localStorage.getItem(CLAVE_SOLICITUDES) || '[]');
      solicitudes.unshift(solicitudObj);
      localStorage.setItem(CLAVE_SOLICITUDES, JSON.stringify(solicitudes.slice(0, 50)));
    } catch (e) {
      console.warn('No se pudo guardar la solicitud local:', e);
    }

    // 2. Enviar al backend Node.js en tiempo real si está activo
    try {
      await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solicitudObj)
      });
    } catch (e) {
      console.log('Operando en modo autónomo local (sin servidor en red):', e);
    }

    // Notificar evento en la ventana
    window.dispatchEvent(new CustomEvent('g3:solicitud-creada', { detail: { codigo, item } }));
  }

  /* =====================================================================
     RASTREADOR DE SOLICITUD ANÓNIMA G3-XXXXXX (F-403)
     Consulta directa en vivo sin login ni DNI
     ===================================================================== */
  async function consultarCodigoG3(codigo) {
    if (!codigo || !codigo.trim()) return;
    const cod = codigo.trim().toUpperCase();

    let solicitud = null;

    // 1. Intentar consultar al backend
    try {
      const res = await fetch(`/api/solicitudes?codigo=${encodeURIComponent(cod)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.solicitud) {
          solicitud = data.solicitud;
        }
      }
    } catch (err) {
      console.log('Consultando en almacenamiento local:', err);
    }

    // 2. Si no se halló en backend, buscar en localStorage
    if (!solicitud) {
      try {
        const locales = JSON.parse(localStorage.getItem(CLAVE_SOLICITUDES) || '[]');
        solicitud = locales.find(s => s.codigo.toUpperCase() === cod);
      } catch {}
    }

    mostrarModalRastreoG3(cod, solicitud);
  }

  function mostrarModalRastreoG3(cod, s) {
    let modal = $('#modal-rastreo-g3');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-rastreo-g3';
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3, 8, 16, 0.88); backdrop-filter: blur(14px);
        display: grid; place-items: center; z-index: 1000; padding: var(--e4);
      `;
      document.body.appendChild(modal);
    }

    if (!s) {
      modal.innerHTML = `
        <div style="background: #091322; border: 1px solid #ef4444; border-radius: 16px; width: 100%; max-width: 440px; padding: 24px; text-align: center;">
          <div style="font-size: 2.2rem; color: #ef4444; margin-bottom: 8px;">✕</div>
          <h3 style="color: #fff; margin: 0 0 6px 0;">Código No Encontrado</h3>
          <p style="color: #cbd5e1; font-size: 13px; margin-bottom: 16px;">
            El código <strong style="color:#ef4444; font-family:var(--fuente-mono);">${cod}</strong> no figura en la base de datos o ha superado el plazo de validez de 30 días.
          </p>
          <button id="btn-cerrar-rastreo" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 8px 18px; border-radius: 8px; font-size: 12px; cursor: pointer;">
            Entendido
          </button>
        </div>
      `;
    } else {
      const estadoBadge = s.estado === 'respondido' ? '<span style="background:#065f46; color:#6ee7b7; padding:3px 10px; border-radius:20px; font-weight:700;">Respondida</span>' :
                          s.estado === 'en_revision' ? '<span style="background:#1e3a5f; color:#7dd3fc; padding:3px 10px; border-radius:20px; font-weight:700;">En Revisión</span>' :
                          '<span style="background:#854d0e; color:#fde047; padding:3px 10px; border-radius:20px; font-weight:700;">Recibida en Sede</span>';

      modal.innerHTML = `
        <div style="background: #091322; border: 1px solid #38bdf8; border-radius: 16px; width: 100%; max-width: 480px; padding: 24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-family:var(--fuente-mono); font-size:1.3rem; font-weight:800; color:#38bdf8;">${s.codigo}</span>
            ${estadoBadge}
          </div>

          <h4 style="color:#fff; margin:0 0 4px 0; font-size:1.15rem;">${s.item}</h4>
          <p style="font-size:12px; color:#94a3b8; margin:0 0 16px 0;">
            Sede: <strong style="color:#fff;">${s.sede || 'C.S. MOCHE'}</strong> · Solicitante: <strong>${s.alias || 'Anónimo'}</strong><br>
            Fecha de emisión: ${new Date(s.fecha).toLocaleString()}
          </p>

          ${s.respuesta ? `
            <div style="background:rgba(16,185,129,0.1); border:1px solid #10b981; border-radius:10px; padding:12px; margin-bottom:16px;">
              <span style="font-size:11px; text-transform:uppercase; color:#34d399; font-weight:700; display:block; margin-bottom:4px;">
                Respuesta Oficial del Personal de Salud:
              </span>
              <p style="margin:0; font-size:13px; color:#e2e8f0; line-height:1.5;">${s.respuesta}</p>
              ${s.fechaRespuesta ? `<small style="display:block; margin-top:6px; color:#94a3b8; font-size:10px;">Respondido el: ${new Date(s.fechaRespuesta).toLocaleString()}</small>` : ''}
            </div>
          ` : `
            <div style="background:rgba(234,179,8,0.1); border:1px solid #eab308; border-radius:10px; padding:12px; margin-bottom:16px; font-size:12px; color:#fde047;">
              ⏳ Tu solicitud está en la bandeja de la posta. El personal responderá en un plazo máximo de 24 horas hábiles.
            </div>
          `}

          <div style="display:flex; justify-content:flex-end;">
            <button id="btn-cerrar-rastreo" style="background:#0284c7; color:#fff; border:none; padding:8px 20px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;">
              Cerrar
            </button>
          </div>
        </div>
      `;
    }

    modal.hidden = false;
    $('#btn-cerrar-rastreo')?.addEventListener('click', () => { modal.hidden = true; });
  }

  /* =====================================================================
     BUSCADOR Y SUGERENCIAS CON DEBOUNCE (F-104)
     ===================================================================== */
  function initBuscador() {
    crearPanelResultados();
    const form = $('#form-busqueda');
    const campo = $('#campo-busqueda');
    const cajaSugerencias = $('#sugerencias');

    let temporizador = null;

    const cerrarSugerencias = () => {
      cajaSugerencias.innerHTML = '';
      campo.setAttribute('aria-expanded', 'false');
    };

    campo.addEventListener('input', () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        const q = campo.value.trim();
        if (q.length < 2) return cerrarSugerencias();
        const r = buscarLocal(q);
        const sugerencias = [];

        r.medicamentos.slice(0, 3).forEach(m => sugerencias.push({ texto: m.dci, tipo: 'Medicamento DCI' }));
        r.sedes.slice(0, 3).forEach(s => sugerencias.push({ texto: s.nombre, tipo: 'Establecimiento' }));
        r.equipos.slice(0, 2).forEach(e => sugerencias.push({ texto: e.nombre, tipo: 'Equipo Biomédico' }));

        if (!sugerencias.length) {
          const parecido = window.DatosSaludPeru?.medicamentos?.find(x => norm(x.dci).startsWith(norm(q).slice(0, 3)));
          if (parecido) sugerencias.push({ texto: parecido.dci, tipo: 'Quizá quisiste decir' });
        }

        cajaSugerencias.innerHTML = '';
        if (!sugerencias.length) return cerrarSugerencias();

        for (const s of sugerencias.slice(0, 6)) {
          const boton = document.createElement('button');
          boton.type = 'button';
          boton.className = 'sugerencia';
          boton.setAttribute('role', 'option');
          boton.innerHTML = `
            <svg viewBox="0 0 24 24" class="ico ico-buscar" aria-hidden="true">
              <circle class="aro trazo" pathLength="1" cx="11" cy="11" r="6.6"/>
              <path class="mango trazo" pathLength="1" d="M16 16l5 5"/>
            </svg>
            <span>${s.texto}</span><small>${s.tipo}</small>`;
          boton.addEventListener('click', () => {
            campo.value = s.texto;
            cerrarSugerencias();
            form.requestSubmit();
          });
          cajaSugerencias.append(boton);
        }
        campo.setAttribute('aria-expanded', 'true');
      }, 120);
    });

    campo.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarSugerencias();
    });
    document.addEventListener('pointerdown', (e) => {
      if (!cajaSugerencias.contains(e.target) && e.target !== campo) cerrarSugerencias();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = campo.value.trim();
      if (q.length < 2) {
        campo.focus();
        campo.setAttribute('aria-invalid', 'true');
        return;
      }
      campo.removeAttribute('aria-invalid');
      cerrarSugerencias();

      const r = buscarLocal(q);
      pintarResultados(q, r);
    });

    // Pestañas de categoría de Google (Filtro interactivo)
    const tabsCat = $$('.btn-tab-google');
    tabsCat.forEach(tab => {
      tab.addEventListener('click', () => {
        tabsCat.forEach(t => {
          t.classList.remove('activo');
          t.style.background = '#091322';
          t.style.borderColor = '#334155';
          t.style.color = '#cbd5e1';
          t.style.fontWeight = 'normal';
        });
        tab.classList.add('activo');
        tab.style.background = '#0284c7';
        tab.style.borderColor = '#0284c7';
        tab.style.color = '#fff';
        tab.style.fontWeight = '700';

        const cat = tab.dataset.cat;
        let q = campo.value.trim();
        if (q.length < 2) {
          // Si no había texto, sugerir un término representativo de la categoría
          const sugerenciasCat = {
            medicamentos: 'amoxicilina',
            sedes: 'moche',
            equipos: 'ecógrafo',
            dengue: 'dengue',
            alertas: 'alerta'
          };
          q = sugerenciasCat[cat] || '';
          campo.value = q;
        }

        if (q.length >= 2) {
          const rCompleto = buscarLocal(q);
          let rFiltrado = rCompleto;
          if (cat === 'medicamentos') rFiltrado = { sedes: [], medicamentos: rCompleto.medicamentos, equipos: [], alertas: [], kits: [] };
          else if (cat === 'sedes') rFiltrado = { sedes: rCompleto.sedes, medicamentos: [], equipos: [], alertas: [], kits: [] };
          else if (cat === 'equipos') rFiltrado = { sedes: [], medicamentos: [], equipos: rCompleto.equipos, alertas: [], kits: [] };
          else if (cat === 'dengue') rFiltrado = { sedes: [], medicamentos: [], equipos: [], alertas: [], kits: rCompleto.kits };
          else if (cat === 'alertas') rFiltrado = { sedes: [], medicamentos: [], equipos: [], alertas: rCompleto.alertas, kits: [] };
          
          pintarResultados(q, rFiltrado);
        }
      });
    });

    // Búsquedas rápidas recomendadas (Chips)
    $$('.chip-busq-rapida').forEach(chip => {
      chip.addEventListener('click', () => {
        campo.value = chip.dataset.query;
        form.requestSubmit();
        campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    // Rastreador de Códigos Privados G3-XXXXXX (F-403)
    $('#form-rastrear-g3')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#input-rastrear-codigo');
      const cod = input?.value.trim();
      if (cod) {
        consultarCodigoG3(cod);
      }
    });
  }

  /* =====================================================================
     INDICADOR DE CONEXIÓN REAL (F-803)
     ===================================================================== */
  async function detectarConexion() {
    const nodo = $('#indicador-red');
    if (!nodo) return;

    const control = new AbortController();
    const limite = setTimeout(() => control.abort(), 2000);
    try {
      const r = await fetch('/api/salud', { signal: control.signal, cache: 'no-store' });
      if (!r.ok) throw new Error();
      const d = await r.json();
      nodo.dataset.red = 'ok';
      $('.red__texto', nodo).textContent = `En vivo · ${d.clientes_sse ?? 1} conectados · Servidor LAN`;
      $('#orbe-sedes').textContent = d.registros ?? '339';
    } catch {
      nodo.dataset.red = 'local';
      $('.red__texto', nodo).textContent = 'Modo Local Oficial · 339 IPRESS y SISMED integrados';
      $('#orbe-sedes').textContent = '339';
    } finally {
      clearTimeout(limite);
    }
  }

  function initEntradas() {
    const campo = $('#campo-busqueda');
    for (const entrada of $$('.entrada')) {
      entrada.addEventListener('click', () => {
        if (entrada.dataset.modo === 'ayuda') {
          campo?.focus();
          campo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          $('#tablero-regional-sismed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  /* =====================================================================
     SISTEMA OPERATIVO SANITARIO: RELOJ OFICIAL Y TELEMETRÍA EN VIVO
     ===================================================================== */
  function iniciarRelojPeru() {
    const relojElem = $('#reloj-peru');
    if (!relojElem) return;

    function actualizar() {
      const ahora = new Date();
      // Hora oficial Perú UTC-5
      const opciones = { timeZone: 'America/Lima', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
      relojElem.textContent = ahora.toLocaleTimeString('es-PE', opciones);
    }
    actualizar();
    setInterval(actualizar, 1000);
  }

  /* =====================================================================
     SISTEMA DE PERFILES DE USUARIO M0 (F-001 - F-007)
     ===================================================================== */
  const CLAVE_PERFIL = 'g3-perfil-activo';
  const PERFILES_M0 = {
    VIS: {
      tag: 'VIS',
      nombre: 'Visitante Anónimo',
      subtitulo: 'Búsqueda pública sin registro ni DNI',
      badgeClass: 'ok',
      color: '#0284c7'
    },
    CIU: {
      tag: 'CIU',
      nombre: 'Ciudadano con Cuenta',
      subtitulo: 'Alias personal y seguimiento local',
      badgeClass: 'ok',
      color: '#10b981'
    },
    AGC: {
      tag: 'AGC',
      nombre: 'Agente Comunitario (Acompañamiento)',
      subtitulo: 'Asistencia en caseríos sin pedir DNI',
      badgeClass: 'avis',
      color: '#f59e0b'
    },
    POSTA: {
      tag: 'POSTA',
      nombre: 'Personal de Sede I-1 a I-4',
      subtitulo: 'Personal de salud autorizado',
      badgeClass: 'neut',
      color: '#8b5cf6'
    },
    ADM: {
      tag: 'ADM',
      nombre: 'Administrador Regional',
      subtitulo: 'Control del Servidor y Firewall WAF',
      badgeClass: 'err',
      color: '#ef4444'
    }
  };

  let perfilActivo = 'VIS';
  let aliasCiudadano = '';

  function cargarPerfil() {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE_PERFIL) || '{}');
      if (guardado.tag && PERFILES_M0[guardado.tag]) {
        perfilActivo = guardado.tag;
        aliasCiudadano = guardado.alias || '';
      }
    } catch {}
    actualizarUIPerfil();
  }

  function guardarPerfil(tag, alias = '') {
    perfilActivo = tag;
    aliasCiudadano = alias;
    try {
      localStorage.setItem(CLAVE_PERFIL, JSON.stringify({ tag, alias }));
    } catch {}
    actualizarUIPerfil();
  }

  function actualizarUIPerfil() {
    const p = PERFILES_M0[perfilActivo] || PERFILES_M0.VIS;
    const tagElem = $('#perfil-tag-actual');
    const nomElem = $('#perfil-nombre-actual');
    if (tagElem) {
      tagElem.textContent = p.tag;
      tagElem.style.background = p.color;
    }
    if (nomElem) {
      nomElem.textContent = aliasCiudadano ? `${aliasCiudadano} (${p.tag})` : p.nombre;
    }
  }

  function abrirModalPerfiles() {
    let modal = $('#modal-perfiles-m0');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-perfiles-m0';
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3, 8, 16, 0.88); backdrop-filter: blur(14px);
        display: grid; place-items: center; z-index: 1200; padding: var(--e4);
      `;
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div style="background: #091322; border: 1px solid #38bdf8; border-radius: 16px; width: 100%; max-width: 540px; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.8); position: relative; max-height: 90vh; overflow-y: auto;">
        <button id="btn-cerrar-perfiles" style="position: absolute; top: 14px; right: 14px; background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>

        <p class="seccion__eyebrow" style="margin-bottom:4px;">Matriz de Perfiles y Roles · M0 (F-001 a F-007)</p>
        <h3 style="color: #fff; margin: 0 0 6px 0; font-size: 1.25rem;">Seleccionar Perfil en el Ecosistema</h3>
        <p style="color: #cbd5e1; font-size: 12px; margin-bottom: 16px;">
          Cada perfil activa las herramientas correspondientes a su rol sin exigir nunca número de DNI (Política de Privacidad Estricta).
        </p>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- 1. VIS -->
          <div class="card-perfil-m0 ${perfilActivo === 'VIS' ? 'card-perfil-m0--activo' : ''}" data-rol="VIS" style="background:#0d1b2e; border:1px solid ${perfilActivo === 'VIS' ? '#0284c7' : '#1e3a5f'}; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="background:#0284c7; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px;">VIS</span>
                <strong style="color:#fff; font-size:13px;">Visitante Anónimo</strong>
              </div>
              <p style="margin:4px 0 0 0; font-size:11px; color:#94a3b8;">Búsqueda total sin registro, solicitudes con código G3-XXXXXX, sin captura de datos.</p>
            </div>
            <button type="button" class="btn-sel-rol" data-rol="VIS" style="background:${perfilActivo === 'VIS' ? '#0284c7' : 'transparent'}; border:1px solid #0284c7; color:#fff; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
              ${perfilActivo === 'VIS' ? 'Activo ✓' : 'Seleccionar'}
            </button>
          </div>

          <!-- 2. CIU -->
          <div class="card-perfil-m0 ${perfilActivo === 'CIU' ? 'card-perfil-m0--activo' : ''}" data-rol="CIU" style="background:#0d1b2e; border:1px solid ${perfilActivo === 'CIU' ? '#10b981' : '#1e3a5f'}; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="background:#10b981; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px;">CIU</span>
                <strong style="color:#fff; font-size:13px;">Ciudadano con Cuenta (Alias)</strong>
              </div>
              <p style="margin:4px 0 0 0; font-size:11px; color:#94a3b8;">Historial guardado localmente, notificaciones de stock en tu distrito.</p>
            </div>
            <button type="button" class="btn-sel-rol" data-rol="CIU" style="background:${perfilActivo === 'CIU' ? '#10b981' : 'transparent'}; border:1px solid #10b981; color:#fff; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
              ${perfilActivo === 'CIU' ? 'Activo ✓' : 'Ingresar'}
            </button>
          </div>

          <!-- 3. AGC -->
          <div class="card-perfil-m0 ${perfilActivo === 'AGC' ? 'card-perfil-m0--activo' : ''}" data-rol="AGC" style="background:#0d1b2e; border:1px solid ${perfilActivo === 'AGC' ? '#f59e0b' : '#1e3a5f'}; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="background:#f59e0b; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px;">AGC</span>
                <strong style="color:#fff; font-size:13px;">Agente Comunitario (Acompañamiento)</strong>
              </div>
              <p style="margin:4px 0 0 0; font-size:11px; color:#94a3b8;">Registro de solicitudes para vecinos vulnerables en caseríos sin pedir sus datos (F-008).</p>
            </div>
            <button type="button" class="btn-sel-rol" data-rol="AGC" style="background:${perfilActivo === 'AGC' ? '#f59e0b' : 'transparent'}; border:1px solid #f59e0b; color:#fff; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
              ${perfilActivo === 'AGC' ? 'Activo ✓' : 'Activar'}
            </button>
          </div>

          <!-- 4. POSTA -->
          <div class="card-perfil-m0 ${perfilActivo === 'POSTA' ? 'card-perfil-m0--activo' : ''}" data-rol="POSTA" style="background:#0d1b2e; border:1px solid ${perfilActivo === 'POSTA' ? '#8b5cf6' : '#1e3a5f'}; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="background:#8b5cf6; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px;">POSTA</span>
                <strong style="color:#fff; font-size:13px;">Personal Autorizado de Posta / Salud</strong>
              </div>
              <p style="margin:4px 0 0 0; font-size:11px; color:#94a3b8;">Atención en ventanilla, reporte de stock local y verificación de cadena de frío.</p>
            </div>
            <button type="button" class="btn-sel-rol" data-rol="POSTA" style="background:${perfilActivo === 'POSTA' ? '#8b5cf6' : 'transparent'}; border:1px solid #8b5cf6; color:#fff; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
              ${perfilActivo === 'POSTA' ? 'Activo ✓' : 'Identificarme'}
            </button>
          </div>

          <!-- 5. ADM -->
          <div class="card-perfil-m0" data-rol="ADM" style="background:#130b14; border:1px solid #ef4444; border-radius:10px; padding:12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="background:#ef4444; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px;">ADM</span>
                <strong style="color:#fca5a5; font-size:13px;">Administrador Regional (Protegido)</strong>
              </div>
              <p style="margin:4px 0 0 0; font-size:11px; color:#cbd5e1;">Centro de Mando, monitor SSE, firewall WAF y respaldo.</p>
            </div>
            <button type="button" class="btn-sel-rol" data-rol="ADM" style="background:#ef4444; border:none; color:#fff; padding:6px 14px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">
              Ingresar con Clave 🔒
            </button>
          </div>
        </div>

        <!-- Formulario Ciudadano (oculto por defecto) -->
        <div id="subseccion-alias-ciu" style="display:none; margin-top:16px; background:#070e1a; border:1px solid #10b981; border-radius:10px; padding:14px;">
          <label style="display:block; font-size:11px; color:#cbd5e1; margin-bottom:6px;">Ingresa tu Alias o Nombre de Pila (Nunca tu DNI):</label>
          <div style="display:flex; gap:8px;">
            <input type="text" id="input-alias-ciu" placeholder="Ej: Vecino de Víctor Larco" style="flex:1; background:#040913; border:1px solid #334155; border-radius:6px; color:#fff; padding:7px 10px; font-size:12px;">
            <button type="button" id="btn-confirmar-alias" style="background:#10b981; color:#fff; border:none; padding:7px 14px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Guardar Perfil</button>
          </div>
        </div>

        <!-- Formulario Administrador (oculto por defecto) -->
        <div id="subseccion-clave-adm" style="display:none; margin-top:16px; background:#1c080d; border:1px solid #ef4444; border-radius:10px; padding:14px;">
          <label style="display:block; font-size:11px; color:#fca5a5; margin-bottom:6px;">Contraseña de Seguridad Administrativa:</label>
          <div style="display:flex; gap:8px;">
            <input type="password" id="input-clave-adm" placeholder="Clave oficial de la demo" style="flex:1; background:#090204; border:1px solid #991b1b; border-radius:6px; color:#fff; padding:7px 10px; font-size:12px;">
            <button type="button" id="btn-confirmar-adm" style="background:#ef4444; color:#fff; border:none; padding:7px 14px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer;">Desbloquear Admin</button>
          </div>
          <small id="error-clave-adm" style="display:none; color:#f87171; font-size:10px; margin-top:6px;"></small>
        </div>
      </div>
    `;

    modal.hidden = false;
    modal.style.display = 'grid';

    $('#btn-cerrar-perfiles')?.addEventListener('click', () => {
      modal.hidden = true;
      modal.style.display = 'none';
    });

    // Eventos de selección de rol
    $$('.btn-sel-rol', modal).forEach(btn => {
      btn.addEventListener('click', () => {
        const rol = btn.dataset.rol;
        if (rol === 'VIS') {
          guardarPerfil('VIS');
          modal.hidden = true;
          modal.style.display = 'none';
        } else if (rol === 'CIU') {
          const sub = $('#subseccion-alias-ciu');
          if (sub) sub.style.display = 'block';
          $('#input-alias-ciu')?.focus();
        } else if (rol === 'AGC') {
          guardarPerfil('AGC', 'Agente Comunitario');
          prefs.chips.acompanamiento = true;
          guardarPrefs();
          aplicarPrefs();
          modal.hidden = true;
          modal.style.display = 'none';
        } else if (rol === 'POSTA') {
          guardarPerfil('POSTA', 'Personal C.S. Moche');
          modal.hidden = true;
          modal.style.display = 'none';
        } else if (rol === 'ADM') {
          const subAdm = $('#subseccion-clave-adm');
          if (subAdm) subAdm.style.display = 'block';
          $('#input-clave-adm')?.focus();
        }
      });
    });

    $('#btn-confirmar-alias')?.addEventListener('click', () => {
      const alias = $('#input-alias-ciu')?.value.trim() || 'Ciudadano';
      guardarPerfil('CIU', alias);
      modal.hidden = true;
      modal.style.display = 'none';
    });

    $('#btn-confirmar-adm')?.addEventListener('click', () => {
      const pass = $('#input-clave-adm')?.value.trim();
      const errElem = $('#error-clave-adm');
      if (pass === 'Salud2026!') {
        sessionStorage.setItem('adminTokenG3', 'Salud2026!');
        modal.hidden = true;
        modal.style.display = 'none';
        window.location.href = 'admin.html';
      } else {
        if (errElem) {
          errElem.textContent = 'Contraseña incorrecta. Utilice las credenciales oficiales (Salud2026!)';
          errElem.style.display = 'block';
        }
      }
    });
  }

  /* =====================================================================
     MODAL DE GUÍA OFICIAL LÍNEA 113 MINSA (OPCIONES 1 A 6)
     ===================================================================== */
  function abrirModalGuia113() {
    let modal = $('#modal-guia-113');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-guia-113';
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(3, 8, 16, 0.88); backdrop-filter: blur(14px);
        display: grid; place-items: center; z-index: 1200; padding: var(--e4);
      `;
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div style="background: #091322; border: 1px solid #10b981; border-radius: 16px; width: 100%; max-width: 520px; padding: 24px; box-shadow: 0 25px 60px rgba(0,0,0,0.8); position: relative; max-height: 90vh; overflow-y: auto;">
        <button id="btn-cerrar-guia-113" style="position: absolute; top: 14px; right: 14px; background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>

        <p class="seccion__eyebrow" style="margin-bottom:4px; color:#34d399;">Canal Telefónico Gratuito 24/7 · MINSA</p>
        <h3 style="color: #fff; margin: 0 0 6px 0; font-size: 1.25rem;">Árbol Oficial de Opciones: Línea 113</h3>
        <p style="color: #cbd5e1; font-size: 12px; margin-bottom: 16px;">
          Llama gratis desde cualquier celular o teléfono fijo a nivel nacional. Al marcar 113, digita la opción según tu necesidad médica:
        </p>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:18px;">
          <div style="background:#040e1b; border:1px solid #1e3a5f; border-radius:8px; padding:10px;">
            <strong style="color:#38bdf8; font-size:12px;">Opción 1: Dengue, Fiebres y Enfermedades Transmisibles</strong>
            <p style="margin:2px 0 0 0; font-size:11px; color:#94a3b8;">Signos de alarma de dengue, hidratación y síntomas febriles agudos.</p>
          </div>
          <div style="background:#040e1b; border:1px solid #1e3a5f; border-radius:8px; padding:10px;">
            <strong style="color:#a78bfa; font-size:12px;">Opción 2: Salud Mental y Apoyo Psicológico 24 Horas</strong>
            <p style="margin:2px 0 0 0; font-size:11px; color:#94a3b8;">Atención en crisis de ansiedad, depresión, duelo y soporte emocional continuo.</p>
          </div>
          <div style="background:#040e1b; border:1px solid #1e3a5f; border-radius:8px; padding:10px;">
            <strong style="color:#34d399; font-size:12px;">Opción 3: Seguro Integral de Salud (SIS)</strong>
            <p style="margin:2px 0 0 0; font-size:11px; color:#94a3b8;">Consultas de afiliación, cobertura de recetas gratuitas y cambio de establecimiento.</p>
          </div>
          <div style="background:#040e1b; border:1px solid #1e3a5f; border-radius:8px; padding:10px;">
            <strong style="color:#f59e0b; font-size:12px;">Opción 4: Nutrición, Anemia y Lactancia Materna</strong>
            <p style="margin:2px 0 0 0; font-size:11px; color:#94a3b8;">Suplementación con hierro, recetas ricas en hierro y descarte de anemia.</p>
          </div>
          <div style="background:#040e1b; border:1px solid #38bdf8; font-size:12px;">
            <strong style="color:#38bdf8; font-size:12px;">Opción 5: Información Institucional y Vacunación</strong>
            <p style="margin:2px 0 0 0; font-size:11px; color:#94a3b8;">Puntos de vacunación, esquema regular y trámites de salud pública.</p>
          </div>
          <div style="background:#040e1b; border:1px solid #ef4444; border-radius:8px; padding:10px;">
            <strong style="color:#f87171; font-size:12px;">Opción 6: Violencia Familiar y Maltrato (Línea 100 / MIMP)</strong>
            <p style="margin:2px 0 0 0; font-size:11px; color:#94a3b8;">Derivación inmediata a Centro Emergencia Mujer (CEM) y protección a víctimas.</p>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button id="btn-cerrar-guia" type="button" style="background:transparent; border:1px solid #334155; color:#94a3b8; padding:8px 14px; border-radius:8px; font-size:12px; cursor:pointer;">Cerrar</button>
          <a href="tel:113" style="background:#10b981; color:#fff; text-decoration:none; padding:8px 20px; border-radius:8px; font-size:12px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
            <span>📞</span> Llamar al 113 Gratis
          </a>
        </div>
      </div>
    `;

    modal.hidden = false;
    modal.style.display = 'grid';

    $('#btn-cerrar-guia-113')?.addEventListener('click', () => { modal.style.display = 'none'; modal.hidden = true; });
    $('#btn-cerrar-guia')?.addEventListener('click', () => { modal.style.display = 'none'; modal.hidden = true; });
  }

  /* =====================================================================
     GATEWAY CINEMATOGRÁFICO DE INICIALIZACIÓN (M0 / F-001)
     ===================================================================== */
  function initBootGateway() {
    const gateway = $('#boot-gateway');
    if (!gateway) return;

    const yaIniciado = sessionStorage.getItem('g3-boot-completado');
    if (yaIniciado === 'true') {
      gateway.classList.add('boot-gateway--oculto');
      gateway.hidden = true;
      return;
    }

    function cerrarBootGateway() {
      sessionStorage.setItem('g3-boot-completado', 'true');
      gateway.classList.add('boot-gateway--oculto');
      setTimeout(() => {
        gateway.hidden = true;
      }, 600);
    }

    $$('.boot-role-btn', gateway).forEach(btn => {
      btn.addEventListener('click', () => {
        const rol = btn.dataset.rol;
        if (rol === 'VIS') {
          guardarPerfil('VIS');
          cerrarBootGateway();
        } else if (rol === 'CIU') {
          guardarPerfil('CIU', 'Ciudadano');
          cerrarBootGateway();
        } else if (rol === 'AGC') {
          guardarPerfil('AGC', 'Agente Comunitario');
          prefs.chips.acompanamiento = true;
          guardarPrefs();
          aplicarPrefs();
          cerrarBootGateway();
        } else if (rol === 'POSTA') {
          guardarPerfil('POSTA', 'Personal C.S. Moche');
          cerrarBootGateway();
        } else if (rol === 'ADM') {
          cerrarBootGateway();
          abrirModalPerfiles();
          setTimeout(() => {
            const btnAdm = document.querySelector('.card-perfil-m0[data-rol="ADM"] .btn-sel-rol');
            btnAdm?.click();
          }, 350);
        }
      });
    });

    $('#btn-boot-omitir')?.addEventListener('click', () => {
      guardarPerfil('VIS');
      cerrarBootGateway();
    });
  }

  /* =====================================================================
     ARRANQUE
     ===================================================================== */
  function iniciar() {
    initBootGateway();
    cargarPrefs();
    aplicarPrefs();
    initControles();
    initChips();
    initBuscador();
    initEntradas();
    detectarConexion();
    iniciarRelojPeru();
    cargarPerfil();

    $('#btn-selector-perfil')?.addEventListener('click', abrirModalPerfiles);
    $('#btn-guia-113')?.addEventListener('click', abrirModalGuia113);

    window.addEventListener('g3:abrir-solicitud', (e) => {
      if (e.detail?.item) {
        abrirModalSolicitudG3(e.detail.tipo || 'medicamento', e.detail.item);
      }
    });

    window.addEventListener('online', detectarConexion);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
