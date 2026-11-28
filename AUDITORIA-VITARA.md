# VITARA · Activos, territorios y participación

## Revisión vigente · referencias sanitarias en todo el Perú

Petición: investigar y añadir información de otros departamentos, no limitar el atlas a los registros de La Libertad.

**Investigación:** se consultó completa la página oficial MINSA «Solicitar servicios de oftalmología en establecimientos de salud en el Perú» (Gob.pe/14957), incluido su último cambio declarado **14/03/2025**, y el directorio nacional de Gob.pe que cita a RENIPRESS/SUSALUD. Se seleccionaron **45 referencias en los 24 departamentos y Callao** con nombre, dirección y un teléfono publicados; no se atribuyen servicios generales o capacidad actual a partir de una guía de especialidad. El directorio BVS/MINSA apareció en búsqueda pero falló su descarga; no se utiliza como fuente de los registros ni se mezclan sus contactos divergentes.

- `assets/territorios/directorio-salud.json`: datos factuales de selección, identificadores internos (no códigos RENIPRESS), fuente por registro, fecha de fuente separada de la consulta documental 27/11/2026. No se añaden stock, disponibilidad, horarios, categorías clínicas ni coordenadas inferidas. Distritos no transcritos permanecen nulos; Lima conserva los ámbitos DIRIS y Lima Región de la fuente. Los 45 registros incluyen 41 hospitales, 3 centros y 1 instituto según sus nombres, no una clasificación de complejidad.
- `mapa-real.js`: carga local bajo demanda, referencias y accesos rápidos por territorio, buscador por nombre/dirección, filtros de origen/tipo/distrito consignado, conteos explícitos de la selección (no totales sanitarios). Cada nueva ficha usa su fuente específica, dirección y teléfono con advertencia de vigencia, ausencia de horarios/stock y enlaces al documento y al directorio nacional. Se conservan las 25 entidades geográficas y los registros regionales existentes; no se modifica el tablero ni el inventario de La Libertad.
- Fallo de carga distinto de falta de establecimientos, reintento funcional y base regional aún disponible. Los vacíos de filtros no se interpretan como ausencia de servicios. No requiere un servicio de mapas, scraper, nueva clave ni conexión externa durante la exploración: el JSON documentado se distribuye con el proyecto.
- Registro de Fuentes ampliado con el alcance y fechas de esta selección. Metodología pública en `assets/territorios/README.md`. Los contactos de una guía de 2025 requieren reconfirmación antes de desplazarse.
- Servidor: se agrega a la lista pública **solo la ruta exacta** `assets/territorios/directorio-salud.json`. No se habilita la descarga general de JSON, perfiles, solicitudes o credenciales. No hay escrituras de estos registros en Neon ni cambios de autenticación.

**Pruebas:** cuatro nuevas para integridad/procedencia y los 25 territorios, consultas/filtros/inspector/accesos rápidos, error/reintento y móvil. Se actualiza la expectativa histórica del atlas que antes exigía cero registros fuera de La Libertad y el conteo del registro de Fuentes (ahora 10). **Resultado local: 43/43 UI aprobadas** (Chromium, un worker, 7,1 min), 34 comprobaciones de servicios, 96 de seguridad, 61 activos/25 hashes de texturas, build, diff y npm audit (0 vulnerabilidades detectadas). PostgreSQL y despliegue remoto no se revalidan en esta iteración; el almacenamiento no cambia. No se verifica telefónicamente la vigencia ni se afirma una investigación exhaustiva del padrón nacional.

## Revisión anterior · observatorio estadístico creativo

Petición: cambiar de forma sustancial la presentación del tablero, con más animación e interactividad profesional. Se añaden `estadisticas-experiencia.js` y `estadisticas-experiencia.css` después del renderer existente; no se sustituye la arquitectura, los datos, las tablas ni los mapas.

- Cabecera editorial petróleo, menta y amarillo suave: indicador destacado, anillo en escala 0–100 y navegación anterior/siguiente. Los 339 establecimientos se presentan como conteo, sin arco porcentual. Tarjetas numeradas con acentos por tema, medidores a escala real, selección y botón de desglose al inspector existente.
- Filtros Todos/Abastecimiento/Puntos de atención/Cobertura, con contador de indicadores visibles. El indicador destacado se mantiene dentro del grupo activo. Los ocho valores originales se verifican literalmente en pruebas; no hay conteo animado que pase por cifras inventadas ni miniseries ficticias.
- Comparador desplegable de dos de las 12 redes: barras con valores registrados, cálculo explícito `|A − B|` en puntos porcentuales, caso de misma red y aclaración de que no es un ranking de calidad asistencial. Cerrar devuelve el foco al botón de apertura.
- Histórico con anterior/siguiente y reproducción manual de meses reales cada 1,5 s, sin interpolación. Pausa al salir del tablero, ocultar la página, manipular el deslizador o los puntos y activar movimiento reducido. No arranca solo; el control de reproducción se desactiva con movimiento reducido y los controles manuales siguen disponibles.
- Referencia regional de 91 % señalada en las barras; no se presenta como una meta individual certificada por red. Las acciones Fuentes y método y Explorar los 12 meses navegan a destinos funcionales. Repetir animación reinicia únicamente la presentación, sin alterar datos ni hacer solicitudes de red.
- Presentación inicial con revelado escalonado, crecimiento de medidores y trazado del anillo; transiciones de selección y hover. Sin bucles decorativos continuos. Preferencia del sistema y ajuste interno de movimiento reducido respetados. Diseño móvil comprobado a 390 px, también con texto ampliado, sin desborde horizontal.

**Verificación local:** 39/39 UI aprobadas (Chromium, un worker, 6,8 min), incluidas cuatro nuevas del observatorio; 34 servicios, 96 seguridad, 61 activos/25 hashes de texturas, build, `git diff --check` y npm audit (0 vulnerabilidades detectadas). Inspección visual de escritorio y móvil. No se cambiaron backend, credenciales ni registros; PostgreSQL no se revalida en esta iteración de presentación. Despliegue remoto y siete dispositivos físicos no verificados.

## Revisión anterior · atlas completo, espacios y medicamentos

