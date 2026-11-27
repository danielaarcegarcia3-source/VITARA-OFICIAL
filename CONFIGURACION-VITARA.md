# VITARA · Conexión y participación

## Publicación independiente de la laptop

Guía vigente: [DESPLEGAR-RENDER-NEON.md](DESPLEGAR-RENDER-NEON.md). Con `DATABASE_URL` privada, el backend utiliza PostgreSQL con TLS verificado, conserva los datos fuera de Render y no escribe participación ni solicitudes en el disco efímero. Si la conexión falla, no sustituye los datos por JSON. Sin esta variable se mantiene el modo local descrito abajo; Render exige PostgreSQL para arrancar. Nube y local son almacenamientos independientes, no sincronizados. La cuenta Neon está creada; la conexión y el despliegue públicos todavía requieren configuración y comprobación por el propietario.

## Ejecutar

Desde la raíz que contiene `index.html`:

```sh
npm install
npm start
```

Portal en el puerto 3000 y administración en `/admin.html`. Se escucha en `0.0.0.0`, compatible con la vista previa de Arena y red local. No publiques el puerto directamente en Internet sin HTTPS y controles de despliegue.

El HTML y los activos pueden servirse por Live Server o desde `dist/frontend` (`npm run build`). **El registro persistente, administración y chat requieren Node**; en una publicación solo estática se explicará la indisponibilidad, no se simulan resultados.

## Administración privada (sin claves demo)

Opción recomendada: definir variables de entorno antes de arrancar. El programa no carga `.env` automáticamente. En un terminal POSIX:

```sh
export ADMIN_USUARIO='elige-tu-usuario'
read -r -s -p 'Contraseña privada y larga: ' ADMIN_CLAVE; echo
export ADMIN_CLAVE
npm start
```

Usa una contraseña única de al menos 12 caracteres. Introduce esos valores en `/admin.html`. No los incluyas en Git ni en el frontend. En PowerShell configura las mismas variables con `$env:ADMIN_USUARIO` y `$env:ADMIN_CLAVE` o usa la configuración de secretos de tu alojamiento.

Alternativamente, establece **VITARA_SETUP_KEY** como un secreto largo y aleatorio, reinicia y abre `/admin.html`. Se habilitará el formulario de primer administrador: exige esa clave y una contraseña de al menos 12 caracteres. El hash con sal scrypt se guarda en `data/participacion.json`. Una vez creado, ese formulario se cierra. `DISABLE_ADMIN_SETUP=1` deshabilita esta ruta. Sin credenciales de entorno ni clave de configuración, **no se abre un acceso por defecto**.

Los inicios de sesión entregan tokens aleatorios de 8 horas; se invalidan al cerrar sesión o reiniciar. `ADMIN_TOKEN`, si el operador lo define explícitamente, permite compatibilidad con herramientas de administración de solicitudes y es un secreto sin caducidad: no se recomienda para uso diario. Se retiró el acceso local de demostración y las confirmaciones de respuestas que no habían sido guardadas en el servidor.

### Probar el panel en esta vista previa

Se añadió **Abrir administración** al menú lateral del portal y una guía dentro de Fuentes y del propio panel. El alta inicial está habilitada en el servidor de esta vista previa con una clave aleatoria privada, entregada al propietario en `data/ACCESO-PRIVADO-ADMIN.txt`. No hay credenciales de cuenta precreadas ni un acceso sin autenticación. Ese archivo y `data/clave-inicial-admin.txt` no se sirven por HTTP, no se copian al build y están excluidos de Git. No compartirlos.

1. Abre Administración desde el portal. En la sección desplegada «Configurar el primer administrador», pega la clave del archivo privado.
2. Elige tu propio usuario y una contraseña única de al menos 12 caracteres. Crea el administrador y luego inicia sesión con esas credenciales, no con la clave inicial.
3. En otra pestaña abre el portal, completa un perfil de prueba con un correo `example.test` y consentimiento. Visita dispositivos, mapas o canales. Vuelve al panel y pulsa Actualizar para ver el perfil y sus eventos reales. Puedes borrarlo al terminar.

Una vez creado el administrador, el alta se cierra y la contraseña queda protegida con scrypt en el almacenamiento privado. El servidor normal `npm start` puede usar ese administrador persistido sin la clave de alta. Si reinicias antes de crear el administrador, la variable privada debe volver a estar definida. En el sandbox se arrancó con `VITARA_SETUP_KEY="$(cat data/clave-inicial-admin.txt)" npm run dev`; no se imprimió el valor en el código ni se incluyó en un enlace público.

## Datos y capacidad

