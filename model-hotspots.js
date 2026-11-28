/** Puntos educativos sobre modelos reales: proyección 3D, capítulos y fichas tipo Genially. */
(function () {
  "use strict";
  const V = window.Vitara;
  if (!V) return;
  const { esc } = V;
  const CONTENT = {
    hospital: [
      {
        title: "Entrada y vestíbulo",
        tag: "ACCESO AL EDIFICIO",
        position: [-0.3, -0.12, 0.32],
        text: "Observa el acceso del volumen principal y su relación con la fachada. La entrada organiza el paso entre exterior e interior y necesita señalización comprensible.",
        question: "¿Se distingue el acceso de los recorridos de servicio?",
        action: "Explorar plano y ambientes",
        view: "planos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Ventanas y fachada",
        tag: "ENVOLVENTE ARQUITECTÓNICA",
        position: [0.3, 0.08, 0.12],
        text: "Los huecos de la fachada ayudan a entender la distribución de niveles y la relación del interior con la luz exterior. La presencia de ventanas no certifica ventilación clínica.",
        question: "¿Cómo se relacionan las ventanas con los distintos niveles?",
        action: "Explorar plano y ambientes",
        view: "planos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Cubierta y equipos exteriores",
        tag: "INSTALACIONES DEL EDIFICIO",
        position: [-0.05, 0.25, -0.22],
        text: "En la cubierta se representan elementos técnicos y rejillas. Esta zona permite hablar de acceso de mantenimiento y separación de instalaciones respecto a la circulación de personas.",
        question:
          "¿Qué elementos del techo requieren revisión técnica y acceso seguro?",
        action: "Explorar plano y ambientes",
        view: "planos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Volúmenes y niveles",
        tag: "ORGANIZACIÓN DEL CONJUNTO",
        position: [-0.32, 0.12, -0.13],
        text: "Los cuerpos de diferente altura componen el edificio. Compara sus conexiones y la ubicación de los accesos; el exterior no permite identificar servicios interiores concretos.",
        question: "¿Cómo se conectan los distintos cuerpos del hospital?",
        action: "Explorar plano y ambientes",
        view: "planos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Recorridos exteriores",
        tag: "LLEGADA Y CIRCULACIÓN",
        position: [0.12, -0.08, 0.35],
        text: "Observa la base y el entorno inmediato de la entrada. Un proyecto real debe resolver acceso peatonal, rutas de servicio y accesibilidad sin interferencias.",
        question:
          "¿Hay un recorrido reconocible desde el exterior hasta el acceso?",
        action: "Explorar plano y ambientes",
        view: "planos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Instalaciones e interior no visible",
        tag: "LÍMITES DEL MODELO EXTERIOR",
        position: [0.3, 0.23, -0.15],
        text: "Este modelo representa principalmente la arquitectura exterior: no permite inventariar camas, monitores ni salas internas. El plano 2D permite explorar por separado ambientes y equipamiento propuesto.",
        question:
          "¿Qué necesitas comprobar en un plano interior o inventario real?",
        action: "Explorar plano y ambientes",
        view: "planos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
    ],
    or: [
      {
        title: "Mesa de operaciones",
        tag: "ZONA CENTRAL DEL QUIRÓFANO",
        position: [-0.23, -0.05, 0.15],
        text: "La mesa ocupa el área central de trabajo. Su entorno necesita espacio para el equipo asistencial y para aproximar dispositivos sin bloquear desplazamientos.",
        question: "¿Se conserva espacio alrededor de la mesa?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Lámparas quirúrgicas",
        tag: "ILUMINACIÓN SOBRE EL CAMPO",
        position: [0.22, 0.18, -0.15],
        text: "Los conjuntos de iluminación suspendidos se orientan hacia la zona de la mesa. Su articulación permite variar la dirección de la luz; el modelo no mide intensidad ni calidad lumínica.",
        question:
          "¿Cómo se relacionan las lámparas con la posición de la mesa?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Carro auxiliar e instrumental",
        tag: "SUPERFICIES DE APOYO",
        position: [0.02, -0.16, 0.3],
        text: "El carro con bandejas es un apoyo móvil próximo a la zona de trabajo. La disposición real de materiales y las condiciones de esterilidad dependen del protocolo de la sede.",
        question:
          "¿Puede desplazarse el carro sin interferir con otros equipos?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Brazos y soportes suspendidos",
        tag: "EQUIPAMIENTO EN ALTURA",
        position: [-0.3, 0.23, -0.23],
        text: "Los soportes articulados aprovechan el espacio superior para acercar dispositivos y conexiones al puesto de trabajo. No se deduce de la geometría qué tomas o circuitos están operativos.",
        question: "¿Los soportes dejan libre la circulación a nivel del suelo?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Armarios y almacenamiento",
        tag: "MATERIAL ORGANIZADO",
        position: [0.32, -0.14, 0.2],
        text: "Los armarios del fondo separan el almacenamiento de la zona central. Un inventario real debe identificar contenido, limpieza y condiciones de acceso; la imagen no confirma insumos disponibles.",
        question:
          "¿Se distinguen las áreas de almacenamiento y de intervención?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Paredes, suelo y circulación",
        tag: "RELACIÓN ENTRE ESPACIO Y EQUIPOS",
        position: [0.04, 0.3, 0.02],
        text: "Las superficies delimitan el recinto y el espacio de circulación alrededor del equipamiento. La representación no certifica acabados sanitarios, ventilación, presión ni seguridad eléctrica.",
        question: "¿Qué recorridos quedarían libres con el equipo en uso?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
    ],
    vr: [
      {
        title: "Zona de mesa y trabajo",
        tag: "CHARITÉ · ÁREA CENTRAL",
        position: [-0.22, -0.08, 0.2],
        text: "Explora la zona central donde se concentran la mesa y los puestos de trabajo. Observa las distancias con los dispositivos próximos, sin inferir medidas clínicas a partir de una perspectiva.",
        question:
          "¿Qué espacio necesita el personal alrededor del área central?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Modelo Charité: ChrisRE · CC BY-NC 4.0. Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Iluminación y brazos de techo",
        tag: "ELEMENTOS SUSPENDIDOS",
        position: [0.2, 0.23, -0.2],
        text: "Las luminarias y brazos suspendidos llevan luz y soporte a la zona de intervención. Sigue visualmente su relación con el techo y el espacio de trabajo.",
        question: "¿Cómo se evita ocupar el paso con equipamiento suspendido?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Modelo Charité: ChrisRE · CC BY-NC 4.0. Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Pantallas y monitorización",
        tag: "INFORMACIÓN JUNTO AL PUESTO",
        position: [0.08, 0.23, 0.2],
        text: "Las pantallas y soportes se distribuyen alrededor de la zona de trabajo. Su presencia no identifica marcas, parámetros clínicos ni funcionamiento real de la monitorización.",
        question:
          "¿Desde dónde puede el equipo asistencial ver la información?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Modelo Charité: ChrisRE · CC BY-NC 4.0. Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Carros y equipos móviles",
        tag: "FLEXIBILIDAD DEL ESPACIO",
        position: [-0.31, -0.12, -0.15],
        text: "Los carros y bases móviles permiten organizar equipos y material cerca del punto de uso. Observa sus posiciones y el paso entre ellos, sin considerar el modelo un inventario actualizado.",
        question: "¿Qué ruta permite retirar un carro sin bloquear la mesa?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Modelo Charité: ChrisRE · CC BY-NC 4.0. Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Puertas y superficies del recinto",
        tag: "LÍMITES Y ACCESOS",
        position: [0.32, -0.12, 0.25],
        text: "Los muros y accesos definen la relación de esta sala con el exterior. La imagen no permite comprobar flujos estériles, accesibilidad normativa ni condiciones ambientales.",
        question: "¿Dónde se ubican los accesos respecto al área central?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Modelo Charité: ChrisRE · CC BY-NC 4.0. Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
      {
        title: "Conexiones y zonas de soporte",
        tag: "RECURSOS QUE HACEN FUNCIONAR LOS EQUIPOS",
        position: [0.28, 0.24, -0.25],
        text: "Observa la concentración de soportes, conexiones y dispositivos alrededor del puesto. En una sede real cada equipo requiere compatibilidad, mantenimiento y revisión por personal competente.",
        question:
          "¿Qué conexiones y accesorios deberían documentarse en un inventario?",
        action: "Ver equipos de referencia",
        view: "equipos",
        note: "Modelo Charité: ChrisRE · CC BY-NC 4.0. Foco estructural orientativo, no localización técnica exacta ni inventario clínico verificado.",
      },
    ],
  };

  function attach({ container, model, camera, orbit, type }) {
    const points = CONTENT[type] || CONTENT.hospital;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const originalCamera = camera.position.clone();
    const originalTarget = orbit.controls.target.clone();
    const anchors = points.map((point) =>
      model.worldToLocal(
        new THREE.Vector3(
          center.x + size.x * point.position[0],
          center.y + size.y * point.position[1],
          center.z + size.z * point.position[2],
        ),
      ),
    );
    const layer = document.createElement("div");
    layer.className = `hotspot-layer hotspot-layer--${type}`;
    layer.innerHTML = points
      .map(
        (point, index) =>
          `<button type="button" class="scene-pin" data-scene-point="${index}" aria-expanded="false" aria-label="Punto ${index + 1}: ${esc(point.title)}"><span>${String(index + 1).padStart(2, "0")}</span><em>${esc(point.title)}</em></button>`,
      )
      .join("");
    container.append(layer);
    const story = document.createElement("section");
    story.className = "hotspot-story";
    story.hidden = true;
    story.setAttribute("aria-label", "Ficha educativa del modelo");
    story.setAttribute("aria-live", "polite");
    container.append(story);
    const chapters = document.createElement("div");
    chapters.className = "model-chapters";
    chapters.innerHTML = `<div class="model-chapters__head"><span class="overline">TOCA LOS PUNTOS · DESCUBRE LAS CONEXIONES</span><span class="model-chapters__count">${points.length} focos educativos</span></div><div class="model-chapters__list">${points.map((point, index) => `<button type="button" data-chapter="${index}" aria-pressed="false"><span>${String(index + 1).padStart(2, "0")}</span>${esc(point.title)}<b>↗</b></button>`).join("")}</div><p>Focos temáticos sobre el modelo. No son mediciones ni un inventario clínico verificado.</p>`;
    container.after(chapters);
    const pins = [...layer.querySelectorAll(".scene-pin")];
    let selected = -1,
      flight = null;
    const visited = new Set();
    const reduced = () =>
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      V.A11Y.movimiento;
    function close() {
      story.hidden = true;
      if (selected >= 0) pins[selected].focus({ preventScroll: true });
      selected = -1;
      pins.forEach((pin) => pin.setAttribute("aria-expanded", "false"));
      chapters
        .querySelectorAll("[data-chapter]")
        .forEach((button) => button.setAttribute("aria-pressed", "false"));
      flight = {
        position: originalCamera.clone(),
        target: originalTarget.clone(),
      };
    }
    function select(index, focus = true) {
      selected = (index + points.length) % points.length;
      const point = points[selected];
      visited.add(selected);
      orbit.setAutoRotate(false);
      container
        .querySelector(".viewer3d__tools [aria-pressed]")
        ?.setAttribute("aria-pressed", "false");
      pins.forEach((pin, i) => {
        pin.setAttribute("aria-expanded", String(i === selected));
        pin.classList.toggle("is-visited", visited.has(i));
      });
      chapters.querySelectorAll("[data-chapter]").forEach((button, i) => {
        button.setAttribute("aria-pressed", String(i === selected));
        button.classList.toggle("is-visited", visited.has(i));
      });
      const anchor = model.localToWorld(anchors[selected].clone());
      flight = {
        position: originalCamera
          .clone()
          .multiplyScalar(0.88)
          .add(anchor.clone().multiplyScalar(0.15)),
        target: anchor.clone().multiplyScalar(0.25),
      };
      story.innerHTML = `<div class="hotspot-story__top"><span>${String(selected + 1).padStart(2, "0")} / ${String(points.length).padStart(2, "0")} · EXPLORACIÓN GUIADA</span><button type="button" data-story-close aria-label="Cerrar ficha">×</button></div><p class="overline">${esc(point.tag)}</p><h3 tabindex="-1">${esc(point.title)}</h3><p class="hotspot-story__text">${esc(point.text)}</p><blockquote>${esc(point.question)}</blockquote><button class="hotspot-story__action" type="button" data-story-go>${esc(point.action)} <span>↗</span></button><p class="hotspot-story__note">${esc(point.note)}</p><div class="hotspot-story__nav"><button type="button" data-story-prev aria-label="Punto anterior">← Anterior</button><span>${visited.size} de ${points.length} explorados</span><button type="button" data-story-next aria-label="Punto siguiente">Siguiente →</button></div>`;
      story.hidden = false;
      story
        .querySelector("[data-story-close]")
        .addEventListener("click", close);
      story
        .querySelector("[data-story-prev]")
        .addEventListener("click", () => select(selected - 1));
      story
        .querySelector("[data-story-next]")
        .addEventListener("click", () => select(selected + 1));
      story.querySelector("[data-story-go]").addEventListener("click", () => {
        V.abrirVista(point.view, point.query ? { query: point.query } : {});
      });
      if (focus) story.querySelector("h3").focus({ preventScroll: true });
    }
    pins.forEach((pin, index) =>
      pin.addEventListener("click", () =>
        selected === index ? close() : select(index),
      ),
    );
    chapters
      .querySelectorAll("[data-chapter]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          select(Number(button.dataset.chapter)),
        ),
      );
    const keyHandler = (event) => {
      if (event.key === "Escape" && !story.hidden) {
        event.stopPropagation();
        close();
      }
    };
    container.addEventListener("keydown", keyHandler);
    orbit.controls.addEventListener("start", () => {
      flight = null;
    });
    return {
      select,
      close,
      update() {
        const moving = !!flight;
        if (flight) {
          camera.position.lerp(flight.position, reduced() ? 1 : 0.09);
          orbit.controls.target.lerp(flight.target, reduced() ? 1 : 0.09);
          camera.lookAt(orbit.controls.target);
          if (camera.position.distanceTo(flight.position) < 0.01) flight = null;
        }
        model.updateMatrixWorld(true);
        camera.updateMatrixWorld();
        pins.forEach((pin, index) => {
          const point = model
            .localToWorld(anchors[index].clone())
            .project(camera);
          pin.style.left = `${(point.x * 0.5 + 0.5) * 100}%`;
          pin.style.top = `${(-point.y * 0.5 + 0.5) * 100}%`;
          pin.hidden =
            point.z < -1 ||
            point.z > 1 ||
            Math.abs(point.x) > 0.96 ||
            Math.abs(point.y) > 0.9;
        });
        return moving;
      },
      dispose() {
        layer.remove();
        story.remove();
        chapters.remove();
        container.removeEventListener("keydown", keyHandler);
      },
    };
  }
  window.VitaraHotspots = { attach };
})();
