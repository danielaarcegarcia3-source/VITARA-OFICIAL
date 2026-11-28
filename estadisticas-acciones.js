/** Del reporte a una consulta trazable. Nunca deduce stock ni envía peticiones sin confirmación. */
(() => {
  "use strict";
  const V = window.Vitara;
  if (!V) return;
  const root = document.querySelector("#view-tablero"),
    $ = (s) => root.querySelector(s);
  const report = V.D.infoSismed || {},
    networks = report.redesSalud || [],
    history = report.historico12Meses || [],
    places = V.D.ipress || [];
  let selected = null;
  function choose(code) {
    selected = places.find((p) => String(p.cod) === String(code)) || null;
    if (!selected) return;
    $("#stats-action-place").value = String(selected.cod);
    $("#stats-action-notice").textContent =
      selected.nombre +
      " · " +
      selected.red +
      ". Referencia de " +
      (selected.fechaInfo || report.fechaCorte) +
      ", no disponibilidad actual. Puedes preparar una pregunta para el operador.";
  }
  function reading() {
    const a = history[Number($("#stats-month-a").value)],
      b = history[Number($("#stats-month-b").value)];
    if (!a || !b) return;
    const delta = b.dispo - a.dispo;
    $("#stats-action-delta").innerHTML =
      "<strong>" +
      (delta > 0 ? "+" : "") +
      V.num(delta, 2) +
      " p.p.</strong><small>" +
      V.esc(a.mes) +
      ": " +
      V.pct(a.dispo) +
      " → " +
      V.esc(b.mes) +
      ": " +
      V.pct(b.dispo) +
      ". Diferencia calculada como segundo menos primero; no una predicción ni cambio relativo.</small>";
  }
  function filterPlaces() {
    const red = $("#stats-place-red").value,
      low = $("#stats-place-low").checked;
    let count = 0;
    root.querySelectorAll("#tabla-ipress-body [data-ipress]").forEach((row) => {
      const place = places.find((p) => String(p.cod) === row.dataset.ipress);
      row.hidden =
        !!place && ((red && place.red !== red) || (low && place.dispo >= 91));
      if (!row.hidden) count++;
    });
    $("#stats-place-count").textContent =
      count + " filas visibles de la muestra local, no del padrón nacional.";
  }
  function enhanceRows() {
    root.querySelectorAll("#tabla-ipress-body [data-ipress]").forEach((row) => {
      if (row.querySelector("[data-prepare-place]")) return;
      const cell = document.createElement("td"),
        button = document.createElement("button");
      button.type = "button";
      button.className = "stats-row-action";
      button.dataset.preparePlace = row.dataset.ipress;
      button.textContent = "Preparar consulta ↗";
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        choose(row.dataset.ipress);
        $("#stats-action-desk").scrollIntoView({
          block: "center",
          behavior: V.A11Y.movimiento ? "instant" : "smooth",
        });
        $("#stats-action-resource").focus({ preventScroll: true });
      });
      button.addEventListener("keydown", (e) => e.stopPropagation());
      cell.append(button);
      row.append(cell);
    });
    filterPlaces();
  }
  function init() {
    if (!root || !$("#tabla-ipress-body") || $("#stats-action-desk")) return;
    const desk = document.createElement("section");
    desk.className = "stats-action-desk";
    desk.id = "stats-action-desk";
    desk.setAttribute("aria-labelledby", "stats-action-title");
    desk.innerHTML = `<span class="eyebrow">DEL DATO A LA ACCIÓN / SIN VIAJES A CIEGAS</span><h3 id="stats-action-title">No te quedes en el porcentaje.</h3><p>Compara periodos registrados y convierte tu duda en una consulta de recurso con sede, cantidad y seguimiento. El reporte no determina qué hay hoy.</p><div class="stats-action-layout"><div><label for="stats-month-a">Primer mes<select id="stats-month-a">${history.map((h, i) => `<option value="${i}">${V.esc(h.mes)}</option>`).join("")}</select></label><label for="stats-month-b">Segundo mes<select id="stats-month-b">${history.map((h, i) => `<option value="${i}">${V.esc(h.mes)}</option>`).join("")}</select></label><div class="stats-action-reading" id="stats-action-delta" aria-live="polite"></div><div class="stats-action-buttons"><button type="button" id="stats-month-swap">Intercambiar meses ⇄</button><button type="button" id="stats-export-reading">Descargar lectura</button></div></div><div><label for="stats-action-place">Sede de la muestra local<select id="stats-action-place">${places.map((p) => `<option value="${V.esc(p.cod)}">${V.esc(p.nombre)}</option>`).join("")}</select></label><label for="stats-action-resource">Recurso que necesitas confirmar<input id="stats-action-resource" maxlength="180" placeholder="Nombre, concentración y presentación; no diagnóstico"></label><div class="field-row"><label for="stats-action-quantity">Cantidad a consultar<input id="stats-action-quantity" type="number" min="1" max="10000" step="1" placeholder="Sin especificar"></label><label for="stats-action-unit">Unidad<select id="stats-action-unit"><option value="unidades">Unidades</option><option value="cajas">Cajas</option><option value="frascos">Frascos</option><option value="equipos">Equipos</option><option value="atenciones">Atenciones</option></select></label></div><p id="stats-action-notice" role="status"></p><div class="stats-action-buttons"><button type="button" id="stats-prepare-request">Preparar solicitud con seguimiento ↗</button></div><p>No se envía nada todavía. El operador de VITARA recibe tu solicitud al confirmarla en el formulario; no es un envío automático al hospital o MINSA, ni una reserva.</p></div></div>`;
    root.querySelector(".charts").after(desk);
    $("#stats-month-b").value = String(Math.max(0, history.length - 1));
    reading();
    choose(places[0]?.cod);
    for (const id of ["#stats-month-a", "#stats-month-b"])
      $(id).addEventListener("change", reading);
    $("#stats-month-swap").onclick = () => {
      const a = $("#stats-month-a").value;
      $("#stats-month-a").value = $("#stats-month-b").value;
      $("#stats-month-b").value = a;
      reading();
    };
    $("#stats-export-reading").onclick = () => {
      const a = history[Number($("#stats-month-a").value)],
        b = history[Number($("#stats-month-b").value)];
      if (!a || !b) return;
      const text = `VITARA · Lectura del reporte regional de La Libertad\nFuente: ${V.SRC.sismed.texto}\nCorte: ${report.fechaCorte}\n${a.mes}: ${a.dispo}%\n${b.mes}: ${b.dispo}%\nDiferencia segundo menos primero: ${(b.dispo - a.dispo).toFixed(2)} puntos porcentuales.\nCálculo a partir del reporte, no medición propia, predicción ni stock actual.\n`;
      const url = URL.createObjectURL(
          new Blob([text], { type: "text/plain;charset=utf-8" }),
        ),
        link = document.createElement("a");
      link.href = url;
      link.download = "vitara-lectura-reporte.txt";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    $("#stats-action-place").onchange = (e) => choose(e.target.value);
    $("#stats-prepare-request").onclick = () => {
      const resource = $("#stats-action-resource"),
        quantity = $("#stats-action-quantity");
      resource.setCustomValidity(
        resource.value.trim().length < 3
          ? "Indica qué recurso quieres confirmar."
          : "",
      );
      if (!resource.reportValidity() || !quantity.reportValidity()) return;
      const name = resource.value.trim(),
        n = quantity.value,
        unit = $("#stats-action-unit").value;
      V.abrirVista("solicitudes", { item: name, sede: selected?.nombre });
      document.querySelector("#sol-cantidad").value = n;
      document.querySelector("#sol-unidad").value = unit;
      document.querySelector("#sol-pregunta").value = "disponibilidad";
      document.querySelector("#sol-cat").value =
        unit === "equipos"
          ? "equipo"
          : unit === "atenciones"
            ? "servicio"
            : "medicamento";
      V.toast(
        "Consulta preparada. Revisa la sede y confirma el envío; aún no se ha registrado.",
      );
    };
    $("#stats-action-resource").oninput = (e) => e.target.setCustomValidity("");
    const filter = document.createElement("div");
    filter.className = "stats-action-filter";
    filter.innerHTML = `<label>Red de la muestra<select id="stats-place-red"><option value="">Todas las redes</option>${[
      ...new Set(places.map((p) => p.red)),
    ]
      .sort()
      .map((red) => `<option>${V.esc(red)}</option>`)
      .join(
        "",
      )}</select></label><label><input type="checkbox" id="stats-place-low"> Solo valores menores al 91% del reporte</label><output id="stats-place-count" aria-live="polite"></output>`;
    root.querySelector(".table-scroll").before(filter);
    filter
      .querySelectorAll("select,input")
      .forEach((el) => el.addEventListener("change", filterPlaces));
    const th = document.createElement("th");
    th.textContent = "De la referencia a tu consulta";
    root.querySelector(".table thead tr").append(th);
    new MutationObserver(enhanceRows).observe($("#tabla-ipress-body"), {
      childList: true,
    });
    enhanceRows();
    $("#bars-redes").addEventListener("click", (event) => {
      const bar = event.target.closest("[data-network]");
      if (!bar) return;
      root
        .querySelectorAll("[data-network]")
        .forEach((b) => b.classList.toggle("is-action-selected", b === bar));
      const network = networks.find((n) => n.id === bar.dataset.network),
        p = places.find(
          (place) => V.norm(place.red) === V.norm(network?.nombre),
        );
      if (p) choose(p.cod);
    });
  }
  V.onView("tablero", init);
})();
