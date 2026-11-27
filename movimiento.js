/**
 * movimiento.js — Micro-interacciones de alto nivel (sin librerías).
 *
 * Contenido:
 *   1. Barra que se compacta al hacer scroll
 *   2. Luz que sigue al puntero en el fondo
 *   3. Tilt 3D + halo en las tarjetas (con inercia, no salto brusco)
 *   4. Halo dentro de los botones de icono
 *   5. Contadores numéricos que suben al entrar en pantalla
 *   6. Entrada en cascada del título palabra por palabra
 *   7. Preferencia de movimiento y pausa cuando la pestaña no es visible
 */
(function () {
  'use strict';

  const raiz = document.documentElement;
  const sinMovimiento = () =>
    raiz.classList.contains('sin-movimiento') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------------------------------------------------------------
     1 · BARRA QUE SE COMPACTA
     Se usa un umbral con histéresis para que no parpadee justo en el borde.
     --------------------------------------------------------------------- */
  function initBarra() {
    const barra = document.getElementById('barra');
    if (!barra) return;
    let compacta = false;
    let pendiente = false;

    const revisar = () => {
      pendiente = false;
      const y = window.scrollY;
      if (!compacta && y > 120) { compacta = true; barra.classList.add('compacta'); }
      else if (compacta && y < 60) { compacta = false; barra.classList.remove('compacta'); }
    };

    // requestAnimationFrame evita recalcular en cada evento de scroll
    window.addEventListener('scroll', () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(revisar);
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     2 · LUZ QUE SIGUE AL PUNTERO EN EL FONDO
     Escribe --px/--py en el contenedor del foco (variables CSS).
     --------------------------------------------------------------------- */
  function initFocoPuntero() {
    if (!punteroFino || sinMovimiento()) return;
    const foco = document.getElementById('foco-puntero');
    if (!foco) return;
    let pendiente = false;
    let x = 0, y = 0;

    window.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        foco.style.setProperty('--px', `${x}px`);
        foco.style.setProperty('--py', `${y}px`);
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
     3 · TILT 3D DE LAS TARJETAS
     Dos detalles que separan una inclinación buena de una mala:
       a) amortiguación: el valor se interpola hacia el objetivo (lerp),
          así no hay saltos cuando el puntero se mueve rápido;
       b) valores en grados pequeños (±5°) — más que eso marea.
     --------------------------------------------------------------------- */
  function initTilt() {
    if (!punteroFino || sinMovimiento()) return;
    const tarjetas = document.querySelectorAll('.tarjeta, .entrada');

    for (const tarjeta of tarjetas) {
      let objetivoX = 0, objetivoY = 0;
      let actualX = 0, actualY = 0;
      let activa = false;
      let frame = null;

      const MAX = 5; // grados máximos

      const animar = () => {
        // Interpolación exponencial: 0.14 da sensación de masa sin retraso perceptible
        actualX += (objetivoX - actualX) * 0.14;
        actualY += (objetivoY - actualY) * 0.14;

        tarjeta.style.transform =
          `perspective(900px) rotateX(${actualX.toFixed(2)}deg) rotateY(${actualY.toFixed(2)}deg) translateY(${activa ? -3 : 0}px)`;

        if (Math.abs(objetivoX - actualX) > 0.02 || Math.abs(objetivoY - actualY) > 0.02 || activa) {
          frame = requestAnimationFrame(animar);
        } else {
          tarjeta.style.transform = '';
          frame = null;
        }
      };

      tarjeta.addEventListener('pointerenter', () => {
        activa = true;
        if (!frame) frame = requestAnimationFrame(animar);
      });

      tarjeta.addEventListener('pointermove', (e) => {
        const r = tarjeta.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;

        // Posición del halo para el radial-gradient del CSS
        tarjeta.style.setProperty('--mx', `${px * 100}%`);
        tarjeta.style.setProperty('--my', `${py * 100}%`);

        objetivoX = (0.5 - py) * MAX * 2;
        objetivoY = (px - 0.5) * MAX * 2;
      });

      const salir = () => {
        activa = false;
        objetivoX = 0;
        objetivoY = 0;
        if (!frame) frame = requestAnimationFrame(animar);
      };

      tarjeta.addEventListener('pointerleave', salir);
      tarjeta.addEventListener('pointercancel', salir);
    }
  }

  /* ---------------------------------------------------------------------
     4 · HALO DENTRO DE LOS BOTONES DE ICONO
     Mismo patrón de coordenadas que el tilt, pero sin rotación.
     --------------------------------------------------------------------- */
  function initHaloBotones() {
    if (!punteroFino) return;
    for (const boton of document.querySelectorAll('.btn-icono')) {
      boton.addEventListener('pointermove', (e) => {
        const r = boton.getBoundingClientRect();
        boton.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        boton.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    }
  }

  /* ---------------------------------------------------------------------
     5 · CONTADORES
     Cuentan desde 0 hasta el valor con desaceleración (easeOutCubic).
     Si el movimiento está reducido, muestran el valor final directamente.
     --------------------------------------------------------------------- */
  function animarContador(nodo) {
    const destino = parseFloat(nodo.dataset.contar || '0');
    const decimales = parseInt(nodo.dataset.decimales || '0', 10);
    const sufijo = nodo.dataset.sufijo || '';
    const prefijo = nodo.dataset.prefijo || '';
    const dur = 1600;

    const escribir = (v) => {
      nodo.textContent = prefijo + v.toFixed(decimales) + sufijo;
    };

    if (sinMovimiento()) { escribir(destino); return; }

    const inicio = performance.now();
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / dur);
      const suavizado = 1 - Math.pow(1 - t, 3); // easeOutCubic
      escribir(destino * suavizado);
      if (t < 1) requestAnimationFrame(paso);
      else escribir(destino);
    };
    requestAnimationFrame(paso);
  }

  function initContadores() {
    const nodos = document.querySelectorAll('[data-contar]');
    if (!nodos.length) return;

    if (!('IntersectionObserver' in window)) {
      nodos.forEach(animarContador);
      return;
    }

    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        animarContador(e.target);
        obs.unobserve(e.target);
      }
    }, { threshold: 0.6 });

    nodos.forEach((n) => obs.observe(n));
  }

  /* ---------------------------------------------------------------------
     6 · TÍTULO PALABRA POR PALABRA
     Se envuelve cada palabra en un <span> y se retrasa con --i.
     Se respeta el marcado existente (.resalta).
     --------------------------------------------------------------------- */
  function initTitulo() {
    const titulo = document.querySelector('[data-palabras]');
    if (!titulo || titulo.dataset.procesado) return;
    titulo.dataset.procesado = '1';

    // Recorre nodos de texto sin destruir los <span> que ya existen
    const fragmento = document.createDocumentFragment();
    let indice = 0;

    const agregarPalabra = (texto) => {
      const partes = texto.split(/(\s+)/);
      for (const parte of partes) {
        if (!parte.trim()) { fragmento.append(document.createTextNode(' ')); continue; }
        const span = document.createElement('span');
        span.className = 'palabra';
        span.style.setProperty('--i', String(indice++));
        span.textContent = parte;
        fragmento.append(span);
      }
    };

    for (const nodo of Array.from(titulo.childNodes)) {
      if (nodo.nodeType === Node.TEXT_NODE) {
        agregarPalabra(nodo.textContent);
      } else if (nodo.nodeType === Node.ELEMENT_NODE) {
        const esResalta = nodo.classList.contains('resalta');
        const partes = (nodo.textContent || '').split(/(\s+)/);
        for (const parte of partes) {
          if (!parte.trim()) { fragmento.append(document.createTextNode(' ')); continue; }
          const span = document.createElement('span');
          span.className = esResalta ? 'palabra resalta' : 'palabra';
          span.style.setProperty('--i', String(indice++));
          span.textContent = parte;
          fragmento.append(span);
        }
      }
    }

    titulo.innerHTML = '';
    titulo.append(fragmento);
  }

  /* ---------------------------------------------------------------------
     6.5 · REVELAR EN SCROLL
     Elementos marcados con [data-reveal] suben desde la posición de origen
     al entrar en el viewport. Respetando la preferencia de movimiento reducido.
     --------------------------------------------------------------------- */
  function initReveal() {
    const nodos = document.querySelectorAll('[data-reveal]');
    if (!nodos.length) return;
    if (sinMovimiento() || !('IntersectionObserver' in window)) {
      nodos.forEach((n) => n.classList.add('es-revelado'));
      return;
    }
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('es-revelado');
        obs.unobserve(e.target);
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    nodos.forEach((n) => obs.observe(n));
  }

  /* ---------------------------------------------------------------------
     7 · PAUSA GLOBAL
     Con la pestaña en segundo plano se suspenden las animaciones CSS caras
     (orbes, grano) para no gastar batería con el portátil en la mochila.
     --------------------------------------------------------------------- */
  function initPausaPestana() {
    document.addEventListener('visibilitychange', () => {
      raiz.classList.toggle('pestana-oculta', document.hidden);
    });
  }

  function iniciar() {
    initBarra();
    initFocoPuntero();
    initTilt();
    initHaloBotones();
    initContadores();
    initTitulo();
    initReveal();
    initPausaPestana();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
