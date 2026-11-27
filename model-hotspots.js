/** Puntos educativos sobre modelos reales: proyección 3D, capítulos y fichas tipo Genially. */
(function () {
  'use strict';
  const V = window.Vitara;
  if (!V) return;
  const { esc } = V;
  const CONTENT = {
    hospital: [
      { title: 'Acceso y circulación', tag: 'ARQUITECTURA QUE CUIDA', position: [-.30, -.12, .32], text: 'Un acceso comprensible y una circulación despejada favorecen la orientación de las personas. Observa cómo se relacionan los volúmenes y entradas de este modelo arquitectónico.', question: '¿Qué recorrido seguirías al llegar por primera vez?', action: 'Explorar el territorio', view: 'mapas', note: 'El modelo es ilustrativo: no acredita accesibilidad ni capacidad instalada de una IPRESS.' },
      { title: 'Una red, no un edificio aislado', tag: 'TERRITORIO Y ATENCIÓN', position: [.30, .08, .12], text: 'La atención conecta establecimientos de distintos niveles. El directorio territorial te permite consultar la información que existe en la base local antes de desplazarte.', question: '¿Ya identificaste tu establecimiento de referencia?', action: 'Ver establecimientos', view: 'mapas', note: 'Consulta el horario y confirma directamente con la sede. El modelo no representa un hospital peruano verificado.' },
      { title: 'Verificar antes de salir', tag: 'INFORMACIÓN CON PROPÓSITO', position: [-.05, .25, -.22], text: 'Un edificio visible no garantiza que un medicamento o equipo esté disponible. VITARA diferencia los datos registrados de la confirmación que puede emitir cada sede.', question: '¿Necesitas confirmar un recurso?', action: 'Solicitar verificación', view: 'solicitudes', note: 'La información publicada es de referencia y puede cambiar.' }
    ],
    or: [
      { title: 'Seguridad del paciente', tag: 'ANTES DE UN PROCEDIMIENTO', position: [-.23, -.05, .15], text: 'La identificación correcta, la comunicación del equipo y la verificación del procedimiento son principios de seguridad. Este punto invita a explorar el entorno, no a ejecutar una intervención.', question: 'El cuidado también depende de cómo se comunica el equipo.', action: 'Canales de orientación', view: 'canales', note: 'Contenido educativo general. No es un protocolo quirúrgico ni identifica el estado real de los equipos representados.' },
      { title: 'Equipos y monitorización', tag: 'TECNOLOGÍA AL SERVICIO DEL CUIDADO', position: [.22, .04, -.15], text: 'La presencia de un equipo en una representación 3D no demuestra que esté calibrado u operativo. Explora las fichas de equipamiento y sus fuentes documentales para conocer esas diferencias.', question: 'Disponible, operativo y verificado no significan lo mismo.', action: 'Explorar el equipamiento', view: 'equipos', note: 'Los puntos son focos temáticos del entorno, no un inventario técnico certificado de este quirófano.' },
      { title: 'Insumos esenciales', tag: 'LO ESENCIAL TAMBIÉN CONECTA', position: [.02, -.16, .30], text: 'Los insumos forman parte de una cadena de abastecimiento y verificación. Usa el buscador para revisar los recursos incluidos en la base, con su fuente y fecha.', question: '¿Qué recurso quieres consultar?', action: 'Buscar un insumo', view: 'buscar', query: 'suero', note: 'La disponibilidad de la base no es una garantía de atención ni sustituye la confirmación de la sede.' }
    ],
    vr: [
      { title: 'Explora un entorno real', tag: 'CHARITÉ · OBSERVAR PARA COMPRENDER', position: [-.22, -.08, .20], text: 'Estás observando el archivo original «Charité University Hospital – Operating Room». Gira, acerca y examina el espacio. Su autor es ChrisRE y su licencia permite uso educativo no comercial con atribución.', question: 'Recorrer un espacio también puede ser una forma de aprender.', action: 'Conocer las fuentes', view: 'fuentes', note: 'Es un quirófano, no una habitación de hospitalización ni una IPRESS del Perú.' },
      { title: 'Cuidado coordinado', tag: 'EL VALOR DEL TRABAJO EN EQUIPO', position: [.20, .02, -.20], text: 'La atención requiere coordinación entre personas, tecnología y recursos. Los puntos de este recorrido aportan contexto educativo sin interpretar información clínica de pacientes.', question: 'La tecnología tiene sentido cuando acompaña a las personas.', action: 'Comunidad y bienestar', view: 'comunidad', note: 'No se infiere capacidad, seguridad ni disponibilidad real a partir de este modelo.' },
      { title: 'De la observación a la información', tag: 'CONEXIONES QUE SÍ PUEDES CONSULTAR', position: [.08, .23, .20], text: 'Después de explorar, puedes revisar el catálogo local de equipos, identificar fuentes y pedir una verificación. Así diferenciamos una representación visual de un dato confirmado.', question: '¿Quieres conocer el recurso más allá de su imagen?', action: 'Ver fichas de equipos', view: 'equipos', note: 'Modelo: ChrisRE · Sketchfab · CC BY-NC 4.0. No destinado a usos comerciales sin autorización.' }
    ]
  };

  // Ampliación educativa: anclajes temáticos, no localización técnica certificada.
  CONTENT.hospital.push(
    { title:'Orientación accesible', tag:'UN RECORRIDO PARA TODAS LAS PERSONAS', position:[-.32,.12,-.13], text:'La señalización comprensible, el contraste y las rutas accesibles ayudan a orientarse. Este edificio permite conversar sobre esas necesidades, pero su geometría no constituye una evaluación de accesibilidad.', question:'¿La información puede comprenderse sin conocer el edificio?', action:'Ajustar accesibilidad', view:'comunidad', note:'Consulta las condiciones reales de accesibilidad con el establecimiento.' },
    { title:'Preparar una consulta', tag:'PERSONAS ANTES QUE TRÁMITES', position:[.12,-.08,.35], text:'Antes de desplazarte, revisa el canal oficial y confirma condiciones de atención. Si hay una emergencia, no retrases la atención para reunir documentos ni para usar esta plataforma.', question:'¿Necesitas orientación para elegir un canal?', action:'Explorar canales de ayuda', view:'canales', note:'VITARA no agenda ni garantiza una atención o una ambulancia.' },
    { title:'Información y privacidad', tag:'CUIDAR TAMBIÉN ES PROTEGER', position:[.30,.23,-.15], text:'Un recurso digital de salud debe explicar qué datos recoge. En VITARA puedes explorar sin sincronizar tu perfil; los mensajes del chat no se almacenan como un historial en el servidor.', question:'¿Sabes distinguir los datos locales de los sincronizados?', action:'Revisar privacidad y fuentes', view:'fuentes', note:'No introduzcas DNI, historias clínicas ni información sensible en formularios de orientación.' }
  );
  CONTENT.or.push(
    { title:'Dispositivos y consumibles', tag:'MÁS ALLÁ DE UNA IMAGEN', position:[-.30,.23,-.23], text:'Un monitor, una bomba y un ecógrafo cumplen propósitos diferentes. En el estudio de dispositivos puedes explorar ejemplos genéricos, sus consumibles y preguntas para consultar a un fabricante.', question:'¿Qué conviene preguntar antes de elegir un dispositivo?', action:'Abrir dispositivos y proveedores', view:'tecnologia', note:'Las fichas no identifican marcas o modelos dentro de este quirófano ni acreditan registro sanitario.' },
    { title:'Mantenimiento documentado', tag:'DISPONIBLE NO SIGNIFICA OPERATIVO', position:[.32,-.14,.20], text:'La revisión de ingeniería clínica incluye documentación, mantenimiento y pruebas aplicables a cada equipo. El modelo 3D no permite comprobar calibración, funcionamiento ni seguridad eléctrica.', question:'¿Existe evidencia del estado técnico del equipo?', action:'Explorar el inventario', view:'equipos', note:'No es una guía de mantenimiento. Sigue las instrucciones del fabricante y del personal competente.' },
    { title:'Trazabilidad del entorno', tag:'UNA REPRESENTACIÓN CON LÍMITES', position:[.04,.30,.02], text:'Los puntos de este entorno son educativos. Una imagen puede apoyar una conversación, pero no reemplaza un inventario verificado, un protocolo clínico ni una evaluación presencial.', question:'¿Qué puedes concluir realmente al mirar un modelo?', action:'Abrir laboratorio de transparencia', view:'fuentes', note:'Se conserva el GLB original; estos puntos no certifican distribución física, capacidad ni condiciones asistenciales.' }
  );
  CONTENT.vr.push(
    { title:'Tecnología y compatibilidad', tag:'UNA CADENA DE RECURSOS', position:[-.31,.25,-.15], text:'El funcionamiento de un equipo también depende de accesorios, consumibles y soporte. Explora la galería educativa para conocer las preguntas básicas, sin asumir que una ilustración corresponde a este modelo.', question:'¿Quién confirma los accesorios y el soporte local?', action:'Conocer dispositivos y proveedores', view:'tecnologia', note:'No se identifican modelos comerciales a partir de la geometría de Charité.' },
    { title:'Del dato a la confirmación', tag:'CONSULTAR NO ES RESERVAR', position:[.32,-.12,.25], text:'Los datos de referencia no son disponibilidad en tiempo real. La sección Solicitudes permite pedir una confirmación a la sede y consultar su respuesta mediante un código privado.', question:'¿Necesitas una verificación de la información?', action:'Abrir solicitudes', view:'solicitudes', note:'Este modelo extranjero no representa una sede peruana ni demuestra existencias locales.' },
    { title:'Autoría y uso responsable', tag:'EL ORIGEN FORMA PARTE DEL MODELO', position:[.28,.24,-.25], text:'El modelo original es de ChrisRE y representa un quirófano de Charité. Su licencia CC BY-NC 4.0 exige atribución y restringe usos comerciales. Los puntos y textos de VITARA son una capa educativa adicional.', question:'¿Tu publicación respeta la licencia de sus activos?', action:'Consultar fuentes y límites', view:'fuentes', note:'No publicar comercialmente este activo sin revisar la autorización correspondiente.' }
  );

  function attach({ container, model, camera, orbit, type }) {
    const points = CONTENT[type] || CONTENT.hospital;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const originalCamera = camera.position.clone();
    const originalTarget = orbit.controls.target.clone();
    const anchors = points.map(point => model.worldToLocal(new THREE.Vector3(center.x + size.x * point.position[0], center.y + size.y * point.position[1], center.z + size.z * point.position[2])));
    const layer = document.createElement('div'); layer.className = `hotspot-layer hotspot-layer--${type}`;
    layer.innerHTML = points.map((point, index) => `<button type="button" class="scene-pin" data-scene-point="${index}" aria-expanded="false" aria-label="Punto ${index + 1}: ${esc(point.title)}"><span>${String(index + 1).padStart(2, '0')}</span><em>${esc(point.title)}</em></button>`).join('');
    container.append(layer);
    const story = document.createElement('section'); story.className = 'hotspot-story'; story.hidden = true;
    story.setAttribute('aria-label', 'Ficha educativa del modelo'); story.setAttribute('aria-live', 'polite');
    container.append(story);
    const chapters = document.createElement('div'); chapters.className = 'model-chapters';
    chapters.innerHTML = `<div class="model-chapters__head"><span class="overline">TOCA LOS PUNTOS · DESCUBRE LAS CONEXIONES</span><span class="model-chapters__count">${points.length} focos educativos</span></div><div class="model-chapters__list">${points.map((point, index) => `<button type="button" data-chapter="${index}" aria-pressed="false"><span>${String(index + 1).padStart(2, '0')}</span>${esc(point.title)}<b>↗</b></button>`).join('')}</div><p>Focos temáticos sobre el modelo. No son mediciones ni un inventario clínico verificado.</p>`;
    container.after(chapters);
    const pins = [...layer.querySelectorAll('.scene-pin')];
    let selected = -1, flight = null;
    const visited = new Set();
    const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || V.A11Y.movimiento;
    function close() {
      story.hidden = true;
      if (selected >= 0) pins[selected].focus({ preventScroll: true });
      selected = -1;
      pins.forEach(pin => pin.setAttribute('aria-expanded', 'false'));
      chapters.querySelectorAll('[data-chapter]').forEach(button => button.setAttribute('aria-pressed', 'false'));
      flight = { position: originalCamera.clone(), target: originalTarget.clone() };
    }
    function select(index, focus = true) {
      selected = (index + points.length) % points.length;
      const point = points[selected]; visited.add(selected);
      orbit.setAutoRotate(false);
      container.querySelector('.viewer3d__tools [aria-pressed]')?.setAttribute('aria-pressed', 'false');
      pins.forEach((pin, i) => { pin.setAttribute('aria-expanded', String(i === selected)); pin.classList.toggle('is-visited', visited.has(i)); });
      chapters.querySelectorAll('[data-chapter]').forEach((button, i) => { button.setAttribute('aria-pressed', String(i === selected)); button.classList.toggle('is-visited', visited.has(i)); });
      const anchor = model.localToWorld(anchors[selected].clone());
      flight = { position: originalCamera.clone().multiplyScalar(.88).add(anchor.clone().multiplyScalar(.15)), target: anchor.clone().multiplyScalar(.25) };
      story.innerHTML = `<div class="hotspot-story__top"><span>${String(selected + 1).padStart(2, '0')} / ${String(points.length).padStart(2, '0')} · EXPLORACIÓN GUIADA</span><button type="button" data-story-close aria-label="Cerrar ficha">×</button></div><p class="overline">${esc(point.tag)}</p><h3 tabindex="-1">${esc(point.title)}</h3><p class="hotspot-story__text">${esc(point.text)}</p><blockquote>${esc(point.question)}</blockquote><button class="hotspot-story__action" type="button" data-story-go>${esc(point.action)} <span>↗</span></button><p class="hotspot-story__note">${esc(point.note)}</p><div class="hotspot-story__nav"><button type="button" data-story-prev aria-label="Punto anterior">← Anterior</button><span>${visited.size} de ${points.length} explorados</span><button type="button" data-story-next aria-label="Punto siguiente">Siguiente →</button></div>`;
      story.hidden = false;
      story.querySelector('[data-story-close]').addEventListener('click', close);
      story.querySelector('[data-story-prev]').addEventListener('click', () => select(selected - 1));
      story.querySelector('[data-story-next]').addEventListener('click', () => select(selected + 1));
      story.querySelector('[data-story-go]').addEventListener('click', () => { V.abrirVista(point.view, point.query ? { query: point.query } : {}); });
      if (focus) story.querySelector('h3').focus({ preventScroll: true });
    }
    pins.forEach((pin, index) => pin.addEventListener('click', () => selected === index ? close() : select(index)));
    chapters.querySelectorAll('[data-chapter]').forEach(button => button.addEventListener('click', () => select(Number(button.dataset.chapter))));
    const keyHandler = event => { if (event.key === 'Escape' && !story.hidden) { event.stopPropagation(); close(); } };
    container.addEventListener('keydown', keyHandler);
    orbit.controls.addEventListener('start', () => { flight = null; });
    return {
      select, close,
      update() {
        const moving = !!flight;
        if (flight) {
          camera.position.lerp(flight.position, reduced() ? 1 : .09);
          orbit.controls.target.lerp(flight.target, reduced() ? 1 : .09);
          camera.lookAt(orbit.controls.target);
          if (camera.position.distanceTo(flight.position) < .01) flight = null;
        }
        model.updateMatrixWorld(true); camera.updateMatrixWorld();
        pins.forEach((pin, index) => {
          const point = model.localToWorld(anchors[index].clone()).project(camera);
          pin.style.left = `${(point.x * .5 + .5) * 100}%`;
          pin.style.top = `${(-point.y * .5 + .5) * 100}%`;
          pin.hidden = point.z < -1 || point.z > 1 || Math.abs(point.x) > .96 || Math.abs(point.y) > .9;
        });
        return moving;
      },
      dispose() { layer.remove(); story.remove(); chapters.remove(); container.removeEventListener('keydown', keyHandler); }
    };
  }
  window.VitaraHotspots = { attach };
})();
