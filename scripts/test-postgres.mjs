// Solo una base PostgreSQL LOCAL de pruebas; crea y elimina su propia base desechable.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import pg from 'pg';
import { openPostgres, serialExecutor } from '../server-persistence.mjs';
import { startIsolatedServer } from '../tests/helpers/server.mjs';
const source = process.env.VITARA_TEST_DATABASE_URL;
if (!source) throw new Error('Define VITARA_TEST_DATABASE_URL hacia PostgreSQL local de pruebas, nunca Neon ni datos reales.');
const url = new URL(source);
assert(['localhost','127.0.0.1','[::1]'].includes(url.hostname), 'Solo se admiten pruebas en loopback.');
assert(!url.search, 'No se admiten parámetros de conexión en las pruebas.');
assert.notEqual(process.env.RENDER, 'true');
process.env.NODE_ENV = 'test';
const owner = new pg.Client({ connectionString: source, ssl: false });
await owner.connect();
const database = `vitara_test_${crypto.randomBytes(8).toString('hex')}`;
await owner.query(`CREATE DATABASE ${database}`);
url.pathname = '/' + database;
const connectionString = url.toString();
let checks = 0, app, a, b, sql;
function check(actual, expected, label) { assert.deepEqual(actual, expected, label); checks++; }
const password = crypto.randomBytes(24).toString('base64url');
const env = { DATABASE_URL: connectionString, NODE_ENV: 'test', VITARA_PG_LOCAL_TEST: '1', ADMIN_USUARIO: 'operador_pg', ADMIN_CLAVE: password };
async function start() { app = await startIsolatedServer(env); }
async function api(route, method = 'GET', body, token, extra = {}) {
  const response = await fetch(app.base + route, { method, headers: { ...(body !== undefined ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...extra }, ...(body !== undefined ? {body:JSON.stringify(body)} : {}) });
  return { status: response.status, data: await response.json() };
}
try {
  await assert.rejects(startIsolatedServer({RENDER:'true'}), /Falta DATABASE_URL privada/); checks++;
  const marker = crypto.randomBytes(24).toString('hex');
  await assert.rejects(startIsolatedServer({DATABASE_URL:'https://' + marker + '@example.test'}), error => !error.message.includes(marker) && error.message.includes('No se pudo abrir PostgreSQL')); checks++;
  check(await openPostgres({connectionString:''}), null, 'modo local opcional');
  await assert.rejects(openPostgres({connectionString:'https://example.test'})); checks++;
  // El cliente sin excepción de test debe exigir TLS incluso ante un PostgreSQL local sin TLS.
  await assert.rejects(openPostgres({connectionString})); checks++;
  await assert.rejects(openPostgres({connectionString:connectionString+'?ssl=0&sslmode=disable'})); checks++;
  a = await openPostgres({connectionString,testLocal:true}); b = await openPostgres({connectionString,testLocal:true});
  await a.save('requests', [{ensayo:true}]);
  await assert.rejects(b.save('requests', []), error => error.statusCode === 409); checks++;
  await b.refresh(); check(b.current('requests'), [{ensayo:true}], 'CAS no pierde cambios');
  const copy = b.current('requests'); copy.length = 0; check(b.current('requests').length,1,'cache aislada');
  await b.save('requests', []); await a.close(); a = null; await b.close(); b = null;
  const serial = serialExecutor({maxPending:1}); let release;
  const first = serial(() => new Promise(resolve => {release=resolve;}));
  await assert.rejects(serial(async()=>{}), error => error.statusCode === 503); checks++; release(); await first;
  await assert.rejects(serial(async()=>{throw new Error('ensayo');})); checks++;
  check(await serial(async()=>42),42,'cola se recupera tras error');
  await start();
  check((await api('/api/salud')).data.almacenamiento,'postgres','servidor usa PostgreSQL');
  check((await fetch(app.base+'/server-persistence.mjs')).status,404,'adaptador privado');
  check((await api('/api/admin/usuarios')).status,401,'admin privado');
  const login = await api('/api/auth/login','POST',{usuario:env.ADMIN_USUARIO,contrasena:password}); check(login.status,200,'login'); const admin=login.data.token;
  check((await api('/api/perfiles','POST',{nombre:'Prueba',email:'test@example.test',rol:'CIU',consent:false})).status,400,'consentimiento');
  check((await api('/api/perfiles','POST',{padding:'x'.repeat(17000)})).status,413,'límite de cuerpo');
  check((await api('/api/perfiles','POST',{},undefined,{Origin:'https://ajeno.example'})).status,403,'origen');
  const profiles = await Promise.all(Array.from({length:7},(_,i)=>api('/api/perfiles','POST',{nombre:`Ensayo nube ${i}`,email:`nube${i}@example.test`,rol:'CIU',consent:true})));
  for (const profile of profiles) check(profile.status,201,'siete perfiles concurrentes');
  const token=profiles[0].data.token;
  check((await api('/api/perfiles','POST',{nombre:'Octavo',email:'octavo@example.test',rol:'CIU',consent:true})).status,409,'capacidad');
  const interactions = await Promise.all(['mapas','canales','tecnologia'].map(valor=>api('/api/perfil/interacciones','POST',{tipo:'vista',valor},token)));
  check(interactions.every(x=>x.status===200),true,'interacciones concurrentes');
  check((await api('/api/perfil','GET',undefined,token)).data.profile.interactions.length,3,'sin pérdidas');
  const tickets = await Promise.all(Array.from({length:7},(_,i)=>api('/api/solicitudes','POST',{item:`Recurso ensayo ${i}`,alias:'Equipo ensayo',idempotencyKey:crypto.randomUUID()})));
  for (const ticket of tickets) check(ticket.status,201,'siete solicitudes concurrentes');
  const fields={item:'Recurso reintento',idempotencyKey:crypto.randomUUID()};
  const ticket=await api('/api/solicitudes','POST',fields); check(ticket.status,201,'creación'); const code=ticket.data.solicitud.codigo;
  const retry=await api('/api/solicitudes','POST',fields); check(retry.status,200,'idempotencia'); check(retry.data.solicitud.codigo,code,'mismo código');
  check((await api('/api/solicitudes/'+code,'PATCH',{estado:'respondido',respuesta:'Respuesta de ensayo.'},admin)).status,200,'respuesta');
  const backup=await api('/api/exportar-backup','GET',undefined,admin); check(backup.data.datos.length,8,'backup');
  check((await api('/api/importar-backup','POST',backup.data,admin)).status,200,'restauración');
  check(fs.readdirSync(app.dir).length,0,'no escribe datos en disco efímero');
  await app.dispose(); app=null; await start();
  check((await api('/api/admin/usuarios','GET',undefined,admin)).status,401,'sesión invalida tras reinicio');
  const relog=await api('/api/auth/login','POST',{usuario:env.ADMIN_USUARIO,contrasena:password}); const fresh=relog.data.token;
  check((await api('/api/admin/usuarios','GET',undefined,fresh)).data.users.length,7,'perfiles tras reinicio');
  check((await api('/api/perfil','GET',undefined,token)).data.profile.interactions.length,3,'actividad tras reinicio');
  check((await api('/api/solicitudes?codigo='+code)).data.solicitud.respuesta,'Respuesta de ensayo.','solicitud tras reinicio');
  check((await api('/api/perfil','DELETE',undefined,token)).status,200,'eliminación propia');
  check((await api('/api/admin/usuarios/'+profiles[1].data.profile.id,'DELETE',undefined,fresh)).status,200,'eliminación administrativa');
  check((await api('/api/admin/usuarios','GET',undefined,fresh)).data.users.length,5,'dos eliminaciones guardadas');
  sql = new pg.Client({connectionString,ssl:false}); await sql.connect();
  const stored=JSON.stringify((await sql.query('SELECT document_value FROM vitara_documents')).rows);
  check(stored.includes(token),false,'token de perfil no se guarda en claro'); check(stored.includes(password),false,'contraseña no se guarda');
  await sql.query('ALTER TABLE vitara_documents RENAME TO vitara_documents_test_offline');
  check((await api('/api/salud')).status,503,'health detecta almacenamiento inaccesible');
  const failed=await api('/api/solicitudes','POST',{item:'No confirmar este envío'}); check(failed.status,503,'fallo de almacenamiento no simula éxito');
  check(JSON.stringify(failed.data).includes('vitara_documents'),false,'no filtra SQL');
  check(fs.readdirSync(app.dir).length,0,'no cambia a JSON al fallar');
  await sql.query('ALTER TABLE vitara_documents_test_offline RENAME TO vitara_documents');
  check((await api('/api/solicitudes','GET',undefined,fresh)).data.solicitudes.length,8,'envío fallido no se guardó');
  await app.dispose(); app=null;
  // El alta alternativa guarda solo hash y sal en PostgreSQL, nunca la clave inicial.
  const setupKey=crypto.randomBytes(32).toString('base64url');
  const bootstrapEnv={...env,ADMIN_USUARIO:'',ADMIN_CLAVE:'',VITARA_SETUP_KEY:setupKey};
  app=await startIsolatedServer(bootstrapEnv);
  check((await api('/api/admin/configurar','POST',{setupKey,usuario:'operador_persistido',contrasena:password})).status,201,'alta inicial persistida');
  await app.dispose(); app=null;
  app=await startIsolatedServer({...bootstrapEnv,VITARA_SETUP_KEY:''});
  check((await api('/api/auth/login','POST',{usuario:'operador_persistido',contrasena:password})).status,200,'hash admin tras reinicio');
  check((await api('/api/admin/configurar','POST',{})).status,403,'alta cerrada');
  const adminStored=JSON.stringify((await sql.query("SELECT document_value FROM vitara_documents WHERE document_key='participation'")).rows);
  check(adminStored.includes(password) || adminStored.includes(setupKey),false,'no se guardan contraseña ni setup key');
  check(adminStored.includes('passwordHash'),true,'hash con sal guardado');
  await app.dispose(); app=null;
  // Pérdida de documento detectada también al abrir, no se inicializa silenciosamente.
  await sql.query("DELETE FROM vitara_documents WHERE document_key='requests'");
  await assert.rejects(openPostgres({connectionString,testLocal:true})); checks++;
  console.log(`✓ ${checks} comprobaciones PostgreSQL: persistencia tras reinicio Node, concurrencia, CAS, permisos, respaldo, fallos sin fallback y TLS obligatorio.`);
} finally {
  await app?.dispose(); await a?.close(); await b?.close(); await sql?.end();
  await owner.query(`DROP DATABASE ${database} WITH (FORCE)`); await owner.end();
}
