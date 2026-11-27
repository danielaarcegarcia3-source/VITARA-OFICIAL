/*
 * Ecosistema Digital ODS 3 y 9 - Lógica JavaScript
 * Club Tech-Masters 2026
 * Funcionalidades: búsqueda, solicitud, seguimiento, panel admin, SSE
 * Datos de demostración sin dependencias externas
*/


import { establishmentsData, resourcesData, testRequestsData, testResponsesData } from './data/catalog.js';


// Estado de la aplicación
const appState = {
  userRole: 'visitante', // visitante, citizen, posta, admin
  userCode: null, // Código de seguimiento para visitante
  currentFilters: {
    district: '',
    type: '',
    resource: '',
    contexto: ''
  },
  firebaseApp: null
};


// Elementos del DOM
const elements = {
  // Secciones
  searchSection: document.getElementById('busqueda'),
  resultsSection: document.getElementById('resultados'),
  requestSection: document.getElementById('solicitud'),
  trackingSection: document.getElementById('seguimiento'),
  adminPanel: document.getElementById('admin-panel'),


  // Filtros
  districtSelect: document.getElementById('district-select'),
  typeSelect: document.getElementById('type-select'),
  resourceSelect: document.getElementById('resource-select'),
  contextoSelect: document.getElementById('contexto-select'),


  // Búsqueda
  btnSearch: document.querySelector('.btn-search'),


  // Solicitud
  requestEstablishment: document.getElementById('request-establishment'),
  requestResource: document.getElementById('request-resource'),
  trackingHint: document.getElementById('code-hint'),
  trackingCode: document.getElementById('tracking-code'),


  // Seguimiento
  trackingInput: document.getElementById('tracking-input'),
  consultBtn: document.querySelector('#seguimiento .btn-submit'),
  trackingResult: document.getElementById('tracking-result'),


  // Panel admin
  adminSedeFilter: document.getElementById('admin-filter-sede'),
  adminEstadoFilter: document.getElementById('admin-filter-estado'),
  adminTableBody: document.getElementById('admin-table-body'),
  liveActivity: document.getElementById('live-activity'),
  totalSolicitudes: document.getElementById('total-solicitudes'),
  pendientes: document.getElementById('pendientes'),
  respondidas: document.getElementById('respondidas'),


  // Modelo 3D
  modelViewer: document.getElementById('model-viewer')
};


// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  inicializarAplicacion();
});


// Función principal de inicialización
function inicializarAplicacion() {
  cargarEstablecimientos();
  configurarEventListeners();
  actualizarEstadoVisitante();


  // Verificar si Firebase está disponible
  verificarFirebase();
}


// Cargar datos de establecimientos en los filtros y formulario
function cargarEstablecimientos() {
  // Llenar filtro de distrito
  const distritos = [...new Set(establishmentsData.map(e => e.district))];
  elements.districtSelect.innerHTML = '<option value="">-- Seleccionar distrito --</option>';
  distritos.forEach(distrito => {
    const option = document.createElement('option');
    option.value = distrito.toLowerCase();
    option.textContent = capitalizeFirstLetter(distrito);
    elements.districtSelect.appendChild(option);
  });


  // Llenar filtro de tipo
  const tipos = [...new Set(establishmentsData.map(e => e.type))];
  elements.typeSelect.innerHTML = '<option value="">-- Seleccionar tipo --</option>';
  tipos.forEach(tipo => {
    const option = document.createElement('option');
    option.value = tipo;
    option.textContent = capitalizar(tipo);
    elements.typeSelect.appendChild(option);
  });


  // Llenar recurso en formulario de solicitud
  elements.requestEstablishment.innerHTML = '<option value="">-- Seleccionar --</option>';
  establishmentsData.forEach((est, i) => {
    if (i < 5) { // Mostrar solo primeros 5 para no saturar
      const option = document.createElement('option');
      option.value = est.id;
      option.textContent = `${est.name} (${est.district})`;
      elements.requestEstablishment.appendChild(option);
    }
  });


  // Llenar recurso en formulario de solicitud
  elements.requestResource.innerHTML = '<option value="">-- Seleccionar --</option>';
  resourcesData.forEach(rec => {
    const option = document.createElement('option');
    option.value = rec.id;
    option.textContent = `${rec.name} - ${rec.category}`;
    elements.requestResource.appendChild(option);
  });
}


