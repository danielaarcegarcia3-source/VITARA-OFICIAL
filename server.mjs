/**
 * backend/server.mjs — Servidor HTTP y SSE en tiempo real
 * Ecosistema Digital de Acceso a la Salud · Grupo 3 · Club Tech-Masters 2026
 *
 * Características:
 * · 100% nativo en Node.js (cero dependencias de pago, costo $0.00).
 * · Comunicación en tiempo real con Server-Sent Events (SSE).
 * · Concurrencia verificable con clientes automatizados; validar siete dispositivos físicos en la LAN.
 * · Persistencia en disco (solicitudes.json) con escritura atómica.
 * · Prevención de duplicados (idempotencia) y validación de privacidad (sin DNI).
 * · Procedimiento de respaldo y recuperación (backup/restore JSON).
 * · Funciones principales locales sin WAN; enlaces y proveedor de IA requieren Internet.
 */

import http from 'node:http';
import { createServices } from './server-services.mjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const FRONTEND_DIR = ROOT_DIR;
// Almacenamiento privado vacío por defecto. La base histórica de raíz no se importa automáticamente.
const DATA_FILE = path.resolve(process.env.VITARA_REQUESTS_FILE || path.join(process.env.VITARA_DATA_DIR || path.join(ROOT_DIR, 'data'), 'solicitudes.json'));
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true, mode: 0o700 });