Nueva petición explícita: los puntos del ADN vuelven a tratar medicamentos, no biología. Se conserva el GLB original y se indica que es un soporte visual, sin localizaciones moleculares ni prescripciones. Los cinco temas son genéricos/DCI, verificación de disponibilidad, conservación, uso responsable y vencimiento/trazabilidad. Acciones a búsqueda, solicitudes, fuentes y orientación; portal oficial de DIGEMID enlazado. La respuesta local de orientación describe el cambio.

- Atlas: selector de 24 departamentos y Callao a partir del GeoJSON existente, ficha de forma territorial con atribución MPL 2.0, filtro del directorio por territorio y vacío explícito en lugares sin registros. No se inventan IPRESS ni imágenes departamentales. Se conservan las dos imágenes aportadas, con perspectiva, inclinación al puntero, flotación pausada fuera de vista, zoom y arrastre. Movimiento desactivable y respetuoso de preferencias. Los polígonos no son relieve ni cartografía legal actualizada.
- Bienvenida: «con una» es un grupo de palabras con espacio explícito; ya no depende de ocultar un salto de línea entre palabras contiguas.
- Modelos: seis focos por escena sobre acceso/fachada/cubierta/volúmenes/circulación del hospital, mesa/luminarias/carros/brazos/armarios/superficies del quirófano y estructura/equipamiento de Charité. No se añaden interiores inexistentes al hospital exterior; las anclas siguen siendo temáticas, no coordenadas técnicas verificadas. Charité conserva atribución y restricción no comercial.
- Plano: geometría, cotas y ambientes originales conservados. Seis selecciones por botón o teclado sobre el SVG, ficha explicativa, mobiliario ilustrativo reversible, recorrido conceptual opcional y acercamiento de selección/reencuadre. Se explicita que no acredita cumplimiento normativo ni es un plano de obra/inventario real.
- Accesibilidad: `exploracion-mejoras.js` aplica un aumento del 30 % a textos HTML incluso si sus reglas usan px, solo con `data-texto=grande`. Restaura estilos originales al desactivar, cubre contenido añadido y cambios de breakpoint, sin acumular aumentos. Las letras dentro de imágenes/SVG no se reinterpretan; el plano ofrece zoom y fichas HTML. Preferencia persistente existente y reflujo móvil preservados.
- Entrevista: `ENTREVISTA-SOCIOS-EN-SALUD.md` contiene exactamente tres preguntas exploratorias (barreras, proceso de recursos y evaluación crítica de VITARA). No se ha entrevistado a nadie ni se atribuyen opiniones, colaboración o aval institucional.

**Comprobaciones de esta revisión:** 35/35 UI aprobadas (Chromium, un worker, 6,2 min; incluye tres pruebas nuevas: 25 territorios y estados vacíos, capas/teclado/zoom del plano, texto opt-in/persistencia/restauración y navegación móvil); pruebas 3D existentes actualizadas a los nuevos contenidos. También aprobadas 34 comprobaciones de servicios, 96 de seguridad, 61 activos/25 hashes de texturas, build y npm audit (0 vulnerabilidades). PostgreSQL no se altera ni se revalida en esta iteración de presentación. Las 63 pruebas PostgreSQL pertenecen a la revisión anterior. No se prueba el despliegue remoto ni siete dispositivos físicos.

## Revisión anterior · alcance nacional, lectura y exploración del portal

Petición explícita posterior al panel: retirar La Libertad de la identidad de acceso y marca, suavizar el blanco, corregir texto ilegible en Fuentes, hacer interactivo el tablero, corregir los temas del ADN y ampliar la orientación.

- Acceso y marca identifican Perú. Se conservan los datos de La Libertad con su alcance regional, fuente y corte; no se convierten en estadísticas nacionales. Se elimina la expresión «botones decorativos» del título de Canales.
- `portal-ajustes.css`: base cálida muy leve `#faf8f3`, superficies casi blancas, títulos claros sobre el bloque oscuro de Fuentes y respuestas legibles también al equivocarse en el ejercicio. No cambia el diseño administrativo.
- SISMED: explicaciones de ocho indicadores en inspector, detalle por red, orden ascendente/descendente/alfabético y selector mensual accesible por teclado. Animaciones de barras y línea y hovers, sin interpolar cifras ni fabricar mediciones. Se corrige el span de relleno de barras que no tenía display de bloque. Movimiento reducido conserva el dato final sin animación.
- Cinco puntos sobre el GLB original del ADN: doble hélice, nucleótidos, complementariedad A–T/C–G, información genética y replicación semiconservativa. Se retiran PBP, COX-2, NS1, vacunas y estatinas de ese visor, incluidas acciones de solicitar fármacos. Los puntos se presentan como temas educativos, no localizaciones atómicas verificadas. Se añade enlace educativo NHGRI; no se afirma nueva validación del modelo ni de todos sus átomos.
- `orientation-knowledge.mjs` amplía la guía local: ADN, SISMED, SIS, 113/106, SUSALUD, bienestar mental, dengue, DCI, IPRESS/RENIPRESS, respaldos, alojamiento, IA y fuentes. Prioridad de emergencias preservada; no diagnostica, prescribe ni consulta stock. No se integra un proveedor de IA externo ni se simula IA general. Preguntas desconocidas y fallos conservan respuestas honestas. El módulo no se publica por HTTP; el chat no guarda historial persistente.

**Verificación:** 32/32 UI aprobadas (Chromium, un worker, 5,7 min), incluidas cuatro nuevas de identidad/ADN, indicadores/redes/meses, contraste/canales/móvil y conocimiento/urgencias/IA no configurada. También 34 comprobaciones de servicios, 96 de seguridad y 63 de PostgreSQL con base local desechable, 61 activos/25 coincidencias de texturas, build, diff y npm audit 0 aprobados. Inspección visual de Fuentes y gráfico; ningún dato de prueba se escribe en Neon. No son siete dispositivos físicos ni certificación clínica/WCAG.

Se actualiza la misma rama y PR #1, sin fusionar main. El usuario debe esperar el despliegue de este nuevo commit en Render y verificar el portal real; no se modifican secretos ni se garantiza el resultado remoto por las pruebas locales. Entrevista aún sin archivo recibido, no añadida.

