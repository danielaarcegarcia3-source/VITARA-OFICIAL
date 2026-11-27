# Consigna Code Battle 2026 · matriz de cumplimiento VITARA

Fuente contrastada: PDF aportado por el usuario, “Consigna Oficial Code Battle – Concurso final 2026”, Club Tech-Masters, Prof. Saúl Pajares. Entrega 27/11 y exposición 28/11/2026. Esta matriz no inventa validaciones ni reemplaza la evaluación del docente.

**Estado:** código subido a la rama de sesión y [PR #1](https://github.com/danielaarcegarcia3-source/VITARA-OFICIAL/pull/1) abierto; comprobaciones locales aprobadas. No se declara cumplimiento total: faltan enlace público completo validado, ensayo en siete dispositivos físicos, identificación autorizada de integrantes y confirmación de permisos de algunos medios. No se ha contratado ningún servicio ni activado facturación.

## Requisitos y evidencias

| Consigna | Implementación / evidencia | Estado real |
|---|---|---|
| 1–4: problema y ODS | Acceso a recursos y orientación de salud en La Libertad. ODS principal 3; 9 y 10 complementarios. Buscador, solicitud de verificación, seguimiento y administración. | Implementado; no es atención clínica ni conexión certificada con IPRESS. |
| 5.1: identidad, navegación, responsive, formularios | Logo, bienvenida, módulos originales, formularios procesados por Node, estados de éxito/error, mapas y modelos locales. Pruebas Chromium escritorio y móvil. | Implementado. Accesibilidad y equipos físicos requieren validación adicional. |
| 5.1 y 18.44: cuatro integrantes | Se conservan cuatro roles; no se inventaron nombres. | **Pendiente:** completar nombres autorizados de los cuatro integrantes en Comunidad y README. |
| 5.1: función principal y dos complementarias | Principal: crear y seguir solicitudes con respuesta administrativa persistida. Complementarias: búsqueda/filtrado de recursos, orientación local/canales, exploración de mapas/modelos y comparación de dispositivos. | Implementado y probado; sin stock en vivo ni atención prometida. |
| 5.2: panel privado y actividad no sensible | Listado de solicitudes, estado/respuesta, KPIs, perfiles de prueba consentidos y eventos. Tokens y permisos en servidor. Utilizar alias de equipo, UUID y correos example.test. | Implementado; el rol público elegido no da permisos administrativos. |
| 6: flujo conectado | Acción → API → validación → JSON privado → notificación SSE sin texto privado → consulta administrativa autenticada. | Probado en backend y navegador, sin recarga. |
| 7: multiusuario | Siete clientes SSE simultáneos; siete perfiles y siete solicitudes enviados concurrentemente al servidor real en proceso aislado. Sin pérdida de eventos simultáneos de un perfil. | **Prueba automatizada**, no siete dispositivos físicos. Ensayo oficial pendiente. |
| 8: persistencia y separación | data/solicitudes.json y data/participacion.json por defecto. Directorio privado configurable, modos 0600, JSON atómico, un proceso escritor. Datos nuevos vacíos. | Reinicio y conservación probados en proceso aislado. No reutilizar la base histórica como datos reales. |
| 8: backup/recuperación | Exportación/importación de solicitudes con permiso administrativo. Para perfil/admin, copia privada del directorio con servidor detenido. | Backup/restore de solicitudes probado; procedimiento integral en este documento, ensayo del equipo pendiente. |
| 9: actualizaciones | SSE para solicitudes; consulta automática cada 15 s para participación. Errores de conexión visibles. | Implementado y probado; contadores de conexiones no equivalen a personas. |
| 10.1 y 18.31: enlace público gratuito | Requiere Node accesible mediante HTTPS, no solo una página estática. La preview de Arena no se declara alojamiento definitivo. | **Pendiente de despliegue y comprobación exterior.** Subir a GitHub no genera por sí solo el enlace de la app. |
| 10.2, 12, 14.27: LAN | Servidor en 0.0.0.0, rutas API del mismo origen, IP local impresa en consola. | Implementado; firewall del anfitrión y comunicación entre siete equipos deben probarse en la red real. |
| 10.3, 14.28: continuidad sin WAN | HTML, JS, Three/Draco, datos de referencia, modelos y medios locales. Node/JSON siguen en el equipo anfitrión. El chat local no necesita proveedor. | Recursos locales comprobados; desconexión WAN con la LAN del concurso pendiente de ensayo físico. Enlaces oficiales e IA externa no funcionan sin Internet. |
| 11: cero pagos | Node y JSON locales sin licencias pagadas; ninguna cuenta, tarjeta ni servicio de pago activado en esta sesión. | Código local viable sin pago; verificar condiciones del medio de acceso público antes de elegirlo. No usar planes con tarjeta obligatoria. |
| 13: seguridad | Permisos reales, secretos fuera de Git, scrypt, validación, CSP, escape HTML, filtros HTTP, límites, datos fuera del público, DELETE reparado. | Pruebas en SEGURIDAD.md. No es garantía de ausencia de vulnerabilidades ni permiso para recopilar datos clínicos. |
| 14: V&V | tests/ + scripts/test-services.mjs + scripts/test-security.mjs + scripts/check-assets.mjs; CI de lectura sin secretos. | Matriz actual en V_AND_V_MATRIZ.md. Validación con usuarios y enlace público pendiente. |
| 15–16: IA y responsabilidades | Generaciones declaradas, límites del chat visibles. Cuatro roles conservados. | Equipo debe explicar arquitectura, datos, permisos y pruebas; participación oral de los cuatro no verificable desde código. |
| 18: fuente y documentación | package.json y lock, README, CONFIGURACION, SEGURIDAD, PUBLICAR, AUDITORIA, inventario y créditos. | Código en rama de sesión; revisar PR antes de fusionar. |
| 19: exposición de 15 min | Guion inferior. | Ensayo del equipo pendiente. |

## Datos de prueba permitidos

Las pruebas automatizadas usan `Equipo prueba 1` a `Equipo prueba 7`, correos `example.test` y recursos de demostración. Se guardan en carpetas temporales y se borran al terminar. **No aparecen como personas reales en el portal.** Una instalación nueva comienza sin solicitudes ni participantes; el administrador se crea explícitamente. No usar nombres de estudiantes, DNI, diagnósticos o historiales durante la evaluación.

## Recuperación básica

### Solicitudes, desde el panel autenticado

1. Exportar el respaldo JSON a un lugar privado fuera del repositorio; no subirlo a GitHub.
2. Ante interrupción, reabrir el servidor con las mismas variables y directorio. Si el disco está íntegro, los registros permanecen.
3. Para recuperar un respaldo, entrar de nuevo al panel y usar Restaurar Respaldo JSON. **Reemplaza las solicitudes actuales**; exportar antes una copia de lo que exista. Solo se aceptan registros válidos y sin datos identificables; no combinar manualmente IDs duplicados.
4. Confirmar en el panel cantidad, código de prueba y respuesta. El backup de solicitudes no contiene perfiles ni credenciales.

### Directorio completo: perfil y administrador

1. Detener Node con Ctrl+C. Mantener un solo escritor.
2. Copiar íntegramente el directorio indicado en `VITARA_DATA_DIR` (o `data/`) a una ubicación privada fuera de la carpeta pública y Git. Protegerla con permisos del sistema y, cuando corresponda, cifrado de disco. No copiar logs públicos ni compartir el archivo de participación por correo.
3. Para restaurar, detener Node, conservar una copia privada del directorio actual y reponer la copia íntegra. Mantener las variables privadas del operador por separado.
4. Reiniciar. Las sesiones administrativas anteriores expiran; iniciar sesión de nuevo. Verificar un registro y su estado. El borrado de datos debe aplicarse también a respaldos según la política de retención del operador.
5. Si el JSON está corrupto, el servidor falla sin sustituirlo por un arreglo vacío: recuperar un respaldo, no borrar el archivo a ciegas.

No hay sincronización automática entre dos instalaciones distintas (LAN y alojamiento). Si un túnel apunta al mismo Node local, ambas entradas comparten los mismos archivos. No prometer sincronización de discos distintos.

## Ensayo físico obligatorio antes de declarar cumplimiento

- [ ] Cuatro integrantes identificados con autorización y responsabilidades conocidas.
- [ ] Confirmación de derechos sobre logo, globo, imágenes y videos aportados; atribuciones y restricción NC revisadas.
- [ ] URL pública HTTPS abre desde un teléfono con datos móviles y permite la acción principal, con panel protegido.
- [ ] Siete dispositivos visitantes conectados simultáneamente a la red acordada; registrar alias ficticios y solicitudes distintas. Anotar fecha, navegador y resultado, sin publicar IPs privadas ni tokens.
- [ ] El panel recibe actualizaciones sin F5; los visitantes no consultan listados ni exportan datos.
- [ ] Desconectar WAN manteniendo Wi-Fi: seguir creando/consultando solicitudes locales y revisarlas en el panel.
- [ ] Reiniciar el proceso sin perder registros; comprobar exportación y recuperación en copia de prueba.
- [ ] Revisar ausencia de datos personales, cerrar sesiones y borrar los registros de ensayo al terminar.
- [ ] Ningún servicio requiere tarjeta, prueba de pago, dominio o activación de facturación.

## Guion de 15 minutos

- 2 min: problema, beneficiarios y ODS 3.
- 2 min: frontend, API Node y almacenamiento privado; mostrar que el panel es separado.
- 7 min: siete equipos envían acciones reales, seguimiento con código, respuesta del administrador y actualización sin F5. Mostrar navegación/buscador como complemento.
- 2 min: permisos, privacidad, persistencia y demostración local sin WAN.
- 2 min: resultados comprobados, limitaciones, recuperación e impacto esperado (no cifras inventadas).
