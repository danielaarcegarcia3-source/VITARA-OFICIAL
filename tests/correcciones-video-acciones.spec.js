import { test, expect } from "@playwright/test";
import { startIsolatedServer } from "./helpers/server.mjs";
let server, base;
test.beforeAll(async () => {
  server = await startIsolatedServer({ VITARA_ALLOW_DEMO_PROFILES: "0" });
  base = server.base;
});
test.afterAll(async () => server?.dispose());
async function welcome(page, motion = "reduce") {
  await page.emulateMedia({ reducedMotion: motion });
  await page.goto(base);
  await page.locator("#splash-skip").evaluate((e) => e.click());
}
async function enter(page) {
  await welcome(page);
  await page.locator("#access-visitor").click();
  await expect(page.locator("#access")).toBeHidden();
}
async function stats(page) {
  await enter(page);
  await page.evaluate(() => window.Vitara.abrirVista("tablero"));
}

test("vídeo original restaurado, reproduce y pausa; acceso real sin ejemplo.test ni bloqueo de visitante", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await welcome(page, "no-preference");
  await expect(page.locator("#access-video")).toHaveAttribute(
    "src",
    "./VIDEOBANNER.mp4",
  );
  await expect
    .poll(
      () =>
        page.locator("#access-video").evaluate((video) => video.currentTime),
      { timeout: 20000 },
    )
    .toBeGreaterThan(0);
  await expect(page.locator("#access-video")).toBeVisible();
  await page.locator(".access-motion-toggle").click();
  await expect(page.locator("#access-video")).toHaveJSProperty("paused", true);
  await expect(page.locator("#access-video")).toHaveAttribute(
    "data-user-paused",
    "true",
  );
  await expect(page.locator("#login-card")).not.toContainText("concurso");
  await expect(page.locator("#access-demo")).toHaveCount(0);
  await expect(page.locator("#google-connect img")).toBeVisible();
  await page.locator("#access-name").fill("Usuario local");
  await page.locator("#access-email").fill("desconocido@gmail.com");
  await page.locator("#google-connect").click();
  await expect(page.locator("#google-status")).toContainText("activación");
  await page.screenshot({ path: ".arena/acceso-video-restaurado.png" });
  await page.locator("#access-visitor").click();
  await expect(page.locator("#access")).toBeHidden();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("g3.perfil")).email,
    ),
  ).toBe("");
  expect(
    (
      await request.post(base + "/api/perfiles", {
        data: {
          nombre: "No simulado",
          email: "local@example.test",
          consent: true,
          rol: "CIU",
        },
      })
    ).status(),
  ).toBe(403);
  expect(errors).toEqual([]);
});

