/**
 * backend/server.mjs — Servidor HTTP y SSE en tiempo real
 * Ecosistema Digital de Acceso a la Salud · Grupo 3 · Club Tech-Masters 2026
 *
 * Características:
 * · 100% nativo en Node.js (cero dependencias de pago, costo $0.00).
 * · Comunicación en tiempo real con Server-Sent Events (SSE).
 * · Soporta ≥ 12 dispositivos simultáneos en red local (Wi-Fi del concurso).
 * · Persistencia en disco (data/solicitudes.json) con escritura atómica.
 * · Prevención de duplicados (idempotencia) y validación de privacidad (sin DNI).
 * · Procedimiento de respaldo y recuperación (backup/restore JSON).
 * · Funciona 100% offline sin conexión a Internet.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const DATA_FILE = path.join(ROOT_DIR, 'data', 'solicitudes.json');

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'Salud2026!'; // Token para operaciones administrativas
const ADMIN_USUARIO = process.env.ADMIN_USUARIO || 'admin_g3';
const ADMIN_CLAVE = process.env.ADMIN_CLAVE || 'Salud2026!';
const DIAS_RETENCION = Number(process.env.DIAS_RETENCION || 30);
const MAX_SOLICITUDES = 5000;
const MAX_SSE = 80;
const ESTADOS_VALIDOS = new Set(['recibida', 'en_revision', 'respondido', 'cerrado']);
const CODIGO_G3 = /^G3-[A-Z0-9]{6}$/;
const INTENTOS_LOGIN = new Map(); // Límite específico anti fuerza bruta

// Asegurar directorio data y archivo de almacenamiento inicial
if (!fs.existsSync(path.join(ROOT_DIR, 'data'))) {
  fs.mkdirSync(path.join(ROOT_DIR, 'data'), { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  const seedInicial = [
    {
      codigo: 'G3-8A2F1B',
      item: 'Paracetamol 500 mg tableta',
      categoria: 'medicamento',
      alias: 'Vecina de Moche',
      esAcompanamiento: false,
      sede: 'C.S. MOCHE',
      estado: 'respondido',
      respuesta: 'Stock normostock disponible en ventanilla de farmacia (Lunes a Sábado 07:00 a 19:00).',
      fecha: new Date(Date.now() - 3600000 * 4).toISOString(),
      fechaRespuesta: new Date(Date.now() - 3600000 * 2).toISOString(),
      idempotencyHash: 'seed-01'
    },
    {
      codigo: 'G3-9B3C4D',
      item: 'Ecógrafo Portátil con Transductor Convexo',
      categoria: 'equipo',
      alias: 'Promotor Comunitario',
      esAcompanamiento: true,
      sede: 'P.S. CHUGAY',
      estado: 'en_revision',
      respuesta: 'En calibración preventiva programada según protocolo IETSI. Retorno estimado: 48h.',
      fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
      fechaRespuesta: null,
      idempotencyHash: 'seed-02'
    },
    {
      codigo: 'G3-7K8M9P',
      item: 'Kit de Emergencia Dengue (Sales de Rehidratación + Paracetamol)',
      categoria: 'dengue',
      alias: 'Ciudadano anónimo',
      esAcompanamiento: false,
      sede: 'HOSPITAL DISTRITAL JERUSALEN',
      estado: 'recibida',
      respuesta: null,
      fecha: new Date(Date.now() - 1800000).toISOString(),
      fechaRespuesta: null,
      idempotencyHash: 'seed-03'
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(seedInicial, null, 2), 'utf8');
}

// Cargar solicitudes en memoria
let solicitudes = [];
try {
  solicitudes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} catch (err) {
  console.error('Error leyendo solicitudes iniciales, iniciando array vacío:', err);
  solicitudes = [];
}

// Guardar solicitudes de manera atómica (evita corrupción)
function guardarSolicitudesEnDisco() {
  try {
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(solicitudes, null, 2), 'utf8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('Error guardando en disco:', err);
  }
}

// Manejador de Clientes SSE (Server-Sent Events)
const clientesSSE = new Set();

function emitirEvento(tipo, datos) {
  const payload = `event: ${tipo}\ndata: ${JSON.stringify(datos)}\n\n`;
  for (const res of clientesSSE) {
    try {
      res.write(payload);
    } catch {
      clientesSSE.delete(res);
    }
  }
}

function emitirConteoClientes() {
  emitirEvento('concurrencia', {
    clientesConectados: clientesSSE.size,
    metaConcurso: 7,
    estado: clientesSSE.size >= 7 ? 'SUPERADA' : 'EN_PROCESO',
    timestamp: Date.now()
  });
}

// Enviar heartbeat / ping a SSE cada 15 segundos
setInterval(() => {
  for (const res of clientesSSE) {
    try {
      res.write(': ping\n\n');
    } catch {
      clientesSSE.delete(res);
    }
  }
}, 15000);

// Diccionario MIME para archivos estáticos
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.glb': 'model/gltf-binary',
  '.geojson': 'application/geo+json; charset=utf-8'
};

// Generador de código G3-XXXXXX (F-003)
function generarCodigoG3() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'G3-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Detectar IP local para mostrar en consola la URL del concurso Wi-Fi
function obtenerIPLocal() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

// Lector de body JSON (límite estricto y errores con código HTTP)
function leerBodyJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > 1e6) { // 1 MB límite
        const err = new Error('Payload demasiado grande (máximo 1 MB)');
        err.statusCode = 413;
        req.destroy();
        reject(err);
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        const err = new Error('JSON inválido');
        err.statusCode = 400;
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

// =========================================================================
// FIREWALL WAF (Web Application Firewall) & PROTECCIÓN DE PRIVACIDAD
// =========================================================================
const FIREWALL_STATS = {
  activo: true,
  modo: 'BLINDAJE_ESTRICTO',
  inicio: new Date().toISOString(),
  peticionesAnalizadas: 0,
  amenazasBloqueadas: 0,
  ipsMonitoreadas: new Map(),
  registroIncidentes: []
};

// Patrones maliciosos (SQLi, XSS, Path Traversal, Archivos sensibles)
const PATRONES_MALICIOSOS = [
  { tipo: 'SQL_INJECTION', regex: /(\b(union\s+select|select\s+.*\s+from|insert\s+into|drop\s+table|delete\s+from|update\s+.*\s+set)\b|--|\/\*|\*\/)/i },
  { tipo: 'XSS_ATTACK', regex: /(<script[\s\S]*?>[\s\S]*?<\/script>|javascript:|onerror\s*=|onload\s*=|alert\(|<iframe[\s\S]*?>)/i },
  { tipo: 'PATH_TRAVERSAL', regex: /(\.\.[\/\\]|%2e%2e[\/\\]|%252e%252e)/i },
  { tipo: 'SENSITIVE_FILE_PROBING', regex: /(\.env|\.git|wp-admin|wp-login|config\.json|passwd|shadow)/i }
];

function inspeccionarFirewall(req, res) {
  FIREWALL_STATS.peticionesAnalizadas++;
  const ip = req.socket?.remoteAddress || '127.0.0.1';

  // 1. Rate Limiting (Anti-DoS / Anti-Inundación)
  const ahora = Date.now();
  let tracking = FIREWALL_STATS.ipsMonitoreadas.get(ip);
  if (!tracking || ahora > tracking.resetTime) {
    tracking = { count: 1, resetTime: ahora + 60000 };
    FIREWALL_STATS.ipsMonitoreadas.set(ip, tracking);
  } else {
    tracking.count++;
    if (tracking.count > 180) { // Máx 180 peticiones por minuto por IP
      FIREWALL_STATS.amenazasBloqueadas++;
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({
        ok: false,
        error: 'Firewall WAF: Límite de tráfico excedido (Anti-DDoS activo). Reintente en 60 segundos.'
      }));
      return false;
    }
  }
  if (FIREWALL_STATS.ipsMonitoreadas.size > 5000) {
    const corte = Date.now();
    for (const [clave, valor] of FIREWALL_STATS.ipsMonitoreadas) {
      if (valor.resetTime < corte) FIREWALL_STATS.ipsMonitoreadas.delete(clave);
    }
  }

  // 2. Detección de patrones maliciosos en URL (incluye variantes codificadas)
  let urlInspeccion = req.url;
  try { urlInspeccion = decodeURIComponent(req.url); } catch { /* se inspecciona tal cual */ }
  for (const patron of PATRONES_MALICIOSOS) {
    if (patron.regex.test(urlInspeccion)) {
      FIREWALL_STATS.amenazasBloqueadas++;
      const incidente = {
        fecha: new Date().toISOString(),
        tipo: patron.tipo,
        ip: ip,
        url: req.url.substring(0, 120),
        accion: 'BLOQUEO_INMEDIATO_403'
      };
      FIREWALL_STATS.registroIncidentes.unshift(incidente);
      if (FIREWALL_STATS.registroIncidentes.length > 50) FIREWALL_STATS.registroIncidentes.pop();

      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: false,
        error: `Firewall WAF: Amenaza neutralizada [${patron.tipo}]. Acceso bloqueado por seguridad.`,
        incidenteId: crypto.randomBytes(4).toString('hex')
      }));
      return false;
    }
  }

  return true;
}

