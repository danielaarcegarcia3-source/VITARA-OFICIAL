# Seguridad y privacidad · revisión del 27/11/2026

## Alcance y límites

Revisión de código, pruebas automatizadas del servidor real en procesos aislados y pruebas de navegador. **No es un pentest, certificación legal, garantía contra DDoS ni aprobación para usar datos clínicos reales.** Demostración educativa con alias ficticios y correos `example.test`. No se contacta automáticamente a establecimientos sanitarios.

## Cambios aplicados antes de subir a GitHub

1. **Privacidad SSE:** el stream público `/api/eventos` ya no contiene códigos privados, recursos solicitados, alias ni respuestas. Solo comunica contadores e invalidaciones. El panel recibe el aviso y obtiene registros mediante una consulta autenticada; probado también en navegador sin recarga manual.
2. **Permisos:** listados, respuestas, importación/exportación y gestión de participantes requieren un token administrativo validado por el servidor. GET del HTML del panel solo entrega una pantalla de acceso, no los registros. Se corrigió la omisión de DELETE en el servidor principal: ahora funcionan el borrado propio y el administrativo.
3. **Origen:** se rechaza el origen ajeno en todas las rutas, no solo en participación. No se confía en `X-Forwarded-Host` enviado por el cliente. Los clientes de servidor sin Origin deben seguir cumpliendo autenticación. Ninguna contraseña viaja en la URL.
4. **Autenticación:** sin credenciales predeterminadas. Alta inicial con secreto privado, cerrada tras crear el administrador o si hay credenciales de entorno. Contraseñas configuradas por interfaz con scrypt y salt aleatorio. Tokens de sesión aleatorios, guardados con hash en memoria, 8 h de duración y revocación por logout/reinicio. Contraseña de entorno de 12–128 caracteres; `ADMIN_TOKEN` opcional de al menos 32 caracteres, sin caducidad y no recomendado para operación diaria. Las variables del entorno son secretos del operador, no archivos de datos de usuarios.
5. **Inyección:** escape HTML en el panel incluso para datos históricos importados. Validación y rechazo de HTML en solicitudes nuevas; CSP con hashes de scripts inline conocidos, sin `unsafe-inline` en scripts. Los estilos inline existentes siguen permitidos. Recursos gráficos y fuentes locales, `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`, nosniff y no-referrer.
6. **Persistencia:** solicitudes y perfiles en `data/` por defecto o volumen privado configurado. Escrituras atómicas con modo 0600; memoria de solicitudes actualizada solo después de guardar. El arranque falla ante JSON corrupto, no lo reemplaza silenciosamente. Un solo proceso escritor; no hay replicación ni cifrado en reposo de la aplicación.
7. **Archivos:** bloqueo de datos, código de servidor, dependencias, pruebas, secretos, archivos ocultos, rutas fuera de los activos públicos y symlinks hacia fuera. La distribución estática excluye el backend y datos privados. La base histórica `solicitudes.json` se conserva localmente, pero se retira del índice de Git y no se carga automáticamente ni se copia a una instalación nueva.
8. **Reintentos:** claves aleatorias por envío, reutilizadas en el reintento de la misma página. No deduplicar solo por alias/texto: ese comportamiento permitía devolver el código de otra persona que escribiera lo mismo. Códigos de seguimiento generados con `crypto.randomInt`, exclusivamente en el servidor. Se rechazan documentos de 8 o más dígitos y correos en campos de solicitudes anónimas; los filtros no detectan todos los datos sensibles.
9. **Dependencias:** retirados `firebase` y `firebase-admin`: no había imports activos de esos SDK en el sistema Node. Se conservan los módulos históricos y configuración de Hosting, pero Firestore queda denegado por defecto. `npm audit` completo pasó de 21 alertas a **0 vulnerabilidades conocidas** en el momento de la revisión. Esto no cubre todos los defectos posibles ni futuras alertas. Three.js y Draco locales conservan sus licencias.
10. **GitHub:** datos, `.env`, claves de configuración y respaldos ignorados; credencial pública histórica retirada del flujo cliente y de la herramienta de pruebas antigua. Si alguien reutilizó una contraseña publicada en el historial, debe rotarla: no se borró ni reescribió la historia remota. CI sin secretos de producción, permisos de lectura y acciones fijadas por commit.

## Firewall integrado: qué hace realmente