## Revisión anterior · renovación del panel administrativo

El usuario eligió renovar **solo administración**, no el portal público. Se conserva el backend, PostgreSQL/JSON, autenticación, datos, modelos y rutas. El usuario aportó capturas de Render con despliegue exitoso, `/api/salud` operativo en modo `publico_postgres` y acceso administrativo correcto en https://vitara-oficial.onrender.com. No se recibió ninguna contraseña ni conexión privada. La persistencia tras reinicio del alojamiento, recuperación integral y siete dispositivos físicos siguen sin acreditarse.

- Nuevo `admin-panel.css`: paleta clara crema/menta con petróleo, contraste explícito, tipografía sans real (se elimina la referencia indefinida anterior), navegación lateral y adaptación móvil, tarjetas de resumen, login y diálogo coherentes. Se extrae el CSS anterior incrustado sin sustituir el proyecto ni cambiar los modelos del portal.
- Hover de elevación, flechas de navegación y giro de motivo decorativo; interacción por teclado, foco visible, fondo inerte y foco contenido en diálogos; Escape/cancelar devuelve el foco al botón de respuesta. Movimiento reducido y dispositivos sin hover tienen alternativas sin movimiento innecesario. No es certificación WCAG.
- Bandeja con búsqueda local sobre registros ya autenticados, filtros con `aria-pressed` incluido Cerradas, estados diferenciados, vacío orientador y error de consulta distinto de cero registros. Actualizaciones muestran conexión/reconexión real, no un indicador siempre activo.
- Se retira del resumen el 339 estático que parecía un conteo operativo. Se conserva en el portal su catálogo de referencia. No se inventan métricas, sedes por defecto ni disponibilidad: responder no significa stock confirmado, y las respuestas se atribuyen al equipo, no a una entidad pública.
- Perfiles, actividad consentida y borrado conservados; guía de prueba al final, reglas técnicas plegables y advertencia/confirmación antes de restaurar solicitudes. La descarga explica que no contiene perfiles ni credenciales.
- Entrevista a un funcionario de Socios en Salud propuesta por el usuario, **todavía no recibida ni integrada**. Pendientes archivo/enlace, identidad/cargo y autorización para publicación; no se inventan citas ni respaldo institucional.

**Verificación de esta revisión:** 28/28 pruebas UI aprobadas (Chromium, un worker, 5,2 min), incluidas cuatro nuevas de panel: acceso/estado real/navegación/CSP, filtros/búsqueda/respuesta con teclado/exportación/logout, móvil 390 y 320 px sin desbordamiento, y fallo de consulta sin conteos ficticios. Además 34 comprobaciones de servicios, 96 de seguridad, 61 activos/25 texturas SHA-256, build y npm audit 0 aprobados. Inspección visual de acceso, escritorio y móvil mediante capturas de almacenamiento temporal aislado: ningún registro de prueba se creó en Neon ni en la preview. El adaptador PostgreSQL no se modificó; sus 63 pruebas y CI del commit anterior terminaron aprobados, no se presentan como reejecutadas en esta revisión.

Subida en la misma rama de sesión/PR #1, sin fusionar main. El nuevo diseño requiere desplegar este commit en Render y verificarlo allí: la prueba local no confirma automáticamente la actualización pública. No se modifican los secretos del proveedor.

## Revisión anterior · PostgreSQL opcional y preparación Render + Neon

27/11/2026. El propietario creó el proyecto Neon VITARA Free. **No se ha conectado esta sesión a su base ni desplegado Render; no existe una nueva URL pública comprobada.** Guía paso a paso: `DESPLEGAR-RENDER-NEON.md`. No se pidieron ni publicaron contraseñas o cadenas de conexión.

- Adaptador `pg` opcional con TLS de certificado verificado y parámetros de URL sin posibilidad de sustituir SSL/host. La excepción sin TLS exige simultáneamente entorno test, autorización explícita, loopback y no estar en Render. No se usa la excepción en despliegue.
- Dos documentos JSONB privados en PostgreSQL, inicialización transaccional, copia de estado aislada, cola acotada de operaciones y revisión SQL optimista. Se espera confirmación antes de responder éxito o emitir eventos. Conflictos de otra instancia producen 409; los errores no cambian a JSON ni se muestran como registros guardados.
- Sin `DATABASE_URL`, se conserva el almacenamiento JSON privado local y las funciones previas. Render se niega a iniciar sin conexión PostgreSQL; evita perder registros por su disco efímero. Las bases local y nube no se sincronizan ni importan archivos automáticamente.
- Refresco del estado antes de operaciones persistentes, límites de cuerpo conservados (16 KiB participación / 1 MB solicitudes y respaldo), comprobación de salud SQL y cierre de conexiones en SIGTERM. Sesiones y SSE siguen por proceso: recomendado un único servicio; reiniciar requiere relogin administrativo.
- Nuevo test PostgreSQL crea y elimina su propia base aleatoria exclusivamente en un servidor local de pruebas. GitHub Actions incorpora PostgreSQL desechable, no credenciales de Neon. No se incluyen binarios, bases ni participantes de ensayo en el repositorio.

**Resultados locales de esta revisión:** 63 comprobaciones PostgreSQL aprobadas (persistencia tras reinicios Node, actividad, siete clientes concurrentes, capacidad, idempotencia, respuesta, respaldo/restauración, eliminación, hash administrativo persistido, conflictos, fallos sin fallback, salud y SSL obligatorio); 34 de servicios y 96 de seguridad aprobadas en JSON local. **24/24 pruebas UI aprobadas** (Chromium, un worker, 5,2 min). Inventario de 61 activos y 25 hashes de texturas, build, sintaxis y diff aprobados; npm audit: 0 vulnerabilidades conocidas. Son pruebas locales, no una auditoría de la infraestructura de Neon/Render ni siete dispositivos físicos.

Pendiente: introducir secretos solo en Render, desplegar esta rama, verificar HTTPS/conexión real, reinicio y recuperación del alojamiento, enlace con laptop apagada, ensayo LAN sin WAN y siete dispositivos físicos. Respaldo de solicitudes no incluye participación: la recuperación integral PostgreSQL exige un respaldo privado separado y un ensayo de restauración. No se han cambiado facturación, firewall Windows ni router; no se ha configurado IA externa. Licencias originales intactas.

