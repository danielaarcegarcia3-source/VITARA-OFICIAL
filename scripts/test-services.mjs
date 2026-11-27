import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServices } from '../server-services.mjs';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitara-services-'));
const oldDir = process.env.VITARA_DATA_DIR, oldSetup = process.env.VITARA_SETUP_KEY;
process.env.VITARA_DATA_DIR = dir;
process.env.VITARA_SETUP_KEY = 'private-test-bootstrap-only';
let service = createServices({ root: dir });
const server = http.createServer(async (req,res)=> { if(!await service.handle(req,res,new URL(req.url,'http://local').pathname)){res.writeHead(404);res.end();} });
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
async function api(route, method='GET', body, token, origin) {
  const res=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`} : {}),...(origin?{Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:res.status,data:await res.json()};
}
let tests=0;function check(value,expected){assert.deepEqual(value,expected);tests++;}
try {
  check((await api('/api/admin/usuarios')).status,401);
  check((await api('/api/admin/configurar','POST',{usuario:'operador',contrasena:'test-passphrase-strong'})).status,403);
  check((await api('/api/admin/configurar','POST',{setupKey:process.env.VITARA_SETUP_KEY,usuario:'operador',contrasena:'test-passphrase-strong'})).status,201);
  check((await api('/api/auth/login','POST',{usuario:'admin_g3',contrasena:'Salud2026!'})).status,401);
  const login=await api('/api/auth/login','POST',{usuario:'operador',contrasena:'test-passphrase-strong'});check(login.status,200);const admin=login.data.token;
  check((await api('/api/perfiles','POST',{nombre:'Sin consentimiento',email:'sin@example.test',rol:'CIU',consent:false})).status,400);
  const registered=[];
  for(let i=0;i<7;i++) {const result=await api('/api/perfiles','POST',{nombre:`Prueba ${i}`,email:`prueba${i}@example.test`,distrito:'Trujillo',rol:'CIU',consent:true});check(result.status,201);registered.push(result.data);}
  check((await api('/api/perfiles','POST',{nombre:'Octavo',email:'octavo@example.test',rol:'CIU',consent:true})).status,409);
  check((await api('/api/perfiles','POST',{nombre:'Otro',email:'prueba0@example.test',rol:'CIU',consent:true})).status,409);
  check((await api('/api/perfil/interacciones','POST',{tipo:'vista',valor:'mapas'},registered[0].token)).status,200);
  check((await api('/api/perfil/interacciones','POST',{tipo:'busqueda',valor:'dato-clinico'},registered[0].token)).status,400);
  check((await api('/api/perfil/interacciones','POST',{tipo:'vista',valor:'mapas'},registered[0].token,'https://evil.example')).status,403);
  check((await api('/api/perfil/interacciones','POST',{tipo:'vista',valor:'tecnologia'},registered[1].token)).status,200);
  const analytics=await api('/api/admin/usuarios','GET',undefined,admin);check(analytics.data.users.length,7);check(analytics.data.users[0].interactions[0].valor,'mapas');check(analytics.data.users.some(u=>'tokenHash' in u),false);
  check((await api('/api/perfil','GET',undefined,'invalid')).status,401);
  // Reload from disk, not a second copy of client-side state.
  service=createServices({root:dir});
  const relog=await api('/api/auth/login','POST',{usuario:'operador',contrasena:'test-passphrase-strong'});const fresh=relog.data.token;
  check((await api('/api/admin/usuarios','GET',undefined,fresh)).data.users.length,7);
  check((await api('/api/perfil','GET',undefined,registered[0].token)).data.profile.interactions.length,1);
  check((await api('/api/perfil','DELETE',undefined,registered[0].token)).status,200);
  check((await api('/api/admin/usuarios','GET',undefined,fresh)).data.users.length,6);
  const guidance=await api('/api/orientacion','POST',{message:'¿Cómo exploro los mapas?'});check(guidance.status,200);check(guidance.data.action,'mapas');
  check((await api('/api/orientacion','POST',{message:'explica la relatividad',useAI:true})).status,503);
  check((await api('/api/orientacion','POST',{message:'no puedo respirar'})).data.answer.includes('106'),true);
  check((await api('/api/auth/logout','POST',undefined,fresh)).status,200);
  check((await api('/api/admin/usuarios','GET',undefined,fresh)).status,401);
  check(fs.existsSync(path.join(dir,'participacion.json')),true);
  console.log(`✓ ${tests} comprobaciones: 7 registros reales de prueba aislados, capacidad, persistencia, autorización, privacidad, eliminación, chat y cierre de sesión.`);
} finally {
  await new Promise(resolve=>server.close(resolve));
  fs.rmSync(dir,{recursive:true,force:true});
  if(oldDir===undefined)delete process.env.VITARA_DATA_DIR;else process.env.VITARA_DATA_DIR=oldDir;
  if(oldSetup===undefined)delete process.env.VITARA_SETUP_KEY;else process.env.VITARA_SETUP_KEY=oldSetup;
}
