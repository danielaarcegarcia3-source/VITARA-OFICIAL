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
  await expect(page.locator('#participants-summary')).toContainText('1 / 7',{timeout:5000});
  const {token: participantToken}=await profile.json();
  await request.post(base+'/api/perfil/interacciones',{headers:{Authorization:`Bearer ${participantToken}`},data:{tipo:'vista',valor:'mapas'}});
  await expect(page.locator('#participants-list')).toContainText('1 interacciones',{timeout:5000});
  await page.locator('#participants-list summary').click();page.once('dialog',dialog=>dialog.accept());await page.locator('.participant-remove').click();await expect(page.locator('#participants-summary')).toContainText('0 / 7');
  await page.locator('#btnCerrarSesion').click();await expect(page.locator('#loginOverlay')).toBeVisible();await expect(page.locator('.solicitud-item')).toHaveCount(0);await expect(page.locator('.admin-participation')).toBeHidden();await expect(page.locator('#modalResponder')).toBeHidden();await expect(page.locator('#modalRespTexto')).toHaveValue('');
  expect(violations).toEqual([]);
});

test('solicitud completa: formulario visitante, respuesta del panel y seguimiento persistente',async({page,browser})=>{
  await page.goto(base+'/admin.html');await page.locator('#loginUsuario').fill('operador_pruebas');await page.locator('#loginClave').fill(password);await page.locator('#btnLogin').click();await expect(page.locator('#loginOverlay')).toBeHidden();
  const context=await browser.newContext({reducedMotion:'reduce'});const visitor=await context.newPage();
  try{
    await visitor.goto(base);await visitor.evaluate(()=>document.querySelector('#splash-skip').click());await visitor.locator('#access-name').fill('Equipo visitante');await visitor.locator('#access-form [type=submit]').click();
    await visitor.locator('[data-view-link=solicitudes]').click();await visitor.locator('#sol-item').fill('Ambiente para prueba educativa');await visitor.locator('#sol-cat').selectOption('servicio');await visitor.locator('#sol-alias').fill('Equipo visitante');await visitor.locator('#sol-submit').click();
    const result=visitor.locator('#solicitud-resultado .code-box__v');await expect(result).toHaveText(/^G3-[A-Z0-9]{6}$/);const code=(await result.textContent()).trim();
    const respond=page.locator(`[data-codigo="${code}"]`);await expect(respond).toBeVisible({timeout:5000});await respond.click();await page.locator('#modalRespEstado').selectOption('respondido');await page.locator('#modalRespTexto').fill('Respuesta de ensayo: consulta recibida, sin disponibilidad clínica certificada.');await page.locator('#formResponderSolicitud [type=submit]').click();await expect(page.locator('#modalResponder')).toBeHidden();
    await visitor.locator('#tracker-code').fill(code);await visitor.locator('#form-tracker [type=submit]').click();await expect(visitor.locator('#tracker-resultado')).toContainText('Respuesta de ensayo');
    await visitor.reload();await visitor.evaluate(()=>document.querySelector('#splash-skip').click());await visitor.locator('#access-form [type=submit]').click();await expect(visitor.locator('#access')).toBeHidden();await visitor.locator('[data-view-link=solicitudes]').click();await visitor.locator('#tracker-code').fill(code);await visitor.locator('#form-tracker [type=submit]').click();await expect(visitor.locator('#tracker-resultado')).toContainText('Respuesta de ensayo');
  }finally{await context.close();}
});
