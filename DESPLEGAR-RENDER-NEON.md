# VITARA pública · Render + Neon, conservando el modo local

Actualizado el 27/11/2026. **El código está adaptado y probado con PostgreSQL local; esto no significa que el despliegue público ya exista.** El propietario creó Neon VITARA (Free). La conexión privada y el servicio Render todavía deben configurarse y verificarse en sus paneles.

## Qué hace cada parte

- **GitHub:** guarda el código, no ejecuta el backend ni guarda los perfiles.
- **Render Web Service:** ejecuta Node y sirve portal, administración y API bajo un mismo origen HTTPS.
- **Neon PostgreSQL:** conserva solicitudes, perfiles consentidos y, si se usa el alta inicial, el hash del administrador, fuera del disco efímero de Render.
- **Tu computadora Windows 11:** puede permanecer apagada durante el uso del enlace público. Conserva una instalación local independiente para la demostración sin Internet.

**Gratis no significa disponibilidad continua garantizada.** Según las páginas oficiales consultadas, Render Free suspende la instancia tras 15 minutos sin tráfico y despertar puede demorar aproximadamente un minuto; tiene cuotas de uso. Neon Free también tiene límites y suspensión de cómputo en reposo. Verifica las condiciones que muestre tu cuenta antes de aceptar. No elegir planes de pago, pruebas con tarjeta ni discos facturables; si el panel exige una tarjeta, detenerse y revisar. No usar herramientas de ping para evitar la suspensión.

Fuentes de condiciones: https://render.com/docs/free y https://neon.com/pricing. Estas condiciones pueden cambiar; no se promete alojamiento gratuito perpetuo ni disponibilidad 24/7.

## 1. Neon: copiar la conexión solamente cuando Render la solicite

1. En el proyecto **VITARA**, abrir **Connect**.
2. Usar la rama `production` y la base/rol seleccionados en el panel. Elegir la conexión PostgreSQL con pooling si está disponible; el código no requiere el SDK HTTP de Neon.
3. La cadena comienza por `postgresql://` y contiene usuario, contraseña y servidor. **Es un secreto completo**, no un enlace público.
4. Copiarla exclusivamente al campo privado `DATABASE_URL` de Render. No enviarla al chat, GitHub, README, frontend ni capturas. Si se expone, rotar la contraseña en Neon y actualizar Render.
5. No cambiar ni borrar tablas desde el editor SQL. VITARA crea su tabla `vitara_documents` en el primer inicio de una base nueva, sin cargar ejemplos ni importar archivos de la computadora.

## 2. Crear el servicio en Render

1. Entrar en https://render.com e iniciar sesión con GitHub. Autorizar solo el acceso necesario al repositorio.
2. Elegir **New → Web Service**, no Static Site ni PostgreSQL de Render.
3. Seleccionar `danielaarcegarcia3-source/VITARA-OFICIAL`.
4. Configurar:

| Campo | Valor |
| --- | --- |
| Name | Un nombre disponible, por ejemplo `vitara-oficial` |
| Language / Runtime | Node |
| Branch | `arena/ccf66afb-vitara-oficial` |
| Root Directory | Vacío (raíz del repositorio) |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Instance Type | **Free**, comprobar que el resumen no muestra un cobro |
| Health Check Path | `/api/salud`, si está disponible en Advanced |

La rama `main` no se ha fusionado: desplegarla podría ejecutar una versión anterior. No hace falta fusionar para esta prueba. El build necesita esbuild, por eso se incluye explícitamente `--include=dev`.

5. En **Environment**, antes de desplegar, añadir:

| Variable | Valor privado / propósito |
| --- | --- |
| `DATABASE_URL` | Conexión completa copiada de Neon |
| `ADMIN_USUARIO` | Usuario elegido por el propietario |
| `ADMIN_CLAVE` | Contraseña nueva, única, de 12 a 128 caracteres; guardarla en un gestor privado |
| `DISABLE_ADMIN_SETUP` | `1` |
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |

No definir `ADMIN_TOKEN`, `VITARA_SETUP_KEY`, `VITARA_PG_LOCAL_TEST`, rutas locales ni variables de IA para este despliegue. Render proporciona `PORT` y `RENDER`; el servidor escucha en `0.0.0.0`. La aplicación **no carga un `.env` automáticamente**: usar el gestor privado del proveedor.

6. Revisar Free y crear el servicio. Esperar a que figure **Live**. Copiar la URL HTTPS real que Render asigne: no se puede predecir ni garantizar el nombre.
7. Si falla, compartir solo el mensaje de error sin secretos. No desactivar TLS ni los controles de origen para conseguir que inicie. Sin `DATABASE_URL` en Render, el servidor se niega a arrancar: evita aceptar datos sobre disco efímero.

## 3. Verificar antes de invitar participantes

Usar datos de prueba claramente identificados, con consentimiento; no historias clínicas ni datos sensibles.