## Revisión anterior · equipo, entrada multicolor y panel automático

Petición del usuario: incorporar nombres, ampliar animaciones, reforzar protecciones y revisar solicitudes/panel antes de volver a subir.

- Nombres proporcionados por el usuario: **Daniela Arce, Dharma Valle, Zoe Cabrera y Rafael Carbajal**, incorporados en Fuentes / Equipo y README. Se conserva una distribución de roles propuesta para confirmar, sin inventar responsabilidades acordadas.
- Entrada con seis colores (menta, cian, violeta, coral, dorado y verde), partículas del logo durante el ensamblaje, símbolos de salud diferenciados, órbitas con cometas, aurora, señal expansiva suave y parallax de cursor. El logo mantiene su identidad al completar el ensamblaje. Respeta movimiento reducido, salto, pausa al ocultar y móviles. Sin nuevos archivos multimedia pesados. Inspección visual estática en 1440 y 390 px, sin errores de página/desbordamiento. Una captura dinámica headless agotó su tiempo por composición; se repitió con movimiento reducido, videos detenidos y espera de carga/dibujo, no se presenta como prueba de rendimiento en dispositivos físicos.
- Participación genera avisos SSE **sin datos personales** al registrar, cambiar actividad y borrar. El panel hace una consulta autenticada y mantiene respaldo cada 15 s. Prueba del servidor real confirma aparición del perfil y del evento sin clic manual. Consultas cancelables y revisiones de sesión descartan respuestas antiguas tras logout; se limpian listas y formulario de respuesta.
- Nueva prueba de principio a fin: formulario de visitante → código persistido → aparición automática en panel → respuesta administrativa → seguimiento de visitante incluso tras recargar y volver a entrar. Se corrigió que la categoría `servicio` se redujera a medicamento y se retiró la invitación a consultar un código de muestra inexistente. Las pruebas no crean datos en la preview.
- Se limita SSE a **16 conexiones por IP** y 80 globales; 200 conexiones TCP máximas, además de los controles previos. Rechazo comprobado del stream 17 desde una IP. No se anuncia resistencia universal a ataques ni se modifica el router/firewall del usuario. Nueva guía `RED-SEGURA-CONCURSO.md`, incluida regla Windows limitada a Node/puerto/subred privada y cómo retirarla.
- Charité se conserva por petición del usuario, con autoría y condición CC BY-NC 4.0 intactas. “Descarga libre” no elimina la condición no comercial. No se inventan permisos para otros medios aportados.

### Verificación de la ampliación

**24/24 UI aprobadas**, suite completa, Chromium, un worker, 4,9 min; **96 comprobaciones de seguridad/integración**, **34 de servicios**, **61 activos** y 25 coincidencias de texturas SHA-256. `npm audit` sin vulnerabilidades conocidas, build y diff sin errores. Las pruebas de administración se migraron de proxies híbridos a procesos reales aislados: un token de un servidor no debe aceptarse en otro. Se mantuvo esa protección y se corrigió el montaje de pruebas, no se relajaron permisos.

