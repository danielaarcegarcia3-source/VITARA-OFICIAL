# Publicar VITARA: qué está listo y qué falta

## Estado comprobado en esta sesión

La entrega se prepara en la rama **`arena/ccf66afb-vitara-oficial`**, mediante commit y push explícitos a GitHub. El envío y el pull request se verifican al finalizar la operación; guardar archivos en Arena por sí solo no los sube. No se cambia ni fusiona `main` sin aprobación. `main` había avanzado con los tres medios que ya se integraron en esta rama sin sobrescribir el proyecto.

**Repositorio de código no significa URL de la aplicación.** No se ha activado un alojamiento permanente ni contratado un servicio. La preview es temporal. La consulta de Pages no devolvió un sitio disponible y la integración no permitió consultar la política administrativa de Actions (HTTP 403); no se cambiaron ajustes de facturación ni permisos del repositorio.

## 1. Verificar la entrega en GitHub

- Repositorio: https://github.com/danielaarcegarcia3-source/VITARA-OFICIAL
- Rama: https://github.com/danielaarcegarcia3-source/VITARA-OFICIAL/tree/arena/ccf66afb-vitara-oficial
- Revisar el pull request desde esta rama hacia `main`; no confundir abrirlo con haberlo fusionado.
- La carpeta `data/`, claves y respaldos no se incluyen. El archivo histórico `solicitudes.json` se conserva localmente pero se retira del índice: no se redistribuyen sus códigos ni se presentan sus registros precargados como acciones nuevas.
- Una instalación nueva comienza con almacenamiento privado vacío. No se publica una clave inicial ni una cuenta de administrador.

Los GLB y videos originales son grandes, aunque cada archivo recuperado está por debajo de 100 MB. No añadir el build, dependencias ni artefactos de pruebas al repositorio. Las imágenes nuevas indican si son IA; la referencia del globo fue aportada por el usuario y debe contar con permiso de publicación.

## 2. Elegir qué versión se publica

### Solo la experiencia visual (sitio estático)

```sh
npm ci
npm run build
```

Publicar **el contenido de `dist/frontend`**, cuyo `index.html` está en la raíz. Se puede usar alojamiento estático o GitHub Pages con un proceso de despliegue del build. La configuración de Firebase Hosting apunta a esa carpeta, pero `firebase deploy` sigue requiriendo configurar y autorizar un proyecto del propietario.

**No publicar la raíz del repositorio como si fuera la distribución:** contiene archivos del servidor, documentación técnica y la base histórica de solicitudes.

En esta modalidad funcionan navegación, mapas, ilustraciones, filtros, comparaciones y modelos locales. No hay un servidor Node que atienda las API de registro, administración o chat. El frontend muestra esa limitación, no simula datos o acceso. Si quieres todas las funciones, usa la modalidad siguiente. No basta con habilitar GitHub Pages o Firebase Hosting estático.

### Plataforma completa (Node con volumen persistente)

Elegir un alojamiento que permita un proceso Node, HTTPS y almacenamiento persistente. No se ha contratado ni configurado un proveedor desde esta sesión; sus condiciones y costos deben verificarse por separado.

- Runtime recomendado: **Node 22 LTS** (el código usa `fetch` nativo y `AbortSignal.timeout`).
- Instalación y preparación: `npm ci && npm run build`.
- Inicio: `npm start` desde la raíz del proyecto.
- Puerto: el servidor acepta `PORT` del alojamiento y escucha en `0.0.0.0`.
- Comprobación de salud: `GET /api/salud`.
- HTTPS: configurarlo en el alojamiento o proxy. No enviar correos, contraseñas ni tokens sobre HTTP público.
- Variables privadas en el gestor de secretos del alojamiento, **no en Git**:
  - `VITARA_DATA_DIR`: ruta absoluta del volumen privado persistente. Perfiles, hash del administrador y solicitudes nuevas se guardarán allí.
  - `VITARA_REQUESTS_FILE`: opcional, ruta privada alternativa para solicitudes. Por defecto se guardan en `VITARA_DATA_DIR/solicitudes.json`, o en `data/solicitudes.json` si no se define el directorio. La base histórica de la raíz no se carga automáticamente.
  - `ADMIN_USUARIO` y `ADMIN_CLAVE`: credenciales únicas del operador, o `VITARA_SETUP_KEY` para configurar el primer administrador desde la interfaz. No usar la clave de configuración de la vista previa en producción.
  - `DISABLE_ADMIN_SETUP=1`: opción para cerrar explícitamente el alta inicial.
