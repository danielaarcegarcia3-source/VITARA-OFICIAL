# Guía de Inicio para OpenCode — Ecosistema Digital de Salud (Grupo 3 · Club Tech-Masters 2026)

Pégalo íntegro como primer mensaje de OpenCode sobre la carpeta del proyecto.
Está escrito para que OpenCode trabaje sin acceso a ningún otro contexto.

---

## 0 · CONFIGURACIÓN: QUE OPENCODE USE CLAUDE

Nota del agente actual: mid-conversation no puedo cambiar de modelo, pero esto
documenta cómo se hace desde cero:

```
# 1. Escribe /connect (o /models) dentro de OpenCode y elige proveedor "Anthropic"
# 2. Inicia sesión con tu cuenta o API key
# 3. Selecciona un modelo de la forma anthropic/claude-... (ej. claude-sonnet-4-5 o el más capaz que
#    el plan permita). Guarda uno más barato para preguntas.
# 4. Verificación: opencode --version; el modelo activo debe aparecer en el prompt.
```

Alternativa por archivo: en `opencode.json` de la raíz: `{"model": "anthropic/claude-..."}`.
Alternativa por comando: `opencode run --model anthropic/claude-... "…tarea…"`.

Blender: la conexión se usa solo para producir y exportar assets 3D a `app/assets/3d/`
siguiendo HANDOFF/08-guia-blender.md. Blender nunca escribe código dentro de `app/js/`.

---

## 1 · DIAGNÓSTICO: QUEJA DEL USUARIO → TAREA

| # | Queja del usuario | Tarea(es) |
|---|---|---|
| 1 | «Pantalla de inicio muy simple, usa emoticones sin explicación, súper mal» | T-01, T-02, T-17 |
| 2 | «Falta animación de inicio y luego pedirle información al usuario que debe almacenarse» | T-03 |
| 3 | «La barra de arriba no sirve» | T-04 |
| 4 | «En la barra de búsqueda todo se sobrepone» | T-04 |
| 5 | «El diseño parece IA genérica; tipografía aburrida, poca visibilidad de letras» | T-01 |
| 6 | «El inicio parece la entrada a una página web, no un ecosistema» | T-02 |
| 7 | «El mapa sigue siendo cuadrados y círculos» | T-10 |
| 8 | «Mapas hiperreales; adjunté uno de referencia» | T-10 + Blender §3.1 |
| 9 | «Gráficos y tablas inmensas que impiden comprender rápido» | T-11, T-12 |
| 10 | «Los canales reales solo aparecen en partes pequeñas» | T-06 |
| 11 | «ADN 3D que gire y muestre canales de ayuda por nucleótido» | T-07 |
| 12 | «Los 8 módulos no tienen funcionalidad real» | T-05, T-08, T-09 |
| 13 | «Corte de plano arquitectónico no carga» | T-12 (bug 13) |
| 14 | «Los juegos no tienen impacto en el público» | T-13 |
| 15 | «Un ecosistema no es bajar: es Google — funciones por todos lados, pestañas, barras que se abren» | T-02, T-04 |
| 16 | «El panel de admin no debe aparecer en el ecosistema; separar» | T-14 |
| 17 | «No usar emojis; crear iconos nuevos» | T-01 |
| 18 | «El chatbot debe adaptarse a cada persona y expandir conocimiento» | T-15 |
| 19 | «Guíate de Roblox: barras laterales y funciones que se puedan abrir» | T-02, T-04 |
| 20 | «Los datos no se actualizan» | T-16 |

---

## 2 · SISTEMA DE DISEÑO NUEVO (obligatorio, aplica a todo)

