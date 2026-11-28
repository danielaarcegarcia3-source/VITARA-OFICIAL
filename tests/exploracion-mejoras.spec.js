import { test, expect } from "@playwright/test";
// Recorridos de regresión en modo expandido; la nueva navegación inicial se prueba aparte.
test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('vitara.navigation.all', 'true')); });
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
  await page.locator("#access-name").fill("Prueba exploración");
  await page.locator("#access-form [type=submit]").click();
  await expect(page.locator("#access")).toBeHidden();
}

test("bienvenida separa con una y atlas recorre los 25 territorios sin inventar registros", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await expect(
    page.locator(".splash__copy h2,.splash h2").first(),
  ).toContainText("con una");
  await enter(page);
  await page.locator("[data-view-link=mapas]").click();
  await expect(page.locator("#atlas-department")).toBeEnabled();
  const departments = await page
    .locator("#atlas-department option")
    .evaluateAll((nodes) => nodes.map((n) => n.value).filter(Boolean));
  expect(departments).toHaveLength(25);
  expect(departments).toContain("CALLAO");
  await expect(page.locator("#mapa-real")).toHaveAttribute(
    "data-research",
    "loaded",
  );
  for (const name of departments) {
    await page.locator("#atlas-department").selectOption(name);
    await expect(page.locator("#atlas-region-card strong")).toHaveText(name);
    await expect(page.locator("#atlas-region-card path")).not.toHaveCount(0);
    await expect(page.locator(".atlas-place").first()).toBeVisible();
    await expect(page.locator("#atlas-health-context")).toContainText(
      "referencias MINSA",
    );
  }
  await page.locator("#atlas-department").selectOption("LA LIBERTAD");
  await expect(page.locator(".atlas-place").first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator(".atlas-image").scrollIntoViewIfNeeded();
  const area = await page.locator(".atlas-image").boundingBox();
  await page.mouse.move(area.x + area.width * 0.7, area.y + area.height * 0.3);
  await expect(page.locator(".atlas-image img")).toHaveAttribute(
    "style",
    /rotateX\((?!0deg)/,
  );
  await page.locator("#atlas-motion").click();
  await expect(page.locator("#atlas-motion")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.locator(".atlas-image img")).toHaveAttribute(
    "style",
    /rotateX\(0deg\)/,
  );
  await page.locator("[data-zoom=in]").click();
  await expect(page.locator(".atlas-image img")).toHaveAttribute(
    "style",
    /scale\(1.2\)/,
  );
  await page.screenshot({ path: ".arena/atlas-25-territorios.png" });
  expect(errors).toEqual([]);
});

test("plano con seis ambientes, selección por teclado y capas reversibles", async ({
  page,
}) => {
  await enter(page);
  await page.locator("[data-view-link=planos]").click();
  await expect(page.locator("[data-floor-room]")).toHaveCount(6);
  for (const name of [
    "patio",
    "farmacia",
    "consultorio",
    "espera",
    "telesalud",
    "equipos",
  ]) {
    await page.locator(`[data-floor-room=${name}]`).click();
    await expect(page.locator(`[data-floor-room=${name}]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".floor-svg .room.is-selected")).toHaveCount(1);
    await expect(page.locator(".floor-detail")).toContainText(
      "Modelo educativo",
    );
  }
  await page.locator(".floor-svg .room").nth(1).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".floor-detail h4")).toHaveText(
    "Farmacia y cadena de frío",
  );
  await page.locator("#floor-route").click();
  await expect(page.locator("#floor-flow")).toBeVisible();
  await page.locator("#floor-route").click();
  await expect(page.locator("#floor-flow")).toBeHidden();
  await page.locator("#floor-equipment").click();
  await expect(page.locator("#floor-furniture")).toBeHidden();
  await page.locator("#floor-equipment").click();
  await expect(page.locator("#floor-furniture")).toBeVisible();
  await page.locator("#floor-focus").click();
  await expect(page.locator(".floor-svg")).not.toHaveAttribute(
    "viewBox",
    "0 0 920 570",
  );
  await page.locator("#floor-fit").click();
  await expect(page.locator(".floor-svg")).toHaveAttribute(
    "viewBox",
    "0 0 920 570",
  );
  await page.screenshot({ path: ".arena/plano-interactivo-ambientes.png" });
});

test("texto aumenta realmente solo al activar, persiste y se restaura sin desborde móvil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  const font = (selector) =>
    page
      .locator(selector)
      .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(await page.locator("html").getAttribute("data-texto")).not.toBe(
    "grande",
  );
  await page.locator("#rail-open").click();
  await page.locator("[data-view-link=comunidad]").click();
  const selector = "#a11y-card h3";
  const before = await font(selector);
  await page.locator("#a11y-texto").click();
  await expect(page.locator("html")).toHaveAttribute("data-texto", "grande");
  await expect.poll(() => font(selector)).toBeGreaterThan(before * 1.25);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  for (const view of ["mapas", "planos", "inicio", "comunidad"]) {
    await page.locator("#rail-open").click();
    await page.locator(`[data-view-link=${view}]`).click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
  }
  await expect.poll(() => font(selector)).toBeGreaterThan(before * 1.25);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-texto", "grande");
  await page.locator("#splash-skip").evaluate((e) => e.click());
  // La sesión invitada puede restaurarse o volver a mostrar el acceso.
  if (await page.locator("#access").isVisible()) {
    await page.locator("#access-name").fill("Prueba texto");
    await page.locator("#access-form [type=submit]").click();
  }
  await page.locator("#rail-open").click();
  await page.locator("[data-view-link=comunidad]").click();
  await page.locator("#a11y-texto").click();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-texto",
    "grande",
  );
  await expect.poll(() => font(selector)).toBe(before);
});