// Configurar todos los event listeners
function configurarEventListeners() {
  // Botón de búsqueda
  elements.btnSearch.addEventListener('click', realizarBusqueda);


  // Filtros en tiempo real
  [elements.districtSelect, elements.typeSelect, elements.resourceSelect, elements.contextoSelect].forEach(el => {
    el.addEventListener('change', aplicarFiltros);
  });


  // Enviar solicitud
  elements.trackingHint.querySelector('button').addEventListener('click', enviarSolicitud);


  // Consultar seguimiento
  elements.consultBtn.addEventListener('click', consultarSeguimientoAPI);


  // Input de código de seguimiento
  elements.trackingInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      consultarSeguimientoAPI();
    }
  });


  // Panel administrador - cerrar al hacer clic fuera
  elements.adminPanel.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-panel')) {
      cerrarPanelAdmin();
    }
  });
}


// Aplicar filtros de búsqueda
function aplicarFiltros() {
  const distrito = elements.districtSelect.value.toLowerCase();
  const tipo = elements.typeSelect.value.toLowerCase();
  const recurso = elements.resourceSelect.value.toLowerCase();
  const contexto = elements.contextoSelect.value;


  // Filtrar datos
  let resultados = [...establishmentsData];


  if (distrito) {
    resultados = resultados.filter(e => e.district.toLowerCase() === distrito);
  }


  if (tipo) {
    resultados = resultados.filter(e => e.type === tipo);
  }


  // Mostrar resultados
  mostrarResultados(resultados);
}


// Realizar búsqueda
function realizarBusqueda() {
  const distrito = elements.districtSelect.value.toLowerCase();
  const tipo = elements.typeSelect.value.toLowerCase();
  const recurso = elements.resourceSelect.value.toLowerCase();
  const contexto = elements.contextoSelect.value;


  let resultados = [...establishmentsData];


  if (distrito) {
    resultados = resultados.filter(e => e.district.toLowerCase() === distrito);
  }


  if (tipo) {
    resultados = resultados.filter(e => e.type === tipo);
  }


  if (recurso) {
    // Filtrar también por recursos relacionados
    recursosBuscados = recurso;
  }


  // Aplicar contexto (modo ligero si internet lento)
  if (contexto === 'lento') {
    // Ocultar elementos pesados (simular)
    ocultarElementosPesados();
  }


  mostrarResultados(resultados);
}


// Mostrar resultados en pantalla
function mostrarResultados(resultados) {
  const resultsSection = document.getElementById('resultados');
  const resultsList = document.getElementById('results-list');


  if (resultados.length === 0) {
    resultsList.innerHTML = '<p style="color: var(--text-light);">No se encontraron recursos con los filtros aplicados.</p>';
    elements.searchSection.style.display = 'none';
    elements.resultsSection.style.display = 'block';
    return;
  }


  resultsList.innerHTML = '';


  resultados.forEach((est, index) => {
    const card = document.createElement('div');
    card.className = 'result-card';


    // Determinar estado visual
    let estadoClass = '';
    let estadoTexto = est.status;


    if (est.status === 'operativo') {
      estadoClass = 'success';
      estadoTexto = '✅ Operativo';
    } else if (est.status === 'no-disponible') {
      estadoClass = 'error';
      estadoTexto = '❌ No Disponible';
    } else if (est.status === 'sin-confirmar') {
      estadoClass = 'warning';
      estadoTexto = '⚠️ Sin Confirmar';
    }


    card.innerHTML = `
      <h3>${est.name}</h3>
      <p><strong>Distrito:</strong> ${est.district}</p>
      <p><strong>Tipo:</strong> ${capitalizar(tipo || est.type)}</p>
      <p><strong>Estado:</strong> <span class="${estadoClass}">${estadoTexto}</span></p>
      <p class="recurso">${est.resources.join(', ')}</p>
      <button class="btn-submit" style="width: auto; padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="solicitarDeEstablecimiento('${est.id}')">
        Solicitar Recurso
      </button>
    `;


    resultsList.appendChild(card);
  });


  // Mostrar/ocultar secciones
  elements.searchSection.style.display = 'none';
  elements.resultsSection.style.display = 'block';


  // Mostrar sección de solicitud si hay resultados
  if (resultados.length > 0) {
    elements.requestSection.style.display = 'block';
  }
}


// Enviar solicitud de recurso
async function enviarSolicitud() {
  const establecimientoId = elements.requestEstablishment.value;
  const recursoId = elements.requestResource.value;


  if (!establecimientoId || !recursoId) {
    alert('Por favor seleccione un establecimiento y un recurso.');
    return;
  }


  // Simular envío - en modo demo guardamos código local
  const userCode = `USR-${Math.floor(1000 + Math.random() * 8999)}`;
  appState.userCode = userCode;


  // Guardar solicitud en Firebase si está disponible
  if (appState.firebaseApp) {
    try {
      await guardarSolicitudFirebase(establecimientoId, recursoId, userCode);
    } catch (error) {
      console.error('Error guardando en Firebase:', error);
      // Continuar con modo local si falla
    }
  }


  // Mostrar código de seguimiento
  elements.trackingCode.textContent = userCode;
  elements.trackingHint.style.display = 'block';
  elements.requestSection.style.display = 'none';
  elements.trackingSection.style.display = 'block';


  // Guardar en localStorage para persistencia
  guardarSolicitudLocal(userCode, establecimientoId, recursoId);
}


