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
async function enter(page, role = "CIU") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.locator("#splash-skip").evaluate((e) => e.click());
  await page.locator("#access-name").fill("Prueba de experiencia");
  await page.locator("#access-role").selectOption(role);
  await page.locator("#access-form [type=submit]").click();
  await expect(page.locator("#access")).toBeHidden();
}

test("acceso sin imagen ni distrito, Gmail sin verificar no entra y Google pendiente es explícito", async ({
  page,
}) => {
  await page.goto(base);
  await page.locator("#splash-skip").evaluate((e) => e.click());
  await expect(page.locator(".access__ambient img")).toHaveCount(0);
  await expect(page.locator("#access-district")).toHaveCount(0);
  await expect(page.locator("#google-connect")).toBeDisabled();
  await page.locator("#access-demo summary").click();
  await page.locator("#access-name").fill("Prueba");
  await page.locator("#access-email").fill("inventado@gmail.com");
  await page.locator("#access-form [type=submit]").click();
  await expect(page.locator("#access-status")).toContainText("Google");
  await expect(page.locator("#access")).toBeVisible();
});

test("tres áreas progresivas, tres subcategorías y prioridades por perfil sin permisos elevados", async ({
  page,
}) => {
  await enter(page);
  await expect(page.locator(".rail-area")).toHaveCount(3);
  await expect(page.locator(".rail-area[open]")).toHaveCount(0);
  await expect(page.locator("[data-open-area]")).toHaveCount(3);
  await expect(
    page.locator(".guided-area-grid button").first(),
  ).toHaveAttribute("data-open-area", "acceso");
  await page.locator("[data-open-area=recursos]").click();
  await expect(page.locator("[data-guided-go]")).toHaveCount(3);
  await page.locator("#guided-role").selectOption("POSTA");
  await expect(
    page.locator(".guided-area-grid button").first(),
  ).toHaveAttribute("data-open-area", "recursos");
  await page.locator("#guided-role").selectOption("AGC");
  await expect(
    page.locator(".guided-area-grid button").first(),
  ).toHaveAttribute("data-open-area", "evidencia");
  await expect(page.locator("#guided-profile-note")).toContainText(
    "no acredita",
  );
  await page.locator("#guided-priority input").first().check();
  await page.reload();
  await page.locator("#splash-skip").evaluate((e) => e.click());
  await page.locator("#access-form [type=submit]").click();
  await expect(page.locator("#guided-priority input").first()).toBeChecked();
});

test("ADN grande con seis anclas reales, capas, zoom, órbita y ampliación con cierre", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await expect(page.locator("#dna-canvas")).toHaveAttribute(
    "data-cargado",
    "1",
    { timeout: 30000 },
  );
  await expect(page.locator("#dna-canvas")).toHaveAttribute(
    "data-anchored",
    "6",
  );
  expect(
    (await page.locator("#dna-stage").boundingBox()).height,
  ).toBeGreaterThan(550);
  await expect(page.locator(".dna-target")).toHaveCount(6);
  await page.locator(".dna-target").first().click();
  await expect(page.locator("#dna-panel")).toContainText("Adenina");
  await page.locator("#dna-panel-close").click();
  await page.locator("#dna-layer").selectOption("backbone");
  await page.locator("#dna-labels").click();
  await expect(page.locator("#dna-targets")).toBeHidden();
  await page.locator("#dna-labels").click();
  await page.locator("#dna-layer").selectOption("all");
  await page.locator("#dna-fullscreen").click();
  await expect(page.locator(".home-visual")).toHaveClass(/dna-expanded/);
  await page.locator("#dna-fullscreen").click();
  await expect(page.locator(".home-visual")).not.toHaveClass(/dna-expanded/);
  await page.locator("#dna-tilt").click();
  await expect(page.locator("#dna-tilt")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator("#dna-zoom-in").click();
  await page.locator("#dna-reset").click();
  await page.locator("#dna-stage").scrollIntoViewIfNeeded();
  await page.screenshot({ path: ".arena/adn-laboratorio-ampliado.png" });
  expect(errors).toEqual([]);
});

test("cantidad y pregunta llegan al servidor, sin dosis ni existencias inventadas", async ({
  page,
  request,
}) => {
  await enter(page, "POSTA");
  await page.locator("#guided-start-task").click();
  await page.locator("#sol-item").fill("Monitor de referencia");
  await page.locator("#sol-cat").selectOption("equipo");
  await page.locator("#sol-cantidad").fill("3");
  await page.locator("#sol-unidad").selectOption("equipos");
  await page.locator("#sol-pregunta").selectOption("accesorios");
  const response = page.waitForResponse(
    (res) =>
      res.url().endsWith("/api/solicitudes") &&
      res.request().method() === "POST",
  );
  await page.locator("#sol-submit").click();
  const data = await (await response).json();
  expect(data.solicitud.cantidad).toBe(3);
  expect(data.solicitud.unidad).toBe("equipos");
  expect(data.solicitud.pregunta).toBe("accesorios");
  for (const fields of [
    { imagenRecurso: "https://untrusted.example/image.png" },
    { cantidad: 4, unidad: "mg" },
    { pregunta: "diagnosticar" },
  ])
    expect(
      (
        await request.post(base + "/api/solicitudes", {
          data: { item: "Recurso prueba", ...fields },
        })
      ).status(),
    ).toBe(400);
  const restored = await request.get(
    base + "/api/solicitudes?codigo=" + data.solicitud.codigo,
  );
  expect((await restored.json()).solicitud.cantidad).toBe(3);
  for (const cantidad of [-1, 1.5, 10001])
    expect(
      (
        await request.post(base + "/api/solicitudes", {
          data: { item: "Recurso prueba", cantidad, unidad: "equipos" },
        })
      ).status(),
    ).toBe(400);
});

test("móvil: tres áreas, ADN y ampliación alternativa sin desborde; fallo de GLB conserva aprendizaje", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  await expect(page.locator("#dna-canvas")).toHaveAttribute(
    "data-anchored",
    "6",
    { timeout: 30000 },
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.locator("#dna-stage").scrollIntoViewIfNeeded();
  await page.screenshot({ path: ".arena/adn-laboratorio-movil.png" });
  // Simula un navegador sin Fullscreen API: la ampliación accesible sigue funcionando.
  await page.evaluate(
    () =>
      (document.querySelector(".home-visual").requestFullscreen = undefined),
  );
  await page.locator("#dna-fullscreen").click();
  await expect(page.locator(".dna-expanded")).toHaveAttribute(
    "aria-modal",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".dna-expanded")).toHaveCount(0);
  await expect(page.locator("#dna-fullscreen")).toBeFocused();
  await page.locator("[data-open-area=acceso]").click();
  await expect(page.locator("[data-guided-go]")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.route("**/adn.glb", (route) => route.abort());
  await page.reload();
  await page.locator("#splash-skip").evaluate((e) => e.click());
  await page.locator("#access-form [type=submit]").click();
  await expect(page.locator("#dna-stage")).toHaveClass(/is-unavailable/, {
    timeout: 30000,
  });
  await expect(page.locator("#dna-fallback")).toBeVisible();
  await page.locator(".dna-target").last().click();
  await expect(page.locator("#dna-panel")).toContainText("Fosfato");
});