- Un volumen nuevo empieza sin solicitudes de ejemplo. Si necesitas conservar solicitudes existentes, exporta y revisa una copia privada e impórtala explícitamente; no se migra automáticamente el archivo histórico.
- Guardar copias de seguridad privadas y probar recuperación. El almacenamiento JSON está pensado para **un único proceso/escritor**; no escalar varias instancias sobre el mismo archivo. Para producción de mayor escala, migrar a una base transaccional.
- Un alojamiento con disco efímero puede borrar registros al reiniciar. Comprobar el volumen antes de aceptar participantes.
- El sitio usa rutas relativas para las API; servir frontend y backend en el mismo origen o configurar un proxy seguro. No cambiar el navegador para llamar a `localhost` de otro servidor.

La IA general requiere además `VITARA_AI_ENDPOINT`, `VITARA_AI_MODEL` y `VITARA_AI_KEY`, acceso saliente al proveedor y revisión de sus políticas. Sigue sin haber un proveedor externo configurado o validado en esta sesión.

## 3. Revisión obligatoria antes de una publicación real

- **Licencia Charité:** el modelo de ChrisRE es CC BY-NC 4.0. No habilitar usos comerciales sin autorización; mantener autoría y licencia. Revisar los permisos de todos los medios, incluida la imagen de referencia del globo aportada por el usuario.
- **Datos sanitarios:** las cifras históricas se conservaron, no se validaron otra vez contra documentos oficiales. No anunciarlas como stock en vivo o garantía de atención.
- **Privacidad:** perfil y actividad se guardan solo con consentimiento, hasta siete registros, con eliminación y retención documentadas. El correo no se verifica y no certifica identidad. No usar la demo para datos clínicos reales.
- **Seguridad:** no afirmar que esta revisión es una auditoría de producción. Se retiraron los SDK de Firebase inactivos y `npm audit` completo indica 0 vulnerabilidades conocidas al revisar; repetirlo antes de desplegar. Ver `SEGURIDAD.md`. No se aplicaron actualizaciones forzadas.
- **Operación:** comprobar autenticación administrativa, cierre de sesión, borrado, retención, backup, HTTPS, límites de peticiones y persistencia tras reinicio en el alojamiento final.
- **Interfaz:** validar en navegadores y dispositivos físicos reales. Las pruebas actuales son Chromium headless y viewports móviles, no certificación WCAG ni pruebas clínicas.

## 4. Verificar antes de subir o desplegar

```sh
npm run test:services
npm run test:assets
npm test
npm run build
git diff --check
```

Para el Chromium disponible en esta sesión:

```sh
CHROMIUM_PATH=/tmp/chromium LD_LIBRARY_PATH=/tmp/chromium-libs/lib npm test
```

Ver `CONFIGURACION-VITARA.md` para el acceso administrativo y `AUDITORIA-VITARA.md` para los resultados y límites de cada revisión.

## 5. Opción técnica para el concurso: enlace temporal hacia el Node local

Para conservar todas las funciones sin contratar hosting, una alternativa a validar es un túnel HTTPS hacia la computadora del equipo. Por ejemplo, el programa abierto `cloudflared` ofrece un modo de túnel rápido; **no se ha descargado, abierto ni validado ese servicio desde esta sesión**, ni se garantizan sus condiciones, duración o disponibilidad. Confirmar en el proveedor que no exige cuenta de pago, tarjeta, dominio ni plan facturable antes de usarlo. Si exige cualquiera de ellos, no continuar para esta consigna.

1. Instalar Node 22, clonar la rama revisada e instalar con `npm ci` mientras hay Internet.
2. Preparar un directorio privado, configurar el administrador en el entorno del equipo y arrancar `npm start`. No reutilizar claves de la preview.
3. Con una herramienta de túnel aprobada por el docente y descargada desde su origen oficial, el comando de referencia es:

```sh
cloudflared tunnel --url http://localhost:3000
```

4. La herramienta imprimirá su propia URL HTTPS: **no hay una URL predecible que se pueda inventar**. Probarla desde un teléfono con datos móviles: formulario, seguimiento y administración con permisos. Confirmar que el proxy conserva el host público para las comprobaciones de origen; no resolver errores desactivando validación o haciendo CORS abierto.
5. Mantener ambos procesos y la computadora encendidos. Si cae Internet o el túnel, usar `http://IP_LOCAL:3000` en el Wi-Fi del concurso. Esa dirección no sirve a personas fuera de la red.
6. Un túnel temporal no es un alojamiento permanente; cerrar al terminar y no usarlo con datos personales reales. El archivo de datos permanece en la computadora, no en GitHub.

El acceso al servicio de túneles está fuera de los hosts salientes permitidos en este entorno, por lo que el equipo debe validar esa opción desde su propia computadora. Para un link permanente se debe elegir un alojamiento gratuito compatible con Node y persistencia, comprobar sus límites actuales y no activar facturación. **No usar Pages estático como sustituto del backend para afirmar cumplimiento completo.**
