/**
 * vitara-home.js — hélice de ADN 3D, temas de acceso y uso responsable de medicamentos.
 * Usa exclusivamente el GLB real; conserva información accesible si WebGL falla.
 */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);

  const TARGETS = [
    {
      id: "generico",
      n: "01",
      label: "Genérico y principio activo",
      title: "El nombre que importa",
      mechanism:
        "La denominación común internacional (DCI) identifica el principio activo. Al comparar medicamentos, revisa también concentración, forma farmacéutica y presentación: compartir un nombre no basta.",
      clinical:
        "Consulta a un profesional antes de sustituir un tratamiento. El catálogo ofrece referencias, no recomendaciones individuales.",
      link: "Comparar referencias",
      view: "buscar",
      query: "paracetamol",
      source:
        "Orientación educativa sobre medicamentos · verifica siempre el producto y la fuente oficial.",
      note: "El ADN es un soporte visual: este punto trata de medicamentos, no identifica una parte de la molécula ni una diana farmacológica.",
    },
    {
      id: "disponibilidad",
      n: "02",
      label: "Disponibilidad y verificación",
      title: "Consultar no es encontrar stock",
      mechanism:
        "Una cifra regional de disponibilidad no confirma existencias en una farmacia concreta. Revisa la fuente y el corte, y confirma con el establecimiento antes de desplazarte.",
      clinical:
        "Si necesitas aclarar un recurso, puedes enviar una solicitud de verificación al operador de la demostración. No se envía automáticamente a una sede.",
      link: "Pedir verificación",
      view: "solicitudes",
      query: "",
      source:
        "Orientación educativa sobre medicamentos · verifica siempre el producto y la fuente oficial.",
      note: "El ADN es un soporte visual: este punto trata de medicamentos, no identifica una parte de la molécula ni una diana farmacológica.",
    },
    {
      id: "conservacion",
      n: "03",
      label: "Conservación segura",
      title: "Conservar también es cuidar",
      mechanism:
        "Sigue las condiciones del envase y del fabricante. Protege los medicamentos según su indicación de temperatura, luz y humedad, y mantenlos fuera del alcance de niños.",
      clinical:
        "No todos necesitan refrigeración. Las condiciones de productos de cadena de frío deben verificarse específicamente; no se deducen de este modelo.",
      link: "Revisar fuentes",
      view: "fuentes",
      query: "",
      source:
        "Orientación educativa sobre medicamentos · verifica siempre el producto y la fuente oficial.",
      note: "El ADN es un soporte visual: este punto trata de medicamentos, no identifica una parte de la molécula ni una diana farmacológica.",
    },
    {
      id: "uso-seguro",
      n: "04",
      label: "Uso responsable",
      title: "Sin automedicación ni dosis por chat",
      mechanism:
        "Un medicamento puede tener contraindicaciones e interacciones. No compartas recetas ni utilices antibióticos para cualquier malestar: una evaluación profesional debe decidir cuándo corresponden.",
      clinical:
        "VITARA no prescribe, calcula dosis ni sustituye una consulta. Para orientación general revisa los canales oficiales.",
      link: "Buscar orientación",
      view: "canales",
      query: "",
      source:
        "Orientación educativa sobre medicamentos · verifica siempre el producto y la fuente oficial.",
      note: "El ADN es un soporte visual: este punto trata de medicamentos, no identifica una parte de la molécula ni una diana farmacológica.",
    },
    {
      id: "vencimiento",
      n: "05",
      label: "Vencimiento y trazabilidad",
      title: "Revisa antes de utilizar",
      mechanism:
        "Comprueba fecha de vencimiento, envase íntegro, nombre, concentración e instrucciones. Compra o recibe medicamentos por canales autorizados.",
      clinical:
        "Si observas un producto sospechoso, no lo uses y consulta al químico farmacéutico o al canal oficial de DIGEMID. Los precios del catálogo no acreditan autenticidad ni existencias.",
      link: "Explorar el catálogo",
      view: "buscar",
      query: "",
      source:
        "Orientación educativa sobre medicamentos · verifica siempre el producto y la fuente oficial.",
      note: "El ADN es un soporte visual: este punto trata de medicamentos, no identifica una parte de la molécula ni una diana farmacológica.",
    },
  ];

  const state = {
    renderer: null,
    scene: null,
    camera: null,
    pivot: null,
    model: null,
    orbit: null,
    unzip: 0,
    unzipTarget: 0,
    meshes: [],
    rings: [],
    particles: null,
    fallback: false,
    ready: false,
    hover: false,
    modelEscala: 1,
    raf: 0,
    selected: null,
    resizeObserver: null,
  };

  function actualizarPanel(id) {
    const panel = $("#dna-panel");
    const hero = $("#home-hero");
    if (!panel || !hero) return;
    const t = TARGETS.find((x) => x.id === id);
    if (!t) return;
    state.selected = id;
    document
      .querySelectorAll(".dna-target")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.target === id)),
      );
    panel.innerHTML = `
      <div class="dna-panel__head">
        <div><p class="dna-panel__n">MEDICAMENTOS / ${t.n} · guía educativa</p><h3>${t.title}</h3></div>
        <button class="dna-panel__close" type="button" id="dna-panel-close" aria-label="Cerrar información de medicamentos"><svg class="i i--sm"><use href="#i-close"/></svg></button>
      </div>
      <div class="dna-panel__body">
        <div><p class="dna-panel__k">Qué conviene saber</p><p>${t.mechanism}</p></div>
        <div><p class="dna-panel__k">Antes de tomar una decisión</p><p>${t.clinical}</p></div>
        <div class="dna-panel__actions"><button class="btn btn--primary btn--sm" type="button" data-dna-go="${t.view}" data-dna-query="${t.query}">${t.link} ↗</button></div><p class="source">${t.source} <a href="https://www.digemid.minsa.gob.pe/" target="_blank" rel="noopener noreferrer">DIGEMID · portal oficial ↗</a></p>
        <p class="dna-panel__note">${t.note}</p>
      </div>`;
    panel.hidden = false;
    hero.classList.add("is-panel");
    $("#dna-panel-close")?.addEventListener("click", cerrarPanel);
    panel.querySelectorAll("[data-dna-go]").forEach((b) => {
      b.addEventListener("click", () => {
        window.dispatchEvent(
          new CustomEvent("vitara:go", {
            detail: { view: b.dataset.dnaGo, query: b.dataset.dnaQuery },
          }),
        );
      });
    });
    // En pantallas estrechas, bajamos suavemente hasta el panel.
    if (window.matchMedia("(max-width: 1180px)").matches) {
      setTimeout(
        () => panel.scrollIntoView({ block: "nearest", behavior: "smooth" }),
        60,
      );
    }
  }

  function cerrarPanel() {
    const panel = $("#dna-panel");
    const hero = $("#home-hero");
    if (!panel || !hero) return;
    panel.hidden = true;
    hero.classList.remove("is-panel");
    state.selected = null;
    document
      .querySelectorAll(".dna-target")
      .forEach((b) => b.setAttribute("aria-pressed", "false"));
  }

  function renderTargets() {
    const cont = $("#dna-targets");
    if (!cont) return;
    cont.innerHTML = TARGETS.map(
      (t) => `
      <button class="dna-target" type="button" aria-label="${t.label}" title="${t.label}" data-target="${t.id}" aria-pressed="false" aria-controls="dna-panel">
        <span class="dna-target__n">${t.n}</span><span>${t.label}</span><span class="dna-target__dot" aria-hidden="true"></span>
      </button>`,
    ).join("");
    cont.addEventListener("click", (e) => {
      const b = e.target.closest("[data-target]");
      if (!b) return;
      if (state.selected === b.dataset.target) cerrarPanel();
      else actualizarPanel(b.dataset.target);
    });
  }

  function materialPorNombre(nombre) {
    const n = nombre.toLowerCase();
    const base = { roughness: 0.38, metalness: 0.03, emissiveIntensity: 0.05 };
    if (n.includes("hydrogen") || n.includes("bond") || n.includes("hidr"))
      return new THREE.MeshStandardMaterial({
        color: 0xbfd8cb,
        roughness: 0.5,
        metalness: 0,
        transparent: true,
        opacity: 0.55,
      });
    if (n.includes("adenine"))
      return new THREE.MeshStandardMaterial({
        color: 0xf09a8b,
        emissive: 0x3a120e,
        ...base,
      });
    if (n.includes("thymine"))
      return new THREE.MeshStandardMaterial({
        color: 0xf0c46a,
        emissive: 0x3b2a08,
        ...base,
      });
    if (n.includes("guanine"))
      return new THREE.MeshStandardMaterial({
        color: 0x7ac9a9,
        emissive: 0x0c2a20,
        ...base,
      });
    if (n.includes("cytosine"))
      return new THREE.MeshStandardMaterial({
        color: 0x86b7e8,
        emissive: 0x0b1e33,
        ...base,
      });
    if (n.includes("phosphate") || n.includes("pentose") || n.includes("sugar"))
      return new THREE.MeshStandardMaterial({
        color: 0xe3eee8,
        roughness: 0.55,
        metalness: 0.02,
      });
    return new THREE.MeshStandardMaterial({
      color: 0xc9dad2,
      roughness: 0.5,
      metalness: 0.03,
    });
  }

  function iluminar() {
    const scene = state.scene;
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcde6da, 1.35));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4.5, 8, 7);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbee4ff, 0.75);
    fill.position.set(-6, -2, 5);
    scene.add(fill);
    const rim = new THREE.PointLight(0x2bb7a8, 32, 26, 2);
    rim.position.set(-3, 1.5, 5);
    scene.add(rim);
    state.rim = rim;
    const rim2 = new THREE.PointLight(0xf3b8a8, 18, 22, 2);
    rim2.position.set(3, -2, 4);
    scene.add(rim2);
  }

  function anillos(altura, radio) {
    const grupo = new THREE.Group();
    const posiciones = [-0.36, -0.18, 0, 0.18, 0.36];
    posiciones.forEach((p, i) => {
      const geo = new THREE.TorusGeometry(radio + 0.16, 0.012, 6, 64);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x1fae9f,
        transparent: true,
        opacity: 0.34,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = p * altura;
      ring.userData.fase = i * 0.7;
      grupo.add(ring);
      state.rings.push(ring);
    });
    return grupo;
  }

  function particulas(altura, radio) {
    const n = 170;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = radio * (0.9 + Math.random() * 1.15);
      pos[i * 3] = Math.cos(ang) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * altura * 1.12;
      pos[i * 3 + 2] = Math.sin(ang) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x79cbb1,
      size: 0.035,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }

  function prepararDesdoblamiento(modelo) {
    const caja = new THREE.Box3().setFromObject(modelo);
    const tam = caja.getSize(new THREE.Vector3());
    const alto = Math.max(tam.y, 0.001);
    state.unzipOffset = Math.max(alto * 0.055, 0.25);
    state.meshes = [];
    modelo.updateMatrixWorld(true);
    modelo.traverse((m) => {
      if (!m.isMesh) return;
      const centros = [];
      const nombres = [m.name];
      let p = m.parent;
      while (p && nombres.length < 5) {
        if (p.name) nombres.push(p.name);
        p = p.parent;
      }
      m.material = materialPorNombre(nombres.join(" "));
      m.geometry.computeBoundingBox();
      const c = new THREE.Vector3();
      m.geometry.boundingBox.getCenter(c);
      const mundo = m.localToWorld(c.clone());
      const enPadre = m.parent.worldToLocal(mundo.clone());
      m.geometry.translate(-c.x, -c.y, -c.z);
      m.position.copy(enPadre);
      m.userData.base = enPadre.clone();
      m.userData.sign = enPadre.x >= 0 ? 1 : -1;
      m.userData.alto = alto;
      state.meshes.push(m);
      // evita arrays no usados
      if (centros.length) centros.length = 0;
    });
  }

  function iniciarEscena() {
    const canvas = $("#dna-canvas");
    const stage = $("#dna-stage");
    if (!canvas || !stage) return;
    stage?.addEventListener("pointerenter", () => {
      state.hover = true;
    });
    stage?.addEventListener("pointerleave", () => {
      state.hover = false;
    });
    const fallo = () => {
      stage.classList.add("is-unavailable");
      $("#dna-loader")?.classList.add("is-hidden");
      $("#dna-fallback")?.removeAttribute("hidden");
    };
    if (!window.THREE) {
      fallo();
      return;
    }
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      state.renderer = renderer;
      const scene = new THREE.Scene();
      state.scene = scene;
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.set(0, 0, 14);
      state.camera = camera;
      iluminar();
      scene.add(new THREE.AmbientLight(0xffffff, 0.7));

      const pivot = new THREE.Group();
      scene.add(pivot);
      state.pivot = pivot;

      const cargar = async () => {
        let modelo;
        try {
          if (!window.VitaraGLB) throw new Error("Sin cargador GLB");
          const r = await window.VitaraGLB.load("./adn.glb");
          modelo = r.group;
          pivot.add(modelo);
          // Encuadre
          const contenedor = window.VitaraGLB.fitToHeight(modelo, 8.4);
          pivot.remove(modelo);
          pivot.add(contenedor);
          state.model = contenedor;
          state.modelEscala = contenedor.scale.x;
          contenedor.scale.setScalar(state.modelEscala * 0.9);
          prepararDesdoblamiento(contenedor);
          const caja = new THREE.Box3().setFromObject(contenedor);
          const tam = caja.getSize(new THREE.Vector3());
          const radio = Math.max(tam.x, tam.z) * 0.5 + 0.2;
          pivot.add(anillos(8.4, radio));
          state.particles = particulas(8.4, radio * 1.1);
          scene.add(state.particles);
          const base = new THREE.Mesh(
            new THREE.TorusGeometry(radio * 1.36, 0.008, 6, 90),
            new THREE.MeshBasicMaterial({
              color: 0x8fcbb7,
              transparent: true,
              opacity: 0.28,
            }),
          );
          base.rotation.x = Math.PI / 2;
          base.position.y = -4.38;
          scene.add(base);
          state.baseRing = base;
        } catch (err) {
          console.warn("[VITARA] No se pudo cargar ADN.", err);
          fallo();
          const button = document.createElement("button");
          button.className = "btn btn--ghost btn--sm";
          button.type = "button";
          button.textContent = "Reintentar modelo";
          button.addEventListener(
            "click",
            () => {
              button.remove();
              $("#dna-fallback").hidden = true;
              $("#dna-loader").classList.remove("is-hidden");
              cargar();
            },
            { once: true },
          );
          $("#dna-fallback")?.appendChild(button);
          return;
        }
        stage.classList.remove("is-unavailable");
        state.ready = true;
        $("#dna-loader")?.classList.add("is-hidden");
        if (state.fallback) $("#dna-fallback")?.setAttribute("hidden", "");
        const ocultarError = $("#dna-fallback");
        if (ocultarError) ocultarError.hidden = true;
        state.orbit = window.VitaraGLB?.orbit(pivot, canvas, {
          camera,
          rotY: 0.15,
          zoom: 1,
          autoRotate: true,
        });
      };
      cargar();

      const ajustar = () => {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      ajustar();
      state.resizeObserver = new ResizeObserver(ajustar);
      state.resizeObserver.observe(stage);
      window.addEventListener("resize", ajustar);

      let t = 0;
      const animar = () => {
        state.raf = requestAnimationFrame(animar);
        const reduced =
          matchMedia("(prefers-reduced-motion: reduce)").matches ||
          document.documentElement.dataset.movimiento === "reducido";
        if (!reduced) t += 0.016;
        // desdoblamiento suave
        state.unzip += (state.unzipTarget - state.unzip) * (reduced ? 1 : 0.08);
        if (state.meshes.length) {
          const desplazamiento = state.unzipOffset || 0.72;
          state.meshes.forEach((m) => {
            m.position.x =
              m.userData.base.x +
              m.userData.sign * state.unzip * desplazamiento;
          });
        } else if (state.fallback && state.model) {
          state.model.children.forEach((c) => {
            if (c.userData.hebra == null && c.position.x !== 0)
              c.userData.hebra = c.position.x >= 0 ? 1 : -1;
          });
        }
        const intensidadHover = state.hover ? 0.34 : 0;
        if (state.rim) {
          const objetivoLuz = state.hover ? 46 : 32;
          state.rim.intensity += (objetivoLuz - state.rim.intensity) * 0.06;
        }
        if (state.baseRing) {
          const objetivoBase = state.hover ? 0.52 : 0.28;
          state.baseRing.material.opacity +=
            (objetivoBase - state.baseRing.material.opacity) * 0.06;
        }
        if (state.particles) {
          if (!reduced) state.particles.rotation.y -= 0.0007;
          const mat = state.particles.material;
          const base = typeof mat.opacity === "number" ? mat.opacity : 0.55;
          mat.opacity += (base + intensidadHover - mat.opacity) * 0.06;
        }
        if (state.rings.length) {
          state.rings.forEach((r, i) => {
            const base =
              state.selected === TARGETS[i]?.id
                ? 0.75
                : 0.28 + Math.sin(t * 1.1 + r.userData.fase) * 0.07;
            const objetivo = Math.min(0.97, base + intensidadHover);
            r.material.opacity += (objetivo - r.material.opacity) * 0.08;
            r.scale.setScalar(1 + Math.sin(t * 1.1 + r.userData.fase) * 0.012);
          });
        }
        if (state.model) {
          const objetivoEscala =
            state.modelEscala != null ? state.modelEscala : 1;
          const escalaActual = state.model.scale.x;
          state.model.scale.setScalar(
            escalaActual +
              (objetivoEscala - escalaActual) * (reduced ? 1 : 0.07),
          );
        }
        if (state.ready) {
          pivot.updateMatrixWorld(true);
          document.querySelectorAll(".dna-target").forEach((button, index) => {
            const angle = index * 1.8;
            const point = new THREE.Vector3(
              Math.cos(angle) * 1.2,
              3.1 - index * 1.55,
              Math.sin(angle) * 1.2,
            );
            point.applyMatrix4(pivot.matrixWorld).project(camera);
            button.style.left = `${(point.x * 0.5 + 0.5) * 100}%`;
            button.style.top = `${(-point.y * 0.5 + 0.5) * 100}%`;
            button.style.visibility =
              Math.abs(point.x) < 0.9 && Math.abs(point.y) < 0.85 && point.z < 1
                ? "visible"
                : "hidden";
          });
        }
        if (
          !document.hidden &&
          canvas.getClientRects().length &&
          !document.body.classList.contains("access-locked")
        )
          renderer.render(scene, camera);
      };
      animar();
    } catch (err) {
      console.warn("[VITARA] WebGL no disponible.", err);
      fallo();
    }

    const controles = () => {
      $("#dna-unzip")?.addEventListener("click", (e) => {
        state.unzipTarget = state.unzipTarget ? 0 : 1;
        e.currentTarget.setAttribute(
          "aria-pressed",
          String(!!state.unzipTarget),
        );
        if (state.fallback && state.orbit) {
          // En la versión ilustrativa el desdoblamiento se aproxima separando el pivote.
          state.orbit.estado.zoom = state.unzipTarget ? 0.86 : 1;
        }
      });
      $("#dna-rotate")?.addEventListener("click", (e) => {
        if (!state.orbit) return;
        const activo = e.currentTarget.getAttribute("aria-pressed") === "true";
        e.currentTarget.setAttribute("aria-pressed", String(!activo));
        state.orbit.setAutoRotate(!activo);
      });
      $("#dna-zoom-in")?.addEventListener("click", () =>
        state.orbit?.zoom(1.1),
      );
      $("#dna-zoom-out")?.addEventListener("click", () =>
        state.orbit?.zoom(0.9),
      );
      $("#dna-reset")?.addEventListener("click", () => {
        state.orbit?.reencuadrar();
        state.unzipTarget = 0;
        $("#dna-unzip")?.setAttribute("aria-pressed", "false");
        if (state.selected) cerrarPanel();
      });
    };
    controles();
  }

  function iniciar() {
    renderTargets();
    iniciarEscena();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.selected) cerrarPanel();
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
