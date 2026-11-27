/** Capa aditiva de experiencia. No sustituye navegación, datos ni formularios. */
(function () {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const V = window.Vitara;
  if (!V) return;
  const access = $('#access'), app = $('#app'), form = $('#access-form');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let splashTimer;
  const accessVideo = $('#access-video');
  function syncAccessVideo() {
    const shouldPlay = $('#splash').hidden && !access.hidden && !document.hidden && !reduced.matches && !V.A11Y.movimiento && accessVideo.dataset.userPaused !== 'true';
    if (shouldPlay && accessVideo.dataset.source) {
      if (!accessVideo.getAttribute('src')) accessVideo.src = accessVideo.dataset.source;
      accessVideo.autoplay = true;
      accessVideo.play().catch(() => {});
    } else { accessVideo.autoplay = false; accessVideo.pause(); }
  }
  function welcome() {
    $('#splash').hidden = true;
    $('#login-card').hidden = false;
    clearTimeout(splashTimer);
    const profile = V.store.get('g3.perfil', {});
    $('#access-name').value = profile?.nombre || '';
    $('#access-email').value = profile?.email || '';
    $('#access-district').value = profile?.distrito || '';
    $('#access-sync').checked = !!V.store.get('vitara.participant.token', '');
    $('#access-email').required = $('#access-sync').checked;
    $('#access-role').value = profile?.rol && ['CIU', 'POSTA', 'AGC'].includes(profile.rol) ? profile.rol : 'CIU';
    $('#access-name').focus({ preventScroll: true });
    syncAccessVideo();
  }
  function refreshName() {
    const profile = V.store.get('g3.perfil', {});
    const title = $('#welcome-name');
    title.replaceChildren(document.createTextNode(`Bienvenido${profile?.nombre ? ', ' + profile.nombre : ' a VITARA'}`));
    const star = document.createElement('span'); star.textContent = ' ✳'; title.append(star);
  }
  function enter() {
    access.hidden = true;
    app.inert = false;
    document.body.classList.remove('access-locked');
    $('#access-video').pause();
    refreshName();
    window.dispatchEvent(new Event('vitara:session'));
    window.dispatchEvent(new Event('resize'));
    $('#viewport').focus({ preventScroll: true });
  }
  $('#splash-skip').addEventListener('click', welcome);
  splashTimer = setTimeout(welcome, reduced.matches ? 250 : 9000);
  window.addEventListener('vitara:welcome-replay', () => {
    clearTimeout(splashTimer); $('#login-card').hidden = true; $('#splash').hidden = false;
    $('#splash-skip').focus({ preventScroll: true });
    splashTimer = setTimeout(welcome, reduced.matches ? 500 : 9000);
  });
  $('#access-sync').addEventListener('change', () => { $('#access-email').required = $('#access-sync').checked; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const input = $('#access-name');
    const name = input.value.trim().replace(/\s+/g, ' ');
    input.setCustomValidity(name.length < 2 ? 'Escribe al menos dos caracteres, no solo espacios.' : /^\d{8}$/.test(name) ? 'Usa un nombre de usuario, no un DNI.' : '');
    if (!form.reportValidity()) return;
    const profile = { nombre: name, email: $('#access-email').value.trim(), distrito: $('#access-district').value.trim(), rol: $('#access-role').value };
    const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
    $('#access-status').textContent = '';
    try {
      if ($('#access-sync').checked) await window.VitaraParticipation.register(profile);
      else { V.store.del('vitara.participant.token'); V.store.set('vitara.participant.active', false); }
      V.store.set('g3.perfil', { ...V.store.get('g3.perfil', {}), ...profile });
      enter();
    } catch (error) { $('#access-status').textContent = error.message + ' También puedes desmarcar la sincronización y entrar sin enviarlos.'; }
    finally { submit.disabled = false; }
  });
  $('#access-name').addEventListener('input', event => event.target.setCustomValidity(''));
  window.addEventListener('vitara:logout', () => {
    const profile = V.store.get('g3.perfil', {}) || {};
    delete profile.nombre;
    V.store.set('g3.perfil', profile);
    app.inert = true;
    access.hidden = false;
    document.body.classList.add('access-locked');
    $('#ambient-audio')?.pause();
    document.querySelectorAll('.popover').forEach(el => el.remove());
    welcome();
  });

  // All available standalone illustrations have a functional destination.
  const resources = document.createElement('section');
  resources.className = 'resource-stories';
  resources.setAttribute('aria-label', 'Rutas de bienestar');
  resources.innerHTML = `<article class="resource-story resource-story--mint"><div><span class="overline">ORIENTACIÓN Y CUIDADO</span><h3>Un primer paso,<br>con acompañamiento.</h3><p>Canales oficiales para orientarte. No realizamos diagnósticos automatizados.</p><button type="button" class="btn btn--ghost" data-go="canales">Recibir orientación ↗</button></div><img src="./manomedicadeco.png" alt="Ilustración de asistencia médica" loading="lazy"></article>
    <article class="resource-story resource-story--lavender"><div><span class="overline">FARMACIA CONECTADA</span><h3>Tu tratamiento,<br>mejor informado.</h3><p>Busca medicamentos y consulta su disponibilidad registrada.</p><button type="button" class="btn btn--ghost" data-go="buscar" data-query="paracetamol">Explorar medicamentos ↗</button></div><div class="pharmacy-art"><img src="./pastillasbotedeco.png" alt="Frasco de medicamentos" loading="lazy"><img src="./pastillasdeco.png" alt="Presentación de tabletas" loading="lazy"><img src="./pastillasdeco2.png" alt="Ilustración de cápsulas" loading="lazy"></div></article>`;
  $('#view-buscar .search-hero').after(resources);
  const supplies = document.createElement('article');
  supplies.className = 'supplies-banner';
  supplies.innerHTML = `<img src="./suerodeco.png" alt="Ilustración de insumos hospitalarios" loading="lazy"><div><p class="overline">RECURSOS QUE CUIDAN</p><h3>La atención empieza con lo esencial.</h3><p>Consulta insumos y kits de emergencia. Si falta verificación, solicita confirmación a la sede.</p><button type="button" class="btn btn--primary" data-go="buscar" data-query="suero">Consultar insumos ↗</button></div>`;
  $('#view-equipos .view-head').after(supplies);

  function ambientVideo(src, parent, className) {
    const video = document.createElement('video');
    video.className = className; video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true;
    video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1; video.preload = 'none';
    let visible = false;
    const sync = () => {
      if (visible && !reduced.matches && !V.A11Y.movimiento && !document.hidden && !document.body.classList.contains('access-locked')) {
        if (!video.getAttribute('src')) video.src = src;
        video.autoplay = true;
        video.play().catch(() => {});
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    parent.prepend(video); observer.observe(video);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-movimiento'] });
    window.addEventListener('vitara:session', sync);
    return video;
  }
  ambientVideo('./videobannerBUSCADOR.mp4', $('#view-buscar .search-hero'), 'search-ambient');
  const campaign = document.createElement('article'); campaign.className = 'campaign-banner';
  campaign.innerHTML = `<div><span class="overline">CONECTAR TAMBIÉN ES CUIDAR</span><h2>El bienestar se construye<br>en comunidad.</h2><p>Encuentra orientación y canales de telesalud oficiales.</p><button class="btn btn--primary" type="button" data-go="canales">Conocer los canales ↗</button></div><img src="./GIF%20BANNER.gif" alt="Animación de salud del proyecto VITARA" loading="lazy">`;
  $('#view-comunidad .view-head').after(campaign);
  ambientVideo('./videoparabanner.mp4', campaign, 'campaign-ambient');

  const player = document.createElement('div'); player.className = 'ambient-player';
  player.innerHTML = `<audio id="ambient-audio" preload="none" loop src="./MUSICADEFONDO.mp4"></audio><button type="button" id="ambient-toggle" aria-label="Reproducir audio ambiental" aria-pressed="false"><svg class="i"><use href="#i-pulse"/></svg><span>Tu pausa sonora</span><b aria-hidden="true">▶</b></button><label class="sr-only" for="ambient-volume">Volumen ambiental</label><input id="ambient-volume" type="range" min="0" max="1" step="0.05" value="0.25"><div class="audio-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`;
  document.body.append(player);
  const audio = $('#ambient-audio'), toggle = $('#ambient-toggle'); audio.volume = 0.25;
  function playerState() {
    toggle.setAttribute('aria-pressed', String(!audio.paused));
    toggle.setAttribute('aria-label', audio.paused ? 'Reproducir audio ambiental' : 'Pausar audio ambiental');
    toggle.querySelector('b').textContent = audio.paused ? '▶' : 'Ⅱ';
    player.classList.toggle('is-playing', !audio.paused);
  }
  toggle.addEventListener('click', async () => {
    if (!audio.paused) audio.pause();
    else { try { await audio.play(); } catch { V.toast('No se pudo reproducir la pista ambiental. Intenta nuevamente.', 'warn'); } }
  });
  $('#ambient-volume').addEventListener('input', event => { audio.volume = Number(event.target.value); });
  audio.addEventListener('play', playerState); audio.addEventListener('pause', playerState);
  audio.addEventListener('error', () => { V.toast('El audio no está disponible o su formato no es compatible.', 'warn'); playerState(); });

  fetch('./assets-manifest.json', { cache: 'no-cache' }).then(response => response.json()).then(manifest => {
    // Original video uploaded in commit 49dbae0; no substituted media.
    if (!manifest.media.loginVideo) return;
    const video = $('#access-video'); video.dataset.source = manifest.media.loginVideo; video.hidden = false;
    syncAccessVideo();
    document.addEventListener('visibilitychange', syncAccessVideo);
    reduced.addEventListener('change', syncAccessVideo);
    new MutationObserver(syncAccessVideo).observe(document.documentElement, { attributes: true, attributeFilter: ['data-movimiento'] });
    video.addEventListener('error', () => { video.hidden = true; });
  }).catch(() => {});
  refreshName();
})();
