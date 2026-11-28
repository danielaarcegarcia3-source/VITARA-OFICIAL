/** Navegación progresiva y prioridades declaradas. No concede permisos institucionales. */
(() => {
  "use strict";
  const V = window.Vitara;
  if (!V) return;
  const $ = (s) => document.querySelector(s);
  const areas = [
    {
      id: "acceso",
      name: "Encontrar atención",
      description:
        "Busca recursos, prepara una verificación y encuentra orientación oficial.",
      views: ["buscar", "solicitudes", "canales"],
      cards: [
        [
          "buscar",
          "Buscar y comparar",
          "Consulta el catálogo y distingue precios de referencia de disponibilidad real.",
        ],
        [
          "solicitudes",
          "Solicitar una verificación",
          "Envía recurso, cantidad y pregunta al operador. Conserva tu código privado.",
        ],
        [
          "canales",
          "Orientación y ayuda",
          "Elige un canal oficial. El portal no realiza triaje ni llama por ti.",
        ],
      ],
    },
    {
      id: "recursos",
      name: "Explorar recursos",
      description:
        "Conoce el territorio, los espacios y el equipamiento antes de consultar.",
      views: ["mapas", "planos", "equipos", "tecnologia"],
      cards: [
        [
          "mapas",
          "Territorio y directorio",
          "Referencias documentadas por departamento, con fuente y fecha.",
        ],
        [
          "planos",
          "Espacios y recorridos",
          "Plano interactivo y modelos originales para conocer estructuras.",
        ],
        [
          "equipos",
          "Equipos y dispositivos",
          "Revisa fichas de inventario y entra al estudio educativo de dispositivos.",
        ],
      ],
    },
    {
      id: "evidencia",
      name: "Entender y organizar",
      description:
        "Explora el reporte regional, revisa las fuentes y adapta tu lectura.",
      views: ["tablero", "comunidad", "fuentes"],
      cards: [
        [
          "tablero",
          "Reporte SISMED",
          "Compara redes y recorre el histórico regional, no stock en vivo.",
        ],
        [
          "comunidad",
          "Bienestar y accesibilidad",
          "Recursos de comunidad y ajustes de lectura, contraste y movimiento.",
        ],
        [
          "fuentes",
          "Fuentes y límites",
          "Distingue registros, modelos ilustrativos y datos que requieren confirmar.",
        ],
      ],
    },
  ];
  const profiles = {
    CIU: {
      name: "Ciudadanía",
      first: "acceso",
      title: "Encuentra una ruta antes de desplazarte.",
      tasks: [
        "Identificar el recurso y su presentación.",
        "Revisar fuente, fecha y dirección publicada.",
        "Pedir confirmación y guardar el código de seguimiento.",
      ],
    },
    POSTA: {
      name: "Personal de posta o salud",
      first: "recursos",
      title: "Prepara una consulta de recursos con contexto.",
      tasks: [
        "Precisar el recurso, cantidad y unidad requerida.",
        "Revisar los equipos y accesorios de referencia.",
        "Enviar la pregunta y seguir la respuesta del operador.",
      ],
    },
    AGC: {
      name: "Gestión",
      first: "evidencia",
      title: "Convierte el reporte en preguntas verificables.",
      tasks: [
        "Revisar el corte del reporte regional.",
        "Comparar dos redes sin confundirlas con sedes.",
        "Documentar una necesidad y revisar su seguimiento.",
      ],
    },
  };
  const rail = $("#rail"),
    home = $("#view-inicio .home");
  const links = [...rail.querySelectorAll("[data-view-link]")];
  rail.querySelectorAll(".rail__group").forEach((group) => group.remove());
  const nav = document.createElement("nav");
  nav.className = "guided-rail";
  nav.setAttribute("aria-label", "Tres áreas del ecosistema");
  nav.append(links.find((link) => link.dataset.viewLink === "inicio"));
  for (const area of areas) {
    const details = document.createElement("details");
    details.className = "rail-area";
    details.dataset.area = area.id;
    const summary = document.createElement("summary");
    summary.innerHTML = `<span>${String(areas.indexOf(area) + 1).padStart(2, "0")}</span> ${area.name}<b aria-hidden="true">+</b>`;
    details.append(summary);
    for (const id of area.views) {
      const link = links.find((l) => l.dataset.viewLink === id);
      if (link) details.append(link);
    }
    details.addEventListener("toggle", () => {
      if (details.open && !allModules())
        nav.querySelectorAll(".rail-area").forEach((other) => {
          if (other !== details) other.open = false;
        });
    });
    nav.append(details);
  }
  const allModules = () => V.store.get("vitara.navigation.all", false) === true;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.id = "navigation-all";
  toggle.className = "navigation-all";
  nav.append(toggle);
  rail.querySelector(".rail__foot").before(nav);
  function expandAll(on) {
    V.store.set("vitara.navigation.all", on);
    nav.querySelectorAll(".rail-area").forEach((d) => (d.open = on));
    toggle.textContent = on
      ? "Volver a las tres áreas"
      : "Mostrar todos los módulos";
    toggle.setAttribute("aria-pressed", String(on));
  }
  toggle.addEventListener("click", () => expandAll(!allModules()));
  expandAll(allModules());
  const more = document.createElement("details");
  more.className = "home-more";
  more.innerHTML =
    "<summary>Más experiencias y contexto del proyecto <span>+</span></summary>";
  const hero = $("#home-hero");
  for (const child of [...home.children])
    if (child !== hero && !child.classList.contains("welcome-bar"))
      more.append(child);
  const pulse = hero.querySelector(".pulse-stack");
  if (pulse) more.append(pulse);
  const guide = document.createElement("section");
  guide.className = "guided-home";
  guide.setAttribute("aria-label", "Elige una de tres áreas");
  guide.innerHTML =
    '<div class="guided-heading"><div><p class="eyebrow">TRES ÁREAS / PASO A PASO</p><h2>¿Qué necesitas hacer hoy?</h2><p id="guided-profile-note"></p></div><label>Tu experiencia<select id="guided-role"><option value="CIU">Ciudadanía</option><option value="POSTA">Personal de posta o salud</option><option value="AGC">Gestión</option></select></label></div><div class="guided-area-grid"></div><section id="guided-subcategories" hidden aria-live="polite"></section><section class="guided-priority" id="guided-priority"></section>';
  hero.after(guide);
  guide.after(more);
  more.open = allModules();
  function openArea(id) {
    const area = areas.find((a) => a.id === id);
    if (!area) return;
    guide
      .querySelectorAll("[data-open-area]")
      .forEach((b) =>
        b.setAttribute("aria-expanded", String(b.dataset.openArea === id)),
      );
    const sub = $("#guided-subcategories");
    sub.hidden = false;
    sub.innerHTML = `<div class="guided-subhead"><h3>${area.name}</h3><button type="button" id="guided-sub-close">Cerrar subcategorías ×</button></div><div class="guided-subgrid">${area.cards.map(([view, name, text]) => `<button type="button" data-guided-go="${view}"><strong>${name}</strong><span>${text}</span><b aria-hidden="true">↗</b></button>`).join("")}</div>`;
    sub.querySelector("#guided-sub-close").onclick = () => {
      sub.hidden = true;
      guide
        .querySelector(`[data-open-area=${id}]`)
        .setAttribute("aria-expanded", "false");
      guide.querySelector(`[data-open-area=${id}]`).focus();
    };
    sub
      .querySelectorAll("[data-guided-go]")
      .forEach(
        (button) =>
          (button.onclick = () => V.abrirVista(button.dataset.guidedGo)),
      );
  }
  function role() {
    const stored = V.store.get("g3.perfil", {});
    return profiles[stored?.rol] ? stored.rol : "CIU";
  }
  function priorities() {
    const key = role(),
      profile = profiles[key];
    document.documentElement.dataset.experience = key;
    $("#guided-role").value = key;
    $("#guided-profile-note").textContent =
      "Prioridad para " +
      profile.name +
      ". Puedes cambiarla; no acredita profesión ni modifica permisos.";
    const ordered = areas
      .slice()
      .sort((a, b) => (b.id === profile.first) - (a.id === profile.first));
    guide.querySelector(".guided-area-grid").innerHTML = ordered
      .map(
        (area, i) =>
          `<button type="button" data-open-area="${area.id}" aria-controls="guided-subcategories" aria-expanded="false"><span>${String(i + 1).padStart(2, "0")} / ${i === 0 ? "TU PUNTO DE PARTIDA" : "EXPLORAR"}</span><h3>${area.name}</h3><p>${area.description}</p><b aria-hidden="true">↗</b></button>`,
      )
      .join("");
    guide
      .querySelectorAll("[data-open-area]")
      .forEach((b) => (b.onclick = () => openArea(b.dataset.openArea)));
    $("#guided-subcategories").hidden = true;
    const saved = V.store.get("vitara.tasks." + key, []);
    $("#guided-priority").innerHTML =
      `<div><span class="eyebrow">TU RUTA / ${profile.name}</span><h3>${profile.title}</h3><p>Una lista de preparación guardada solo en este dispositivo. No valida una atención ni contiene datos clínicos.</p></div><div>${profile.tasks.map((task, i) => `<label><input type="checkbox" data-task="${i}" ${saved.includes(i) ? "checked" : ""}><span>${task}</span></label>`).join("")}<button type="button" id="guided-start-task">${key === "AGC" ? "Comparar redes" : "Preparar verificación"} ↗</button></div>`;
    $("#guided-priority")
      .querySelectorAll("[data-task]")
      .forEach(
        (input) =>
          (input.onchange = () =>
            V.store.set(
              "vitara.tasks." + key,
              [...$("#guided-priority").querySelectorAll("input:checked")].map(
                (el) => Number(el.dataset.task),
              ),
            )),
      );
    $("#guided-start-task").onclick = () =>
      V.abrirVista(key === "AGC" ? "tablero" : "solicitudes");
  }
  $("#guided-role").onchange = (event) => {
    const profile = V.store.get("g3.perfil", {});
    V.store.set("g3.perfil", { ...profile, rol: event.target.value });
    priorities();
    window.dispatchEvent(new Event("vitara:profile"));
  };
  window.addEventListener("vitara:session", priorities);
  window.addEventListener("vitara:profile", priorities);
  priorities();
  document.addEventListener("vitara:view", (event) => {
    const area = areas.find((a) => a.views.includes(event.detail.id));
    if (area) {
      nav.querySelectorAll(".rail-area").forEach((details) => {
        details.open = allModules() || details.dataset.area === area.id;
      });
    }
  });
  // Google nunca se simula con la sintaxis de un correo.
  const googleButton = $("#google-connect"),
    googleStatus = $("#google-status");
  let googleConfigured=false;
  const googleLabel=text=>googleButton.querySelector('span').textContent=text;
  googleButton.onclick = () => {
    if(!googleConfigured){googleStatus.textContent='Google aún necesita activación en este servidor. Puedes entrar ahora con «Explorar sin conectar una cuenta». No se verificará ni guardará tu correo.';$('#access-status').textContent='Conexión con Google pendiente de configuración del propietario.';return;}
    if(!$('#access-name').reportValidity() || !$('#access-email').reportValidity())return;
    sessionStorage.setItem('vitara.access.alias',$('#access-name').value.trim());
    location.assign('/api/google/start');
  };
  fetch("/api/google/session", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error();
      return response.json();
    })
    .then((data) => {
      googleConfigured=!!data.configured;googleButton.disabled=false;googleButton.setAttribute("aria-describedby","google-status");
      googleLabel("Continuar con Google");
      googleStatus.textContent = data.configured
        ? "Google verifica tu cuenta. No leemos tus correos."
        : "El acceso con Google aún no está activado en este servidor. Puedes entrar sin conectar una cuenta; no se verificará ningún correo.";
      if (data.identity?.verified) {
        window.VitaraGoogleIdentity = data.identity;
        window.dispatchEvent(new Event("vitara:google-ready"));
        $("#access-email").value = data.identity.email;
        $("#access-email").readOnly = true;
        $("#access-name").value = sessionStorage.getItem("vitara.access.alias") || data.identity.nombre;sessionStorage.removeItem("vitara.access.alias");

        googleLabel("Cambiar cuenta de Google");
        googleStatus.textContent =
          "Cuenta verificada por Google: " +
          data.identity.email +
          ". Confirma tu usuario y decide si deseas sincronizar. Puedes cambiar tu experiencia dentro del portal.";
      }
      const result = new URLSearchParams(location.search).get("google");
      if (result && result !== "conectado")
        googleStatus.textContent =
          "No se completó la conexión. Tu cuenta no se guardó. Puedes reintentar o explorar como visitante.";
      if (result) {
        const url = new URL(location.href);
        url.searchParams.delete("google");
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    })
    .catch(() => {
      googleConfigured=false;googleButton.disabled=false;googleLabel("Revisar conexión con Google");
      googleStatus.textContent =
        "Puedes continuar como visitante. No se confirma ningún correo sin verificar.";
    });
})();
