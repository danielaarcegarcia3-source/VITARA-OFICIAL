// MÓDULO HISTÓRICO INACTIVO: el sistema vigente usa server.mjs y server-services.mjs.
// No se cargan los SDK Firebase. Firestore está cerrado por defecto; no habilitarlo sin pruebas propias.
/**
 * firebase/config.js — Configuración base de Firebase para el proyecto.
 *
 * CÓMO USAR:
 * 1. Crea tu proyecto en https://console.firebase.google.com/project/new
 * 2. Activa Authentication (anónima + email/contraseña)
 * 3. Activa Firestore Database (modo producción, región us-central1)
 * 4. En «Configuración del proyecto» copia los valores reales al archivo .env
 *    (nunca al código). Referencia: .env.example en la raíz.
 * 5. Este archivo lee las variables de entorno si está bajo un bundler/servidor
 *    Node; en el navegador usa los valores de window.__ENV (inyectados por el
 *    servidor o por firebase hosting rewrites).
 *
 * MODO DEMO:
 * Si las credenciales están vacías (''), el módulo exporta app = null y el
 * resto de la app opera en modo local (LocalStorage + datos semilla).
 * Ninguna función P0 se bloquea por falta de Firebase.
 *
 * SEGURIDAD:
 * - Las API keys de Firebase son seguras en el cliente SOLO si las reglas
 *   de Firestore/Storage están bien configuradas (ver firebase/rules.rules).
 * - Nunca pongas credenciales de Admin SDK aquí (eso va solo en backend/server).
 */

/* =========================================================================
   1. CONFIGURACIÓN — reemplaza con tus datos reales (o lee de .env)
   ========================================================================= */
const firebaseConfig = {
  apiKey:            typeof __FIREBASE_API_KEY__            !== 'undefined' ? __FIREBASE_API_KEY__            : '',
  authDomain:        typeof __FIREBASE_AUTH_DOMAIN__        !== 'undefined' ? __FIREBASE_AUTH_DOMAIN__        : '',
  projectId:         typeof __FIREBASE_PROJECT_ID__         !== 'undefined' ? __FIREBASE_PROJECT_ID__         : '',
  storageBucket:     typeof __FIREBASE_STORAGE_BUCKET__     !== 'undefined' ? __FIREBASE_STORAGE_BUCKET__     : '',
  messagingSenderId: typeof __FIREBASE_MESSAGING_SENDER_ID__ !== 'undefined' ? __FIREBASE_MESSAGING_SENDER_ID__ : '',
  appId:             typeof __FIREBASE_APP_ID__             !== 'undefined' ? __FIREBASE_APP_ID__             : '',
  // measurementId es opcional (solo si activas Google Analytics)
  measurementId:     typeof __FIREBASE_MEASUREMENT_ID__     !== 'undefined' ? __FIREBASE_MEASUREMENT_ID__     : '',
};

/* =========================================================================
   2. COMPROBACIÓN — ¿tenemos credenciales reales?
   ========================================================================= */
const tieneCredenciales = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.startsWith('YOUR_')
);

/* =========================================================================
   3. INICIALIZACIÓN CONDICIONAL
   ========================================================================= */
let app      = null;
let db       = null;   // Firestore
let auth     = null;   // Authentication
let rtdb     = null;   // Realtime Database (opcional, para SSE nativo)
let modoLocal = true;

if (tieneCredenciales) {
  try {
    // Firebase SDK v9+ modular (CDN compat build)
    // En index.html se carga: https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js
    if (window.firebase) {
      app  = window.firebase.initializeApp(firebaseConfig);
      db   = window.firebase.firestore(app);
      auth = window.firebase.auth(app);
      modoLocal = false;
      console.info('[Firebase] Inicializado correctamente · proyecto:', firebaseConfig.projectId);
    } else {
      throw new Error('SDK de Firebase no encontrado en window.firebase');
    }
  } catch (err) {
    console.warn('[Firebase] No se pudo inicializar — operando en modo local:', err.message);
    app = null; db = null; auth = null; modoLocal = true;
  }
} else {
  console.info('[Firebase] Sin credenciales — modo demo local activo');
}

