import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
let dir, child, base;
const password = crypto.randomBytes(24).toString('base64url');
test.beforeAll(async()=>{
  dir=fs.mkdtempSync(path.join(os.tmpdir(),'vitara-security-ui-'));
  // Registro hostil aislado: simula un archivo histórico que debe mostrarse como texto.
  fs.writeFileSync(path.join(dir,'solicitudes.json'),JSON.stringify([{codigo:'G3-ABCDEF',item:'<img src=x onmouseover="window.inyectado=true">',alias:'Equipo de prueba',sede:'Sede de prueba',estado:'recibida',fecha:new Date().toISOString()}]));
  const reservation=http.createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(r=>reservation.close(r));base=`http://127.0.0.1:${port}`;
  const env={...process.env,PORT:String(port),VITARA_DATA_DIR:dir,ADMIN_USUARIO:'operador_pruebas',ADMIN_CLAVE:password};
  for(const key of ['VITARA_REQUESTS_FILE','ADMIN_TOKEN','VITARA_SETUP_KEY'])delete env[key];
  child=spawn(process.execPath,['server.mjs'],{env,stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error(output)),10000);const log=chunk=>{output+=chunk;if(output.includes('Servidor HTTP & SSE')){clearTimeout(timer);resolve();}};child.stdout.on('data',log);child.stderr.on('data',log);child.once('exit',()=>{clearTimeout(timer);reject(new Error(output));});});
});
test.afterAll(async()=>{if(child?.exitCode===null){const done=once(child,'exit');child.kill();await done;}fs.rmSync(dir,{recursive:true,force:true});});
test('panel real: escape de registros históricos, actualización SSE privada y borrado autorizado',async({page,request})=>{
  const violations=[];page.on('console',msg=>{if(msg.type()==='error'&&msg.text().includes('Content Security Policy'))violations.push(msg.text());});
  await page.goto(base+'/admin.html');await page.locator('#loginUsuario').fill('operador_pruebas');await page.locator('#loginClave').fill(password);await page.locator('#btnLogin').click();await expect(page.locator('#loginOverlay')).toBeHidden();
  await expect(page.locator('.solicitud-item__titulo')).toContainText('<img src=x');await expect(page.locator('.solicitud-item__titulo img')).toHaveCount(0);expect(await page.evaluate(()=>window.inyectado)).toBeUndefined();
  // La conexión SSE ya está abierta antes de enviar una solicitud real al mismo backend.
  await expect(page.locator('#lbl-concurrencia-num')).not.toHaveText('0');
  const ticket=await request.post(base+'/api/solicitudes',{data:{item:'Recurso para prueba de SSE',alias:'Equipo de prueba',idempotencyKey:crypto.randomUUID()}});expect(ticket.status()).toBe(201);const {solicitud}=await ticket.json();
  await expect(page.locator('#listaSolicitudesAdmin')).toContainText(solicitud.codigo,{timeout:10000});
  const profile=await request.post(base+'/api/perfiles',{data:{nombre:'Equipo borrable',email:'borrable@example.test',rol:'CIU',consent:true}});expect(profile.status()).toBe(201);
  await page.locator('#participants-refresh').click();await page.locator('#participants-list summary').click();page.once('dialog',dialog=>dialog.accept());await page.locator('.participant-remove').click();await expect(page.locator('#participants-summary')).toContainText('0 / 7');
  expect(violations).toEqual([]);
});
