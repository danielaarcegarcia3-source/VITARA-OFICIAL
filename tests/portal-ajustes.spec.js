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
async function enter(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.evaluate(() => document.getElementById("splash-skip").click());
  await page.locator("#access-name").fill("Exploradora de prueba");
  await page.locator("#access-form [type=submit]").click();
  await expect(page.locator("#access")).toBeHidden();
}

test("identidad nacional, base apenas cálida y cinco temas de medicamentos sobre ADN", async ({
  page,
}) => {
  await page.goto(base);
  await expect(page.locator(".access__territory")).not.toContainText(
    /libertad/i,
  );
  await expect(page.locator(".brand__sub")).toHaveText(
    "Salud verificable · Perú",
  );
  await enter(page);
  expect(
    await page
      .locator(".viewport")
      .evaluate((e) => getComputedStyle(e).backgroundColor),
  ).toBe("rgb(250, 248, 243)");
  await expect(page.locator(".dna-target")).toHaveCount(5);
  const titles = [
    "El nombre que importa",
    "Consultar no es encontrar stock",
    "Conservar también es cuidar",
    "Sin automedicación",
    "Revisa antes de utilizar",
  ];
  for (let i = 0; i < 5; i++) {
    await page
      .locator(".dna-target")
      .nth(i)
      .evaluate((e) => e.click());
    await expect(page.locator("#dna-panel h3")).toContainText(titles[i]);
    await expect(page.locator("#dna-panel")).toContainText(
      "El ADN es un soporte visual",
    );
    await page.locator("#dna-panel-close").click();
  }
});

test("SISMED conserva cifras, abre indicadores y redes, ordena y recorre meses con teclado", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await page.locator("[data-view-link=tablero]").click();
  await expect(page.locator("#kpis-sismed .kpi")).toHaveCount(8);
  await expect(page.locator("#kpis-sismed .kpi__v").first()).toContainText(
    "92.90",
  );
  await page.locator("[data-metric=disponibilidadGlobal]").click();
  await expect(page.locator("#inspector")).toBeVisible();
  await expect(page.locator("#inspector-body")).toContainText(
    "no una cifra nacional",
  );
  await page.locator("#inspector-close").click();
  expect(
    await page
      .locator("#bars-redes .bar-row__fill")
      .first()
      .evaluate((e) => e.getBoundingClientRect().width),
  ).toBeGreaterThan(10);
  await page.locator("#stats-sort").selectOption("asc");
  const values = await page
    .locator("#bars-redes .bar-row__v")
    .allTextContents();
  expect(parseFloat(values[0])).toBeLessThanOrEqual(parseFloat(values.at(-1)));
  await page.locator("#bars-redes button").first().click();
  await expect(page.locator("#inspector-body")).toContainText("Normostock");
  await page.locator("#inspector-close").click();
  await page.locator("#stats-month").focus();
  await page.keyboard.press("Home");
  await expect(page.locator("#stats-month-value")).toContainText("nov 2025");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#stats-month-value")).toContainText("dic 2025");
  expect(
    await page
      .locator("#bars-redes .bar-row__fill")
      .first()
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.screenshot({
    path: ".arena/portal-estadisticas-corregidas.png",
    fullPage: false,
  });
  expect(errors).toEqual([]);
});

test("Fuentes tiene títulos legibles y Canales no incluye botones decorativos; móvil sin desborde", async ({
  page,
}) => {
  await enter(page);
  await page.locator("[data-view-link=fuentes]").click();
  await page.locator(".evidence-lab").scrollIntoViewIfNeeded();
  for (const selector of [".evidence-lab h3", ".evidence-lab h4"])
    expect(
      await page.locator(selector).evaluate((e) => getComputedStyle(e).color),
    ).toBe("rgb(255, 248, 229)");
  await page.screenshot({
    path: ".arena/fuentes-contraste-corregido.png",
    fullPage: false,
  });
  await page.locator("[data-view-link=canales]").click();
  await expect(page.locator("#canales-title")).toHaveText(
    "Canales reales para orientarte",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-view-link=tablero]").evaluate((e) => e.click());
  await expect(page.locator("#stats-sort")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("guía ampliada responde temas concretos, mantiene urgencias y no finge IA externa", async ({
  request,
}) => {
  for (const [message, text] of [
    ["¿Qué es el ADN?", "adenina"],
    ["Replicación del ADN", "semiconservativa"],
    ["¿Cómo leo SISMED?", "La Libertad"],
    ["¿Qué es el SIS?", "Seguro Integral"],
    ["Línea 113", "MINSA"],
    ["¿Qué significa DCI?", "principio activo"],
    ["¿Qué es RENIPRESS?", "SUSALUD"],
    ["¿Cómo hago un respaldo?", "No incluye perfiles"],
    ["¿Funciona con mi laptop apagada?", "Render"],
    ["¿Eres una IA?", "guía local"],
    ["no puedo respirar, explícame el ADN", "106"],
  ]) {
    const response = await request.post(base + "/api/orientacion", {
      data: { message },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.mode).toBe("local");
    expect(data.answer.toLowerCase()).toContain(text.toLowerCase());
  }
  const unknown = await request.post(base + "/api/orientacion", {
    data: { message: "explica la relatividad cuántica" },
  });
  expect((await unknown.json()).answer).toContain(
    "No tengo información suficiente",
  );
  expect(
    (
      await request.post(base + "/api/orientacion", {
        data: { message: "pregunta abierta", useAI: true },
      })
    ).status(),
  ).toBe(503);
  expect(
    (await request.get(base + "/orientation-knowledge.mjs")).status(),
  ).toBe(404);
});