// Consultar seguimiento por código
function consultarSeguimientoAPI() {
  const codigo = elements.trackingInput.value.trim();


  if (!codigo) {
    alert('Por favor ingrese su código de seguimiento.');
    return;
  }


  // Buscar en datos locales primero
  const solicitud = testRequestsData.find(r => r.userCode === codigo);


  if (solicitud) {
    mostrarResultadoSeguimiento(solicitud);
  } else {
    // Buscar en localStorage
    const stored = localStorage.getItem(`solicitud_${codigo}`);
    if (stored) {
      const data = JSON.parse(stored);
      mostrarResultadoSeguimiento({ ...data, source: 'local' });
    } else {
      alert('Código de seguimiento no encontrado. Verifique e intente nuevamente.');
    }
  }
}


// Mostrar resultado de seguimiento
function mostrarResultadoSeguimiento(solicitud) {
  const resultDiv = document.getElementById('tracking-result');


  let estadoHtml = '';
  if (solicitud.status === 'pendiente') {
    estadoHtml = '<span style="color: var(--warning-yellow);">⏳ Pendiente</span>';
  } else if (solicitud.status === 'respondido') {
    estadoHtml = `<span style="color: var(--success-green);">✅ Respondida</span>
      
<strong>Respuesta:</strong> ${solicitud.response || 'Sin respuesta'}
      
<strong>Fecha:</strong> ${solicitud.respondidoAt || 'N/A'}`;
  }


  resultDiv.innerHTML = `
    <div class="stat-box">
      <strong>Establecimiento:</strong> ${solicitud.establishmentName || 'N/A'}
    </div>
    <div class="stat-box">
      <strong>Recurso:</strong> ${solicitud.resourceName || 'N/A'}
    </div>
    <div class="stat-box">
      <strong>Estado:</strong> ${estadoHtml}
    </div>
    ${solicitud.source === 'local' ? '<p><em>Datos guardados localmente</em></p>' : ''}
  `;


  elements.trackingSection.style.display = 'block';
  elements.resultsSection.style.display = 'none';
}


// Cerrar panel administrador
function cerrarPanelAdmin() {
  elements.adminPanel.classList.remove('active');
}


// Filtrar panel admin
function filtrarPanelAdmin() {
  const sede = elements.adminSedeFilter.value;
  const estado = elements.adminEstadoFilter.value;


  // En modo demo, generamos tablas simuladas
  generarTablaAdminSimulada();
}


