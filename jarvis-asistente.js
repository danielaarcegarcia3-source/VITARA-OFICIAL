/**
 * jarvis-asistente.js — Asistente Inteligente Sci-Fi "JARVIS Salud Perú"
 * Ecosistema Digital de Acceso a la Salud · Grupo 3 · ODS 3, 9 y 10
 *
 * Características:
 * · Interfaz holográfica interactiva estilo Tony Stark / Arc Reactor.
 * · Conocimiento embebido de las 339 IPRESS, DIGEMID, Línea 113 y Dengue.
 * · Guía interactiva paso a paso para síntomas y derivación de emergencias.
 * · Generación asistida de solicitudes anónimas con código privado G3-XXXXXX.
 */

(function () {
  'use strict';

  const JARVIS_RESPUESTAS = [
    {
      claves: ['dengue', 'fiebre', 'zancudo', 'aedes', 'sintomas'],
      titulo: 'Protocolo de Emergencia Dengue (MINSA / CDC Perú)',
      texto: `<strong>⚠️ Alerta Epidemiológica Dengue en La Libertad:</strong><br>
Si presentas fiebre alta (>38.5°C), dolor detrás de los ojos, dolor muscular o manchas rojas:<br>
• <strong>Signos de Alarma:</strong> Dolor abdominal intenso, vómitos persistentes o sangrado de encías (Acude inmediatamente a Emergencias o llama al SAMU 106).<br>
• <strong>Tratamiento normado:</strong> Hidratación con Sales de Rehidratación Oral (SRO) y Paracetamol 500mg.<br>
• <strong>Prohibido:</strong> NO tomar Ibuprofeno, Aspirina ni Naproxeno (aumentan riesgo de hemorragia).`,
      acciones: [
        { texto: 'Llamar al 113 Opc. 1', url: 'tel:113' },
        { texto: 'Ver Kit Dengue', buscar: 'dengue' }
      ]
    },
    {
      claves: ['paracetamol', 'amoxicilina', 'medicamento', 'precio', 'generico', 'digemid', 'pastilla'],
      titulo: 'Orientación Farmacéutica DIGEMID (Leyes 29459 y 32033)',
      texto: `<strong>💊 Transparencia de Precios y Stock de Medicamentos:</strong><br>
En el Perú las farmacias y boticas están obligadas por ley a ofrecer medicamentos genéricos DCI.<br>
• <strong>Paracetamol 500mg:</strong> Genérico S/ 0.10 vs Marca S/ 2.50 (96% de ahorro).<br>
• <strong>Amoxicilina 500mg:</strong> Genérico S/ 0.15 vs Marca S/ 1.80 (91.7% de ahorro).<br>
• Puedes pedir confirmación de stock a la posta más cercana sin registrar tu DNI.`,
      acciones: [
        { texto: 'Explorar en 3D', scroll: '#vista3d' },
        { texto: 'Consultar Sismed', scroll: '#tablero-regional-sismed' }
      ]
    },
    {
      claves: ['posta', 'hospital', 'moche', 'chugay', 'trujillo', 'donde', 'atencion', 'ipress'],
      titulo: 'Directorio Oficial de 339 IPRESS en La Libertad',
      texto: `<strong>🏥 Red de Establecimientos de Salud (SUSALUD RENIPRESS):</strong><br>
Monitoreamos en directo 339 postas y hospitales en las 12 redes regionales (Trujillo, Sánchez Carrión, Otuzco, Pataz, etc.).<br>
• Nivel de abastecimiento regional actual: <strong>92.9% Óptimo</strong>.<br>
• Puedes buscar tu posta por distrito o microrred en el buscador superior.`,
      acciones: [
        { texto: 'Buscar Posta', scroll: '#buscador' },
        { texto: 'Ver Mapa Satelital', scroll: '#seccion-mapas' }
      ]
    },
    {
      claves: ['cita', 'virtual', 'teleatiendo', 'medico', 'especialista', 'consulta'],
      titulo: 'Plataforma Oficial de Telesalud MINSA',
      texto: `<strong>💻 Citas Médicas Virtuales con Teleatiendo:</strong><br>
Puedes recibir atención médica por videollamada con médicos colegiados del Ministerio de Salud de forma 100% gratuita.<br>
• Emisión de receta electrónica oficial.<br>
• Despacho de medicamentos en tu centro de salud más cercano.`,
      acciones: [
        { texto: 'Ir a Teleatiendo ↗', url: 'https://teleatiendo.minsa.gob.pe/' },
        { texto: 'Llamar al 113', url: 'tel:113' }
      ]
    },
    {
      claves: ['sis', 'seguro', 'afiliacion', 'gratis'],
      titulo: 'Seguro Integral de Salud (SIS)',
      texto: `<strong>🛡️ Cobertura Pública de Salud:</strong><br>
El 91.1% de la población cuenta con aseguramiento (63.1% SIS). El SIS cubre al 100% las consultas, medicamentos de petitorio y traslados de emergencia.<br>
• Verifica tu estado de afiliación directamente con tu DNI en el portal oficial del SIS.`,
      acciones: [
        { texto: 'Consultar Afiliación SIS ↗', url: 'https://app.sis.gob.pe/ConsultaAfiliado/' },
        { texto: 'Línea 113 Opc. 3 (SIS)', url: 'tel:113' }
      ]
    },
    {
      claves: ['g3', 'ticket', 'solicitud', 'codigo', 'anonimo', 'seguimiento'],
      titulo: 'Sistema de Solicitud Ciudadana Anónima G3',
      texto: `<strong>📋 Trazabilidad sin Violación de Privacidad:</strong><br>
Generamos un código privado <code>G3-XXXXXX</code> válido por 30 días para consultar disponibilidad de recursos.<br>
• No te pedimos DNI, datos de salud ni historial clínico.<br>
• La sede responde en un plazo máximo de 24 horas y puedes rastrear la respuesta desde cualquier equipo.`,
      acciones: [
        { texto: 'Rastrear mi Código G3', scroll: '#buscador' }
      ]
    }
  ];

  function montarJarvis() {
    // 1. Lanzador Flotante (Arc-Reactor Orb)
    let launcher = document.getElementById('jarvis-orb-launcher');
    if (!launcher) {
      launcher = document.createElement('div');
      launcher.id = 'jarvis-orb-launcher';
      launcher.className = 'jarvis-orb-launcher';
      launcher.title = 'JARVIS Salud: Asistente Holográfico Inteligente';
      launcher.innerHTML = `
        <div style="font-size:26px;">🤖</div>
      `;
      document.body.appendChild(launcher);
    }

    // 2. Ventana de Chat Sci-Fi
    let ventana = document.getElementById('jarvis-chat-window');
    if (!ventana) {
      ventana = document.createElement('div');
      ventana.id = 'jarvis-chat-window';
      ventana.className = 'jarvis-chat-window';
      ventana.hidden = true;
      ventana.innerHTML = `
        <div class="jarvis-chat-cab">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">💠</span>
            <div>
              <strong style="color:#00f0ff; font-size:13px; letter-spacing:0.05em;">JARVIS SALUD PERÚ</strong>
              <small style="display:block; color:#94a3b8; font-size:9px; font-family:var(--fuente-mono);">Ecosistema Sanitario v4.2</small>
            </div>
          </div>
          <button id="btn-cerrar-jarvis" type="button" style="background:transparent; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
        </div>

        <div class="jarvis-chat-body" id="jarvis-chat-body">
          <div class="jarvis-msg jarvis-msg--bot">
            <strong>Hola, soy tu asistente de salud del Grupo 3.</strong><br>
            Puedo orientarte sobre síntomas de dengue, consultar medicamentos DIGEMID, ubicar postas médicas en La Libertad o ayudarte a crear un ticket anónimo G3.
            <div class="jarvis-quick-chips">
              <span class="jarvis-chip" data-msg="Tengo fiebre y dolor de cuerpo">🦟 Dengue / Síntomas</span>
              <span class="jarvis-chip" data-msg="Precios de Paracetamol y Amoxicilina">💊 Ahorro en Genéricos</span>
              <span class="jarvis-chip" data-msg="Dónde queda la posta de Moche">🏥 Postas de Salud</span>
              <span class="jarvis-chip" data-msg="Cómo sacar cita virtual">💻 Teleatiendo MINSA</span>
              <span class="jarvis-chip" data-msg="Cómo funciona el código G3">📋 Ticket Anónimo</span>
            </div>
          </div>
        </div>

        <form class="jarvis-chat-input-bar" id="jarvis-form">
          <input type="text" class="jarvis-input" id="jarvis-input" placeholder="Pregunta sobre salud, medicinas o postas…" autocomplete="off">
          <button type="submit" class="jarvis-send-btn">Enviar</button>
        </form>
      `;
      document.body.appendChild(ventana);
    }

    // Eventos
    launcher.addEventListener('click', () => {
      ventana.hidden = !ventana.hidden;
      if (!ventana.hidden) {
        document.getElementById('jarvis-input')?.focus();
      }
    });

    document.getElementById('btn-cerrar-jarvis')?.addEventListener('click', () => {
      ventana.hidden = true;
    });

    const form = document.getElementById('jarvis-form');
    const input = document.getElementById('jarvis-input');
    const body = document.getElementById('jarvis-chat-body');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = input.value.trim();
      if (!txt) return;

      agregarMensajeUsuario(txt);
      input.value = '';
      procesarPregunta(txt);
    });

    // Chips de sugerencia rápida
    body?.addEventListener('click', (e) => {
      const chip = e.target.closest('.jarvis-chip');
      if (chip && chip.dataset.msg) {
        agregarMensajeUsuario(chip.dataset.msg);
        procesarPregunta(chip.dataset.msg);
      }
    });

    function agregarMensajeUsuario(msg) {
      const div = document.createElement('div');
      div.className = 'jarvis-msg jarvis-msg--user';
      div.textContent = msg;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    }

    function procesarPregunta(pregunta) {
      const pNorm = pregunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Buscar coincidencia en la base de conocimientos
      let hallada = JARVIS_RESPUESTAS.find(r => 
        r.claves.some(clave => pNorm.includes(clave))
      );

      // Respuesta de fallback inteligente
      if (!hallada) {
        hallada = {
          titulo: 'Orientación del Ecosistema de Salud',
          texto: `He analizado tu consulta sobre <em>"${pregunta}"</em>.<br>
Recuerda que puedes utilizar el <strong>Buscador Universal</strong> en la parte superior para consultar medicamentos, postas y equipos en milisegundos, o llamar gratuitamente al <strong>113 MINSA</strong> para orientación médica colegiada.`,
          acciones: [
            { texto: 'Llamar al 113', url: 'tel:113' },
            { texto: 'Ir al Buscador', scroll: '#buscador' }
          ]
        };
      }

      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'jarvis-msg jarvis-msg--bot';
        
        let botonesHTML = '';
        if (hallada.acciones && hallada.acciones.length) {
          botonesHTML = `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">` +
            hallada.acciones.map(a => {
              if (a.url) {
                return `<a href="${a.url}" target="_blank" rel="noopener noreferrer" style="background:#0284c7; color:#fff; padding:4px 10px; border-radius:6px; font-size:10px; font-weight:700; text-decoration:none;">${a.texto}</a>`;
              } else if (a.scroll) {
                return `<button type="button" class="btn-jarvis-nav" data-target="${a.scroll}" style="background:#064e3b; color:#6ee7b7; border:1px solid #10b981; padding:4px 10px; border-radius:6px; font-size:10px; font-weight:700; cursor:pointer;">${a.texto}</button>`;
              } else if (a.buscar) {
                return `<button type="button" class="btn-jarvis-busq" data-term="${a.buscar}" style="background:#1e3a5f; color:#7dd3fc; border:1px solid #38bdf8; padding:4px 10px; border-radius:6px; font-size:10px; font-weight:700; cursor:pointer;">${a.texto}</button>`;
              }
              return '';
            }).join('') + `</div>`;
        }

        div.innerHTML = `
          <strong style="color:#00f0ff; display:block; margin-bottom:4px;">${hallada.titulo}</strong>
          <div>${hallada.texto}</div>
          ${botonesHTML}
        `;

        body.appendChild(div);
        body.scrollTop = body.scrollHeight;

        // Conectar botones dinámicos
        div.querySelectorAll('.btn-jarvis-nav').forEach(btn => {
          btn.addEventListener('click', () => {
            const el = document.querySelector(btn.dataset.target);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            ventana.hidden = true;
          });
        });

        div.querySelectorAll('.btn-jarvis-busq').forEach(btn => {
          btn.addEventListener('click', () => {
            const inputBusq = document.getElementById('campo-busqueda');
            if (inputBusq) {
              inputBusq.value = btn.dataset.term;
              document.getElementById('form-busqueda')?.requestSubmit();
              inputBusq.scrollIntoView({ behavior: 'smooth', block: 'center' });
              ventana.hidden = true;
            }
          });
        });

      }, 350);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarJarvis);
  } else {
    montarJarvis();
  }

  window.JarvisSalud = { montarJarvis };
})();
