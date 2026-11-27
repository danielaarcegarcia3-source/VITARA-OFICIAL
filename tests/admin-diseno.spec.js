import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { startIsolatedServer } from "./helpers/server.mjs";
let isolated, base;
const credentials = {
  usuario: "operador_diseno",
  contrasena: "solo-pruebas-de-diseno-aisladas",
};
test.beforeAll(async () => {
  isolated = await startIsolatedServer({
    ADMIN_USUARIO: credentials.usuario,
    ADMIN_CLAVE: credentials.contrasena,
  });
  base = isolated.base;
});
test.afterAll(async () => {
  await isolated?.dispose();
});
async function login(page, available = true) {
  await page.goto(base + "/admin.html");
  await page.locator("#loginUsuario").fill(credentials.usuario);
  await page.locator("#loginClave").fill(credentials.contrasena);
  await page.locator("#btnLogin").click();
  await expect(page.locator("#loginOverlay")).toBeHidden();
  if (available)
    await expect(page.locator("#requests-status")).toContainText(
      "Última consulta",
    );
}

test("panel renovado: acceso privado, estado real, navegación, vacío y estilos sin errores CSP", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      /Content Security Policy|Refused to execute/.test(m.text())
    )
      errors.push(m.text());
  });
  await page.goto(base + "/admin.html");
  await expect(page.locator("#loginOverlay")).toBeVisible();
  await expect(page.locator(".admin-container")).toBeHidden();
  await expect(page.locator("#loginUsuario")).toBeFocused();
  await page.screenshot({
    path: ".arena/admin-acceso-nuevo.png",
    fullPage: true,
  });
  await login(page);
  await expect(page.locator("#admin-heading")).toContainText(
    "Conecta. Escucha.",
  );
  await expect(page.locator("#admin-stream-status")).toHaveText(
    "Actualizaciones en vivo",
  );
  await expect(page.locator(".admin-kpi-card")).toHaveCount(4);
  await expect(page.locator("#kpi-total-sol")).toHaveText("0");
  await expect(page.locator(".admin-empty")).toContainText(
    "Una bandeja lista para escuchar",
  );
  await expect(page.locator("#participants-summary")).toContainText("0 / 7");
  await page.screenshot({
    path: ".arena/admin-escritorio-nuevo.png",
    fullPage: true,
  });
  await page.locator('.admin-rail nav a[href="#participantes-panel"]').click();
  await expect(page).toHaveURL(/#participantes-panel$/);
  await expect(page.locator("#participants-title")).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".admin-kpi-card")
      .first()
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("0s");
  expect(errors).toEqual([]);
});

test("buscar, filtrar cerradas, responder con teclado y exportar sin cambiar las API", async ({
  page,
  request,
}) => {
  const response = await request.post(base + "/api/auth/login", {
    data: credentials,
  });
  const { token } = await response.json();
  const create = await request.post(base + "/api/solicitudes", {
    data: {
      item: "Recurso de prueba de diseño",
      sede: "Sede de ensayo",
      alias: "Equipo de prueba",
    },
  });
  expect(create.status()).toBe(201);
  const { solicitud } = await create.json();
  await request.patch(base + "/api/solicitudes/" + solicitud.codigo, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      estado: "cerrado",
      respuesta: "Respuesta de ensayo sin disponibilidad certificada.",
    },
  });
  await login(page);
  await expect(page.locator("#kpi-total-sol")).toHaveText("1");
  await page.locator("[data-filtro=cerrado]").click();
  await expect(page.locator("[data-filtro=cerrado]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".solicitud-item .badge-nivel")).toHaveText(
    "Cerrada",
  );
  await expect(page.locator(".solicitud-item__meta")).toContainText(
    "Sede de ensayo",
  );
  await page.locator("#admin-search").fill("no existe");
  await expect(page.locator(".admin-empty")).toContainText(
    "No hay coincidencias",
  );
  await page.locator("#admin-search").fill(solicitud.codigo);
  await expect(page.locator(".solicitud-item")).toHaveCount(1);
  await page.locator(".btn-abrir-resp").click();
  await expect(page.locator("#modalRespEstado")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#btnCerrarModalResp")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.locator("#formResponderSolicitud button[type=submit]"),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#modalResponder")).toBeHidden();
  await expect(page.locator(".btn-abrir-resp")).toBeFocused();
  await page.locator(".btn-abrir-resp").click();
  await page.locator("#modalRespEstado").selectOption("respondido");
  await page
    .locator("#modalRespTexto")
    .fill("Respuesta actualizada en el ensayo de diseño.");
  await page.locator("#formResponderSolicitud [type=submit]").click();
  await expect(page.locator("#modalResponder")).toBeHidden();
  await page.locator("[data-filtro=todas]").click();
  await expect(page.locator(".solicitud-item__respuesta")).toContainText(
    "Respuesta actualizada",
  );
  const download = page.waitForEvent("download");
  await page.locator("#btnExportarBackup").click();
  const file = await download;
  const backup = JSON.parse(fs.readFileSync(await file.path(), "utf8"));
  expect(backup.datos.some((s) => s.codigo === solicitud.codigo)).toBe(true);
  await page.locator("#btnCerrarSesion").click();
  await expect(page.locator("#loginOverlay")).toBeVisible();
  await expect(page.locator(".admin-container")).toBeHidden();
  await expect(page.locator("#loginUsuario")).toBeFocused();
  await expect(page.locator(".solicitud-item")).toHaveCount(0);
});

test("móvil: acceso, navegación y respuesta sin desbordamiento en 390 y 320 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await login(page);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator("#btnCerrarSesion")).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".arena/admin-movil-nuevo.png",
    fullPage: true,
  });
  await page.locator(".btn-abrir-resp").click();
  await expect(page.locator("#modalResponder")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#btnCancelarResp").click();
  await expect(page.locator("#modalResponder")).toBeHidden();
});

test("fallo al consultar no se presenta como cero solicitudes y el canal indica reconexión", async ({
  page,
}) => {
  await page.route("**/api/solicitudes", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false }),
    }),
  );
  await login(page, false);
  await expect(page.locator("#requests-status")).toContainText(
    "No se pudieron consultar",
  );
  await expect(page.locator("#kpi-total-sol")).toHaveText("—");
  await expect(page.locator(".admin-empty")).toContainText(
    "Esperando conexión",
  );
});
