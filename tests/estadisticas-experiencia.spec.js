import { test, expect } from "@playwright/test";
import { startIsolatedServer } from "./helpers/server.mjs";
let server, base;
test.beforeAll(async () => {
  server = await startIsolatedServer();
  base = server.base;
});
test.afterAll(async () => {
  await server?.dispose();
});
async function enter(page, motion = "reduce") {
  await page.emulateMedia({ reducedMotion: motion });
  await page.goto(base);
  await page.locator("#splash-skip").evaluate((e) => e.click());
  await page.locator("#access-name").fill("Prueba observatorio");
  await page.locator("#access-form [type=submit]").click();
  if (await page.locator("#rail-open").isVisible())
    await page.locator("#rail-open").click();
  await page.locator("[data-view-link=tablero]").click();
}

test("observatorio conserva los ocho valores, filtra y explora indicadores sin inventar series", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await expect(page.locator("#stats-focus-value")).toHaveText("92.90%");
  await page.locator("#stats-focus-next").click();
  await expect(page.locator("#stats-focus-name")).toHaveText("Sobrestock");
  await page.locator("#stats-focus-prev").click();
  await expect(page.locator("#stats-focus-name")).toHaveText("Disponibilidad");
  const values = await page.locator("#kpis-sismed .kpi__v").allTextContents();
  expect(values.map((v) => v.trim())).toEqual([
    "92.90%",
    "34.82%",
    "58.03%",
    "7.10%",
    "4.85%",
    "2.30%",
    "6.60%",
    "339",
  ]);
  await page.locator("[data-stats-filter=riesgo]").click();
  await expect(page.locator("#kpis-sismed .kpi:visible")).toHaveCount(4);
  await expect(page.locator("#stats-focus-value")).toHaveText("7.10%");
  await page.locator("[data-spotlight=desabastecido]").click();
  await expect(page.locator("#stats-focus-value")).toHaveText("2.30%");
  await expect(page.locator("[data-spotlight=desabastecido]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#stats-focus-open").click();
  await expect(page.locator("#inspector-body")).toContainText(
    "no una cifra nacional",
  );
  await page.locator("#inspector-close").click();
  await page.locator("[data-stats-filter=cobertura]").click();
  await expect(page.locator("#kpis-sismed .kpi:visible")).toHaveCount(1);
  await expect(page.locator("#stats-focus-value")).toHaveText("339");
  await expect(page.locator("#stats-focus-unit")).toHaveText(
    "establecimientos · 12 redes",
  );
  await page.locator("[data-stats-filter=all]").click();
  await expect(page.locator("#kpis-sismed .kpi:visible")).toHaveCount(8);
  await page.locator("[data-spotlight=disponibilidadGlobal]").click();
  await page.screenshot({ path: ".arena/estadisticas-observatorio.png" });
  await page.locator("[data-view-link=inicio]").click();
  await page.locator("[data-view-link=tablero]").click();
  await expect(page.locator(".stats-observatory")).toHaveCount(1);
  await expect(page.locator("[data-spotlight]")).toHaveCount(8);
  expect(errors).toEqual([]);
});

test("comparación usa redes reales, calcula puntos porcentuales y permite misma red", async ({
  page,
}) => {
  await enter(page);
  await page.locator("#stats-compare-toggle").click();
  await expect(page.locator("#stats-compare")).toBeVisible();
  await expect(page.locator("#stats-compare-a option")).toHaveCount(12);
  const ids = await page
    .locator("#stats-compare-a option")
    .evaluateAll((options) => options.map((o) => o.value));
  await page.locator("#stats-compare-a").selectOption(ids[0]);
  await page.locator("#stats-compare-b").selectOption(ids[1]);
  const gap = await page.evaluate(
    ([a, b]) => {
      const rows = window.Vitara.D.infoSismed.redesSalud;
      return Math.abs(
        rows.find((r) => r.id === a).dispo - rows.find((r) => r.id === b).dispo,
      ).toFixed(2);
    },
    [ids[0], ids[1]],
  );
  await expect(page.locator(".stats-gap strong")).toContainText(gap);
  await expect(page.locator(".stats-compare-note")).toContainText(
    "Puntos porcentuales",
  );
  await page.locator("#stats-compare-b").selectOption(ids[0]);
  await expect(page.locator(".stats-gap")).toContainText("Misma red");
  await expect(page.locator(".stats-gap strong")).toContainText("0.00");
  await page.locator("#stats-compare-close").click();
  await expect(page.locator("#stats-compare")).toBeHidden();
  await expect(page.locator("#stats-compare-toggle")).toBeFocused();
});

test("histórico tiene controles reales, pausa al navegar y respeta movimiento reducido", async ({
  page,
}) => {
  await enter(page, "no-preference");
  await page.locator("#stats-replay").click();
  expect(
    await page
      .locator(".stats-observatory")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("stats-rise");
  await page.locator("#stats-jump-history").click();
  await expect(page.locator("#stats-month")).toBeFocused();
  await page.locator("#stats-history-play").click();
  await expect(page.locator("#stats-month-value")).toContainText("nov 2025");
  await expect(page.locator("#stats-month-value")).toContainText("dic 2025", {
    timeout: 4000,
  });
  await page.locator("#stats-history-play").click();
  await expect(page.locator("#stats-history-play")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator("#stats-history-prev").click();
  await expect(page.locator("#stats-month-value")).toContainText("nov 2025");
  await page.locator("#stats-history-next").click();
  await expect(page.locator("#stats-month-value")).toContainText("dic 2025");
  await page.locator("#stats-history-play").click();
  await page.locator("[data-view-link=inicio]").click();
  await expect(page.locator("#stats-history-play")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.locator("[data-view-link=tablero]").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#stats-history-play")).toBeDisabled();
  await page.locator("#stats-replay").click();
  expect(
    await page
      .locator(".stats-observatory")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});

test("móvil conserva reflujo, botones y comparación también con texto ampliado", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await page.screenshot({ path: ".arena/estadisticas-movil-observatorio.png" });
  await page.locator("#stats-compare-toggle").click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.locator("#stats-compare-close").click();
  await page.evaluate(() => window.Vitara.setA11y("texto", true));
  await expect(page.locator("html")).toHaveAttribute("data-texto", "grande");
  await page.locator("[data-stats-filter=riesgo]").click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.locator("#stats-compare-toggle").click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: ".arena/estadisticas-movil-grande.png" });
});
