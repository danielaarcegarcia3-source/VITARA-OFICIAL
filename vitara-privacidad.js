/**
 * vitara-privacidad.js — transparencia y mantención de datos locales
 * -------------------------------------------------------------------------
 * · Resume qué guarda VITARA en este navegador (solo claves g3*).
 * · Exporta esos datos como JSON descargable.
 * · Borra todos los datos locales de la aplicación.
 * · Poda interacciones antiguas (más de 30 días) para no acumular historial.
 * · Consulta la política de retención del servidor (/api/privacidad).
 *
 * No lee ni envía datos a terceros. No inventa métricas: si no hay datos,
 * lo dice con claridad.
 */
(function () {
  'use strict';
  const V = window.Vitara;
  if (!V) return;
  const { $, toast } = V;

  const PREFIJO = 'g3';
  const RETENCION_DIAS = 30;

  function clavesLocales() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.indexOf(PREFIJO) === 0 || k.startsWith('vitara.'))) out.push(k);
      }
    } catch { /* almacenamiento no disponible */ }
    return out;
  }

  function tamanoBytes() {
    let total = 0;
    for (const k of clavesLocales()) {
      try { total += (localStorage.getItem(k) || '').length + k.length; } catch { /* ignorar */ }
    }
    return total;
  }

  function formatearBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Mantención: descarta interacciones locales con más de 30 días.
  function podarAntiguos() {
    const limite = Date.now() - RETENCION_DIAS * 86400000;
    const podarLista = (clave) => {
      try {
        const lista = JSON.parse(localStorage.getItem(clave) || '[]');
        if (!Array.isArray(lista)) return;
        const limpias = lista.filter((x) => {
          const ts = Number(x && (x.ts || new Date(x.fecha).getTime()));
          return !Number.isFinite(ts) || ts >= limite;
        });
        if (limpias.length !== lista.length) {
          localStorage.setItem(clave, JSON.stringify(limpias));
        }
      } catch { /* lista corrupta: se ignora */ }
    };
    ['g3-continuar', 'g3-tabs-vistas', 'g3.solicitudes', 'g3-solicitudes', 'g3.busquedas', 'g3.interacciones'].forEach(podarLista);
  }

  function contarCodigos() {
    let n = 0;
    try {
      const lista = JSON.parse(localStorage.getItem('g3.solicitudes') || '[]');
      if (Array.isArray(lista)) n = lista.length;
    } catch { /* sin datos */ }
    return n;
  }

  function contarLista(clave) {
    try {
      const lista = JSON.parse(localStorage.getItem(clave) || '[]');
      return Array.isArray(lista) ? lista.length : 0;
    } catch { return 0; }
  }

  function render() {
    const resumen = $('#priv-resumen');
    const detalle = $('#priv-detalle');
    const codigos = $('#priv-codigos');
    if (!resumen) return;
    const claves = clavesLocales();
    const bytes = tamanoBytes();
    const nCodigos = contarCodigos();
    const nBusquedas = contarLista('g3.busquedas');
    const nInter = contarLista('g3.interacciones');
    resumen.textContent = claves.length
      ? `${claves.length} registro${claves.length === 1 ? '' : 's'} local${claves.length === 1 ? '' : 'es'} · ${formatearBytes(bytes)}`
      : 'Sin datos guardados en este dispositivo';
    detalle.textContent = claves.length
      ? `Preferencias de accesibilidad, perfil local, ${nBusquedas} búsqueda${nBusquedas === 1 ? '' : 's'} reciente${nBusquedas === 1 ? '' : 's'} e ${nInter} interacción${nInter === 1 ? '' : 'es'} de navegación. Puedes exportarlo o borrarlo aquí mismo.`
      : 'Cuando personalices tu perfil, busques un recurso o guardes un código de seguimiento aparecerán aquí.';
    if (codigos) {
      const partes = [];
      if (nCodigos) partes.push(`${nCodigos} código${nCodigos === 1 ? '' : 's'} de seguimiento`);
      if (nBusquedas) partes.push(`${nBusquedas} búsqueda${nBusquedas === 1 ? '' : 's'} reciente${nBusquedas === 1 ? '' : 's'}`);
      codigos.textContent = partes.length
        ? `En este navegador: ${partes.join(' · ')}.`
        : 'Sin códigos de seguimiento ni búsquedas guardadas';
    }
  }

  function exportar() {
    const datos = {};
    for (const k of clavesLocales().filter(k => k !== 'vitara.participant.token')) {
      try { datos[k] = JSON.parse(localStorage.getItem(k)); }
      catch { datos[k] = localStorage.getItem(k); }
    }
    const payload = {
      generadoEn: new Date().toISOString(),
      aplicacion: 'VITARA · Red Salud Perú',
      nota: 'Datos guardados por VITARA en este navegador. No contienen DNI, historia clínica ni diagnósticos.',
      retencionLocalDias: RETENCION_DIAS,
      datos
    };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitara-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Datos locales exportados. El archivo se descargó en tu dispositivo.');
    } catch {
      toast('No se pudo exportar en este navegador.', 'warn');
    }
  }

  // Borra todas las claves de VITARA (localStorage y sessionStorage).
  function borrarDatosLocales() {
    const claves = clavesLocales();
    for (const k of claves) {
      try { localStorage.removeItem(k); } catch { /* ignorar */ }
    }
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && (k.indexOf(PREFIJO) === 0 || k === 'adminTokenG3')) sessionStorage.removeItem(k);
      }
    } catch { /* ignorar */ }
    return claves.length;
  }

  function borrarConConfirmacion() {
    if (!window.confirm('¿Borrar los datos LOCALES de este dispositivo? Esto NO elimina tu perfil del servidor. Para eliminarlo usa primero Participación; si borras ahora la clave local necesitarás ayuda del administrador. Esta acción no se puede deshacer.')) return;
    const n = borrarDatosLocales();
    toast(n ? `Se borraron ${n} registros locales. Recargando…` : 'No había datos locales que borrar. Recargando…');
    setTimeout(() => location.reload(), 500);
  }

  function consultarRetencion() {
    const nodo = $('#priv-retencion');
    if (!nodo) return;
    fetch('/api/privacidad', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('sin respuesta'))))
      .then((data) => {
        const p = data && data.politica;
        if (!p) throw new Error('formato');
        nodo.textContent = `Servidor: retención de ${p.retencionSolicitudesDias} días con purga automática · sin DNI · sin cookies de terceros · datos en ${p.servidor}.`;
      })
      .catch(() => {
        nodo.textContent = `Retención local: ${RETENCION_DIAS} días. El servidor no está disponible en este momento; no se muestra una cifra inventada.`;
      });
  }

  // API compartida con el popover de perfil.
  V.borrarDatosLocales = borrarDatosLocales;

  function iniciar() {
    podarAntiguos();
    render();
    $('#priv-exportar')?.addEventListener('click', exportar);
    $('#priv-borrar')?.addEventListener('click', borrarConConfirmacion);
    consultarRetencion();
    V.onView('comunidad', () => { podarAntiguos(); render(); consultarRetencion(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