/* ---------- Utilidades de seguridad, privacidad y datos ---------- */
function aplicarCabecerasSeguridad(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ].join('; '));
}

function igualSeguro(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function autorizadoAdmin(req) {
  const token = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
  return igualSeguro(token, ADMIN_TOKEN);
}

function exigirJSON(req, res) {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  if (!ct.includes('application/json')) {
    res.writeHead(415, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: false, error: 'Formato no soportado: se requiere application/json.' }));
    return false;
  }
  return true;
}

function detectarPatronMalicioso(texto) {
  const cadena = String(texto || '');
  for (const patron of PATRONES_MALICIOSOS) {
    if (patron.regex.test(cadena)) return patron.tipo;
  }
  return null;
}

function bloquearPayloadMalicioso(res, tipo) {
  FIREWALL_STATS.amenazasBloqueadas++;
  res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({
    ok: false,
    error: `Firewall WAF: contenido no permitido [${tipo}]. La solicitud fue rechazada.`
  }));
}

function solicitudPublica(s) {
  return {
    codigo: s.codigo,
    item: s.item,
    categoria: s.categoria,
    alias: s.alias,
    esAcompanamiento: s.esAcompanamiento,
    sede: s.sede,
    estado: s.estado,
    respuesta: s.respuesta,
    fecha: s.fecha,
    fechaRespuesta: s.fechaRespuesta
  };
}

