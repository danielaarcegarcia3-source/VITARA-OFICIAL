# VITARA · Activos, territorios y participación

## Revisión vigente · consigna, seguridad y preparación para GitHub

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

Subida explícita de esta rama y apertura de PR autorizadas por el usuario; verificar el resultado remoto al terminar, no confundir guardado automático con push. No fusionar `main` ni activar un despliegue estático como sustituto de Node. Falta publicar y verificar un enlace gratuito completo, identificar cuatro integrantes con sus nombres autorizados, confirmar permisos de medios aportados y ensayar siete dispositivos físicos, LAN sin WAN y recuperación integral. Sin proveedor externo de IA ni datos clínicos reales. La consulta de configuración administrativa de Actions devolvió 403; no se cambiaron políticas ni facturación.

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