test("movimiento reducido pausa vídeo, permite activarlo expresamente y encuadra el frasco completo", async ({
  page,
}) => {
  await welcome(page);
  await expect(page.locator("#access-video")).toHaveJSProperty(
    "autoplay",
    false,
  );
  await expect(page.locator("#access-video")).toHaveJSProperty("paused", true);
  await page.locator(".access-motion-toggle").click();
  await expect
    .poll(() => page.locator("#access-video").evaluate((v) => v.currentTime), {
      timeout: 20000,
    })
    .toBeGreaterThan(0);
  await page.locator("#access-visitor").click();
  await page.locator(".home-more summary").first().click();
  const image = page.locator(".journey-art img");
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  const box = await image.boundingBox(),
    frame = await page.locator(".journey-art").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(frame.x);
  expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
  expect(await image.evaluate((el) => getComputedStyle(el).objectFit)).toBe(
    "contain",
  );
  await page
    .locator("#journey-panel")
    .screenshot({ path: ".arena/medicamentos-encuadre-corregido.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await image.boundingBox(),
    parent = await page.locator(".journey-art").boundingBox();
  expect(mobile.width).toBeLessThanOrEqual(parent.width);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test("estadística clara: compara meses exactos, intercambia, descarga lectura y filtra muestra local", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await stats(page);
  expect(
    await page
      .locator(".stats-observatory")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgb(237, 244, 229)");
  await page
    .locator(".stats-observatory")
    .screenshot({ path: ".arena/estadisticas-paleta-clara.png" });
  await page.locator("#stats-month-a").selectOption("0");
  await page.locator("#stats-month-b").selectOption("11");
  const delta = await page.evaluate(() => {
    const h = window.Vitara.D.infoSismed.historico12Meses;
    return (h[11].dispo - h[0].dispo).toFixed(2);
  });
  await expect(page.locator("#stats-action-delta")).toContainText(
    delta + " p.p.",
  );
  await page.locator("#stats-month-swap").click();
  expect(await page.locator("#stats-month-a").inputValue()).toBe("11");
  const download = page.waitForEvent("download");
  await page.locator("#stats-export-reading").click();
  expect((await download).suggestedFilename()).toBe(
    "vitara-lectura-reporte.txt",
  );
  await page.locator("#stats-place-low").check();
  const expected = await page.evaluate(
    () => window.Vitara.D.ipress.filter((p) => p.dispo < 91).length,
  );
  await expect(
    page.locator("#tabla-ipress-body [data-ipress]:visible"),
  ).toHaveCount(expected);
  await page.locator("#stats-place-low").uncheck();
  await expect(page.locator("[data-prepare-place]")).toHaveCount(
    await page.evaluate(() => window.Vitara.D.ipress.length),
  );
  await page.locator("#tabla-ipress-q").fill("sin resultados inexistentes");
  await expect(page.locator("#stats-place-count")).toContainText("0 filas");
  await page.locator("#tabla-ipress-q").fill("");
  await page.locator("[data-prepare-place]").first().click();
  await expect(page.locator("#stats-action-resource")).toBeFocused();
  await page
    .locator("#stats-action-desk")
    .screenshot({ path: ".arena/estadisticas-consulta-accionable.png" });
  expect(errors).toEqual([]);
});

test("desde una fila prepara recurso, sede y cantidad, y solo registra con confirmación explícita", async ({
  page,
  request,
}) => {
  await stats(page);
  let posts = 0;
  page.on("request", (req) => {
    if (req.url().endsWith("/api/solicitudes") && req.method() === "POST")
      posts++;
  });
  const code = await page
    .locator("[data-prepare-place]")
    .first()
    .getAttribute("data-prepare-place");
  await page.locator("[data-prepare-place]").first().click();
  await page
    .locator("#stats-action-resource")
    .fill("Monitor para consulta de accesorios");
  await page.locator("#stats-action-quantity").fill("2");
  await page.locator("#stats-action-unit").selectOption("equipos");
  await page.locator("#stats-prepare-request").click();
  expect(posts).toBe(0);
  await expect(page.locator("#view-solicitudes")).toBeVisible();
  await expect(page.locator("#sol-item")).toHaveValue(
    "Monitor para consulta de accesorios",
  );
  await expect(page.locator("#sol-cantidad")).toHaveValue("2");
  await expect(page.locator("#sol-unidad")).toHaveValue("equipos");
  const sede = await page.evaluate(
    (c) => window.Vitara.D.ipress.find((p) => String(p.cod) === c).nombre,
    code,
  );
  await expect(page.locator("#sol-sede")).toHaveValue(sede);
  const pending = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/solicitudes") && r.request().method() === "POST",
  );
  await page.locator("#sol-submit").click();
  const data = await (await pending).json();
  expect(data.ok).toBe(true);
  expect(data.solicitud.sede).toBe(sede);
  expect(data.solicitud.cantidad).toBe(2);
  expect(posts).toBe(1);
  const follow = await request.get(
    base + "/api/solicitudes?codigo=" + data.solicitud.codigo,
  );
  expect((await follow.json()).solicitud.cantidad).toBe(2);
});

test("móvil con texto grande: filtros, acciones y formulario sin desborde", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stats(page);
  await page.evaluate(() => window.Vitara.setA11y("texto", true));
  await page.locator("#stats-action-desk").scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.locator("#stats-action-resource").fill("Consulta de recurso");
  await page.locator("#stats-prepare-request").click();
  await expect(page.locator("#view-solicitudes")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
