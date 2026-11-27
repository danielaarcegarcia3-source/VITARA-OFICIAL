// Pruebas del servidor REAL en un proceso y almacenamiento desechables.
// No usa el puerto ni las claves de la vista previa. No modifica solicitudes reales.
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitara-security-'));
const reservation = http.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
const port = reservation.address().port; await new Promise(r => reservation.close(r));
const base = `http://127.0.0.1:${port}`;
const password = crypto.randomBytes(24).toString('base64url');
const env = { ...process.env, PORT: String(port), VITARA_DATA_DIR: dir, ADMIN_USUARIO: 'operador_aislado', ADMIN_CLAVE: password };
for (const key of ['ADMIN_TOKEN','VITARA_SETUP_KEY','VITARA_REQUESTS_FILE','VITARA_AI_ENDPOINT','VITARA_AI_MODEL','VITARA_AI_KEY']) delete env[key];
let child, output = '', count = 0;
const streams = [];
function check(actual, expected, label) { assert.deepEqual(actual, expected, label); count++; }
async function start() {
  output = ''; child = spawn(process.execPath, ['server.mjs'], { cwd: root, env, stdio: ['ignore','pipe','pipe'] });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No arrancó el servidor aislado: ' + output)), 10000);
    const log = chunk => { output += chunk; if (output.includes('Servidor HTTP & SSE')) { clearTimeout(timer); resolve(); } };
    child.stdout.on('data',log); child.stderr.on('data',log);
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Servidor terminó: ${code}. ${output}`)); });
  });
}
async function stop() { for (const s of streams.splice(0)) s.req.destroy(); if (child && child.exitCode === null) { const exited = once(child, 'exit'); child.kill('SIGTERM'); await exited; } }
async function api(route, method = 'GET', body, token, headers = {}) {
  const res = await fetch(base + route, { method, headers: { ...(body !== undefined ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...headers }, ...(body !== undefined ? {body:JSON.stringify(body)} : {}) });
  const text = await res.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  return {status: res.status, data, headers: res.headers};
}
async function stream() {
  return new Promise((resolve,reject) => {
    const item = {text:'',req:null}; item.req = http.get(base + '/api/eventos', res => {
      res.on('data',chunk => { item.text += chunk; if (item.text.includes('event: conectado')) resolve(item); });
    }); item.req.on('error',reject); streams.push(item);
  });
}
try {
  await start();
  const home = await api('/'); check(home.status,200,'web pública');
  check(home.headers.get('x-content-type-options'),'nosniff','no sniff');
  const csp = home.headers.get('content-security-policy');
  check(csp.includes("object-src 'none'"),true,'objetos bloqueados');
  check(/script-src[^;]*'sha256-/.test(csp),true,'scripts inline con hashes');
  check(/script-src[^;]*'unsafe-inline'/.test(csp),false,'no scripts inline arbitrarios');
  for (const file of ['/data/participacion.json','/data/solicitudes.json','/solicitudes.json','/server.mjs','/server-services.mjs','/package.json','/firebase.json','/CONFIGURACION-VITARA.md','/.git/HEAD','/.env','/scripts/test-security.mjs','/build/index.html']) {
    check([403,404].includes((await api(file)).status),true,`no servir ${file}`);
  }
  for (const route of ['/api/solicitudes','/api/admin/usuarios','/api/exportar-backup']) check((await api(route)).status,401,'operación privada');
  check((await api('/api/importar-backup','POST',{datos:[]})).status,401,'restore privado');
  check((await api('/api/solicitudes/G3-AAAAAA','PATCH',{estado:'cerrado'})).status,401,'patch privado');
  check((await api('/api/admin/configurar','POST',{})).status,403,'alta cerrada con env auth');
  const login = await api('/api/auth/login','POST',{usuario:env.ADMIN_USUARIO,contrasena:password}); check(login.status,200,'login');
  const token = login.data.token;
  check((await api('/api/solicitudes','POST',{item:'Recurso'},null,{Origin:'https://ajeno.example'})).status,403,'origen ajeno en rutas antiguas');
  check((await api('/api/auth/login','POST',{usuario:env.ADMIN_USUARIO,contrasena:password},null,{Origin:'https://ajeno.example','X-Forwarded-Host':'ajeno.example'})).status,403,'forwarded host no otorga permiso');
  check((await api('/api/solicitudes','POST',{item:'<img src=x>'})).status,400,'HTML rechazado');
  check((await api('/api/solicitudes','POST',{item:'DNI 12345678'})).status,400,'DNI rechazado');
  check((await api('/api/solicitudes','POST',{item:'Correo prueba@example.test'})).status,400,'correo rechazado en solicitud anónima');
  check((await api('/api/solicitudes','POST',null)).status,400,'JSON nulo rechazado');
  check((await api('/api/solicitudes?x='+encodeURIComponent("' UNION SELECT * FROM usuarios --"))).status,403,'patrón SQL bloqueado');
  check((await api('/api/solicitudes?x='+encodeURIComponent('<script>alert(1)</script>'))).status,403,'patrón XSS bloqueado');
  check((await api('/api/solicitudes?x='+encodeURIComponent('../../.env'))).status,403,'traversal bloqueado');
  const connections = await Promise.all(Array.from({length:7},stream)); check(connections.length,7,'siete clientes SSE simultáneos (no dispositivos físicos)');
  const profiles = await Promise.all(Array.from({length:7},(_,i)=>api('/api/perfiles','POST',{nombre:`Equipo prueba ${i+1}`,email:`equipo${i+1}@example.test`,rol:'CIU',consent:true})));
  for (const profile of profiles) check(profile.status,201,'perfil concurrente');
  const ptoken = profiles[0].data.token;
  const interactions = await Promise.all(['mapas','canales','tecnologia'].map(valor=>api('/api/perfil/interacciones','POST',{tipo:'vista',valor},ptoken)));
  check(interactions.every(r=>r.status===200),true,'interacciones simultáneas');
  check((await api('/api/perfil','GET',undefined,ptoken)).data.profile.interactions.length,3,'ninguna interacción perdida');
  const tickets = await Promise.all(Array.from({length:7},(_,i)=>api('/api/solicitudes','POST',{item:`Recurso de prueba ${i+1}`,alias:`Equipo prueba ${i+1}`,sede:'Sede de demostración',idempotencyKey:crypto.randomUUID()})));
  for (const ticket of tickets) check(ticket.status,201,'solicitud concurrente persistida');
  check(new Set(tickets.map(r=>r.data.solicitud.codigo)).size,7,'códigos únicos');
  const key = crypto.randomUUID(); const fields = {item:'Reintento de prueba',alias:'Equipo prueba',idempotencyKey:key};
  const first = await api('/api/solicitudes','POST',fields); const second = await api('/api/solicitudes','POST',fields);
  check(first.status,201,'primer envío'); check(second.status,200,'reintento idempotente'); check(second.data.solicitud.codigo,first.data.solicitud.codigo,'mismo código solo con clave privada de reintento');
  const independent = await api('/api/solicitudes','POST',{...fields,idempotencyKey:crypto.randomUUID()}); check(independent.status,201,'mismo texto no revela código de otro visitante');
  const code = first.data.solicitud.codigo;
  check((await api('/api/solicitudes?codigo='+code)).data.solicitud.codigo,code,'seguimiento con código');
  check((await api('/api/solicitudes/'+code,'PATCH',{estado:'respondido',respuesta:'Respuesta exclusivamente de prueba.'},token)).status,200,'respuesta administrativa');
  // Una respuesta posterior asegura que el bucle ya entregó también los eventos anteriores.
  const health = await api('/api/salud'); check(health.data.clientesConectadosSSE,7,'siete streams realmente abiertos');
  for (const connection of connections) {
    check(connection.text.includes('event: nueva_solicitud'),true,'evento real recibido');
    check(connection.text.includes('event: participacion_actualizada'),true,'invalidación de participación sin datos personales');
    check(/G3-|Recurso de prueba|Equipo prueba|example\.test/.test(connection.text),false,'SSE público sin códigos ni textos privados');
  }
  const backup = await api('/api/exportar-backup','GET',undefined,token); check(backup.status,200,'exportación privada'); check(backup.data.datos.length,9,'backup de solicitudes reales de prueba');
  check((await api('/api/importar-backup','POST',backup.data,token)).status,200,'restauración privada');
  check((await api('/api/admin/usuarios/'+profiles[1].data.profile.id,'DELETE',undefined,token)).status,200,'DELETE administrativo a través del servidor real');
  check((await api('/api/perfil','DELETE',undefined,ptoken)).status,200,'DELETE de perfil propio a través del servidor real');
  await Promise.all(Array.from({length:9},stream));
  check((await api('/api/eventos')).status,429,'17º stream desde la misma conexión limitado');
  const stored = fs.readFileSync(path.join(dir,'participacion.json'),'utf8');
  check(stored.includes(ptoken),false,'clave de dispositivo no se almacena en claro');
  check(fs.statSync(path.join(dir,'solicitudes.json')).mode & 0o777,0o600,'permisos de solicitudes');
  await stop(); await start();
  check((await api('/api/admin/usuarios','GET',undefined,token)).status,401,'reinicio invalida sesiones');
  const relog = await api('/api/auth/login','POST',{usuario:env.ADMIN_USUARIO,contrasena:password}); const fresh = relog.data.token;
  check((await api('/api/admin/usuarios','GET',undefined,fresh)).data.users.length,5,'perfiles persistentes tras reinicio');
  check((await api('/api/solicitudes','GET',undefined,fresh)).data.total,9,'solicitudes persistentes tras reinicio');
  check((await api('/api/solicitudes?codigo='+code)).data.solicitud.estado,'respondido','respuesta persistente tras reinicio');
  check((await api('/api/auth/logout','POST',{},fresh)).status,200,'logout');
  check((await api('/api/admin/usuarios','GET',undefined,fresh)).status,401,'token invalidado');
  const attempts = []; for (let i=0;i<11;i++) attempts.push((await api('/api/auth/login','POST',{usuario:'incorrecto',contrasena:'incorrecta'})).status);
  check(attempts.includes(429),true,'límite de intentos de login');
  const traffic=[]; for(let i=0;i<185;i++) traffic.push((await api('/api/salud')).status);
  check(traffic.includes(429),true,'límite de tráfico API');
  check((await api('/logo%20VITARA.jpeg')).status,200,'presupuesto de activos independiente');
  console.log(`✓ ${count} comprobaciones del servidor real: permisos, privacidad, WAF básico, 7 clientes SSE concurrentes, registros, DELETE, persistencia, backup y límites. Sin datos de la vista previa.`);
} finally { await stop(); fs.rmSync(dir,{recursive:true,force:true}); }