Es un **filtro de la aplicación HTTP**, no un firewall del sistema operativo:

- Presupuestos independientes por IP de conexión: 180 peticiones API/min y 1800 activos/min. El proxy puede hacer compartir el presupuesto a varios visitantes. No se confía ciegamente en cabeceras de IP.
- Límites específicos: 10 intentos de login/15 min, 5 de configuración/15 min, 20 registros/min, 150 eventos/min y 20 consultas al chat/min.
- JSON de perfiles/chat: 16 KiB; solicitudes/restauración: 1 MB. Máximo 5000 solicitudes, 7 perfiles, 80 conexiones SSE globales, 16 por IP de conexión y máximo 200 conexiones TCP; desconexión de clientes con búfer de escritura excesivo.
- Timeouts para cabeceras y cuerpos de peticiones. Detección de patrones comunes SQL/XSS/traversal, sin afirmar cobertura universal. El backend no ejecuta SQL.
- Indicadores de bloqueos reales; incidencias en memoria sin IP ni URL privada en el registro guardado por la aplicación. Los logs del proxy/alojamiento son responsabilidad de su operador.

**No** mitiga por sí solo saturación de red, ataques distribuidos, equipos comprometidos ni robo del navegador. Para la LAN permitir únicamente el puerto TCP acordado en el perfil de red privada del firewall del equipo anfitrión. No desactivar todo el firewall, no abrir puertos del router indiscriminadamente y no permitir acceso a archivos privados. Coordinar con el docente el aislamiento de clientes Wi-Fi. No se ha cambiado el firewall de la computadora del usuario desde Arena.

## Privacidad de la demostración

- Explorar no exige sincronización. Consentimiento desmarcado por defecto.
- Usar alias de equipo y correo de prueba. El perfil sincronizado incluye nombre/alias, correo, rol, territorio opcional y eventos de módulos. No representa una identidad verificada ni otorga privilegios por elegir “Profesional” o “Gestor”.
- Administración autenticada ve esos perfiles y su identificador aleatorio. Máximo 200 interacciones por perfil, sin texto del chat ni búsquedas. Presencia reciente no significa personas únicas.
- Retención: solicitudes hasta 30 días; perfiles 30 días desde actividad reciente. El borrado propio y administrativo está probado a través del servidor completo. Cerrar sesión o borrar solo localStorage no borra automáticamente el servidor.
- Claves de dispositivo en localStorage, tokens admin en sessionStorage: proteger el navegador compartido y cerrar sesión al terminar. El almacenamiento de servidor no está cifrado por esta aplicación.
- IA externa desconfigurada por defecto. No activarla para la entrega si exige pago, tarjeta o pruebas de pago. Si se habilita, requiere consentimiento específico, acceso HTTPS y revisión del proveedor; VITARA no garantiza detectar todos los datos personales de una pregunta.
- Mantener backups fuera del repositorio y del árbol público, con permisos y cifrado apropiados. Un perfil borrado también debe retirarse de respaldos según el procedimiento del operador.

## Pruebas reproducibles

```sh
npm ci
npm audit --audit-level=low
npm run test:services
npm run test:security
npm run test:assets
npm run build
npx playwright install chromium
npm test
```

`test:security` arranca el **servidor real** en puerto y carpeta temporales, con secretos aleatorios de prueba. Incluye 7 streams SSE abiertos simultáneamente, registros concurrentes, exclusión de datos privados, inyección, permisos, origen, DELETE, backup/restore, reinicio y límites. No ejecutarlo contra registros de usuarios reales. Las pruebas no equivalen a siete dispositivos físicos ni a WAN/LAN del concurso.

Pendientes operativos: HTTPS público, comprobación del enlace y volumen final, siete dispositivos físicos en la red del evento, permisos de medios aportados y confirmación de roles del equipo ya identificado. Ver `CONSIGNA-CUMPLIMIENTO.md` y `PUBLICAR-VITARA.md`.

### Refuerzo de actualización y sesiones

Altas, cambios de actividad y borrados de participación generan invalidaciones SSE sin datos personales. El panel vuelve a consultar con token administrativo y mantiene un respaldo de 15 s. Consultas anteriores se cancelan o descartan al cerrar sesión para impedir que un registro antiguo reaparezca en el DOM. El cierre limpia las listas del panel. Ver `RED-SEGURA-CONCURSO.md` para límites y firewall del anfitrión.