- Hasta **7 perfiles simultáneamente almacenados**, sin registros de ejemplo. El octavo registro recibe un mensaje de capacidad; puede continuar sin sincronizar. Administración puede eliminar perfiles para liberar plazas.
- Formulario: nombre, correo para la sincronización, rol y territorio opcional. No se solicitan DNI, edad, teléfono, diagnósticos ni historia clínica.
- Consentimiento explícito, desmarcado inicialmente. Sin él se permite explorar sin enviar el perfil. No se realiza verificación de correo; no representa una identidad institucional validada.
- Perfil y actividad en `data/participacion.json`, escritura atómica, permisos de archivo 0600. La carpeta está excluida de Git y bloqueada por HTTP. `VITARA_DATA_DIR` permite situarla en un volumen privado persistente. No usar múltiples procesos sobre el mismo archivo: para una producción escalable se requiere una base de datos transaccional.
- Solo administración autenticada recibe la lista de nombres y correos. Cada dispositivo conserva una clave aleatoria para consultar y eliminar su propio perfil. No es recuperación de cuenta por correo: si se pierde esa clave, administración debe liberar el registro. Proteger el dispositivo; no compartir ni exportar la clave.
- El panel recibe avisos SSE sin datos personales y consulta los registros con autorización, con respaldo cada 15 segundos: módulos visitados, modelos abiertos, mapa, tema y uso del chat (solo modo local/IA). No guarda texto de búsquedas ni mensajes del chat. Máximo 200 interacciones por perfil. Una señal cada minuto permite indicar presencia reciente; no equivale a personas únicas ni a concurrencia certificada.
- Purga de perfiles sin actividad durante 30 días, al arrancar y cada hora; además se comprueba al listar/registrar. Sesiones y límites de peticiones viven solo en memoria.
- `Participación` permite revisar el perfil y eliminarlo del servidor y del dispositivo. Cerrar sesión NO elimina el registro remoto. El borrado local de Privacidad NO borra el servidor y advierte sobre la pérdida de clave.
- Los backups actuales de solicitudes no incluyen perfiles ni contraseñas. Respaldar el volumen privado por separado con control de acceso y cifrado si hace falta. El archivo de datos no está cifrado en reposo por la aplicación: usar cifrado de disco y permisos del alojamiento.
- La vista previa no debe usarse para datos personales reales antes de configurar administración y revisar la política de privacidad y despliegue.

## Orientador y preguntas abiertas

El chat integrado funciona como **guía local de alcance limitado** sin proveedor de pago: navegación, mapas, perfiles, privacidad, solicitudes y orientación general. Ante una pregunta desconocida dice que no tiene información; no aparenta una IA general.

La ruta real de IA admite un proveedor compatible con Chat Completions. Configura únicamente en el servidor y reinicia:

- `VITARA_AI_ENDPOINT`: URL HTTPS completa del endpoint de Chat Completions.
- `VITARA_AI_MODEL`: identificador real del modelo del proveedor.
- `VITARA_AI_KEY`: clave privada del proveedor, nunca una variable JavaScript pública.

No hay proveedor ni clave incluidos. La conectividad saliente del alojamiento debe permitir ese endpoint; en el sandbox de Arena existe una lista de hosts permitidos que puede impedir acceder a proveedores externos. La integración no se presenta como operativa hasta configurarla y probarla en un alojamiento con acceso al proveedor.

El usuario debe activar voluntariamente la opción IA en el chat: **su pregunta se transmite al proveedor externo**, sujeto a las políticas de ese proveedor. VITARA no guarda el texto del chat; se conserva únicamente en memoria de la página y se borra al cerrar sesión/recargar. El adaptador no envía nombre, correo, perfil ni historial a la IA. Se rechazan correos y secuencias de 8 o más dígitos en consultas externas, pero eso no detecta todos los datos sensibles: no incluir información identificable ni clínica. Los fallos, ausencia de configuración y tiempo de espera muestran errores reales; nunca respuestas simuladas.

La IA puede equivocarse y no responderá literalmente a todo. Las instrucciones excluyen diagnósticos definitivos, dosis personalizadas, promesas de atención, stock y citas en vivo. En emergencia se orienta a atención urgente y SAMU 106 según cobertura; MINSA 113 para orientación. Esta integración no es un sistema clínico certificado ni sustituye profesionales.

## Mapas y bienvenida

Los mapas extruyen polígonos geográficos, no siluetas manuales: 25 unidades departamentales (incluido Callao) y 12 provincias de La Libertad. Rotación, zoom, selección por ratón y listado con teclado; alternativa 2D con los mismos polígonos ante falta de WebGL. Colores categóricos, no stock ni relieve real. Se mantienen las tablas y atlas de imágenes originales. Provincia no equivale necesariamente a red sanitaria.

