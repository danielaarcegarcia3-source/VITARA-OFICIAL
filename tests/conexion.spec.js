import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServices } from '../server-services.mjs';
let server, base, dir;
test.beforeAll(async()=>{
  dir=fs.mkdtempSync(path.join(os.tmpdir(),'vitara-ui-'));
  process.env.VITARA_DATA_DIR=dir;process.env.ADMIN_USUARIO='operador_prueba';process.env.ADMIN_CLAVE='clave-solo-pruebas-aisladas';
  const service=createServices({root:dir});
  server=http.createServer(async(req,res)=>{
    if(await service.handle(req,res,new URL(req.url,'http://local').pathname))return;
    const remote=await fetch('http://127.0.0.1:3000'+req.url);
    const headers=Object.fromEntries(remote.headers);delete headers['transfer-encoding'];delete headers['content-encoding'];delete headers['content-length'];
    res.writeHead(remote.status,headers);res.end(Buffer.from(await remote.arrayBuffer()));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});delete process.env.VITARA_DATA_DIR;delete process.env.ADMIN_USUARIO;delete process.env.ADMIN_CLAVE;});
async function enter(page){await page.goto(base);await page.evaluate(()=>document.querySelector('#splash-skip').click());await page.locator('#access-name').fill('Persona de prueba');}

test('perfil consentido persistente, actividad real y eliminación',async({page,request})=>{
  await enter(page);await page.locator('#access-email').fill('persona@example.test');await page.locator('#access-district').fill('Trujillo');await page.locator('#access-sync').check();await page.locator('#access-form [type=submit]').click();await expect(page.locator('#access')).toBeHidden();
  await page.locator('[data-view-link=mapas]').click();
  await expect(page.locator('#mapa-svg-wrap canvas')).toHaveAttribute('data-regions','25', { timeout: 20000 });
  await page.locator('#participation-open').click();await expect(page.locator('#participation-details')).toContainText('persona@example.test');
  const token=await page.evaluate(()=>JSON.parse(localStorage.getItem('vitara.participant.token')));
  const profile=await request.get(base+'/api/perfil',{headers:{Authorization:`Bearer ${token}`}});expect((await profile.json()).profile.distrito).toBe('Trujillo');
  page.once('dialog',dialog=>dialog.accept());await page.locator('#participation-delete').click();await expect(page.locator('#access')).toBeVisible();expect((await request.get(base+'/api/perfil',{headers:{Authorization:`Bearer ${token}`}})).status()).toBe(401);
});

test('mapas reconocibles con polígonos, tema y chat honesto',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await enter(page);await page.locator('#access-form [type=submit]').click();
  await expect(page.locator('html')).toHaveAttribute('data-base','blanco');await page.locator('#theme-switch').click();await expect(page.locator('html')).toHaveAttribute('data-base','editorial');
  await page.locator('[data-view-link=mapas]').click();await expect(page.locator('[data-region]')).toHaveCount(25);await page.locator('[data-region="LIMA"]').click();await expect(page.locator('.territory-selection')).toContainText('LIMA');
  await page.locator('#map-btn-ll').click();await expect(page.locator('[data-region]')).toHaveCount(12);await page.locator('[data-terrain="2d"]').click();await expect(page.locator('.territory-flat svg')).toBeVisible();
  await page.locator('#chat-open').click();await expect(page.locator('#chat-ai')).toBeDisabled();await page.locator('#chat-input').fill('¿Cómo exploro los mapas?');await page.locator('#chat-form [type=submit]').click();await expect(page.locator('#chat-messages')).toContainText('GeoJSON');
  await page.locator('#chat-input').fill('explica física cuántica');await page.locator('#chat-form [type=submit]').click();await expect(page.locator('#chat-messages')).toContainText('No tengo información suficiente');expect(errors).toEqual([]);
});

test('administración muestra siete perfiles reales aislados, sin claves demo',async({page,request})=>{
  for(let i=0;i<7;i++){const response=await request.post(base+'/api/perfiles',{data:{nombre:`Participante ${i}`,email:`p${i}@example.test`,rol:'CIU',consent:true}});expect(response.status()).toBe(201);const {token}=await response.json();await request.post(base+'/api/perfil/interacciones',{headers:{Authorization:`Bearer ${token}`},data:{tipo:'vista',valor:'mapas'}});}
  await page.goto(base+'/admin.html');await expect(page.locator('#loginOverlay')).toBeVisible();await expect(page.getByText('Salud2026!',{exact:false})).toHaveCount(0);
  await page.locator('#loginUsuario').fill('operador_prueba');await page.locator('#loginClave').fill('clave-solo-pruebas-aisladas');await page.locator('#btnLogin').click();await expect(page.locator('#loginOverlay')).toBeHidden();
  await expect(page.locator('#participants-summary')).toContainText('7 / 7');await expect(page.locator('#participants-list details')).toHaveCount(7);await page.locator('#participants-list summary').first().click();await expect(page.locator('#participants-list details').first()).toContainText('Módulo visitado: mapas');await page.locator('#btnCerrarSesion').click();await expect(page.locator('#loginOverlay')).toBeVisible();await expect(page.locator('.admin-participation')).toBeHidden();
});
