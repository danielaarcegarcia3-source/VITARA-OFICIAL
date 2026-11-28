import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createGoogleAuth } from './google-auth.mjs';
import { localKnowledge } from './orientation-knowledge.mjs';

const VIEWS = new Set(['inicio','buscar','tablero','mapas','planos','equipos','solicitudes','canales','comunidad','fuentes','tecnologia']);
const DETAILS = new Set(['hospital','or','vr','peru','ll','blanco','editorial','local','ia']);
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const equal = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
function error(status, message) { return Object.assign(new Error(message), { status }); }
function clean(value, max = 80) { const text = String(value || '').trim().replace(/\s+/g, ' '); if (text.length > max || /[<>\u0000-\u001f]/.test(text)) throw error(400, 'Un campo contiene caracteres no permitidos o es demasiado largo.'); return text; }
async function readJSON(req) {
  if (req.vitaraBody !== undefined) return req.vitaraBody;
  if (!String(req.headers['content-type']).includes('application/json')) throw error(415, 'Se requiere JSON.');
  let text = '', size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 16384) throw error(413, 'Solicitud demasiado grande.'); text += chunk; }
  try { const value = JSON.parse(text || '{}'); if (!value || typeof value !== 'object' || Array.isArray(value)) throw error(400, 'Objeto JSON requerido.'); return value; } catch { throw error(400, 'JSON inválido.'); }
}
export function createServices({ root, onParticipationChange = () => {}, persistence = null }) {
  const google = createGoogleAuth();
  const dir = path.resolve(process.env.VITARA_DATA_DIR || path.join(root, 'data'));
  if (!persistence) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, 'participacion.json');
  let state = persistence ? persistence.current('participation') : fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { version: 1, admin: null, profiles: [] };
  if (state.version !== 1 || !Array.isArray(state.profiles)) throw new Error('El almacenamiento de participación requiere revisión. No se ha sobrescrito.');
  const sessions = new Map(), limits = new Map();
  const RETENTION = 30 * 86400000, MAX = 7;
  const envAuth = !!(process.env.ADMIN_USUARIO && process.env.ADMIN_CLAVE);
  if (envAuth && (process.env.ADMIN_CLAVE.length < 12 || process.env.ADMIN_CLAVE.length > 128)) throw new Error('ADMIN_CLAVE requiere de 12 a 128 caracteres.');
  if (process.env.ADMIN_TOKEN && process.env.ADMIN_TOKEN.length < 32) throw new Error('ADMIN_TOKEN requiere al menos 32 caracteres aleatorios.');
  async function save(next) {
    if (persistence) {
      await persistence.save('participation', next);
      const changed = next.profiles !== state.profiles; state = next;
      if (changed) onParticipationChange();
      return;
    }
    const temporary = file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
    fs.renameSync(temporary, file);
    const changed = next.profiles !== state.profiles; state = next;
    if (changed) onParticipationChange();
  }
  async function prune() { const profiles = state.profiles.filter(p => Date.parse(p.updatedAt) > Date.now() - RETENTION); if (profiles.length !== state.profiles.length) await save({ ...state, profiles }); }
  if (!persistence) {
    prune().catch(() => console.error('No se pudo completar la retención de perfiles.'));
    const timer = setInterval(() => prune().catch(() => console.error('No se pudo completar la retención de perfiles.')), 3600000); timer.unref();
  }
  function rate(req, kind, max, windowMs = 60000) {
    const key = `${kind}:${req.socket.remoteAddress}`; const now = Date.now();
    let entry = limits.get(key); if (!entry || now >= entry.reset) { entry = { count: 0, reset: now + windowMs }; limits.set(key, entry); }
    if (++entry.count > max) throw error(429, 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.');
    if (limits.size > 2000) for (const [k,v] of limits) if (v.reset < now) limits.delete(k);
  }
  function bearer(req) { return String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''); }
  function isAdmin(req) {
    const token = bearer(req);
    if (process.env.ADMIN_TOKEN && equal(token, process.env.ADMIN_TOKEN)) return true;
    const expiry = sessions.get(hash(token));
    if (!expiry) return false;
    if (expiry < Date.now()) { sessions.delete(hash(token)); return false; }
    return true;
  }
  function requireAdmin(req) { if (!isAdmin(req)) throw error(401, 'Inicia sesión como administrador.'); }
  function profileFor(req) {
    const token = bearer(req); const profile = state.profiles.find(p => equal(p.tokenHash, hash(token)) && Date.parse(p.tokenExpires) > Date.now());
    if (!profile) throw error(401, 'El acceso de este dispositivo expiró o no existe.'); return profile;
  }
  function publicProfile(p) { const { tokenHash, tokenExpires, googleSub, ...safe } = p; return safe; }
  const aiConfigured = () => !!(process.env.VITARA_AI_ENDPOINT && process.env.VITARA_AI_MODEL && process.env.VITARA_AI_KEY);
  function reply(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
  async function handle(req, res, pathname) {
    if (await google.handle(req,res,new URL(req.url,'http://vitara.local'))) return true;
    const routes = ['/api/admin/estado','/api/admin/configurar','/api/auth/login','/api/auth/logout','/api/admin/usuarios','/api/perfiles','/api/perfil','/api/perfil/interacciones','/api/orientacion','/api/orientacion/estado'];
    if (!routes.includes(pathname) && !pathname.startsWith('/api/admin/usuarios/')) return false;
    try {
      if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.headers.origin) {
        const origin = new URL(req.headers.origin).host;
        if (origin !== req.headers.host) throw error(403, 'Origen no autorizado.');
      }
      if (pathname === '/api/admin/estado' && req.method === 'GET') {
        reply(res, 200, { setupRequired: !envAuth && !state.admin, setupEnabled: !!process.env.VITARA_SETUP_KEY && !envAuth && !state.admin && process.env.DISABLE_ADMIN_SETUP !== '1', configured: envAuth || !!state.admin }); return true;
      }
      if (pathname === '/api/admin/configurar' && req.method === 'POST') {
        rate(req, 'setup', 5, 900000);
        if (envAuth || state.admin || process.env.DISABLE_ADMIN_SETUP === '1') throw error(403, 'La configuración inicial está cerrada.');
        const body = await readJSON(req);
        if (!process.env.VITARA_SETUP_KEY || !equal(String(body.setupKey || ''), process.env.VITARA_SETUP_KEY)) throw error(403, 'Se requiere la clave de configuración definida por quien opera el servidor.');
        const username = clean(body.usuario, 60); const password = String(body.contrasena || '');
        if (username.length < 3 || password.length < 12 || password.length > 128) throw error(400, 'Usa un usuario de al menos 3 caracteres y una contraseña de 12 a 128 caracteres.');
        const salt = crypto.randomBytes(16).toString('hex');
        await save({ ...state, admin: { username, salt, passwordHash: crypto.scryptSync(password, salt, 64).toString('hex') } });
        reply(res, 201, { ok: true }); return true;
      }
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        rate(req, 'admin-login', 10, 900000);
        const body = await readJSON(req); const username = String(body.usuario || ''); const password = String(body.contrasena || '');
        if (password.length > 128) throw error(401, 'Credenciales incorrectas.');
        const valid = envAuth ? equal(username, process.env.ADMIN_USUARIO) && equal(password, process.env.ADMIN_CLAVE) : state.admin && equal(username, state.admin.username) && equal(crypto.scryptSync(password, state.admin.salt, 64).toString('hex'), state.admin.passwordHash);
        if (!valid) throw error(401, 'Credenciales incorrectas o administración no configurada.');
        for (const [key, expiry] of sessions) if (expiry < Date.now()) sessions.delete(key);
        if (sessions.size >= 100) throw error(429, 'Hay demasiadas sesiones administrativas.');
        const token = crypto.randomBytes(32).toString('base64url'); sessions.set(hash(token), Date.now() + 8 * 3600000);
        reply(res, 200, { ok: true, token, usuario: username, rol: 'ADMIN_REGIONAL_SALUD', expiraEn: '8h' }); return true;
      }
      if (pathname === '/api/auth/logout' && req.method === 'POST') { sessions.delete(hash(bearer(req))); reply(res, 200, { ok: true }); return true; }
      if (pathname === '/api/admin/usuarios' && req.method === 'GET') {
        requireAdmin(req); await prune();
        reply(res, 200, { ok: true, capacity: MAX, retentionDays: 30, users: state.profiles.map(publicProfile), active: state.profiles.filter(p => Date.parse(p.lastSeen) > Date.now() - 90000).length }); return true;
      }
      if (pathname.startsWith('/api/admin/usuarios/') && req.method === 'DELETE') {
        requireAdmin(req); const id = pathname.slice('/api/admin/usuarios/'.length);
        await save({ ...state, profiles: state.profiles.filter(p => p.id !== id) }); reply(res, 200, { ok: true }); return true;
      }
      if (pathname === '/api/perfiles' && req.method === 'POST') {
        rate(req, 'profile', 20); await prune(); const body = await readJSON(req);
        const nombre = clean(body.nombre), email = clean(body.email, 254).toLowerCase(), distrito = '', rol = String(body.rol || 'CIU');
        if (nombre.length < 2 || /^\d{8}$/.test(nombre) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['CIU','POSTA','AGC'].includes(rol)) throw error(400, 'Revisa nombre, correo y rol. No uses tu DNI como nombre.');
        const googleIdentity=google.readIdentity(req);const emailVerified=!!(googleIdentity && googleIdentity.email===email);
        if(!emailVerified && !(process.env.NODE_ENV==='test' && process.env.VITARA_ALLOW_DEMO_PROFILES==='1' && /^[^\s@]+@example\.test$/i.test(email)))throw error(403,'Para sincronizar una cuenta real, conéctala con Google. Escribir un correo no verifica que exista. Puedes explorar sin conectar una cuenta.');
        if (body.consent !== true) throw error(400, 'Necesitamos tu consentimiento para guardar el perfil y compartir la actividad con administración.');
        let previous = null; try { previous = profileFor(req); } catch { /* Registration does not impersonate an existing email. */ }
        if(emailVerified && !previous)previous=state.profiles.find(p=>p.email===email);
        if (state.profiles.some(p => p.email === email && p.id !== previous?.id)) throw error(409, 'Este correo ya está registrado. Usa el dispositivo original o pide al administrador que libere el registro. Un correo escrito no prueba identidad; conecta la cuenta real con Google.');
        if (!previous && state.profiles.length >= MAX) throw error(409, 'Las 7 plazas de participación están ocupadas. El administrador puede liberar una plaza. Puedes continuar sin sincronizar tus datos.');
        const token = previous && !emailVerified ? bearer(req) : crypto.randomBytes(32).toString('base64url'); const now = new Date().toISOString();
        const profile = { id: previous?.id || crypto.randomUUID(), nombre, email, distrito, rol, emailVerified, identityProvider:emailVerified?'google':'demo', googleSub:emailVerified?googleIdentity.sub:null, consentVersion: '2026-11-participacion-v1', consentAt: previous?.consentAt || now, createdAt: previous?.createdAt || now, updatedAt: now, lastSeen: now, interactions: previous?.interactions || [], tokenHash: hash(token), tokenExpires: new Date(Date.now() + RETENTION).toISOString() };
        await save({ ...state, profiles: [...state.profiles.filter(p => p.id !== profile.id), profile] });
        reply(res, previous ? 200 : 201, { ok: true, token, profile: publicProfile(profile) }); return true;
      }
      if (pathname === '/api/perfil' && req.method === 'GET') { await prune(); reply(res, 200, { ok: true, profile: publicProfile(profileFor(req)) }); return true; }
      if (pathname === '/api/perfil' && req.method === 'DELETE') { const p = profileFor(req); await save({ ...state, profiles: state.profiles.filter(item => item.id !== p.id) }); reply(res, 200, { ok: true }); return true; }
      if (pathname === '/api/perfil/interacciones' && req.method === 'POST') {
        rate(req, 'interaction', 150); const body = await readJSON(req), p = profileFor(req);
        const kind = String(body.tipo || ''), value = String(body.valor || '');
        if (!['vista','modelo','mapa','tema','chat','presencia'].includes(kind) || (kind === 'vista' && !VIEWS.has(value)) || (!['vista','presencia'].includes(kind) && !DETAILS.has(value))) throw error(400, 'Tipo de interacción no permitido.');
        const now = new Date().toISOString();
        const interaction = { tipo: kind, valor: value, fecha: now };
        const updated = { ...p, updatedAt: now, lastSeen: now, tokenExpires: new Date(Date.now() + RETENTION).toISOString(), interactions: kind === 'presencia' ? p.interactions : [...p.interactions, interaction].slice(-200) };
        await save({ ...state, profiles: state.profiles.map(item => item.id === p.id ? updated : item) }); reply(res, 200, { ok: true }); return true;
      }
      if (pathname === '/api/orientacion/estado' && req.method === 'GET') { reply(res, 200, { aiConfigured: aiConfigured(), mode: aiConfigured() ? 'opcional' : 'local', storesMessages: false }); return true; }
      if (pathname === '/api/orientacion' && req.method === 'POST') {
        rate(req, 'chat', 20); const body = await readJSON(req); const message = String(body.message || '').trim();
        if (!message || message.length > 2000) throw error(400, 'Escribe entre 1 y 2000 caracteres.');
        if (body.useAI === true) {
          if (!aiConfigured()) throw error(503, 'No hay un proveedor de IA configurado. El modo local sigue disponible.');
          if (/\b\d{8,}\b|[^\s@]+@[^\s@]+\.[^\s@]+/.test(message)) throw error(400, 'Quita correos, DNI y otros identificadores antes de enviar la consulta a una IA externa.');
          const endpoint = new URL(process.env.VITARA_AI_ENDPOINT);
          if (endpoint.protocol !== 'https:') throw error(503, 'La integración de IA necesita un endpoint HTTPS.');
          const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${process.env.VITARA_AI_KEY}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000), body: JSON.stringify({ model: process.env.VITARA_AI_MODEL, max_tokens: 650, messages: [{ role: 'system', content: 'Eres el orientador general de VITARA, Perú. Responde en español. Puedes responder preguntas generales y de la plataforma. No inventes disponibilidad, citas, fuentes ni datos del usuario. En salud ofrece información general, no diagnóstico definitivo ni prescripción personalizada ni dosis. Aclara incertidumbres. Ante peligro inmediato indica atención urgente y 106 SAMU donde disponible; para orientación sanitaria, MINSA 113. Nunca afirmes haber contactado servicios. No tienes acceso a historias clínicas, stock en vivo ni cuentas. No solicites DNI ni datos clínicos identificables.' }, { role: 'user', content: message }] }) });
          if (!response.ok) throw error(503, 'El proveedor de IA no respondió correctamente. Prueba el modo local.');
          const data = await response.json(); const answer = data.choices?.[0]?.message?.content;
          if (typeof answer !== 'string' || !answer.trim()) throw error(503, 'El proveedor devolvió una respuesta vacía.');
          reply(res, 200, { answer: answer.slice(0, 6000), mode: 'ia', notice: 'Respuesta de IA: puede contener errores. No sustituye una evaluación profesional.' }); return true;
        }
        reply(res, 200, localAnswer(message)); return true;
      }
      reply(res, 405, { ok: false, error: 'Método no permitido.' }); return true;
    } catch (err) { reply(res, err.status || 503, { ok: false, error: err.status ? err.message : 'El servicio no está disponible temporalmente. No se han simulado resultados.' }); return true; }
  }
  return { handle, isAdmin, prune, refreshState() { if (persistence) state = persistence.current('participation'); } };
}
function localAnswer(message) {
  const q = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const knowledge = localKnowledge(q);
  let answer, action;
  if (/suicid|hacerme dano|matarme|no quiero vivir/.test(q)) answer = 'Siento que estés pasando por esto. Si podrías hacerte daño ahora, busca atención de emergencia y pide a alguien de confianza que permanezca contigo. En Perú puedes llamar al 106 (SAMU, según cobertura) o acudir a una emergencia. La Línea 113 puede orientarte sobre servicios de salud mental. Este chat no contacta servicios ni sustituye ayuda inmediata.';
  else if (/no pued[oe] respirar|dolor (fuerte )?de pecho|inconscient|convulsion|sangrado abundante|emergencia/.test(q)) answer = 'Si esto está ocurriendo ahora, busca atención de emergencia. En Perú, llama al 106 (SAMU donde haya cobertura) o acude al servicio de emergencia más cercano. No esperes una respuesta de este chat. No puedo evaluar gravedad ni enviar una ambulancia.';
  else if (knowledge) ({ answer, action } = knowledge);
  else if (/mapa|libertad|territorio|provincia|peru/.test(q)) { answer = 'En Mapas puedes explorar el Perú por departamentos y La Libertad por provincias. La geometría proviene de polígonos GeoJSON simplificados y se muestra con volumen 3D. Puedes girar, acercar y elegir un territorio. Los colores distinguen territorios, no niveles de stock. El atlas inferior conserva las imágenes originales.'; action = 'mapas'; }
  else if (/proveedor|dispositivo|ecografo|monitor multiparametro|bomba de infusion|desfibrilador/.test(q)) { answer = 'En Dispositivos y proveedores encontrarás ilustraciones genéricas creadas con IA, fichas educativas, una comparación de hasta tres tipos de equipo y referencias a páginas oficiales de fabricantes. No son ofertas ni verificamos precio, stock, distribución autorizada o registro sanitario de un producto. Antes de adquirir, revisa necesidad clínica, requisitos regulatorios, soporte y consumibles.'; action = 'tecnologia'; }
  else if (/medic|pastilla|stock|farmacia|dosis|paracetamol|amoxicilina/.test(q)) { answer = 'El buscador permite consultar los medicamentos incluidos en la base local y sus fechas de referencia. No tengo stock en tiempo real ni puedo recomendarte una dosis o tratamiento personalizado. Confirma el recurso con la sede; si no hay verificación, usa Solicitudes. No te automediques a partir del chat.'; action = 'buscar'; }
  else if (/correo|perfil|privacidad|datos|administr|registro/.test(q)) { answer = 'El perfil sincronizado guarda tu nombre, correo, rol, territorio opcional y visitas consentidas a módulos. Solo administración autenticada puede ver esos registros. No guardamos el texto del chat ni búsquedas. La demostración admite hasta 7 perfiles; no son identidades verificadas por correo. Puedes revisar o eliminar tu perfil desde el botón de participación.'; }
  else if (/hospital|quirofano|modelo|3d/.test(q)) { answer = 'VITARA contiene ADN, un hospital exterior y dos quirófanos del inventario original. Pulsa los puntos numerados para abrir fichas educativas y avanzar entre capítulos. Los modelos no acreditan que una sede o un equipo estén operativos. El modelo Charité tiene licencia no comercial.'; action = 'planos'; }
  else if (/solicitud|codigo|verifica/.test(q)) { answer = 'En Solicitudes puedes pedir verificación de un recurso a la sede y guardar tu código privado G3 para consultar la respuesta. No incluyas DNI, historia clínica ni diagnóstico. Este chat no crea ni responde solicitudes por sí mismo.'; action = 'solicitudes'; }
  else if (/comer|aliment|bienestar|saludable|ejercicio|dormir/.test(q)) { answer = 'Como orientación general, una alimentación variada, descanso regular y actividad física adaptada a tus posibilidades contribuyen al bienestar. Si tienes una condición médica o síntomas, un profesional debe orientar las recomendaciones para tu caso. No puedo darte un plan clínico personalizado.'; action = 'canales'; }
  else if (/hola|ayuda|que (puedes|haces)|vitara|orienta/.test(q)) { answer = 'Hola. Soy el orientador de VITARA. En modo local puedo explicar el buscador, mapas, modelos, solicitudes, privacidad y canales de ayuda. No soy un médico ni una IA general conectada. Para preguntas abiertas hay una integración de IA opcional que el administrador debe configurar. ¿Qué necesitas explorar?'; }
  else { answer = 'No tengo información suficiente para responder esa pregunta en modo local y no quiero inventarla. Puedo orientarte sobre VITARA, sus mapas, medicamentos de referencia, solicitudes y privacidad. Para una consulta de salud específica, usa un canal oficial o un profesional. Las respuestas abiertas requieren configurar la integración de IA opcional.'; action = 'canales'; }
  return { answer, action, mode: 'local', notice: 'Orientación local con alcance limitado. No es diagnóstico ni atención de emergencia.' };
}