Fuente y licencia en `assets/geo/README.md` y `LICENSE-MPL-2.0.txt`. Son límites simplificados de referencia, no cartografía legal actualizada.

La bienvenida muestrea los colores del **logo oficial existente** en más de 3.000 puntos, que convergen con trazas electrónicas sobre un HUD. No cambia el logo por una figura generada. Se puede saltar o repetir; respeta movimiento reducido y pausa al ocultar la bienvenida. La base blanca es predeterminada, con botón para alternar a la paleta editorial.

## Verificación

```sh
node scripts/test-services.mjs
npm run test:assets
npm test
npm run build
```

En el sandbox, si Chromium no se instala por la red:

```sh
CHROMIUM_PATH=/tmp/chromium LD_LIBRARY_PATH=/tmp/chromium-libs/lib npm test
```

Las pruebas de servicios crean y eliminan siete registros reales **en un directorio temporal aislado**, comprueban persistencia tras recarga del servicio, autorización, capacidad, validación, consentimiento, borrado, CSRF, chat local y cierre de sesión. Las pruebas UI de participación usan otro servidor y almacenamiento temporal: **no siembran usuarios falsos en el panel del portal**. Las pruebas 3D son intensivas en memoria; ejecutarlas con un solo worker, sin otras instancias de Chromium de pruebas simultáneas.

## Estudio de dispositivos y nuevas experiencias

- Vista `tecnologia`: cuatro ilustraciones IA genéricas, filtro/búsqueda, fichas modales con puntos temáticos y comparación educativa de hasta tres tipos de dispositivos. Lista de seis preguntas de adquisición y descarga de texto, sin envío a fabricantes ni cotizaciones.
- Referencias separadas a Philips, Siemens Healthineers, Dräger y B. Braun. No son distribuidores certificados por VITARA ni hay alianzas. Fuentes, alcance y limitaciones en `assets/devices/README.md`.
- Canales: selector de intención sin triaje, emergencia directa, siete opciones explicadas del 113, checklist personal y tarjeta VCF con teléfonos oficiales. No se contacta a un servicio hasta que la persona actúa en su dispositivo.
- Fuentes: taller de origen/contexto/límites con cuatro temas, ejercicio de lectura crítica de tres ejemplos, buscador de fuentes y guía de administración.
- Bienvenida: seis símbolos vectoriales de salud conectados al logo de partículas, con respeto de movimiento reducido. No se modifican los GLB originales.

## Globo, cierres y publicación

La revisión del globo se implementa en `bienvenida-holografica.js`, usando la referencia aportada por el usuario, el logo oficial y seis iconos ensamblados con partículas. Hospital, quirófano y Charité ofrecen ahora seis capítulos cada uno. Los cierres del inspector, navegación móvil y paleta tienen acciones verificadas.

Para distinguir la copia de Arena de GitHub y escoger entre una publicación estática o Node con persistencia, consulta `PUBLICAR-VITARA.md`. La entrega de código se realiza por commit/push de la rama de sesión; no se ha desplegado un sitio permanente.

## Seguridad vigente y almacenamiento de solicitudes

Consulta `SEGURIDAD.md` y `CONSIGNA-CUMPLIMIENTO.md`. La instalación nueva guarda solicitudes en `data/solicitudes.json`, no usa automáticamente la base histórica de la raíz y no precarga personas ni solicitudes ficticias. `VITARA_DATA_DIR` cambia el directorio privado de ambos almacenes; `VITARA_REQUESTS_FILE` permite otra ruta privada para solicitudes. Retención configurable de solicitudes: 1–30 días. No guardar datos dentro de assets ni publicar la raíz como distribución estática.

Los SDK de Firebase inactivos se retiraron del package.json. Firestore queda cerrado por defecto; no se usa para la persistencia vigente. El canal público de eventos no distribuye códigos privados; el panel consulta los detalles con Authorization. Los nombres del formulario de demostración deben ser alias ficticios y los correos del dominio example.test.

## Equipo y red del concurso

Daniela Arce, Dharma Valle, Zoe Cabrera y Rafael Carbajal fueron identificados por el usuario. Los roles que acompañan a los nombres son una propuesta para confirmar por el equipo. La configuración del firewall del anfitrión, límites de conexiones y ensayo físico se describen en `RED-SEGURA-CONCURSO.md`. No se ha modificado el router ni el firewall de la computadora del usuario. Charité se conserva con atribución y licencia CC BY-NC 4.0.
