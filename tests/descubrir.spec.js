import { test, expect } from '@playwright/test';
async function enter(page){await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.evaluate(()=>document.querySelector('#splash-skip').click());await page.locator('#access-name').fill('Exploradora');await page.locator('#access-form [type=submit]').click();await expect(page.locator('#access')).toBeHidden();}

test('galería IA, fichas, filtros y comparación educativa sin cotizaciones ficticias',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await enter(page);await page.locator('[data-view-link=tecnologia]').click();
  await expect(page.locator('.device-card')).toHaveCount(4);
  for(const img of await page.locator('.device-art img').all()) {await img.scrollIntoViewIfNeeded();await expect(img).toHaveJSProperty('complete',true);expect(await img.evaluate(el=>el.naturalWidth)).toBeGreaterThan(0);}
  await page.locator('#device-category').selectOption('diagnostico');await expect(page.locator('.device-card')).toHaveCount(1);await expect(page.locator('.device-card')).toContainText('Ecógrafo');
  await page.locator('#device-search').fill('no existe');await expect(page.locator('.device-gallery')).toContainText('No hay dispositivos');await page.locator('#device-search').clear();await page.locator('#device-category').selectOption('');
  await page.locator('[data-device-open=monitor]').first().click();await expect(page.locator('.device-dialog')).toBeVisible();await page.locator('[data-device-hotspot="2"]').click();await expect(page.locator('#device-hotspot-label')).toContainText('Soporte y movilidad');await page.locator('#device-dialog-compare').click();await page.keyboard.press('Escape');await expect(page.locator('.device-dialog')).toBeHidden();
  await page.locator('[data-device-select=ultrasound]').check();await page.locator('[data-device-select=infusion]').check();await page.locator('[data-device-select=defibrillator]').click();await expect(page.locator('[data-device-select=defibrillator]')).not.toBeChecked();
  await page.locator('#tech-tab-comparar').click();await expect(page.locator('.device-compare thead th')).toHaveCount(4);await expect(page.locator('.device-compare')).toContainText('Accesorios y consumibles');
  await page.locator('[data-procurement="0"]').check();await page.locator('[data-procurement="2"]').check();await expect(page.locator('#procurement-progress')).toHaveText('2 de 6 preguntas revisadas');
  const download=page.waitForEvent('download');await page.locator('#download-device-brief').click();expect((await download).suggestedFilename()).toBe('VITARA-lista-de-consulta.txt');await page.locator('#clear-device-selection').click();await expect(page.locator('#device-comparison')).toContainText('Tu selección empieza');expect(errors).toEqual([]);
});

test('proveedores referenciados, filtros y navegación por teclado',async({page})=>{
  await enter(page);await page.locator('[data-view-link=tecnologia]').click();await page.locator('#tech-tab-dispositivos').press('ArrowRight');await expect(page.locator('#tech-tab-proveedores')).toHaveAttribute('aria-selected','true');await expect(page.locator('.provider-card')).toHaveCount(4);await page.locator('[data-provider-filter=terapia]').click();await expect(page.locator('.provider-card')).toHaveCount(1);await expect(page.locator('.provider-card')).toContainText('B. Braun');await expect(page.locator('.provider-card a')).toHaveAttribute('href',/bbraun\.es/);await expect(page.locator('#tech-panel-proveedores')).toContainText('no acredita registro sanitario');
});

test('canales guiados, menú oficial 113, emergencia directa y descarga de contactos',async({page})=>{
  await enter(page);await page.locator('[data-view-link=canales]').click();await page.locator('[data-help-route=mental]').click();await expect(page.locator('#help-route-result')).toContainText('opción 5');await expect(page.locator('#help-route-result a')).toHaveAttribute('href','tel:113');await page.locator('[data-help-route=emergencia]').click();await expect(page.locator('#help-route-result a')).toHaveAttribute('href','tel:106');await expect(page.locator('#help-route-result')).toContainText('No retrases');
  await page.locator('[data-help-option="7"]').click();await expect(page.locator('#help-option-detail')).toContainText('SUSALUD');await page.locator('[data-help-option="3"]').click();await expect(page.locator('#help-option-detail')).toContainText('Subopción 4');
  const download=page.waitForEvent('download');await page.locator('#help-download-contact').click();expect((await download).suggestedFilename()).toBe('VITARA-ayuda-oficial.vcf');await page.locator('#help-open-chat').click();await expect(page.locator('#orientation-chat')).toBeVisible();
});

test('información: trazabilidad interactiva, lectura crítica y registro filtrable',async({page})=>{
  await enter(page);await page.locator('[data-view-link=fuentes]').click();await page.locator('#evidence-topic').selectOption('dispositivos');await expect(page.locator('#evidence-detail')).toContainText('creadas con IA');await page.locator('#evidence-tab-origen').press('End');await expect(page.locator('#evidence-detail')).toContainText('registro sanitario');
  await page.locator('[data-evidence-answer="0"]').click();await expect(page.locator('#evidence-feedback')).toContainText('Revisemos esa idea');await page.locator('[data-evidence-answer="1"]').click();await expect(page.locator('#evidence-feedback')).toContainText('Exacto');await page.locator('#evidence-next').click();await expect(page.locator('#evidence-question-count')).toContainText('2 / 3');
  await page.locator('#source-filter').fill('NO EXISTE');await expect(page.locator('#source-filter-status')).toContainText('0 de');await expect(page.locator('.source-table tbody tr:visible')).toHaveCount(0);await page.locator('#source-filter-clear').click();await expect(page.locator('.source-table tbody tr:visible')).toHaveCount(10);await expect(page.locator('.rail-admin')).toHaveAttribute('href','./admin.html');
});

test('símbolos de salud y nuevas experiencias móviles sin desbordamiento',async({page})=>{
  await page.setViewportSize({width:390,height:844});await enter(page);await expect(page.locator('#welcome-particles')).toHaveAttribute('data-symbols','6');
  for(const id of ['tecnologia','canales','fuentes']){await page.locator('#rail-open').click();await page.locator(`[data-view-link=${id}]`).click();await expect(page.locator(`#view-${id}`)).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);}
});
