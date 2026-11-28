/** Laboratorio visual del reporte regional. No modifica ni simula datos. */
(() => {
  "use strict";
  const V = window.Vitara;
  if (!V) return;
  const { esc, num, pct } = V;
  const root = document.querySelector("#view-tablero");
  const report = V.D.infoSismed || {};
  const networks = report.redesSalud || [];
  const history = report.historico12Meses || [];
  const meta = report.kpis?.disponibilidadGlobal?.meta;
  const metrics = {
    disponibilidadGlobal: {
      name: "Disponibilidad",
      group: "stock",
      color: "#74d7bc",
      text: "Una mirada al acceso, no una promesa de stock.",
      detail:
        "Porcentaje regional de disponibilidad al corte. Confirma siempre las existencias con el establecimiento.",
    },
    sobrestock: {
      name: "Sobrestock",
      group: "stock",
      color: "#93b8ed",
      text: "Tener más no siempre es tener mejor.",
      detail:
        "Existencias para más de tres meses de consumo según el reporte. No equivale a recursos transferibles o disponibles para otra sede.",
    },
    normostock: {
      name: "Normostock",
      group: "stock",
      color: "#74d7bc",
      text: "El equilibrio también se puede observar.",
      detail:
        "Existencias entre uno y tres meses de consumo. Es un indicador de gestión, no un inventario consultable en tiempo real.",
    },
    critico: {
      name: "Stock crítico",
      group: "riesgo",
      color: "#f4cb7e",
      text: "La atención también está en las brechas.",
      detail:
        "Valor crítico publicado en el reporte. Se conserva tal cual; no se recalcula sumando los porcentajes redondeados de otras tarjetas.",
    },
    substock: {
      name: "Substock",
      group: "riesgo",
      color: "#f4cb7e",
      text: "Una reserva corta requiere una lectura cuidadosa.",
      detail:
        "Existencias para menos de un mes de consumo al corte. El dato agregado no permite identificar qué medicamento falta hoy.",
    },
    desabastecido: {
      name: "Desabastecimiento",
      group: "riesgo",
      color: "#f1a5aa",
      text: "Detrás del porcentaje hay una necesidad.",
      detail:
        "Stock cero en farmacia según el reporte. No representa el porcentaje de personas sin atención ni una consulta actual de cada farmacia.",
    },
    sinRotacion: {
      name: "Sin rotación",
      group: "riesgo",
      color: "#93b8ed",
      text: "El movimiento de los recursos también importa.",
      detail:
        "Sin movimiento durante más de seis meses según la definición del reporte. No significa que el medicamento esté vencido.",
    },
    ipressMonitoreadas: {
      name: "IPRESS monitoreadas",
      group: "cobertura",
      color: "#d6dda1",
      text: "Un territorio conectado por sus redes.",
      detail:
        "Establecimientos monitoreados en las 12 redes del reporte regional. La tabla de este portal contiene una muestra local, no los 339 registros completos.",
    },
  };
  let active = "disponibilidadGlobal",
    timer = null,
    selectedGroup = "all";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const motionAllowed = () =>
    !reduced.matches &&
    document.documentElement.dataset.movimiento !== "reducido";
  const metricValue = (key) =>
    key === "ipressMonitoreadas"
      ? report.ipressMonitoreadas
      : report.kpis?.[key]?.valor;
  const formatted = (key) =>
    key === "ipressMonitoreadas"
      ? num(metricValue(key))
      : num(metricValue(key), 2) + "%";
  function spotlight(key) {
    if (!metrics[key]) return;
    active = key;
    const item = metrics[key],
      value = metricValue(key),
      percent = key === "ipressMonitoreadas" ? null : value;
    const hero = root.querySelector(".stats-observatory");
    hero.style.setProperty("--metric-color", item.color);
    hero.querySelector("#stats-focus-title").textContent = item.text;
    hero.querySelector("#stats-focus-name").textContent = item.name;
    hero.querySelector("#stats-focus-description").textContent = item.detail;
    hero.querySelector("#stats-focus-value").textContent = formatted(key);
    hero.querySelector("#stats-focus-unit").textContent =
      percent === null
        ? "establecimientos · 12 redes"
        : "% del indicador regional";
    hero.querySelector("#stats-focus-index").textContent =
      String(Object.keys(metrics).indexOf(key) + 1).padStart(2, "0") + " / 08";
    const circle = hero.querySelector(".stats-orbit__value");
    circle.style.strokeDasharray = `${percent === null ? 0 : Math.max(0, Math.min(100, percent))} 100`;
    hero
      .querySelector(".stats-orbit")
      .setAttribute(
        "aria-label",
        `${item.name}: ${formatted(key)}. ${percent === null ? "Conteo de establecimientos, no porcentaje." : "Escala de 0 a 100 por ciento."}`,
      );
    hero
      .querySelector("#stats-focus-open")
      .setAttribute("aria-label", "Entender indicador: " + item.name);
    root.querySelectorAll("#kpis-sismed .kpi").forEach((card) => {
      const selected = card.dataset.indicator === key;
      card.classList.toggle("stats-card-selected", selected);
      card
        .querySelector("[data-spotlight]")
        ?.setAttribute("aria-pressed", String(selected));
    });
    hero.querySelector(".stats-focus-copy").animate?.(
      [
        { opacity: 0.45, transform: "translateY(5px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: motionAllowed() ? 320 : 0 },
    );
  }
  function filter(group) {
    selectedGroup = group;
    root
      .querySelectorAll("[data-stats-filter]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.statsFilter === group),
        ),
      );
    const keys = Object.keys(metrics).filter(
      (key) => group === "all" || metrics[key].group === group,
    );
    root.querySelectorAll("#kpis-sismed .kpi").forEach((card) => {
      card.hidden = !keys.includes(card.dataset.indicator);
    });
    root.querySelector("#stats-filter-count").textContent =
      `${keys.length} de 8 indicadores · selecciona una tarjeta para explorar`;
    if (!keys.includes(active)) spotlight(keys[0]);
  }
  function comparison() {
    const a = networks.find(
      (row) => row.id === root.querySelector("#stats-compare-a").value,
    );
    const b = networks.find(
      (row) => row.id === root.querySelector("#stats-compare-b").value,
    );
    if (!a || !b) return;
    const gap = Math.abs(a.dispo - b.dispo);
    root.querySelector("#stats-compare-result").innerHTML =
      `<div class="stats-compare-bars">${[a, b].map((row, i) => `<div class="stats-compare-row"><span>${esc(row.nombre.replace(/^RED /, ""))}</span><strong>${pct(row.dispo)}</strong><div><i style="width:${Math.max(0, Math.min(100, row.dispo))}%;--compare-color:${i ? "#ddb66f" : "#4d9f91"}"></i></div></div>`).join("")}</div><div class="stats-gap"><strong>${num(gap, 2)} <small>p.p.</small></strong><p>${a.id === b.id ? "Misma red seleccionada." : gap === 0 ? "Sin diferencia en el dato de disponibilidad." : "Diferencia absoluta de disponibilidad."}</p></div><p class="stats-compare-note">Cálculo: |${num(a.dispo, 2)} − ${num(b.dispo, 2)}|. Puntos porcentuales, no variación relativa ni ranking de calidad asistencial.</p>`;
  }
  function stop() {
    clearInterval(timer);
    timer = null;
    const button = root?.querySelector("#stats-history-play");
    if (button) {
      button.textContent = "Reproducir histórico";
      button.setAttribute("aria-pressed", "false");
    }
  }
  function month(index) {
    const slider = root.querySelector("#stats-month");
    if (!slider) return;
    slider.value = String(Math.max(0, Math.min(history.length - 1, index)));
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function motionState() {
    const button = root.querySelector("#stats-history-play");
    if (!motionAllowed()) stop();
    if (button) {
      button.disabled = !motionAllowed();
      button.title = motionAllowed()
        ? "Reproduce los meses registrados, sin interpolar valores."
        : "Movimiento reducido activo: usa anterior, siguiente o el deslizador.";
    }
  }
  function replay() {
    root.classList.remove("stats-enter");
    void root.offsetWidth;
    root.classList.add("stats-enter");
  }
  function init() {
    if (!root || !root.querySelector("#kpis-sismed")) return;
    if (!root.querySelector(".stats-observatory")) {
      const hero = document.createElement("section");
      hero.className = "stats-observatory";
      hero.setAttribute("aria-label", "Explorador visual de indicadores");
      hero.innerHTML = `<div class="stats-hero-heading"><span class="stats-kicker">VITARA / OBSERVATORIO REGIONAL</span><h3>Los datos,<br>en perspectiva<span>.</span></h3><p>Explora lo que dice el reporte.<br>Y también lo que no puede decir.</p><div class="stats-report-stamp"><span></span> Corte ${esc(report.fechaCorte)} · La Libertad</div></div><div class="stats-orbit" role="group"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="stats-orbit__track" cx="100" cy="100" r="83"/><circle class="stats-orbit__value" cx="100" cy="100" r="83" pathLength="100"/><circle class="stats-orbit__inner" cx="100" cy="100" r="70"/></svg><div><span id="stats-focus-name"></span><strong id="stats-focus-value"></strong><small id="stats-focus-unit"></small></div><span class="stats-orbit-mark" aria-hidden="true">+</span><nav class="stats-orbit-nav" aria-label="Recorrer indicadores"><button type="button" id="stats-focus-prev" aria-label="Indicador anterior">←</button><output id="stats-focus-index"></output><button type="button" id="stats-focus-next" aria-label="Indicador siguiente">→</button></nav></div><div class="stats-focus-copy" aria-live="polite"><span class="stats-kicker">UNA CIFRA / UNA LECTURA</span><h4 id="stats-focus-title"></h4><p id="stats-focus-description"></p><button type="button" id="stats-focus-open">Leer este indicador <span aria-hidden="true">↗</span></button></div><div class="stats-hero-actions"><button type="button" id="stats-compare-toggle" aria-expanded="false" aria-controls="stats-compare"><span aria-hidden="true">⇄</span> Comparar dos redes</button><button type="button" id="stats-jump-history"><span aria-hidden="true">↝</span> Explorar los 12 meses</button><button type="button" id="stats-replay"><span aria-hidden="true">↻</span> Repetir animación</button><button type="button" id="stats-method"><span aria-hidden="true">↗</span> Fuentes y método</button></div>`;
      root.querySelector("#kpis-sismed").before(hero);
      const compare = document.createElement("section");
      compare.id = "stats-compare";
      compare.className = "stats-compare";
      compare.hidden = true;
      compare.setAttribute("aria-labelledby", "stats-compare-title");
      const options = networks
        .map(
          (row) =>
            `<option value="${esc(row.id)}">${esc(row.nombre.replace(/^RED /, ""))}</option>`,
        )
        .join("");
      compare.innerHTML = `<div class="stats-section-heading"><div><span class="stats-section-number">01 / COMPARAR</span><h3 id="stats-compare-title">Dos redes, una misma fecha.</h3></div><button type="button" id="stats-compare-close">Cerrar comparación ×</button></div><div class="stats-compare-selects"><label>Primera red<select id="stats-compare-a">${options}</select></label><span aria-hidden="true">⇄</span><label>Segunda red<select id="stats-compare-b">${options}</select></label></div><div id="stats-compare-result" aria-live="polite"></div><p class="source">${esc(V.SRC.sismed.texto)} · ${esc(report.fechaCorte)}. Referencias agregadas, no stock en tiempo real.</p>`;
      hero.after(compare);
      const toolbar = document.createElement("div");
      toolbar.className = "stats-lens";
      toolbar.innerHTML =
        '<div><span class="stats-section-number">EXPLORA LOS INDICADORES</span><p id="stats-filter-count" role="status"></p></div><div class="stats-filter-group" role="group" aria-label="Enfoque de indicadores"><button type="button" data-stats-filter="all">Todos <span>08</span></button><button type="button" data-stats-filter="stock">Abastecimiento <span>03</span></button><button type="button" data-stats-filter="riesgo">Puntos de atención <span>04</span></button><button type="button" data-stats-filter="cobertura">Cobertura <span>01</span></button></div>';
      root.querySelector("#kpis-sismed").before(toolbar);
      for (const [id, step] of [
        ["#stats-focus-prev", -1],
        ["#stats-focus-next", 1],
      ]) {
        hero.querySelector(id).addEventListener("click", () => {
          const keys = Object.keys(metrics).filter(
            (key) =>
              selectedGroup === "all" || metrics[key].group === selectedGroup,
          );
          spotlight(
            keys[(keys.indexOf(active) + step + keys.length) % keys.length],
          );
        });
      }
      hero
        .querySelector("#stats-focus-open")
        .addEventListener("click", () =>
          root.querySelector(`[data-metric="${active}"]`)?.click(),
        );
      const toggleCompare = () => {
        compare.hidden = !compare.hidden;
        hero
          .querySelector("#stats-compare-toggle")
          .setAttribute("aria-expanded", String(!compare.hidden));
        if (!compare.hidden) {
          comparison();
          compare.scrollIntoView({
            behavior: motionAllowed() ? "smooth" : "instant",
            block: "center",
          });
          compare.querySelector("select").focus({ preventScroll: true });
        }
      };
      hero
        .querySelector("#stats-compare-toggle")
        .addEventListener("click", toggleCompare);
      compare
        .querySelector("#stats-compare-close")
        .addEventListener("click", () => {
          toggleCompare();
          hero.querySelector("#stats-compare-toggle").focus();
        });
      compare.querySelector("#stats-compare-b").selectedIndex = Math.max(
        0,
        networks.length - 1,
      );
      compare
        .querySelectorAll("select")
        .forEach((select) => select.addEventListener("change", comparison));
      toolbar
        .querySelectorAll("[data-stats-filter]")
        .forEach((button) =>
          button.addEventListener("click", () =>
            filter(button.dataset.statsFilter),
          ),
        );
      hero
        .querySelector("#stats-jump-history")
        .addEventListener("click", () => {
          root
            .querySelector("#stats-month-control")
            .scrollIntoView({
              behavior: motionAllowed() ? "smooth" : "instant",
              block: "center",
            });
          root.querySelector("#stats-month").focus({ preventScroll: true });
        });
      hero.querySelector("#stats-replay").addEventListener("click", replay);
      hero
        .querySelector("#stats-method")
        .addEventListener("click", () => V.abrirVista("fuentes"));
      root
        .querySelector("#bars-redes")
        .parentElement.classList.add("stats-networks-card");
      root
        .querySelector("#line-historico")
        .parentElement.classList.add("stats-history-card");
      const legend = document.createElement("p");
      legend.className = "stats-reference";
      legend.textContent = `Trazo vertical: referencia regional ${meta}%`;
      if (Number.isFinite(meta))
        root.querySelector("#bars-redes").after(legend);
      root
        .querySelector("#bars-redes")
        .style.setProperty(
          "--stats-target",
          `${Number.isFinite(meta) ? meta : 0}%`,
        );
      const controls = document.createElement("div");
      controls.className = "stats-play-controls";
      controls.innerHTML =
        '<button type="button" id="stats-history-prev" aria-label="Mes anterior">←</button><button type="button" id="stats-history-play" aria-pressed="false">Reproducir histórico</button><button type="button" id="stats-history-next" aria-label="Mes siguiente">→</button>';
      root.querySelector("#stats-month-control").append(controls);
      controls
        .querySelector("#stats-history-prev")
        .addEventListener("click", () => {
          stop();
          month(Number(root.querySelector("#stats-month").value) - 1);
        });
      controls
        .querySelector("#stats-history-next")
        .addEventListener("click", () => {
          stop();
          month(Number(root.querySelector("#stats-month").value) + 1);
        });
      controls
        .querySelector("#stats-history-play")
        .addEventListener("click", () => {
          if (timer) {
            stop();
            return;
          }
          if (!motionAllowed() || !history.length) return;
          if (
            Number(root.querySelector("#stats-month").value) >=
            history.length - 1
          )
            month(0);
          controls.querySelector("#stats-history-play").textContent =
            "Pausar recorrido";
          controls
            .querySelector("#stats-history-play")
            .setAttribute("aria-pressed", "true");
          timer = setInterval(() => {
            const next = Number(root.querySelector("#stats-month").value) + 1;
            if (next >= history.length) {
              stop();
              return;
            }
            month(next);
            if (next === history.length - 1) stop();
          }, 1500);
        });
      root.querySelector("#stats-month").addEventListener("pointerdown", stop);
      root.querySelector("#stats-month").addEventListener("keydown", stop);
      root
        .querySelector("#line-historico")
        .addEventListener("pointerdown", stop);
      root
        .querySelector("#line-historico")
        .addEventListener("pointerover", stop);
    }
    root.querySelectorAll("#kpis-sismed .kpi").forEach((card, index) => {
      const key = card.dataset.indicator,
        item = metrics[key];
      if (!item) return;
      card.style.setProperty("--card-accent", item.color);
      card.style.setProperty("--card-order", index);
      card.querySelector(".kpi__l").textContent = item.name;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stats-card-focus";
      button.dataset.spotlight = key;
      button.setAttribute("aria-label", "Explorar " + item.name);
      button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><b aria-hidden="true">↗</b>`;
      button.addEventListener("click", () => {
        spotlight(key);
        root
          .querySelector(".stats-observatory")
          .scrollIntoView({
            behavior: motionAllowed() ? "smooth" : "instant",
            block: "center",
          });
      });
      card.prepend(button);
      const gauge = document.createElement("div");
      gauge.className = "stats-card-gauge";
      gauge.setAttribute("aria-hidden", "true");
      gauge.innerHTML =
        key === "ipressMonitoreadas"
          ? '<div class="stats-network-dots">' +
            networks.map(() => "<i></i>").join("") +
            "</div>"
          : `<span><i style="width:${Math.max(0, Math.min(100, metricValue(key)))}%"></i></span><small>0</small><small>100 %</small>`;
      card.querySelector(".kpi__v").after(gauge);
      card.querySelector(".kpi-explain").textContent = "Desglosar indicador";
    });
    filter(selectedGroup);
    spotlight(active);
    motionState();
    replay();
  }
  document.addEventListener("vitara:view", (event) => {
    if (event.detail.id !== "tablero") stop();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
  });
  reduced.addEventListener("change", motionState);
  new MutationObserver(motionState).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-movimiento"],
  });
  V.onView("tablero", init);
})();