/* =========================================================================
   4. API PÚBLICA DEL MÓDULO
   Otros scripts importan estas funciones en lugar de llamar a Firebase directo.
   Así el modo local puede emular exactamente la misma interfaz.
   ========================================================================= */

/**
 * Leer una colección (con soporte local).
 * @param {string} coleccion
 * @param {Array}  filtros  — [campo, operador, valor][]
 * @returns {Promise<Array>}
 */
async function leerColeccion(coleccion, filtros = []) {
  if (!db) {
    return leerLocal(coleccion, filtros);
  }
  try {
    let ref = db.collection(coleccion);
    for (const [campo, op, val] of filtros) {
      ref = ref.where(campo, op, val);
    }
    const snap = await ref.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('[Firebase] leerColeccion falló, usando local:', err.message);
    return leerLocal(coleccion, filtros);
  }
}

/**
 * Escribir un documento (modo local → LocalStorage).
 * @param {string} coleccion
 * @param {object} datos
 * @param {string} [id]  — si se omite, Firestore genera uno
 * @returns {Promise<string>} id del documento
 */
async function escribirDocumento(coleccion, datos, id) {
  const payload = {
    ...datos,
    _creado_en: new Date().toISOString(),
    _es_demo: !tieneCredenciales,
  };

  if (!db) {
    return escribirLocal(coleccion, payload, id);
  }
  try {
    if (id) {
      await db.collection(coleccion).doc(id).set(payload);
      return id;
    }
    const ref = await db.collection(coleccion).add(payload);
    return ref.id;
  } catch (err) {
    console.warn('[Firebase] escribirDocumento falló, guardando local:', err.message);
    return escribirLocal(coleccion, payload, id);
  }
}

/**
 * Escuchar cambios en tiempo real (con fallback a polling en modo local).
 * @param {string}   coleccion
 * @param {Function} callback — recibe Array de documentos
 * @returns {Function} cancelar — llámala para detener la suscripción
 */
function escucharColeccion(coleccion, callback) {
  if (!db) {
    // Modo local: polling cada 3 s sobre LocalStorage
    const id = setInterval(() => {
      callback(leerLocalSync(coleccion));
    }, 3000);
    callback(leerLocalSync(coleccion)); // llamada inmediata
    return () => clearInterval(id);
  }
  const unsub = db.collection(coleccion)
    .orderBy('_creado_en', 'desc')
    .limit(50)
    .onSnapshot((snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('[Firebase] escucharColeccion error:', err.message);
    });
  return unsub;
}

/* =========================================================================
   5. CAPA LOCAL (LocalStorage) — misma interfaz que Firestore
   ========================================================================= */
const PREFIJO_LOCAL = 'g3-local-';

function leerLocalSync(coleccion) {
  try {
    return JSON.parse(localStorage.getItem(PREFIJO_LOCAL + coleccion) || '[]');
  } catch { return []; }
}

async function leerLocal(coleccion, filtros) {
  let docs = leerLocalSync(coleccion);
  for (const [campo, op, val] of filtros) {
    docs = docs.filter((d) => {
      if (op === '==') return d[campo] === val;
      if (op === '!=') return d[campo] !== val;
      return true;
    });
  }
  return docs;
}

async function escribirLocal(coleccion, datos, id) {
  const docId = id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const docs  = leerLocalSync(coleccion);
  const idx   = docs.findIndex((d) => d.id === docId);
  const doc   = { id: docId, ...datos };
  if (idx >= 0) docs[idx] = doc; else docs.push(doc);
  try {
    localStorage.setItem(PREFIJO_LOCAL + coleccion, JSON.stringify(docs));
  } catch (e) {
    console.warn('[Local] No se pudo persistir en localStorage:', e.message);
  }
  return docId;
}

/* =========================================================================
   6. EXPORTAR
   ========================================================================= */
window.Firebase = {
  app,
  db,
  auth,
  modoLocal,
  tieneCredenciales,
  leerColeccion,
  escribirDocumento,
  escucharColeccion,
};

// Emitir evento para que otros módulos sepan que Firebase está listo
window.dispatchEvent(new CustomEvent('firebase:listo', { detail: { modoLocal } }));