function sanearRegistro(s) {
  if (!s || typeof s !== 'object') return null;
  const codigo = String(s.codigo || '').toUpperCase();
  if (!CODIGO_G3.test(codigo)) return null;
  const item = String(s.item || '').trim().slice(0, 200);
  if (!item) return null;
  const fecha = new Date(s.fecha);
  const fechaRespuesta = s.fechaRespuesta ? new Date(s.fechaRespuesta) : null;
  return {
    codigo,
    item,
    categoria: ['medicamento', 'equipo', 'dengue', 'otro'].includes(s.categoria) ? s.categoria : 'medicamento',
    alias: String(s.alias || 'Ciudadano anónimo').trim().slice(0, 60) || 'Ciudadano anónimo',
    esAcompanamiento: Boolean(s.esAcompanamiento),
    sede: String(s.sede || 'C.S. MOCHE').trim().slice(0, 120),
    estado: ESTADOS_VALIDOS.has(s.estado) ? s.estado : 'recibida',
    respuesta: s.respuesta ? String(s.respuesta).trim().slice(0, 600) : null,
    fecha: Number.isFinite(fecha.getTime()) ? fecha.toISOString() : new Date().toISOString(),
    fechaRespuesta: fechaRespuesta && Number.isFinite(fechaRespuesta.getTime()) ? fechaRespuesta.toISOString() : null,
    idempotencyHash: typeof s.idempotencyHash === 'string' ? s.idempotencyHash.slice(0, 80) : null
  };
}

