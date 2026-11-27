import { test, expect } from '@playwright/test';
import { startIsolatedServer } from './helpers/server.mjs';
let isolated, base;
test.beforeAll(async()=>{isolated=await startIsolatedServer({VITARA_SETUP_KEY:'bootstrap-isolated-test-only'});base=isolated.base;});
test.afterAll(async()=>{await isolated?.dispose();});
test('configuración inicial guiada exige clave privada, permite elegir credenciales y se cierra tras el alta',async({page,request})=>{
  await page.goto(base+'/admin.html');await expect(page.locator('#admin-setup')).toBeVisible();await expect(page.locator('#admin-setup')).toHaveAttribute('open','');
  await page.locator('[name=setupKey]').fill('incorrecta');await page.locator('[name=usuario]').fill('mi_operador');await page.locator('[name=contrasena]').fill('contrasena-larga-de-prueba');await page.locator('#admin-setup-form button').click();await expect(page.locator('#admin-config-status')).toContainText('clave de configuración');
  await page.locator('[name=setupKey]').fill('bootstrap-isolated-test-only');await page.locator('#admin-setup-form button').click();await expect(page.locator('#admin-config-status')).toContainText('Administrador creado');await expect(page.locator('#admin-setup')).toBeHidden();
  await page.locator('#loginUsuario').fill('mi_operador');await page.locator('#loginClave').fill('contrasena-larga-de-prueba');await page.locator('#btnLogin').click();await expect(page.locator('#loginOverlay')).toBeHidden();await expect(page.locator('.admin-test-guide')).toBeVisible();await expect(page.locator('#participants-summary')).toContainText('0 / 7');
  expect((await request.post(base+'/api/admin/configurar',{data:{setupKey:'bootstrap-isolated-test-only',usuario:'otro',contrasena:'otra-contrasena-larga'}})).status()).toBe(403);
  expect((await request.get('/data/ACCESO-PRIVADO-ADMIN.txt')).status()).toBe(404);expect((await request.get('/data/clave-inicial-admin.txt')).status()).toBe(404);
});