### 2.1 Tipografía
- Dos familias autoalojadas (woff2 en `app/assets/fonts/`, `@font-face`, sin CDN):
  - Display/titulares: grotesca geométrica moderna (p. ej. Space Grotesk o Manrope; 500 y 700).
    Titular 28–34 px, interlineado 1.1, tracking −0.01 em.
  - Texto: humanista legible (p. ej. Inter, 400/500/600), 15–16 px, interlineado 1.55.
  - Monoespaciada: solo para cifras, códigos (G3-######), RENIPRESS y tablas de datos.
- Contraste mínimo AA; ningún texto < 13 px; jerarquía por tamaño y peso.

### 2.2 Barra superior (omnibox estilo Google)
- Una sola barra fija de 56 px: logo + nombre a la izquierda.
- Caja de búsqueda centrada (máx. 640 px) con icono y texto guía.
- Atajo Ctrl+K. A la derecha: notificaciones (badge real), accesibilidad, tema, sesión.
- La caja consulta POST /api/buscar con debounce 250 ms y muestra un desplegable de sugerencias
  (máx. 7) con tipo de recurso e icono propio.
- Sin superposiciones: desplegable en contenedor `position:absolute` dentro de padre
  `position:relative` con `z-index` explícito y sombra propia.

### 2.3 Pantalla de inicio = centro del ecosistema, no landing
Tres zonas sin scroll infinito:
1. Carrusel de experiencias (tarjetas anchas, fotografía a sangre, titular 2 líneas,
   frase de propósito, botón fantasma «Abrir»).
2. Franja de pulso en vivo (SSE: solicitudes hoy, establecimientos disponibles hoy,
   incidencias abiertas; cada uno con fuente y hora).
3. Panel lateral derecho «Continuar donde quedaste» (localStorage).

### 2.4 Iconografía propia, cero emojis
Sprite SVG con rejilla 24×24, trazo 1,5 px, terminaciones redondas, sin relleno salvo punto
de estado. Mínimo: buscar, mapa, sede, equipo, farmaco, solicitud, seguimiento, canal,
alerta, campana, accesibilidad, tema, sesión, admin, informe, ruta, adn, estadistica, juego,
ayuda, cerrar, atras, filtro, comparar, exportar, editar, verificar, reloj, fuente.
Toda vista reemplaza sus emojis por `icono('<id>')`.
Test estático en `tests/frontend.mjs` que falla si aparece emoji fuera de comentarios.

### 2.5 Navegación espacial (patrón «Roblox»)
- Riel izquierdo persistente y colapsable a solo-iconos (48 px), con los 15 destinos y sus iconos.
- Panel contextual derecho (320 px, abre/cierra, recuerda estado).
- Barra de pestañas bajo la omnibox (vistas abiertas con parámetros).
- Paleta de comandos con Ctrl+K.
- Migas de pan en vistas de profundidad.
- Todo panel: cerrable con Esc, navegable por teclado, foco visible.

---

## 3 · ONBOARDING Y PERFIL (queja 2 + §3)

Primer arranque: overlay de 3 pasos (saltable) que pregunta y guarda en localStorage bajo
`g3.perfil`: Departamento (25), Rol de uso, Preferencias.
Prohibido pedir DNI, nombre completo, teléfono, dirección o datos sensibles.
El perfil nunca se envía al servidor.

---

## 4 · MAPA DE EQUIVALENCIAS (§4)

Identificadores F-### no implican módulos nuevos; extender, no rehacer.

| Módulo del prompt | Ya existe (NO rehacer) | Falta (hacer) |
|---|---|---|
| F-101…110 Búsqueda | shared/busqueda.js + POST /api/buscar | Sugerencias en omnibox (2.2), comparador lado a lado (≤3 resultados), explicación del ranking por pesos reales |
| F-201…203 Fichas de establecimiento | vistas/sede.js + GET /api/sedes/:codigo | Indicador por campo: oficial / reportado / pendiente / vencido con fecha |
| F-301…305 Medicamentos | vistas/farmacos.js + POST /api/disponibilidad | Motor de vencimiento 24 h (campo confirmada_ts), comparador genérico vs marca |
| F-401…404 Solicitudes | POST /api/solicitudes + SSE | Línea de tiempo con próxima acción derivada de TRANSICIONES |
| F-501…507 Telesalud y canales | CANALES_AYUDA / CANALES_OFICIALES | Vista propia de canales (T-06), tarjetas grandes + acciones funcionales |
| F-601…610 Equipos e infraestructura | POST /api/incidencias + ficha de sede | Historial de mantenimiento, impacto en servicios vinculados |
| F-801…808 Centro de mando | admin.html + admin.js + /api/admin/metricas | Exportación CSV, informe A3/A5, gráfico de tendencia |
| F-1101…1111 Accesibilidad | aplicarPreferencias, breakpoints 1024/820/480 | Centro de accesibilidad en omnibox, auditoría de teclado |

---

## 5 · TAREAS CONCRETAS, EN ORDEN DE SPRINT

Convención: cada tarea termina con su comprobación. **Ninguna se da por terminada sin
`npm run test:todo` en verde.** Cada tarea termina con commit descriptivo.

### Sprint 1 — Identidad y navegación (días 1–2)

- **T-01** Sistema de diseño: fuentes (§2.1), tokens de color en `app/css/base.css`
  (superficies claras, un acento institucional, estados ok/warn/bad/critico/info/neutro
  sin cambiar de nombre), sprite nuevo (§2.4), purga de emojis con test nuevo.
- **T-02** Inicio-ecosistema (§2.3): carrusel de experiencias + franja de pulso SSE
  + panel «Continuar donde quedaste» + riel colapsable + pestañas de vistas
  + panel contextual derecho.
- **T-03** Onboarding (§3): overlay de 3 pasos.
- **T-04** Omnibox (§2.2): desplegable de sugerencias con z-index, Ctrl+K,
  navegación sin superposiciones.
- Comprobación T-01…04: `npm run test:frontend`, `test:vistas`, captura manual a
  360/768/1440 px del inicio con el desplegable abierto sin tapar contenido.

### Sprint 2 — 3D y datos espaciales (días 2–3)

- **T-05** Órbita universal: `escenas/motor3d.js` gana controles de órbita
  (arrastre rota, rueda acerca, dos dedos panea, doble clic encuadra) aplicados a las
  cuatro escenas y al ADN. Mantener tecla L y degradado <28 fps con aviso.
- **T-06** Vista de canales: tarjetas grandes de CANALES_AYUDA con icono, horario, costo,
  fuente, acción funcional; opciones del 113 como subtarjetas.
- **T-07** ADN interactivo: hélice con textura, rotación en reposo, 9 hotspots que pulsan,
  abren la tarjeta del canal al clic. Rótulo «modelo ilustrativo».
- **T-08** Mapa real: extruir polígonos de `peru_departamental_simple.geojson`, color por
  estado, etiquetas al hover, clic → fly-to + panel derecho.
- **T-09** Corte arquitectónico (bug 13): refactorizar a funciones puras;
  test nuevo en `tests/unit/`.
- Comprobación T-05…09: `npm run test:todo` + prueba manual en Chrome y Firefox.

### Sprint 3 — Funcionalidad que se ve (días 3–4)

- **T-10** Comparador y explicación del ranking (F-101…110).
- **T-11** Vencimiento 24 h (F-301…305): `confirmada_ts`, estado vencida, exclusión de
  «confirmados actuales», histórico preservado.
- **T-12** Estadísticas como consola (queja 9): KPI arriba + gráficos pequeños con
  drill-down, tabla colapsada por defecto, CSV/impresión.
- **T-13** Juegos con consecuencia (queja 14): artefacto real — guía personal imprimible
  con lo aprendido, evento agregado anónimo en el store.
- **T-14** Separación admin/ecosistema (queja 16): auditoría de las 15 vistas públicas.
- **T-15** Asistente que se adapta (queja 18): lee `g3.perfil`, recuerda últimas 5
  interacciones de la sesión, cita fuentes, sin inventar disponibilidad.

### Sprint 4 — Módulos nuevos, versión concurso (día 4)

- **T-16** Centro de notificaciones (módulo 12).
- **T-17** Análisis comunitario (módulo 11): informe imprimible con 12 secciones.
- **T-18** Rutas de distribución (módulo 10): rutas reales entre origen y destinos con
  comparación, etiquetado «estimación declarada».
- **T-19** Consultas remotas (módulo 9): agenda de consultas con estados.

### Sprint 5 — Frescura de datos y cierre (antes del 26)

- **T-20** tools/actualizar-datos.mjs: re-mide FUENTES_ESTADO con fetch y actualiza http +
  fecha; transcripción asistida humana con diff y fuente/fecha/quién antes de escribir.
- **T-21** Cierre: `npm run test:todo` verde; capturas finales;
  `docs/12-cierre-concurso.md` con salida real de pruebas y lista de lo declarado pendiente.

---

## 6 · REGLAS DE ORO

1. No rehusar frente a una tarea: difíciles con tests, presupuesto realista, avisar si no.
2. No inventar datos; si algo falta: «sin dato oficial» + fuente y fecha.
3. No tocar lógica del servidor salvo donde una tarea lo pida.
4. Cero emojis como iconos. Cero cifras sin fuente. Cero botones decorativos.
5. Cada tarea cierra con comprobación y commit descriptivo.
6. Reportar por sprint: qué cambió, qué test lo avala, qué quedó declarado pendiente.

---

## 7 · DEFINICIÓN DE TERMINADO

Una funcionalidad está terminada si:

1. Su propósito es comprensible para el usuario (título, frase de propósito, acción visible).
2. Cumple las 12 comprobaciones del prompt maestro original.
3. Capturas a 360 / 768 / 1440 px en Chrome y Firefox sin superposiciones.
4. Cada cifra visible tiene fuente y fecha, o dice «sin dato oficial».
5. Cada escena 3D rota, acerca y panea; sin WebGL degrada a tabla con aviso.
6. `npm run test:todo` verde con conteos actualizados y justificados.

Fin de las instrucciones. Empezar por el Sprint 1, tarea T-01.
