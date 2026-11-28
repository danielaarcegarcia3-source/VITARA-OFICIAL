import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { startIsolatedServer } from "./helpers/server.mjs";
let server, base;
test.beforeAll(async () => {
  server = await startIsolatedServer();
  base = server.base;
});
test.afterAll(async () => {
  await server?.dispose();
});
async function enter(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.locator("#splash-skip").evaluate((e) => e.click());
  await page.locator("#access-name").fill("Prueba directorio");
  await page.locator("#access-form [type=submit]").click();
  if (await page.locator("#rail-open").isVisible())
    await page.locator("#rail-open").click();
  await page.locator("[data-view-link=mapas]").click();
  await expect(page.locator("#atlas-department")).toBeEnabled();
}

test("dataset público con 45 referencias, procedencia y 25 territorios, sin atribuir stock ni códigos RENIPRESS", async ({
  request,
}) => {
  const response = await request.get(
    base + "/assets/territorios/directorio-salud.json",
  );
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/json");
  const data = await response.json();
  const geo = JSON.parse(
    await readFile("assets/geo/peru_departamental_simple.geojson", "utf8"),
  );
  expect(data.establecimientos).toHaveLength(45);
  expect(
    [...new Set(data.establecimientos.map((p) => p.departamento))].sort(),
  ).toEqual(geo.features.map((f) => f.properties.NOMBDEP).sort());
  expect(new Set(data.establecimientos.map((p) => p.id)).size).toBe(45);
  for (const row of data.establecimientos) {
    expect(row.nombre).toBeTruthy();
    expect(row.direccion).toBeTruthy();
    expect(row.telefono).toBeTruthy();
    expect(row.distrito).toBeNull();
    expect(row).not.toHaveProperty("cod");
    expect(row).not.toHaveProperty("dispo");
    expect(row).not.toHaveProperty("stock");
    expect(row).not.toHaveProperty("horario");
    expect(new URL(data.fuentes[row.fuenteId].url).hostname).toBe("www.gob.pe");
    expect(data.fuentes[row.fuenteId].actualizado).toBe("2025-03-14");
  }
  for (const path of [
    "/package.json",
    "/data/participacion.json",
    "/assets/territorios/privado.json",
  ])
    expect((await request.get(base + path)).status()).toBe(404);
});

test("todos los departamentos muestran referencias y cada ficha conserva su fuente y límites", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await expect(page.locator("#mapa-real")).toHaveAttribute(
    "data-research",
    "loaded",
  );
  const departments = await page
    .locator("#atlas-department option")
    .evaluateAll((options) => options.map((o) => o.value).filter(Boolean));
  for (const department of departments) {
    await page.locator("#atlas-department").selectOption(department);
    await expect(
      page.locator(".atlas-place[data-origin=minsa]").first(),
    ).toBeVisible();
  }
  await page.locator("#atlas-department").selectOption("AREQUIPA");
  await page.locator(".atlas-place[data-origin=minsa]").first().click();
  await expect(page.locator("#inspector-body")).toContainText(
    "Honorio Delgado",
  );
  await expect(page.locator("#inspector-body")).toContainText(
    "Av. Alcides Carrión 505",
  );
  await expect(page.locator("#inspector-body")).toContainText("14/03/2025");
  await expect(page.locator("#inspector-body")).toContainText(
    "Sin datos de disponibilidad",
  );
  await expect(page.locator('#inspector-body a[href*="14957"]')).toHaveCount(1);
  await page.locator("#inspector-close").click();
  await page.locator("#atlas-department").selectOption("LIMA");
  await expect(page.locator("#atlas-health-context")).toContainText("DIRIS");
  await expect(page.locator(".atlas-place[data-origin=minsa]")).toHaveCount(4);
  await page.locator("#atlas-query").fill("Huacho");
  await expect(page.locator(".atlas-place")).toHaveCount(1);
  await page.locator("#atlas-query").fill("");
  await page.locator("#atlas-type").selectOption("posta");
  await expect(page.locator("#atlas-results")).toContainText(
    "No hay establecimientos",
  );
  await page.locator("#atlas-type").selectOption("");
  await page.locator("#atlas-origin").selectOption("local");
  await expect(page.locator(".atlas-place")).toHaveCount(0);
  await page.locator("#atlas-origin").selectOption("minsa");
  await expect(page.locator(".atlas-place")).toHaveCount(4);
  await page.locator("#atlas-district").selectOption("__sin_distrito__");
  await expect(page.locator(".atlas-place")).toHaveCount(4);
  await page.locator("#atlas-department").selectOption("CUSCO");
  await page.locator("[data-reference-preview]").first().click();
  await expect(page.locator("#inspector-body")).toContainText(
    "Hospital de Apoyo Departamental Cusco",
  );
  await page.locator("#inspector-close").click();
  await page.locator("#atlas-type").selectOption("centro");
  await expect(page.locator(".atlas-place")).toHaveCount(1);
  await expect(page.locator(".atlas-place")).toContainText("Belempampa");
  await page.locator("#atlas-type").selectOption("");
  await page.locator("#atlas-district").selectOption("");
  await page.locator(".atlas-region-card").scrollIntoViewIfNeeded();
  await page.screenshot({ path: ".arena/atlas-directorio-cusco.png" });
  expect(errors).toEqual([]);
});

test("fallo documental no se presenta como ausencia de hospitales, permite reintentar y mantiene la base regional", async ({
  page,
}) => {
  let failing = true;
  await page.route(
    "**/assets/territorios/directorio-salud.json*",
    async (route) => {
      if (failing) await route.fulfill({ status: 503, body: "No disponible" });
      else await route.continue();
    },
  );
  await enter(page);
  await expect(page.locator("#mapa-real")).toHaveAttribute(
    "data-research",
    "error",
  );
  await expect(page.locator("#atlas-research-status")).toContainText(
    "no significa que no existan",
  );
  await page.locator("#atlas-department").selectOption("LA LIBERTAD");
  await expect(
    page.locator(".atlas-place[data-origin=local]").first(),
  ).toBeVisible();
  failing = false;
  await page.locator("#atlas-research-retry").click();
  await expect(page.locator("#mapa-real")).toHaveAttribute(
    "data-research",
    "loaded",
  );
  await page.locator("#atlas-department").selectOption("PIURA");
  await expect(page.locator(".atlas-place[data-origin=minsa]")).toHaveCount(2);
});

test("directorio nacional legible y sin desborde móvil con fuente y teléfono institucional", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await expect(page.locator("#mapa-real")).toHaveAttribute(
    "data-research",
    "loaded",
  );
  await page.locator("#atlas-department").selectOption("UCAYALI");
  await page.locator(".atlas-place[data-origin=minsa]").first().click();
  await expect(
    page.locator('#inspector-body a[href="tel:061597088"]'),
  ).toBeVisible();
  await page.locator("#inspector-close").click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.locator("#atlas-health-context").scrollIntoViewIfNeeded();
  await page.screenshot({ path: ".arena/atlas-directorio-movil.png" });
});