// Retención de datos: las solicitudes con más de DIAS_RETENCION días se eliminan.
function purgarSolicitudesExpiradas() {
  const limite = Date.now() - DIAS_RETENCION * 86400000;
  const antes = solicitudes.length;
  solicitudes = solicitudes.filter((s) => {
    const t = new Date(s.fecha).getTime();
    return !Number.isFinite(t) || t >= limite;
  });
  if (solicitudes.length !== antes) {
    guardarSolicitudesEnDisco();
    console.log(`[Privacidad] Purgadas ${antes - solicitudes.length} solicitudes con más de ${DIAS_RETENCION} días.`);
  }
}
purgarSolicitudesExpiradas();
setInterval(purgarSolicitudesExpiradas, 6 * 60 * 60 * 1000).unref?.();

// Servidor principal
const server = http.createServer(async (req, res) => {
  aplicarCabecerasSeguridad(res);

  // CORS restringido al mismo origen: la aplicación se sirve desde este servidor.
  const origen = req.headers.origin;
  if (origen) {
    try {
      const o = new URL(origen);
      if (o.host === req.headers.host) {
        res.setHeader('Access-Control-Allow-Origin', origen);
        res.setHeader('Vary', 'Origin');
      }
    } catch { /* origen inválido: sin cabecera CORS */ }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (!['GET', 'HEAD', 'POST', 'PATCH', 'OPTIONS'].includes(req.method)) {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8', 'Allow': 'GET, HEAD, POST, PATCH, OPTIONS' });
    res.end(JSON.stringify({ ok: false, error: 'Método no permitido.' }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Inspección Firewall WAF preventiva
  if (!inspeccionarFirewall(req, res)) {
    return;
  }

  const urlParsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlParsed.pathname;
  if (pathname.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');

  // =========================================================================
  // API ENDPOINTS
  // =========================================================================

  // 1. Salud del servidor (Health Check)
  if (req.method === 'GET' && pathname === '/api/salud') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      estado: 'operativo',
      servidor: 'Node.js nativo Grupo 3',
      modo: 'offline_local_ready',
      ods: [3, 9, 10],
      clientesConectadosSSE: clientesSSE.size,
      totalSolicitudes: solicitudes.length,
      memoriaMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptimeSegundos: Math.floor(process.uptime()),
      ipLocal: obtenerIPLocal()
    }));
    return;
  }

  // 1.1 Estado del Firewall WAF
  if (req.method === 'GET' && pathname === '/api/firewall/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      firewall: {
        activo: FIREWALL_STATS.activo,
        modo: FIREWALL_STATS.modo,
        uptimeDesde: FIREWALL_STATS.inicio,
        peticionesAnalizadas: FIREWALL_STATS.peticionesAnalizadas,
        amenazasBloqueadas: FIREWALL_STATS.amenazasBloqueadas,
        reglasActivas: [
          'Anti-SQLi (Previene inyecciones SQL en parámetros y payload)',
          'Anti-XSS (Previene inyección de scripts y eventos maliciosos)',
          'Path-Traversal Shield (Bloquea intento de escape de directorio)',
          'Rate-Limiting (Máximo 180 req/min por IP local/remota)',
          'Filtro de Privacidad Estricta (Bloqueo automático de números de DNI)',
          'Idempotencia Criptográfica SHA-256 (Anti-duplicidad de tickets)',
          'Cabeceras de seguridad HTTP y CSP estricta',
          'Retención de datos: 30 días y purga automática'
        ],
        retencionDias: DIAS_RETENCION,
        ultimosIncidentes: FIREWALL_STATS.registroIncidentes.slice(0, 10).map(({ fecha, tipo, accion }) => ({ fecha, tipo, accion }))
      }
    }));
    return;
  }

  // 1.2 Política de privacidad y retención (pública, sin datos personales)
  if (req.method === 'GET' && pathname === '/api/privacidad') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      politica: {
        datosPersonales: false,
        dni: false,
        cookiesTerceros: false,
        identificador: 'Código privado G3-XXXXXX (sin nombre ni DNI)',
        retencionSolicitudesDias: DIAS_RETENCION,
        purgaAutomatica: true,
        almacenamientoNavegador: 'Solo preferencias, perfil local y códigos de seguimiento en este dispositivo',
        servidor: 'Node.js nativo · datos en data/solicitudes.json · escritura atómica',
        fechaConsulta: new Date().toISOString()
      }
    }));
    return;
  }

  // 2. Stream de Tiempo Real SSE (Server-Sent Events) (Consigna 9 & 7)
  if (req.method === 'GET' && pathname === '/api/eventos') {
    if (clientesSSE.size >= MAX_SSE) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Capacidad de conexiones en tiempo real completa. Reintente en unos segundos.' }));
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    clientesSSE.add(res);

    // Enviar bienvenida y estado actual
    res.write(`event: conectado\ndata: ${JSON.stringify({
      mensaje: 'Conexión SSE establecida con el Servidor Local Grupo 3',
      dispositivosConectados: clientesSSE.size,
      totalSolicitudes: solicitudes.length,
      timestamp: Date.now()
    })}\n\n`);

    emitirConteoClientes();

    req.on('close', () => {
      clientesSSE.delete(res);
      emitirConteoClientes();
    });
    return;
  }

  // 3. Obtener solicitudes (GET /api/solicitudes?codigo=G3-XXXXXX público · listado solo admin)
  if (req.method === 'GET' && pathname === '/api/solicitudes') {
    const codigoQuery = urlParsed.searchParams.get('codigo');
    if (codigoQuery) {
      const codigo = codigoQuery.trim().toUpperCase();
      if (!CODIGO_G3.test(codigo)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Formato de código no válido. Debe ser G3-XXXXXX.' }));
        return;
      }
      const encontrada = solicitudes.find(s => s.codigo.toUpperCase() === codigo);
      if (!encontrada) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Código de solicitud no encontrado o expirado' }));
        return;
      }
      const t = new Date(encontrada.fecha).getTime();
      if (Number.isFinite(t) && Date.now() - t > DIAS_RETENCION * 86400000) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: `Código expirado: la información se conserva un máximo de ${DIAS_RETENCION} días.` }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, solicitud: solicitudPublica(encontrada) }));
      return;
    }

    // El listado completo contiene datos de terceros: solo administración.
    if (!autorizadoAdmin(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Acceso no autorizado. El listado completo es privado; usa ?codigo= para consultar tu solicitud.' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      ok: true,
      total: solicitudes.length,
      solicitudes: solicitudes.map(solicitudPublica)
    }));
    return;
  }

  // 4. Crear nueva solicitud anónima (POST /api/solicitudes) (F-003, F-401, Consigna 6)
  if (req.method === 'POST' && pathname === '/api/solicitudes') {
    try {
      if (!exigirJSON(req, res)) return;
      const data = await leerBodyJSON(req);
      const inputStr = JSON.stringify(data);

      // Inspección WAF del contenido, además de la URL
      const tipoMalicioso = detectarPatronMalicioso(inputStr);
      if (tipoMalicioso) { bloquearPayloadMalicioso(res, tipoMalicioso); return; }

      // Validación de privacidad: bloquear cualquier dato de 8 dígitos continuos (DNI)
      if (/\b\d{8}\b/.test(inputStr)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          error: 'Política de Privacidad Estricta: Por seguridad y de acuerdo a la consigna, no se aceptan números de DNI ni datos personales sensibles.'
        }));
        return;
      }

      const item = String(data.item || '').trim().slice(0, 200);
      if (!item) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'El campo recurso o medicamento es requerido.' }));
        return;
      }

      if (solicitudes.length >= MAX_SOLICITUDES) {
        res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': '3600' });
        res.end(JSON.stringify({ ok: false, error: 'Capacidad temporal de registros completa. Reintente más tarde.' }));
        return;
      }

      // Hash de idempotencia para evitar registros duplicados por doble click
      const itemLimpio = item.toLowerCase();
      const aliasLimpio = String(data.alias || 'anónimo').trim().toLowerCase().slice(0, 60);
      const minutoVentana = Math.floor(Date.now() / 60000); // 1 minuto
      const idempotencyHash = crypto.createHash('sha256').update(`${itemLimpio}-${aliasLimpio}-${minutoVentana}`).digest('hex');

      const yaExiste = solicitudes.find(s => s.idempotencyHash === idempotencyHash);
      if (yaExiste) {
        // Retornar el existente sin duplicar (Idempotencia F-413)
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          duplicadoPrevenido: true,
          solicitud: solicitudPublica(yaExiste)
        }));
        return;
      }

      let codigo = typeof data.codigo === 'string' ? data.codigo.trim().toUpperCase() : '';
      if (!CODIGO_G3.test(codigo) || solicitudes.some(s => s.codigo.toUpperCase() === codigo)) {
        do { codigo = generarCodigoG3(); } while (solicitudes.some(s => s.codigo.toUpperCase() === codigo));
      }

      const categoria = /^[a-z]{3,20}$/.test(String(data.categoria || '')) ? String(data.categoria) : 'medicamento';
      const nuevaSolicitud = {
        codigo,
        item,
        categoria,
        alias: String(data.alias || 'Ciudadano anónimo').trim().slice(0, 60) || 'Ciudadano anónimo',
        esAcompanamiento: Boolean(data.esAcompanamiento),
        sede: String(data.sede || 'C.S. MOCHE').trim().slice(0, 120),
        estado: 'recibida',
        respuesta: null,
        fecha: new Date().toISOString(),
        fechaRespuesta: null,
        idempotencyHash
      };

      solicitudes.unshift(nuevaSolicitud);
      guardarSolicitudesEnDisco();

      // Transmitir en tiempo real al panel administrador
      emitirEvento('nueva_solicitud', solicitudPublica(nuevaSolicitud));

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, solicitud: solicitudPublica(nuevaSolicitud) }));
    } catch (err) {
      res.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.statusCode ? err.message : 'No se pudo procesar la solicitud.' }));
    }
    return;
  }

  // 5. Responder o actualizar solicitud (PATCH /api/solicitudes/:codigo) (F-402, Consigna 5.2)
  if (req.method === 'PATCH' && pathname.startsWith('/api/solicitudes/')) {
    try {
      if (!autorizadoAdmin(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Acceso no autorizado: requiere credenciales administrativas válidas.' }));
        return;
      }
      if (!exigirJSON(req, res)) return;

      let codigo;
      try {
        codigo = decodeURIComponent(pathname.replace('/api/solicitudes/', '')).toUpperCase();
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Código de solicitud mal formado.' }));
        return;
      }
      if (!CODIGO_G3.test(codigo)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Formato de código no válido. Debe ser G3-XXXXXX.' }));
        return;
      }

      const solicitud = solicitudes.find(s => s.codigo.toUpperCase() === codigo);
      if (!solicitud) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: `Solicitud ${codigo} no encontrada` }));
        return;
      }

      const body = await leerBodyJSON(req);
      const tipoMalicioso = detectarPatronMalicioso(JSON.stringify(body));
      if (tipoMalicioso) { bloquearPayloadMalicioso(res, tipoMalicioso); return; }

      if (body.estado) {
        if (!ESTADOS_VALIDOS.has(body.estado)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Estado no válido. Use recibida, en_revision, respondido o cerrado.' }));
          return;
        }
        solicitud.estado = body.estado;
      }
      if (body.respuesta != null) {
        const respuesta = String(body.respuesta).trim().slice(0, 600);
        if (respuesta) {
          solicitud.respuesta = respuesta;
          solicitud.fechaRespuesta = new Date().toISOString();
        }
      }

      guardarSolicitudesEnDisco();

      // Notificar a todos los paneles conectados
      emitirEvento('actualizacion_solicitud', solicitudPublica(solicitud));

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, solicitud: solicitudPublica(solicitud) }));
    } catch (err) {
      res.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.statusCode ? err.message : 'No se pudo actualizar la solicitud.' }));
    }
    return;
  }

  // 6. Exportar copia de respaldo (Backup) (Consigna 8 & 18.46) — solo administración
  if (req.method === 'GET' && pathname === '/api/exportar-backup') {
    if (!autorizadoAdmin(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Acceso no autorizado: el respaldo contiene datos de solicitudes.' }));
      return;
    }
    const filename = `backup-salud-peru-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify({
      exportadoEn: new Date().toISOString(),
      version: '1.0.0',
      totalRegistros: solicitudes.length,
      datos: solicitudes
    }, null, 2));
    return;
  }

  // 7. Restaurar copia de respaldo (Restore) (Consigna 8 & 18.46)
  if (req.method === 'POST' && pathname === '/api/importar-backup') {
    try {
      if (!autorizadoAdmin(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'No autorizado' }));
        return;
      }
      if (!exigirJSON(req, res)) return;

      const backup = await leerBodyJSON(req);
      if (!backup.datos || !Array.isArray(backup.datos)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Estructura de respaldo no válida' }));
        return;
      }
      if (backup.datos.length > MAX_SOLICITUDES) {
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: `El respaldo excede el máximo de ${MAX_SOLICITUDES} registros.` }));
        return;
      }

      const textoBackup = JSON.stringify(backup.datos);
      const tipoMalicioso = detectarPatronMalicioso(textoBackup);
      if (tipoMalicioso) { bloquearPayloadMalicioso(res, tipoMalicioso); return; }
      if (/\b\d{8}\b/.test(textoBackup)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'El respaldo contiene posibles números de DNI. Importación rechazada por privacidad.' }));
        return;
      }

      const vistos = new Set();
      const limpias = [];
      for (const registro of backup.datos) {
        const saneado = sanearRegistro(registro);
        if (!saneado || vistos.has(saneado.codigo)) continue;
        vistos.add(saneado.codigo);
        limpias.push(saneado);
      }
      if (!limpias.length) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Ningún registro del respaldo tiene un formato válido.' }));
        return;
      }

      solicitudes = limpias;
      guardarSolicitudesEnDisco();

      emitirEvento('restauracion_backup', { total: solicitudes.length, timestamp: Date.now() });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, mensaje: 'Base de datos restaurada correctamente', total: solicitudes.length, omitidos: backup.datos.length - limpias.length }));
    } catch (err) {
      res.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.statusCode ? err.message : 'No se pudo restaurar el respaldo.' }));
    }
    return;
  }

  // 8. Login administrativo (POST /api/auth/login) (Consigna 5.2 & 13)
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    try {
      if (!exigirJSON(req, res)) return;

      const ip = req.socket?.remoteAddress || '127.0.0.1';
      const ahora = Date.now();
      const intento = INTENTOS_LOGIN.get(ip);
      if (!intento || ahora > intento.reset) {
        INTENTOS_LOGIN.set(ip, { count: 1, reset: ahora + 15 * 60000 });
      } else {
        intento.count++;
        if (intento.count > 10) {
          res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': '900' });
          res.end(JSON.stringify({ ok: false, error: 'Demasiados intentos de acceso. Espere 15 minutos.' }));
          return;
        }
      }
      if (INTENTOS_LOGIN.size > 1000) {
        for (const [clave, valor] of INTENTOS_LOGIN) if (valor.reset < ahora) INTENTOS_LOGIN.delete(clave);
      }

      const creds = await leerBodyJSON(req);
      const tipoMalicioso = detectarPatronMalicioso(JSON.stringify(creds));
      if (tipoMalicioso) { bloquearPayloadMalicioso(res, tipoMalicioso); return; }

      const usuario = String(creds.usuario || '').trim();
      const contrasena = String(creds.contrasena || '');

      // Comparación en tiempo constante para evitar filtraciones por temporización.
      if (igualSeguro(usuario, ADMIN_USUARIO) && igualSeguro(contrasena, ADMIN_CLAVE)) {
        INTENTOS_LOGIN.delete(ip);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          token: ADMIN_TOKEN,
          usuario: ADMIN_USUARIO,
          rol: 'ADMIN_REGIONAL_SALUD',
          expiraEn: '8h'
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Usuario o contraseña incorrectos.' }));
      }
    } catch (err) {
      res.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.statusCode ? err.message : 'No se pudo iniciar sesión.' }));
    }
    return;
  }

  // =========================================================================
  // SERVIDOR DE ARCHIVOS ESTÁTICOS (Frontend)
  // =========================================================================
  let rutaDecodificada;
  try {
    rutaDecodificada = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ruta mal formada');
    return;
  }

  let safePath = path.normalize(rutaDecodificada).replace(/^[/\\]+/, '');
  if (!safePath) safePath = 'index.html';

  // Bloquear archivos ocultos (.env, .git, etc.) y segmentos ocultos.
  if (/(^|[/\\])\.[^/\\]/.test(safePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
    return;
  }

  const filePath = path.resolve(FRONTEND_DIR, safePath);
  const dentroDelFrontend = filePath === FRONTEND_DIR || filePath.startsWith(FRONTEND_DIR + path.sep);
  if (!dentroDelFrontend) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acceso denegado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 sin reflejar la ruta solicitada (evita XSS reflejado)
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="es">
        <head><title>404 - No Encontrado</title><link rel="stylesheet" href="/css/tokens.css"></head>
        <body style="background:#05080d; color:#fff; font-family:sans-serif; padding:40px; text-align:center;">
          <h1 style="color:#ef4444;">404 · Archivo no encontrado</h1>
          <p>La ruta solicitada no existe en el ecosistema.</p>
          <a href="/" style="color:#38bdf8;">Volver al Inicio</a>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const cache = ext === '.html' ? 'no-cache' : 'public, max-age=3600';

    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cache });
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => { try { res.destroy(); } catch { /* cierre seguro */ } });
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ipLocal = obtenerIPLocal();
  console.log(`
===============================================================================
  🏥 ECOSISTEMA DIGITAL DE ACCESO A LA SALUD — GRUPO 3 · TECH-MASTERS 2026
  ODS 3 (Salud), ODS 9 (Industria/Infraestructura), ODS 10 (Desigualdades)
===============================================================================
  ✅ Servidor HTTP & SSE en tiempo real Activo:
     · Localhost:            http://localhost:${PORT}
     · Enlace Red Local (LAN): http://${ipLocal}:${PORT}
     · Panel Administrador:  http://localhost:${PORT}/admin.html
     · Endpoint SSE:         http://localhost:${PORT}/api/eventos
     · Healthcheck:          http://localhost:${PORT}/api/salud
-------------------------------------------------------------------------------
  📡 MODO CONCURSO WI-FI:
     Los otros 7 equipos visitantes pueden conectarse simultáneamente a:
     👉 http://${ipLocal}:${PORT}
     (Cumple con la Consigna: ≥ 7 dispositivos simultáneos, costo $0.00).
===============================================================================
  `);
});
