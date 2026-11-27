import { test, expect } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServices } from '../server-services.mjs';
let server, base, dir;
test.beforeAll(async()=>{
  dir=fs.mkdtempSync(path.join(os.tmpdir(),'vitara-setup-ui-'));process.env.VITARA_DATA_DIR=dir;process.env.VITARA_SETUP_KEY='bootstrap-isolated-test-only';delete process.env.ADMIN_USUARIO;delete process.env.ADMIN_CLAVE;
  const services=createServices({root:dir});server=http.createServer(async(req,res)=>{if(await services.handle(req,res,new URL(req.url,'http://local').pathname))return;const remote=await fetch('http://127.0.0.1:3000'+req.url);const headers=Object.fromEntries(remote.headers);delete headers['content-encoding'];delete headers['content-length'];delete headers['transfer-encoding'];res.writeHead(remote.status,headers);res.end(Buffer.from(await remote.arrayBuffer()));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});delete process.env.VITARA_DATA_DIR;delete process.env.VITARA_SETUP_KEY;});
test('configuración inicial guiada exige clave privada, permite elegir credenciales y se cierra tras el alta',async({page,request})=>{
  await page.goto(base+'/admin.html');await expect(page.locator('#admin-setup')).toBeVisible();await expect(page.locator('#admin-setup')).toHaveAttribute('open','');
  await page.locator('[name=setupKey]').fill('incorrecta');await page.locator('[name=usuario]').fill('mi_operador');await page.locator('[name=contrasena]').fill('contrasena-larga-de-prueba');await page.locator('#admin-setup-form button').click();await expect(page.locator('#admin-config-status')).toContainText('clave de configuración');
  await page.locator('[name=setupKey]').fill('bootstrap-isolated-test-only');await page.locator('#admin-setup-form button').click();await expect(page.locator('#admin-config-status')).toContainText('Administrador creado');await expect(page.locator('#admin-setup')).toBeHidden();
  await page.locator('#loginUsuario').fill('mi_operador');await page.locator('#loginClave').fill('contrasena-larga-de-prueba');await page.locator('#btnLogin').click();await expect(page.locator('#loginOverlay')).toBeHidden();await expect(page.locator('.admin-test-guide')).toBeVisible();await expect(page.locator('#participants-summary')).toContainText('0 / 7');
  expect((await request.post(base+'/api/admin/configurar',{data:{setupKey:'bootstrap-isolated-test-only',usuario:'otro',contrasena:'otra-contrasena-larga'}})).status()).toBe(403);
  expect((await request.get('/data/ACCESO-PRIVADO-ADMIN.txt')).status()).toBe(404);expect((await request.get('/data/clave-inicial-admin.txt')).status()).toBe(404);
});
