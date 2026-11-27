/**
 * modulo-publicos.js — Adaptación del Ecosistema para Distintos Públicos
 * Niños (Minijuego de Salud) · Adolescentes · Adultos Mayores
 * Ecosistema Digital de Acceso a la Salud · Grupo 3 · ODS 3, 9 y 10
 */

(function () {
  'use strict';

  function montarModuloPublicos() {
    const contenedor = document.getElementById('contenedor-modulo-publicos');
    if (!contenedor) return;

    contenedor.innerHTML = `
      <div class="seccion__cab" data-revelar>
        <p class="seccion__eyebrow">Salud Inclusiva · ODS 3 & 10 · Para Todas las Edades</p>
        <h2 class="seccion__titulo">Comprensión del Problema según tu Público</h2>
        <p class="seccion__texto">
          La salud nos pertenece a todos. Adaptamos el lenguaje, las herramientas y la acción comunitaria para niños, jóvenes y adultos mayores.
        </p>

        <div class="publico-tabs">
          <button class="btn-publico activo" id="tab-ninos" data-panel="panel-ninos" type="button">
            <span>🧒</span> Niños: Minijuego "Defensores"
          </button>
          <button class="btn-publico" id="tab-jovenes" data-panel="panel-jovenes" type="button">
            <span>🧑‍🎓</span> Jóvenes: Salud Mental & Derechos
          </button>
          <button class="btn-publico" id="tab-mayores" data-panel="panel-mayores" type="button">
            <span>👴</span> Adultos Mayores: Fácil Lectura
          </button>
        </div>
      </div>

      <div class="panel-publico cyber-card">
        <!-- 1. PANEL NIÑOS: MINIJUEGO CANVAS -->
        <div id="panel-ninos" class="subpanel-publico">
          <div style="text-align:center; margin-bottom:14px;">
            <h3 style="color:#10b981; margin:0 0 6px 0; font-size:1.3rem;">🎮 Misión: Defensores de la Posta Médica</h3>
            <p style="color:#cbd5e1; font-size:12px; margin:0 auto; max-width:540px;">
              ¡Elimina los zancudos del Dengue haciendo clic sobre ellos y rescata las vacunas para llevarlas a la refrigeradora!
            </p>
          </div>

          <div class="juego-canvas-wrap">
            <canvas id="canvas-juego-ninos" width="600" height="320"></canvas>
            <div class="juego-overlay-hud">
              <div>🏆 Puntos: <span id="juego-score">0</span></div>
              <div>❤️ Vidas: <span id="juego-vidas">❤️❤️❤️</span></div>
              <div>⏱️ Tiempo: <span id="juego-tiempo">30</span>s</div>
            </div>
          </div>

          <div style="display:flex; justify-content:center; gap:12px; margin-top:14px;">
            <button id="btn-iniciar-juego" type="button" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%); color:#fff; border:none; padding:10px 24px; border-radius:30px; font-weight:800; font-size:13px; cursor:pointer; box-shadow:0 0 15px rgba(16,185,129,0.5);">
              ▶ ¡Empezar a Jugar!
            </button>
          </div>

          <div id="juego-mensaje-final" style="display:none; text-align:center; margin-top:14px; background:rgba(6,78,59,0.3); border:1px solid #10b981; border-radius:10px; padding:12px;"></div>
        </div>

        <!-- 2. PANEL JÓVENES / ADOLESCENTES -->
        <div id="panel-jovenes" class="subpanel-publico" style="display:none;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px;">
            <div style="background:#051428; border:1px solid #00f0ff; border-radius:12px; padding:16px;">
              <span style="font-size:24px;">🧠</span>
              <h4 style="color:#00f0ff; margin:8px 0 4px 0;">Salud Mental Confidencial</h4>
              <p style="font-size:12px; color:#cbd5e1; line-height:1.4;">
                Si sientes ansiedad, presión académica, depresión o crisis emocional, llama gratis a la <strong>Línea 113 Opción 2</strong>. Psicólogos colegiados te escuchan 24/7 sin costo.
              </p>
              <a href="tel:113" style="display:inline-block; margin-top:8px; background:#0284c7; color:#fff; text-decoration:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:700;">
                Llamar 113 Opc. 2 Gratis
              </a>
            </div>

            <div style="background:#051428; border:1px solid #10b981; border-radius:12px; padding:16px;">
              <span style="font-size:24px;">⚖️</span>
              <h4 style="color:#10b981; margin:8px 0 4px 0;">Tu Derecho a los Genéricos</h4>
              <p style="font-size:12px; color:#cbd5e1; line-height:1.4;">
                La Ley 32033 exige a todas las farmacias del Perú tener un stock mínimo del 30% de genéricos DCI. Tienen la misma eficacia que la marca comercial y cuestan hasta un 96% menos.
              </p>
              <a href="#buscador" style="display:inline-block; margin-top:8px; background:#064e3b; color:#6ee7b7; border:1px solid #10b981; text-decoration:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:700;">
                Comparar Precios en el Buscador
              </a>
            </div>

            <div style="background:#051428; border:1px solid #f59e0b; border-radius:12px; padding:16px;">
              <span style="font-size:24px;">📢</span>
              <h4 style="color:#f59e0b; margin:8px 0 4px 0;">Vigilancia Ciudadana Digital</h4>
              <p style="font-size:12px; color:#cbd5e1; line-height:1.4;">
                Puedes usar este ecosistema como observador comunitario. Si detectas que una posta no tiene paracetamol o vacunas, envía una solicitud anónima con código G3.
              </p>
              <a href="#tablero-regional-sismed" style="display:inline-block; margin-top:8px; background:#78350f; color:#fde047; text-decoration:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:700;">
                Auditar Tablero Regional
              </a>
            </div>
          </div>
        </div>

        <!-- 3. PANEL ADULTOS MAYORES / LECTURA FÁCIL -->
        <div id="panel-mayores" class="subpanel-publico" style="display:none;">
          <div style="background:#061122; border:2px solid #38bdf8; border-radius:14px; padding:20px; text-align:center; margin-bottom:16px;">
            <p style="font-size:1.15rem; color:#fff; font-weight:700; margin:0 0 10px 0;">
              Líneas Telefónicas Gratuitas para Urgencias Médicas (Sin internet)
            </p>
            <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
              <a href="tel:113" style="background:#10b981; color:#fff; text-decoration:none; padding:16px 28px; border-radius:12px; font-size:1.3rem; font-weight:800; display:inline-flex; align-items:center; gap:10px; box-shadow:0 0 20px rgba(16,185,129,0.4);">
                <span>📞</span> LLAMAR AL 113 (MINSA)
              </a>
              <a href="tel:106" style="background:#ef4444; color:#fff; text-decoration:none; padding:16px 28px; border-radius:12px; font-size:1.3rem; font-weight:800; display:inline-flex; align-items:center; gap:10px; box-shadow:0 0 20px rgba(239,68,68,0.4);">
                <span>🚑</span> LLAMAR AL 106 (SAMU)
              </a>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
            <div style="background:#0a192f; border:1px solid #1e3a5f; border-radius:12px; padding:16px;">
              <h4 style="color:#38bdf8; font-size:1.1rem; margin:0 0 6px 0;">¿Alguien te ayuda? Modo Acompañamiento</h4>
              <p style="color:#cbd5e1; font-size:13px; line-height:1.45; margin:0 0 10px 0;">
                Un familiar, vecino o promotor puede consultar la disponibilidad de tus medicinas en la posta sin necesidad de que entregues tu DNI ni datos confidenciales.
              </p>
              <button id="btn-activar-acomp-mayores" type="button" style="background:#0284c7; color:#fff; border:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer;">
                Activar Modo Acompañamiento
              </button>
            </div>

            <div style="background:#0a192f; border:1px solid #1e3a5f; border-radius:12px; padding:16px;">
              <h4 style="color:#34d399; font-size:1.1rem; margin:0 0 6px 0;">Medicinas de Control Crónico</h4>
              <p style="color:#cbd5e1; font-size:13px; line-height:1.45; margin:0;">
                Losartán 50mg, Metformina 850mg y Atorvastatina 20mg forman parte del petitorio gratuito en el SIS para postas de La Libertad. Si tu posta no los tiene, el centro de salud debe emitir orden de reposición inmediata.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Conectar pestañas
    const tabs = contenedor.querySelectorAll('.btn-publico');
    const paneles = contenedor.querySelectorAll('.subpanel-publico');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('activo'));
        paneles.forEach(p => p.style.display = 'none');

        tab.classList.add('activo');
        const target = document.getElementById(tab.dataset.panel);
        if (target) target.style.display = 'block';
      });
    });

    document.getElementById('btn-activar-acomp-mayores')?.addEventListener('click', () => {
      localStorage.setItem('g3-preferencias', JSON.stringify({ chips: { acompanamiento: true } }));
      window.location.reload();
    });

    // Iniciar motor del minijuego
    iniciarMinijuegoNinos();
  }

  /* =========================================================================
     MINIJUEGO EN CANVAS: DEFENSORES DE LA POSTA (ANTIDENGUE Y VACUNAS)
     ========================================================================= */
  function iniciarMinijuegoNinos() {
    const canvas = document.getElementById('canvas-juego-ninos');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let juegoActivo = false;
    let score = 0;
    let vidas = 3;
    let tiempoRestante = 30;
    let timerInterval = null;
    let animId = null;

    let elementos = []; // zancudos y vacunas

    function spawnElemento() {
      if (!juegoActivo) return;
      const esVacuna = Math.random() < 0.35;
      elementos.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -30,
        vx: (Math.random() - 0.5) * 2,
        vy: esVacuna ? (Math.random() * 1.2 + 1.2) : (Math.random() * 1.8 + 1.8),
        radio: esVacuna ? 18 : 16,
        tipo: esVacuna ? 'vacuna' : 'zancudo',
        emoji: esVacuna ? '💉' : '🦟'
      });
    }

    function render() {
      if (!juegoActivo) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fondo del juego: Cuadrícula y silueta de posta médica
      ctx.fillStyle = '#031911';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Posta médica en la base
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(canvas.width / 2 - 60, canvas.height - 45, 120, 45);
      ctx.fillStyle = '#34d399';
      ctx.font = '22px sans-serif';
      ctx.fillText('🏥 POSTA', canvas.width / 2 - 50, canvas.height - 15);

      // Actualizar y dibujar elementos
      for (let i = elementos.length - 1; i >= 0; i--) {
        const el = elementos[i];
        el.x += el.vx;
        el.y += el.vy;

        // Rebote en paredes laterales
        if (el.x < el.radio || el.x > canvas.width - el.radio) el.vx *= -1;

        // Dibujar
        ctx.font = `${el.radio * 1.8}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.emoji, el.x, el.y);

        // Si el zancudo llega a la posta
        if (el.y >= canvas.height - 35) {
          if (el.tipo === 'zancudo') {
            vidas--;
            actualizarHUD();
            if (vidas <= 0) {
              terminarJuego(false);
              return;
            }
          }
          elementos.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    }

    function actualizarHUD() {
      const scoreEl = document.getElementById('juego-score');
      const vidasEl = document.getElementById('juego-vidas');
      const tiempoEl = document.getElementById('juego-tiempo');

      if (scoreEl) scoreEl.textContent = score;
      if (vidasEl) vidasEl.textContent = '❤️'.repeat(Math.max(0, vidas));
      if (tiempoEl) tiempoEl.textContent = tiempoRestante;
    }

    // Clic sobre elementos
    canvas.addEventListener('pointerdown', (e) => {
      if (!juegoActivo) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      for (let i = elementos.length - 1; i >= 0; i--) {
        const el = elementos[i];
        const dist = Math.hypot(el.x - clickX, el.y - clickY);
        if (dist <= el.radio * 1.5) {
          if (el.tipo === 'zancudo') {
            score += 10;
            crearEfectoPuf(el.x, el.y, '💥');
          } else if (el.tipo === 'vacuna') {
            score += 25;
            crearEfectoPuf(el.x, el.y, '⭐');
          }
          elementos.splice(i, 1);
          actualizarHUD();
          break;
        }
      }
    });

    function crearEfectoPuf(x, y, sym) {
      ctx.font = '24px sans-serif';
      ctx.fillText(sym, x, y);
    }

    function terminarJuego(victoria) {
      juegoActivo = false;
      clearInterval(timerInterval);
      cancelAnimationFrame(animId);

      const msg = document.getElementById('juego-mensaje-final');
      if (msg) {
        msg.style.display = 'block';
        if (victoria) {
          msg.innerHTML = `
            <strong style="color:#10b981; font-size:16px;">🎉 ¡MISIÓN CUMPLIDA, DEFENSOR!</strong><br>
            <span style="color:#e2e8f0; font-size:13px;">Lograste <strong>${score} puntos</strong> protegiendo la posta de los zancudos y guardando las vacunas.</span><br>
            <small style="color:#6ee7b7; display:block; margin-top:6px;">
              Consejo de Oro MINSA: ¡Lava y tapa bien los depósitos con agua en tu casa para que el zancudo Aedes no pueda nacer!
            </small>
          `;
        } else {
          msg.innerHTML = `
            <strong style="color:#f87171; font-size:16px;">⚠️ ¡CUIDADO CON EL DENGUE!</strong><br>
            <span style="color:#e2e8f0; font-size:13px;">Los zancudos alcanzaron la posta. Lograste <strong>${score} puntos</strong>.</span><br>
            <small style="color:#fca5a5; display:block; margin-top:6px;">
              ¡No te desanimes! Recuerda acudir a la posta si tienes fiebre y tomar mucho líquido.
            </small>
          `;
        }
      }

      const btn = document.getElementById('btn-iniciar-juego');
      if (btn) btn.textContent = '🔄 Jugar de Nuevo';
    }

    document.getElementById('btn-iniciar-juego')?.addEventListener('click', () => {
      score = 0;
      vidas = 3;
      tiempoRestante = 30;
      elementos = [];
      juegoActivo = true;
      actualizarHUD();

      const msg = document.getElementById('juego-mensaje-final');
      if (msg) msg.style.display = 'none';

      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        tiempoRestante--;
        actualizarHUD();
        spawnElemento();
        if (tiempoRestante <= 0) {
          terminarJuego(true);
        }
      }, 1000);

      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarModuloPublicos);
  } else {
    montarModuloPublicos();
  }

  window.ModuloPublicos = { montarModuloPublicos };
})();
