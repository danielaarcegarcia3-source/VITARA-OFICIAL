/** Atlas de activos originales. No coloca coordenadas sobre imágenes sin georreferencia. */
(function () {
  "use strict";
  const V = window.Vitara;
  const root = document.getElementById("mapa-real");
  if (!V || !root) return;
  const { esc } = V;
  const legacyPlaces = (V.D.ipress || []).map((p) => ({
    ...p,
    atlasId: "local-" + p.cod,
    departamento: p.departamento || p.region || "La Libertad",
    tipo: /HOSPITAL/i.test(p.nombre)
      ? "hospital"
      : /^C\.S\./i.test(p.nombre)
        ? "centro"
        : /^P\.S\./i.test(p.nombre)
          ? "posta"
          : "otro",
  }));
  let research = null,
    researchStatus = "idle",
    researchPromise = null;
  const allPlaces = () => [
    ...legacyPlaces,
    ...(research?.establecimientos || []).map((p) => ({
      ...p,
      atlasId: p.id,
      documental: true,
    })),
  ];
  const places = legacyPlaces;
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
  <aside class="atlas-directory"><label for="atlas-department">Departamento o Callao</label><select id="atlas-department" disabled><option value="">Cargando territorios…</option></select><p id="atlas-territory-status" role="status">Los 24 departamentos y el Callao estarán disponibles al abrir Mapas.</p><div class="atlas-region-card" id="atlas-region-card"></div><section class="atlas-health-context" id="atlas-health-context" aria-label="Información sanitaria del territorio"></section><h3>Directorio territorial documentado</h3><label for="atlas-query">Buscar establecimiento o dirección</label><input type="search" id="atlas-query" placeholder="Hospital, centro, calle…"><label for="atlas-origin">Origen de la referencia</label><select id="atlas-origin"><option value="">Todas las fuentes</option><option value="minsa">Selección documental MINSA</option><option value="local">Base regional existente</option></select><label for="atlas-district">Distrito</label><select id="atlas-district"><option value="">Todos los distritos</option>${[
    ...new Set(places.map((p) => p.distrito).filter(Boolean)),
  ]
    .sort()
    .map((d) => `<option>${esc(d)}</option>`)
    .join(
      "",
    )}</select><label for="atlas-type">Tipo de establecimiento</label><select id="atlas-type"><option value="">Todos los tipos</option><option value="hospital">Hospitales</option><option value="centro">Centros de salud</option><option value="posta">Puestos de salud</option><option value="instituto">Institutos</option></select><p class="source">Selección documental, no padrón nacional completo ni stock en tiempo real. Las referencias nuevas proceden de una guía de oftalmología del MINSA actualizada el 14/03/2025; no acreditan toda la cartera de cada sede.</p><p id="atlas-research-status" role="status"></p><button type="button" id="atlas-research-retry" hidden>Reintentar carga de referencias</button><p id="atlas-result-count" role="status"></p><div id="atlas-results" aria-live="polite"></div></aside></div>`;
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
    const origin = root.querySelector("#atlas-origin").value;
    const query = norm(root.querySelector("#atlas-query").value);
    const list = allPlaces().filter(
      (p) =>
        (!department || norm(p.departamento) === norm(department)) &&
        (!district ||
          (district === "__sin_distrito__"
            ? !p.distrito
            : district === p.distrito)) &&
        (!type || type === p.tipo) &&
        (!origin || (origin === "minsa" ? p.documental : !p.documental)) &&
        (!query ||
          norm(
            [p.nombre, p.direccion, p.distrito, p.departamento, p.ambitoFuente]
              .filter(Boolean)
              .join(" "),
          ).includes(query)),
    );
    const documented = list.filter((p) => p.documental).length;
    root.querySelector("#atlas-result-count").textContent =
      `${list.length} coincidencias · ${documented} referencias MINSA y ${list.length - documented} registros regionales. No son totales del territorio.`;
    root.querySelector("#atlas-results").innerHTML = list.length
      ? list
          .map(
            (p) =>
              `<button class="atlas-place" type="button" data-place="${esc(p.atlasId)}" data-origin="${p.documental ? "minsa" : "local"}"><strong>${esc(p.nombre)}</strong><span>${esc(p.documental ? p.direccion : p.distrito + " · " + p.categoria)}</span><span class="atlas-place-source">${esc(p.departamento)} · ${p.documental ? "Guía MINSA · 14/03/2025" : "Base regional existente"} <b>↗</b></span></button>`,
          )
          .join("")
      : '<p class="empty">No hay establecimientos que coincidan con estos filtros en esta selección. Esto no significa que no existan servicios de salud allí. Prueba otro tipo, distrito u origen.</p>';
    root
      .querySelectorAll("[data-place]")
      .forEach((button) =>
        button.addEventListener("click", () => openPlace(button.dataset.place)),
      );
  }
  function openPlace(atlasId) {
    const p = allPlaces().find((item) => item.atlasId === atlasId);
    if (!p) return;
    if (p.documental) {
      const source = research.fuentes[p.fuenteId];
      const phone = p.telefono.replace(/[^0-9+]/g, "");
      V.abrirInspector(
        "Referencia documental · " + p.departamento,
        `<div class="inspector-card"><span class="tag tag--grey">MINSA · documento de 2025</span><h3>${esc(p.nombre)}</h3><p>${esc(p.departamento)}${p.ambitoFuente ? " · " + esc(p.ambitoFuente) : ""}</p></div><dl class="kv"><dt>Dirección publicada</dt><dd>${esc(p.direccion)}</dd><dt>Teléfono publicado</dt><dd><a href="tel:${esc(phone)}">${esc(p.telefono)}</a> · confirmar vigencia</dd><dt>Distrito</dt><dd>No consignado por separado en esta selección; revisa la dirección y el directorio oficial.</dd><dt>Tipo de referencia</dt><dd>${esc(p.tipo)} · no se asigna categoría RENIPRESS</dd><dt>Servicio documentado</dt><dd>Incluido en la guía de oftalmología del MINSA. No acredita toda su cartera ni atención actual.</dd><dt>Horario actual</dt><dd>Sin confirmar. No se trasladan horarios de especialidad como horarios generales.</dd><dt>Medicamentos y equipos</dt><dd>Sin datos de disponibilidad en esta referencia.</dd><dt>Último cambio de la fuente</dt><dd>14/03/2025</dd><dt>Consulta documental</dt><dd>27/11/2026 · no es una confirmación presencial o telefónica</dd></dl><p class="atlas-document-warning">Confirma dirección, contacto, servicio, referencia médica y requisitos antes de viajar. La inclusión no garantiza cita, stock, equipo operativo ni atención.</p><p class="source">${esc(source.titulo)}</p><p><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Leer la fuente específica del registro ↗</a></p><p><a href="https://www.gob.pe/establecimientosdesalud" target="_blank" rel="noopener noreferrer">Consultar directorio nacional · fuente RENIPRESS/SUSALUD ↗</a></p>`,
      );
    } else {
      V.abrirInspector(
        "Directorio territorial",
        `<h3>${esc(p.nombre)}</h3><dl class="kv"><dt>Departamento</dt><dd>${esc(p.departamento)}</dd><dt>Distrito</dt><dd>${esc(p.distrito)}</dd><dt>Categoría</dt><dd>${esc(p.categoria)}</dd><dt>Horario registrado</dt><dd>${esc(p.horario || "Sin información")}</dd><dt>Teléfono registrado</dt><dd>${esc(p.telefono || "Sin información")}</dd></dl><p>Confirma en la sede antes de desplazarte.</p><p class="source">${esc(V.SRC.renipress.texto)} · ${esc(V.SRC.renipress.fecha)}</p>`,
      );
    }
  }
  function healthContext() {
    const documented = (research?.establecimientos || []).filter(
      (p) => !department || norm(p.departamento) === norm(department),
    );
    const local = legacyPlaces.filter(
      (p) => !department || norm(p.departamento) === norm(department),
    );
    const count =
      researchStatus === "loaded"
        ? `${documented.length} referencias MINSA`
        : "Referencias MINSA: " +
          (researchStatus === "error" ? "carga no disponible" : "cargando");
    root.querySelector("#atlas-health-context").innerHTML =
      `<span class="overline">SALUD / ${esc(department || "PERÚ")}</span><h4>Instituciones para consultar.</h4><p><strong>${esc(count)}</strong> · ${local.length} registros de la base regional existente. Conteos de esta selección, no del total de establecimientos.</p><div class="atlas-reference-preview">${documented
        .slice(0, 2)
        .map(
          (p) =>
            `<button type="button" data-reference-preview="${esc(p.id)}"><span>${esc(p.nombre)}</span><b aria-hidden="true">↗</b></button>`,
        )
        .join(
          "",
        )}</div><p>Consulta direcciones y contactos publicados. La guía MINSA utilizada es de oftalmología (14/03/2025); confirma los servicios y requisitos actuales con la sede.</p>${department === "LIMA" ? "<p>Lima reúne referencias de DIRIS metropolitanas y de Lima Región; Callao tiene su propia selección.</p>" : ""}<a href="https://www.gob.pe/establecimientosdesalud" target="_blank" rel="noopener noreferrer">Ampliar búsqueda en el directorio oficial nacional ↗</a><a href="./assets/territorios/README.md" target="_blank" rel="noopener noreferrer">Fuentes y metodología de esta selección ↗</a>`;
  }
  root
    .querySelector("#atlas-health-context")
    .addEventListener("click", (event) => {
      const button = event.target.closest("[data-reference-preview]");
      if (button) openPlace(button.dataset.referencePreview);
    });
  async function loadResearch() {
    if (researchStatus === "loaded") return;
    if (researchPromise) return researchPromise;
    researchStatus = "loading";
    root.querySelector("#atlas-research-status").textContent =
      "Cargando referencias documentales de otros departamentos…";
    root.querySelector("#atlas-research-retry").hidden = true;
    healthContext();
    researchPromise = (async () => {
      try {
        const response = await fetch(
          "./assets/territorios/directorio-salud.json?v=1",
        );
        if (!response.ok) throw new Error("Directorio no disponible");
        const data = await response.json();
        if (
          !Array.isArray(data.establecimientos) ||
          !data.fuentes ||
          data.establecimientos.some(
            (p) => !data.fuentes[p.fuenteId] || !p.id || !p.departamento,
          )
        )
          throw new Error("Formato de directorio inválido");
        research = data;
        researchStatus = "loaded";
        root.querySelector("#atlas-research-status").textContent =
          `${data.establecimientos.length} referencias MINSA en ${new Set(data.establecimientos.map((p) => p.departamento)).size} territorios · fuente 14/03/2025 · consulta 27/11/2026. No es verificación de vigencia.`;
      } catch {
        researchStatus = "error";
        root.querySelector("#atlas-research-status").textContent =
          "No se pudieron cargar las referencias MINSA. Esto no significa que no existan establecimientos; puedes reintentar o abrir el directorio oficial. La base regional sigue disponible.";
        root.querySelector("#atlas-research-retry").hidden = false;
      } finally {
        researchPromise = null;
        root.dataset.research = researchStatus;
        if (territories.length) updateDepartment();
        else {
          healthContext();
          directory();
        }
      }
    })();
    return researchPromise;
  }
  root
    .querySelector("#atlas-research-retry")
    .addEventListener("click", loadResearch);
  root.querySelector("#atlas-query").addEventListener("input", directory);
  root
    .querySelectorAll("#atlas-district,#atlas-type,#atlas-origin")
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
    const previousDistrict = select.value;
    const districts = [
      ...new Set(
        allPlaces()
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
      districts.map((name) => `<option>${esc(name)}</option>`).join("") +
      (allPlaces().some(
        (p) =>
          (!department || norm(p.departamento) === norm(department)) &&
          !p.distrito,
      )
        ? '<option value="__sin_distrito__">Distrito no consignado en la selección</option>'
        : "");
    if ([...select.options].some((option) => option.value === previousDistrict))
      select.value = previousDistrict;
    healthContext();
    root.querySelector("#atlas-territory-status").textContent = selected
      ? department +
        " · polígono de referencia. El directorio solo muestra registros existentes, no cobertura nacional completa."
      : "24 departamentos y Callao · selecciona un territorio para consultar sus referencias sanitarias documentadas y su forma.";
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
    loadResearch();
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  });
})();
