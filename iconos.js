/**
 * iconos.js — Control de animación de los iconos SVG propios.
 *
 * Problema que resuelve: si todos los iconos animan al mismo tiempo al cargar,
 * (a) se desperdicia batería y (b) el usuario nunca ve la animación de los que
 * están más abajo porque ya terminó antes de que se desplace hasta ellos.
 *
 * Solución: los iconos dentro de un bloque [data-revelar] se reinician justo
 * cuando ese bloque entra en pantalla. El resto anima al cargar.
 */
(function () {
  'use strict';

  const reduceMovimiento = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('sin-movimiento');

  /**
   * Fuerza a un icono a reproducir sus animaciones desde cero.
   * El truco: quitar y volver a poner la clase obliga al navegador a recalcular
   * el estilo, reiniciando las animaciones CSS sin clonar el nodo.
   */
  function reiniciarIconos(raiz) {
    if (reduceMovimiento()) return;
    const iconos = raiz.querySelectorAll('.ico');
    for (const ico of iconos) {
      ico.style.animation = 'none';
      // Lectura de layout que vacía el buffer de estilo pendiente
      void ico.offsetWidth;
      ico.style.animation = '';
    }
  }

  /**
   * Observa cada bloque revelable y, al aparecer, reinicia sus iconos.
   * Se desconecta en cuanto el bloque ya se mostró (no vuelve a animar al
   * desplazarse hacia arriba y abajo, que distrae).
   */
  function vigilarRevelado() {
    const bloques = document.querySelectorAll('[data-revelar]');
    if (!bloques.length) return;

    if (!('IntersectionObserver' in window)) {
      for (const b of bloques) b.classList.add('es-visible');
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          const bloque = entrada.target;
          bloque.classList.add('es-visible');
          // Se espera al siguiente frame para que el trazo empiece con el bloque ya visible
          requestAnimationFrame(() => reiniciarIconos(bloque));
          observador.unobserve(bloque);
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );

    for (const b of bloques) observador.observe(b);
  }

  function iniciar() {
    document.documentElement.classList.add('iconos-listo');
    vigilarRevelado();

    // Si el usuario cambia la preferencia de movimiento en vivo, se respeta de inmediato
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const alCambiar = () => document.documentElement.classList.toggle('sin-movimiento', mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', alCambiar);
  }

  // Se expone para que interfaz.js pueda reiniciar iconos al cambiar de tema
  window.Iconos = { reiniciar: reiniciarIconos };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
