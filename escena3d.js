/**
 * escena3d.js — Visualización 3D Interactiva & Plano Arquitectónico de la Sede
 * Ecosistema Digital de Acceso a la Salud · Grupo 3 · ODS 3, 9 y 10
 *
 * Funciones cubiertas:
 *   F-611  Vista 3D de la sede (ambientes y equipos clicables con datos reales)
 *   F-612  Equivalencia 2D completa (Plano arquitectónico + lista de ambientes)
 *   F-1201 Motor 3D con proyección, rotación y profundidad
 *   F-1202 Corte funcional de la posta médica (NTS N° 110-MINSA)
 *   F-1203 Estado por color + icono + texto en tiempo real
 *   F-1204 Interacción con arrastre y rueda (orbital + zoom)
 *   F-1205 Picking por rayo (Raycaster selección precisa de ambiente y equipo)
 *   F-1206 Tour guiado de cámara para la demo de 15 minutos (4 paradas)
 *   F-1208 Equivalencia 2D / Plano Blueprint siempre disponible
 *   F-1209 Degradación automática si FPS < 30
 *   F-1105 prefers-reduced-motion → escena estática
 */

(function () {
  'use strict';

  /* =========================================================================
     DATOS OFICIALES DE AMBIENTES Y EQUIPOS DE LA SEDE PILOTO (POSTA MOCHE)
     ========================================================================= */
  const AMBIENTES = [
    {
      id: 'farmacia',
      nombre: 'Farmacia y Cadena de Frío',
      icono: '💊',
      estado: 'disponible',
      color: 0x34d399,       // --ok
      posicion: [-2.2, 0, 0.4],
      dimensiones: { w: 2.2, h: 1.3, d: 1.8 },
      cotas: '3.80 m × 3.20 m (Área: 12.16 m²)',
      descripcion: 'Dispensación DCI · Refrigeradora para vacunas (Cadena de frío +2°C a +8°C)',
      confirmado: 'hace 12 min · Q.F. Responsable POSTA',
      normaMinsa: 'NTS N° 110-MINSA/DGIEM Art. 6.4 (Almacenamiento de Productos Farmacéuticos)'
    },
    {
      id: 'consultorio',
      nombre: 'Consultorio Médico',
      icono: '🩺',
      estado: 'operativo',
      color: 0x22d3ee,       // --acento
      posicion: [0, 0, 0.4],
      dimensiones: { w: 2.0, h: 1.3, d: 1.8 },
      cotas: '4.00 m × 3.50 m (Área: 14.00 m²)',
      descripcion: 'Atención médica integral · Camilla de examen clínico y tensiómetro calibrado',
      confirmado: 'hace 1 h · Médico General POSTA',
      normaMinsa: 'NTS N° 110-MINSA/DGIEM Art. 6.2 (Unidad de Consulta Externa)'
    },
    {
      id: 'equipos',
      nombre: 'Sala de Equipos Biomédicos',
      icono: '⚙️',
      estado: 'parcial',
      color: 0xfbbf24,       // --aviso
      posicion: [2.2, 0, 0.4],
      dimensiones: { w: 2.2, h: 1.3, d: 1.8 },
      cotas: '4.50 m × 4.00 m (Área: 18.00 m²)',
      descripcion: 'Ventilador volumétrico (operativo) · Ecógrafo Doppler (inoperativo por transductor)',
      confirmado: 'hace 3 h · Ing. Biomédico Red Trujillo',
      normaMinsa: 'Directiva Sanitaria N° 065-MINSA/DGIEM (Gestión del Mantenimiento Hospitalario)'
    },
    {
      id: 'telesalud',
      nombre: 'Punto de Telesalud (RNT)',
      icono: '📡',
      estado: 'operativo',
      color: 0x34d399,
      posicion: [-2.2, 0, -2.0],
      dimensiones: { w: 2.2, h: 1.3, d: 1.8 },
      cotas: '3.20 m × 2.80 m (Área: 8.96 m²)',
      descripcion: 'Conectado a la Red Nacional de Telesalud · Teleatiendo y Línea 113',
      confirmado: 'hace 20 min · Coordinador DIGTEL',
      normaMinsa: 'Ley N° 30421 (Ley Marco de Telesalud) y D.S. 005-2021-SA'
    },
    {
      id: 'espera',
      nombre: 'Sala de Espera y Admisión',
      icono: '🪑',
      estado: 'operativo',
      color: 0x94a3b8,       // --neutro
      posicion: [0, 0, -2.0],
      dimensiones: { w: 2.0, h: 1.3, d: 1.8 },
      cotas: '4.20 m × 3.60 m (Capacidad: 16 personas)',
      descripcion: 'Zona de espera con ventilación cruzada natural · Rampa de acceso universal',
      confirmado: 'Declarado por la sede',
      normaMinsa: 'NTS N° 110-MINSA/DGIEM Art. 5.1 (Accesibilidad para Personas con Discapacidad)'
    },
    {
      id: 'ingreso',
      nombre: 'Ingreso Principal y Triaje',
      icono: '🚪',
      estado: 'operativo',
      color: 0x34d399,
      posicion: [2.2, 0, -2.0],
      dimensiones: { w: 2.2, h: 1.3, d: 1.8 },
      cotas: '3.50 m × 3.00 m (Área: 10.50 m²)',
      descripcion: 'Evaluación rápida de signos vitales · Filtro para casos de infecciones agudas',
      confirmado: 'hace 40 min · Lic. Enfermería POSTA',
      normaMinsa: 'Norma Técnica de Salud para Triaje en Emergencias y Consulta'
    }
  ];

  const ESTADO_ETIQUETA = {
    disponible:    { texto: 'Disponible',      clase: 'ok'   },
    operativo:     { texto: 'Operativo',       clase: 'ok'   },
    parcial:       { texto: 'Con restricciones', clase: 'avis' },
    no_disponible: { texto: 'No disponible',   clase: 'err'  },
    fuera:         { texto: 'Fuera de servicio', clase: 'crit' },
    sin_confirmar: { texto: 'Sin confirmar',   clase: 'neut' },
    vencido:       { texto: 'Dato vencido',    clase: 'venc' }
  };

  /* Paradas del Tour Guiado de 15 Minutos (F-1206) */
  const PARADAS_TOUR = [
    {
      ambienteId: 'ingreso',
      titulo: 'Parada 1: Ingreso y Triaje',
      posicionCamara: { x: 2.5, y: 3.2, z: 1.5 },
      target: { x: 2.2, y: 0.6, z: -2.0 },
      explicacion: 'Admisión sin barreras y triaje rápido. Registro con identificadores no sensibles (alias + código privado G3-XXXXXX) cumpliendo la consigna.'
    },
    {
      ambienteId: 'farmacia',
      titulo: 'Parada 2: Farmacia y Medicamentos Esenciales',
      posicionCamara: { x: -2.5, y: 3.2, z: 4.2 },
      target: { x: -2.2, y: 0.6, z: 0.4 },
      explicacion: 'Dispensación DCI (Ley 29459 y 32033). Almacenamiento con cadena de frío (+2°C a +8°C) y reporte mensual validado con SISMED.'
    },
    {
      ambienteId: 'equipos',
      titulo: 'Parada 3: Sala de Equipos Biomédicos (IETSI)',
      posicionCamara: { x: 2.6, y: 3.2, z: 4.2 },
      target: { x: 2.2, y: 0.6, z: 0.4 },
      explicacion: 'Monitoreo de equipos críticos. Trazabilidad de fallas acreditadas por Contraloría y vinculación a solicitudes ciudadanas.'
    },
    {
      ambienteId: 'telesalud',
      titulo: 'Parada 4: Punto de Telesalud (RNT)',
      posicionCamara: { x: -2.5, y: 3.2, z: 1.5 },
      target: { x: -2.2, y: 0.6, z: -2.0 },
      explicacion: 'Enlace directo con Teleatiendo y Línea 113. Conexión a la Red Nacional de Telesalud con gratuidad garantizada por el Estado.'
    }
  ];

  /* =========================================================================
     CATÁLOGO DE MEDICAMENTOS PARA EL NAVEGADOR 3D HOLOGRÁFICO
     ========================================================================= */
  const MEDICAMENTOS_3D = [
    {
      id: 'amox-500',
      nombre: 'Amoxicilina 500 mg',
      dci: 'AMOXICILINA',
      sismed: '00124',
      siga: '580200120001',
      tipo: 'capsula',
      colorA: 0x0284c7, // celeste
      colorB: 0xffffff, // blanco
      concentracion: '500 mg cápsula',
      forma: 'Cápsula dura',
      accion: 'Antibiótico betalactámico de primera línea para infecciones respiratorias',
      precioGenerico: 0.15,
      precioMarca: 1.80,
      ahorro: 91.7,
      stockLaLibertad: '142,500 cápsulas',
      almacen: '28,000 cápsulas',
      estado: 'CONFORME (Normostock)',
      posicion: [-2.8, 1.2, 0]
    },
    {
      id: 'parac-500',
      nombre: 'Paracetamol 500 mg',
      dci: 'PARACETAMOL',
      sismed: '00542',
      siga: '580200400001',
      tipo: 'tableta',
      colorA: 0xffffff,
      concentracion: '500 mg tableta',
      forma: 'Tableta ranurada',
      accion: 'Analgésico y antipirético oficial de primera línea para dengue y síndrome febril',
      precioGenerico: 0.10,
      precioMarca: 2.50,
      ahorro: 96.0,
      stockLaLibertad: '310,000 tabletas',
      almacen: '65,000 tabletas',
      estado: 'CONFORME (Alta Rotación)',
      posicion: [-1.4, 1.2, 0]
    },
    {
      id: 'bencil-1m',
      nombre: 'Bencilpenicilina Sódica 1 000 000 UI',
      dci: 'BENCILPENICILINA SODICA',
      sismed: '01032',
      siga: '580200010001',
      tipo: 'vial',
      colorA: 0x10b981,
      concentracion: '1 000 000 UI inyectable',
      forma: 'Polvo para solución inyectable (Vial)',
      accion: 'Tratamiento de infecciones graves, neumonía bacteriana y sífilis',
      precioGenerico: 1.80,
      precioMarca: 8.50,
      ahorro: 78.8,
      stockLaLibertad: '17,186 viales',
      almacen: '2,782 viales',
      estado: 'CONFORME (Histórico InfoSismed)',
      posicion: [0.0, 1.2, 0]
    },
    {
      id: 'cloruro-1000',
      nombre: 'Cloruro de Sodio 9‰ 1000 ml',
      dci: 'CLORURO DE SODIO',
      sismed: '00891',
      siga: '587000100001',
      tipo: 'frasco_suero',
      colorA: 0x38bdf8,
      concentracion: '0.9 g/100 mL parenteral',
      forma: 'Frasco infusión parenteral',
      accion: 'Expansión de volumen intravascular en shock y dengue con signos de alarma',
      precioGenerico: 3.20,
      precioMarca: 12.00,
      ahorro: 73.3,
      stockLaLibertad: '48,250 frascos',
      almacen: '12,500 frascos',
      estado: 'CONFORME (Insumo Crítico Dengue)',
      posicion: [1.4, 1.2, 0]
    },
    {
      id: 'atorva-20',
      nombre: 'Atorvastatina 20 mg',
      dci: 'ATORVASTATINA',
      sismed: '01890',
      siga: '584000150001',
      tipo: 'comprimido',
      colorA: 0xf8fafc,
      concentracion: '20 mg comprimido',
      forma: 'Comprimido recubierto',
      accion: 'Hipolipemiante para prevención de eventos cardiovasculares e infarto',
      precioGenerico: 0.20,
      precioMarca: 3.72,
      ahorro: 94.6,
      stockLaLibertad: '95,000 comprimidos',
      almacen: '22,000 comprimidos',
      estado: 'CONFORME (Ahorro 94.6%)',
      posicion: [2.8, 1.2, 0]
    }
  ];

  /* =========================================================================
     DIANAS MOLECULARES & GENÓMICAS DE LA HÉLICE DE ADN 3D (F-1201)
     ========================================================================= */
  const DIANAS_ADN = [
    {
      id: 'diana-pbp',
      nombre: 'PBP · Transpeptidasa Bacteriana',
      par: 'A-T (Adenina-Timina #04)',
      farma: 'Bencilpenicilina Sódica 1M UI & Amoxicilina 500mg',
      mecanismo: 'Inhibe el entrecruzamiento de peptidoglicano en la pared bacteriana produciendo lisis osmótica.',
      relevancia: 'Esencial en postas I-1 a I-4 para infecciones respiratorias agudas y sífilis gestacional.',
      colorBase: '#ff3366',
      posicion: [0, 2.1, 0]
    },
    {
      id: 'diana-cox',
      nombre: 'COX-2 · Ciclooxigenasa Central',
      par: 'G-C (Guanina-Citosina #08)',
      farma: 'Paracetamol 500mg (DCI)',
      mecanismo: 'Inhibición de la síntesis de prostaglandinas en el SNC y bloqueo del pirógeno en el centro hipotalámico.',
      relevancia: 'Medicamento oficial de primera línea para dengue y síndrome febril sin signos de alarma.',
      colorBase: '#10b981',
      posicion: [0, 1.4, 0]
    },
    {
      id: 'diana-dengue',
      nombre: 'DENV NS1 · Antígeno Proteico Viral',
      par: 'A-T (Adenina-Timina #14)',
      farma: 'Pruebas Rápidas NS1 & Suero Fisiológico 9‰',
      mecanismo: 'Glicoproteína no estructural de 48 kDa codificada en el ARN viral del Dengue (Serotipos 1 al 4).',
      relevancia: 'Insumo crítico en el kit de emergencia para diagnóstico precoz y expansión de volumen.',
      colorBase: '#facc15',
      posicion: [0, 0.4, 0]
    },
    {
      id: 'diana-arnm',
      nombre: 'Plataforma ARNm · Inmunógenos',
      par: 'G-C (Guanina-Citosina #20)',
      farma: 'Vacunas y Biológicos en Cadena de Frío',
      mecanismo: 'Cadena de ARN envuelta en nanopartículas lipídicas que induce síntesis de antígenos neutralizantes.',
      relevancia: 'Control estricto de temperatura (+2°C a +8°C) en almacenes y refrigeradores de postas.',
      colorBase: '#0284c7',
      posicion: [0, -0.6, 0]
    },
    {
      id: 'diana-stat',
      nombre: 'HMG-CoA Reductasa Hepática',
      par: 'A-T (Adenina-Timina #26)',
      farma: 'Atorvastatina 20mg (Comprimido)',
      mecanismo: 'Inhibición competitiva de la biosíntesis de colesterol aumentando receptores hepáticos de LDL.',
      relevancia: 'Prevención cardiovascular de alta rotación en adultos mayores con ahorro del 94.6% en genérico.',
      colorBase: '#a855f7',
      posicion: [0, -1.6, 0]
    }
  ];

  let Three = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let meshAmbientes = [];
  let meshMedicamentos = [];
  let meshDianasADN = [];
  let paresBasesADN = [];
  let grupoPosta = null;
  let grupoMedicamentos = null;
  let grupoADN = null;
  let particulasHolograma = null;
  let modoActual3D = 'adn'; // Inicia directamente con la espectacular Hélice de ADN
  let adnDesdoblado = false;
  let offsetSeparacionADN = 0;
  let tourActivo = false;
  let indiceParadaTour = 0;
  let animacionRaf = null;

  function montarSeccion() {
    const contenedor = document.getElementById('seccion-3d');
    if (!contenedor) return;

    contenedor.innerHTML = construirHTML();

    // Intentar cargar Three.js
    cargarThreeJS()
      .then((T) => {
        Three = T;
        iniciarEscena();
      })
      .catch(() => {
        activarModoBlueprint();
      });

    // Conectar botones de la cabecera
    conectarBotonesVista();
  }

  function cargarThreeJS() {
    return new Promise((resolve, reject) => {
      if (window.THREE) { resolve(window.THREE); return; }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r158/three.min.js';
      script.crossOrigin = 'anonymous';
      script.onload  = () => resolve(window.THREE);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function construirHTML() {
    const listaAmbientes = AMBIENTES.map((a) => {
      const est = ESTADO_ETIQUETA[a.estado] || { texto: a.estado, clase: 'neut' };
      return `
        <li class="lista3d__item" data-id="${a.id}" tabindex="0" role="button"
            aria-label="${a.nombre}: ${est.texto}">
          <span class="lista3d__ico" aria-hidden="true">${a.icono}</span>
          <span class="lista3d__info">
            <strong>${a.nombre}</strong>
            <span style="font-size:10px; color:#94a3b8;">${a.cotas}</span>
            <span class="estado-etiqueta estado-etiqueta--${est.clase}">${est.texto}</span>
          </span>
        </li>`;
    }).join('');

    return `
      <div class="seccion__cab" data-revelar>
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:var(--e3);">
          <div>
            <p class="seccion__eyebrow">Arquitectura Sanitaria & Visor 3D · F-611 / F-1201 / F-1206</p>
            <h2 class="seccion__titulo">Corte Funcional & Plano Arquitectónico</h2>
            <p class="seccion__texto">
              Diseño espacial de la posta médica conforme a la Norma Técnica de Salud NTS N° 110-MINSA.
              Los ambientes reflejan en tiempo real el estado de medicamentos y equipos biomédicos.
            </p>
          </div>

          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn-toggle-3d activo" id="btn-modo-adn" type="button" style="padding:6px 14px; font-weight:700; background:rgba(0,240,255,0.22); color:#00f0ff; border-color:#00f0ff; box-shadow:0 0 12px rgba(0,240,255,0.35);">
              🧬 Hélice ADN & Dianas 3D
            </button>
            <button class="btn-toggle-3d" id="btn-modo-medicamentos" type="button" style="padding:6px 14px; font-weight:700; background:rgba(16,185,129,0.15); color:#34d399; border-color:#10b981;">
              💊 Fármacos 3D Lab
            </button>
            <button class="btn-toggle-3d" id="btn-modo-3d" type="button" style="padding:6px 14px; font-weight:700;">
              🏥 Posta Médica I-3 3D
            </button>
            <button class="btn-toggle-3d" id="btn-modo-blueprint" type="button" style="padding:6px 14px; font-weight:700;">
              📐 Plano 2D Arquitectónico
            </button>
            <button class="btn-toggle-3d" id="btn-iniciar-tour" type="button" style="padding:6px 14px; font-weight:700; background:rgba(34,211,238,0.15); color:#22d3ee; border-color:#22d3ee;">
              🎬 Tour Demo (15 min)
            </button>
          </div>
        </div>
      </div>

      <div class="visor3d">
        <!-- 1. Panel 3D / Blueprint -->
        <div class="visor3d__canvas-wrap cyber-card" id="canvas-wrap">
          <canvas class="visor3d__canvas" id="canvas-3d"
                  aria-label="Vista 3D interactiva del ecosistema. Usa el ratón para rotar y zoom."
                  tabindex="0"></canvas>

          <!-- Control Holográfico de ADN: Desdoblar Nucleótidos -->
          <div id="controles-adn-3d" style="display:flex; position:absolute; top:var(--e4); left:var(--e4); z-index:35; gap:8px;">
            <button id="btn-toggle-desdoblar-adn" type="button" style="background:linear-gradient(135deg, rgba(0,240,255,0.25), rgba(2,132,199,0.3)); color:#00f0ff; border:1px solid #00f0ff; border-radius:8px; padding:8px 14px; font-size:11px; font-weight:800; cursor:pointer; backdrop-filter:blur(8px); box-shadow:0 0 15px rgba(0,240,255,0.3); display:flex; align-items:center; gap:6px;">
              <span>⚡</span> <span id="txt-btn-desdoblar">Desdoblar Hélice (Separar Nucleótidos)</span>
            </button>
          </div>

          <!-- Holograma HUD 3D de Nucleótido/Diana (Modo ADN) -->
          <div class="holograma-adn-3d" id="holograma-adn-3d" hidden style="display:none; position:absolute; top:var(--e4); right:var(--e4); width:320px; max-width:90%; background:rgba(4,14,32,0.95); border:1px solid #00f0ff; border-radius:14px; padding:16px; backdrop-filter:blur(16px); box-shadow:0 16px 40px rgba(0,0,0,0.8), 0 0 25px rgba(0,240,255,0.3); z-index:35;"></div>

          <!-- Vista Blueprint 2D (oculta por defecto) -->
          <div id="vista-blueprint-2d" style="display:none; padding:var(--e4); width:100%; height:100%; background:#071220;">
            ${generarPlanoBlueprintHTML()}
          </div>

          <!-- Tarjeta del Tour Guiado -->
          <div id="tour-card" style="display:none; position:absolute; bottom:var(--e4); left:var(--e4); right:var(--e4); background:rgba(9,19,34,0.95); border:1px solid #22d3ee; border-radius:12px; padding:var(--e3) var(--e4); backdrop-filter:blur(16px); z-index:30;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong id="tour-titulo" style="color:#22d3ee; font-size:13px; text-transform:uppercase;"></strong>
              <div style="display:flex; gap:6px;">
                <button class="ctrl-btn" id="btn-tour-ant" type="button" title="Anterior">◀</button>
                <button class="ctrl-btn" id="btn-tour-sig" type="button" title="Siguiente">▶</button>
                <button class="ctrl-btn" id="btn-tour-salir" type="button" title="Salir">✕</button>
              </div>
            </div>
            <p id="tour-texto" style="font-size:11px; color:#cbd5e1; margin:0; line-height:1.4;"></p>
          </div>

          <!-- Tooltip flotante de Ambiente -->
          <div class="tooltip3d" id="tooltip3d" hidden aria-live="polite">
            <div class="tooltip3d__cab">
              <span class="tooltip3d__ico" id="tt-ico"></span>
              <strong class="tooltip3d__nombre" id="tt-nombre"></strong>
              <span class="tooltip3d__estado" id="tt-estado"></span>
            </div>
            <p class="tooltip3d__desc" id="tt-desc"></p>
            <small class="tooltip3d__conf" id="tt-conf"></small>
            <small id="tt-norma" style="display:block; margin-top:4px; color:#38bdf8; font-size:9px; border-top:1px solid rgba(255,255,255,0.1); padding-top:4px;"></small>
          </div>

          <!-- Holograma HUD 3D de Medicamento (Activo en modo medicamentos) -->
          <div class="holograma-med-3d" id="holograma-med-3d" hidden style="display:none; position:absolute; top:var(--e4); right:var(--e4); width:320px; max-width:90%; background:rgba(7,18,34,0.95); border:1px solid #38bdf8; border-radius:14px; padding:16px; backdrop-filter:blur(16px); box-shadow:0 16px 40px rgba(0,0,0,0.8), 0 0 20px rgba(56,189,248,0.2); z-index:35;"></div>

          <!-- Spinner de carga -->
          <div class="visor3d__cargando" id="cargando-3d" aria-live="polite">
            <div class="spinner" aria-hidden="true"></div>
            <span>Generando arquitectura espacial 3D…</span>
          </div>

          <!-- Controles de cámara -->
          <div class="visor3d__controles" aria-label="Controles de cámara">
            <button class="ctrl-btn" id="btn-rotar-iz" type="button" aria-label="Rotar izquierda">◀</button>
            <button class="ctrl-btn" id="btn-zoom-mas" type="button" aria-label="Acercar">+</button>
            <button class="ctrl-btn" id="btn-zoom-men" type="button" aria-label="Alejar">−</button>
            <button class="ctrl-btn" id="btn-rotar-de" type="button" aria-label="Rotar derecha">▶</button>
          </div>

          <div class="sello-demo" aria-label="Norma Técnica NTS 110-MINSA">NTS N° 110-MINSA</div>
        </div>

        <!-- 2. Panel lateral: Lista equivalente de Ambientes -->
        <aside class="visor3d__lista" id="lista-3d">
          <div class="visor3d__lista-cab">
            <h3>Distribución de Ambientes</h3>
            <span style="font-size:10px; color:#38bdf8; font-weight:700;">Nivel I-3</span>
          </div>
          <ul class="lista3d" role="list">
            ${listaAmbientes}
          </ul>
          <p class="nota-fuente">
            Posta Moche · Cód. RENIPRESS 02150 · Cumplimiento de ODS 3 y 9
          </p>
        </aside>
      </div>
    `;
  }

  /* =========================================================================
     PLANO ARQUITECTÓNICO 2D (BLUEPRINT VECTORIAL)
     ========================================================================= */
  function generarPlanoBlueprintHTML() {
    return `
      <div style="width:100%; height:100%; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #1e3a5f; padding-bottom:6px;">
          <strong style="color:#38bdf8; font-size:12px; text-transform:uppercase;">Plano en Planta: Establecimiento de Salud I-3</strong>
          <span style="font-size:10px; color:#94a3b8;">Escala 1:100 · Cotas Normalizadas MINSA</span>
        </div>

        <svg viewBox="0 0 700 420" style="width:100%; height:auto; max-height:360px; filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));" xmlns="http://www.w3.org/2000/svg">
          <!-- Fondo Blueprint Cuadriculado -->
          <defs>
            <pattern id="grid-blueprint" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="#09182d" />
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#132c4e" stroke-width="0.8" />
            </pattern>
          </defs>
          <rect width="700" height="420" fill="url(#grid-blueprint)" stroke="#1e4a7a" stroke-width="2" />

          <!-- Muros Perimetrales Exteriores -->
          <rect x="40" y="40" width="620" height="340" fill="none" stroke="#38bdf8" stroke-width="3.5" />

          <!-- Pasillo Central de Circulación Técnica -->
          <line x1="40" y1="200" x2="660" y2="200" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6,4" />
          <text x="350" y="205" font-size="9" fill="#94a3b8" text-anchor="middle" font-family="monospace">CIRCULACIÓN MÉDICA / EVACUACIÓN (ANCHO 2.20 m)</text>

          <!-- AMBIENTE 1: FARMACIA (Superior Izquierda) -->
          <rect class="blueprint-room" data-id="farmacia" x="45" y="45" width="190" height="150" fill="rgba(16,185,129,0.12)" stroke="#10b981" stroke-width="1.8" style="cursor:pointer;" />
          <text x="140" y="70" font-size="11" font-weight="700" fill="#34d399" text-anchor="middle">FARMACIA Y DISPENSACIÓN</text>
          <text x="140" y="85" font-size="9" fill="#94a3b8" text-anchor="middle">3.80 m × 3.20 m (12.16 m²)</text>
          <!-- Equipos internos: Estantes y Refrigeradora -->
          <rect x="55" y="55" width="15" height="120" fill="#065f46" stroke="#34d399" stroke-width="1" />
          <text x="62" y="115" font-size="7" fill="#fff" transform="rotate(-90 62 115)" text-anchor="middle">ESTANTERÍA DCI</text>
          <rect x="180" y="55" width="40" height="30" fill="#0369a1" stroke="#38bdf8" stroke-width="1" />
          <text x="200" y="73" font-size="7" fill="#fff" text-anchor="middle">CADENA FRÍO</text>

          <!-- AMBIENTE 2: CONSULTORIO MÉDICO (Superior Centro) -->
          <rect class="blueprint-room" data-id="consultorio" x="245" y="45" width="200" height="150" fill="rgba(34,211,238,0.12)" stroke="#22d3ee" stroke-width="1.8" style="cursor:pointer;" />
          <text x="345" y="70" font-size="11" font-weight="700" fill="#22d3ee" text-anchor="middle">CONSULTORIO GENERAL</text>
          <text x="345" y="85" font-size="9" fill="#94a3b8" text-anchor="middle">4.00 m × 3.50 m (14.00 m²)</text>
          <!-- Camilla y Escritorio -->
          <rect x="260" y="100" width="35" height="75" rx="3" fill="#0e7490" stroke="#22d3ee" stroke-width="1" />
          <text x="277" y="142" font-size="7" fill="#fff" text-anchor="middle">CAMILLA</text>
          <rect x="360" y="120" width="60" height="30" rx="2" fill="#1e293b" stroke="#64748b" stroke-width="1" />
          <text x="390" y="138" font-size="7" fill="#fff" text-anchor="middle">ESCRITORIO</text>

          <!-- AMBIENTE 3: SALA DE EQUIPOS BIOMÉDICOS (Superior Derecha) -->
          <rect class="blueprint-room" data-id="equipos" x="455" y="45" width="200" height="150" fill="rgba(251,191,36,0.12)" stroke="#fbbf24" stroke-width="1.8" style="cursor:pointer;" />
          <text x="555" y="70" font-size="11" font-weight="700" fill="#fbbf24" text-anchor="middle">SALA EQUIPOS BIOMÉDICOS</text>
          <text x="555" y="85" font-size="9" fill="#94a3b8" text-anchor="middle">4.50 m × 4.00 m (18.00 m²)</text>
          <!-- Equipos representados -->
          <rect x="470" y="105" width="45" height="35" rx="2" fill="#b45309" stroke="#f59e0b" stroke-width="1" />
          <text x="492" y="125" font-size="7" fill="#fff" text-anchor="middle">VENTILADOR</text>
          <circle cx="585" cy="125" r="22" fill="#78350f" stroke="#fbbf24" stroke-width="1" />
          <text x="585" y="128" font-size="7" fill="#fff" text-anchor="middle">ECÓGRAFO</text>

          <!-- AMBIENTE 4: PUNTO TELESALUD (Inferior Izquierda) -->
          <rect class="blueprint-room" data-id="telesalud" x="45" y="215" width="190" height="160" fill="rgba(16,185,129,0.12)" stroke="#10b981" stroke-width="1.8" style="cursor:pointer;" />
          <text x="140" y="240" font-size="11" font-weight="700" fill="#34d399" text-anchor="middle">PUNTO TELESALUD RNT</text>
          <text x="140" y="255" font-size="9" fill="#94a3b8" text-anchor="middle">3.20 m × 2.80 m (8.96 m²)</text>
          <rect x="80" y="280" width="80" height="35" rx="2" fill="#065f46" stroke="#34d399" stroke-width="1" />
          <text x="120" y="300" font-size="8" fill="#fff" text-anchor="middle">TERMINAL TELEATIENDO</text>

          <!-- AMBIENTE 5: SALA DE ESPERA (Inferior Centro) -->
          <rect class="blueprint-room" data-id="espera" x="245" y="215" width="200" height="160" fill="rgba(148,163,184,0.12)" stroke="#94a3b8" stroke-width="1.8" style="cursor:pointer;" />
          <text x="345" y="240" font-size="11" font-weight="700" fill="#cbd5e1" text-anchor="middle">SALA DE ESPERA Y ADMISIÓN</text>
          <text x="345" y="255" font-size="9" fill="#94a3b8" text-anchor="middle">4.20 m × 3.60 m (16 butacas)</text>
          <!-- Filas de asientos -->
          <line x1="265" y1="285" x2="425" y2="285" stroke="#64748b" stroke-width="6" stroke-linecap="round" />
          <line x1="265" y1="320" x2="425" y2="320" stroke="#64748b" stroke-width="6" stroke-linecap="round" />

          <!-- AMBIENTE 6: INGRESO Y TRIAJE (Inferior Derecha) -->
          <rect class="blueprint-room" data-id="ingreso" x="455" y="215" width="200" height="160" fill="rgba(16,185,129,0.12)" stroke="#10b981" stroke-width="1.8" style="cursor:pointer;" />
          <text x="555" y="240" font-size="11" font-weight="700" fill="#34d399" text-anchor="middle">INGRESO Y TRIAJE</text>
          <text x="555" y="255" font-size="9" fill="#94a3b8" text-anchor="middle">3.50 m × 3.00 m (Acceso Universal)</text>
          <!-- Rampa y Módulo de Admisión -->
          <rect x="520" y="280" width="70" height="25" fill="#1e293b" stroke="#38bdf8" stroke-width="1" />
          <text x="555" y="296" font-size="7.5" fill="#38bdf8" text-anchor="middle">MÓDULO TRIAJE</text>
          <!-- Flecha de Entrada Principal -->
          <path d="M 640 375 L 640 340 L 635 345 M 640 340 L 645 345" stroke="#22d3ee" stroke-width="2.5" fill="none" />
          <text x="640" y="390" font-size="8" font-weight="700" fill="#22d3ee" text-anchor="middle">ACCESO</text>
        </svg>
      </div>
    `;
  }

  function conectarBotonesVista() {
    const btn3D = document.getElementById('btn-modo-3d');
    const btnBlueprint = document.getElementById('btn-modo-blueprint');
    const btnMeds = document.getElementById('btn-modo-medicamentos');
    const btnADN = document.getElementById('btn-modo-adn');
    const btnTour = document.getElementById('btn-iniciar-tour');
    const btnDesdoblar = document.getElementById('btn-toggle-desdoblar-adn');
    const canvas = document.getElementById('canvas-3d');
    const vistaBlueprint = document.getElementById('vista-blueprint-2d');
    const controlesCam = document.querySelector('.visor3d__controles');

    if (btnADN) {
      btnADN.addEventListener('click', () => {
        activarModoADN();
      });
    }

    if (btnMeds) {
      btnMeds.addEventListener('click', () => {
        activarModoMedicamentos3D();
      });
    }

    if (btn3D) {
      btn3D.addEventListener('click', () => {
        activarModoPosta3D();
      });
    }

    if (btnBlueprint) {
      btnBlueprint.addEventListener('click', () => {
        activarModoBlueprint();
      });
    }

    if (btnTour) {
      btnTour.addEventListener('click', () => {
        iniciarTourDemo();
      });
    }

    if (btnDesdoblar) {
      btnDesdoblar.addEventListener('click', () => {
        adnDesdoblado = !adnDesdoblado;
        const txt = document.getElementById('txt-btn-desdoblar');
        if (txt) {
          txt.textContent = adnDesdoblado ? '🔄 Reensamblar Hélice de ADN' : '⚡ Desdoblar Hélice (Separar Nucleótidos)';
        }
        btnDesdoblar.style.borderColor = adnDesdoblado ? '#00ff88' : '#00f0ff';
        btnDesdoblar.style.color = adnDesdoblado ? '#00ff88' : '#00f0ff';
      });
    }

    // Clic en habitaciones del blueprint
    document.querySelectorAll('.blueprint-room').forEach(room => {
      room.addEventListener('click', () => {
        const id = room.dataset.id;
        const amb = AMBIENTES.find(a => a.id === id);
        if (amb) mostrarDetalleAmbiente(amb);
      });
    });
  }

  function activarModoADN() {
    modoActual3D = 'adn';
    document.getElementById('btn-modo-adn')?.classList.add('activo');
    document.getElementById('btn-modo-3d')?.classList.remove('activo');
    document.getElementById('btn-modo-blueprint')?.classList.remove('activo');
    document.getElementById('btn-modo-medicamentos')?.classList.remove('activo');

    const canvas = document.getElementById('canvas-3d');
    const vistaBlueprint = document.getElementById('vista-blueprint-2d');
    const controlesCam = document.querySelector('.visor3d__controles');

    if (canvas) canvas.style.display = 'block';
    if (vistaBlueprint) vistaBlueprint.style.display = 'none';
    if (controlesCam) controlesCam.style.display = 'flex';

    if (grupoPosta) grupoPosta.visible = false;
    if (grupoMedicamentos) grupoMedicamentos.visible = false;
    if (grupoADN) grupoADN.visible = true;

    const holoMed = document.getElementById('holograma-med-3d');
    if (holoMed) { holoMed.style.display = 'none'; holoMed.hidden = true; }
    const tt = document.getElementById('tooltip3d');
    if (tt) tt.hidden = true;

    // Mostrar barra de control de división de ADN
    const ctrlADN = document.getElementById('controles-adn-3d');
    if (ctrlADN) ctrlADN.style.display = 'flex';

    // Actualizar lista lateral a dianas de ADN
    actualizarListaLateral('adn');

    // Posicionar cámara para enfocar la hélice de ADN en plano general
    animarCamaraHacia({ x: 0, y: 0.5, z: 6.8 }, { x: 0, y: 0, z: 0 }, 700);

    // Mostrar holograma de la primera diana por defecto
    if (DIANAS_ADN.length > 0) {
      setTimeout(() => mostrarHologramaADN(DIANAS_ADN[0]), 300);
    }
  }

  function activarModoPosta3D() {
    modoActual3D = 'posta';
    document.getElementById('btn-modo-3d')?.classList.add('activo');
    document.getElementById('btn-modo-adn')?.classList.remove('activo');
    document.getElementById('btn-modo-blueprint')?.classList.remove('activo');
    document.getElementById('btn-modo-medicamentos')?.classList.remove('activo');

    const canvas = document.getElementById('canvas-3d');
    const vistaBlueprint = document.getElementById('vista-blueprint-2d');
    const controlesCam = document.querySelector('.visor3d__controles');

    if (canvas) canvas.style.display = 'block';
    if (vistaBlueprint) vistaBlueprint.style.display = 'none';
    if (controlesCam) controlesCam.style.display = 'flex';

    if (grupoPosta) grupoPosta.visible = true;
    if (grupoMedicamentos) grupoMedicamentos.visible = false;
    if (grupoADN) grupoADN.visible = false;

    const holoMed = document.getElementById('holograma-med-3d');
    if (holoMed) { holoMed.style.display = 'none'; holoMed.hidden = true; }
    const holoADN = document.getElementById('holograma-adn-3d');
    if (holoADN) { holoADN.style.display = 'none'; holoADN.hidden = true; }
    const ctrlADN = document.getElementById('controles-adn-3d');
    if (ctrlADN) ctrlADN.style.display = 'none';

    // Actualizar lista lateral a ambientes
    actualizarListaLateral('ambientes');
    restaurarCamaraGeneral();
  }

  function activarModoMedicamentos3D() {
    modoActual3D = 'medicamentos';
    document.getElementById('btn-modo-medicamentos')?.classList.add('activo');
    document.getElementById('btn-modo-adn')?.classList.remove('activo');
    document.getElementById('btn-modo-3d')?.classList.remove('activo');
    document.getElementById('btn-modo-blueprint')?.classList.remove('activo');

    const canvas = document.getElementById('canvas-3d');
    const vistaBlueprint = document.getElementById('vista-blueprint-2d');
    const controlesCam = document.querySelector('.visor3d__controles');

    if (canvas) canvas.style.display = 'block';
    if (vistaBlueprint) vistaBlueprint.style.display = 'none';
    if (controlesCam) controlesCam.style.display = 'flex';

    if (grupoPosta) grupoPosta.visible = false;
    if (grupoMedicamentos) grupoMedicamentos.visible = true;
    if (grupoADN) grupoADN.visible = false;

    const tt = document.getElementById('tooltip3d');
    if (tt) tt.hidden = true;
    const holoADN = document.getElementById('holograma-adn-3d');
    if (holoADN) { holoADN.style.display = 'none'; holoADN.hidden = true; }
    const ctrlADN = document.getElementById('controles-adn-3d');
    if (ctrlADN) ctrlADN.style.display = 'none';

    // Actualizar lista lateral a medicamentos
    actualizarListaLateral('medicamentos');

    // Posicionar cámara para enfocar los medicamentos 3D
    animarCamaraHacia({ x: 0, y: 1.8, z: 4.8 }, { x: 0, y: 1.2, z: 0 }, 700);

    // Mostrar holograma del primer medicamento por defecto
    if (MEDICAMENTOS_3D.length > 0) {
      setTimeout(() => mostrarHologramaMedicamento3D(MEDICAMENTOS_3D[0]), 300);
    }
  }

  function activarModoBlueprint() {
    modoActual3D = 'blueprint';
    const btn3D = document.getElementById('btn-modo-3d');
    const btnBlueprint = document.getElementById('btn-modo-blueprint');
    const btnMeds = document.getElementById('btn-modo-medicamentos');
    const btnADN = document.getElementById('btn-modo-adn');
    const canvas = document.getElementById('canvas-3d');
    const vistaBlueprint = document.getElementById('vista-blueprint-2d');
    const controlesCam = document.querySelector('.visor3d__controles');

    btnBlueprint?.classList.add('activo');
    btn3D?.classList.remove('activo');
    btnMeds?.classList.remove('activo');
    btnADN?.classList.remove('activo');

    const holoMed = document.getElementById('holograma-med-3d');
    if (holoMed) { holoMed.style.display = 'none'; holoMed.hidden = true; }
    const holoADN = document.getElementById('holograma-adn-3d');
    if (holoADN) { holoADN.style.display = 'none'; holoADN.hidden = true; }
    const ctrlADN = document.getElementById('controles-adn-3d');
    if (ctrlADN) ctrlADN.style.display = 'none';
    const tt = document.getElementById('tooltip3d');
    if (tt) tt.hidden = true;

    if (canvas) canvas.style.display = 'none';
    if (vistaBlueprint) vistaBlueprint.style.display = 'block';
    if (controlesCam) controlesCam.style.display = 'none';
  }

  function actualizarListaLateral(tipo) {
    const listaWrap = document.getElementById('lista-3d');
    if (!listaWrap) return;

    if (tipo === 'adn') {
      listaWrap.querySelector('h3').textContent = 'Dianas Genómicas & ADN';
      listaWrap.querySelector('.visor3d__lista-cab span').textContent = '5 Dianas 3D';

      const items = DIANAS_ADN.map(d => `
        <li class="lista3d__item item-diana-adn" data-id="${d.id}" tabindex="0" role="button" style="cursor:pointer;">
          <span class="lista3d__ico">🧬</span>
          <span class="lista3d__info">
            <strong style="color:#00f0ff;">${d.nombre}</strong>
            <span style="font-size:10px; color:#94a3b8;">${d.par}</span>
            <span class="estado-etiqueta estado-etiqueta--ok" style="font-size:9px;">${d.farma.split('&')[0]}</span>
          </span>
        </li>
      `).join('');

      listaWrap.querySelector('.lista3d').innerHTML = items;

      listaWrap.querySelectorAll('.item-diana-adn').forEach(li => {
        li.addEventListener('click', () => {
          const diana = DIANAS_ADN.find(x => x.id === li.dataset.id);
          if (diana) {
            animarCamaraHacia({ x: 0, y: diana.posicion[1] + 1.0, z: 3.5 }, { x: 0, y: diana.posicion[1], z: 0 }, 500);
            mostrarHologramaADN(diana);
          }
        });
      });

    } else if (tipo === 'medicamentos') {
      listaWrap.querySelector('h3').textContent = 'Navegador de Fármacos';
      listaWrap.querySelector('.visor3d__lista-cab span').textContent = '5 Medicamentos 3D';

      const items = MEDICAMENTOS_3D.map(m => `
        <li class="lista3d__item item-med-3d" data-id="${m.id}" tabindex="0" role="button" style="cursor:pointer;">
          <span class="lista3d__ico">💊</span>
          <span class="lista3d__info">
            <strong>${m.nombre}</strong>
            <span style="font-size:10px; color:#38bdf8;">SIGA: ${m.siga} · Ahorro: -${m.ahorro}%</span>
            <span class="estado-etiqueta estado-etiqueta--ok">${m.estado}</span>
          </span>
        </li>
      `).join('');

      listaWrap.querySelector('.lista3d').innerHTML = items;

      listaWrap.querySelectorAll('.item-med-3d').forEach(li => {
        li.addEventListener('click', () => {
          const med = MEDICAMENTOS_3D.find(x => x.id === li.dataset.id);
          if (med) {
            animarCamaraHacia({ x: med.posicion[0], y: med.posicion[1] + 0.3, z: med.posicion[2] + 2.2 }, { x: med.posicion[0], y: med.posicion[1], z: med.posicion[2] }, 500);
            mostrarHologramaMedicamento3D(med);
          }
        });
      });

    } else {
      listaWrap.querySelector('h3').textContent = 'Distribución de Ambientes';
      listaWrap.querySelector('.visor3d__lista-cab span').textContent = 'Nivel I-3';

      const items = AMBIENTES.map(a => {
        const est = ESTADO_ETIQUETA[a.estado] || { texto: a.estado, clase: 'neut' };
        return `
          <li class="lista3d__item" data-id="${a.id}" tabindex="0" role="button">
            <span class="lista3d__ico">${a.icono}</span>
            <span class="lista3d__info">
              <strong>${a.nombre}</strong>
              <span style="font-size:10px; color:#94a3b8;">${a.cotas}</span>
              <span class="estado-etiqueta estado-etiqueta--${est.clase}">${est.texto}</span>
            </span>
          </li>
        `;
      }).join('');

      listaWrap.querySelector('.lista3d').innerHTML = items;
    }
  }

  /* =========================================================================
     TOUR GUIADO DE 15 MINUTOS (F-1206)
     ========================================================================= */
  function iniciarTourDemo() {
    // Asegurar vista 3D activa
    document.getElementById('btn-modo-3d')?.click();

    tourActivo = true;
    indiceParadaTour = 0;
    mostrarParadaTour(indiceParadaTour);

    const tourCard = document.getElementById('tour-card');
    if (tourCard) tourCard.style.display = 'block';

    document.getElementById('btn-tour-sig')?.addEventListener('click', () => {
      indiceParadaTour = (indiceParadaTour + 1) % PARADAS_TOUR.length;
      mostrarParadaTour(indiceParadaTour);
    });

    document.getElementById('btn-tour-ant')?.addEventListener('click', () => {
      indiceParadaTour = (indiceParadaTour - 1 + PARADAS_TOUR.length) % PARADAS_TOUR.length;
      mostrarParadaTour(indiceParadaTour);
    });

    document.getElementById('btn-tour-salir')?.addEventListener('click', () => {
      tourActivo = false;
      if (tourCard) tourCard.style.display = 'none';
      restaurarCamaraGeneral();
    });
  }

  function mostrarParadaTour(idx) {
    const parada = PARADAS_TOUR[idx];
    if (!parada || !camera) return;

    document.getElementById('tour-titulo').textContent = parada.titulo;
    document.getElementById('tour-texto').textContent = parada.explicacion;

    // Resaltar ambiente en la lista
    document.querySelectorAll('.lista3d__item').forEach((li) => {
      li.classList.toggle('lista3d__item--activo', li.dataset.id === parada.ambienteId);
    });

    // Mover cámara suavemente al objetivo
    animarCamaraHacia(parada.posicionCamara, parada.target, 800);
  }

  function animarCamaraHacia(posDest, targetDest, duracionMs) {
    if (!camera) return;
    const posIni = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    const inicio = performance.now();

    function step(ahora) {
      const p = Math.min(1, (ahora - inicio) / duracionMs);
      const ease = 1 - Math.pow(1 - p, 3); // Ease out cubic

      camera.position.x = posIni.x + (posDest.x - posIni.x) * ease;
      camera.position.y = posIni.y + (posDest.y - posIni.y) * ease;
      camera.position.z = posIni.z + (posDest.z - posIni.z) * ease;
      camera.lookAt(targetDest.x, targetDest.y, targetDest.z);

      if (p < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function restaurarCamaraGeneral() {
    animarCamaraHacia({ x: 0, y: 5.5, z: 7 }, { x: 0, y: 0, z: 0 }, 600);
  }

  /* =========================================================================
     MOTOR THREE.JS CON MODELOS PROCEDURALES DE EQUIPOS
     ========================================================================= */
  function iniciarEscena() {
    const T = Three;
    const canvas = document.getElementById('canvas-3d');
    const wrap = document.getElementById('canvas-wrap');
    if (!canvas || !wrap) return;

    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene = new T.Scene();
    camera = new T.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.set(0, 5.5, 7);
    camera.lookAt(0, 0, 0);

    // Luces
    scene.add(new T.AmbientLight(0xffffff, 0.7));
    const dirLight = new T.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(6, 10, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new T.DirectionalLight(0x38bdf8, 0.45);
    fillLight.position.set(-6, 3, -4);
    scene.add(fillLight);

    // Suelo con Grid Médico
    const sueloGeo = new T.PlaneGeometry(12, 9);
    const sueloMat = new T.MeshStandardMaterial({ color: 0x07111e, roughness: 0.8, metalness: 0.2 });
    const suelo = new T.Mesh(sueloGeo, sueloMat);
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.y = -0.01;
    suelo.receiveShadow = true;
    scene.add(suelo);

    const grid = new T.GridHelper(12, 24, 0x1e3a5f, 0x132742);
    grid.position.y = 0.005;
    scene.add(grid);

    // Crear Ambientes con Modelos Internos
    meshAmbientes = [];
    grupoPosta = new T.Group();
    scene.add(grupoPosta);

    AMBIENTES.forEach((amb) => {
      const grupo = new T.Group();
      grupo.position.set(amb.posicion[0], amb.posicion[1], amb.posicion[2]);
      grupo.userData = amb;

      // Caja del Ambiente
      const geo = new T.BoxGeometry(amb.dimensiones.w, amb.dimensiones.h, amb.dimensiones.d);
      const mat = new T.MeshStandardMaterial({
        color: new T.Color(amb.color),
        roughness: 0.4,
        metalness: 0.3,
        emissive: new T.Color(amb.color),
        emissiveIntensity: 0.12,
        transparent: true,
        opacity: 0.85
      });
      const mesh = new T.Mesh(geo, mat);
      mesh.position.y = amb.dimensiones.h / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = amb;
      grupo.add(mesh);
      meshAmbientes.push(mesh);

      // Bordes Luminosos (Wireframe)
      const bordes = new T.EdgesGeometry(geo);
      const bordeMat = new T.LineBasicMaterial({ color: new T.Color(amb.color), transparent: true, opacity: 0.6 });
      const lineMesh = new T.LineSegments(bordes, bordeMat);
      lineMesh.position.y = amb.dimensiones.h / 2;
      grupo.add(lineMesh);

      // Modelos Procedurales Internos según ambiente
      agregarEquiposInternos(grupo, amb, T);

      grupoPosta.add(grupo);
    });

    // 2. Crear Grupo de Medicamentos 3D
    grupoMedicamentos = crearGrupoMedicamentos3D(T);
    grupoMedicamentos.visible = false;
    scene.add(grupoMedicamentos);

    // 3. Crear Grupo de ADN 3D Holográfico con Dianas Moleculares
    grupoADN = crearGrupoADN(T);
    grupoADN.visible = (modoActual3D === 'adn');
    scene.add(grupoADN);

    if (modoActual3D === 'adn') {
      camera.position.set(0, 0.5, 6.8);
      camera.lookAt(0, 0, 0);
    }

    // Control Orbital Manual
    configurarControlesOrbitales(canvas);

    // Bucle de Renderizado
    function animate() {
      animacionRaf = requestAnimationFrame(animate);

      // Desdoblamiento suave de la Hélice de ADN
      const targetOffset = adnDesdoblado ? 1.4 : 0.0;
      offsetSeparacionADN += (targetOffset - offsetSeparacionADN) * 0.08;

      if (modoActual3D === 'adn' && grupoADN && grupoADN.visible) {
        grupoADN.rotation.y += 0.009; // Giro continuo cinematográfico
        if (particulasHolograma) {
          particulasHolograma.rotation.y -= 0.003;
        }
        if (paresBasesADN.length > 0) {
          paresBasesADN.forEach((par) => {
            if (par.meshIzq) {
              par.meshIzq.position.x = par.posOrigIzqX - offsetSeparacionADN;
            }
            if (par.meshDer) {
              par.meshDer.position.x = par.posOrigDerX + offsetSeparacionADN;
            }
            if (par.puenteH) {
              const escalaH = Math.max(0.01, 1 - (offsetSeparacionADN / 1.3));
              par.puenteH.scale.set(escalaH, escalaH, escalaH);
            }
          });
        }
      }

      if (modoActual3D === 'medicamentos' && grupoMedicamentos && grupoMedicamentos.visible) {
        meshMedicamentos.forEach((mesh, idx) => {
          mesh.rotation.y += 0.014;
          mesh.rotation.x = Math.sin(Date.now() * 0.002 + idx) * 0.15;
        });
      }
      renderer.render(scene, camera);
    }
    animate();

    const cargando = document.getElementById('cargando-3d');
    if (cargando) cargando.style.display = 'none';

    // Redimensionamiento
    window.addEventListener('resize', () => {
      if (!wrap || !camera || !renderer) return;
      const w = wrap.clientWidth;
      const h = Math.max(340, Math.min(520, wrap.clientHeight || 400));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  function agregarEquiposInternos(grupo, amb, T) {
    if (amb.id === 'equipos') {
      // Ventilador Volumétrico (Torre + Pantalla)
      const ventGeo = new T.BoxGeometry(0.35, 0.75, 0.35);
      const ventMat = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 });
      const ventMesh = new T.Mesh(ventGeo, ventMat);
      ventMesh.position.set(-0.4, 0.38, 0);
      grupo.add(ventMesh);

      // Ecógrafo (Carro + Monitor azul)
      const ecoGeo = new T.CylinderGeometry(0.2, 0.25, 0.65, 8);
      const ecoMat = new T.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6 });
      const ecoMesh = new T.Mesh(ecoGeo, ecoMat);
      ecoMesh.position.set(0.4, 0.33, 0);
      grupo.add(ecoMesh);

    } else if (amb.id === 'farmacia') {
      // Estante metálico
      const estGeo = new T.BoxGeometry(0.2, 0.8, 1.2);
      const estMat = new T.MeshStandardMaterial({ color: 0x34d399, metalness: 0.4 });
      const estMesh = new T.Mesh(estGeo, estMat);
      estMesh.position.set(-0.6, 0.4, 0);
      grupo.add(estMesh);

      // Refrigeradora Cadena Frío
      const refGeo = new T.BoxGeometry(0.45, 0.75, 0.45);
      const refMat = new T.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7 });
      const refMesh = new T.Mesh(refGeo, refMat);
      refMesh.position.set(0.5, 0.38, 0);
      grupo.add(refMesh);

    } else if (amb.id === 'consultorio') {
      // Camilla
      const camGeo = new T.BoxGeometry(0.55, 0.35, 1.1);
      const camMat = new T.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.2 });
      const camMesh = new T.Mesh(camGeo, camMat);
      camMesh.position.set(-0.35, 0.18, 0);
      grupo.add(camMesh);

    } else if (amb.id === 'telesalud') {
      // Terminal y Pantalla
      const termGeo = new T.BoxGeometry(0.7, 0.5, 0.3);
      const termMat = new T.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const termMesh = new T.Mesh(termGeo, termMat);
      termMesh.position.set(0, 0.25, 0);
      grupo.add(termMesh);
    }
  }

  /* =========================================================================
     GENERACIÓN DE MODELOS 3D PROCEDURALES DE MEDICAMENTOS (F-1201 - F-1209)
     ========================================================================= */
  function crearGrupoMedicamentos3D(T) {
    const root = new T.Group();
    meshMedicamentos = [];

    // Plataforma reflectiva de exposición biomédica
    const planoBaseGeo = new T.PlaneGeometry(12, 5);
    const planoBaseMat = new T.MeshStandardMaterial({
      color: 0x050e1d,
      roughness: 0.25,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75
    });
    const planoBase = new T.Mesh(planoBaseGeo, planoBaseMat);
    planoBase.rotation.x = -Math.PI / 2;
    planoBase.position.set(0, -0.65, 0);
    root.add(planoBase);

    // Retícula holográfica
    const grid = new T.GridHelper(12, 24, 0x38bdf8, 0x1e293b);
    grid.position.y = -0.64;
    root.add(grid);

    MEDICAMENTOS_3D.forEach((med, idx) => {
      const gMed = new T.Group();
      gMed.position.set(med.posicion[0], med.posicion[1], med.posicion[2]);

      // 1. Pedestal cilíndrico luminoso
      const pedGeo = new T.CylinderGeometry(0.52, 0.58, 0.08, 32);
      const pedMat = new T.MeshStandardMaterial({
        color: 0x0b192e,
        metalness: 0.85,
        roughness: 0.25,
        emissive: 0x0284c7,
        emissiveIntensity: 0.18
      });
      const pedMesh = new T.Mesh(pedGeo, pedMat);
      pedMesh.position.y = -0.6;
      pedMesh.receiveShadow = true;
      gMed.add(pedMesh);

      // Anillo emisor de luz en el pedestal
      const anilloGeo = new T.TorusGeometry(0.55, 0.016, 16, 48);
      const anilloMat = new T.MeshBasicMaterial({ color: 0x38bdf8 });
      const anilloMesh = new T.Mesh(anilloGeo, anilloMat);
      anilloMesh.rotation.x = Math.PI / 2;
      anilloMesh.position.y = -0.56;
      gMed.add(anilloMesh);

      // 2. Modelo 3D procedural del medicamento
      let medMeshPrincipal = null;

      if (med.tipo === 'capsula') {
        // Cápsula bicolor (Amoxicilina 500mg)
        const gCapsula = new T.Group();
        const radio = 0.25;
        const altoCil = 0.35;

        // Mitad A (celeste)
        const cilAGeo = new T.CylinderGeometry(radio, radio, altoCil, 32);
        const matA = new T.MeshStandardMaterial({
          color: med.colorA,
          roughness: 0.2,
          metalness: 0.3,
          clearcoat: 0.8
        });
        const cilA = new T.Mesh(cilAGeo, matA);
        cilA.position.y = altoCil / 2;
        gCapsula.add(cilA);

        const domoAGeo = new T.SphereGeometry(radio, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const domoA = new T.Mesh(domoAGeo, matA);
        domoA.position.y = altoCil;
        gCapsula.add(domoA);

        // Mitad B (blanco)
        const cilBGeo = new T.CylinderGeometry(radio * 0.99, radio * 0.99, altoCil, 32);
        const matB = new T.MeshStandardMaterial({
          color: med.colorB || 0xffffff,
          roughness: 0.25,
          metalness: 0.15,
          clearcoat: 0.8
        });
        const cilB = new T.Mesh(cilBGeo, matB);
        cilB.position.y = -altoCil / 2;
        gCapsula.add(cilB);

        const domoBGeo = new T.SphereGeometry(radio * 0.99, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const domoB = new T.Mesh(domoBGeo, matB);
        domoB.position.y = -altoCil;
        gCapsula.add(domoB);

        gCapsula.rotation.z = 0.45;
        gCapsula.rotation.x = 0.2;
        medMeshPrincipal = gCapsula;

      } else if (med.tipo === 'tableta') {
        // Tableta ranurada (Paracetamol 500mg)
        const gTab = new T.Group();
        const tabGeo = new T.CylinderGeometry(0.42, 0.42, 0.18, 36);
        const tabMat = new T.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.35,
          metalness: 0.05
        });
        const tabMesh = new T.Mesh(tabGeo, tabMat);
        gTab.add(tabMesh);

        // Ranura divisoria
        const ranuraGeo = new T.BoxGeometry(0.84, 0.04, 0.04);
        const ranuraMat = new T.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
        const ranura = new T.Mesh(ranuraGeo, ranuraMat);
        ranura.position.y = 0.085;
        gTab.add(ranura);

        gTab.rotation.x = 0.85;
        gTab.rotation.y = 0.3;
        medMeshPrincipal = gTab;

      } else if (med.tipo === 'vial') {
        // Vial inyectable (Bencilpenicilina Sódica 1M UI)
        const gVial = new T.Group();

        // Cuerpo de vidrio farmacéutico
        const cuerpoGeo = new T.CylinderGeometry(0.28, 0.28, 0.65, 32);
        const vidrioMat = new T.MeshPhysicalMaterial({
          color: 0xe0f2fe,
          transparent: true,
          opacity: 0.55,
          roughness: 0.1,
          metalness: 0.1,
          transmission: 0.85,
          ior: 1.5
        });
        const cuerpo = new T.Mesh(cuerpoGeo, vidrioMat);
        gVial.add(cuerpo);

        // Polvo interno liofilizado
        const polvoGeo = new T.CylinderGeometry(0.26, 0.26, 0.25, 32);
        const polvoMat = new T.MeshStandardMaterial({ color: 0xf0fdf4, roughness: 0.9 });
        const polvo = new T.Mesh(polvoGeo, polvoMat);
        polvo.position.y = -0.18;
        gVial.add(polvo);

        // Cuello
        const cuelloGeo = new T.CylinderGeometry(0.14, 0.14, 0.15, 24);
        const cuello = new T.Mesh(cuelloGeo, vidrioMat);
        cuello.position.y = 0.38;
        gVial.add(cuello);

        // Precinto de aluminio verde esmeralda
        const precintoGeo = new T.CylinderGeometry(0.17, 0.17, 0.08, 24);
        const precintoMat = new T.MeshStandardMaterial({ color: 0x059669, metalness: 0.8, roughness: 0.3 });
        const precinto = new T.Mesh(precintoGeo, precintoMat);
        precinto.position.y = 0.46;
        gVial.add(precinto);

        // Tapón de goma
        const taponGeo = new T.CylinderGeometry(0.12, 0.12, 0.04, 20);
        const taponMat = new T.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
        const tapon = new T.Mesh(taponGeo, taponMat);
        tapon.position.y = 0.5;
        gVial.add(tapon);

        medMeshPrincipal = gVial;

      } else if (med.tipo === 'frasco_suero') {
        // Frasco parenteral de infusión (Cloruro de Sodio 9‰ 1000ml)
        const gFrasco = new T.Group();

        const cuerpoFrascoGeo = new T.CylinderGeometry(0.32, 0.32, 0.85, 32);
        const frascoMat = new T.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.5,
          roughness: 0.2,
          transmission: 0.7
        });
        const cuerpoF = new T.Mesh(cuerpoFrascoGeo, frascoMat);
        gFrasco.add(cuerpoF);

        // Hombros cónicos
        const hombrosGeo = new T.ConeGeometry(0.32, 0.2, 32);
        const hombros = new T.Mesh(hombrosGeo, frascoMat);
        hombros.position.y = 0.52;
        gFrasco.add(hombros);

        // Puerto de infusión / cuello
        const puertoGeo = new T.CylinderGeometry(0.12, 0.12, 0.15, 24);
        const puertoMat = new T.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5 });
        const puerto = new T.Mesh(puertoGeo, puertoMat);
        puerto.position.y = 0.66;
        gFrasco.add(puerto);

        // Anillos de graduación volumétrica
        const marcasGeo = new T.TorusGeometry(0.325, 0.008, 8, 32);
        const marcasMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        for (let m = -0.3; m <= 0.3; m += 0.15) {
          const mMesh = new T.Mesh(marcasGeo, marcasMat);
          mMesh.rotation.x = Math.PI / 2;
          mMesh.position.y = m;
          gFrasco.add(mMesh);
        }

        medMeshPrincipal = gFrasco;

      } else {
        // Comprimido recubierto (Atorvastatina 20mg)
        const gComp = new T.Group();
        const compGeo = new T.SphereGeometry(0.36, 32, 24);
        const compMat = new T.MeshStandardMaterial({
          color: 0xf43f5e,
          roughness: 0.25,
          metalness: 0.2,
          clearcoat: 0.7
        });
        const compMesh = new T.Mesh(compGeo, compMat);
        compMesh.scale.set(1, 0.45, 1);
        gComp.add(compMesh);

        gComp.rotation.x = 0.7;
        gComp.rotation.y = 0.4;
        medMeshPrincipal = gComp;
      }

      medMeshPrincipal.userData = med;
      medMeshPrincipal.traverse(child => {
        child.userData = med;
        child.castShadow = true;
      });

      gMed.add(medMeshPrincipal);
      root.add(gMed);
      meshMedicamentos.push(medMeshPrincipal);
    });

    return root;
  }

  /* =========================================================================
     GENERACIÓN DE LA HÉLICE DE ADN 3D & DIANAS MOLECULARES (F-1201)
     ========================================================================= */
  function crearGrupoADN(T) {
    const root = new T.Group();
    meshDianasADN = [];
    paresBasesADN = [];

    // 1. Plataforma Base Holográfica Reactor Stark
    const baseReactorGeo = new T.CylinderGeometry(2.2, 2.5, 0.2, 48);
    const baseReactorMat = new T.MeshStandardMaterial({
      color: 0x051329,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.15
    });
    const baseReactor = new T.Mesh(baseReactorGeo, baseReactorMat);
    baseReactor.position.y = -2.9;
    root.add(baseReactor);

    // Anillo exterior de energía cyan
    const anilloStark1 = new T.Mesh(
      new T.TorusGeometry(2.35, 0.03, 16, 64),
      new T.MeshBasicMaterial({ color: 0x00f0ff })
    );
    anilloStark1.rotation.x = Math.PI / 2;
    anilloStark1.position.y = -2.78;
    root.add(anilloStark1);

    // Anillo interior de energía azul cobalto
    const anilloStark2 = new T.Mesh(
      new T.TorusGeometry(1.6, 0.02, 16, 48),
      new T.MeshBasicMaterial({ color: 0x3b82f6 })
    );
    anilloStark2.rotation.x = Math.PI / 2;
    anilloStark2.position.y = -2.78;
    root.add(anilloStark2);

    // Eje central de referencia cuántica (Haz vertical tenue)
    const rayoLaserCentral = new T.Mesh(
      new T.CylinderGeometry(0.015, 0.015, 6.2, 16),
      new T.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.35 })
    );
    rayoLaserCentral.position.y = 0;
    root.add(rayoLaserCentral);

    // 2. Partículas Cuánticas Holográficas Flotantes
    const particulasGeo = new T.BufferGeometry();
    const cantParticulas = 160;
    const posParticulas = new Float32Array(cantParticulas * 3);
    for (let p = 0; p < cantParticulas * 3; p += 3) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 0.8 + Math.random() * 1.8;
      posParticulas[p] = Math.cos(ang) * rad;
      posParticulas[p + 1] = -2.8 + Math.random() * 5.6;
      posParticulas[p + 2] = Math.sin(ang) * rad;
    }
    particulasGeo.setAttribute('position', new T.BufferAttribute(posParticulas, 3));
    const particulasMat = new T.PointsMaterial({
      color: 0x00f0ff,
      size: 0.045,
      transparent: true,
      opacity: 0.65
    });
    particulasHolograma = new T.Points(particulasGeo, particulasMat);
    root.add(particulasHolograma);

    // 3. Estructura de Doble Hélice (32 Pares de Bases Nitrogenadas)
    const NUM_PASOS = 32;
    const RADIO_HELICE = 1.25;
    const ALTURA_PASO = 0.17;
    const Y_INICIO = -2.6;

    // Materiales de Nucleótidos y Esqueleto Fosfato
    const matFosfato1 = new T.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.2, metalness: 0.5, emissive: 0x0088aa, emissiveIntensity: 0.3 });
    const matFosfato2 = new T.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.2, metalness: 0.5, emissive: 0x7722aa, emissiveIntensity: 0.3 });

    // Bases nitrogenadas:
    // A (Adenina) -> Neón Rubí 0xf43f5e
    // T (Timina) -> Neón Cian 0x06b6d4
    // G (Guanina) -> Neón Esmeralda 0x10b981
    // C (Citosina) -> Neón Dorado 0xfbbf24
    const matA = new T.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.3, metalness: 0.4, emissive: 0x9f1239, emissiveIntensity: 0.25 });
    const matT = new T.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.3, metalness: 0.4, emissive: 0x0e7490, emissiveIntensity: 0.25 });
    const matG = new T.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.4, emissive: 0x047857, emissiveIntensity: 0.25 });
    const matC = new T.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.4, emissive: 0xb45309, emissiveIntensity: 0.25 });
    const matPuenteH = new T.MeshBasicMaterial({ color: 0xffffff });

    const geoEsferaFosfato = new T.SphereGeometry(0.12, 16, 16);
    const geoBaseCil = new T.CylinderGeometry(0.045, 0.045, 0.52, 16);
    const geoPuenteH = new T.SphereGeometry(0.04, 12, 12);

    const mapeoDianas = {
      4: DIANAS_ADN[0],  // PBP / Transpeptidasa
      10: DIANAS_ADN[1], // COX-2 / Paracetamol
      16: DIANAS_ADN[2], // DENV NS1 / Dengue
      22: DIANAS_ADN[3], // ARNm / Vacunas
      28: DIANAS_ADN[4]  // HMG-CoA / Atorvastatina
    };

    for (let i = 0; i < NUM_PASOS; i++) {
      const angulo = i * (Math.PI / 8); // 22.5 grados por par
      const y = Y_INICIO + (i * ALTURA_PASO);

      // Grupo del peldaño con rotación en el eje Y
      const grupoPaso = new T.Group();
      grupoPaso.position.y = y;
      grupoPaso.rotation.y = angulo;

      const esParAT = (i % 2 === 0);
      const matIzq = esParAT ? matA : matG;
      const matDer = esParAT ? matT : matC;

      // 1. Cadena 1 Izquierda (Esfera Azúcar-Fosfato)
      const esfera1 = new T.Mesh(geoEsferaFosfato, matFosfato1);
      esfera1.position.x = -RADIO_HELICE;

      // Semipeldaño izquierdo (Nucleótido 1)
      const cilIzq = new T.Mesh(geoBaseCil, matIzq);
      cilIzq.rotation.z = Math.PI / 2;
      cilIzq.position.x = -RADIO_HELICE + 0.32;

      // Grupo para la mitad izquierda (se separará en desdoblamiento)
      const grupoIzq = new T.Group();
      grupoIzq.add(esfera1);
      grupoIzq.add(cilIzq);
      grupoPaso.add(grupoIzq);

      // 2. Cadena 2 Derecha (Esfera Azúcar-Fosfato)
      const esfera2 = new T.Mesh(geoEsferaFosfato, matFosfato2);
      esfera2.position.x = RADIO_HELICE;

      // Semipeldaño derecho (Nucleótido 2)
      const cilDer = new T.Mesh(geoBaseCil, matDer);
      cilDer.rotation.z = Math.PI / 2;
      cilDer.position.x = RADIO_HELICE - 0.32;

      // Grupo para la mitad derecha (se separará en desdoblamiento)
      const grupoDer = new T.Group();
      grupoDer.add(esfera2);
      grupoDer.add(cilDer);
      grupoPaso.add(grupoDer);

      // 3. Puente de Hidrógeno central
      const puenteH = new T.Mesh(geoPuenteH, matPuenteH);
      puenteH.position.set(0, 0, 0);
      grupoPaso.add(puenteH);

      // Registrar para la animación interactiva de separación/desdoblamiento
      paresBasesADN.push({
        meshIzq: grupoIzq,
        meshDer: grupoDer,
        puenteH: puenteH,
        posOrigIzqX: 0,
        posOrigDerX: 0
      });

      // 4. ¿Es una Diana Farmacológica Molecular Clave?
      if (mapeoDianas[i]) {
        const diana = mapeoDianas[i];

        // Anillo holográfico pulsante alrededor del par de bases
        const haloDianaGeo = new T.TorusGeometry(RADIO_HELICE + 0.3, 0.02, 16, 32);
        const haloDianaMat = new T.MeshBasicMaterial({
          color: new T.Color(diana.colorBase),
          transparent: true,
          opacity: 0.8
        });
        const haloMesh = new T.Mesh(haloDianaGeo, haloDianaMat);
        haloMesh.rotation.x = Math.PI / 2;
        haloMesh.userData = diana;
        grupoPaso.add(haloMesh);

        // Marcador clicable esférico brillante
        const marcadorGeo = new T.SphereGeometry(0.18, 16, 16);
        const marcadorMat = new T.MeshStandardMaterial({
          color: new T.Color(diana.colorBase),
          emissive: new T.Color(diana.colorBase),
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.2
        });
        const marcador = new T.Mesh(marcadorGeo, marcadorMat);
        marcador.position.set(RADIO_HELICE + 0.35, 0, 0);
        marcador.userData = diana;
        grupoPaso.add(marcador);

        meshDianasADN.push(marcador);
        meshDianasADN.push(haloMesh);
      }

      root.add(grupoPaso);
    }

    return root;
  }

  function mostrarHologramaADN(diana) {
    const holo = document.getElementById('holograma-adn-3d');
    if (!holo) return;

    holo.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid rgba(0,240,255,0.3); padding-bottom:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:32px; height:32px; border-radius:50%; background:radial-gradient(circle, ${diana.colorBase} 0%, rgba(0,0,0,0.8) 80%); display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px ${diana.colorBase}; font-size:16px;">
            🧬
          </div>
          <div>
            <strong style="font-size:12px; color:#00f0ff; display:block; line-height:1.2; text-shadow:0 0 8px rgba(0,240,255,0.5);">${diana.nombre}</strong>
            <span style="font-size:9.5px; color:#cbd5e1; font-family:var(--fuente-mono);">${diana.par}</span>
          </div>
        </div>
        <button id="btn-cerrar-holograma-adn" type="button" aria-label="Cerrar" style="background:transparent; border:none; color:#94a3b8; font-size:18px; cursor:pointer; padding:0 4px;">✕</button>
      </div>

      <div style="background:rgba(2,132,199,0.12); border:1px solid rgba(0,240,255,0.3); border-radius:8px; padding:8px 10px; margin-bottom:10px; font-size:11px;">
        <div style="color:#00f0ff; font-weight:700; margin-bottom:3px; font-size:10px; text-transform:uppercase;">Fármaco / Diana Asociada:</div>
        <div style="color:#fff; font-size:11.5px; font-weight:600;">${diana.farma}</div>
      </div>

      <div style="background:rgba(15,23,42,0.85); border:1px solid #1e3a5f; border-radius:8px; padding:8px 10px; margin-bottom:10px; font-size:10.5px; line-height:1.4;">
        <span style="color:#94a3b8; display:block; font-size:9.5px; text-transform:uppercase; font-weight:700; margin-bottom:2px;">Mecanismo Molecular:</span>
        <p style="margin:0; color:#e2e8f0;">${diana.mecanismo}</p>
      </div>

      <div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.35); border-radius:8px; padding:8px 10px; margin-bottom:12px; font-size:10px; line-height:1.35;">
        <strong style="color:#34d399; display:block; margin-bottom:2px;">Relevancia Sanitaria (Red de Postas):</strong>
        <span style="color:#cbd5e1;">${diana.relevancia}</span>
      </div>

      <div style="display:flex; gap:8px;">
        <button id="btn-adn-ver-farmaco" type="button" style="flex:1; background:linear-gradient(135deg, rgba(0,240,255,0.3), rgba(2,132,199,0.4)); color:#00f0ff; border:1px solid #00f0ff; padding:8px 10px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
          <span>💊</span> Ver Fármaco en 3D
        </button>
        <button id="btn-adn-solicitar" type="button" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:8px 12px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px;">
          <span>📋</span> Pedir G3
        </button>
      </div>
    `;

    holo.hidden = false;
    holo.style.display = 'block';

    document.getElementById('btn-cerrar-holograma-adn')?.addEventListener('click', () => {
      holo.style.display = 'none';
      holo.hidden = true;
    });

    document.getElementById('btn-adn-ver-farmaco')?.addEventListener('click', () => {
      activarModoMedicamentos3D();
    });

    document.getElementById('btn-adn-solicitar')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('g3:abrir-solicitud', {
        detail: { tipo: 'medicamento', item: diana.farma }
      }));
    });

    // Resaltar en lista lateral
    document.querySelectorAll('.item-diana-adn').forEach((li) => {
      li.classList.toggle('lista3d__item--activo', li.dataset.id === diana.id);
    });
  }

  function configurarControlesOrbitales(canvas) {
    let arrastrando = false;
    let prevX = 0, prevY = 0;
    let theta = 0;
    let phi = -0.65;
    let radio = 8;

    function updateCamera() {
      if (tourActivo) return;
      camera.position.x = radio * Math.sin(theta) * Math.cos(phi);
      camera.position.y = radio * Math.sin(-phi);
      camera.position.z = radio * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(0, 0.4, 0);
    }

    canvas.addEventListener('pointerdown', (e) => {
      arrastrando = true;
      prevX = e.clientX;
      prevY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!arrastrando) return;
      const dx = (e.clientX - prevX) * 0.007;
      const dy = (e.clientY - prevY) * 0.005;
      theta -= dx;
      phi = Math.max(-1.2, Math.min(0.2, phi + dy));
      prevX = e.clientX;
      prevY = e.clientY;
      updateCamera();
    });

    canvas.addEventListener('pointerup', () => { arrastrando = false; });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      radio = Math.max(4, Math.min(14, radio + e.deltaY * 0.01));
      updateCamera();
    }, { passive: false });

    // Botones flechas de interfaz
    document.getElementById('btn-rotar-iz')?.addEventListener('click', () => { theta -= 0.3; updateCamera(); });
    document.getElementById('btn-rotar-de')?.addEventListener('click', () => { theta += 0.3; updateCamera(); });
    document.getElementById('btn-zoom-mas')?.addEventListener('click', () => { radio = Math.max(4, radio - 0.8); updateCamera(); });
    document.getElementById('btn-zoom-men')?.addEventListener('click', () => { radio = Math.min(14, radio + 0.8); updateCamera(); });

    // Picking por Raycaster
    const raycaster = new Three.Raycaster();
    const mouse = new Three.Vector2();

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (modoActual3D === 'adn') {
        const intersects = raycaster.intersectObjects(meshDianasADN, true);
        if (intersects.length > 0) {
          let obj = intersects[0].object;
          while (obj && !obj.userData?.id && obj.parent) {
            obj = obj.parent;
          }
          if (obj && obj.userData?.id) {
            const diana = obj.userData;
            animarCamaraHacia({ x: 0, y: diana.posicion[1] + 0.8, z: 3.5 }, { x: 0, y: diana.posicion[1], z: 0 }, 500);
            mostrarHologramaADN(diana);
          }
        }
      } else if (modoActual3D === 'medicamentos') {
        const intersects = raycaster.intersectObjects(meshMedicamentos, true);
        if (intersects.length > 0) {
          let obj = intersects[0].object;
          while (obj && !obj.userData?.id && obj.parent) {
            obj = obj.parent;
          }
          if (obj && obj.userData?.id) {
            const med = obj.userData;
            animarCamaraHacia({ x: med.posicion[0], y: med.posicion[1] + 0.3, z: med.posicion[2] + 2.2 }, { x: med.posicion[0], y: med.posicion[1], z: med.posicion[2] }, 500);
            mostrarHologramaMedicamento3D(med);
          }
        }
      } else {
        const intersects = raycaster.intersectObjects(meshAmbientes);
        if (intersects.length > 0) {
          const amb = intersects[0].object.userData;
          mostrarDetalleAmbiente(amb);
        }
      }
    });
  }

  function mostrarHologramaMedicamento3D(med) {
    const holo = document.getElementById('holograma-med-3d');
    if (!holo) return;

    holo.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:22px;">💊</span>
          <div>
            <strong style="font-size:13px; color:#fff; display:block; line-height:1.2;">${med.nombre}</strong>
            <span style="font-size:10px; color:#38bdf8; font-family:var(--fuente-mono);">DCI: ${med.dci}</span>
          </div>
        </div>
        <button id="btn-cerrar-holograma" type="button" aria-label="Cerrar" style="background:transparent; border:none; color:#94a3b8; font-size:18px; cursor:pointer; padding:0 4px;">✕</button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:10px; font-size:10px;">
        <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:6px;">
          <span style="color:#94a3b8; display:block;">Código SIGA:</span>
          <strong style="color:#e2e8f0; font-family:var(--fuente-mono);">${med.siga}</strong>
        </div>
        <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(56,189,248,0.25); border-radius:6px; padding:6px;">
          <span style="color:#94a3b8; display:block;">Código SISMED:</span>
          <strong style="color:#e2e8f0; font-family:var(--fuente-mono);">${med.sismed}</strong>
        </div>
      </div>

      <div style="background:rgba(6,18,36,0.9); border:1px solid #1e3a5f; border-radius:8px; padding:8px 10px; margin-bottom:10px; font-size:11px;">
        <div style="margin-bottom:4px;"><strong style="color:#38bdf8;">Forma:</strong> ${med.forma} · ${med.concentracion}</div>
        <p style="margin:0; font-size:10px; color:#cbd5e1; line-height:1.35;">${med.accion}</p>
      </div>

      <!-- Comparativa Real de Precios DIGEMID -->
      <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:8px 10px; margin-bottom:10px; font-size:11px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span style="color:#94a3b8;">Genérico DCI (MINSA):</span>
          <strong style="color:#34d399; font-family:var(--fuente-mono);">S/ ${med.precioGenerico.toFixed(2)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="color:#94a3b8;">Marca Comercial Privada:</span>
          <strong style="color:#f87171; font-family:var(--fuente-mono); text-decoration:line-through;">S/ ${med.precioMarca.toFixed(2)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; border-top:1px dashed rgba(16,185,129,0.3); padding-top:4px;">
          <strong style="color:#38bdf8; font-size:10px;">Ahorro Oficial:</strong>
          <strong style="color:#10b981; font-weight:800;">-${med.ahorro}% menos</strong>
        </div>
      </div>

      <!-- Stock Real en La Libertad -->
      <div style="background:rgba(15,23,42,0.85); border:1px solid #1e3a5f; border-radius:8px; padding:6px 10px; margin-bottom:12px; font-size:10px; display:flex; justify-content:space-between;">
        <div>
          <span style="color:#94a3b8; display:block;">Stock EESS La Libertad:</span>
          <strong style="color:#38bdf8;">${med.stockLaLibertad}</strong>
        </div>
        <div style="text-align:right;">
          <span style="color:#94a3b8; display:block;">Almacén GERESA:</span>
          <strong style="color:#a78bfa;">${med.almacen}</strong>
        </div>
      </div>

      <div style="display:flex; gap:8px;">
        <button id="btn-holo-solicitar" type="button" style="flex:1; background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color:#fff; border:none; padding:8px 12px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
          <span>📋</span> Solicitar con Código G3
        </button>
        <a href="#tablero-regional-sismed" style="background:rgba(30,58,95,0.7); border:1px solid #38bdf8; color:#38bdf8; padding:8px 10px; border-radius:8px; font-size:11px; text-decoration:none; display:flex; align-items:center;">
          📊 SISMED
        </a>
      </div>
    `;

    holo.hidden = false;
    holo.style.display = 'block';

    document.getElementById('btn-cerrar-holograma')?.addEventListener('click', () => {
      holo.style.display = 'none';
      holo.hidden = true;
    });

    document.getElementById('btn-holo-solicitar')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('g3:abrir-solicitud', {
        detail: { tipo: 'medicamento', item: med.nombre }
      }));
    });

    // Resaltar en lista lateral
    document.querySelectorAll('.item-med-3d').forEach((li) => {
      li.classList.toggle('lista3d__item--activo', li.dataset.id === med.id);
    });
  }

  function mostrarDetalleAmbiente(amb) {
    const tt = document.getElementById('tooltip3d');
    if (!tt) return;

    const est = ESTADO_ETIQUETA[amb.estado] || { texto: amb.estado, clase: 'neut' };
    document.getElementById('tt-ico').textContent = amb.icono;
    document.getElementById('tt-nombre').textContent = amb.nombre;
    document.getElementById('tt-estado').textContent = est.texto;
    document.getElementById('tt-estado').className = `tooltip3d__estado estado-etiqueta--${est.clase}`;
    document.getElementById('tt-desc').textContent = `${amb.descripcion} (${amb.cotas})`;
    document.getElementById('tt-conf').textContent = `Verificado: ${amb.confirmado}`;
    document.getElementById('tt-norma').textContent = amb.normaMinsa;
    tt.hidden = false;

    // Resaltar en lista lateral
    document.querySelectorAll('.lista3d__item').forEach((li) => {
      li.classList.toggle('lista3d__item--activo', li.dataset.id === amb.id);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarSeccion);
  } else {
    montarSeccion();
  }

  window.Escena3D = { montarSeccion };
})();
