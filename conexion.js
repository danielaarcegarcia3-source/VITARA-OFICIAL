/** Conexión: perfil consentido, temas, orientación y ensamblaje del logo original. */
(function () {
  'use strict';
  const V = window.Vitara;
  if (!V) return;
  const key = 'vitara.participant.token';
  const token = () => V.store.get(key, '');
  const api = async (url, options = {}) => {
    let response;
    try { response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...options.headers } }); }
    catch { throw new Error('No se pudo conectar con el servidor.'); }
    let data;
    try { data = await response.json(); } catch { throw new Error('Este servicio necesita el servidor Node; no está disponible en una publicación solo estática.'); }
    if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación.');
    return data;
  };
  let active = false;
  async function record(tipo, valor = '') {
    if (!active || !token()) return;
    try { await api('/api/perfil/interacciones', { method: 'POST', body: JSON.stringify({ tipo, valor }) }); }
    catch { /* Tracking failure must not block navigation. Status is available in the profile dialog. */ }
  }
  window.VitaraParticipation = {
    async register(profile) {
      const result = await api('/api/perfiles', { method: 'POST', body: JSON.stringify({ ...profile, consent: true }) });
      V.store.set(key, result.token); V.store.set('vitara.participant.active', true); return result.profile;
    }, record
  };
  window.addEventListener('vitara:session', () => { active = !!token(); if (active) record('vista', document.querySelector('.view:not([hidden])')?.id.replace('view-', '') || 'inicio'); });
  window.addEventListener('vitara:logout', () => { active = false; });
  document.addEventListener('vitara:view', event => record('vista', event.detail.id));
  document.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    const id = button.id;
    if (['load-hospital','load-or','load-vr'].includes(id)) record('modelo', id.replace('load-', ''));
    if (id === 'map-btn-peru' || id === 'map-btn-ll') record('mapa', id.endsWith('ll') ? 'll' : 'peru');
  });
  setInterval(() => { if (!document.hidden) record('presencia'); }, 60000);

  const tools = document.createElement('div'); tools.className = 'connection-tools';
  tools.innerHTML = '<button type="button" id="theme-switch" aria-pressed="true">◐ <span>Base cálida</span></button><button type="button" id="participation-open">◎ <span>Participación</span></button><button type="button" id="chat-open" aria-expanded="false" aria-controls="orientation-chat">↗ <span>Orientación</span></button>';
  document.body.append(tools);
  function theme(value) {
    document.documentElement.dataset.base = value;
    V.store.set('vitara.theme', value);
    const white = value === 'blanco';
    document.getElementById('theme-switch').setAttribute('aria-pressed', String(white));
    document.querySelector('#theme-switch span').textContent = white ? 'Base cálida' : 'Base editorial';
  }
  theme(V.store.get('vitara.theme', 'blanco'));
  document.getElementById('theme-switch').addEventListener('click', () => { const next = document.documentElement.dataset.base === 'blanco' ? 'editorial' : 'blanco'; theme(next); record('tema', next); });

  const profile = document.createElement('dialog'); profile.className = 'participation-dialog'; profile.setAttribute('aria-labelledby', 'participation-title');
  profile.innerHTML = '<form method="dialog"><button aria-label="Cerrar participación" class="dialog-close">×</button></form><span class="overline">TÚ DECIDES QUÉ COMPARTIR</span><h2 id="participation-title">Tu participación</h2><p id="participation-status" role="status"></p><dl id="participation-details"></dl><p>Hasta 7 perfiles. Retención máxima de 30 días desde tu última actividad. Administración ve los módulos visitados, modelos abiertos, cambios de tema y uso del chat; no ve el texto de tus mensajes ni búsquedas. Solo los perfiles conectados con Google tienen correo verificado; los de prueba no verifican identidad. Elegir una profesión no acredita un cargo ni da permisos institucionales.</p><button type="button" id="participation-delete">Eliminar mi perfil del servidor y de este dispositivo</button><p>Si solo cierras sesión, el registro del servidor permanece hasta su eliminación o caducidad.</p>';
  document.body.append(profile);
  document.getElementById('participation-open').addEventListener('click', async () => {
    profile.showModal(); const status = document.getElementById('participation-status'), details = document.getElementById('participation-details'); details.replaceChildren();
    if (!token()) { status.textContent = 'Estás explorando sin sincronización. El nombre y las preferencias se guardan solo en este dispositivo.'; return; }
    status.textContent = 'Consultando tu registro…';
    try {
      const result = await api('/api/perfil');
      status.textContent = 'Registro guardado en el servidor. La clave de acceso permanece en este dispositivo: no la compartas.';
      for (const [label, value] of [['Nombre',result.profile.nombre],['Correo',result.profile.email],['Identidad',result.profile.emailVerified?'Correo verificado por Google':'Prueba o perfil histórico sin verificación'],['Interacciones guardadas',String(result.profile.interactions.length)]]) {
        const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value; details.append(dt,dd);
      }
    } catch (error) { status.textContent = error.message; }
  });
  document.getElementById('participation-delete').addEventListener('click', async () => {
    if (!confirm('¿Eliminar tu perfil y todas sus interacciones? Esta acción no se puede deshacer.')) return;
    const status = document.getElementById('participation-status');
    try {
      if (token()) await api('/api/perfil', { method: 'DELETE' });
      V.store.del(key); V.store.del('g3.perfil'); V.store.del('vitara.participant.active'); active = false;
      profile.close(); window.dispatchEvent(new Event('vitara:logout'));
    } catch (error) { status.textContent = error.message + ' No se ha confirmado la eliminación del servidor.'; }
  });

  const chat = document.createElement('section'); chat.id = 'orientation-chat'; chat.className = 'orientation-chat'; chat.hidden = true; chat.setAttribute('aria-label', 'Chat de orientación VITARA');
  chat.innerHTML = '<header><div><span class="overline">UN PRIMER PASO, CONTIGO</span><h2>Hablemos de lo que necesitas.</h2></div><button type="button" id="chat-close" aria-label="Cerrar orientación">×</button></header><p class="chat-mode" id="chat-mode">Guía local · sin IA externa conectada</p><label class="chat-ai"><input type="checkbox" id="chat-ai" disabled> Usar IA externa para preguntas abiertas (envía tu consulta al proveedor; no incluyas datos personales).</label><div class="chat-messages" id="chat-messages" role="log" aria-label="Conversación" aria-live="polite"></div><div class="chat-prompts"><button type="button">¿Cómo exploro los mapas?</button><button type="button">¿Cómo se guardan mis datos?</button><button type="button">Necesito orientación de salud</button><button type="button">¿Qué es el ADN?</button><button type="button">¿Cómo leo el tablero SISMED?</button></div><form id="chat-form"><label class="sr-only" for="chat-input">Tu consulta</label><textarea id="chat-input" maxlength="2000" rows="2" required placeholder="Escribe tu pregunta, sin DNI ni datos clínicos…"></textarea><button type="submit" aria-label="Enviar consulta">↗</button></form><footer>Sin historial persistente. Orientación, no diagnóstico. En emergencia: 106 (según cobertura); orientación sanitaria: 113.</footer>';
  document.body.append(chat);
  const log = document.getElementById('chat-messages');
  function bubble(text, who, action) {
    const item = document.createElement('div'); item.className = `chat-message chat-message--${who}`;
    const label = document.createElement('strong'); label.textContent = who === 'user' ? 'Tú' : 'VITARA';
    const content = document.createElement('p'); content.textContent = text; item.append(label, content);
    if (action && ['mapas','buscar','planos','solicitudes','canales','tecnologia'].includes(action)) { const link = document.createElement('button'); link.type = 'button'; link.textContent = 'Abrir módulo ↗'; link.addEventListener('click', () => { V.abrirVista(action); closeChat(); }); item.append(link); }
    log.append(item); while (log.childElementCount > 30) log.firstElementChild.remove(); log.scrollTop = log.scrollHeight;
  }
  bubble('Hola, soy tu guía de VITARA. Puedo ayudarte a explorar la plataforma y encontrar orientación. El modo local tiene alcance limitado y no inventa respuestas generales. ¿Por dónde empezamos?', 'bot');
  function closeChat() { chat.hidden = true; document.getElementById('chat-open').setAttribute('aria-expanded', 'false'); document.getElementById('chat-open').focus(); }
  document.getElementById('chat-open').addEventListener('click', async () => {
    if (!chat.hidden) { closeChat(); return; }
    chat.hidden = false; document.getElementById('chat-open').setAttribute('aria-expanded', 'true'); document.getElementById('chat-input').focus();
    try { const data = await api('/api/orientacion/estado'); document.getElementById('chat-ai').disabled = !data.aiConfigured; document.getElementById('chat-mode').textContent = data.aiConfigured ? 'Guía local · IA externa disponible con tu autorización' : 'Guía local · IA general pendiente de configurar'; } catch { document.getElementById('chat-mode').textContent = 'Sin conexión al servidor · no se simulan respuestas'; }
  });
  document.getElementById('chat-close').addEventListener('click', closeChat);
  chat.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closeChat(); } });
  window.addEventListener('vitara:logout', () => { chat.hidden = true; document.getElementById('chat-open').setAttribute('aria-expanded','false'); log.replaceChildren(); bubble('La conversación anterior se borró de esta sesión. ¿En qué puedo orientarte?', 'bot'); });
  const chatForm = document.getElementById('chat-form');
  chat.querySelectorAll('.chat-prompts button').forEach(button => button.addEventListener('click', () => { document.getElementById('chat-input').value = button.textContent; chatForm.requestSubmit(); }));
  chatForm.addEventListener('submit', async e => {
    e.preventDefault(); const input = document.getElementById('chat-input'), message = input.value.trim(); if (!message) return;
    const send = chatForm.querySelector('button'); if (send.disabled) return; send.disabled = true; input.value = ''; bubble(message, 'user');
    try { const data = await api('/api/orientacion', { method: 'POST', body: JSON.stringify({ message, useAI: document.getElementById('chat-ai').checked }) }); bubble(data.answer + '\n\n' + data.notice, 'bot', data.action); record('chat', data.mode); }
    catch (error) { bubble(error.message, 'bot'); }
    finally { send.disabled = false; input.focus(); }
  });

})();