1. Abrir `https://URL-REAL/api/salud`: debe indicar `estado: operativo`, `modo: publico_postgres` y `almacenamiento: postgres`.
2. Abrir el portal y `/admin.html` en el mismo dominio HTTPS. Entrar con el usuario y contraseña definidos en Render. No hay cuenta demo.
3. Desde otro navegador/dispositivo, registrar un perfil de prueba con consentimiento, visitar Mapas y enviar una solicitud de prueba sin datos personales. Guardar el código de seguimiento.
4. En administración, comprobar el perfil, su actividad y la solicitud; responderla y comprobar el seguimiento desde el otro navegador.
5. Exportar el respaldo de solicitudes desde el panel y guardarlo de forma privada.
6. Reiniciar el servicio desde Render. Entrar de nuevo como administrador (el reinicio invalida sesiones de 8 horas). Deben seguir los perfiles, actividad, solicitudes y respuesta. El token del perfil del mismo navegador sigue válido durante su vigencia.
7. Cerrar sesión y verificar que las listas privadas ya no sean accesibles. Probar eliminación de perfiles y actualización del panel.
8. Con la computadora anfitriona apagada, abrir el enlace público desde un teléfono con datos móviles: así se comprueba que no depende de la laptop. Esperar el arranque si el plan gratuito está suspendido.
9. Completar el ensayo con **al menos 7 dispositivos físicos** y registrar evidencias con datos privados ocultos. Las pruebas automáticas no sustituyen ese requisito.

No marcar despliegue, recuperación, firewall del equipo ni siete dispositivos como comprobados hasta realizarlos. Las pruebas en esta sesión son locales y automatizadas, no una conexión a la cuenta Neon del propietario.

## 4. Respaldo, recuperación y límites

- El botón de respaldo existente exporta **solo solicitudes**, no perfiles, tokens ni administrador. Restaurar solicitudes reemplaza la colección de solicitudes: revisar el archivo y exportar antes de hacerlo. Exige sesión administrativa.
- Para recuperar **toda** la base, el operador debe preparar y verificar un respaldo PostgreSQL privado, por ejemplo con herramientas oficiales `pg_dump`/`pg_restore` compatibles con la versión de Neon, siguiendo sus instrucciones de conexión. Usar secretos locales protegidos, nunca comandos con contraseñas publicados. Cifrar y restringir acceso: incluye correos y hashes de acceso. No depender de una ventana de recuperación gratuita sin comprobar su alcance en Neon.
- Antes del concurso, probar la restauración en una base separada de prueba; no sobrescribir `production` como ensayo. Volver a comprobar login, perfil, solicitudes y respuesta después de restaurar.
- Retención: perfiles 30 días; solicitudes 30 días por defecto. La purga del modo nube corre al iniciar y periódicamente mientras Node esté activo. No es una tarea externa que se ejecute si el servicio está detenido.
- Diseño para una instancia pequeña: dos documentos JSONB, escrituras serializadas y revisión SQL que rechaza conflictos (HTTP 409) en vez de sobrescribir otra instancia. Reintentar un conflicto. No es un servicio de alta disponibilidad ni un diseño clínico de gran escala.
- Sesiones administrativas, cuotas de solicitudes y SSE son locales al proceso; no compartir sesiones ni suponer eventos entre múltiples instancias. Tras un reinicio hay que volver a entrar. Mantener una sola instancia Free.
- Una caída de PostgreSQL produce error real, **no cambia silenciosamente a JSON ni confirma cambios no guardados**. Ante un envío incierto, reintentar usando la clave de idempotencia conservada por el formulario; comprobar seguimiento antes de duplicar.
- El chat guiado local sigue disponible en el servidor sin contratar IA. Esto no habilita un modelo externo ni garantiza respuestas abiertas.
- Mantener las licencias originales y la atribución Charité CC BY-NC 4.0; descargar un modelo gratis no elimina su restricción no comercial.

## 5. Alternativa local para tu única laptop Windows 11

Prepararla antes de perder Internet: descargar el código de **esta rama**, instalar dependencias con `npm ci`, ejecutar el build y probarlo. Tu Node 26 supera el mínimo del proyecto; la verificación automatizada usa Node 22.

1. Abrir PowerShell en la carpeta que contiene `server.mjs` e `index.html`.
2. En esa terminal, quitar la conexión de nube si la hubieras configurado: `Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue`. No configurar `RENDER=true` en el equipo local.
3. Configurar `ADMIN_USUARIO` y `ADMIN_CLAVE` de forma privada según `CONFIGURACION-VITARA.md` (pueden ser distintos de la nube). No escribirlos en un archivo público.
4. Ejecutar `npm start`, abrir `http://localhost:3000` y verificar que `/api/salud` indique `json-local`.
5. Seguir `RED-SEGURA-CONCURSO.md` para firewall y acceso por Wi-Fi privado. No se ha modificado el firewall del Windows del propietario desde Arena.
6. Los datos locales permanecen en `data/` de esa computadora. No borrar esa carpeta; respaldarla privadamente y nunca subirla a GitHub.

**Local y nube son bases separadas.** No sincronizan automáticamente perfiles, solicitudes, contraseñas ni cambios. El respaldo de solicitudes puede trasladarse explícitamente tras revisarlo; no hay migración automática de perfiles. La URL pública no funciona sin Internet: la contingencia es abrir el servidor local por la red Wi-Fi del concurso, con la laptop encendida.

## 6. Reproducir pruebas de PostgreSQL sin usar datos reales

`npm run test:postgres` exige `VITARA_TEST_DATABASE_URL` hacia una instancia PostgreSQL local de pruebas; rechaza servidores remotos. El rol debe poder crear bases desechables. El script crea una base de nombre aleatorio `vitara_test_*` y la elimina al terminar. Nunca dirigirlo a Neon ni a un servidor con datos reales. GitHub Actions dispone de su propio PostgreSQL desechable.

Las comprobaciones incluyen persistencia tras reinicio de Node, siete clientes concurrentes, actividad, respuestas, exportación/restauración de solicitudes, eliminación, conflictos SQL, errores sin fallback, privacidad y obligación de TLS fuera del ensayo local. El ensayo local no acredita la conexión TLS de una cuenta Neon real: eso se verifica al desplegar.
