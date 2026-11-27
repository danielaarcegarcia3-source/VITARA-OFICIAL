/** VITARA · Dirección interactiva. Capas editoriales sin sustituir las vistas existentes. */
(function () {
  'use strict';
  const V = window.Vitara;
  if (!V) return;
  const $ = selector => document.querySelector(selector);
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || V.A11Y.movimiento;
  const home = $('#view-inicio .home');
  const journey = document.createElement('section'); journey.className = 'journey-studio';
  journey.setAttribute('aria-labelledby', 'journey-title');
  journey.innerHTML = `<div class="journey-studio__intro"><span class="section-number">01 — CONECTA A TU MANERA</span><h2 id="journey-title">No todos buscamos<br>lo mismo. <em>Empieza por ti.</em></h2><p>Elige lo que necesitas y encuentra una puerta de entrada a tu red de salud.</p></div><div class="journey-studio__body"><div class="journey-tabs" role="tablist" aria-label="Qué necesitas"><button type="button" role="tab" id="journey-tab-med" aria-selected="true" aria-controls="journey-panel" data-journey="med">Un medicamento <span>↗</span></button><button type="button" role="tab" id="journey-tab-care" aria-selected="false" aria-controls="journey-panel" data-journey="care" tabindex="-1">Orientación humana <span>↗</span></button><button type="button" role="tab" id="journey-tab-map" aria-selected="false" aria-controls="journey-panel" data-journey="map" tabindex="-1">Mi territorio <span>↗</span></button></div><div id="journey-panel" role="tabpanel" aria-labelledby="journey-tab-med"></div></div>`;
  home.querySelector('.section-kicker').before(journey);
  const journeys = {
    med: { eyebrow: 'MENOS INCERTIDUMBRE, MÁS INFORMACIÓN', title: 'Antes de salir,<br>conoce tus opciones.', text: 'Busca por nombre y revisa la disponibilidad registrada. Si falta confirmación, puedes solicitarla a la sede.', image: './pastillasbotedeco.png', alt: 'Ilustración original de medicamentos', button: 'Buscar un medicamento', view: 'buscar', theme: 'yellow' },
    care: { eyebrow: 'A VECES, EL PRIMER PASO ES CONVERSAR', title: 'No tienes que<br>resolverlo a solas.', text: 'Encuentra canales oficiales de orientación y telesalud. La información acompaña; no reemplaza una evaluación profesional.', image: './manomedicadeco.png', alt: 'Ilustración original de asistencia médica', button: 'Encontrar orientación', view: 'canales', theme: 'coral' },
    map: { eyebrow: 'EL CUIDADO TAMBIÉN TIENE UN TERRITORIO', title: 'Tu región.<br>Tu red de atención.', text: 'Explora las vistas del Perú y La Libertad, filtra el directorio local y consulta los datos registrados de cada establecimiento.', image: './MAPADELALIBERTAD3D.png', alt: 'Ilustración territorial de La Libertad', button: 'Explorar mi región', view: 'mapas', theme: 'aqua' }
  };
  function selectJourney(key, focus = false) {
    const item = journeys[key];
    journey.dataset.theme = item.theme;
    journey.querySelectorAll('[data-journey]').forEach(button => {
      const selected = button.dataset.journey === key;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    const panel = $('#journey-panel'); panel.setAttribute('aria-labelledby', `journey-tab-${key}`);
    panel.innerHTML = `<div class="journey-copy"><span class="overline">${item.eyebrow}</span><h3>${item.title}</h3><p>${item.text}</p><button class="journey-cta" type="button" data-go="${item.view}">${item.button} <span>↗</span></button></div><div class="journey-art"><span class="journey-art__line" aria-hidden="true"></span><img src="${item.image}" alt="${item.alt}" loading="lazy"><span class="journey-art__caption">INFORMACIÓN PARA CUIDARTE</span></div>`;
    if (!reduced()) panel.animate([{ opacity: .35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
  }
  journey.querySelectorAll('[data-journey]').forEach(button => {
    button.addEventListener('click', () => selectJourney(button.dataset.journey));
    button.addEventListener('keydown', event => {
      const keys = Object.keys(journeys); const index = keys.indexOf(button.dataset.journey);
      if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length;
        selectJourney(keys[next], true);
      }
    });
  });
  selectJourney('med');

  const lab = document.createElement('section'); lab.className = 'clinical-index';
  lab.setAttribute('aria-labelledby', 'clinical-title');
  lab.innerHTML = `<div class="clinical-index__head"><div><span class="section-number">02 — APRENDE EXPLORANDO</span><h2 id="clinical-title">Mira más cerca.<br><em>Comprende mejor.</em></h2></div><p>Espacios reales del inventario, preguntas que conectan y puntos para descubrir. Sin sustituir una consulta ni verificar una sede.</p><span class="clinical-index__seal" aria-hidden="true">3D<br><small>INTERACTIVO</small></span></div>
  <div class="clinical-shelves">
    <button class="clinical-chapter" type="button" data-open-scene="hospital"><span class="clinical-chapter__num">01 / EXTERIOR</span><span class="clinical-preview clinical-preview--hospital"><img src="./assets/previews/hospital.png" alt="Vista del modelo hospitalario original" loading="lazy"></span><span class="clinical-chapter__title">Arquitectura<br>que cuida.</span><span class="clinical-chapter__desc">Accesos, territorio y verificación.</span><span class="clinical-chapter__arrow">↗</span></button>
    <button class="clinical-chapter" type="button" data-open-scene="or"><span class="clinical-chapter__num">02 / QUIRÓFANO</span><span class="clinical-preview clinical-preview--or"><img src="./assets/previews/quirofano.png" alt="Vista del modelo original de sala de operaciones" loading="lazy"></span><span class="clinical-chapter__title">La tecnología<br>también cuida.</span><span class="clinical-chapter__desc">Equipos, seguridad y recursos.</span><span class="clinical-chapter__arrow">↗</span></button>
    <button class="clinical-chapter" type="button" data-open-scene="vr"><span class="clinical-chapter__num">03 / CHARITÉ</span><span class="clinical-preview clinical-preview--vr"><img src="./assets/previews/charite.png" alt="Vista del quirófano original Charité" loading="lazy"></span><span class="clinical-chapter__title">Un espacio.<br>Muchas conexiones.</span><span class="clinical-chapter__desc">Recorrido educativo no comercial.</span><span class="clinical-chapter__arrow">↗</span></button>
  </div><p class="clinical-index__note">Toca un espacio para abrir su visor. Los modelos grandes se descargan solo cuando eliges cargarlos.</p><p class="clinical-credits">Modelos y capturas: <a href="https://sketchfab.com/3d-models/low-poly-hospital-738972de7752491382457c068ab0a6ac" target="_blank" rel="noopener noreferrer">AlessioPassera · CC BY 4.0</a> / <a href="https://sketchfab.com/3d-models/hospital-operating-room-a27400a73f4a43fbb1dda30031cb91c2" target="_blank" rel="noopener noreferrer">Chenchanchong · CC BY 4.0</a> / <a href="https://sketchfab.com/3d-models/charite-university-hospital-operating-room-9ec46c4d615a4581a235eebfb162f574" target="_blank" rel="noopener noreferrer">ChrisRE · CC BY-NC 4.0 · no comercial</a>.</p>`;
  home.querySelector('.home-editorial').before(lab);

  function openScene(id) {
    V.abrirVista(id === 'or' ? 'equipos' : 'planos');
    const viewer = $(`#viewer-${id}`);
    requestAnimationFrame(() => viewer.scrollIntoView({ block: 'center', behavior: reduced() ? 'instant' : 'smooth' }));
    viewer.classList.add('scene-spotlight');
    setTimeout(() => viewer.classList.remove('scene-spotlight'), 1800);
  }
  document.querySelectorAll('[data-open-scene]').forEach(button => button.addEventListener('click', () => openScene(button.dataset.openScene)));

  const sceneNavigation = document.createElement('nav'); sceneNavigation.className = 'scene-navigation';
  sceneNavigation.setAttribute('aria-label', 'Elegir un espacio 3D');
  sceneNavigation.innerHTML = `<span class="overline">ELIGE TU PRÓXIMA CONEXIÓN</span><button type="button" data-scene-nav="hospital"><b>01</b> Hospital exterior <span>↗</span></button><button type="button" data-scene-nav="or"><b>02</b> Sala de operaciones <span>↗</span></button><button type="button" data-scene-nav="vr"><b>03</b> Quirófano Charité <span>↗</span></button>`;
  $('#view-planos .view-head').after(sceneNavigation);
  sceneNavigation.querySelectorAll('[data-scene-nav]').forEach(button => button.addEventListener('click', () => openScene(button.dataset.sceneNav)));

  // The video is decorative. Playback is visible, controllable, and respects reduced motion.
  const accessVideo = $('#access-video');
  const videoButton = document.createElement('button'); videoButton.type = 'button'; videoButton.className = 'access-motion-toggle';
  videoButton.setAttribute('aria-label', 'Pausar video de fondo'); videoButton.textContent = 'Ⅱ Pausar ambiente';
  videoButton.addEventListener('click', () => { if (accessVideo.paused) { accessVideo.dataset.userPaused = 'false'; if (!accessVideo.getAttribute('src') && accessVideo.dataset.source) accessVideo.src = accessVideo.dataset.source; accessVideo.play().catch(() => {}); } else { accessVideo.dataset.userPaused = 'true'; accessVideo.pause(); } });
  accessVideo.addEventListener('play', () => { videoButton.textContent = 'Ⅱ Pausar ambiente'; videoButton.setAttribute('aria-label', 'Pausar video de fondo'); });
  accessVideo.addEventListener('pause', () => { videoButton.textContent = '▷ Activar ambiente'; videoButton.setAttribute('aria-label', 'Reproducir video de fondo'); });
  $('#access').append(videoButton);
  const replay = document.createElement('button'); replay.type = 'button'; replay.className = 'welcome-replay'; replay.textContent = '↺ Volver a la bienvenida';
  replay.addEventListener('click', () => window.dispatchEvent(new Event('vitara:welcome-replay')));
  $('#login-card').append(replay);

  // Subtle section reveals; never hide content from keyboard users or reduced-motion readers.
  const viewport = $('#viewport');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting && !reduced()) { entry.target.classList.add('reveal-section'); observer.unobserve(entry.target); }
  }), { root: viewport, threshold: .08 });
  [journey, lab, home.querySelector('.home-editorial'), ...document.querySelectorAll('.resource-story, .supplies-banner')].forEach(element => observer.observe(element));

  function enhanceEquipment() {
    const grid = $('#equip-grid');
    if (!grid) return;
    if (!grid.dataset.layout) {
      grid.dataset.layout = 'index';
      const display = document.createElement('div'); display.className = 'equipment-display';
      display.innerHTML = '<div><span class="section-number">DEL MODELO A LA EVIDENCIA</span><h3>Explora el equipamiento.</h3></div><div role="group" aria-label="Presentación del catálogo"><button type="button" data-equipment-layout="index" aria-pressed="true">Índice</button><button type="button" data-equipment-layout="mosaic" aria-pressed="false">Fichas</button></div>';
      grid.before(display);
      display.querySelectorAll('[data-equipment-layout]').forEach(button => button.addEventListener('click', () => {
        grid.dataset.layout = button.dataset.equipmentLayout;
        display.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      }));
    }
    grid.querySelectorAll('.equip').forEach((card, index) => {
      if (card.dataset.chapter) return;
      card.dataset.chapter = String(index + 1).padStart(2, '0');
      const paragraphs = [...card.querySelectorAll(':scope > p')].slice(1);
      const details = document.createElement('details'); details.className = 'equipment-disclosure';
      const summary = document.createElement('summary'); summary.textContent = 'Evidencia y mantenimiento'; details.append(summary);
      paragraphs.forEach(paragraph => details.append(paragraph));
      card.querySelector(':scope > button').before(details);
    });
  }
  V.onView('equipos', enhanceEquipment);
  if (V.state.active === 'equipos') enhanceEquipment();

  const dnaPanel = $('#dna-panel');
  new MutationObserver(() => {
    if (dnaPanel.hidden || dnaPanel.querySelector('.dna-story-nav')) return;
    const targets = [...document.querySelectorAll('.dna-target')];
    const current = targets.findIndex(button => button.getAttribute('aria-pressed') === 'true');
    if (current < 0) return;
    const nav = document.createElement('div'); nav.className = 'dna-story-nav';
    nav.innerHTML = `<button type="button" data-dna-prev>← Anterior</button><span>${String(current + 1).padStart(2, '0')} / ${String(targets.length).padStart(2, '0')}</span><button type="button" data-dna-next>Siguiente →</button>`;
    nav.querySelector('[data-dna-prev]').addEventListener('click', () => targets[(current - 1 + targets.length) % targets.length].click());
    nav.querySelector('[data-dna-next]').addEventListener('click', () => targets[(current + 1) % targets.length].click());
    dnaPanel.append(nav);
  }).observe(dnaPanel, { childList: true, attributes: true, attributeFilter: ['hidden'] });
})();
