/** Ampliaciones de presentación: plano original y preferencia de lectura, sin tocar registros. */
(() => {
  "use strict";
  const V = window.Vitara;
  if (!V) return;
  const svg = document.querySelector(".floor-svg");
  if (svg) {
    const rooms = [
      {
        id: "patio",
        name: "Patio exterior",
        size: "6,0 × 6,0 m · 36 m²",
        purpose:
          "Acceso y espacio exterior del esquema. El recorrido de personas y los accesos de servicio deben evaluarse en un proyecto real.",
        equipment:
          "Señalización y espacio libre de circulación. Los elementos de paisaje del dibujo son ilustrativos.",
      },
      {
        id: "farmacia",
        name: "Farmacia y cadena de frío",
        size: "8,0 × 4,0 m · 32 m²",
        purpose:
          "Organizar recepción, almacenamiento y entrega de medicamentos según condiciones de cada producto.",
        equipment:
          "Estantes, mostrador y refrigerador indicativos. El rango +2 a +8 °C solo corresponde a productos que lo requieran; seguir instrucciones específicas.",
      },
      {
        id: "consultorio",
        name: "Consultorio general",
        size: "4,0 × 4,0 m · 16 m²",
        purpose:
          "Representar una zona de entrevista y exploración con privacidad y circulación alrededor de la camilla.",
        equipment:
          "Camilla, escritorio y asiento esquemáticos; no es una lista normativa completa.",
      },
      {
        id: "espera",
        name: "Sala de espera",
        size: "3,5 × 3,5 m · 12,25 m²",
        purpose:
          "Reconocer la zona de espera antes de acceder a los espacios de atención.",
        equipment:
          "Asientos indicativos y paso libre. El plano no calcula aforo ni certifica accesibilidad.",
      },
      {
        id: "telesalud",
        name: "Telesalud",
        size: "2,5 × 3,0 m · 7,5 m²",
        purpose:
          "Conversar sobre atención remota, conectividad y privacidad audiovisual.",
        equipment:
          "Mesa, pantalla y asiento esquemáticos. No representa una conexión operativa con un servicio real.",
      },
      {
        id: "equipos",
        name: "Sala de equipos",
        size: "2,5 × 3,0 m · 7,5 m²",
        purpose:
          "Organizar el resguardo y preparación de equipos portátiles, separados de las rutas de circulación.",
        equipment:
          "Carro y estantería indicativos. Compatibilidad eléctrica, mantenimiento y almacenamiento deben verificarse en la sede.",
      },
    ];
    const ns = "http://www.w3.org/2000/svg";
    const furniture = document.createElementNS(ns, "g");
    furniture.id = "floor-furniture";
    furniture.setAttribute("aria-hidden", "true");
    furniture.innerHTML =
      '<g class="floor-furnish"><rect x="300" y="108" width="170" height="25" rx="3"/><path d="M340 108v25m40-25v25m40-25v25"/><rect x="533" y="110" width="38" height="68" rx="3"/><path d="M533 132h38m-8-14v8m0 13v21"/><text x="552" y="194" text-anchor="middle">FRÍO</text><rect x="400" y="170" width="98" height="25" rx="4"/><rect x="615" y="112" width="77" height="48" rx="7"/><rect x="620" y="117" width="16" height="38" rx="3"/><path d="M650 112v48"/><rect x="710" y="116" width="25" height="47" rx="3"/><circle cx="720" cy="181" r="9"/><rect x="773" y="110" width="25" height="23" rx="5"/><rect x="814" y="110" width="25" height="23" rx="5"/><rect x="855" y="110" width="25" height="23" rx="5"/><rect x="773" y="151" width="25" height="23" rx="5"/><rect x="814" y="151" width="25" height="23" rx="5"/><rect x="290" y="246" width="58" height="28" rx="3"/><rect x="308" y="239" width="22" height="13" rx="2"/><circle cx="318" cy="295" r="10"/><rect x="389" y="241" width="60" height="19" rx="3"/><rect x="395" y="284" width="42" height="29" rx="4"/><circle cx="401" cy="318" r="3"/><circle cx="432" cy="318" r="3"/><circle cx="88" cy="134" r="24"/><circle cx="186" cy="225" r="28"/><path d="M72 134h32m-16-16v32m82 75h32m-16-16v32"/></g>';
    const flow = document.createElementNS(ns, "g");
    flow.id = "floor-flow";
    flow.setAttribute("hidden", "");
    flow.setAttribute("aria-hidden", "true");
    flow.innerHTML =
      '<path class="floor-route" d="M65 420H320V365H540V185H480"/><circle cx="65" cy="420" r="8" fill="#e4a37e"/><circle cx="480" cy="185" r="8" fill="#1c8368"/>';
    svg.append(furniture, flow);
    svg.removeAttribute("role");
    svg.setAttribute(
      "aria-label",
      "Plano educativo interactivo. Selecciona un ambiente con los botones o con teclado sobre sus áreas.",
    );
    const toolbar = document.createElement("div");
    toolbar.className = "floor-toolbar";
    toolbar.innerHTML =
      '<div class="floor-layers" role="group" aria-label="Capas del plano"><button type="button" id="floor-equipment" aria-pressed="true">Equipamiento ilustrativo</button><button type="button" id="floor-route" aria-pressed="false">Ver recorrido conceptual</button><button type="button" id="floor-focus" disabled>Acercar selección</button><button type="button" id="floor-fit">Ver todo</button></div><p>Selecciona un ambiente. Conservamos las medidas del esquema original.</p><div class="floor-room-buttons" role="group" aria-label="Ambientes del plano">' +
      rooms
        .map(
          (room) =>
            `<button type="button" data-floor-room="${room.id}" aria-pressed="false">${room.name}</button>`,
        )
        .join("") +
      "</div>";
    svg.before(toolbar);
    const detail = document.createElement("section");
    detail.className = "floor-detail";
    detail.setAttribute("aria-live", "polite");
    detail.innerHTML =
      '<span class="overline">UN ESPACIO, UNA FUNCIÓN</span><h4>Explora el plano por ambientes.</h4><p>Las figuras de mobiliario y el recorrido son ilustrativos. No constituyen un plano de obra, una distribución normativa ni un inventario real.</p>';
    svg.after(detail);
    let selectedRoom = null;
    toolbar.querySelector("#floor-focus").addEventListener("click", () => {
      if (!selectedRoom) return;
      const rect =
        svg.querySelectorAll(".room")[
          rooms.findIndex((room) => room.id === selectedRoom)
        ];
      const box = rect.getBBox();
      svg.setAttribute(
        "viewBox",
        `${box.x - 25} ${box.y - 30} ${box.width + 50} ${box.height + 80}`,
      );
    });
    toolbar
      .querySelector("#floor-fit")
      .addEventListener("click", () =>
        svg.setAttribute("viewBox", "0 0 920 570"),
      );
    function select(id) {
      selectedRoom = id;
      toolbar.querySelector("#floor-focus").disabled = false;
      const room = rooms.find((r) => r.id === id);
      if (!room) return;
      toolbar
        .querySelectorAll("[data-floor-room]")
        .forEach((button) =>
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.floorRoom === id),
          ),
        );
      svg.querySelectorAll(".room").forEach((rect, i) => {
        rect.classList.toggle("is-selected", rooms[i].id === id);
        rect.setAttribute("aria-pressed", String(rooms[i].id === id));
      });
      detail.innerHTML = `<span class="overline">${room.size}</span><h4>${room.name}</h4><p>${room.purpose}</p><p><strong>Equipamiento y organización:</strong> ${room.equipment}</p><small>Modelo educativo · dimensiones originales del esquema · requiere evaluación profesional para cualquier proyecto real.</small>`;
    }
    toolbar
      .querySelectorAll("[data-floor-room]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          select(button.dataset.floorRoom),
        ),
      );
    svg.querySelectorAll(".room").forEach((rect, i) => {
      rect.setAttribute("tabindex", "0");
      rect.setAttribute("role", "button");
      rect.setAttribute("aria-label", rooms[i].name);
      rect.setAttribute("aria-pressed", "false");
      rect.addEventListener("click", () => select(rooms[i].id));
      rect.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(rooms[i].id);
        }
      });
    });
    toolbar
      .querySelector("#floor-equipment")
      .addEventListener("click", (event) => {
        const hidden = furniture.toggleAttribute("hidden");
        event.currentTarget.setAttribute("aria-pressed", String(!hidden));
      });
    toolbar.querySelector("#floor-route").addEventListener("click", (event) => {
      const hidden = flow.toggleAttribute("hidden");
      event.currentTarget.setAttribute("aria-pressed", String(!hidden));
    });
  }
  // Muchas hojas usan px: escalar solo el body no aumenta esas etiquetas.
  // Guardamos los estilos originales y medimos ANTES de aplicar el aumento a cada texto.
  const root = document.documentElement,
    saved = new Map();
  let frame = 0;
  const selectors =
    "div,h1,h2,h3,h4,h5,p,span,a,button,label,input,select,textarea,small,strong,b,em,li,td,th,dt,dd,summary,blockquote,legend,output";
  function applyText() {
    for (const [element, original] of saved) {
      if (!element.isConnected) {
        saved.delete(element);
        continue;
      }
      if (original.value)
        element.style.setProperty(
          "font-size",
          original.value,
          original.priority,
        );
      else element.style.removeProperty("font-size");
    }
    saved.clear();
    if (root.dataset.texto !== "grande") return;
    const measurements = [...document.body.querySelectorAll(selectors)]
      .filter((e) => !e.closest("svg,.splash") && !e.classList.contains("i"))
      .map((element) => [
        element,
        parseFloat(getComputedStyle(element).fontSize),
      ]);
    for (const [element, size] of measurements) {
      if (!Number.isFinite(size) || size <= 0) continue;
      saved.set(element, {
        value: element.style.getPropertyValue("font-size"),
        priority: element.style.getPropertyPriority("font-size"),
      });
      element.style.setProperty(
        "font-size",
        `${(size * 1.3).toFixed(2)}px`,
        "important",
      );
    }
    window.dispatchEvent(new Event("resize"));
  }
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(applyText);
  };
  new MutationObserver(schedule).observe(root, {
    attributes: true,
    attributeFilter: ["data-texto"],
  });
  new MutationObserver((records) => {
    if (
      root.dataset.texto === "grande" &&
      records.some((record) =>
        [...record.addedNodes].some((node) => node.nodeType === 1),
      )
    )
      schedule();
  }).observe(document.body, { childList: true, subtree: true });
  for (const width of [540, 600, 800, 1000, 1200]) {
    matchMedia(`(max-width:${width}px)`).addEventListener("change", schedule);
  }
  applyText();
})();