El CI de GitHub de la entrega anterior terminó **aprobado**: [ejecución 46066727793](https://github.com/danielaarcegarcia3-source/VITARA-OFICIAL/actions/runs/46066727793). El nuevo commit debe ejecutar sus propios controles; no extrapolar el resultado anterior. Continúan pendientes el enlace público completo, el ensayo de siete dispositivos físicos y confirmación de permisos de medios aportados. Código se sube a la misma rama/PR #1, sin fusionar main.

## Revisión anterior · consigna, seguridad y preparación para GitHub

Se leyó íntegramente el PDF de la consigna aportado el 27/11/2026. Matriz en `CONSIGNA-CUMPLIMIENTO.md`; no se declara cumplimiento total ni se contrata un servicio de pago.

- Se detectó y corrigió una exposición real: los SSE públicos incluían códigos privados, recursos, alias y respuestas. Ahora solo invalidan y comunican contadores; el panel consulta registros con autorización. Nueva prueba UI del servidor real confirma actualización automática, escape HTML de un registro histórico y borrado autorizado.
- Se corrigió DELETE en el router principal, la validación de origen de rutas antiguas y la confianza en forwarded-host. Escape de salida del panel, CSP con hashes de scripts conocidos, límites de cuerpo y timeouts, escritura confirmada antes de actualizar memoria, arranque cerrado ante corrupción y códigos generados con crypto. Reintentos con clave aleatoria, no por coincidencia de alias/texto de otro usuario.
- Solicitudes nuevas en `data/` o volumen privado. La base histórica de la raíz sigue localmente y se ignora en Git: no se publica ni importa automáticamente. Las credenciales de configuración y perfiles siguen ignoradas. No se han creado cuentas reales ni participantes ficticios en la preview.
- Los SDK de Firebase no tenían imports activos: retirados sin actualizar a ciegas. **npm audit completo: 0 vulnerabilidades conocidas**, frente a 21 iniciales. Firestore inactivo cerrado por defecto. El firewall se describe como filtro HTTP básico, no como blindaje ni certificación de red.
- Créditos distribuidos en `CREDITOS.txt`, licencia Apache 2.0 de Draco añadida y comprobada procedencia de sus archivos glTF frente a Three 0.158.0. Derechos de medios aportados no acreditados por la herramienta: confirmación del propietario pendiente. Charité sigue bajo condición no comercial. No se inventan permisos.
- Herramientas históricas de “prueba” que ejecutaban un servidor simulado sustituidas por entradas al test del servidor real, con datos aislados. Matriz V&V y afirmaciones obsoletas de 12 dispositivos/tiempos/certificación actualizadas. Se prepara workflow CI de lectura, sin secretos y con acciones fijadas por commit; su ejecución remota depende de permisos/disponibilidad de GitHub y no se asume aprobada por haber pasado localmente.

### Resultados locales finales

**23/23 pruebas UI aprobadas** en Chromium headless, un worker, 5,0 minutos. **88 comprobaciones de seguridad/integración** del servidor real, **34 de servicios**, **61 activos** y 25 texturas SHA-256 dentro de los GLB. **0 alertas conocidas en npm audit**, build y `git diff --check` aprobados. El test integrado usa siete clientes SSE simultáneos y siete registros concurrentes: no son dispositivos físicos.

### Pendientes de entrega y despliegue

Subida explícita comprobada: commit de implementación `07b7f3043744e60bd9d59df684fdc7e2158cc961` en origin/arena/ccf66afb-vitara-oficial. [PR #1 abierto y fusionable](https://github.com/danielaarcegarcia3-source/VITARA-OFICIAL/pull/1); main sin fusionar. GitHub inició la verificación automática, cuyo resultado debe consultarse en el PR. No confundir las pruebas locales aprobadas con un resultado remoto aún pendiente. No fusionar `main` ni activar un despliegue estático como sustituto de Node. Falta publicar y verificar un enlace gratuito completo, identificar cuatro integrantes con sus nombres autorizados, confirmar permisos de medios aportados y ensayar siete dispositivos físicos, LAN sin WAN y recuperación integral. Sin proveedor externo de IA ni datos clínicos reales. La consulta de configuración administrativa de Actions devolvió 403; no se cambiaron políticas ni facturación.

## Revisión anterior · globo electrónico, cierres y puntos 3D

- Se incorporó la imagen `image-2.png` aportada por el usuario como `assets/welcome/globo-referencia.png`, combinada con una rejilla proyectada y señales electrónicas. El logo oficial se ensambla en el centro del globo. Los seis iconos de salud ahora también se muestrean y ensamblan a partir de partículas: no aparecen solo como trazos ya dibujados. Nuevo módulo completo `bienvenida-holografica.js`, con límite aproximado de 30 fps, pausa al ocultarse, secuencia de 9 segundos, salto y estado estático para movimiento reducido. No es un nuevo mapa legal ni un modelo clínico.
- Fallo concreto corregido: `#inspector-close` existía sin listener. Ahora cierra el inspector, elimina el estado dividido y restaura el foco. Se añadieron cierres explícitos al menú móvil y a la paleta de navegación; se verificaron fondo, Escape, pestañas, notificaciones y diálogos. Cancelar la edición de perfil no guarda valores. Los diálogos nativos ya no disparan simultáneamente el Escape de las capas del fondo.
- Se ampliaron hospital, quirófano y Charité de 3 a **6 focos educativos cada uno**: **18 puntos** entre esos tres visores. Los cinco puntos del ADN se conservan. Se añaden accesibilidad, preparación, privacidad, dispositivos, consumibles, mantenimiento, trazabilidad y licencia; no se infiere ubicación técnica certificada de componentes ni estado real de una sede. Los GLB se mantienen intactos.
- Se comprobó el estado del remoto: los cambios de esta sesión continúan **sin commit ni push**, y la rama de sesión aún no existía en `origin` al consultar. No se ha publicado el sitio ni cambiado `main`. Nuevo documento `PUBLICAR-VITARA.md` distingue código en Arena, subida a GitHub, alojamiento estático y plataforma Node completa.
- Se permite configurar almacenamiento de solicitudes en un volumen privado mediante `VITARA_REQUESTS_FILE` o `VITARA_DATA_DIR`, conservando por defecto el archivo local original. No se migraron ni borraron datos existentes automáticamente.

### Validación vigente

**22/22 pruebas UI aprobadas** en Chromium headless, un worker, 4,9 minutos; incluyen todos los cierres citados, ensamblaje real del logo y símbolos, móvil y las seis fichas de cada quirófano (incluido abrir/cerrar el último capítulo). **34 comprobaciones de servicios**, **58 activos verificados** y 25 texturas coincidentes por SHA-256 con sus GLB. Build y `git diff --check` sin errores. Inspección visual del globo con logo central en 1440 px y 390 px, sin errores de página.

Siguen pendientes antes de un uso público con datos reales: revisión de vulnerabilidades del árbol existente, permisos de publicación de medios y licencia no comercial de Charité, validación de fuentes sanitarias, HTTPS, secretos y volumen persistente del alojamiento. Ningún resultado se presenta como una auditoría de producción ni una prueba clínica. El proveedor externo de IA sigue sin configurar.

## Ampliación anterior · dispositivos, ayuda y acceso administrativo

Se conserva la revisión anterior y se añade una vista nueva `tecnologia`, enlazada al menú, pestañas, paleta y registro consentido de visitas. `descubrir.js/css` contiene la galería y las nuevas experiencias sin sustituir los módulos originales.

- **4 ilustraciones IA nuevas** (monitor, ecógrafo, bomba de infusión y DEA), declaradas como genéricas y no comerciales. Fichas modales con tres puntos temáticos por dispositivo; búsqueda y filtro, selección de hasta tres dispositivos, tabla de comparación educativa, lista personal de seis preguntas y descarga de una lista de consulta. No hay precios, especificaciones inventadas, stock o cotizaciones.
- **4 referencias de fabricantes** con enlaces oficiales: Philips, Siemens Healthineers, Dräger y B. Braun. Fuentes y limitaciones en `assets/devices/README.md`. No se afirma representación local, autorización, registro sanitario, alianzas ni equivalencia entre imágenes y productos. La referencia de B. Braun se confirmó por resultado de búsqueda del sitio oficial; la extracción completa de esa página falló.
- **Canales**: selector de intención con cinco rutas, menú interactivo de siete opciones del 113, checklist de preparación sin captura de síntomas y tarjeta de contactos VCF. Se corrigió el menú antiguo en la base existente, particularmente salud mental (opción 5), SIS (opción 4), Hospital Digital (opción 2) y SUSALUD (opción 7), siguiendo el portal oficial del MINSA consultado el 27/11/2026. La orientación no es triaje y la emergencia tiene acción directa sin cuestionario.
- **Fuentes**: taller de trazabilidad de cuatro temas y tres etapas (origen/contexto/límites), tres ejercicios de lectura crítica con respuesta explicada, búsqueda de las nueve fuentes existentes y guía de administración. Se conservaron la tabla, sus cifras, fuentes y fechas históricas.
- **Bienvenida**: se suman seis símbolos de salud vectoriales (cruz, pulso, hélice, cápsula, estetoscopio y corazón) con conectores y señales en movimiento alrededor del logo de partículas. Se respetan el salto y movimiento reducido.
- **Acceso al panel**: enlace directo en el menú, formulario inicial abierto cuando está autorizado, guía de prueba de tres pasos y clave aleatoria de configuración habilitada solo en el servidor de la vista previa. La clave se entrega en un archivo privado dentro de `data/`, excluido de Git, build y HTTP; no hay usuario o contraseña de cuenta precreados. El propietario elige sus credenciales, no las comunica en el chat. La configuración se cierra tras crear el primer administrador. Las pruebas NO crean el administrador de la vista previa.

### Verificación actual de la ampliación

- **19/19 pruebas UI aprobadas**, Chromium headless, un worker, 3,6 minutos. Incluyen las 13 regresiones previas y seis nuevas pruebas de alta inicial guiada, dispositivos/filtros/hotspots/comparación/descargas, proveedores/teclado, ayuda/113/contactos, transparencia/quiz/fuentes y adaptación móvil.
- **34 comprobaciones de servicios aprobadas** en almacenamiento aislado, incluyendo visitas al nuevo módulo. Las cuentas y siete perfiles de prueba se eliminan al terminar; no se añaden registros ficticios al portal.
- **56 activos verificados**, incluidos los cuatro dispositivos nuevos, y 25 texturas con coincidencia SHA-256 dentro de sus GLB originales. `npm run build` y `git diff --check` sin errores.
- Inspección visual de dispositivos, canales, fuentes, bienvenida ampliada y alta administrativa. Sin errores de página en esa inspección; anchura móvil comprobada a 390 px.
- No se configuró un proveedor externo de IA ni se altera esa limitación previa del chat. No se ejecutó la suite histórica que genera solicitudes. No se afirma una auditoría WCAG ni validación en dispositivos físicos.

## Revisión anterior · territorios y participación

- Perú: **25 polígonos departamentales** y La Libertad: **12 polígonos provinciales**, extruidos con Three.js. Geometría GeoJSON simplificada de `juaneladio/peru-geojson` (MPL 2.0), no siluetas manuales. Fuente, derivación y hashes en `assets/geo/README.md`. Listado con teclado, selección, giro, zoom y alternativa 2D. Colores categóricos y altura visual, no stock ni topografía. Tablas sanitarias e imágenes originales conservadas.
- Bienvenida: **3.374 partículas** muestreadas del logo oficial, convergencia electrónica, trazas y HUD. Salto, repetición, pausa al ocultarse y movimiento reducido. Base blanca predeterminada con opción editorial persistente.
- Formulario ampliado con correo y territorio opcional. Sincronización voluntaria con consentimiento, máximo **7 perfiles**, retención de 30 días. API y persistencia atómica privada en `data/participacion.json`; no se han añadido usuarios de muestra al portal. Datos y clave de dispositivo eliminables desde Participación. El correo no está verificado.
- Administración autenticada: perfiles, correo, presencia reciente y hasta 200 interacciones por persona. Actualización cada 15 s; sin textos de búsquedas ni chat. Retirados el contador de dispositivos simulados, las credenciales públicas y los accesos/confirmaciones locales que fingían éxito sin servidor. Tokens aleatorios de 8 h, hash scrypt para el administrador creado por configuración inicial. Requiere secretos del operador; sin ellos el acceso permanece cerrado.
- Chat funcional de guía local, con límites explícitos. Adaptador de IA externa por endpoint HTTPS compatible con Chat Completions, clave/modelo privados en el servidor y consentimiento en el chat. **No se ha configurado ni probado un proveedor externo**: no se afirma que ya responda preguntas generales mediante IA. La guía local no inventa respuestas. Mensajes no persistidos por VITARA; si se activa un proveedor este recibe la consulta. Ver requisitos de red y privacidad en `CONFIGURACION-VITARA.md`.
- Detectado y corregido un fallo real de concurrencia: el limitador antiguo consumía el mismo presupuesto de 180 solicitudes/min para imágenes, scripts, modelos y API. Cargas sucesivas detrás del proxy podían impedir iniciar la bienvenida. Ahora separa activos (1800/min) y API (180/min) por IP, además de los límites propios por operación.

### Resultado de validación de esta revisión

- **13/13 pruebas UI aprobadas**, Chromium headless, un worker, aproximadamente 3 minutos. Incluyen registro consentido, consulta y borrado; administración con 7 registros temporales aislados y cierre; mapas 25/12, tema y chat; y las 10 regresiones del ecosistema anterior, incluidos los GLB originales.
- **33 comprobaciones de servicios aprobadas**: persistencia real tras reconstruir el servicio, 7 registros aislados, capacidad, autorización, origen, consentimiento, actividad permitida, eliminación y chat local. Directorios temporales eliminados al terminar; ningún usuario ficticio en el portal.
- **52 archivos verificados**, 25 texturas coincidentes por SHA-256 con sus GLB y hashes/número de features geográficas comprobados.
- `npm run build`, comprobaciones de sintaxis y `git diff --check` sin errores. Capturas de inspección visual de bienvenida, formulario, ambos mapas y chat; ningún error de página en esa inspección.
- No se ejecutó la suite histórica que modifica solicitudes. Las pruebas UI son de escritorio y viewport móvil en Chromium, no certificación WCAG ni verificación física de siete equipos.

### Archivos añadidos en esta revisión

`territorio-3d.js`, `assets/geo/*`, `conexion.js/css`, `server-services.mjs`, `admin-participacion.js/css`, `tests/conexion.spec.js`, `scripts/test-services.mjs` y `CONFIGURACION-VITARA.md`. Se integran en los módulos existentes sin reescribir el proyecto.

## Integración de activos de la revisión anterior

Se recuperaron **solo los tres archivos añadidos** en el commit remoto `49dbae0` («archvios extra») de `origin/main`, sin cambiar de rama ni sobrescribir la aplicación modificada:

| Archivo | Tamaño exacto | Uso |
|---|---:|---|
| `VIDEOBANNER.mp4` | 34 526 219 bytes | Fondo original del acceso, silenciado y con control de pausa |
| `hospital_operating_room.glb` | 30 706 944 bytes | Sala de operaciones, en Equipamiento |
| `modelodehosipitalvisitaVR3D.glb` | 46 555 604 bytes | Recorrido educativo del quirófano Charité, en Planos |

**Aclaración de identidad:** el archivo llamado «visitaVR» contiene «Charité University Hospital – Operating Room» de ChrisRE. No es una habitación de hospitalización. Se muestra su identidad real y la licencia **CC BY-NC 4.0, uso no comercial**. El otro quirófano es de Chenchanchong, CC BY 4.0. Sus metadatos se leyeron directamente de los GLB.

## Arranque

El checkout tiene `index.html`, scripts, estilos, servidor y activos **en la raíz**.

```bash
npm install
npm start
```

Abrir `http://localhost:3000`. El servidor escucha en `0.0.0.0`; el navegador usa rutas relativas para la API. El panel institucional permanece en `admin.html`.

La interfaz también puede abrirse con Live Server desde la raíz. La presentación estática no sustituye las API Node, la persistencia de solicitudes ni SSE.

```bash
npm run build
```

Produce `dist/frontend/`, configurado para Firebase Hosting. No incluye `solicitudes.json`, el servidor ni dependencias Node. Las reglas Firestore existentes permanecen en `rules.rules`. No se añadieron credenciales ni se activaron servicios remotos.

## Nueva dirección visual e interacción

- Paleta combinada: **turquesa, amarillo suave, coral, azul petróleo y verde**, sobre fondo cálido.
- Hero editorial con tipografía de contraste y arco de visualización del ADN real.
- Splash con logo original, líneas de conexión animadas, nodos temáticos, progreso y opción de saltar.
- Secuencia de acceso mantenida: **bienvenida → nombre/rol local → ecosistema**. Puede volver a verse la bienvenida desde el acceso.
- El video del acceso se activa después del splash. Tiene pausa/reproducción manual, fallback gráfico y respeto por la preferencia de movimiento reducido.
- Selector «Conecta a tu manera»: medicamento, orientación y territorio; contenido e imagen contextual, navegación con teclado y acciones hacia módulos existentes.
- Galería editorial de los tres espacios clínicos con **capturas de sus modelos reales**, no imágenes generadas.
- Índice de espacios 3D y recorrido por capítulos.
- Tres puntos educativos por cada espacio clínico, proyectados desde coordenadas del modelo a pantalla; conservan su relación espacial al girar y acercar.
- Fichas tipo presentación interactiva: abrir/cerrar, anterior/siguiente, pregunta contextual, acción relacionada y contador de puntos visitados en esa sesión del visor.
- Los cinco puntos del ADN conservan su información original y añaden anterior/siguiente.
- Composiciones de galería, bandas, rutas editoriales, listas, fichas y tarjetas con perfiles distintos; no se uniformó toda la aplicación en una cuadrícula de tarjetas iguales.
- Estados de error con reintento y contenido accesible. No se fabrican modelos de respaldo con geometría primitiva.

Los puntos son **focos educativos**: no son un inventario técnico certificado, una identificación clínica automática ni una auditoría del quirófano. El movimiento de cámara es una ayuda de exploración, no un recorrido físico validado.

## Motor 3D y rendimiento

Motor oficial Three.js con GLTFLoader, DRACOLoader y OrbitControls, normalización por Box3, centrado y ajuste de escala. Los decodificadores se sirven localmente para que el funcionamiento LAN no dependa de un CDN externo.

- Los GLB grandes solo se descargan cuando la persona pulsa cargar.
- Progreso de descarga real en bytes y porcentaje cuando existe Content-Length.
- Los espacios clínicos no giran automáticamente al cargar; se puede activar la rotación con un botón.
- Renderizado bajo demanda: cambios de cámara, resize o transición de ficha. No se vuelve a dibujar continuamente un espacio que permanece inmóvil.
- Se pausa el renderizado de los espacios fuera de vista, con el acceso superpuesto o con la pestaña del navegador oculta.
- Densidad de píxel limitada a 1.5 en los espacios clínicos.
- Se conserva la geometría y los materiales originales; no se han sustituido los archivos grandes por modelos simplificados ficticios.
- Soporte HTTP Range para multimedia y Content-Length en archivos, de modo que el video pueda solicitar fragmentos en lugar de descargarlo completo antes de empezar.
- Caché revalidable para JS/CSS/JSON y versión de recursos de esta edición para evitar cargar código antiguo en la vista previa.

Se probaron los cuatro GLB presentes y el hospital glTF con sus texturas externas. Draco está configurado; no se afirma haber probado un archivo comprimido que no figure en este inventario.

## Uso de todos los activos gráficos

`assets-manifest.json` contiene el inventario y sus asociaciones actuales.

| Activo | Integración |
|---|---|
| `logo VITARA.jpeg` | Bienvenida, acceso, marca sobre el riel lateral, favicon y pie |
| `adn.glb` | Hero con interacción molecular |
| `low_poly_hospital.glb` | Hospital exterior con puntos educativos |
| `scene.gltf` + `scene.bin` | Fuente alternativa del mismo hospital, no un modelo distinto |
| `hospital_operating_room.glb` | Quirófano con capítulos, fichas y controles |
| `modelodehosipitalvisitaVR3D.glb` | Charité, con capítulos, fichas y atribución no comercial |
| `MAPADELALIBERTAD3D.png`, `mapadelperu3d.png` | Atlas, territorio y rutas contextuales |
| `imagenmanosysalud.jpg` | Atención humana, fondo de respaldo del acceso y comunidad |
| `manomedicadeco.png` | Orientación y ruta de asistencia, sin diagnóstico automatizado |
| `pastillasbotedeco.png`, `pastillasdeco.png`, `pastillasdeco2.png` | Buscador y ruta de medicamentos |
| `suerodeco.png` | Banda de insumos, acceso funcional al buscador |
| `VIDEOBANNER.mp4` | Acceso personalizado |
| `videobannerBUSCADOR.mp4` | Ambiente del buscador |
| `videoparabanner.mp4` | Comunidad y orientación |
| `GIF BANNER.gif` | Acento de comunidad, oculto al reducir movimiento |
| `MUSICADEFONDO.mp4` | Audio flotante bajo demanda, volumen, play/pause y onda |

### Todas las texturas están asociadas

Se extrajeron los bloques de imagen embebidos de los GLB y se compararon mediante **SHA-256** con las imágenes sueltas:

- Texturas Adenine / Double_helical → ADN.
- Colore y Names_and_details → hospital exterior; además son referencias externas del `scene.gltf`.
- Mat3d66, Standard, Material_70 y reflector → quirófano de Chenchanchong.
- Mitte_OP_Tex1 a Tex4 → quirófano Charité.

`unassignedTextures` queda vacío. Estas imágenes ya se utilizan dentro de los materiales de sus modelos; descargarlas otra vez o asignarlas arbitrariamente a otras superficies no sería una integración correcta.

Las miniaturas en `assets/previews/` son renders de los modelos originales. Sus autores, fuentes y licencias se indican en la galería y en `assets/previews/README.md`.

## Archivos principales

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Documento único, acceso y todas las vistas/formularios existentes |
| `ecosistema.css` / `ecosistema.js` | Base visual anterior, perfil local, medios y reproductor |
| `experiencia.css` / `experiencia.js` | Segunda dirección editorial, rutas contextuales, galería, bienvenida y navegación de capítulos del ADN |
| `model-hotspots.js` | Motor de puntos educativos, fichas, cámara, capítulos y estados visitados |
| `vitara-spaces.js` | Carga de modelos, progreso, renderizado bajo demanda y controles |
| `vitara-home.js` | ADN original y su información molecular |
| `src/engine3d.js` | Fuente del motor oficial y utilidades de encuadre |
| `vendor/vitara-three.js`, `vendor/draco/` | Motor empaquetado y decodificadores locales |
| `mapa-real.js` | Atlas e inventario territorial filtrable |
| `server.mjs` | API, persistencia y SSE conservadas; rutas reales, MIME, Range y bloqueo de archivos privados |
| `scripts/build-static.mjs` | Distribución estática sin datos privados del servidor |
| `tests/ecosistema.spec.js` | Pruebas de navegación, modelos, medios y adaptación móvil |

## Correcciones de base que se conservan

- Se eliminó la segunda copia idéntica de `index.html`, sin perder ningún ID funcional original.
- Se repararon las rutas inexistentes a `frontend/`, `backend/`, `css/`, `js/` y `assets/3d/` del checkout original.
- La base existente `solicitudes.json` no se borró ni se reescribió. Un almacenamiento nuevo empieza vacío, sin solicitudes inventadas.
- Se reparó la escala inicial del ADN y el encuadre de los espacios.
- Se habilitaron texturas blob y WebAssembly de manera acotada en la CSP; la vista previa puede embeberse en los dominios Arena/E2B declarados.
- Se sustituyó la constelación de esferas por un atlas de los mapas originales. El atlas original y las tablas territoriales siguen disponibles; la nueva revisión reemplaza las siluetas esquemáticas por polígonos reales.
- Los contenedores de mapas tienen altura explícita y recálculo al abrir su vista.
- Los datos del servidor no se sirven como archivos estáticos.

## Datos, mapas y privacidad

No se añadieron cifras sanitarias, pacientes, existencias ni establecimientos inventados. Se conservaron las fuentes y fechas declaradas en el proyecto. Eso **no equivale a una nueva verificación independiente** de sus cifras.

Los mapas originales son ilustraciones sin georreferenciación. No se colocaron rutas arbitrarias como si fueran indicaciones reales. El visor territorial nuevo usa los polígonos GeoJSON simplificados descritos arriba. El directorio usa únicamente la base local y no afirma contener los 339 registros completos.

El nombre de usuario se guarda en `g3.perfil` del dispositivo y no se envía a la API de solicitudes. En la revisión vigente se añade una API separada para sincronizar el perfil solo con consentimiento. Es personalización, **no autenticación**; el rol elegido no concede permisos institucionales. Cerrar la sesión retira el nombre y pausa el audio. Se conserva la opción de borrar todos los datos locales.

## Verificación

```bash
npx playwright install chromium
npm test
```

También puede usarse un navegador instalado:

```bash
CHROMIUM_PATH=/ruta/al/chromium npm test
```

**10 regresiones de la revisión anterior, incluidas en las 13 aprobadas actualmente**:

1. Secuencia, validación del nombre, persistencia y cierre.
2. Diez vistas, búsqueda, atlas, filtros y fichas.
3. ADN/hospital reales, glTF externo, encuadre y hotspots.
4. Navegación móvil a 390 px y ausencia de desbordamiento horizontal.
5. Recursos públicos y bloqueo de archivos privados.
6. Fallo del ADN sin sustituto ficticio.
7. Audio pausado inicialmente, volumen, IDs únicos y movimiento reducido.
8. Ambos quirófanos nuevos: carga real, fichas, anterior/siguiente, capítulos y cierre con Escape.
9. Selector editorial por teclado, galería bajo demanda y bienvenida repetible.
10. Inventario completo, miniaturas, solicitudes Range y rechazo de rangos inválidos.

Las pruebas no crean solicitudes ni ejecutan la suite histórica de concurrencia. Esta sigue disponible como `npm run test:concurrency`, solo para una copia de pruebas porque genera solicitudes de demostración.

## Límites antes de producción

- El archivo VR subido es un quirófano, no una habitación de hospitalización; para un recorrido de habitación hará falta ese modelo específico.
- La licencia de Charité es no comercial. Revisar autorización antes de un uso comercial.
- Revisar las fuentes sanitarias y fechas contra documentos oficiales.
- Configurar credenciales administrativas por variables de entorno y revisar el endurecimiento del servidor antes de publicarlo. El acceso por nombre no sustituye la autenticación institucional.
- En la revisión inicial, `npm audit --omit=dev` detectó 21 vulnerabilidades en el árbol existente (1 baja, 9 moderadas, 10 altas, 1 crítica). No se aplicó una migración forzada que pudiera romper Firebase.
- No se afirma una auditoría completa WCAG, una prueba física multi-dispositivo ni compatibilidad verificada en todos los móviles. Las validaciones realizadas son las enumeradas arriba.