const PORT = process.env.PORT || 3000;
const services = createServices({ root: ROOT_DIR });
const DIAS_RETENCION = Number(process.env.DIAS_RETENCION || 30);
const MAX_SOLICITUDES = 5000;
const MAX_SSE = 80;
const ESTADOS_VALIDOS = new Set(['recibida', 'en_revision', 'respondido', 'cerrado']);
const CODIGO_G3 = /^G3-[A-Z0-9]{6}$/;
if (!Number.isInteger(DIAS_RETENCION) || DIAS_RETENCION < 1 || DIAS_RETENCION > 30) throw new Error('DIAS_RETENCION debe estar entre 1 y 30.');
// Autorizar únicamente scripts inline conocidos; no aceptar handlers HTML arbitrarios.
const INLINE_HASHES = ['index.html', 'admin.html'].flatMap(name => [...fs.readFileSync(path.join(ROOT_DIR, name), 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].filter(match => match[1].trim()).map(match => `'sha256-${crypto.createHash('sha256').update(match[1]).digest('base64')}'`));

// Asegurar directorio data y archivo de almacenamiento inicial
if (!fs.existsSync(path.join(ROOT_DIR, 'data'))) {
  fs.mkdirSync(path.join(ROOT_DIR, 'data'), { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  const seedInicial = []; // Sin solicitudes inventadas al crear un almacenamiento nuevo.
  fs.writeFileSync(DATA_FILE, JSON.stringify(seedInicial, null, 2), { mode: 0o600 });
}

// Fallar cerrado si el disco está corrupto; nunca sustituir registros silenciosamente.
let solicitudes = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
if (!Array.isArray(solicitudes)) throw new Error('Almacenamiento de solicitudes inválido. Recupera un respaldo privado.');
function guardarSolicitudesEnDisco(next = solicitudes) {
  const tempFile = `${DATA_FILE}.tmp.${crypto.randomBytes(8).toString('hex')}`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(next, null, 2), { mode: 0o600 });
    fs.renameSync(tempFile, DATA_FILE);
    solicitudes = next; // Cambiar memoria solo después de confirmar la escritura.
  } catch (err) {
    fs.rmSync(tempFile, { force: true });
    throw err;
  }
}

// Manejador de Clientes SSE (Server-Sent Events)
const clientesSSE = new Set();

function emitirEvento(tipo, datos) {
  const payload = `event: ${tipo}\ndata: ${JSON.stringify(datos)}\n\n`;
  for (const res of clientesSSE) {
    try {
      if (res.writableLength > 256 * 1024) { res.destroy(); clientesSSE.delete(res); } else res.write(payload);
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
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.gif': 'image/gif',
  '.geojson': 'application/geo+json; charset=utf-8'
};

// Generador de código G3-XXXXXX (F-003)
function generarCodigoG3() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'G3-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
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
        reject(err);
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const value = body ? JSON.parse(body) : {};
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Objeto JSON requerido');
        resolve(value);
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
  modo: 'FILTRO_APLICATIVO_BASICO',
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
  // Un acceso descarga decenas de activos: no compartir su presupuesto con las API.
  // El proxy de la vista previa puede representar a varios visitantes con una sola IP.
  const isAPI = /^\/api(?:\/|\?|$)/.test(req.url);
  const limit = isAPI ? 180 : 1800;
  const bucket = `${ip}:${isAPI ? 'api' : 'assets'}`;
  let tracking = FIREWALL_STATS.ipsMonitoreadas.get(bucket);
  if (!tracking || ahora > tracking.resetTime) {
    tracking = { count: 1, resetTime: ahora + 60000 };
    FIREWALL_STATS.ipsMonitoreadas.set(bucket, tracking);
  } else {
    tracking.count++;
    if (tracking.count > limit) { // Presupuestos independientes por IP y tipo de recurso
      FIREWALL_STATS.amenazasBloqueadas++;
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify({
        ok: false,
        error: 'Límite de tráfico de la aplicación excedido. Reintente en 60 segundos.'
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
        accion: 'BLOQUEO_INMEDIATO_403'
      };
      FIREWALL_STATS.registroIncidentes.unshift(incidente);
      if (FIREWALL_STATS.registroIncidentes.length > 50) FIREWALL_STATS.registroIncidentes.pop();

      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: false,
        error: `Filtro de aplicación: patrón bloqueado [${patron.tipo}]. Acceso bloqueado por seguridad.`,
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
  // Embedding is restricted by CSP to this application and the preview host.
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'wasm-unsafe-eval' ${[...new Set(INLINE_HASHES)].join(' ')}`,
    "connect-src 'self' blob:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'self' https://arena.ai https://*.arena.ai https://*.e2b.app",
    "form-action 'self'"
  ].join('; '));
}

function igualSeguro(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function autorizadoAdmin(req) { return services.isAdmin(req); }

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
  const vigentes = solicitudes.filter((s) => {
    const t = new Date(s.fecha).getTime();
    return !Number.isFinite(t) || t >= limite;
  });
  if (vigentes.length !== antes) {
    guardarSolicitudesEnDisco(vigentes);
    console.log(`[Privacidad] Purgadas ${antes - solicitudes.length} solicitudes con más de ${DIAS_RETENCION} días.`);
  }
}
purgarSolicitudesExpiradas();
setInterval(() => { try { purgarSolicitudesExpiradas(); } catch { console.error('No se pudo completar la retención; revisar almacenamiento.'); } }, 6 * 60 * 60 * 1000).unref?.();

// Servidor principal
const server = http.createServer(async (req, res) => {
  aplicarCabecerasSeguridad(res);

  // Rechazar orígenes ajenos antes de cualquier ruta, incluidas las administrativas.
  // Los tokens viajan en Authorization, nunca en URL ni en cookies implícitas.
  const origen = req.headers.origin;
  if (origen) {
    let permitido = false;
    try { const o = new URL(origen); permitido = ['http:', 'https:'].includes(o.protocol) && o.host === req.headers.host; } catch {}
    if (!permitido) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'Origen no autorizado.' })); return;
    }
    res.setHeader('Access-Control-Allow-Origin', origen);
    res.setHeader('Vary', 'Origin');
  }
  const methods = 'GET, HEAD, POST, PATCH, DELETE, OPTIONS';
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (!methods.split(', ').includes(req.method)) {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8', Allow: methods });
    res.end(JSON.stringify({ ok: false, error: 'Método no permitido.' })); return;
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

  let urlParsed;
  try { urlParsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`); } catch { res.writeHead(400); res.end('Ruta no válida'); return; }
  const pathname = urlParsed.pathname;
  if (pathname.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  if (await services.handle(req, res, pathname)) return;

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
      uptimeSegundos: Math.floor(process.uptime())
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
          'Filtro de patrones SQL en URL y solicitudes; el backend usa JSON, no SQL',
          'Validación de entradas, escape de salida y CSP con hashes de scripts',
          'Path-Traversal Shield (Bloquea intento de escape de directorio)',
          'Rate-Limiting por IP (180 API/min y 1800 activos/min; límites adicionales por operación)',
          'Rechazo de secuencias de 8 dígitos en solicitudes; no detecta todos los datos sensibles',
          'Idempotencia Criptográfica SHA-256 (Anti-duplicidad de tickets)',
          'Cabeceras de seguridad HTTP y CSP; estilos inline permitidos',
          'Retención de datos: 30 días y purga automática'
        ],
        retencionDias: DIAS_RETENCION,
        alcance: 'Filtro HTTP de la aplicación, no firewall del sistema operativo ni protección DDoS de red.',
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
        datosPersonales: true,
        dni: false,
        cookiesTerceros: false,
        identificador: 'Código privado G3-XXXXXX (sin nombre ni DNI)',
        retencionSolicitudesDias: DIAS_RETENCION,
        purgaAutomatica: true,
        almacenamientoNavegador: 'Preferencias, perfil y clave de acceso de este dispositivo; perfil y actividad solo se sincronizan con consentimiento',
        servidor: 'Node.js · solicitudes separadas de perfiles consentidos · escritura atómica',
        perfiles: 'Nombre, correo, rol, territorio opcional y actividad: máximo 7 perfiles, retención 30 días, eliminación desde el perfil o administración',
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
      if (/\b\d{8,}\b|[^\s@]+@[^\s@]+\.[^\s@]+/.test([data.item, data.alias, data.sede].filter(Boolean).join(' '))) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: false,
          error: 'Política de Privacidad Estricta: Por seguridad y de acuerdo a la consigna, no se aceptan números de DNI ni datos personales sensibles.'
        }));
        return;
      }

      if (/[<>\u0000-\u001f]/.test([data.item, data.alias, data.sede].filter(Boolean).join(''))) { res.writeHead(400); res.end(JSON.stringify({ ok: false, error: 'Usa texto sin etiquetas HTML ni caracteres de control.' })); return; }
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

      // Una clave aleatoria por envío/reintento evita unir solicitudes de visitantes distintos.
      // No deduplicar por contenido/alias: permitiría recuperar el código privado de otra persona.
      const clientKey = String(data.idempotencyKey || '');
      if (clientKey && !/^[a-f0-9-]{36}$/i.test(clientKey)) { res.writeHead(400); res.end(JSON.stringify({ ok: false, error: 'Clave de reintento no válida.' })); return; }
      const idempotencyHash = crypto.createHash('sha256').update(clientKey || crypto.randomUUID()).digest('hex');

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

      let codigo = ''; // Los códigos privados los genera exclusivamente el servidor.
      if (!CODIGO_G3.test(codigo) || solicitudes.some(s => s.codigo.toUpperCase() === codigo)) {
        do { codigo = generarCodigoG3(); } while (solicitudes.some(s => s.codigo.toUpperCase() === codigo));
      }

      const categoria = ['medicamento', 'equipo', 'dengue', 'otro'].includes(data.categoria) ? data.categoria : 'medicamento';
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

      guardarSolicitudesEnDisco([nuevaSolicitud, ...solicitudes]);

      // Transmitir en tiempo real al panel administrador
      emitirEvento('nueva_solicitud', { changed: true, timestamp: Date.now() });

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

      const original = solicitudes.find(s => s.codigo.toUpperCase() === codigo);
      const solicitud = original ? { ...original } : null;
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
      if (/\b\d{8,}\b|[^\s@]+@[^\s@]+\.[^\s@]+/.test(String(body.respuesta || ''))) { res.writeHead(400); res.end(JSON.stringify({ ok: false, error: 'No incluyas documentos ni correos en las respuestas.' })); return; }
      if (body.respuesta != null) {
        const respuesta = String(body.respuesta).trim().slice(0, 600);
        if (respuesta) {
          solicitud.respuesta = respuesta;
          solicitud.fechaRespuesta = new Date().toISOString();
        }
      }

      guardarSolicitudesEnDisco(solicitudes.map(s => s.codigo === codigo ? solicitud : s));

      // Notificar a todos los paneles conectados
      emitirEvento('actualizacion_solicitud', { changed: true, timestamp: Date.now() });

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
      if (/\b\d{8,}\b|[^\s@]+@[^\s@]+\.[^\s@]+/.test(backup.datos.map(s => [s?.item, s?.alias, s?.sede, s?.respuesta].filter(Boolean).join(' ')).join(' '))) {
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

      guardarSolicitudesEnDisco(limpias);

      emitirEvento('restauracion_backup', { total: solicitudes.length, timestamp: Date.now() });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, mensaje: 'Base de datos restaurada correctamente', total: solicitudes.length, omitidos: backup.datos.length - limpias.length }));
    } catch (err) {
      res.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.statusCode ? err.message : 'No se pudo restaurar el respaldo.' }));
    }
    return;
  }

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

  if (/^(?:node_modules|src|scripts|tests|data|logs)(?:[/\\]|$)/.test(safePath) || /(?:^|[/\\])(?:server(?:-services)?\.mjs|solicitudes\.json(?:\.tmp\.[0-9]+)?|catalog\.js|package(?:-lock)?\.json|.*\.rules|.*\.py)$/.test(safePath)) {
    res.writeHead(404); res.end('No encontrado'); return;
  }
  const publicExt = new Set(['.html','.css','.js','.svg','.png','.jpg','.jpeg','.ico','.woff2','.glb','.gltf','.bin','.wasm','.mp4','.gif','.geojson']);
  const nested = safePath.includes(path.sep);
  const publicFolder = /^(?:assets|vendor|3d-models)[/\\]/.test(safePath);
  const licenseFile = ['license.txt', 'CREDITOS.txt'].includes(safePath) || (publicFolder && /(?:LICENSE[^/\\]*\.txt|README\.md)$/i.test(safePath));
  if ((nested && !publicFolder) || !(publicExt.has(path.extname(safePath)) || safePath === 'assets-manifest.json' || licenseFile) || path.resolve(FRONTEND_DIR, safePath) === DATA_FILE) {
    res.writeHead(404); res.end('No encontrado'); return;
  }
  const filePath = path.resolve(FRONTEND_DIR, safePath);
  const dentroDelFrontend = filePath === FRONTEND_DIR || filePath.startsWith(FRONTEND_DIR + path.sep);
  if (!dentroDelFrontend) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acceso denegado');
    return;
  }

  let realFile;
  try { realFile = fs.realpathSync(filePath); } catch { realFile = filePath; }
  if (!realFile.startsWith(FRONTEND_DIR + path.sep) || realFile === DATA_FILE || /[/\\]data[/\\]/.test(realFile.slice(FRONTEND_DIR.length))) { res.writeHead(404); res.end('No encontrado'); return; }
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
    const cache = ['.html', '.js', '.css', '.json'].includes(ext) ? 'no-cache' : 'public, max-age=3600';

    const headers = { 'Content-Type': contentType, 'Cache-Control': cache, 'Accept-Ranges': 'bytes' };
    let start = 0, end = stats.size - 1, status = 200;
    if (req.headers.range && stats.size > 0) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` }); res.end(); return; }
      start = match[1] ? Number(match[1]) : Math.max(0, stats.size - Number(match[2]));
      end = match[1] && match[2] ? Math.min(Number(match[2]), stats.size - 1) : stats.size - 1;
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stats.size) { res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` }); res.end(); return; }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stats.size}`;
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    res.writeHead(status, headers);
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = fs.createReadStream(filePath, stats.size ? { start, end } : {});
    stream.on('error', () => { try { res.destroy(); } catch { /* cierre seguro */ } });
    stream.pipe(res);
  });
});

server.headersTimeout = 15000;
server.requestTimeout = 30000;
server.maxHeadersCount = 100;

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
     (Meta: probar ≥ 7 dispositivos físicos; no confundir con clientes automatizados).
===============================================================================
  `);
});