// Generar tabla administrativa simulada
function generarTablaAdminSimulada() {
  const tbody = elements.adminTableBody;
  tbody.innerHTML = '';


  // Datos simulados para demostrar el panel
  const datosSimulados = [
    { sede: 'Posta Trujillo Alto', recursos: 'Paracetamol, Equipo Respirador', solicitudes: 15, respondidas: 12, estado: 'operativo', ultima: '2026-11-20 10:30' },
    { sede: 'Centro Moche', recursos: 'Amoxicilina, Suero Fisiológico', solicitudes: 8, respondidas: 5, estado: 'no-disponible', ultima: '2026-11-20 09:15' },
    { sede: 'Posta Virú', recursos: 'Antialérgicos', solicitudes: 3, respondidas: 3, estado: 'operativo', ultima: '2026-11-20 11:45' }
  ];


  datosSimulados.forEach(fila => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila.sede}</td>
      <td>${fila.recursos}</td>
      <td>${fila.solicitudes}</td>
      <td>${fila.respondidas}</td>
      <td><span style="color: ${fila.estado === 'operativo' ? 'green' : 'red'}">${fila.estado}</span></td>
      <td>${fila.ultima}</td>
    `;
    tbody.appendChild(tr);
  });


  // Actualizar estadísticas
  const total = datosSimulados.reduce((sum, f) => sum + f.solicitudes, 0);
  const respondidas = datosSimulados.reduce((sum, f) => sum + f.respondidas, 0);


  elements.totalSolicitudes.textContent = total;
  elements.pendientes.textContent = total - respondidas;
  elements.respondidas.textContent = respondidas;
}


// --- Funciones de Modelo 3D y Características Adicionales ---


// Inicializar visor 3D
function inicializarVisor3D() {
  if (!elements.modelViewer) return;


  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });


  renderer.setSize(window.innerWidth, window.innerHeight);
  elements.modelViewer.appendChild(renderer.domElement);


  // Cargar modelo glb si existe
  const loader = new THREE.GLTFLoader();
  // Cargar desde la misma carpeta (en demo usaremos un placeholder)
  loader.load(
    '3d-models/clinic.glb',
    (gltf) => {
      scene.add(gltf.scene);
      camera.position.z = 5;
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% cargado');
    },
    (error) => {
      console.error('Error cargando modelo 3D:', error);
      // Si no hay modelo, mostrar información
      elements.modelViewer.innerHTML = `
        <div style="padding: 2rem; color: var(--text-light);">
          <h3>🏥 Modelo 3D - Establecimiento de Salud</h3>
          <p>Modo demostración - modelo vectorial</p>
          <p>Haz clic para ver información del establecimiento</p>
        </div>
      `;
    }
  );


  // Luz
  const light = new THREE.HemisphereLight(0xffffff, 0x444444);
  light.position.set(0, 2, 0);
  scene.add(light);


  // Animación continua
  function animate() {
    requestAnimationFrame(animate);
    // Rotar ligeramente si hay modelo
    // gltf.scene.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}


// Funciones de contexto y accesibilidad
function aplicarContexto(contexto) {
  const body = document.body;


  switch (contexto) {
    case 'lento':
      // Modo ligero: reducir animaciones, ocultar 3D, imágenes optimizadas
      body.classList.add('modo-lento');
      ocultarElementosPesados();
      break;


    case 'lectura-fácil':
      body.classList.add('modo-lectura');
      break;


    case 'adaptado':
      body.classList.add('modo-adaptado');
      break;


    default:
      body.classList.remove('modo-lento', 'modo-lectura', 'modo-adaptado');
  }
}


// Ocultar elementos pesados modo ligero
function ocultarElementosPesados() {
  // Ocultar mapa, 3D, efectos complejos
  const heavyElements = document.querySelectorAll('.model-viewer, .map-container, .animate-element');
  heavyElements.forEach(el => el.style.display = 'none');


  // Mostrar alternativas simples
  const simpleElements = document.querySelectorAll('.result-card, .list-item');
  simpleElements.forEach(el => el.style.display = 'block');
}


// Capitalizar primera letra
function capitalizar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}


// Verificar estado del visitante
function actualizarEstadoVisitante() {
  // Verificar si ya tiene código de seguimiento guardado
  const savedCode = localStorage.getItem('userTrackingCode');
  if (savedCode) {
    elements.trackingCode.textContent = savedCode;
    elements.trackingHint.style.display = 'block';
  }
}


// Guardar solicitud en localStorage para persistencia
function guardarSolicitudLocal(userCode, establecimientoId, recursoId) {
  const establecimiento = establishmentsData.find(e => e.id === establecimientoId);
  const recurso = resourcesData.find(r => r.id === recursoId);


  const data = {
    userCode,
    establecimientoName: establecimiento ? establecimiento.name : 'N/A',
    resourceName: recurso ? recurso.name : 'N/A',
    timestamp: new Date().toISOString()
  };


  localStorage.setItem(`solicitud_${userCode}`, JSON.stringify(data));
    // Verificar Firebase availability
function verificarFirebase() {
  // Verificación básica - en demo no es obligatorio
  const firebaseScript = document.querySelector('script[src*="firebase"]');
  if (firebaseScript) {
    console.log('SDK Firebase cargado - listo para integración real');
  } else {
    console.log('Modo demo sin Firebase SDK - funcionalidades locales activas');
  }


  // Intentar inicializar con configuración por defecto
  try {
    if (typeof firebase !== 'undefined') {
      const app = firebase.initializeApp({
        apiKey: "demo-mode",
        authDomain: "demo-project.firebaseapp.com",
        projectId: "demo-project"
      });
      appState.firebaseApp = app;
    }
  } catch (e) {
    console.log("Firebase modo demo - todas las operaciones son locales");
  }
}


// Exportar funciones para uso global si es necesario
window.inicializarAplicacion = inicializarAplicacion;
window.realizarBusqueda = realizarBusqueda;
window.enviarSolicitud = enviarSolicitud;
window.consultarSeguimientoAPI = consultarSeguimientoAPI;
window.cerrarPanelAdmin = cerrarPanelAdmin;
window.aplicarContexto = aplicarContexto;


// Inicializar visor 3D cuando se carga
document.addEventListener('DOMContentLoaded', inicializarVisor3D);