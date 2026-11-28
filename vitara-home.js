/**
 * vitara-home.js — hélice de ADN 3D, exploración de componentes reales del modelo y su relación educativa con medicamentos.
 * Usa exclusivamente el GLB real; conserva información accesible si WebGL falla.
 */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);

  const TARGETS = [
    {
      id: "adenine",
      n: "01",
      label: "Adenina · A",
      title: "Adenina: una de las cuatro bases",
      mechanism:
        "La adenina es una base nitrogenada del ADN. En la doble hélice se empareja con la timina. La secuencia de bases participa en el almacenamiento de información genética.",
      clinical:
        "Algunos cambios en la secuencia pueden influir en cómo el organismo responde a ciertos medicamentos. Esta forma 3D no identifica variantes ni permite elegir un tratamiento.",
      color: "#ff9f78",
      view: "buscar",
      query: "",
      link: "Explorar medicamentos",
      source:
        "NHGRI · conceptos de ADN y farmacogenómica. Clasificación visual según los nombres de componentes del modelo original.",
      note: "Punto anclado a un vértice de una malla identificada por su nombre en el archivo. Colores educativos, no identificación atómica certificada, diagnóstico ni recomendación terapéutica.",
    },
    {
      id: "thymine",
      n: "02",
      label: "Timina · T",
      title: "Timina: la pareja de la adenina",
      mechanism:
        "La timina es una base del ADN y forma pares con la adenina. Un nucleótido no es solo una base: también contiene desoxirribosa y fosfato.",
      clinical:
        "El principio activo de un medicamento no se deduce de una base del ADN. Para consultar medicamentos, utiliza nombre, concentración y forma farmacéutica, no los colores de esta molécula.",
      color: "#f3d46f",
      view: "buscar",
      query: "",
      link: "Explorar medicamentos",
      source:
        "NHGRI · conceptos de ADN y farmacogenómica. Clasificación visual según los nombres de componentes del modelo original.",
      note: "Punto anclado a un vértice de una malla identificada por su nombre en el archivo. Colores educativos, no identificación atómica certificada, diagnóstico ni recomendación terapéutica.",
    },
    {
      id: "cytosine",
      n: "03",
      label: "Citosina · C",
      title: "Citosina: complementariedad con guanina",
      mechanism:
        "La citosina es una base nitrogenada que se empareja con la guanina. El emparejamiento complementario contribuye a la organización de la doble hélice.",
      clinical:
        "La genética es solo uno de los factores que pueden influir en la respuesta a medicamentos. No todos los medicamentos actúan sobre el ADN y este modelo no representa una diana farmacológica.",
      color: "#74bbff",
      view: "buscar",
      query: "",
      link: "Explorar medicamentos",
      source:
        "NHGRI · conceptos de ADN y farmacogenómica. Clasificación visual según los nombres de componentes del modelo original.",
      note: "Punto anclado a un vértice de una malla identificada por su nombre en el archivo. Colores educativos, no identificación atómica certificada, diagnóstico ni recomendación terapéutica.",
    },
    {
      id: "guanine",
      n: "04",
      label: "Guanina · G",
      title: "Guanina: información en secuencia",
      mechanism:
        "La guanina se empareja con la citosina. Es el orden de las bases, y no una base aislada, lo que permite codificar información genética.",
      clinical:
        "Una prueba farmacogenética requiere indicación e interpretación profesional cuando corresponde. El visor no analiza tu ADN ni sustituye una evaluación clínica.",
      color: "#b6a0ff",
      view: "buscar",
      query: "",
      link: "Explorar medicamentos",
      source:
        "NHGRI · conceptos de ADN y farmacogenómica. Clasificación visual según los nombres de componentes del modelo original.",
      note: "Punto anclado a un vértice de una malla identificada por su nombre en el archivo. Colores educativos, no identificación atómica certificada, diagnóstico ni recomendación terapéutica.",
    },
    {
      id: "sugar",
      n: "05",
      label: "Desoxirribosa",
      title: "Desoxirribosa: el azúcar del ADN",
      mechanism:
        "La desoxirribosa es un azúcar de cinco carbonos. Junto con el fosfato forma el esqueleto de cada cadena y se une a una base para formar parte de un nucleótido.",
      clinical:
        "Comprender la estructura ayuda a distinguir información científica de una promesa comercial. Una representación de ADN no demuestra que un producto sea eficaz o seguro.",
      color: "#6fe0bf",
      view: "fuentes",
      query: "",
      link: "Revisar fuentes",
      source:
        "NHGRI · conceptos de ADN y farmacogenómica. Clasificación visual según los nombres de componentes del modelo original.",
      note: "Punto anclado a un vértice de una malla identificada por su nombre en el archivo. Colores educativos, no identificación atómica certificada, diagnóstico ni recomendación terapéutica.",
    },
    {
      id: "phosphate",
      n: "06",
      label: "Fosfato",
      title: "Fosfato: continuidad de la cadena",
      mechanism:
        "Los grupos fosfato enlazan azúcares consecutivos mediante enlaces fosfodiéster. Azúcar, fosfato y base constituyen las partes de un nucleótido.",
      clinical:
        "El acceso seguro a medicamentos necesita información trazable: fuente, fecha y confirmación de disponibilidad. La estructura molecular no informa sobre existencias en una farmacia.",
      color: "#f59fce",
      view: "fuentes",
      query: "",
      link: "Revisar fuentes",
      source:
        "NHGRI · conceptos de ADN y farmacogenómica. Clasificación visual según los nombres de componentes del modelo original.",
      note: "Punto anclado a un vértice de una malla identificada por su nombre en el archivo. Colores educativos, no identificación atómica certificada, diagnóstico ni recomendación terapéutica.",
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
        <div><p class="dna-panel__n">ADN / ${t.n} · estructura y salud</p><h3>${t.title}</h3></div>
        <button class="dna-panel__close" type="button" id="dna-panel-close" aria-label="Cerrar información del componente"><svg class="i i--sm"><use href="#i-close"/></svg></button>
      </div>
      <div class="dna-panel__body">
        <div><p class="dna-panel__k">Qué conviene saber</p><p>${t.mechanism}</p></div>
        <div><p class="dna-panel__k">Relación con medicamentos y acceso</p><p>${t.clinical}</p></div>
        <div class="dna-panel__actions"><button class="btn btn--primary btn--sm" type="button" data-dna-go="${t.view}" data-dna-query="${t.query}">${t.link} ↗</button></div><p class="source">${t.source} <a href="https://www.genome.gov/es" target="_blank" rel="noopener noreferrer">NHGRI · información genética ↗</a></p>
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
        () =>
          panel.scrollIntoView({
            block: "nearest",
            behavior: motionReduced() ? "instant" : "smooth",
          }),
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
        <span class="dna-target__n" style="--pin-color:${t.color}">${t.n}</span><span>${t.label}</span><span class="dna-target__dot" aria-hidden="true"></span>
      </button>`,
    ).join("");
    cont.addEventListener("click", (e) => {
      const b = e.target.closest("[data-target]");
      if (!b) return;
      if (state.selected === b.dataset.target) cerrarPanel();
      else actualizarPanel(b.dataset.target);
    });
  }

  function motionReduced() {
    return (
      matchMedia("(prefers-reduced-motion:reduce)").matches ||
      document.documentElement.dataset.movimiento === "reducido"
    );
  }
  function component(mesh) {
    let node = mesh;
    while (node) {
      const name = node.name.toLowerCase();
      if (name.startsWith("deoxyribose_sugar")) return "sugar";
      for (const key of [
        "adenine",
        "thymine",
        "cytosine",
        "guanine",
        "phosphate",
      ])
        if (name.startsWith(key + "_")) return key;
      if (name.startsWith("hydrogen_bonds")) return "bonds";
      node = node.parent;
    }
    return "other";
  }
  function materialPorComponente(key) {
    const topic = TARGETS.find((t) => t.id === key);
    return new THREE.MeshStandardMaterial({
      color: topic?.color || "#9ebec9",
      roughness: 0.32,
      metalness: 0.08,
      emissive: topic?.color || "#23424b",
      emissiveIntensity: topic?.color?.length ? 0.12 : 0.03,
      transparent: key === "bonds",
      opacity: key === "bonds" ? 0.55 : 1,
    });
  }
  function anchors() {
    state.anchors = TARGETS.map((topic, index) => {
      let best = null,
        score = Infinity;
      const desiredY = 2.7 - index * 0.93;
      state.model.updateMatrixWorld(true);
      for (const mesh of state.meshes.filter(
        (m) => m.userData.component === topic.id,
      )) {
        const positions = mesh.geometry.attributes.position;
        for (
          let i = 0;
          i < positions.count;
          i += Math.max(1, Math.floor(positions.count / 1500))
        ) {
          const local = new THREE.Vector3().fromBufferAttribute(positions, i);
          const world = mesh.localToWorld(local.clone());
          const value =
            Math.abs(world.y - desiredY) +
            Math.abs(world.x) * 0.04 -
            world.z * 0.015;
          if (value < score) {
            score = value;
            best = { mesh, local };
          }
        }
      }
      return best;
    });
    $("#dna-canvas").dataset.anchored = String(
      state.anchors.filter(Boolean).length,
    );
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
      m.userData.component = component(m);
      m.material = materialPorComponente(m.userData.component);
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
          anchors();
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
          rotateSpeed: 1.15,
        });
        canvas.dataset.cargado = "1";
        state.orbit.controls.rotateSpeed = 1.15;
        state.orbit.controls.minPolarAngle = 0.02;
        state.orbit.controls.maxPolarAngle = Math.PI - 0.02;
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
        const intensidadHover = state.hover ? 0.16 : 0;
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
          mat.opacity += (0.4 + intensidadHover - mat.opacity) * 0.06;
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
        if (
          state.ready &&
          state.tilt &&
          state.orbit.controls.autoRotate &&
          !reduced &&
          !state.hover &&
          !document.hidden &&
          !document.body.classList.contains("access-locked")
        ) {
          const offset = camera.position
            .clone()
            .sub(state.orbit.controls.target);
          const spherical = new THREE.Spherical().setFromVector3(offset);
          spherical.phi = Math.PI / 2 + Math.sin(t * 0.25) * 0.45;
          camera.position
            .copy(state.orbit.controls.target)
            .add(offset.setFromSpherical(spherical));
          state.orbit.controls.update();
        }
        if (state.ready) {
          pivot.updateMatrixWorld(true);
          document.querySelectorAll(".dna-target").forEach((button, index) => {
            const anchor = state.anchors?.[index];
            if (!anchor || !anchor.mesh.visible) {
              button.style.visibility = "hidden";
              return;
            }
            const point = anchor.mesh
              .localToWorld(anchor.local.clone())
              .project(camera);
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

  function extendedControls() {
    const stage = $("#dna-stage"),
      visual = $(".home-visual");
    let returnFocus = null,
      previousOverflow = "";
    const tools = document.createElement("div");
    tools.className = "dna-lab-tools";
    tools.innerHTML =
      '<button type="button" id="dna-fullscreen" aria-pressed="false">Ampliar pantalla ⛶</button><button type="button" id="dna-tilt" aria-pressed="false">Órbita vertical</button><button type="button" id="dna-labels" aria-pressed="true">Puntos visibles</button><label>Explorar por capa<select id="dna-layer"><option value="all">Molécula completa</option><option value="bases">Bases A · T · C · G</option><option value="backbone">Azúcar y fosfato</option></select></label>';
    stage.append(tools);
    const hint = document.createElement("p");
    hint.className = "dna-learning-hint";
    hint.innerHTML =
      "<strong>Selecciona un número o toca un componente.</strong> Arrastra horizontal o verticalmente para girar. Usa + y − para acercarte. Los colores distinguen componentes, no medicamentos.";
    visual.before(hint);
    function expanded(on) {
      visual.classList.toggle("dna-expanded", on);
      tools
        .querySelector("#dna-fullscreen")
        .setAttribute("aria-pressed", String(on));
      tools.querySelector("#dna-fullscreen").textContent = on
        ? "Cerrar ampliación ×"
        : "Ampliar pantalla ⛶";
      if (on) {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        visual.setAttribute("role", "dialog");
        visual.setAttribute("aria-modal", "true");
        visual.setAttribute("aria-label", "Laboratorio ADN ampliado");
        returnFocus = document.activeElement;
        tools.querySelector("#dna-fullscreen").focus();
      } else {
        document.body.style.overflow = previousOverflow;
        visual.removeAttribute("role");
        visual.removeAttribute("aria-modal");
        visual.removeAttribute("aria-label");
        returnFocus?.focus();
      }
      window.dispatchEvent(new Event("resize"));
    }
    tools
      .querySelector("#dna-fullscreen")
      .addEventListener("click", async () => {
        if (visual.classList.contains("dna-expanded")) {
          if (document.fullscreenElement)
            await document.exitFullscreen().catch(() => {});
          expanded(false);
        } else {
          expanded(true);
          await visual.requestFullscreen?.().catch(() => {});
        }
      });
    document.addEventListener("fullscreenchange", () => {
      if (
        !document.fullscreenElement &&
        visual.classList.contains("dna-expanded")
      )
        expanded(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && visual.classList.contains("dna-expanded")) {
        if (document.fullscreenElement)
          document.exitFullscreen().catch(() => {});
        expanded(false);
      }
      if (event.key === "Tab" && visual.classList.contains("dna-expanded")) {
        const focusable = [
          ...visual.querySelectorAll("button,select,a[href],canvas[tabindex]"),
        ].filter(
          (el) =>
            el.getClientRects().length &&
            getComputedStyle(el).visibility !== "hidden",
        );
        if (!focusable.length) return;
        const first = focusable[0],
          last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    tools.querySelector("#dna-tilt").addEventListener("click", (event) => {
      state.tilt = !state.tilt;
      event.currentTarget.setAttribute("aria-pressed", String(state.tilt));
    });
    tools.querySelector("#dna-labels").addEventListener("click", (event) => {
      const on = event.currentTarget.getAttribute("aria-pressed") !== "true";
      event.currentTarget.setAttribute("aria-pressed", String(on));
      $("#dna-targets").hidden = !on;
    });
    tools.querySelector("#dna-layer").addEventListener("change", (event) => {
      const layer = event.target.value;
      state.meshes.forEach((mesh) => {
        mesh.visible =
          layer === "all" ||
          (layer === "bases"
            ? ["adenine", "thymine", "cytosine", "guanine"].includes(
                mesh.userData.component,
              )
            : ["sugar", "phosphate"].includes(mesh.userData.component));
      });
    });
    let pointer;
    const canvas = $("#dna-canvas");
    canvas.addEventListener("pointerdown", (event) => {
      pointer = [event.clientX, event.clientY];
    });
    canvas.addEventListener("pointerup", (event) => {
      if (
        !pointer ||
        Math.hypot(event.clientX - pointer[0], event.clientY - pointer[1]) >
          6 ||
        !state.ready
      )
        return;
      const box = canvas.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - box.left) / box.width) * 2 - 1,
          (-(event.clientY - box.top) / box.height) * 2 + 1,
        ),
        state.camera,
      );
      const hit = ray.intersectObjects(
        state.meshes.filter((mesh) => mesh.visible),
        false,
      )[0];
      if (hit && TARGETS.some((t) => t.id === hit.object.userData.component))
        actualizarPanel(hit.object.userData.component);
    });
  }
  function iniciar() {
    renderTargets();
    iniciarEscena();
    extendedControls();
    // Libera el contexto al abandonar la página, sin romper la restauración bfcache.
    window.addEventListener('pagehide',event=>{
      if(event.persisted)return;
      cancelAnimationFrame(state.raf);state.resizeObserver?.disconnect();state.orbit?.dispose();
      if(state.scene)window.VitaraGLB?.dispose(state.scene);
      state.renderer?.dispose();state.renderer?.forceContextLoss();
    },{once:true});
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.selected) cerrarPanel();
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
