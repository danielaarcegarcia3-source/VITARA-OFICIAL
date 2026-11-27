(function () {
  'use strict';
  const status = document.getElementById('admin-config-status'), setup = document.getElementById('admin-setup');
  async function configuration() {
    try {
      const response = await fetch('/api/admin/estado'); if (!response.ok) throw new Error(); const data = await response.json();
      status.textContent = data.configured ? 'Acceso protegido · sesión de 8 horas. Usa las credenciales privadas del operador.' : data.setupEnabled ? 'Aún no hay administrador. El operador puede configurarlo con su clave privada.' : 'El operador debe configurar ADMIN_USUARIO y ADMIN_CLAVE o VITARA_SETUP_KEY y reiniciar el servidor. Consulta CONFIGURACION-VITARA.md.';
      setup.hidden = !data.setupRequired || !data.setupEnabled;
      if (!setup.hidden) setup.open = true;
    } catch { status.textContent = 'El panel requiere el servidor Node. No hay acceso de demostración sin autenticación.'; }
  }
  configuration();
  document.getElementById('admin-setup-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.target, button = form.querySelector('button'); button.disabled = true;
    try {
      const body = Object.fromEntries(new FormData(form));
      const response = await fetch('/api/admin/configurar', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      form.reset(); setup.hidden = true; status.textContent = 'Administrador creado. Inicia sesión con las credenciales que acabas de elegir.';
    } catch(error) { status.textContent = error.message || 'No se pudo completar la configuración.'; }
    finally { button.disabled = false; }
  });
  const section = document.createElement('section'); section.className = 'admin-participation'; section.setAttribute('aria-labelledby','participants-title'); section.hidden = true;
  section.innerHTML = '<header><div><span>PARTICIPACIÓN / REGISTROS REALES</span><h2 id="participants-title">Personas que conectan.</h2><p>En la demostración usa alias ficticios y correos example.test. Solo perfiles con consentimiento. Correo sin verificar; no equivale a identidad autenticada. No se registran mensajes del chat ni búsquedas.</p></div><button type="button" id="participants-refresh">Actualizar ↻</button></header><p id="participants-status" role="status"></p><div id="participants-summary" class="participants-summary"></div><div id="participants-list" class="participants-list"></div><footer>Actualización cada 15 s mientras el panel está visible. Activo: señal de presencia durante los últimos 90 s. Máximo 200 interacciones por perfil; retención de 30 días desde última actividad.</footer>';
  document.querySelector('.admin-kpis')?.before(section);
  let timer;
  const list = document.getElementById('participants-list');
  const names = { vista:'Módulo visitado',modelo:'Modelo abierto',mapa:'Mapa elegido',tema:'Tema elegido',chat:'Consulta al orientador' };
  function node(tag,text,className) { const element=document.createElement(tag); if(text!==undefined)element.textContent=text;if(className)element.className=className;return element; }
  const date = value => new Date(value).toLocaleString('es-PE');
  async function load() {
    const token = sessionStorage.getItem('g3_admin_auth_token'); if(!token) return;
    const state = document.getElementById('participants-status'); state.textContent='Consultando perfiles…';
    try {
      const response=await fetch('/api/admin/usuarios',{headers:{Authorization:`Bearer ${token}`}});
      const data=await response.json(); if(!response.ok) { if(response.status===401) { clearInterval(timer); sessionStorage.removeItem('g3_admin_auth_token'); window.dispatchEvent(new Event('vitara:admin-logout')); document.getElementById('loginOverlay').style.display='grid'; } throw new Error(data.error); }
      state.textContent=`Última consulta: ${new Date().toLocaleTimeString('es-PE')}. Sin registros de ejemplo.`;
      const summary=document.getElementById('participants-summary');summary.replaceChildren();
      for(const [value,label] of [[`${data.users.length} / ${data.capacity}`,'Perfiles guardados'],[data.active,'Con presencia reciente'],[data.users.reduce((n,u)=>n+u.interactions.length,0),'Interacciones guardadas']]) { const card=node('div');card.append(node('strong',String(value)),node('span',label));summary.append(card); }
      const open = new Set([...list.querySelectorAll('details[open]')].map(item=>item.dataset.user)); list.replaceChildren();
      if(!data.users.length) list.append(node('p','Aún no hay participantes sincronizados. Los perfiles aparecerán cuando alguien complete el formulario y acepte compartir su actividad.','participants-empty'));
      for(const user of data.users) {
        const card=node('details'); card.dataset.user=user.id;card.open=open.has(user.id);
        const title=node('summary');title.append(node('strong',user.nombre),node('span',user.email),node('b',`${user.interactions.length} interacciones`));card.append(title);
        const meta=node('p',`ID ${user.id} · ${user.rol} · ${user.distrito||'Territorio no indicado'} · Registro: ${date(user.createdAt)} · Última actividad: ${date(user.lastSeen)} · Consentimiento: ${date(user.consentAt)}`);card.append(meta);
        const events=node('ol');
        if(!user.interactions.length) events.append(node('li','Todavía no hay interacciones registradas.'));
        for(const event of user.interactions.slice().reverse()) events.append(node('li',`${date(event.fecha)} — ${names[event.tipo]||event.tipo}: ${event.valor}`));card.append(events);
        const remove=node('button','Eliminar perfil y liberar plaza');remove.type='button';remove.className='participant-remove';
        remove.addEventListener('click',async()=>{if(!confirm(`¿Eliminar el perfil de ${user.nombre} y todas sus interacciones?`))return;try{const res=await fetch(`/api/admin/usuarios/${encodeURIComponent(user.id)}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});if(!res.ok)throw new Error('No se pudo eliminar el registro.');await load();}catch(error){state.textContent=error.message;}});card.append(remove);list.append(card);
      }
    } catch(error) {state.textContent=error.message||'No se pudo consultar el servidor.';list.replaceChildren();document.getElementById('participants-summary').replaceChildren();}
  }
  window.addEventListener('vitara:admin-ready',()=>{section.hidden=false;load();clearInterval(timer);timer=setInterval(()=>{if(!document.hidden&&!document.getElementById('loginOverlay').checkVisibility())load();},15000);});
  window.addEventListener('vitara:admin-logout',()=>{clearInterval(timer);list.replaceChildren();section.hidden=true;document.getElementById('participants-summary').replaceChildren();});
  document.getElementById('participants-refresh').addEventListener('click',load);
})();
