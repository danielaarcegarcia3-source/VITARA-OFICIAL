/**
 * planos-medidas.js — R-06/R-08 (HANDOFF 09 §6)
 * #planos-vista: planos acotados + medidas por ambiente; #equipamiento-vista:
 * carencia nacional + fallas acreditadas + GLBs de hospital del equipo.
 */
(function () {
  'use strict';
  const $ = (sel, raiz = document) => raiz.querySelector(sel);

  const AMBIENTES_MODELO = [
    { id: 'farmacia', nombre: 'Farmacia y Cadena de Frío', ancho: 8, largo: 4, alto: 2.6 },
    { id: 'consultorio', nombre: 'Consultorio Clínico', ancho: 4, largo: 4, alto: 2.4 },
    { id: 'sala-espera', nombre: 'Sala de Espera y Triaje', ancho: 3.5, largo: 3.5, alto: 2.2 },
    { id: 'ambulancia', nombre: 'Punto de Telesalud RNT', ancho: 2.5, largo: 3, alto: 2 },
    { id: 'area-equipos', nombre: 'Sala de Equipos Biomédicos', ancho: 2.5, largo: 3, alto: 2.5 },
    { id: 'patio-exterior', nombre: 'Patio Exterior de Recarga de Materiales', ancho: 6, largo: 6, alto: 1 }
  ];

  const EQUIPOS_GLB = [
    { id: 'eq:ecografo-01', nombre: 'Ecógrafo Doppler Color', glb: '/assets/3d/low_poly_hospital.glb' },
    { id: 'eq:desfib-01', nombre: 'Desfibrilador Bifásico', glb: '/assets/3d/hospital_operating_room.glb' }
  ];

  function planoHtml(amb) {
    const escala = 84; // px por metro
    const w = amb.ancho * escala, h = amb.largo * escala;
    return `<article class="plano-card">
      <h3>Plano de ${amb.nombre} · ${amb.id}</h3>
      <div class="plano-box" style="width:${w}px;height:${h}px">
        <div class="plano-rect">${w} × ${h} px (escala 84 px/m)</div>
      </div>
      <ul class="plano-medidas">
        <li>Ancho: ${amb.ancho} m</li>
        <li>Largo: ${amb.largo} m</li>
        <li>Altura de muro destinado: ${amb.alto} m (referencia NTS 110)</li>
      </ul>
    </article>`;
  }

  const $planos = $('#planos-vista');
  if ($planos) {
    $planos.innerHTML = `
      <div class="seccion__cab">
        <p class="seccion__eyebrow">R-07 · Planos Acotados</p>
        <h2 class="seccion__titulo">Medidas y dimensiones del modelo demo</h2>
        <p class="seccion__texto">Datos de AMBIENTES_MODELO (fuente: seguridad/medidas del equipo). No son planos certified.</p>
      </div>
      <div class="planos-grid">${AMBIENTES_MODELO.map(planoHtml).join('')}</div>`;
  }

  const $equip = $('#equipamiento-vista');
  if ($equip) {
    const doe = window.DatosSaludPeru?.equiposMedicos || [];
    $equip.innerHTML = `
      <div class="seccion__cab">
        <p class="seccion__eyebrow">R-08 · Equipamiento — Carencia y Proveedores</p>
        <h2 class="seccion__titulo">Equipos médicos representativos y GLBs del equipo</h2>
      </div>
      <div class="equipamiento-grid">
        ${doe.map((e) => `<article class="equip-card"><strong>${e.nombre}</strong><span class="equip-est">${e.estado}</span><span class="equip-fb">${e.falla}</span></article>`).join('')}
      </div>
      <div class="equip-glb-grid">
        ${EQUIPOS_GLB.map((e) => `<div class="equip-glb-item"><h4>${e.nombre}</h4><code>${e.glb}</code></div>`).join('')}
      </div>
      <div class="equip-etiqueta">Modelos 3D de hospital: frontend/assets/3d/{low_poly_hospital,hospital_operating_room,modelodehosipitalvisitaVR3D,adn}.glb</div>`;
  }
})();
