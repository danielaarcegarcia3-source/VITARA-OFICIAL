/**
 * canales-ayuda.js — T-06 · Vista de canales reales (CANALES_AYUDA)
 * Tarjetas grandes que activan canales oficiales (tel: y enlaces oficiales).
 * Fuente: DatosSaludPeru.js. Sin datos inventados.
 */
(function () {
  'use strict';
  const $ = (sel, raiz = document) => raiz.querySelector(sel);

  const seccion = $('#canales-vista');
  if (!seccion) return;

  const canales = (window.DatosSaludPeru?.canalesAyuda || []).slice(0, 9);

  const item = (c) => `
    <article class="canal-real">
      <div class="canal-real__cab">
        <h3 class="canal-real__titulo">${c.nombre}</h3>
        <span class="canal-real__tipo">${c.tipo || ''}</span>
        <span class="canal-real__fuente">Fuente: DatosSaludPeru.js</span>
      </div>
      <p class="canal-real__desc">${c.descripcion || ''}</p>
      ${c.opciones?.length ? `<div class="canal-real__opciones">
        ${c.opciones.map(o => `<span class="canal-real__opc">${o.op}. ${o.nombre} — ${o.detalle}</span>`).join('')}
      </div>` : ''}
      <div class="canal-real__acciones">
        ${c.urlDirecta ? `<a class="canal-real__boton canal-real__boton--link" href="${c.urlDirecta}" target="_blank" rel="noopener noreferrer">Abrir canal ↗</a>` : ''}
        ${c.telefono ? `<a class="canal-real__boton" href="tel:${c.telefono}">Llamar ${c.telefono}</a>` : ''}
        <a class="canal-real__boton canal-real__boton--sec" href="#vista3d">Ver en ADN 3D →</a>
      </div>
    </article>`;

  seccion.innerHTML = `
    <div class="seccion__cab">
      <p class="seccion__eyebrow">Red de Canales Reales de Emergencia y Orientación</p>
      <h2 class="seccion__titulo">Canales Oficiales del Estado Peruano · Gratis y 24/7</h2>
      <p class="seccion__texto">
        Tarjetas grandes que activan canales oficiales reales (tel:113, Teleatiendo, Línea 113 Opción 2/4,
        SAMU 106, WhatsApp MINSA y los portales DIGEMID). Fuente: DatosSaludPeru.js.
      </p>
    </div>
    <div class="canales-real__grid" id="canales-real__grid" role="list">${canales.map(item).join('') || '<p class="seccion__sin-datos">Sin registros en el catálogo actual.</p>'}</div>`;
})();
