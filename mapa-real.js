/** Atlas de activos originales. No coloca coordenadas sobre imágenes sin georreferencia. */
(function () {
  "use strict";
  const V = window.Vitara;
  const root = document.getElementById("mapa-real");
  if (!V || !root) return;
  const { esc } = V;
  const places = V.D.ipress || [];
  let mode = "peru",
    zoom = 1,
    x = 0,
    y = 0,
    tiltX = 0,
    tiltY = 0,
    department = "";
  let territories = [],
    territoryPromise,
    motion = true;
  const norm = (value) => V.norm(String(value || ""));
  root.innerHTML = `<div class="atlas-toolbar"><div class="seg"><button type="button" data-atlas="peru" aria-pressed="true">Perú</button><button type="button" data-atlas="ll" aria-pressed="false">La Libertad</button></div><div class="atlas-zoom"><button type="button" id="atlas-motion" aria-pressed="true">Profundidad 3D</button><button type="button" data-zoom="in" aria-label="Acercar mapa">+</button><button type="button" data-zoom="out" aria-label="Alejar mapa">−</button><button type="button" data-zoom="reset">Reencuadrar</button></div></div>
  <div class="atlas-layout"><div class="atlas-image" tabindex="0" role="region" aria-label="Ilustración territorial. Arrastra para inspeccionar; usa más y menos para zoom."><img src="./mapadelperu3d.png" alt="Mapa ilustrado 3D del Perú" draggable="false"><span>ILUSTRACIÓN ORIGINAL · NO GEORREFERENCIADA</span></div>
  <aside class="atlas-directory"><label for="atlas-department">Departamento o Callao</label><select id="atlas-department" disabled><option value="">Cargando territorios…</option></select><p id="atlas-territory-status" role="status">Los 24 departamentos y el Callao estarán disponibles al abrir Mapas.</p><div class="atlas-region-card" id="atlas-region-card"></div><h3>Establecimientos en la base local</h3><label for="atlas-district">Distrito</label><select id="atlas-district"><option value="">Todos los distritos</option>${[
    ...new Set(places.map((p) => p.distrito).filter(Boolean)),
  ]
    .sort()
    .map((d) => `<option>${esc(d)}</option>`)
    .join(
      "",
    )}</select><label for="atlas-type">Tipo de establecimiento</label><select id="atlas-type"><option value="">Todos los tipos</option><option value="hospital">Hospitales</option><option value="centro">Centros de salud</option><option value="posta">Puestos de salud</option></select><p class="source">Directorio local · no equivale a cobertura completa ni stock en tiempo real.</p><div id="atlas-results" aria-live="polite"></div></aside></div>`;
  const image = root.querySelector(".atlas-image img");
  const stage = image.parentElement;
  const canMove = () =>
    motion &&
    !V.A11Y.movimiento &&
    !matchMedia("(prefers-reduced-motion:reduce)").matches;
  function transform() {
    image.style.transform = `translate(${x}px, ${y}px) scale(${zoom}) rotateX(${canMove() ? tiltX : 0}deg) rotateY(${canMove() ? tiltY : 0}deg)`;
  }
  root.querySelector("#atlas-motion").addEventListener("click", (e) => {
    motion = !motion;
    e.currentTarget.setAttribute("aria-pressed", String(motion));
    stage.classList.toggle("atlas-motion-off", !motion);
    transform();
  });
  new IntersectionObserver(([entry]) =>
    stage.classList.toggle("atlas-is-visible", entry.isIntersecting),
  ).observe(stage);
  function scale(factor) {
    zoom = Math.max(1, Math.min(3, zoom * factor));
    if (zoom === 1) x = y = 0;
    transform();
  }
  root.querySelectorAll("[data-atlas]").forEach((button) =>
    button.addEventListener("click", () => {
      mode = button.dataset.atlas;
      department = mode === "ll" ? "LA LIBERTAD" : "";
      if (territories.length) {
        root.querySelector("#atlas-department").value = department;
        updateDepartment();
      }
      root
        .querySelectorAll("[data-atlas]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      image.src =
        mode === "ll" ? "./MAPADELALIBERTAD3D.png" : "./mapadelperu3d.png";
      image.alt =
        mode === "ll"
          ? "Mapa ilustrado 3D de La Libertad"
          : "Mapa ilustrado 3D del Perú";
      zoom = 1;
      x = y = 0;
      tiltX = tiltY = 0;
      transform();
    }),
  );
  root.querySelectorAll("[data-zoom]").forEach((button) =>
    button.addEventListener("click", () => {
      if (button.dataset.zoom === "reset") {
        zoom = 1;
        x = y = 0;
        tiltX = tiltY = 0;
        transform();
      } else scale(button.dataset.zoom === "in" ? 1.2 : 1 / 1.2);
    }),
  );
  stage.addEventListener("keydown", (e) => {
    if (["+", "=", "-"].includes(e.key)) {
      e.preventDefault();
      scale(e.key === "-" ? 1 / 1.2 : 1.2);
    }
    if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      x += e.key === "ArrowLeft" ? 20 : e.key === "ArrowRight" ? -20 : 0;
      y += e.key === "ArrowUp" ? 20 : e.key === "ArrowDown" ? -20 : 0;
      transform();
    }
  });
  let drag;
  stage.addEventListener("pointerdown", (e) => {
    drag = [e.clientX - x, e.clientY - y];
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointerleave", () => {
    tiltX = tiltY = 0;
    transform();
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag) {
      if (e.pointerType !== "touch" && canMove()) {
        const bounds = stage.getBoundingClientRect();
        tiltX = -((e.clientY - bounds.top) / bounds.height - 0.5) * 12;
        tiltY = ((e.clientX - bounds.left) / bounds.width - 0.5) * 14;
        transform();
      }
      return;
    }
    x = Math.max(
      -stage.clientWidth,
      Math.min(stage.clientWidth, e.clientX - drag[0]),
    );
    y = Math.max(
      -stage.clientHeight,
      Math.min(stage.clientHeight, e.clientY - drag[1]),
    );
    transform();
  });
  stage.addEventListener("pointerup", () => {
    drag = null;
  });
  stage.addEventListener("pointercancel", () => {
    drag = null;
  });
  function directory() {
    const district = root.querySelector("#atlas-district").value;
    const type = root.querySelector("#atlas-type").value;
    const list = places.filter(
      (p) =>
        (!department ||
          norm(p.departamento || p.region || "La Libertad") ===
            norm(department)) &&
        (!district || district === p.distrito) &&
        (!type ||
          (type === "hospital"
            ? /HOSPITAL/i.test(p.nombre)
            : type === "centro"
              ? /^C\.S\./i.test(p.nombre)
              : /^P\.S\./i.test(p.nombre))),
    );
    root.querySelector("#atlas-results").innerHTML = list.length
      ? list
          .map(
            (p) =>
              `<button class="atlas-place" type="button" data-place="${esc(p.cod)}"><strong>${esc(p.nombre)}</strong><span>${esc(p.distrito)} · ${esc(p.categoria)} <b>↗</b></span></button>`,
          )
          .join("")
      : '<p class="empty">No hay establecimientos registrados para este territorio y filtro en esta base local. Esto no significa que no existan servicios de salud allí.</p>';
    root.querySelectorAll("[data-place]").forEach((button) =>
      button.addEventListener("click", () => {
        const p = places.find((p) => p.cod === button.dataset.place);
        if (!p) return;
        V.abrirInspector(
          "Directorio territorial",
          `<h3>${esc(p.nombre)}</h3><dl class="kv"><dt>Distrito</dt><dd>${esc(p.distrito)}</dd><dt>Categoría</dt><dd>${esc(p.categoria)}</dd><dt>Horario registrado</dt><dd>${esc(p.horario || "Sin información")}</dd><dt>Teléfono registrado</dt><dd>${esc(p.telefono || "Sin información")}</dd></dl><p>Confirma en la sede antes de desplazarte.</p><p class="source">${esc(V.SRC.renipress.texto)} · ${esc(V.SRC.renipress.fecha)}</p>`,
        );
      }),
    );
  }
  root
    .querySelectorAll("#atlas-district,#atlas-type")
    .forEach((select) => select.addEventListener("change", directory));
  root
    .querySelector("#atlas-department")
    .addEventListener("change", (event) => {
      department = event.target.value;
      if (department !== "LA LIBERTAD" && mode === "ll") {
        mode = "peru";
        image.src = "./mapadelperu3d.png";
        image.alt = "Mapa ilustrado 3D del Perú";
        root
          .querySelectorAll("[data-atlas]")
          .forEach((b) =>
            b.setAttribute("aria-pressed", String(b.dataset.atlas === "peru")),
          );
        zoom = 1;
        x = y = tiltX = tiltY = 0;
        transform();
      }
      updateDepartment();
    });
  directory();
  function updateDepartment() {
    const selected = territories.find(
      (feature) => feature.properties.NOMBDEP === department,
    );
    const select = root.querySelector("#atlas-district");
    const districts = [
      ...new Set(
        places
          .filter(
            (p) =>
              !department ||
              norm(p.departamento || p.region || "La Libertad") ===
                norm(department),
          )
          .map((p) => p.distrito)
          .filter(Boolean),
      ),
    ].sort();
    select.innerHTML =
      '<option value="">Todos los distritos registrados</option>' +
      districts.map((name) => `<option>${esc(name)}</option>`).join("");
    root.querySelector("#atlas-territory-status").textContent = selected
      ? department +
        " · polígono de referencia. El directorio solo muestra registros existentes, no cobertura nacional completa."
      : "24 departamentos y Callao · selecciona un territorio para explorar su forma y los registros disponibles.";
    const features = selected ? [selected] : territories;
    const polygons = (feature) =>
      feature.geometry.type === "MultiPolygon"
        ? feature.geometry.coordinates
        : [feature.geometry.coordinates];
    const all = features.flatMap((feature) =>
      polygons(feature).flatMap((polygon) => polygon.flat()),
    );
    const xs = all.map((p) => p[0]),
      ys = all.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const cos = Math.cos((((minY + maxY) / 2) * Math.PI) / 180),
      scale = 185 / Math.max((maxX - minX) * cos, maxY - minY);
    const project = (p) => [
      110 + (p[0] - (minX + maxX) / 2) * cos * scale,
      110 - (p[1] - (minY + maxY) / 2) * scale,
    ];
    const paths = features
      .map((feature) => {
        const d = polygons(feature)
          .flatMap((polygon) =>
            polygon.map(
              (ring) =>
                ring
                  .map(
                    (p, i) =>
                      (i ? "L" : "M") +
                      project(p)
                        .map((v) => v.toFixed(2))
                        .join(","),
                  )
                  .join(" ") + " Z",
            ),
          )
          .join(" ");
        return `<path d="${d}" fill-rule="evenodd"><title>${esc(feature.properties.NOMBDEP)}</title></path>`;
      })
      .join("");
    root.querySelector("#atlas-region-card").innerHTML =
      `<svg viewBox="0 0 220 220" role="img" aria-label="Polígono territorial de ${esc(department || "los departamentos del Perú")}">${paths}</svg><div><strong>${esc(department || "Perú completo")}</strong><p>Geometría real simplificada · no relieve ni límites legales actualizados.</p><a href="./assets/geo/README.md" target="_blank" rel="noopener noreferrer">Polígonos: peru-geojson · MPL 2.0 ↗</a></div>`;
    directory();
  }
  async function loadTerritories() {
    if (territories.length) return;
    try {
      territoryPromise ||= fetch(
        "./assets/geo/peru_departamental_simple.geojson",
      ).then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      });
      const geo = await territoryPromise;
      territories = geo.features
        .slice()
        .sort((a, b) =>
          a.properties.NOMBDEP.localeCompare(b.properties.NOMBDEP, "es"),
        );
      const select = root.querySelector("#atlas-department");
      select.innerHTML =
        '<option value="">Todo el Perú</option>' +
        territories
          .map(
            (f) =>
              `<option value="${esc(f.properties.NOMBDEP)}">${esc(f.properties.NOMBDEP)}</option>`,
          )
          .join("");
      select.disabled = false;
      select.value = department;
      updateDepartment();
    } catch {
      territoryPromise = null;
      root.querySelector("#atlas-territory-status").textContent =
        "No se pudieron cargar los territorios. Vuelve a abrir Mapas para reintentar; las ilustraciones originales siguen disponibles.";
    }
  }
  V.onView("mapas", () => {
    loadTerritories();
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  });
})();
